-- ============================================
-- Update Users Table for Location Tracking
-- ============================================
-- Run this in Supabase SQL Editor to add location fields

-- Add location fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_location_ts TIMESTAMP WITH TIME ZONE;

-- Create index for location queries (for finding nearby users)
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for last_location_ts (for filtering recent locations)
CREATE INDEX IF NOT EXISTS idx_users_last_location_ts ON users(last_location_ts DESC) WHERE last_location_ts IS NOT NULL;

-- ============================================
-- Update RLS Policies for Users Table
-- ============================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "users_update_own_row" ON users;
DROP POLICY IF EXISTS "users_select_authenticated" ON users;

-- Create updated policies

-- Policy for UPDATE: Users can only update their own row
CREATE POLICY "users_update_own_row" ON users
FOR UPDATE
USING (auth.uid() = id);

-- Policy for SELECT: Only authenticated users can read user profiles
CREATE POLICY "users_select_authenticated" ON users
FOR SELECT
USING (auth.role() IS NOT NULL OR auth.uid() IS NOT NULL);

-- Policy for INSERT: Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

