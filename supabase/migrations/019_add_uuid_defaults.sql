-- Add UUID defaults to coverages table
-- This migration ensures that coverages can be created without specifying an ID

-- Add UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set default UUID for coverages.id
ALTER TABLE public.coverages ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Also set defaults for coverage_tariff_rules if needed
DO $$
BEGIN
  -- Check if coverage_tariff_rules table exists and has id column without default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coverage_tariff_rules'
      AND column_name = 'id'
      AND column_default IS NULL
  ) THEN
    ALTER TABLE public.coverage_tariff_rules ALTER COLUMN id SET DEFAULT uuid_generate_v4();
  END IF;
END $$;