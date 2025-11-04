-- =============================================================================
-- Migration: insurers & offers domain tables
-- Goal:
--   * Provide core catalog tables for insurers and their public offers
--   * Support public browsing (anon) with secure row-level policies
--   * Allow authenticated insurers/admins to manage their own offers
--   * Expose helper RPC used by the frontend to resolve insurer ownership
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Insurers (catalog of available companies)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  logo_url text,
  rating numeric,
  is_active boolean NOT NULL DEFAULT TRUE,
  contact_email text,
  phone text,
  website text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_insurers ON public.insurers;
CREATE TRIGGER trg_set_updated_at_insurers
  BEFORE UPDATE ON public.insurers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurers_public_select ON public.insurers;
CREATE POLICY insurers_public_select
  ON public.insurers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS insurers_manage_admin ON public.insurers;
CREATE POLICY insurers_manage_admin
  ON public.insurers
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Insurer accounts (link profiles to insurer entities)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurer_accounts (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_insurer_accounts ON public.insurer_accounts;
CREATE TRIGGER trg_set_updated_at_insurer_accounts
  BEFORE UPDATE ON public.insurer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.insurer_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurer_accounts_self_access ON public.insurer_accounts;
CREATE POLICY insurer_accounts_self_access
  ON public.insurer_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS insurer_accounts_manage_admin ON public.insurer_accounts;
CREATE POLICY insurer_accounts_manage_admin
  ON public.insurer_accounts
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS insurer_accounts_insurer_idx
  ON public.insurer_accounts (insurer_id);

-- ---------------------------------------------------------------------------
-- Insurance offers (public catalog displayed in comparison)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurance_offers (
  id text PRIMARY KEY DEFAULT CONCAT('offer_', encode(gen_random_bytes(6), 'hex')),
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.insurance_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price_min numeric,
  price_max numeric,
  coverage_amount numeric,
  deductible numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT TRUE,
  features text[] NOT NULL DEFAULT '{}',
  contract_type text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS insurance_offers_active_idx
  ON public.insurance_offers (is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS insurance_offers_insurer_idx
  ON public.insurance_offers (insurer_id);

DROP TRIGGER IF EXISTS trg_set_updated_at_insurance_offers ON public.insurance_offers;
CREATE TRIGGER trg_set_updated_at_insurance_offers
  BEFORE UPDATE ON public.insurance_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurance_offers_public_select ON public.insurance_offers;
CREATE POLICY insurance_offers_public_select
  ON public.insurance_offers
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.insurers i
      WHERE i.id = insurance_offers.insurer_id
        AND i.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS insurance_offers_owner_manage ON public.insurance_offers;
CREATE POLICY insurance_offers_owner_manage
  ON public.insurance_offers
  FOR ALL
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = insurance_offers.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = insurance_offers.insurer_id
    )
  );

-- ---------------------------------------------------------------------------
-- Helper RPC: resolve insurer linked to current profile
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_current_insurer_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ia.insurer_id
  FROM public.insurer_accounts ia
  WHERE ia.profile_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_insurer_id() TO authenticated;

