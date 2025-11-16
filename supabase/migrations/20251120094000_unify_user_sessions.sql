-- =============================================================================
-- Migration: Unify user_sessions schema
-- Date: 2025-11-20
-- Purpose:
--   * Align all migrations on the session_token based schema used by RPC helpers
--   * Remove legacy token_hash column and add refresh/device metadata columns
-- =============================================================================

-- Rename legacy column if it still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_sessions'
      AND column_name = 'token_hash'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_sessions RENAME COLUMN token_hash TO session_token';
  END IF;
END $$;

-- Ensure required columns exist
ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS session_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS device_fingerprint text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Enforce constraints and consistent defaults
ALTER TABLE public.user_sessions
  ALTER COLUMN session_token SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN last_accessed_at SET DEFAULT NOW(),
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN metadata SET NOT NULL;

-- Drop legacy updated_at tracking in favour of last_accessed_at column
DROP TRIGGER IF EXISTS trg_set_updated_at_user_sessions ON public.user_sessions;
ALTER TABLE public.user_sessions DROP COLUMN IF EXISTS updated_at;

-- Ensure session identifiers stay unique
DROP INDEX IF EXISTS idx_user_sessions_token;
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_session_token_key
  ON public.user_sessions (session_token);
CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_refresh_token_key
  ON public.user_sessions (refresh_token);
