-- ============================================
-- Notifications Schema
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'post_comment',
    'post_like',
    'team_invite',
    'team_request',
    'tournament_registration',
    'tournament_result',
    'follow_request',
    'follow_accepted',
    'match_result',
    'general'
  )),
  message TEXT NOT NULL,
  link TEXT, -- Deep link or route to navigate to
  read BOOLEAN DEFAULT false,
  metadata JSONB, -- Additional data (e.g., post_id, team_id, tournament_id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Index for cursor pagination: created_at DESC, id ASC
CREATE INDEX idx_notifications_user_created_id ON notifications(user_id, created_at DESC, id ASC);

-- Index for unread notifications
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- Index for type filtering
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notifications (for system-generated notifications)
-- Note: In practice, you might want to use a service role for inserting notifications
CREATE POLICY "Users can insert their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- ============================================
-- REAL-TIME PUBLICATION
-- ============================================
-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

