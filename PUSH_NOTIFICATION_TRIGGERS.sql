-- ============================================
-- PUSH NOTIFICATION TRIGGERS FOR SUPABASE
-- ============================================
-- These triggers automatically send push notifications
-- when certain events occur (e.g., new message, match invite)
-- ============================================

-- Enable http extension for sending HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================
-- FUNCTION: Send Push Notification
-- ============================================
CREATE OR REPLACE FUNCTION send_push_notification(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  fcm_key TEXT;
  response http_response;
BEGIN
  -- Get FCM server key from vault
  SELECT decrypted_secret INTO fcm_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'fcm_server_key';
  
  IF fcm_key IS NULL THEN
    RAISE WARNING 'FCM server key not found in vault';
    RETURN;
  END IF;
  
  -- For Expo Push Notifications, use Expo API
  -- Note: If using FCM directly, use FCM API endpoint
  -- This example uses Expo Push Notification service
  SELECT * INTO response
  FROM http_post(
    'https://exp.host/--/api/v2/push/send',
    json_build_object(
      'to', p_token,
      'title', p_title,
      'body', p_body,
      'data', p_data,
      'sound', 'default',
      'priority', 'high'
    )::text,
    'application/json'::text
  );
  
  IF response.status != 200 THEN
    RAISE WARNING 'Push notification failed: %', response.content;
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
  SELECT push_token INTO receiver_token
  FROM users
  WHERE id = NEW.receiver_id;
  
  IF receiver_token IS NOT NULL THEN
    PERFORM send_push_notification(
      receiver_token,
      'New Message',
      NEW.message,
      json_build_object(
        'type', 'chat_message',
        'chat_id', NEW.chat_id,
        'sender_id', NEW.sender_id
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
-- TRIGGER: New Match Invite
-- ============================================
CREATE OR REPLACE FUNCTION notify_match_invite()
RETURNS TRIGGER AS $$
DECLARE
  receiver_token TEXT;
BEGIN
  -- Get push token of match invite receiver
  SELECT push_token INTO receiver_token
  FROM users
  WHERE id = NEW.invitee_id;
  
  IF receiver_token IS NOT NULL THEN
    PERFORM send_push_notification(
      receiver_token,
      'New Match Invite',
      format('You have a new match invite from %s', 
        (SELECT nickname FROM users WHERE id = NEW.inviter_id)),
      json_build_object(
        'type', 'match_invite',
        'match_id', NEW.match_id,
        'inviter_id', NEW.inviter_id
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match_invites (if table exists)
-- DROP TRIGGER IF EXISTS match_invite_push_trigger ON match_invites;
-- CREATE TRIGGER match_invite_push_trigger
-- AFTER INSERT ON match_invites
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_match_invite();

-- ============================================
-- TRIGGER: New Notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_token TEXT;
BEGIN
  -- Get push token of notification receiver
  SELECT push_token INTO user_token
  FROM users
  WHERE id = NEW.user_id;
  
  IF user_token IS NOT NULL THEN
    PERFORM send_push_notification(
      user_token,
      'XPlayer',
      NEW.message,
      json_build_object(
        'type', 'notification',
        'notification_id', NEW.id,
        'link', COALESCE(NEW.link, '')
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
-- NOTES
-- ============================================
-- 1. Make sure FCM server key is stored in vault (run FCM_SERVER_KEY_VAULT.sql first)
-- 2. The http extension must be enabled in Supabase
-- 3. This uses Expo Push Notification service (exp.host)
-- 4. For direct FCM usage, replace exp.host with fcm.googleapis.com/v1/projects/{project-id}/messages:send
-- 5. Adjust the trigger tables based on your actual schema

