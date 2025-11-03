-- ============================================
-- Nearby Venues Search Function (Haversine Formula)
-- ============================================
-- Run this in Supabase SQL Editor

-- Function to search for nearby venues based on location (with cursor pagination)
CREATE OR REPLACE FUNCTION search_nearby_venues(
  user_lat DECIMAL,
  user_lng DECIMAL,
  radius_km DECIMAL DEFAULT 10.0,
  sport_filter TEXT DEFAULT NULL,
  cursor_distance DECIMAL DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  sport TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  is_public BOOLEAN,
  owner_id UUID,
  owner_email TEXT,
  phone TEXT,
  website TEXT,
  price_per_hour DECIMAL,
  listing_status TEXT,
  allows_booking BOOLEAN,
  booking_price_per_hour DECIMAL,
  amenities TEXT[],
  images TEXT[],
  rating DECIMAL,
  rating_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();

  RETURN QUERY
  SELECT
    v.id,
    v.name,
    v.description,
    v.sport,
    v.address,
    v.latitude,
    v.longitude,
    -- Haversine formula to calculate distance in kilometers
    (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(v.latitude)) *
        cos(radians(v.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(v.latitude))
      )
    ) AS distance_km,
    v.is_public,
    v.owner_id,
    v.owner_email,
    v.phone,
    v.website,
    v.price_per_hour,
    v.listing_status,
    v.allows_booking,
    v.booking_price_per_hour,
    v.amenities,
    v.images,
    v.rating,
    v.rating_count
  FROM venues v
  WHERE
    -- Only venues with location data
    v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
    -- Only active venues
    AND v.listing_status = 'active'
    -- Filter: public venues OR venues owned by current user
    AND (
      v.is_public = true
      OR (current_user_id IS NOT NULL AND v.owner_id = current_user_id)
    )
    -- Filter by sport (if provided)
    AND (sport_filter IS NULL OR v.sport = sport_filter)
    -- Only show venues within radius
    AND (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(v.latitude)) *
        cos(radians(v.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(v.latitude))
      )
    ) <= radius_km
    -- Cursor pagination: WHERE cursor_distance IS NULL 
    --                      OR (distance > cursor_distance) 
    --                      OR (distance = cursor_distance AND id > cursor_id)
    AND (
      cursor_distance IS NULL
      OR (
        (
          6371 * acos(
            cos(radians(user_lat)) *
            cos(radians(v.latitude)) *
            cos(radians(v.longitude) - radians(user_lng)) +
            sin(radians(user_lat)) *
            sin(radians(v.latitude))
          )
        ) > cursor_distance
        OR (
          (
            6371 * acos(
              cos(radians(user_lat)) *
              cos(radians(v.latitude)) *
              cos(radians(v.longitude) - radians(user_lng)) +
              sin(radians(user_lat)) *
              sin(radians(v.latitude))
            )
          ) = cursor_distance
          AND v.id > cursor_id
        )
      )
    )
  ORDER BY distance_km ASC, id ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_nearby_venues TO authenticated;

-- Example usage:
-- SELECT * FROM search_nearby_venues(37.7749, -122.4194, 5.0, 'football');
-- This finds football venues within 5km of San Francisco

