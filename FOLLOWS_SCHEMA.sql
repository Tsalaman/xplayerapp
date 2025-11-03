-- ============================================
-- Follows / Following System Schema & RPC Functions
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- FOLLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id), -- One user can follow another only once
  CHECK(follower_id != following_id) -- Users cannot follow themselves
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_composite ON follows(follower_id, following_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view all follows (for feed purposes)
CREATE POLICY "Users can view all follows" ON follows
  FOR SELECT USING (true);

-- Users can only create follows for themselves
CREATE POLICY "Users can create their own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follows (unfollow)
CREATE POLICY "Users can delete their own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- RPC: Follow User
CREATE OR REPLACE FUNCTION follow_user(
  following_user_id UUID
)
RETURNS TABLE (
  follow_id UUID,
  follower_id UUID,
  following_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  new_follow_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if trying to follow themselves
  IF current_user_id = following_user_id THEN
    RAISE EXCEPTION 'Users cannot follow themselves';
  END IF;

  -- Check if already following
  IF EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = current_user_id
    AND following_id = following_user_id
  ) THEN
    RAISE EXCEPTION 'Already following this user';
  END IF;

  -- Create follow relationship
  INSERT INTO follows (follower_id, following_id)
  VALUES (current_user_id, following_user_id)
  RETURNING id INTO new_follow_id;

  -- Return follow data
  RETURN QUERY
  SELECT
    f.id,
    f.follower_id,
    f.following_id,
    f.created_at
  FROM follows f
  WHERE f.id = new_follow_id;
END;
$$;

-- RPC: Unfollow User
CREATE OR REPLACE FUNCTION unfollow_user(
  following_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Delete follow relationship
  DELETE FROM follows
  WHERE follower_id = current_user_id
  AND following_id = following_user_id;

  -- Return true if row was deleted, false otherwise
  RETURN FOUND;
END;
$$;

-- RPC: Check if user is following another user
CREATE OR REPLACE FUNCTION is_following(
  following_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  following_exists BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if following relationship exists
  SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = current_user_id
    AND following_id = following_user_id
  ) INTO following_exists;

  RETURN following_exists;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION follow_user TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_user TO authenticated;
GRANT EXECUTE ON FUNCTION is_following TO authenticated;

