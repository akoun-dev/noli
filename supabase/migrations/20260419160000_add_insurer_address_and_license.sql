-- =============================================================================
-- Migration: Add address and license to insurers table
-- Date: 2026-04-19
-- Purpose: Add missing columns for insurer contact information
-- =============================================================================

-- Add contact_address column
ALTER TABLE public.insurers
ADD COLUMN IF NOT EXISTS contact_address text;

-- Add license_number column
ALTER TABLE public.insurers
ADD COLUMN IF NOT EXISTS license_number text;

-- Add comments
COMMENT ON COLUMN public.insurers.contact_address IS 'Adresse physique de l''assureur';
COMMENT ON COLUMN public.insurers.license_number IS 'Numéro de licence d''assurance';
