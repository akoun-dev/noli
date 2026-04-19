-- =============================================================================
-- Migration: Create Coverage Tariff Rules Table
-- Date: 2024-05-09
-- Purpose: Pricing rules for insurance coverages
-- =============================================================================

CREATE TABLE public.coverage_tariff_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coverage_id uuid NOT NULL,
  vehicle_category text,
  min_vehicle_value numeric,
  max_vehicle_value numeric,
  min_fiscal_power integer,
  max_fiscal_power integer,
  fuel_type text,
  formula_name text,
  base_rate numeric,
  fixed_amount numeric,
  min_amount numeric,
  max_amount numeric,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coverage_tariff_rules_pkey PRIMARY KEY (id),
  CONSTRAINT coverage_tariff_rules_coverage_id_fkey FOREIGN KEY (coverage_id) REFERENCES public.coverages(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS coverage_tariff_rules_coverages_idx ON public.coverage_tariff_rules (coverage_id);
CREATE INDEX IF NOT EXISTS coverage_tariff_rules_vehicle_idx ON public.coverage_tariff_rules (
  coverage_id,
  COALESCE(vehicle_category, ''),
  COALESCE(fuel_type, '')
);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_coverage_tariff_rules ON public.coverage_tariff_rules;
CREATE TRIGGER trg_set_updated_at_coverage_tariff_rules
  BEFORE UPDATE ON public.coverage_tariff_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.coverage_tariff_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coverage_tariff_rules_public_select ON public.coverage_tariff_rules;
CREATE POLICY coverage_tariff_rules_public_select
  ON public.coverage_tariff_rules
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.coverages c
      WHERE c.id = coverage_id
        AND c.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS coverage_tariff_rules_manage_admin ON public.coverage_tariff_rules;
CREATE POLICY coverage_tariff_rules_manage_admin
  ON public.coverage_tariff_rules
  FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_insurer())
  WITH CHECK (public.is_admin() OR public.is_insurer());

-- Grants
GRANT SELECT ON public.coverage_tariff_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coverage_tariff_rules TO authenticated;
