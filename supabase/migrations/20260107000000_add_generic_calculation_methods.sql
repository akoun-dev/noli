-- =============================================================================
-- Migration: Add generic calculation methods to enum
-- Goal:
--   * Add VARIABLE_BASED and MATRIX_BASED to coverage_calculation_type enum
--   * This is a separate migration to avoid "unsafe use of new value" error
--   * Data migration will be done in the next migration file
-- =============================================================================

-- Add VARIABLE_BASED for percentage-based calculations (on vehicle value)
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'VARIABLE_BASED';

-- Add MATRIX_BASED for matrix/grid-based calculations
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'MATRIX_BASED';

-- Verify the new values were added
SELECT enumlabel AS enum_value
FROM pg_enum
WHERE enumtypid = 'coverage_calculation_type'::regtype
  AND enumlabel IN ('VARIABLE_BASED', 'MATRIX_BASED')
ORDER BY enumsortorder;
