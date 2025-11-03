-- ============================================
-- CREATE MATCH RESULTS TABLE AND RPC FUNCTION
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MATCH RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_home INTEGER NOT NULL DEFAULT 0,
  score_away INTEGER NOT NULL DEFAULT 0,
  mvp_player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_match_results_submitted_by ON match_results(submitted_by);
CREATE INDEX IF NOT EXISTS idx_match_results_mvp ON match_results(mvp_player_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Users can read all match results
CREATE POLICY "Users can read match results"
  ON match_results FOR SELECT
  USING (true);

-- Users can insert match results for matches they participated in
CREATE POLICY "Users can insert match results"
  ON match_results FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by AND
    EXISTS (
      SELECT 1 FROM match_players
      WHERE match_players.match_id = match_results.match_id
      AND match_players.user_id = auth.uid()
    )
  );

-- Users can update their own match results
CREATE POLICY "Users can update own match results"
  ON match_results FOR UPDATE
  USING (auth.uid() = submitted_by);

-- ============================================
-- RPC FUNCTION: submit_match_result
-- ============================================
CREATE OR REPLACE FUNCTION submit_match_result(
  p_match_id UUID,
  p_score_home INTEGER,
  p_score_away INTEGER,
  p_mvp_player_id UUID DEFAULT NULL,
  p_comments TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user is a participant in the match
  IF NOT EXISTS (
    SELECT 1 FROM match_players
    WHERE match_id = p_match_id
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this match';
  END IF;

  -- Insert match result
  INSERT INTO match_results (
    match_id,
    submitted_by,
    score_home,
    score_away,
    mvp_player_id,
    comments
  )
  VALUES (
    p_match_id,
    v_user_id,
    p_score_home,
    p_score_away,
    p_mvp_player_id,
    p_comments
  )
  RETURNING id INTO v_result_id;

  -- Update match scores and status
  UPDATE matches
  SET 
    score_home = p_score_home,
    score_away = p_score_away,
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_match_id;

  RETURN v_result_id;
END;
$$;

-- ============================================
-- UPDATE TRIGGER FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_match_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_results_updated_at
  BEFORE UPDATE ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION update_match_results_updated_at();

