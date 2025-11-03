-- ============================================
-- Leave Team RPC Function
-- ============================================
-- Run this in Supabase SQL Editor

-- RPC: Leave Team
CREATE OR REPLACE FUNCTION leave_team(
  target_team_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  member_role TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Get member role
  SELECT role INTO member_role
  FROM team_members
  WHERE team_id = target_team_id
    AND user_id = current_user_id;

  -- Check if user is a member
  IF member_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this team';
  END IF;

  -- Owner cannot leave (must delete team or transfer ownership)
  IF member_role = 'owner' THEN
    RAISE EXCEPTION 'Team owner cannot leave. Delete the team or transfer ownership.';
  END IF;

  -- Remove user from team
  DELETE FROM team_members
  WHERE team_id = target_team_id
    AND user_id = current_user_id;

  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION leave_team TO authenticated;

