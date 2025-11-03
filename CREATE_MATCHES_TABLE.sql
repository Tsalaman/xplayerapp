-- ============================================
-- CREATE MATCHES TABLE FOR MATCH CREATION FLOW
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MATCHES TABLE (Upcoming Matches)
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis', 'padel')),
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  court TEXT,
  slots INTEGER NOT NULL DEFAULT 2,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  score_home INTEGER DEFAULT 0,
  score_away INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_matches_creator ON matches(creator_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date DESC);
CREATE INDEX IF NOT EXISTS idx_matches_sport ON matches(sport);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Users can read all open/public matches
CREATE POLICY "Users can read open matches"
  ON matches FOR SELECT
  USING (status = 'open' AND is_private = false OR auth.uid() = creator_id);

-- Users can insert their own matches
CREATE POLICY "Users can insert their own matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Users can update their own matches
CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = creator_id);

-- Users can delete their own matches
CREATE POLICY "Users can delete their own matches"
  ON matches FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================
-- MATCH_PLAYERS TABLE (Join table)
-- ============================================
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Index for match_players
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id);

-- RLS for match_players
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- Users can read match_players for matches they can see
CREATE POLICY "Users can read match players"
  ON match_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_players.match_id
      AND (matches.status = 'open' AND matches.is_private = false OR matches.creator_id = auth.uid())
    )
  );

-- Users can join matches (insert)
CREATE POLICY "Users can join matches"
  ON match_players FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_players.match_id
      AND matches.status = 'open'
      AND (
        SELECT COUNT(*) FROM match_players
        WHERE match_players.match_id = matches.id
      ) < matches.slots
    )
  );

-- Users can leave matches (delete)
CREATE POLICY "Users can leave matches"
  ON match_players FOR DELETE
  USING (auth.uid() = user_id);

