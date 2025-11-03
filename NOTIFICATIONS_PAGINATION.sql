-- ============================================
-- Notifications Pagination RPC Function
-- ============================================
-- Run this in Supabase SQL Editor

-- Function to get user's notifications with cursor pagination
CREATE OR REPLACE FUNCTION get_notifications_paginated(
  user_id_filter UUID,
  cursor_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  type_filter TEXT DEFAULT NULL,
  unread_only BOOLEAN DEFAULT false,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.type,
    n.message,
    n.link,
    n.read,
    n.metadata,
    n.created_at,
    n.updated_at
  FROM notifications n
  WHERE
    n.user_id = user_id_filter
    -- Filter by type (if provided)
    AND (type_filter IS NULL OR n.type = type_filter)
    -- Filter by read status (if unread_only)
    AND (NOT unread_only OR n.read = false)
    -- Cursor pagination: WHERE cursor_created_at IS NULL
    --                    OR (created_at < cursor_created_at)
    --                    OR (created_at = cursor_created_at AND id > cursor_id)
    AND (
      cursor_created_at IS NULL
      OR (n.created_at < cursor_created_at)
      OR (n.created_at = cursor_created_at AND n.id > cursor_id)
    )
  ORDER BY n.created_at DESC, n.id ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_notifications_paginated TO authenticated;

