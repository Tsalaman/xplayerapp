-- ============================================
-- Team Roles & Permissions RPC Functions
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- RPC: Update Member Role
-- ============================================
-- Permissions:
-- - Owner: Can promote/demote captain/player
-- - Captain: Can promote player to captain (but not demote captain)
CREATE OR REPLACE FUNCTION update_member_role(
  target_team_id UUID,
  target_member_id UUID,
  new_role TEXT -- 'captain' or 'player'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  target_member_role TEXT;
  team_owner_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate role
  IF new_role NOT IN ('captain', 'player') THEN
    RAISE EXCEPTION 'Invalid role. Must be captain or player';
  END IF;

  -- Get team owner
  SELECT owner_id INTO team_owner_id
  FROM teams
  WHERE id = target_team_id;

  IF team_owner_id IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Get current user's role
  SELECT role INTO current_user_role
  FROM team_members
  WHERE team_id = target_team_id
    AND user_id = current_user_id;

  -- Check if user is owner or captain
  IF current_user_role NOT IN ('owner', 'captain') THEN
    RAISE EXCEPTION 'Only team owner or captain can update member roles';
  END IF;

  -- Get target member's current role
  SELECT role INTO target_member_role
  FROM team_members
  WHERE id = target_member_id
    AND team_id = target_team_id;

  IF target_member_role IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Cannot change owner role
  IF target_member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot change owner role';
  END IF;

  -- Captain can only promote player to captain (cannot demote captain)
  IF current_user_role = 'captain' AND target_member_role = 'captain' THEN
    RAISE EXCEPTION 'Captains cannot demote other captains';
  END IF;

  -- Owner can promote/demote captain/player
  -- Captain can only promote player to captain
  IF current_user_role = 'captain' AND new_role = 'player' THEN
    RAISE EXCEPTION 'Captains cannot demote members';
  END IF;

  -- Update role
  UPDATE team_members
  SET role = new_role
  WHERE id = target_member_id
    AND team_id = target_team_id;

  RETURN true;
END;
$$;

-- ============================================
-- RPC: Remove Member
-- ============================================
-- Permissions:
-- - Owner: Can remove anyone (except themselves)
-- - Captain: Can only remove players (not owner/captain)
CREATE OR REPLACE FUNCTION remove_member(
  target_team_id UUID,
  target_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  target_member_role TEXT;
  team_owner_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get team owner
  SELECT owner_id INTO team_owner_id
  FROM teams
  WHERE id = target_team_id;

  IF team_owner_id IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Get current user's role
  SELECT role INTO current_user_role
  FROM team_members
  WHERE team_id = target_team_id
    AND user_id = current_user_id;

  -- Check if user is owner or captain
  IF current_user_role NOT IN ('owner', 'captain') THEN
    RAISE EXCEPTION 'Only team owner or captain can remove members';
  END IF;

  -- Get target member's role
  SELECT role INTO target_member_role
  FROM team_members
  WHERE id = target_member_id
    AND team_id = target_team_id;

  IF target_member_role IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Cannot remove owner
  IF target_member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove team owner';
  END IF;

  -- Captain can only remove players (not other captains)
  IF current_user_role = 'captain' AND target_member_role IN ('owner', 'captain') THEN
    RAISE EXCEPTION 'Captains can only remove players';
  END IF;

  -- Remove member
  DELETE FROM team_members
  WHERE id = target_member_id
    AND team_id = target_team_id;

  RETURN true;
END;
$$;

-- ============================================
-- RPC: Transfer Ownership
-- ============================================
-- Permissions:
-- - Only owner can transfer ownership
-- - Cannot transfer to non-member
CREATE OR REPLACE FUNCTION transfer_ownership(
  target_team_id UUID,
  new_owner_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  team_owner_id UUID;
  new_owner_user_id UUID;
  new_owner_nickname TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get team owner
  SELECT owner_id INTO team_owner_id
  FROM teams
  WHERE id = target_team_id;

  IF team_owner_id IS NULL THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Check if user is owner
  IF current_user_id != team_owner_id THEN
    RAISE EXCEPTION 'Only team owner can transfer ownership';
  END IF;

  -- Get new owner's user_id and nickname
  SELECT user_id, user_nickname INTO new_owner_user_id, new_owner_nickname
  FROM team_members
  WHERE id = new_owner_member_id
    AND team_id = target_team_id;

  IF new_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Member not found or not part of team';
  END IF;

  -- Cannot transfer to self
  IF new_owner_user_id = current_user_id THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself';
  END IF;

  -- Update team owner
  UPDATE teams
  SET owner_id = new_owner_user_id,
      owner_nickname = new_owner_nickname
  WHERE id = target_team_id;

  -- Update old owner's role to player
  UPDATE team_members
  SET role = 'player'
  WHERE team_id = target_team_id
    AND user_id = current_user_id;

  -- Update new owner's role to owner
  UPDATE team_members
  SET role = 'owner'
  WHERE team_id = target_team_id
    AND user_id = new_owner_user_id;

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_member_role TO authenticated;
GRANT EXECUTE ON FUNCTION remove_member TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_ownership TO authenticated;

