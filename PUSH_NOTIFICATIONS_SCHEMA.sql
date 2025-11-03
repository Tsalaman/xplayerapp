-- ============================================
-- PUSH NOTIFICATIONS SCHEMA
-- ============================================
-- Table for storing user push notification tokens
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON public.user_push_tokens(token);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "user_push_tokens_select_own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "user_push_tokens_insert_own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "user_push_tokens_update_own" ON public.user_push_tokens;
DROP POLICY IF EXISTS "user_push_tokens_delete_own" ON public.user_push_tokens;

CREATE POLICY "user_push_tokens_select_own" ON public.user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_push_tokens_insert_own" ON public.user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_push_tokens_update_own" ON public.user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_push_tokens_delete_own" ON public.user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_user_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_push_tokens_updated_at
  BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_push_tokens_updated_at();

