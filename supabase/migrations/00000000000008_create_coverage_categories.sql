-- =============================================================================
-- Migration: Create Coverage Categories Table
-- Date: 2024-05-09
-- Purpose: Optional grouping of insurance coverages
-- =============================================================================

CREATE TABLE public.coverage_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coverage_categories_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS coverage_categories_code_idx ON public.coverage_categories (LOWER(code));

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_coverage_categories ON public.coverage_categories;
CREATE TRIGGER trg_set_updated_at_coverage_categories
  BEFORE UPDATE ON public.coverage_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.coverage_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coverage_categories_active_public ON public.coverage_categories;
CREATE POLICY coverage_categories_active_public
  ON public.coverage_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS coverage_categories_manage_admin ON public.coverage_categories;
CREATE POLICY coverage_categories_manage_admin
  ON public.coverage_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT ON public.coverage_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coverage_categories TO authenticated;
