-- ============================================
-- Nearby Search Function (Haversine Formula)
-- ============================================
-- Run this in Supabase SQL Editor

-- Function to search for nearby users based on location (with cursor pagination and follow status)
CREATE OR REPLACE FUNCTION search_nearby(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 10.0,
  sport_filter TEXT DEFAULT NULL,
  skill_filter TEXT DEFAULT NULL,
  cursor_distance DECIMAL DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  sports TEXT[],
  skill_level TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  bio TEXT,
  location_privacy TEXT,
  is_following BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();

  RETURN QUERY
  SELECT
    u.id,
    u.nickname,
    u.sports,
    u.skill_level,
    u.latitude,
    u.longitude,
    -- Haversine formula to calculate distance in kilometers
    (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(u.latitude)) *
        cos(radians(u.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(u.latitude))
      )
    ) AS distance_km,
    u.bio,
    u.location_privacy,
    -- Check if current user is following this user
    CASE
      WHEN current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = current_user_id
        AND f.following_id = u.id
      )
    END AS is_following
  FROM users u
  WHERE
    -- Only users with location data
    u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL
    -- Filter by sport (if provided)
    AND (sport_filter IS NULL OR sport_filter = ANY(u.sports))
    -- Filter by skill level (if provided)
    AND (skill_filter IS NULL OR u.skill_level = skill_filter)
    -- Filter by location privacy (exact or coarse)
    AND (u.location_privacy IN ('exact', 'coarse'))
    -- Only show users within radius
    AND (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(u.latitude)) *
        cos(radians(u.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(u.latitude))
      )
    ) <= radius_km
    -- Exclude current user
    AND u.id != current_user_id
    -- Cursor pagination: WHERE cursor_distance IS NULL 
    --                      OR (distance > cursor_distance) 
    --                      OR (distance = cursor_distance AND id > cursor_id)
    AND (
      cursor_distance IS NULL
      OR (
        (
          6371 * acos(
            cos(radians(user_lat)) *
            cos(radians(u.latitude)) *
            cos(radians(u.longitude) - radians(user_lng)) +
            sin(radians(user_lat)) *
            sin(radians(u.latitude))
          )
        ) > cursor_distance
        OR (
          (
            6371 * acos(
              cos(radians(user_lat)) *
              cos(radians(u.latitude)) *
              cos(radians(u.longitude) - radians(user_lng)) +
              sin(radians(user_lat)) *
              sin(radians(u.latitude))
            )
          ) = cursor_distance
          AND u.id > cursor_id
        )
      )
    )
  ORDER BY distance_km ASC, id ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_nearby TO authenticated;

-- Example usage:
-- SELECT * FROM search_nearby(37.7749, -122.4194, 5.0, 'football', 'intermediate');
-- This finds football players within 5km of San Francisco with intermediate skill level

