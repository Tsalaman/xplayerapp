-- ============================================
-- STORE FCM SERVER KEY IN SUPABASE VAULT
-- ============================================
-- This stores the FCM server key securely in Supabase vault
-- for use in database triggers and functions
-- ============================================

-- Enable vault extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store FCM server key in vault
-- Note: Replace 'BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE' 
-- with your actual FCM server key
SELECT vault.create_secret(
  'fcm_server_key',
  'BCxin8UDEUu29_PbWLULK_pFh96L0p_-AKSZB6RycSwGFXvzdjmORnQ2vGiAiw3Z8zRi50ep6YmG4AI3TcJVCcE'
);

-- Verify the secret was created
SELECT name FROM vault.secrets WHERE name = 'fcm_server_key';

-- ============================================
-- USAGE IN FUNCTIONS
-- ============================================
-- To retrieve the FCM server key in a function:
-- SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'fcm_server_key';
--
-- Example usage in a trigger function:
-- DECLARE
--   fcm_key TEXT;
-- BEGIN
--   SELECT decrypted_secret INTO fcm_key 
--   FROM vault.decrypted_secrets 
--   WHERE name = 'fcm_server_key';
--   -- Use fcm_key to send push notifications
-- END;

