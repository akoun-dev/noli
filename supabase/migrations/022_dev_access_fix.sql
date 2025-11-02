-- Development access fix - allow coverages creation with basic API key
-- For development environment, we need to allow basic operations

-- Create a more permissive policy that allows operations with API key
DROP POLICY IF EXISTS "Admins full access coverages" ON public.coverages;
DROP POLICY IF EXISTS "Public read active coverages" ON public.coverages;

-- Simple policy that allows all operations (for development)
CREATE POLICY "Development full access coverages" ON public.coverages
  FOR ALL USING (true);

-- Also for tariff rules
DROP POLICY IF EXISTS "Admins full access tariff_rules" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Public read active tariff rules" ON public.coverage_tariff_rules;

CREATE POLICY "Development full access tariff_rules" ON public.coverage_tariff_rules
  FOR ALL USING (true);

-- Add comment that this is for development only
COMMENT ON POLICY "Development full access coverages" ON public.coverages IS 'Development policy - allows all operations for testing. Replace with proper RLS in production.';
COMMENT ON POLICY "Development full access tariff_rules" ON public.coverage_tariff_rules IS 'Development policy - allows all operations for testing. Replace with proper RLS in production.';