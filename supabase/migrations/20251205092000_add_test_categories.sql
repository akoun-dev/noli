-- =============================================================================
-- Migration: Add test insurance categories for development
-- Date: 2025-12-05
-- Purpose: Add sample insurance categories for testing offer creation
-- =============================================================================

-- Insert sample insurance categories
INSERT INTO public.insurance_categories (id, name, description, icon, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Auto', 'Assurance automobile pour véhicules particuliers', 'car', true, NOW(), NOW()),
  (gen_random_uuid(), 'Moto', 'Assurance pour deux-roues et motocyclettes', 'motorcycle', true, NOW(), NOW()),
  (gen_random_uuid(), 'Habitation', 'Assurance habitation et biens immobiliers', 'home', true, NOW(), NOW()),
  (gen_random_uuid(), 'Santé', 'Assurance santé et complémentaire santé', 'heart', true, NOW(), NOW()),
  (gen_random_uuid(), 'Voyage', 'Assurance voyage et assistance à l''étranger', 'plane', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Ensure RLS is enabled on insurance_categories
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users to active categories" ON public.insurance_categories;

-- Create policy to allow public read access to active categories
CREATE POLICY "Enable read access for all users to active categories" ON public.insurance_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Grant permissions
GRANT SELECT ON public.insurance_categories TO anon, authenticated;
GRANT ALL ON public.insurance_categories TO authenticated;

-- Add comment
COMMENT ON TABLE public.insurance_categories IS 'Insurance categories catalog';