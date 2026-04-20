-- =============================================================================
-- Migration: Create Claims Table
-- Date: 2026-04-20
-- Purpose: Manage insurance claims for policies
-- =============================================================================

CREATE TYPE public.claim_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED');
CREATE TYPE public.claim_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE public.claims (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  user_id uuid NOT NULL,
  insurer_id uuid NOT NULL,
  claim_number text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  incident_date timestamp with time zone NOT NULL,
  reported_date timestamp with time zone NOT NULL DEFAULT now(),
  status public.claim_status NOT NULL DEFAULT 'SUBMITTED',
  priority public.claim_priority NOT NULL DEFAULT 'MEDIUM',
  estimated_amount numeric,
  approved_amount numeric,
  paid_amount numeric,
  current_stage text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT claims_pkey PRIMARY KEY (id),
  CONSTRAINT claims_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE,
  CONSTRAINT claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT claims_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS claims_policy_idx ON public.claims (policy_id);
CREATE INDEX IF NOT EXISTS claims_insurer_idx ON public.claims (insurer_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON public.claims (status);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_claims ON public.claims;
CREATE TRIGGER trg_set_updated_at_claims
  BEFORE UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- User can see their own claims
CREATE POLICY claims_user_select ON public.claims
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Insurer can see claims for their policies
CREATE POLICY claims_insurer_select ON public.claims
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
      AND ia.insurer_id = claims.insurer_id
    )
  );

CREATE POLICY claims_insurer_update ON public.claims
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
      AND ia.insurer_id = claims.insurer_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated;
