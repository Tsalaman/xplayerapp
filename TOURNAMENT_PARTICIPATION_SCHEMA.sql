-- ============================================
-- Tournament Participation & Results Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TOURNAMENT PARTICIPANTS TABLE
-- ============================================
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'team')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL, -- user nickname or team name
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT, -- e.g., 'card', 'paypal', 'app_store', 'play_store'
  payment_transaction_id TEXT, -- External payment ID
  payment_amount DECIMAL(10, 2), -- Actual paid amount
  payment_date TIMESTAMP WITH TIME ZONE,
  confirmed BOOLEAN DEFAULT false, -- True when payment confirmed
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure either user_id or team_id is set based on participant_type
  CONSTRAINT check_participant CHECK (
    (participant_type = 'user' AND user_id IS NOT NULL AND team_id IS NULL) OR
    (participant_type = 'team' AND team_id IS NOT NULL AND user_id IS NULL)
  ),
  UNIQUE(tournament_id, user_id, participant_type), -- One user per tournament
  UNIQUE(tournament_id, team_id, participant_type) -- One team per tournament (when participant_type = 'team')
);

-- ============================================
-- TOURNAMENT RESULTS TABLE
-- ============================================
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES tournament_participants(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'team')),
  position INTEGER NOT NULL, -- 1 = winner, 2 = runner-up, etc.
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  prize TEXT, -- Prize description if won
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER STATS TABLE
-- ============================================
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tournaments_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  tournaments_runner_up INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_goals_for INTEGER DEFAULT 0,
  total_goals_against INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAM STATS TABLE
-- ============================================
CREATE TABLE team_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  tournaments_played INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  tournaments_runner_up INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_goals_for INTEGER DEFAULT 0,
  total_goals_against INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VENUES TABLE
-- ============================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis', 'padel')),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_public BOOLEAN DEFAULT true, -- true = free listing, false = paid listing
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for public venues
  owner_email TEXT, -- Venue owner contact
  phone TEXT,
  website TEXT,
  price_per_hour DECIMAL(10, 2), -- For paid venues
  listing_fee DECIMAL(10, 2), -- For paid listings
  listing_status TEXT DEFAULT 'active' CHECK (listing_status IN ('active', 'pending', 'expired')),
  listing_expires_at TIMESTAMP WITH TIME ZONE, -- For paid listings
  allows_booking BOOLEAN DEFAULT false, -- In-app booking feature
  booking_price_per_hour DECIMAL(10, 2), -- Booking price if allows_booking = true
  amenities TEXT[], -- e.g., ['parking', 'locker_room', 'showers', 'wifi']
  images TEXT[], -- Array of image URLs
  rating DECIMAL(3, 2) DEFAULT 0, -- Average rating (0-5)
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_team_id ON tournament_participants(team_id);
CREATE INDEX idx_tournament_participants_confirmed ON tournament_participants(confirmed);
CREATE INDEX idx_tournament_results_tournament_id ON tournament_results(tournament_id);
CREATE INDEX idx_tournament_results_participant_id ON tournament_results(participant_id);
CREATE INDEX idx_tournament_results_position ON tournament_results(position);
CREATE INDEX idx_venues_sport ON venues(sport);
CREATE INDEX idx_venues_is_public ON venues(is_public);
CREATE INDEX idx_venues_listing_status ON venues(listing_status);
CREATE INDEX idx_venues_location ON venues(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- TOURNAMENT PARTICIPANTS POLICIES
-- Everyone can read participants
CREATE POLICY "Tournament participants are viewable by everyone" ON tournament_participants
  FOR SELECT USING (true);

-- Authenticated users can register
CREATE POLICY "Authenticated users can register for tournaments" ON tournament_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      (participant_type = 'user' AND user_id = auth.uid()) OR
      (participant_type = 'team' AND EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = tournament_participants.team_id 
        AND team_members.user_id = auth.uid()
      ))
    )
  );

-- Users can update their own registrations
CREATE POLICY "Users can update own registrations" ON tournament_participants
  FOR UPDATE USING (
    (participant_type = 'user' AND user_id = auth.uid()) OR
    (participant_type = 'team' AND EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = tournament_participants.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'captain')
    ))
  );

-- TOURNAMENT RESULTS POLICIES
-- Everyone can read results
CREATE POLICY "Tournament results are viewable by everyone" ON tournament_results
  FOR SELECT USING (true);

-- Only admins/system can insert/update results (we'll use service role for this)
CREATE POLICY "System can manage results" ON tournament_results
  FOR ALL USING (false); -- Use service role for results management

-- USER STATS POLICIES
-- Everyone can read stats
CREATE POLICY "User stats are viewable by everyone" ON user_stats
  FOR SELECT USING (true);

-- Users can read their own stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- System updates stats (service role)
CREATE POLICY "System can update stats" ON user_stats
  FOR ALL USING (false); -- Use service role for stats updates

-- TEAM STATS POLICIES
-- Everyone can read team stats
CREATE POLICY "Team stats are viewable by everyone" ON team_stats
  FOR SELECT USING (true);

-- System updates stats (service role)
CREATE POLICY "System can update team stats" ON team_stats
  FOR ALL USING (false); -- Use service role for stats updates

-- VENUES POLICIES
-- Everyone can read public venues
CREATE POLICY "Public venues are viewable by everyone" ON venues
  FOR SELECT USING (is_public = true OR listing_status = 'active');

-- Authenticated users can create venues
CREATE POLICY "Authenticated users can create venues" ON venues
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Venue owners can update their venues
CREATE POLICY "Venue owners can update their venues" ON venues
  FOR UPDATE USING (owner_id = auth.uid() OR owner_id IS NULL); -- NULL for public venues, anyone can update

-- Venue owners can delete their venues
CREATE POLICY "Venue owners can delete their venues" ON venues
  FOR DELETE USING (owner_id = auth.uid() OR owner_id IS NULL);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update user stats when tournament results change
CREATE OR REPLACE FUNCTION update_user_stats_from_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.participant_type = 'user' THEN
    INSERT INTO user_stats (user_id, tournaments_played, tournaments_won, tournaments_runner_up, total_wins, total_losses, total_draws, total_goals_for, total_goals_against, total_points, updated_at)
    VALUES (NEW.user_id, 1, 0, 0, NEW.wins, NEW.losses, NEW.draws, NEW.goals_for, NEW.goals_against, NEW.points, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      tournaments_played = user_stats.tournaments_played + 1,
      tournaments_won = CASE WHEN NEW.position = 1 THEN user_stats.tournaments_won + 1 ELSE user_stats.tournaments_won END,
      tournaments_runner_up = CASE WHEN NEW.position = 2 THEN user_stats.tournaments_runner_up + 1 ELSE user_stats.tournaments_runner_up END,
      total_wins = user_stats.total_wins + NEW.wins,
      total_losses = user_stats.total_losses + NEW.losses,
      total_draws = user_stats.total_draws + NEW.draws,
      total_goals_for = user_stats.total_goals_for + NEW.goals_for,
      total_goals_against = user_stats.total_goals_against + NEW.goals_against,
      total_points = user_stats.total_points + NEW.points,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user stats update
CREATE TRIGGER update_user_stats_on_result
AFTER INSERT OR UPDATE ON tournament_results
FOR EACH ROW
WHEN (NEW.participant_type = 'user')
EXECUTE FUNCTION update_user_stats_from_result();

-- Function to update team stats when tournament results change
CREATE OR REPLACE FUNCTION update_team_stats_from_result()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.participant_type = 'team' THEN
    INSERT INTO team_stats (team_id, tournaments_played, tournaments_won, tournaments_runner_up, total_wins, total_losses, total_draws, total_goals_for, total_goals_against, total_points, updated_at)
    VALUES (NEW.team_id, 1, 0, 0, NEW.wins, NEW.losses, NEW.draws, NEW.goals_for, NEW.goals_against, NEW.points, NOW())
    ON CONFLICT (team_id) DO UPDATE SET
      tournaments_played = team_stats.tournaments_played + 1,
      tournaments_won = CASE WHEN NEW.position = 1 THEN team_stats.tournaments_won + 1 ELSE team_stats.tournaments_won END,
      tournaments_runner_up = CASE WHEN NEW.position = 2 THEN team_stats.tournaments_runner_up + 1 ELSE team_stats.tournaments_runner_up END,
      total_wins = team_stats.total_wins + NEW.wins,
      total_losses = team_stats.total_losses + NEW.losses,
      total_draws = team_stats.total_draws + NEW.draws,
      total_goals_for = team_stats.total_goals_for + NEW.goals_for,
      total_goals_against = team_stats.total_goals_against + NEW.goals_against,
      total_points = team_stats.total_points + NEW.points,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for team stats update
CREATE TRIGGER update_team_stats_on_result
AFTER INSERT OR UPDATE ON tournament_results
FOR EACH ROW
WHEN (NEW.participant_type = 'team')
EXECUTE FUNCTION update_team_stats_from_result();

-- Function to confirm participation after payment
CREATE OR REPLACE FUNCTION confirm_participation_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.confirmed = false THEN
    NEW.confirmed = true;
    NEW.payment_date = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-confirm after payment
CREATE TRIGGER confirm_on_payment
BEFORE UPDATE ON tournament_participants
FOR EACH ROW
WHEN (NEW.payment_status = 'paid' AND OLD.payment_status != 'paid')
EXECUTE FUNCTION confirm_participation_after_payment();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON venues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

