import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { Subscription } from 'expo-modules-core';
import { supabase } from '../services/supabase';

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  timestamp: string | null;
  error?: string | null;
  permissionGranted: boolean;
};

// Throttling: Max 1 update per 30 seconds
const UPDATE_THROTTLE_MS = 30000; // 30 seconds
const DISTANCE_THRESHOLD_METERS = 50; // Update only if moved > 50m

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function useLocation(autoWatch = false) {
  const [loc, setLoc] = useState<LocationState>({
    latitude: null,
    longitude: null,
    timestamp: null,
    error: null,
    permissionGranted: false,
  });

  const watchSub = useRef<Subscription | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const lastLocation = useRef<{ lat: number; lng: number } | null>(null);
  const updatePending = useRef<boolean>(false);

  // Throttled update function
  const throttledUpdate = async (latitude: number, longitude: number) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;
    
    // Check if we need to update (distance > threshold OR time > throttle)
    let shouldUpdate = false;
    
    if (lastLocation.current) {
      const distance = calculateDistance(
        lastLocation.current.lat,
        lastLocation.current.lng,
        latitude,
        longitude
      );
      shouldUpdate = distance > DISTANCE_THRESHOLD_METERS || timeSinceLastUpdate > UPDATE_THROTTLE_MS;
    } else {
      shouldUpdate = true; // First update
    }

    if (!shouldUpdate && !updatePending.current) {
      return; // Skip update
    }

    if (timeSinceLastUpdate < UPDATE_THROTTLE_MS && !updatePending.current) {
      // Queue update for later
      updatePending.current = true;
      const waitTime = UPDATE_THROTTLE_MS - timeSinceLastUpdate;
      setTimeout(async () => {
        await updateUserLocation(latitude, longitude);
        lastUpdateTime.current = Date.now();
        lastLocation.current = { lat: latitude, lng: longitude };
        updatePending.current = false;
      }, waitTime);
      return;
    }

    // Update immediately
    await updateUserLocation(latitude, longitude);
    lastUpdateTime.current = now;
    lastLocation.current = { lat: latitude, lng: longitude };
    updatePending.current = false;
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoc(l => ({ ...l, error: 'permission-denied', permissionGranted: false }));
          return;
        }
        setLoc(l => ({ ...l, permissionGranted: true }));

        const cur = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced, // Balanced instead of Highest for better battery
        });
        const { latitude, longitude } = cur.coords;
        const ts = new Date(cur.timestamp).toISOString();

        setLoc({ latitude, longitude, timestamp: ts, error: null, permissionGranted: true });
        lastLocation.current = { lat: latitude, lng: longitude };

        // Update on server (initial update)
        await updateUserLocation(latitude, longitude);
        lastUpdateTime.current = Date.now();

        if (autoWatch) {
          watchSub.current = await Location.watchPositionAsync(
            { 
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: DISTANCE_THRESHOLD_METERS, // Update only when moved > 50m
            },
            async (position) => {
              const { latitude: lat2, longitude: lng2 } = position.coords;
              const ts2 = new Date(position.timestamp).toISOString();
              setLoc({ 
                latitude: lat2, 
                longitude: lng2, 
                timestamp: ts2, 
                error: null, 
                permissionGranted: true 
              });
              
              // Throttled update to server
              await throttledUpdate(lat2, lng2);
            }
          );
        }
      } catch (e: any) {
        setLoc(l => ({ ...l, error: e?.message ?? String(e) }));
      }
    })();

    return () => {
      if (watchSub.current) {
        watchSub.current.remove();
        watchSub.current = null;
      }
    };
  }, [autoWatch]);

  return {
    loc,
    refresh: async () => {
      try {
        const cur = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = cur.coords;
        const ts = new Date(cur.timestamp).toISOString();
        setLoc({ latitude, longitude, timestamp: ts, error: null, permissionGranted: true });
        
        // Force update on manual refresh (bypass throttling)
        await updateUserLocation(latitude, longitude);
        lastUpdateTime.current = Date.now();
        lastLocation.current = { lat: latitude, lng: longitude };
      } catch (e: any) {
        setLoc(l => ({ ...l, error: e?.message ?? String(e) }));
      }
    },
  };
}

/* Service: update user location in Supabase */
export async function updateUserLocation(latitude: number, longitude: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;
    if (!userId) return { error: 'not_authenticated' };

    const { error } = await supabase
      .from('users')
      .update({ 
        latitude, 
        longitude, 
        last_location_ts: new Date().toISOString() 
      })
      .eq('id', userId);

    if (error) {
      console.error('updateUserLocation error', error);
      return { error };
    }
    return { ok: true };
  } catch (err) {
    console.error('updateUserLocation exception', err);
    return { error: String(err) };
  }
}

