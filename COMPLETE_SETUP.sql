-- ============================================
-- COMPLETE SETUP SQL - Εκτελέστε αυτό στο Supabase SQL Editor
-- ============================================
-- Αυτό το script προσθέτει RLS policies, indexes και triggers
-- για όλα τα tables που έχετε ήδη δημιουργήσει
-- ============================================

-- Enable UUID extension (αν δεν υπάρχει ήδη)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- POSTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_authenticated" ON public.posts;
DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;

CREATE POLICY "posts_select_all" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "posts_insert_authenticated" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TOURNAMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "tournaments_select_all" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_insert_authenticated" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_update_authenticated" ON public.tournaments;

CREATE POLICY "tournaments_select_all" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "tournaments_insert_authenticated" ON public.tournaments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tournaments_update_authenticated" ON public.tournaments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- TEAMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "teams_select_public" ON public.teams;
DROP POLICY IF EXISTS "teams_select_member" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_authenticated" ON public.teams;
DROP POLICY IF EXISTS "teams_update_owner" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_owner" ON public.teams;

CREATE POLICY "teams_select_public" ON public.teams
  FOR SELECT USING (public = true);

CREATE POLICY "teams_select_member" ON public.teams
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "teams_insert_authenticated" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "teams_update_owner" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "teams_delete_owner" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================
-- TEAM MEMBERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "team_members_select_all" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_authenticated" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_own" ON public.team_members;

CREATE POLICY "team_members_select_all" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "team_members_insert_authenticated" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "team_members_delete_own" ON public.team_members
  FOR DELETE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
  );

-- ============================================
-- TEAM INVITES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "team_invites_select_own" ON public.team_invites;
DROP POLICY IF EXISTS "team_invites_insert_authenticated" ON public.team_invites;
DROP POLICY IF EXISTS "team_invites_update_own" ON public.team_invites;

CREATE POLICY "team_invites_select_own" ON public.team_invites
  FOR SELECT USING (
    auth.uid() = invited_user_id 
    OR auth.uid() = inviter_id
    OR EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = team_invites.team_id 
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "team_invites_insert_authenticated" ON public.team_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "team_invites_update_own" ON public.team_invites
  FOR UPDATE USING (auth.uid() = invited_user_id);

-- ============================================
-- CHATS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "chats_select_participant" ON public.chats;
DROP POLICY IF EXISTS "chats_insert_authenticated" ON public.chats;

CREATE POLICY "chats_select_participant" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.chat_id = chats.id 
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "chats_insert_authenticated" ON public.chats
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- CHAT MESSAGES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "chat_messages_select_participant" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_participant" ON public.chat_messages;

CREATE POLICY "chat_messages_select_participant" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.chat_id = chat_messages.chat_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_insert_participant" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.chat_id = chat_messages.chat_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

-- ============================================
-- CHAT PARTICIPANTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "chat_participants_select_participant" ON public.chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_authenticated" ON public.chat_participants;

CREATE POLICY "chat_participants_select_participant" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_participants cp2
      WHERE cp2.chat_id = chat_participants.chat_id 
      AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_participants_insert_authenticated" ON public.chat_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- FOLLOWS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "follows_select_all" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;

CREATE POLICY "follows_select_all" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert_own" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- MATCHES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "matches_select_participant" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_authenticated" ON public.matches;
DROP POLICY IF EXISTS "matches_update_participant" ON public.matches;

CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = matches.home_team_id 
      AND EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = matches.away_team_id 
      AND EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = teams.id 
        AND team_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "matches_insert_authenticated" ON public.matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "matches_update_participant" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = matches.home_team_id 
      AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = matches.away_team_id 
      AND teams.owner_id = auth.uid()
    )
  );

-- ============================================
-- MATCH PLAYERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "match_players_select_all" ON public.match_players;
DROP POLICY IF EXISTS "match_players_insert_authenticated" ON public.match_players;

CREATE POLICY "match_players_select_all" ON public.match_players
  FOR SELECT USING (true);

CREATE POLICY "match_players_insert_authenticated" ON public.match_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TOURNAMENT PARTICIPANTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "tournament_participants_select_all" ON public.tournament_participants;
DROP POLICY IF EXISTS "tournament_participants_insert_authenticated" ON public.tournament_participants;
DROP POLICY IF EXISTS "tournament_participants_update_own" ON public.tournament_participants;

CREATE POLICY "tournament_participants_select_all" ON public.tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "tournament_participants_insert_authenticated" ON public.tournament_participants
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.team_id = tournament_participants.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "tournament_participants_update_own" ON public.tournament_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.team_id = tournament_participants.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- VENUES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "venues_select_public" ON public.venues;
DROP POLICY IF EXISTS "venues_insert_authenticated" ON public.venues;

CREATE POLICY "venues_select_public" ON public.venues
  FOR SELECT USING (public = true);

CREATE POLICY "venues_insert_authenticated" ON public.venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_sports ON public.users USING GIN(sports);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_sport ON public.posts(sport);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON public.tournaments(sport);
CREATE INDEX IF NOT EXISTS idx_tournaments_is_active ON public.tournaments(is_active);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON public.tournaments(start_date);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON public.teams(sport);
CREATE INDEX IF NOT EXISTS idx_teams_public ON public.teams(public);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON public.matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON public.matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON public.matches(scheduled_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Tournament participants indexes
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON public.tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_team_id ON public.tournament_participants(team_id);

-- Venues indexes
CREATE INDEX IF NOT EXISTS idx_venues_sport ON public.venues(sport);
CREATE INDEX IF NOT EXISTS idx_venues_public ON public.venues(public);
CREATE INDEX IF NOT EXISTS idx_venues_latitude ON public.venues(latitude);
CREATE INDEX IF NOT EXISTS idx_venues_longitude ON public.venues(longitude);

-- ============================================
-- TRIGGERS FOR updated_at COLUMNS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER update_tournaments_updated_at 
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETE! ✅
-- ============================================
-- Μετά την εκτέλεση αυτού του script, το database είναι:
-- ✅ Έχει RLS policies για όλα τα tables
-- ✅ Έχει indexes για καλύτερη απόδοση
-- ✅ Έχει triggers για updated_at columns
-- ✅ Έτοιμο για χρήση! 🎉
-- ============================================

