-- =============================================================================
-- Migration: Create Insurance Offers Table
-- Date: 2024-05-09
-- Purpose: Public catalog of insurance offers from insurers
-- =============================================================================

CREATE TABLE public.insurance_offers (
  id text NOT NULL DEFAULT concat('offer_', substr(md5((random())::text), 1, 12)),
  insurer_id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  description text,
  price_min numeric,
  price_max numeric,
  coverage_amount numeric,
  deductible numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  features text[] NOT NULL DEFAULT '{}'::text[],
  contract_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insurance_offers_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_offers_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE,
  CONSTRAINT insurance_offers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.insurance_categories(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS insurance_offers_active_idx ON public.insurance_offers (is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS insurance_offers_insurer_idx ON public.insurance_offers (insurer_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurance_offers ON public.insurance_offers;
CREATE TRIGGER trg_set_updated_at_insurance_offers
  BEFORE UPDATE ON public.insurance_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
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
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = insurance_offers.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = auth.uid()
        AND ia.insurer_id = insurance_offers.insurer_id
    )
  );

-- Grants
GRANT ALL ON public.insurance_offers TO authenticated, service_role;
GRANT SELECT ON public.insurance_offers TO anon;
