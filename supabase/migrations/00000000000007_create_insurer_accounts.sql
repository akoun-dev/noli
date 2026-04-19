-- =============================================================================
-- Migration: Create Insurer Accounts Table
-- Date: 2024-05-09
-- Purpose: Link profiles to insurer companies
-- =============================================================================

CREATE TABLE public.insurer_accounts (
  profile_id uuid NOT NULL,
  insurer_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insurer_accounts_pkey PRIMARY KEY (profile_id),
  CONSTRAINT insurer_accounts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT insurer_accounts_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS insurer_accounts_insurer_idx ON public.insurer_accounts (insurer_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurer_accounts ON public.insurer_accounts;
CREATE TRIGGER trg_set_updated_at_insurer_accounts
  BEFORE UPDATE ON public.insurer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.insurer_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurer_accounts_self_access ON public.insurer_accounts;
CREATE POLICY insurer_accounts_self_access
  ON public.insurer_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS insurer_accounts_admin_manage ON public.insurer_accounts;
CREATE POLICY insurer_accounts_admin_manage
  ON public.insurer_accounts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT ON public.insurer_accounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurer_accounts TO authenticated;
