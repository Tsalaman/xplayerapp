-- ============================================
-- Chat Schema for Chat Messages
-- ============================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CHATS TABLE
-- ============================================
-- Represents a chat conversation between users
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL, -- Array of user IDs in the chat
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure at least 2 participants
  CONSTRAINT check_participants CHECK (array_length(participant_ids, 1) >= 2)
);

-- ============================================
-- CHAT_MESSAGES TABLE
-- ============================================
-- Stores individual messages in chats
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_nickname TEXT NOT NULL,
  sender_avatar TEXT, -- Profile picture URL
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure text is not empty
  CONSTRAINT check_text_not_empty CHECK (length(trim(text)) > 0)
);

-- ============================================
-- INDEXES
-- ============================================
-- Index for cursor pagination: created_at DESC, id ASC
CREATE INDEX idx_chat_messages_chat_created_id ON chat_messages(chat_id, created_at DESC, id ASC);

-- Index for getting chat participants
CREATE INDEX idx_chats_participants ON chats USING GIN(participant_ids);

-- Index for updating chat updated_at
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chats: Users can read chats they participate in
CREATE POLICY "Users can read their chats"
  ON chats FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

-- Chats: Users can create chats they participate in
CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Chat Messages: Users can read messages in chats they participate in
CREATE POLICY "Users can read messages in their chats"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND auth.uid() = ANY(chats.participant_ids)
    )
  );

-- Chat Messages: Users can send messages in chats they participate in
CREATE POLICY "Users can send messages in their chats"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_messages.chat_id
      AND auth.uid() = ANY(chats.participant_ids)
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================
-- Function to get or create a chat between two users
CREATE OR REPLACE FUNCTION get_or_create_chat(user_id_1 UUID, user_id_2 UUID)
RETURNS UUID AS $$
DECLARE
  chat_uuid UUID;
BEGIN
  -- Try to find existing chat
  SELECT id INTO chat_uuid
  FROM chats
  WHERE participant_ids @> ARRAY[user_id_1, user_id_2]
    AND array_length(participant_ids, 1) = 2
  LIMIT 1;
  
  -- If not found, create new chat
  IF chat_uuid IS NULL THEN
    INSERT INTO chats (participant_ids)
    VALUES (ARRAY[user_id_1, user_id_2])
    RETURNING id INTO chat_uuid;
  END IF;
  
  RETURN chat_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for cursor pagination of messages
CREATE OR REPLACE FUNCTION get_chat_messages_paginated(
  p_chat_id UUID,
  cursor_created_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  chat_id UUID,
  sender_id UUID,
  sender_nickname TEXT,
  sender_avatar TEXT,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.chat_id,
    cm.sender_id,
    cm.sender_nickname,
    cm.sender_avatar,
    cm.text,
    cm.created_at
  FROM chat_messages cm
  WHERE cm.chat_id = p_chat_id
    AND (
      cursor_created_at IS NULL
      OR cursor_id IS NULL
      OR (cm.created_at, cm.id) < (cursor_created_at, cursor_id)
    )
  ORDER BY cm.created_at DESC, cm.id ASC
  LIMIT limit_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================
-- Update chat updated_at when a message is sent
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_updated_at();

