-- ============================================
-- Teams Pagination RPC Function
-- ============================================
-- Run this in Supabase SQL Editor

-- Function to get teams feed with cursor pagination
CREATE OR REPLACE FUNCTION get_teams_feed_paginated(
  user_id_filter UUID DEFAULT NULL,
  cursor_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  sport_filter TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sport TEXT,
  max_players INTEGER,
  owner_id UUID,
  owner_nickname TEXT,
  is_public BOOLEAN,
  description TEXT,
  location TEXT,
  invite_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT,
  is_member BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.sport,
    t.max_players,
    t.owner_id,
    t.owner_nickname,
    t.is_public,
    t.description,
    t.location,
    t.invite_code,
    t.created_at,
    t.updated_at,
    -- Count members
    (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS member_count,
    -- Check if user is member
    CASE
      WHEN user_id_filter IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = t.id
        AND tm.user_id = user_id_filter
      )
    END AS is_member
  FROM teams t
  WHERE
    -- Filter: (is_public = true) OR (user is member of private team)
    (
      t.is_public = true
      OR (
        user_id_filter IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = user_id_filter
        )
      )
    )
    -- Filter by sport (if provided)
    AND (sport_filter IS NULL OR t.sport = sport_filter)
    -- Search by team name (if provided)
    AND (
      search_query IS NULL
      OR t.name ILIKE '%' || search_query || '%'
    )
    -- Cursor pagination: WHERE cursor_created_at IS NULL
    --                    OR (created_at < cursor_created_at)
    --                    OR (created_at = cursor_created_at AND id > cursor_id)
    AND (
      cursor_created_at IS NULL
      OR (t.created_at < cursor_created_at)
      OR (t.created_at = cursor_created_at AND t.id > cursor_id)
    )
  ORDER BY t.created_at DESC, t.id ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_teams_feed_paginated TO authenticated;

