-- =============================================================================
-- Migration: Create Quote Offers Table
-- Date: 2024-05-09
-- Purpose: Link quote requests to insurance offers from insurers
-- =============================================================================

CREATE TABLE public.quote_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  offer_id text NOT NULL,
  insurer_id uuid NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'EXPIRED'::text])),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quote_offers_pkey PRIMARY KEY (id),
  CONSTRAINT quote_offers_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_offers_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  CONSTRAINT quote_offers_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS quote_offers_quote_idx ON public.quote_offers (quote_id);
CREATE INDEX IF NOT EXISTS quote_offers_insurer_idx ON public.quote_offers (insurer_id);
CREATE INDEX IF NOT EXISTS quote_offers_status_idx ON public.quote_offers (status);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_quote_offers ON public.quote_offers;
CREATE TRIGGER trg_set_updated_at_quote_offers
  BEFORE UPDATE ON public.quote_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.quote_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_offers_user_select ON public.quote_offers;
CREATE POLICY quote_offers_user_select
  ON public.quote_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_offers.quote_id
        AND q.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS quote_offers_insurer_insert ON public.quote_offers;
CREATE POLICY quote_offers_insurer_insert
  ON public.quote_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = quote_offers.insurer_id
    )
  );

DROP POLICY IF EXISTS quote_offers_insurer_select ON public.quote_offers;
CREATE POLICY quote_offers_insurer_select
  ON public.quote_offers
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = quote_offers.insurer_id
    )
  );

DROP POLICY IF EXISTS quote_offers_insurer_update ON public.quote_offers;
CREATE POLICY quote_offers_insurer_update
  ON public.quote_offers
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = quote_offers.insurer_id
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = quote_offers.insurer_id
    )
  );

DROP POLICY IF EXISTS quote_offers_insurer_delete ON public.quote_offers;
CREATE POLICY quote_offers_insurer_delete
  ON public.quote_offers
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.insurer_accounts ia
      WHERE ia.profile_id = (SELECT auth.uid())
        AND ia.insurer_id = quote_offers.insurer_id
    )
  );

DROP POLICY IF EXISTS quote_offers_admin_select ON public.quote_offers;
CREATE POLICY quote_offers_admin_select
  ON public.quote_offers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_offers TO authenticated;
