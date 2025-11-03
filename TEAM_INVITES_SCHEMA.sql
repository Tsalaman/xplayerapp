-- ============================================
-- Team Invites Schema & RPC Functions
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- TEAM INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL, -- Unique token for invite
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: specific user
  invited_email TEXT, -- Optional: invite via email
  accepted BOOLEAN DEFAULT false,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional: expiration
  max_uses INTEGER DEFAULT 1, -- How many times can this invite be used
  uses_count INTEGER DEFAULT 0, -- How many times it's been used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_team_invites_created_by ON team_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_team_invites_invited_user_id ON team_invites(invited_user_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites for teams they own or are captains of
CREATE POLICY "Users can view team invites" ON team_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_invites.team_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'captain')
        )
      )
    )
    OR invited_user_id = auth.uid()
  );

-- Team owners/captains can create invites
CREATE POLICY "Team owners/captains can create invites" ON team_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_invites.team_id
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('owner', 'captain')
        )
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate unique invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars
  token TEXT := '';
  i INTEGER;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 12-character token
    FOR i IN 1..12 LOOP
      token := token || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM team_invites WHERE invite_token = token) INTO token_exists;
    
    -- If token is unique, exit loop
    EXIT WHEN NOT token_exists;
    
    -- Reset token and try again
    token := '';
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- RPC: Create Team
CREATE OR REPLACE FUNCTION create_team(
  team_name TEXT,
  team_sport TEXT,
  team_max_players INTEGER,
  team_is_public BOOLEAN,
  team_description TEXT DEFAULT NULL,
  team_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  team_id UUID,
  name TEXT,
  sport TEXT,
  max_players INTEGER,
  owner_id UUID,
  owner_nickname TEXT,
  is_public BOOLEAN,
  description TEXT,
  location TEXT,
  invite_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_nickname TEXT;
  new_team_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
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

  -- Validate sport
  IF team_sport NOT IN ('football', 'basketball', 'tennis', 'padel') THEN
    RAISE EXCEPTION 'Invalid sport: %', team_sport;
  END IF;

  -- Validate max players
  IF team_max_players < 2 THEN
    RAISE EXCEPTION 'Max players must be at least 2';
  END IF;

  -- Create team
  INSERT INTO teams (
    name,
    sport,
    max_players,
    owner_id,
    owner_nickname,
    is_public,
    description,
    location
  )
  VALUES (
    team_name,
    team_sport,
    team_max_players,
    current_user_id,
    current_user_nickname,
    team_is_public,
    team_description,
    team_location
  )
  RETURNING id INTO new_team_id;

  -- Return team data
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.sport,
    t.max_players,
    t.owner_id,
    t.owner_nickname,
    t.is_public,
    t.description,
    t.location,
    t.invite_code,
    t.created_at
  FROM teams t
  WHERE t.id = new_team_id;
END;
$$;

-- RPC: Join Team (public or with invite token)
CREATE OR REPLACE FUNCTION join_team(
  target_team_id UUID DEFAULT NULL,
  invite_token_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  member_id UUID,
  team_id UUID,
  user_id UUID,
  user_nickname TEXT,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_nickname TEXT;
  target_team_uuid UUID;
  team_data RECORD;
  current_member_count INTEGER;
  is_public_team BOOLEAN;
  invite_data RECORD;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
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

  -- Determine team ID from token or direct parameter
  IF invite_token_param IS NOT NULL THEN
    -- Find team by invite token (either invite_code or invite_token)
    SELECT t.id, t.is_public INTO target_team_uuid, is_public_team
    FROM teams t
    WHERE t.invite_code = invite_token_param
    LIMIT 1;

    -- If not found by invite_code, check team_invites table
    IF target_team_uuid IS NULL THEN
      SELECT ti.team_id, t.is_public INTO target_team_uuid, is_public_team
      FROM team_invites ti
      JOIN teams t ON t.id = ti.team_id
      WHERE ti.invite_token = invite_token_param
        AND ti.accepted = false
        AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        AND (ti.max_uses IS NULL OR ti.uses_count < ti.max_uses)
      LIMIT 1;

      -- Mark invite as accepted if found
      IF target_team_uuid IS NOT NULL THEN
        UPDATE team_invites
        SET accepted = true,
            accepted_by = current_user_id,
            accepted_at = NOW(),
            uses_count = uses_count + 1
        WHERE invite_token = invite_token_param;
      END IF;
    END IF;

    IF target_team_uuid IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired invite token';
    END IF;
  ELSIF target_team_id IS NOT NULL THEN
    target_team_uuid := target_team_id;
    
    -- Check if team is public
    SELECT is_public INTO is_public_team
    FROM teams
    WHERE id = target_team_uuid;
  ELSE
    RAISE EXCEPTION 'Either team_id or invite_token must be provided';
  END IF;

  -- Get team data
  SELECT * INTO team_data
  FROM teams
  WHERE id = target_team_uuid;

  IF team_data IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Check if team is public (for direct join without token)
  IF target_team_id IS NOT NULL AND invite_token_param IS NULL THEN
    IF NOT team_data.is_public THEN
      RAISE EXCEPTION 'This is a private team. Please use an invite token.';
    END IF;
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = target_team_uuid
    AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this team';
  END IF;

  -- Check if team is full
  SELECT COUNT(*) INTO current_member_count
  FROM team_members
  WHERE team_id = target_team_uuid;

  IF current_member_count >= team_data.max_players THEN
    RAISE EXCEPTION 'Team is full';
  END IF;

  -- Add user to team
  INSERT INTO team_members (
    team_id,
    user_id,
    user_nickname,
    role
  )
  VALUES (
    target_team_uuid,
    current_user_id,
    current_user_nickname,
    'player'
  )
  RETURNING id, team_id, user_id, user_nickname, role, joined_at
  INTO member_id, team_id, user_id, user_nickname, role, joined_at;

  -- Return member data
  RETURN QUERY
  SELECT
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.user_nickname,
    tm.role,
    tm.joined_at
  FROM team_members tm
  WHERE tm.id = member_id;
END;
$$;

-- RPC: Create Team Invite
-- Default expiration: 7 days from now
-- Default max_uses: 1 (one-time use)
CREATE OR REPLACE FUNCTION create_team_invite(
  target_team_id UUID,
  invited_user_id_param UUID DEFAULT NULL,
  invited_email_param TEXT DEFAULT NULL,
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  max_uses_param INTEGER DEFAULT 1
)
RETURNS TABLE (
  invite_id UUID,
  team_id UUID,
  invite_token TEXT,
  invited_user_id UUID,
  invited_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  new_invite_token TEXT;
  team_owner_check BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user is owner or captain of team
  SELECT EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = target_team_id
    AND (
      t.owner_id = current_user_id
      OR EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = t.id
        AND tm.user_id = current_user_id
        AND tm.role IN ('owner', 'captain')
      )
    )
  ) INTO team_owner_check;

  IF NOT team_owner_check THEN
    RAISE EXCEPTION 'Only team owners or captains can create invites';
  END IF;

  -- Generate unique token
  new_invite_token := generate_invite_token();

  -- Set default expiration to 7 days if not provided
  IF expires_at_param IS NULL THEN
    expires_at_param := NOW() + INTERVAL '7 days';
  END IF;

  -- Create invite
  INSERT INTO team_invites (
    team_id,
    created_by,
    invite_token,
    invited_user_id,
    invited_email,
    expires_at,
    max_uses
  )
  VALUES (
    target_team_id,
    current_user_id,
    new_invite_token,
    invited_user_id_param,
    invited_email_param,
    expires_at_param,
    max_uses_param
  )
  RETURNING id, team_id, invite_token, invited_user_id, invited_email, expires_at, max_uses, created_at
  INTO invite_id, team_id, invite_token, invited_user_id, invited_email, expires_at, max_uses, created_at;

  -- Return invite data
  RETURN QUERY
  SELECT
    ti.id,
    ti.team_id,
    ti.invite_token,
    ti.invited_user_id,
    ti.invited_email,
    ti.expires_at,
    ti.max_uses,
    ti.created_at
  FROM team_invites ti
  WHERE ti.id = invite_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_team TO authenticated;
GRANT EXECUTE ON FUNCTION join_team TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_invite TO authenticated;

