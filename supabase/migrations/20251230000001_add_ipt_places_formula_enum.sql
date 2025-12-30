-- Migration: Add missing calculation methods to coverage_calculation_type enum
-- This adds FIRE_THEFT, THEFT_ARMED, GLASS_ROOF, GLASS_STANDARD, TIERCE_COMPLETE_CAP,
-- TIERCE_COLLISION_CAP, and IPT_PLACES_FORMULA values

-- Add all missing values to the enum
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'FIRE_THEFT';
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'THEFT_ARMED';
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'GLASS_ROOF';
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'GLASS_STANDARD';
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'TIERCE_COMPLETE_CAP';
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'TIERCE_COLLISION_CAP';
ALTER TYPE public.coverage_calculation_type ADD VALUE IF NOT EXISTS 'IPT_PLACES_FORMULA';

-- Note: The enum already contains: FIXED_AMOUNT, PERCENTAGE_SI, PERCENTAGE_VN, MTPL_TARIFF,
-- FORMULA_BASED, FREE, RATE_ON_SI, RATE_ON_NEW_VALUE, TCM_TCL_MATRIX, IC_IPT_FORMULA, CONDITIONAL_RATE
-- The new values are added after these existing values
