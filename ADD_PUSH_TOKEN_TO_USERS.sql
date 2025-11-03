-- ============================================
-- ADD PUSH_TOKEN COLUMN TO USERS TABLE
-- ============================================
-- This adds a push_token column to the users table
-- for compatibility with simpler push notification setup
-- ============================================

-- Add push_token column to users table (if it doesn't exist)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- Note: This column is optional if you're using the user_push_tokens table
-- The user_push_tokens table allows multiple devices per user
-- The push_token column in users table is for single device per user (simpler setup)

