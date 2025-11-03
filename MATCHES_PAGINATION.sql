-- ============================================
-- Matches Pagination RPC Function
-- ============================================
-- Run this in Supabase SQL Editor

-- Function to get user's past matches with cursor pagination
CREATE OR REPLACE FUNCTION get_matches_paginated(
  user_id_filter UUID,
  cursor_match_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  cursor_match_id UUID DEFAULT NULL,
  sport_filter TEXT DEFAULT NULL,
  team_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  sport TEXT,
  match_date TIMESTAMP WITH TIME ZONE,
  team_name TEXT,
  opponent_team_name TEXT,
  player_names TEXT[],
  opponent_names TEXT[],
  user_score INTEGER,
  opponent_score INTEGER,
  result TEXT,
  venue TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.sport,
    m.match_date,
    m.team_name,
    m.opponent_team_name,
    m.player_names,
    m.opponent_names,
    m.user_score,
    m.opponent_score,
    m.result,
    m.venue,
    m.notes,
    m.created_at,
    m.updated_at
  FROM matches m
  WHERE
    m.user_id = user_id_filter
    -- Only past matches
    AND m.match_date < NOW()
    -- Filter by sport (if provided)
    AND (sport_filter IS NULL OR m.sport = sport_filter)
    -- Filter by team (if provided)
    AND (team_filter IS NULL OR m.team_name = team_filter)
    -- Cursor pagination: WHERE cursor_match_date IS NULL
    --                    OR (match_date < cursor_match_date)
    --                    OR (match_date = cursor_match_date AND id > cursor_match_id)
    AND (
      cursor_match_date IS NULL
      OR (m.match_date < cursor_match_date)
      OR (m.match_date = cursor_match_date AND m.id > cursor_match_id)
    )
  ORDER BY m.match_date DESC, m.id ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_matches_paginated TO authenticated;

