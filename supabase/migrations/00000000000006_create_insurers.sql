-- =============================================================================
-- Migration: Create Insurers Table
-- Date: 2024-05-09
-- Purpose: Catalog of insurance companies
-- =============================================================================

CREATE TABLE public.insurers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo_url text,
  rating numeric,
  is_active boolean NOT NULL DEFAULT true,
  contact_email text,
  phone text,
  website text,
  contact_address text,
  license_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insurers_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS insurers_active_idx ON public.insurers (is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS insurers_name_idx ON public.insurers (name);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurers ON public.insurers;
CREATE TRIGGER trg_set_updated_at_insurers
  BEFORE UPDATE ON public.insurers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed initial data for insurers (Côte d'Ivoire insurance companies)
INSERT INTO public.insurers (id, code, name, description, logo_url, rating, is_active, contact_email, phone, website, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'AGCI', 'Assurance Generale de Cote dIvoire', 'Leader du marche ivoirien avec une large gamme de produits d''assurance', 'https://logo.clearbit.com/agci.ci', 4.5, true, 'contact@agci.ci', '+225 27 22 44 55 66', 'https://www.agci.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'NSIA', 'NSIA Assurance Cote dIvoire', 'Groupe panafricain offrant des solutions d''assurance innovantes', 'https://logo.clearbit.com/nsia.ci', 4.7, true, 'contact@nsia.ci', '+225 27 22 41 42 43', 'https://www.nsia.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'ALLIANZ', 'Allianz Cote dIvoire', 'Filiale ivoirienne du geant mondial Allianz', 'https://logo.clearbit.com/allianz.ci', 4.6, true, 'info@allianz.ci', '+225 27 22 47 48 49', 'https://www.allianz.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'AXA', 'AXA Cote dIvoire', 'Assurance multirisque avec expertise internationale', 'https://logo.clearbit.com/axa.ci', 4.4, true, 'service.client@axa.ci', '+225 27 22 50 51 52', 'https://www.axa.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'SAHAM', 'Saham Assurance Cote dIvoire', 'Solutions d''assurance adaptees aux besoins locaux', 'https://logo.clearbit.com/saham.ci', 4.3, true, 'contact@saham.ci', '+225 27 22 53 54 55', 'https://www.saham.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000006', 'SUNU', 'Sunu Assurances Cote dIvoire', 'Assurance automobile et habitation specialisee', 'https://logo.clearbit.com/sunu.ci', 4.2, true, 'info@sunu.ci', '+225 27 22 56 57 58', 'https://www.sunu.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000007', 'COLINA', 'Colina Assurance', 'Assurance vie et prevoyance leader en Cote dIvoire', 'https://logo.clearbit.com/colina.ci', 4.5, true, 'contact@colina.ci', '+225 27 22 59 60 61', 'https://www.colina.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000008', 'ASCOMA', 'Ascoma Assurance', 'Specialiste en assurance transport et maritime', 'https://logo.clearbit.com/ascoma.ci', 4.1, true, 'info@ascoma.ci', '+225 27 22 62 63 64', 'https://www.ascoma.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000009', 'CICARE', 'Cica-Re Assurance', 'Assurance et reassurance pour les professionnels', 'https://logo.clearbit.com/cica-re.ci', 4.0, true, 'contact@cicare.ci', '+225 27 22 65 66 67', 'https://www.cicare.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000010', 'AXAMANSARD', 'Axa Mansard Cote dIvoire', 'Assurance sante et prevoyance haut de gamme', 'https://logo.clearbit.com/axamansard.ci', 4.8, true, 'client@axamansard.ci', '+225 27 22 68 69 70', 'https://www.axamansard.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'SANLAM', 'Sanlam Assurance Cote dIvoire', 'Assurance agricole et ruraux innovante', 'https://logo.clearbit.com/sanlam.ci', 4.3, true, 'info@sanlam.ci', '+225 27 22 71 72 73', 'https://www.sanlam.ci', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'LIBERTY', 'Liberty Assurance Cote dIvoire', 'Assurance digitale et solutions innovantes', 'https://logo.clearbit.com/liberty.ci', 4.4, true, 'contact@liberty.ci', '+225 27 22 74 75 76', 'https://www.liberty.ci', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurers_public_active_select ON public.insurers;
CREATE POLICY insurers_public_active_select
  ON public.insurers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS insurers_admin_insert ON public.insurers;
CREATE POLICY insurers_admin_insert
  ON public.insurers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS insurers_admin_select ON public.insurers;
CREATE POLICY insurers_admin_select
  ON public.insurers
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS insurers_admin_update ON public.insurers;
CREATE POLICY insurers_admin_update
  ON public.insurers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS insurers_admin_delete ON public.insurers;
CREATE POLICY insurers_admin_delete
  ON public.insurers
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Grants
GRANT SELECT ON public.insurers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurers TO authenticated;
