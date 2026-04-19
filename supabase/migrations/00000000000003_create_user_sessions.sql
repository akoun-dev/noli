-- =============================================================================
-- Migration: Create User Sessions Table
-- Date: 2024-05-09
-- Purpose: Store user session information for authentication
-- =============================================================================

CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  ip_address inet,
  user_agent text,
  refresh_token text,
  device_fingerprint text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_user_sessions ON public.user_sessions;
CREATE TRIGGER trg_set_updated_at_user_sessions
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_sessions_self_access ON public.user_sessions;
CREATE POLICY user_sessions_self_access
  ON public.user_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Grants
GRANT ALL ON public.user_sessions TO authenticated, service_role;
