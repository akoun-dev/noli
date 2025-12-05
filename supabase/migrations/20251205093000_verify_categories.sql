-- =============================================================================
-- Migration: Verify and fix categories
-- Date: 2025-12-05
-- Purpose: Check if categories exist and add them if missing
-- =============================================================================

-- First, check if we have any categories
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM public.insurance_categories WHERE is_active = TRUE;

    IF category_count = 0 THEN
        -- Insert sample insurance categories if none exist
        INSERT INTO public.insurance_categories (id, name, description, icon, is_active, created_at, updated_at) VALUES
          (gen_random_uuid(), 'Auto', 'Assurance automobile pour véhicules particuliers', 'car', true, NOW(), NOW()),
          (gen_random_uuid(), 'Moto', 'Assurance pour deux-roues et motocyclettes', 'motorcycle', true, NOW(), NOW()),
          (gen_random_uuid(), 'Habitation', 'Assurance habitation et biens immobiliers', 'home', true, NOW(), NOW()),
          (gen_random_uuid(), 'Santé', 'Assurance santé et complémentaire santé', 'heart', true, NOW(), NOW()),
          (gen_random_uuid(), 'Voyage', 'Assurance voyage et assistance à l''étranger', 'plane', true, NOW(), NOW());

        RAISE NOTICE 'Inserted % sample insurance categories', 5;
    ELSE
        RAISE NOTICE 'Found % existing insurance categories', category_count;
    END IF;
END $$;

-- Show current categories
SELECT id, name, is_active, created_at FROM public.insurance_categories ORDER BY name;