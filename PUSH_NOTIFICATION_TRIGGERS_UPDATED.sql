-- ============================================
-- PUSH NOTIFICATION TRIGGERS - UPDATED FOR EDGE FUNCTION
-- ============================================
-- These triggers use the Supabase Edge Function send_fcm_push
-- instead of calling FCM directly
-- ============================================

-- Enable http extension for sending HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================
-- FUNCTION: Send Push Notification via Edge Function
-- ============================================
CREATE OR REPLACE FUNCTION send_push_notification(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  function_url TEXT;
  response http_response;
BEGIN
  -- Edge Function URL
  function_url := 'https://ueadvfdlichltivzjoeq.functions.supabase.co/send_fcm_push';
  
  -- Call the Edge Function
  SELECT * INTO response
  FROM http_post(
    function_url,
    json_build_object(
      'token', p_token,
      'title', p_title,
      'body', p_body
    )::text,
    'application/json'::text
  );
  
  IF response.status NOT BETWEEN 200 AND 299 THEN
    RAISE WARNING 'Push notification failed: Status % - %', response.status, response.content;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: New Chat Message
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  receiver_token TEXT;
BEGIN
  -- Get push token of message receiver
  -- Try from user_push_tokens first, then fallback to users.push_token
  SELECT token INTO receiver_token
  FROM user_push_tokens
  WHERE user_id = NEW.receiver_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Fallback to users.push_token if not found in user_push_tokens
  IF receiver_token IS NULL THEN
    SELECT push_token INTO receiver_token
    FROM users
    WHERE id = NEW.receiver_id;
  END IF;
  
  IF receiver_token IS NOT NULL THEN
    PERFORM send_push_notification(
      receiver_token,
      'New Message',
      COALESCE(NEW.message, 'You have a new message'),
      json_build_object(
        'type', 'chat_message',
        'chat_id', NEW.chat_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat_messages
DROP TRIGGER IF EXISTS message_push_trigger ON chat_messages;
CREATE TRIGGER message_push_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- ============================================
-- TRIGGER: New Notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_token TEXT;
  notification_title TEXT;
BEGIN
  -- Get push token of notification receiver
  -- Try from user_push_tokens first, then fallback to users.push_token
  SELECT token INTO user_token
  FROM user_push_tokens
  WHERE user_id = NEW.user_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Fallback to users.push_token if not found in user_push_tokens
  IF user_token IS NULL THEN
    SELECT push_token INTO user_token
    FROM users
    WHERE id = NEW.user_id;
  END IF;
  
  -- Set notification title based on type
  notification_title := CASE NEW.type
    WHEN 'match_invite' THEN 'Match Invite'
    WHEN 'team_invite' THEN 'Team Invite'
    WHEN 'match_result' THEN 'Match Result'
    WHEN 'tournament' THEN 'Tournament Update'
    ELSE 'XPlayer'
  END;
  
  IF user_token IS NOT NULL THEN
    PERFORM send_push_notification(
      user_token,
      notification_title,
      NEW.message,
      json_build_object(
        'type', NEW.type,
        'notification_id', NEW.id,
        'link', COALESCE(NEW.link, ''),
        'metadata', COALESCE(NEW.metadata, '{}'::jsonb)
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS notification_push_trigger ON notifications;
CREATE TRIGGER notification_push_trigger
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION notify_new_notification();

-- ============================================
-- TRIGGER: New Match Invite (if match_invites table exists)
-- ============================================
CREATE OR REPLACE FUNCTION notify_match_invite()
RETURNS TRIGGER AS $$
DECLARE
  receiver_token TEXT;
  inviter_name TEXT;
BEGIN
  -- Get push token of match invite receiver
  SELECT token INTO receiver_token
  FROM user_push_tokens
  WHERE user_id = NEW.invitee_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF receiver_token IS NULL THEN
    SELECT push_token INTO receiver_token
    FROM users
    WHERE id = NEW.invitee_id;
  END IF;
  
  -- Get inviter name
  SELECT nickname INTO inviter_name
  FROM users
  WHERE id = NEW.inviter_id;
  
  IF receiver_token IS NOT NULL THEN
    PERFORM send_push_notification(
      receiver_token,
      'New Match Invite',
      format('You have a new match invite from %s', COALESCE(inviter_name, 'a player')),
      json_build_object(
        'type', 'match_invite',
        'match_id', NEW.match_id,
        'inviter_id', NEW.inviter_id,
        'invite_id', NEW.id
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match_invites (uncomment if table exists)
-- DROP TRIGGER IF EXISTS match_invite_push_trigger ON match_invites;
-- CREATE TRIGGER match_invite_push_trigger
-- AFTER INSERT ON match_invites
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_match_invite();

-- ============================================
-- NOTES
-- ============================================
-- 1. This uses the Supabase Edge Function: send_fcm_push
-- 2. Function URL: https://ueadvfdlichltivzjoeq.functions.supabase.co/send_fcm_push
-- 3. The Edge Function uses FCM Server Key from secrets
-- 4. Tokens are checked from user_push_tokens table first, then fallback to users.push_token
-- 5. Make sure the http extension is enabled: CREATE EXTENSION IF NOT EXISTS http;
-- 6. To update the function URL, change the function_url variable in send_push_notification()

