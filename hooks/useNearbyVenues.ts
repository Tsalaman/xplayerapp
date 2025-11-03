import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useLocation } from './useLocation';
import { Venue, Sport } from '../types';
import { Cursor, encodeCursor, decodeCursor } from '../utils/cursor';
import { venueService } from '../services/venues';

interface UseNearbyVenuesOptions {
  radiusKm?: number;
  sport?: Sport;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  limit?: number; // items per page
}

export function useNearbyVenues(options: UseNearbyVenuesOptions = {}) {
  const {
    radiusKm = 10.0,
    sport,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute default
    limit = 20,
  } = options;

  const { loc } = useLocation(false); // Don't auto-watch here
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor>(null);
  const [hasMore, setHasMore] = useState(false);

  const searchNearby = useCallback(async (cursor: Cursor = null, append: boolean = false) => {
    if (!loc.latitude || !loc.longitude) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await venueService.getNearbyVenuesPaginated(
        loc.latitude,
        loc.longitude,
        radiusKm,
        cursor,
        sport,
        limit
      );

      if (append) {
        setNearbyVenues(prev => [...prev, ...result.data]);
      } else {
        setNearbyVenues(result.data);
      }
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error('Error searching nearby venues:', err);
      setError(err.message || 'Failed to search nearby venues');
      if (!append) {
        setNearbyVenues([]);
      }
    } finally {
      setLoading(false);
    }
  }, [loc.latitude, loc.longitude, radiusKm, sport, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && nextCursor) {
      searchNearby(nextCursor, true);
    }
  }, [loading, hasMore, nextCursor, searchNearby]);

  // Auto-search when location is available
  useEffect(() => {
    if (loc.latitude && loc.longitude) {
      searchNearby();
    }
  }, [loc.latitude, loc.longitude, searchNearby]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !loc.latitude || !loc.longitude) return;

    const interval = setInterval(() => {
      searchNearby();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loc.latitude, loc.longitude, searchNearby]);

  return {
    nearbyVenues,
    loading,
    error,
    searchNearby,
    loadMore,
    hasMore,
    nextCursor,
    location: loc,
  };
}

