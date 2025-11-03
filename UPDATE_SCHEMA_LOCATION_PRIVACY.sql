-- ============================================
-- Add Location Privacy Field to Users Table
-- ============================================
-- Run this in Supabase SQL Editor

-- Add location_privacy field
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_privacy TEXT DEFAULT 'exact' CHECK (location_privacy IN ('exact', 'coarse', 'hidden'));

-- Create index for location privacy queries
CREATE INDEX IF NOT EXISTS idx_users_location_privacy ON users(location_privacy) WHERE location_privacy IS NOT NULL;

