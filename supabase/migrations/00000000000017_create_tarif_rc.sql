-- =============================================================================
-- Migration: Create Tarif RC Table
-- Date: 2024-05-09
-- Purpose: MTPL (Responsabilité Civile) pricing grid
-- =============================================================================

CREATE TABLE public.tarif_rc (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  energy text NOT NULL CHECK (energy = ANY (ARRAY['Essence'::text, 'Diesel'::text, 'Electrique'::text, 'Hybride'::text, 'Autre'::text])),
  power_min integer NOT NULL CHECK (power_min >= 0),
  power_max integer NOT NULL,
  prime numeric NOT NULL CHECK (prime >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tarif_rc_pkey PRIMARY KEY (id)
);

-- Unique index for range per category/energy
CREATE UNIQUE INDEX IF NOT EXISTS tarif_rc_unique_range_idx
  ON public.tarif_rc (category, energy, power_min, power_max);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_tarif_rc ON public.tarif_rc;
CREATE TRIGGER trg_set_updated_at_tarif_rc
  BEFORE UPDATE ON public.tarif_rc
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.tarif_rc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to tarif_rc" ON public.tarif_rc;
CREATE POLICY "Allow read access to tarif_rc"
  ON public.tarif_rc
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admins to manage tarif_rc" ON public.tarif_rc;
CREATE POLICY "Allow admins to manage tarif_rc"
  ON public.tarif_rc
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT ON public.tarif_rc TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tarif_rc TO authenticated;
