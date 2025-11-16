-- Migration: Create Insurance Offers Table
-- Date: 2024-05-09 (before RLS policies)
-- Purpose: Create insurance_offers table referenced by RLS policies

-- Create insurance_offers table
CREATE TABLE IF NOT EXISTS public.insurance_offers (
    id text PRIMARY KEY DEFAULT CONCAT('offer_', substr(md5(random()::text), 1, 12)),
    insurer_id uuid NOT NULL,
    category_id uuid,
    name text NOT NULL,
    description text,
    price_min numeric,
    price_max numeric,
    coverage_amount numeric,
    deductible numeric NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT TRUE,
    features text[] NOT NULL DEFAULT '{}',
    contract_type text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS insurance_offers_active_idx
    ON public.insurance_offers (is_active, updated_at DESC);

CREATE INDEX IF NOT EXISTS insurance_offers_insurer_idx
    ON public.insurance_offers (insurer_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurance_offers ON public.insurance_offers;
CREATE TRIGGER trg_set_updated_at_insurance_offers
    BEFORE UPDATE ON public.insurance_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Grant basic permissions
GRANT ALL ON public.insurance_offers TO authenticated, service_role;
GRANT SELECT ON public.insurance_offers TO anon;

-- Add comment
COMMENT ON TABLE public.insurance_offers IS 'Insurance offers table for public catalog';