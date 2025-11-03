-- =============================================================================
-- Migration: create coverage & guarantee domain tables
-- Goal:
--   * Introduce structured storage for insurance coverages/guarantees
--   * Support CRUD operations required by admin tooling
--   * Expose active guarantees for public (step 3) quote flows
--   * Enforce access control via RLS while allowing public read access
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coverage_type') THEN
    CREATE TYPE public.coverage_type AS ENUM (
      'RC',
      'RESPONSABILITE_CIVILE',
      'RECOURS_TIERS_INCENDIE',
      'DEFENSE_RECOURS',
      'INDIVIDUELLE_CONDUCTEUR',
      'INDIVIDUELLE_PASSAGERS',
      'IPT',
      'AVANCE_RECOURS',
      'INCENDIE',
      'VOL',
      'VOL_MAINS_ARMEES',
      'VOL_ACCESSOIRES',
      'BRIS_GLACES',
      'BRIS_GLACES_TOITS',
      'TIERCE_COMPLETE',
      'TIERCE_COMPLETE_PLAFONNEE',
      'TIERCE_COLLISION',
      'TIERCE_COLLISION_PLAFONNEE',
      'ASSISTANCE',
      'ASSISTANCE_AUTO',
      'ACCESSOIRES',
      'PACK_ASSISTANCE'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coverage_calculation_type') THEN
    CREATE TYPE public.coverage_calculation_type AS ENUM (
      'FIXED_AMOUNT',
      'PERCENTAGE_SI',
      'PERCENTAGE_VN',
      'MTPL_TARIFF',
      'FORMULA_BASED',
      'FREE',
      'RATE_ON_SI',
      'RATE_ON_NEW_VALUE',
      'TCM_TCL_MATRIX',
      'IC_IPT_FORMULA',
      'CONDITIONAL_RATE'
    );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helper updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Coverage categories (optional grouping)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coverage_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS coverage_categories_code_idx
  ON public.coverage_categories (LOWER(code));

DROP TRIGGER IF EXISTS trg_set_updated_at_coverage_categories ON public.coverage_categories;
CREATE TRIGGER trg_set_updated_at_coverage_categories
  BEFORE UPDATE ON public.coverage_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Coverage master table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coverages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type public.coverage_type NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.coverage_categories(id) ON DELETE SET NULL,
  calculation_type public.coverage_calculation_type NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coverages
  ADD CONSTRAINT coverages_code_format_chk CHECK (code ~ '^[A-Z0-9_]+$');

CREATE INDEX IF NOT EXISTS coverages_display_idx
  ON public.coverages (is_active, display_order, type);

CREATE INDEX IF NOT EXISTS coverages_category_idx
  ON public.coverages (category_id);

DROP TRIGGER IF EXISTS trg_set_updated_at_coverages ON public.coverages;
CREATE TRIGGER trg_set_updated_at_coverages
  BEFORE UPDATE ON public.coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tariff rules for coverages
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coverage_tariff_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage_id uuid NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
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
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coverage_tariff_rules_coverages_idx
  ON public.coverage_tariff_rules (coverage_id);

CREATE INDEX IF NOT EXISTS coverage_tariff_rules_vehicle_idx
  ON public.coverage_tariff_rules (
    coverage_id,
    COALESCE(vehicle_category, ''),
    COALESCE(fuel_type, '')
  );

DROP TRIGGER IF EXISTS trg_set_updated_at_coverage_tariff_rules ON public.coverage_tariff_rules;
CREATE TRIGGER trg_set_updated_at_coverage_tariff_rules
  BEFORE UPDATE ON public.coverage_tariff_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Quote coverage link table (premiums per guarantee)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quote_coverages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  coverage_id uuid NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
  tariff_rule_id uuid REFERENCES public.coverage_tariff_rules(id) ON DELETE SET NULL,
  calculation_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  premium_amount numeric NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT false,
  is_mandatory boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  updated_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS quote_coverages_unique_idx
  ON public.quote_coverages (quote_id, coverage_id);

CREATE INDEX IF NOT EXISTS quote_coverages_quote_idx
  ON public.quote_coverages (quote_id, is_included);

DROP TRIGGER IF EXISTS trg_set_updated_at_quote_coverages ON public.quote_coverages;
CREATE TRIGGER trg_set_updated_at_quote_coverages
  BEFORE UPDATE ON public.quote_coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Keep is_mandatory flag aligned with coverage definition
CREATE OR REPLACE FUNCTION public.sync_quote_coverages_mandatory()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT c.is_mandatory
  INTO NEW.is_mandatory
  FROM public.coverages c
  WHERE c.id = NEW.coverage_id;

  IF NEW.is_mandatory IS NULL THEN
    NEW.is_mandatory := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quote_coverages_mandatory ON public.quote_coverages;
CREATE TRIGGER trg_sync_quote_coverages_mandatory
  BEFORE INSERT OR UPDATE OF coverage_id
  ON public.quote_coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_quote_coverages_mandatory();

-- Cascade mandatory flag updates when coverage definition changes
CREATE OR REPLACE FUNCTION public.propagate_coverage_mandatory_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_mandatory <> OLD.is_mandatory THEN
    UPDATE public.quote_coverages qc
    SET is_mandatory = NEW.is_mandatory,
        updated_at = NOW()
    WHERE qc.coverage_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_propagate_coverage_mandatory ON public.coverages;
CREATE TRIGGER trg_propagate_coverage_mandatory
  AFTER UPDATE OF is_mandatory
  ON public.coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_coverage_mandatory_change();

-- ---------------------------------------------------------------------------
-- Security helpers (admin / insurer detection)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'ADMIN'
      AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_insurer(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'INSURER'
      AND is_active = TRUE
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS configuration
-- ---------------------------------------------------------------------------

ALTER TABLE public.coverage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_tariff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_coverages ENABLE ROW LEVEL SECURITY;

-- Categories
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
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Coverages
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
  USING (public.is_admin(auth.uid()) OR public.is_insurer(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_insurer(auth.uid()));

-- Tariff rules
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
  USING (public.is_admin(auth.uid()) OR public.is_insurer(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_insurer(auth.uid()));

-- Quote coverages
DROP POLICY IF EXISTS quote_coverages_user_access ON public.quote_coverages;
CREATE POLICY quote_coverages_user_access
  ON public.quote_coverages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_coverages.quote_id
        AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quote_coverages_user_manage ON public.quote_coverages;
CREATE POLICY quote_coverages_user_manage
  ON public.quote_coverages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_coverages.quote_id
        AND q.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_coverages.quote_id
        AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quote_coverages_admin_manage ON public.quote_coverages;
CREATE POLICY quote_coverages_admin_manage
  ON public.quote_coverages
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_insurer(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_insurer(auth.uid()));

-- Grant base privileges (required alongside RLS policies)
GRANT SELECT ON public.coverage_categories TO anon, authenticated;
GRANT SELECT ON public.coverages TO anon, authenticated;
GRANT SELECT ON public.coverage_tariff_rules TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coverage_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coverages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coverage_tariff_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_coverages TO authenticated;

-- ---------------------------------------------------------------------------
-- REST-compatible view for coverage premiums (used by frontend via PostgREST)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.quote_coverage_premiums AS
SELECT
  qc.id,
  qc.quote_id,
  qc.coverage_id,
  qc.tariff_rule_id,
  qc.premium_amount,
  qc.is_included,
  qc.calculation_parameters,
  qc.created_at,
  qc.updated_at,
  qc.updated_by
FROM public.quote_coverages qc;

COMMENT ON VIEW public.quote_coverage_premiums IS
  '@primaryKey id
@foreignKey quote_id references public.quotes id
@foreignKey coverage_id references public.coverages id';

GRANT SELECT ON public.quote_coverage_premiums TO anon, authenticated;
