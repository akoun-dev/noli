-- =============================================================================
-- Migration: Admin Data Validations Table
-- Date: 2026-04-19
-- Purpose: Track data validation operations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Data Validations - Track data validation operations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_data_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('users', 'insurers', 'offers', 'quotes', 'all')),
  validation_date timestamptz NOT NULL DEFAULT NOW(),
  total_records integer NOT NULL DEFAULT 0,
  valid_records integer NOT NULL DEFAULT 0,
  invalid_records integer NOT NULL DEFAULT 0,
  warnings integer NOT NULL DEFAULT 0,
  critical_issues integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'passed'
    CHECK (status IN ('passed', 'failed', 'warning')),
  details jsonb DEFAULT '[]'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_admin_data_validations ON public.admin_data_validations;
CREATE TRIGGER trg_set_updated_at_admin_data_validations
  BEFORE UPDATE ON public.admin_data_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS admin_data_validations_entity_type_idx
  ON public.admin_data_validations (entity_type);
CREATE INDEX IF NOT EXISTS admin_data_validations_status_idx
  ON public.admin_data_validations (status);
CREATE INDEX IF NOT EXISTS admin_data_validations_date_idx
  ON public.admin_data_validations (validation_date DESC);
CREATE INDEX IF NOT EXISTS admin_data_validations_triggered_by_idx
  ON public.admin_data_validations (triggered_by);

ALTER TABLE public.admin_data_validations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all validations
DROP POLICY IF EXISTS admin_data_validations_admin_select ON public.admin_data_validations;
CREATE POLICY admin_data_validations_admin_select
  ON public.admin_data_validations
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: Admins can insert validations
DROP POLICY IF EXISTS admin_data_validations_admin_insert ON public.admin_data_validations;
CREATE POLICY admin_data_validations_admin_insert
  ON public.admin_data_validations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy: Admins can update validations
DROP POLICY IF EXISTS admin_data_validations_admin_update ON public.admin_data_validations;
CREATE POLICY admin_data_validations_admin_update
  ON public.admin_data_validations
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.admin_data_validations TO authenticated;
