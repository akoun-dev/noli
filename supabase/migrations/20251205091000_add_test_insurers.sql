-- =============================================================================
-- Migration: Add test insurers for development
-- Date: 2025-12-05
-- Purpose: Add sample insurance companies for testing offer creation
-- =============================================================================

-- Insert sample insurance companies
INSERT INTO public.insurers (id, name, description, contact_email, phone, website, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'AXA Assurances', 'Compagnie d''assurance internationale avec une large couverture', 'contact@axa.ci', '+225 27 20 00 00 00', 'https://www.axa.ci', true, NOW(), NOW()),
  (gen_random_uuid(), 'NSIA Assurances', 'Leader de l''assurance en Côte d''Ivoire', 'info@nsia.ci', '+225 27 20 30 40 50', 'https://www.nsia.ci', true, NOW(), NOW()),
  (gen_random_uuid(), 'SUNU Assurances', 'Assurance et réassurance en Afrique', 'contact@sunu.ci', '+225 27 20 25 00 00', 'https://www.sunu.com', true, NOW(), NOW()),
  (gen_random_uuid(), 'Allianz Côte d''Ivoire', 'Protection et sécurité pour tous vos besoins', 'info@allianz.ci', '+225 27 20 00 11 22', 'https://www.allianz.ci', true, NOW(), NOW()),
  (gen_random_uuid(), 'AGETI', 'Société ivoirienne d''assurance et de réassurance', 'contact@ageti.ci', '+225 27 20 00 99 88', 'https://www.ageti.ci', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Ensure RLS is enabled on insurers
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for all users to active insurers" ON public.insurers;

-- Create simple policy to allow public read access to active insurers
CREATE POLICY "Enable read access for all users to active insurers" ON public.insurers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Grant permissions
GRANT SELECT ON public.insurers TO anon, authenticated;
GRANT ALL ON public.insurers TO authenticated;

-- Add comment
COMMENT ON TABLE public.insurers IS 'Insurance companies catalog';