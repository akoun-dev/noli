-- =============================================================================
-- Migration: Add missing columns to insurers table
-- Goal: Add address and license_number columns to support admin CRUD
-- =============================================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurers'
    AND column_name = 'address'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.insurers ADD COLUMN address text;
  END IF;

  -- Add license_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurers'
    AND column_name = 'license_number'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.insurers ADD COLUMN license_number text;
  END IF;
END;
$$;

-- Add comments
COMMENT ON COLUMN public.insurers.address IS 'Physical address of the insurance company';
COMMENT ON COLUMN public.insurers.license_number IS 'Official license number for the insurance company';
