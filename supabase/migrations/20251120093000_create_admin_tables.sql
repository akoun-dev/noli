-- =============================================================================
-- Migration: Ensure insurers, quote_offers and policies exist for admin views
-- Date: 2025-11-20
-- Purpose:
--   * Provide the missing catalog and workflow tables referenced by Admin pages
--   * Harden their Row Level Security policies
--   * Add the indexes/views required by analytics dashboards
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Insurers catalog
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  rating numeric,
  is_active boolean NOT NULL DEFAULT true,
  contact_email text,
  phone text,
  website text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.insurers
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true;

DROP TRIGGER IF EXISTS trg_set_updated_at_insurers ON public.insurers;
CREATE TRIGGER trg_set_updated_at_insurers
  BEFORE UPDATE ON public.insurers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurers_public_select ON public.insurers;
DROP POLICY IF EXISTS insurers_public_active_select ON public.insurers;
CREATE POLICY insurers_public_active_select
  ON public.insurers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS insurers_manage_admin ON public.insurers;
DROP POLICY IF EXISTS insurers_admin_manage ON public.insurers;
CREATE POLICY insurers_admin_manage
  ON public.insurers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS insurers_active_idx
  ON public.insurers (is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS insurers_name_idx
  ON public.insurers (name);

GRANT SELECT ON public.insurers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurers TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Quote offers generated from insurer catalogs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quote_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id text NOT NULL REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price > 0),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quote_offers
  ALTER COLUMN status SET DEFAULT 'PENDING',
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

DROP TRIGGER IF EXISTS trg_set_updated_at_quote_offers ON public.quote_offers;
CREATE TRIGGER trg_set_updated_at_quote_offers
  BEFORE UPDATE ON public.quote_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS quote_offers_quote_idx
  ON public.quote_offers (quote_id);
CREATE INDEX IF NOT EXISTS quote_offers_insurer_idx
  ON public.quote_offers (insurer_id);
CREATE INDEX IF NOT EXISTS quote_offers_status_idx
  ON public.quote_offers (status);

ALTER TABLE public.quote_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to view their own quote offers" ON public.quote_offers;
DROP POLICY IF EXISTS "Allow insurers to manage their own offers" ON public.quote_offers;
DROP POLICY IF EXISTS "Allow admins to view all quote offers" ON public.quote_offers;
DROP POLICY IF EXISTS quote_offers_read_own ON public.quote_offers;
DROP POLICY IF EXISTS quote_offers_insert_admin_insurer ON public.quote_offers;
DROP POLICY IF EXISTS quote_offers_update_own ON public.quote_offers;
DROP POLICY IF EXISTS quote_offers_admin_all ON public.quote_offers;
DROP POLICY IF EXISTS quote_offers_insurer_read ON public.quote_offers;

CREATE POLICY quote_offers_user_select
  ON public.quote_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_offers.quote_id
        AND q.user_id = auth.uid()
    )
  );

CREATE POLICY quote_offers_insurer_manage
  ON public.quote_offers
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = quote_offers.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = quote_offers.insurer_id
    )
  );

CREATE POLICY quote_offers_admin_read
  ON public.quote_offers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_offers TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Policies issued from quote offers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id text NOT NULL REFERENCES public.insurance_offers(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  policy_number text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL CHECK (end_date > start_date),
  premium_amount numeric NOT NULL CHECK (premium_amount > 0),
  payment_frequency text NOT NULL DEFAULT 'ANNUAL'
    CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
  coverage_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms_conditions text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'policies_policy_number_key'
      AND conrelid = 'public.policies'::regclass
  ) THEN
    ALTER TABLE public.policies
      ADD CONSTRAINT policies_policy_number_key UNIQUE (policy_number);
  END IF;
END $$;

ALTER TABLE public.policies
  ALTER COLUMN status SET DEFAULT 'ACTIVE',
  ALTER COLUMN payment_frequency SET DEFAULT 'ANNUAL',
  ALTER COLUMN coverage_details SET DEFAULT '{}'::jsonb;

DROP TRIGGER IF EXISTS trg_set_updated_at_policies ON public.policies;
CREATE TRIGGER trg_set_updated_at_policies
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS policies_user_idx
  ON public.policies (user_id);
CREATE INDEX IF NOT EXISTS policies_insurer_idx
  ON public.policies (insurer_id);
CREATE INDEX IF NOT EXISTS policies_status_idx
  ON public.policies (status);
CREATE INDEX IF NOT EXISTS policies_policy_number_idx
  ON public.policies (policy_number);
CREATE INDEX IF NOT EXISTS policies_end_date_idx
  ON public.policies (end_date);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to view their own policies" ON public.policies;
DROP POLICY IF EXISTS "Allow users to update their own policies" ON public.policies;
DROP POLICY IF EXISTS "Allow insurers to manage their own policies" ON public.policies;
DROP POLICY IF EXISTS "Allow admins to view all policies" ON public.policies;
DROP POLICY IF EXISTS "Allow admins to manage all policies" ON public.policies;
DROP POLICY IF EXISTS policies_read_own ON public.policies;
DROP POLICY IF EXISTS policies_insert_admin_insurer ON public.policies;
DROP POLICY IF EXISTS policies_update_own ON public.policies;
DROP POLICY IF EXISTS policies_admin_all ON public.policies;

CREATE POLICY policies_user_select
  ON public.policies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY policies_user_update
  ON public.policies
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY policies_insurer_manage
  ON public.policies
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = policies.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = policies.insurer_id
    )
  );

CREATE POLICY policies_admin_all
  ON public.policies
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Policy analytics view
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.policy_stats_view AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_policies,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_policies,
  COUNT(*) FILTER (WHERE status = 'SUSPENDED') AS suspended_policies,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_policies,
  COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired_policies,
  SUM(premium_amount) AS total_premium,
  AVG(premium_amount) AS avg_premium
FROM public.policies
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

GRANT SELECT ON public.policy_stats_view TO authenticated;
