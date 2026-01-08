-- =============================================================================
-- Migration: Migrate existing coverages to generic calculation methods
-- Goal:
--   * Migrate existing coverages from old specific methods to new generic ones
--   * This migration depends on 20260107000000_add_generic_calculation_methods.sql
--
-- Migration mapping:
-- - FREE                    -> FREE (no change)
-- - FIXED_AMOUNT            -> FIXED_AMOUNT (no change)
-- - PERCENTAGE_SI           -> VARIABLE_BASED (based on sum insured/venale value)
-- - PERCENTAGE_VN           -> VARIABLE_BASED (based on new value)
-- - RATE_ON_SI              -> VARIABLE_BASED (based on sum insured/venale value)
-- - RATE_ON_NEW_VALUE       -> VARIABLE_BASED (based on new value)
-- - MTPL_TARIFF             -> MATRIX_BASED (fiscal power matrix)
-- - FORMULA_BASED           -> MATRIX_BASED (formula matrix)
-- - TCM_TCL_MATRIX          -> MATRIX_BASED (vehicle category matrix)
-- - IC_IPT_FORMULA          -> MATRIX_BASED (formula matrix with places)
-- - CONDITIONAL_RATE        -> VARIABLE_BASED (with threshold)
-- - FIRE_THEFT              -> MATRIX_BASED (fire & theft combined matrix)
-- - THEFT_ARMED             -> MATRIX_BASED (armed theft matrix)
-- - GLASS_ROOF              -> MATRIX_BASED (glass roof matrix)
-- - GLASS_STANDARD          -> MATRIX_BASED (glass standard matrix)
-- - TIERCE_COMPLETE_CAP     -> MATRIX_BASED (tierce complete with caps)
-- - TIERCE_COLLISION_CAP    -> MATRIX_BASED (tierce collision with caps)
-- - IPT_PLACES_FORMULA      -> MATRIX_BASED (formula with places)
-- =============================================================================

-- Create a helper function to migrate calculation type
CREATE OR REPLACE FUNCTION public.migrate_coverage_calculation_type()
RETURNS TABLE(
  old_method TEXT,
  new_method TEXT,
  migrated_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Migrate PERCENTAGE_SI -> VARIABLE_BASED
  UPDATE public.coverages
  SET calculation_type = 'VARIABLE_BASED',
      updated_at = NOW()
  WHERE calculation_type IN ('PERCENTAGE_SI', 'RATE_ON_SI')
    AND calculation_type != 'VARIABLE_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'PERCENTAGE_SI/RATE_ON_SI'::TEXT, 'VARIABLE_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate PERCENTAGE_VN -> VARIABLE_BASED
  UPDATE public.coverages
  SET calculation_type = 'VARIABLE_BASED',
      updated_at = NOW()
  WHERE calculation_type IN ('PERCENTAGE_VN', 'RATE_ON_NEW_VALUE')
    AND calculation_type != 'VARIABLE_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'PERCENTAGE_VN/RATE_ON_NEW_VALUE'::TEXT, 'VARIABLE_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate CONDITIONAL_RATE -> VARIABLE_BASED
  UPDATE public.coverages
  SET calculation_type = 'VARIABLE_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'CONDITIONAL_RATE'
    AND calculation_type != 'VARIABLE_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'CONDITIONAL_RATE'::TEXT, 'VARIABLE_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate MTPL_TARIFF -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'MTPL_TARIFF'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'MTPL_TARIFF'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate FORMULA_BASED -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'FORMULA_BASED'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'FORMULA_BASED'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate TCM_TCL_MATRIX -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'TCM_TCL_MATRIX'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'TCM_TCL_MATRIX'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate IC_IPT_FORMULA -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'IC_IPT_FORMULA'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'IC_IPT_FORMULA'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate FIRE_THEFT -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'FIRE_THEFT'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'FIRE_THEFT'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate THEFT_ARMED -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'THEFT_ARMED'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'THEFT_ARMED'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate GLASS_ROOF -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'GLASS_ROOF'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'GLASS_ROOF'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate GLASS_STANDARD -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'GLASS_STANDARD'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'GLASS_STANDARD'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate TIERCE_COMPLETE_CAP -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'TIERCE_COMPLETE_CAP'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'TIERCE_COMPLETE_CAP'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate TIERCE_COLLISION_CAP -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'TIERCE_COLLISION_CAP'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'TIERCE_COLLISION_CAP'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  -- Migrate IPT_PLACES_FORMULA -> MATRIX_BASED
  UPDATE public.coverages
  SET calculation_type = 'MATRIX_BASED',
      updated_at = NOW()
  WHERE calculation_type = 'IPT_PLACES_FORMULA'
    AND calculation_type != 'MATRIX_BASED';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RETURN QUERY SELECT 'IPT_PLACES_FORMULA'::TEXT, 'MATRIX_BASED'::TEXT, v_count::BIGINT;
  END IF;

  RETURN;
END;
$$;

-- Run the migration and show results
SELECT * FROM public.migrate_coverage_calculation_type();

-- Verify the migration - show count of coverages by calculation type
SELECT
  calculation_type,
  COUNT(*) as coverage_count
FROM public.coverages
GROUP BY calculation_type
ORDER BY calculation_type;

-- Clean up the migration function (optional - keep for reference)
-- DROP FUNCTION IF EXISTS public.migrate_coverage_calculation_type();
