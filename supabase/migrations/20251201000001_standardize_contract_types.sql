-- Migration: Standardize Contract Types
-- Purpose: Create enum type for standardized contract types and update existing data

-- Create enum type for contract types
CREATE TYPE contract_type_enum AS ENUM (
    'tiers_simple',
    'tiers_plus',
    'tous_risques'
);

-- Update insurance_offers table to use the enum type
ALTER TABLE insurance_offers
DROP COLUMN IF EXISTS contract_type;

ALTER TABLE insurance_offers
ADD COLUMN contract_type contract_type_enum DEFAULT 'tiers_simple';

-- Add comments for clarity
COMMENT ON COLUMN insurance_offers.contract_type IS 'Type de contrat: tiers_simple, tiers_plus, tous_risques';

-- Create indexes for the new contract_type
CREATE INDEX IF NOT EXISTS idx_insurance_offers_contract_type
ON insurance_offers(contract_type);

-- Update insurance_categories table if it doesn't have standardized types
UPDATE insurance_categories
SET name = 'tiers_simple'
WHERE name IN ('tiers', 'Tiers Simple', 'tiers simple');

UPDATE insurance_categories
SET name = 'tiers_plus'
WHERE name IN ('tiers +', 'Tiers +', 'vol incendie', 'vol_incendie');

UPDATE insurance_categories
SET name = 'tous_risques'
WHERE name IN ('tous risques', 'Tous Risques', 'tous_risques', 'tous-risques');

-- Insert standard categories if they don't exist
INSERT INTO insurance_categories (id, name, description, icon, is_active) VALUES
    (gen_random_uuid(), 'tiers_simple', 'Responsabilité civile de base', 'shield', true),
    (gen_random_uuid(), 'tiers_plus', 'RC + Vol + Incendie + Bris de glace', 'shield-plus', true),
    (gen_random_uuid(), 'tous_risques', 'Protection complète tous risques', 'shield-check', true)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions on the new enum type
GRANT ALL ON TYPE contract_type_enum TO authenticated, service_role;