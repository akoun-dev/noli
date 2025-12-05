-- =============================================================================
-- Migration: Add IPT_PLACES_FORMULA to coverage_calculation_type enum
-- Goal:
--   * Fix the error "invalid input value for enum coverage_calculation_type: IPT_PLACES_FORMULA"
--   * Allow creation of guarantees with IPT_PLACES_FORMULA calculation method
--   * Maintain consistency between frontend options and database schema
-- =============================================================================

-- Add the missing IPT_PLACES_FORMULA value to the coverage_calculation_type enum
ALTER TYPE public.coverage_calculation_type 
ADD VALUE 'IPT_PLACES_FORMULA';

-- Comment documenting the purpose of this value
COMMENT ON TYPE public.coverage_calculation_type IS 
'Enumeration of calculation methods for insurance coverages. 
IPT_PLACES_FORMULA: Individual Personal Transport coverage calculated based on vehicle seats and formula selection.';