-- ============================================
-- ADD ONBOARDING_COMPLETED FIELD TO USERS TABLE
-- ============================================

-- Add onboarding_completed column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Update existing users who have nickname and sports to completed
UPDATE users 
SET onboarding_completed = true 
WHERE nickname IS NOT NULL 
  AND nickname != '' 
  AND array_length(sports, 1) > 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

