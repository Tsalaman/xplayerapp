import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useLocation } from './useLocation';
import { User, Sport } from '../types';
import { Cursor, encodeCursor, decodeCursor } from '../utils/cursor';

export interface NearbyUser {
  id: string;
  nickname: string;
  sports: Sport[];
  skillLevel?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  bio?: string;
  locationPrivacy?: string;
  isFollowing?: boolean; // Whether current user is following this user
}

interface UseMatchmakingOptions {
  radiusKm?: number;
  sport?: Sport;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  limit?: number; // items per page
}

interface PaginatedNearbyUsers {
  users: NearbyUser[];
  nextCursor: Cursor;
  hasMore: boolean;
}

export function useMatchmaking(options: UseMatchmakingOptions = {}) {
  const {
    radiusKm = 10.0,
    sport,
    skillLevel,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute default
    limit = 20,
  } = options;

  const { loc } = useLocation(false); // Don't auto-watch here
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
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
      // For cursor-based pagination with distance, we need complex cursor
      // Build cursor filter
      let cursorFilter = null;
      if (cursor) {
        const decoded = decodeCursor(cursor);
        cursorFilter = decoded;
      }

      const { data, error: rpcError } = await supabase.rpc('search_nearby', {
        user_lat: loc.latitude,
        user_lng: loc.longitude,
        radius_km: radiusKm,
        sport_filter: sport || null,
        skill_filter: skillLevel || null,
        cursor_distance: cursorFilter?.distance || null,
        cursor_id: cursorFilter?.id || null,
        limit_count: limit + 1, // Get one extra to check hasMore
      });

      if (rpcError) {
        throw rpcError;
      }

      // Map database response to NearbyUser
      const mappedUsers: NearbyUser[] = (data || []).map((u: any) => ({
        id: u.id,
        nickname: u.nickname,
        sports: u.sports || [],
        skillLevel: u.skill_level,
        latitude: u.latitude,
        longitude: u.longitude,
        distanceKm: parseFloat(u.distance_km) || 0,
        bio: u.bio,
        locationPrivacy: u.location_privacy,
        isFollowing: u.is_following === true,
      }));

      const resultHasMore = mappedUsers.length > limit;
      const usersToReturn = resultHasMore ? mappedUsers.slice(0, limit) : mappedUsers;

      // Generate next cursor from last item (distance + id)
      const newNextCursor = usersToReturn.length > 0 && resultHasMore
        ? encodeCursor({
            distance: usersToReturn[usersToReturn.length - 1].distanceKm,
            id: usersToReturn[usersToReturn.length - 1].id,
          })
        : null;

      if (append) {
        setNearbyUsers(prev => [...prev, ...usersToReturn]);
      } else {
        setNearbyUsers(usersToReturn);
      }
      setNextCursor(newNextCursor);
      setHasMore(resultHasMore);
    } catch (err: any) {
      console.error('Error searching nearby users:', err);
      setError(err.message || 'Failed to search nearby users');
      if (!append) {
        setNearbyUsers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [loc.latitude, loc.longitude, radiusKm, sport, skillLevel, limit]);

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
    nearbyUsers,
    loading,
    error,
    searchNearby,
    loadMore,
    hasMore,
    nextCursor,
    location: loc,
  };
}

