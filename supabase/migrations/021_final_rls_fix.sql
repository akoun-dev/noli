-- Final RLS fix - drop conflicting policies and create simplified admin access
-- This ensures proper access for admin users without conflicts

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can read active coverages" ON public.coverages;
DROP POLICY IF EXISTS "Authenticated users can read active tariff rules" ON public.coverage_tariff_rules;

-- Create simple, effective policies
-- 1. Full admin access for coverages
CREATE POLICY "Admins full access coverages" ON public.coverages
  FOR ALL USING (
    -- Check if user is admin via JWT metadata
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
    -- Check via profiles table
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- 2. Full admin access for coverage_tariff_rules
CREATE POLICY "Admins full access tariff_rules" ON public.coverage_tariff_rules
  FOR ALL USING (
    -- Check if user is admin via JWT metadata
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
    -- Check via profiles table
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- 3. Public read access for active coverages (for authenticated users)
CREATE POLICY "Public read active coverages" ON public.coverages
  FOR SELECT USING (
    is_active = true
  );

-- 4. Public read access for active tariff rules (for authenticated users)
CREATE POLICY "Public read active tariff rules" ON public.coverage_tariff_rules
  FOR SELECT USING (
    is_active = true
  );