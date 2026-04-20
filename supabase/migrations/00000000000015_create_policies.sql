-- =============================================================================
-- Migration: Create Policies Table
-- Date: 2024-05-09
-- Purpose: Active insurance policies issued from quotes
-- =============================================================================

CREATE TABLE public.policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  offer_id text NOT NULL,
  user_id uuid NOT NULL,
  insurer_id uuid NOT NULL,
  policy_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status = ANY (ARRAY['ACTIVE'::text, 'SUSPENDED'::text, 'CANCELLED'::text, 'EXPIRED'::text])),
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL CHECK (end_date > start_date),
  premium_amount numeric NOT NULL CHECK (premium_amount > 0),
  payment_frequency text NOT NULL DEFAULT 'ANNUAL' CHECK (payment_frequency = ANY (ARRAY['MONTHLY'::text, 'QUARTERLY'::text, 'ANNUAL'::text])),
  coverage_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_conditions text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT policies_pkey PRIMARY KEY (id),
  CONSTRAINT policies_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT policies_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.insurance_offers(id),
  CONSTRAINT policies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT policies_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS policies_user_idx ON public.policies (user_id);
CREATE INDEX IF NOT EXISTS policies_insurer_idx ON public.policies (insurer_id);
CREATE INDEX IF NOT EXISTS policies_status_idx ON public.policies (status);
CREATE INDEX IF NOT EXISTS policies_policy_number_idx ON public.policies (policy_number);
CREATE INDEX IF NOT EXISTS policies_end_date_idx ON public.policies (end_date);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_policies ON public.policies;
CREATE TRIGGER trg_set_updated_at_policies
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policies_user_select ON public.policies;
CREATE POLICY policies_user_select
  ON public.policies
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS policies_user_update ON public.policies;
CREATE POLICY policies_user_update
  ON public.policies
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS policies_insurer_insert ON public.policies;
CREATE POLICY policies_insurer_insert
  ON public.policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = policies.insurer_id
    )
  );

DROP POLICY IF EXISTS policies_insurer_select ON public.policies;
CREATE POLICY policies_insurer_select
  ON public.policies
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = policies.insurer_id
    )
  );

DROP POLICY IF EXISTS policies_insurer_update ON public.policies;
CREATE POLICY policies_insurer_update
  ON public.policies
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = policies.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = policies.insurer_id
    )
  );

DROP POLICY IF EXISTS policies_insurer_delete ON public.policies;
CREATE POLICY policies_insurer_delete
  ON public.policies
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = policies.insurer_id
    )
  );

DROP POLICY IF EXISTS policies_admin_insert ON public.policies;
CREATE POLICY policies_admin_insert
  ON public.policies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS policies_admin_select ON public.policies;
CREATE POLICY policies_admin_select
  ON public.policies
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS policies_admin_update ON public.policies;
CREATE POLICY policies_admin_update
  ON public.policies
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS policies_admin_delete ON public.policies;
CREATE POLICY policies_admin_delete
  ON public.policies
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO authenticated;
