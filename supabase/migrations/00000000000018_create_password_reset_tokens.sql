-- =============================================================================
-- Migration: Create Password Reset Tokens Table
-- Date: 2024-05-09
-- Purpose: Store password reset tokens
-- =============================================================================

CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON public.password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_idx ON public.password_reset_tokens (expires_at);
CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON public.password_reset_tokens (token);

-- RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS password_reset_tokens_no_direct_access ON public.password_reset_tokens;
CREATE POLICY password_reset_tokens_no_direct_access
  ON public.password_reset_tokens
  FOR ALL
  TO PUBLIC
  USING (FALSE)
  WITH CHECK (FALSE);

-- Grants
GRANT SELECT ON public.password_reset_tokens TO authenticated, service_role;
