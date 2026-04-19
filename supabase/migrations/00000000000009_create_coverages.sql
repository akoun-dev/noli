-- =============================================================================
-- Migration: Create Coverages Table
-- Date: 2024-05-09
-- Purpose: Define insurance coverage/guarantee types
-- =============================================================================

CREATE TABLE public.coverages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]+$'::text),
  type public.coverage_type NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid,
  insurer_id uuid NOT NULL,
  calculation_type public.coverage_calculation_type NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coverages_pkey PRIMARY KEY (id),
  CONSTRAINT coverages_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.coverage_categories(id),
  CONSTRAINT coverages_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS coverages_display_idx ON public.coverages (is_active, display_order, type);
CREATE INDEX IF NOT EXISTS coverages_category_idx ON public.coverages (category_id);
CREATE INDEX IF NOT EXISTS coverages_insurer_idx ON public.coverages (insurer_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_coverages ON public.coverages;
CREATE TRIGGER trg_set_updated_at_coverages
  BEFORE UPDATE ON public.coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coverages_public_select ON public.coverages;
CREATE POLICY coverages_public_select
  ON public.coverages
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS coverages_manage_admin ON public.coverages;
CREATE POLICY coverages_manage_admin
  ON public.coverages
  FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_insurer())
  WITH CHECK (public.is_admin() OR public.is_insurer());

-- Grants
GRANT SELECT ON public.coverages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coverages TO authenticated;
