-- ============================================
-- Team Join Requests RPC Functions
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- TEAM JOIN REQUESTS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS team_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  auto_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id) -- One request per user per team
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user_id ON team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON team_join_requests(status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests or requests for teams they manage
CREATE POLICY "team_join_requests_select" ON team_join_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_join_requests.team_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'captain', 'admin')
        )
      )
    )
  );

-- Users can create join requests
CREATE POLICY "team_join_requests_insert" ON team_join_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Team owners/captains/admins can update requests (approve/reject)
CREATE POLICY "team_join_requests_update" ON team_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_join_requests.team_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'captain', 'admin')
        )
      )
    )
  );

-- ============================================
-- RPC FUNCTION: request_to_join
-- ============================================
CREATE OR REPLACE FUNCTION request_to_join(
  p_team_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  request_id UUID,
  team_id UUID,
  user_id UUID,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_nickname TEXT;
  team_data RECORD;
  existing_request RECORD;
  existing_member RECORD;
  auto_approve_flag BOOLEAN;
  new_request_id UUID;
BEGIN
  -- Get current user
  current_user_id := COALESCE(p_user_id, auth.uid());
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get user nickname
  SELECT nickname INTO current_user_nickname
  FROM users
  WHERE id = current_user_id;

  IF current_user_nickname IS NULL THEN
    current_user_nickname := 'Anonymous';
  END IF;

  -- Get team data
  SELECT * INTO team_data
  FROM teams
  WHERE id = p_team_id;

  IF team_data IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Check if user is already a member
  SELECT * INTO existing_member
  FROM team_members
  WHERE team_id = p_team_id
  AND user_id = current_user_id;

  IF existing_member IS NOT NULL THEN
    RAISE EXCEPTION 'User is already a member of this team';
  END IF;

  -- Check if there's already a pending request
  SELECT * INTO existing_request
  FROM team_join_requests
  WHERE team_id = p_team_id
  AND user_id = current_user_id
  AND status = 'pending';

  IF existing_request IS NOT NULL THEN
    RAISE EXCEPTION 'Join request already pending';
  END IF;

  -- Check if team has auto-approve enabled (you can add this to teams table)
  -- For now, assume private teams need approval, public teams auto-approve
  auto_approve_flag := team_data.is_public;

  -- Create join request
  INSERT INTO team_join_requests (
    team_id,
    user_id,
    status,
    auto_approve
  )
  VALUES (
    p_team_id,
    current_user_id,
    CASE WHEN auto_approve_flag THEN 'approved' ELSE 'pending' END,
    auto_approve_flag
  )
  RETURNING id INTO new_request_id;

  -- If auto-approve, add user to team immediately
  IF auto_approve_flag THEN
    INSERT INTO team_members (
      team_id,
      user_id,
      user_nickname,
      role
    )
    VALUES (
      p_team_id,
      current_user_id,
      current_user_nickname,
      'player'
    )
    ON CONFLICT (team_id, user_id) DO NOTHING;

    -- Update request status
    UPDATE team_join_requests
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = new_request_id;
  END IF;

  -- Return request data
  RETURN QUERY
  SELECT
    tjr.id,
    tjr.team_id,
    tjr.user_id,
    tjr.status,
    tjr.created_at
  FROM team_join_requests tjr
  WHERE tjr.id = new_request_id;
END;
$$;

-- ============================================
-- RPC FUNCTION: approve_join_request
-- ============================================
CREATE OR REPLACE FUNCTION approve_join_request(
  p_request_id UUID
)
RETURNS TABLE (
  member_id UUID,
  team_id UUID,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_data RECORD;
  current_user_id UUID;
  current_user_nickname TEXT;
  new_member_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get request data
  SELECT * INTO request_data
  FROM team_join_requests
  WHERE id = p_request_id;

  IF request_data IS NULL THEN
    RAISE EXCEPTION 'Join request not found';
  END IF;

  IF request_data.status != 'pending' THEN
    RAISE EXCEPTION 'Join request is not pending';
  END IF;

  -- Check if user has permission (owner/captain/admin)
  IF NOT EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = request_data.team_id
    AND (
      t.owner_id = current_user_id
      OR EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = t.id
        AND tm.user_id = current_user_id
        AND tm.role IN ('owner', 'captain', 'admin')
      )
    )
  ) THEN
    RAISE EXCEPTION 'You do not have permission to approve this request';
  END IF;

  -- Get user nickname
  SELECT nickname INTO current_user_nickname
  FROM users
  WHERE id = request_data.user_id;

  IF current_user_nickname IS NULL THEN
    current_user_nickname := 'Anonymous';
  END IF;

  -- Add user to team
  INSERT INTO team_members (
    team_id,
    user_id,
    user_nickname,
    role
  )
  VALUES (
    request_data.team_id,
    request_data.user_id,
    current_user_nickname,
    'player'
  )
  ON CONFLICT (team_id, user_id) DO UPDATE
  SET user_nickname = EXCLUDED.user_nickname
  RETURNING id INTO new_member_id;

  -- Update request status
  UPDATE team_join_requests
  SET status = 'approved',
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Return member data
  RETURN QUERY
  SELECT
    tm.id,
    tm.team_id,
    tm.user_id
  FROM team_members tm
  WHERE tm.id = new_member_id;
END;
$$;

