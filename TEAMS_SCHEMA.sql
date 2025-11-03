-- ============================================
-- Teams Management Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis', 'padel')),
  max_players INTEGER NOT NULL CHECK (max_players > 0),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_nickname TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  description TEXT,
  location TEXT,
  invite_code TEXT UNIQUE, -- Unique invite code for private teams
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('owner', 'captain', 'player')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id) -- One user per team
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_is_public ON teams(is_public);
CREATE INDEX idx_teams_invite_code ON teams(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- TEAMS POLICIES
-- Everyone can read public teams
CREATE POLICY "Public teams are viewable by everyone" ON teams
  FOR SELECT USING (is_public = true);

-- Authenticated users can read their own teams
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Team owners can update their teams
CREATE POLICY "Team owners can update their teams" ON teams
  FOR UPDATE USING (auth.uid() = owner_id);

-- Team owners can delete their teams
CREATE POLICY "Team owners can delete their teams" ON teams
  FOR DELETE USING (auth.uid() = owner_id);

-- TEAM MEMBERS POLICIES
-- Everyone can read team members (for team details)
CREATE POLICY "Team members are viewable by everyone" ON team_members
  FOR SELECT USING (true);

-- Authenticated users can join teams
CREATE POLICY "Authenticated users can join teams" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team owners/captains can update member roles
CREATE POLICY "Team owners/captains can update members" ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND (
        teams.owner_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = teams.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'captain')
        )
      )
    )
  );

-- Users can leave teams, owners/captains can remove members
CREATE POLICY "Users can leave or be removed from teams" ON team_members
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND (
        teams.owner_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = teams.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'captain')
        )
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate invite_code for private teams
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = false AND (NEW.invite_code IS NULL OR NEW.invite_code = '') THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_team_invite_code
BEFORE INSERT OR UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to add owner as team member on team creation
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, user_nickname, role)
  VALUES (NEW.id, NEW.owner_id, NEW.owner_nickname, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_owner_to_team
AFTER INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION add_owner_as_member();

