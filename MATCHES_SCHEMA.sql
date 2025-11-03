-- ============================================
-- Matches Schema for Past Matches Feed
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis', 'padel')),
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  team_name TEXT, -- Team name (if playing as part of team)
  opponent_team_name TEXT, -- Opponent team name
  player_names TEXT[], -- Individual player names (if not team-based)
  opponent_names TEXT[], -- Opponent player names
  user_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  venue TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Index for cursor pagination: match_date DESC, id ASC
CREATE INDEX idx_matches_user_date_id ON matches(user_id, match_date DESC, id ASC);

-- Index for filtering by sport
CREATE INDEX idx_matches_user_sport ON matches(user_id, sport);

-- Index for filtering by team
CREATE INDEX idx_matches_user_team ON matches(user_id, team_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can read their own matches
CREATE POLICY "Users can read their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own matches
CREATE POLICY "Users can insert their own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own matches
CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own matches
CREATE POLICY "Users can delete their own matches"
  ON matches FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_matches_updated_at_trigger
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_matches_updated_at();

