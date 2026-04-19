-- =============================================================================
-- Migration: Create Insurance Categories Table
-- Date: 2024-05-09
-- Purpose: Define insurance categories (auto, property, health, etc.)
-- =============================================================================

CREATE TABLE public.insurance_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insurance_categories_pkey PRIMARY KEY (id)
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurance_categories ON public.insurance_categories;
CREATE TRIGGER trg_set_updated_at_insurance_categories
  BEFORE UPDATE ON public.insurance_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurance_categories_public_select ON public.insurance_categories;
CREATE POLICY insurance_categories_public_select
  ON public.insurance_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS insurance_categories_admin_manage ON public.insurance_categories;
CREATE POLICY insurance_categories_admin_manage
  ON public.insurance_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT ON public.insurance_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurance_categories TO authenticated;
