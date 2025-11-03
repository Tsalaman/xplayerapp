-- ============================================
-- Fix RLS Policies for User Profile Creation
-- ============================================
-- Run this in Supabase SQL Editor if you get RLS errors

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Recreate policies with proper auth checks
-- Everyone can read user profiles (for public profiles)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (important for signup)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Alternative: Allow inserts during signup (if auth.uid() matches)
-- If the above doesn't work, try this:
-- CREATE POLICY "Users can insert own profile" ON users
--   FOR INSERT WITH CHECK (auth.uid()::text = id::text);

