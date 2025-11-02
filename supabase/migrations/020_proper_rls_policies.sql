-- Proper RLS policies for coverages and coverage_tariff_rules
-- This replaces the previous temporary fix with proper security policies

-- Re-enable RLS if it was disabled
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_tariff_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can select coverages" ON public.coverages;
DROP POLICY IF EXISTS "Admins can insert coverages" ON public.coverages;
DROP POLICY IF EXISTS "Admins can update coverages" ON public.coverages;
DROP POLICY IF EXISTS "Admins can delete coverages" ON public.coverages;

DROP POLICY IF EXISTS "Admins can select tariff rules" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Admins can insert tariff rules" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Admins can update tariff rules" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Admins can delete tariff rules" ON public.coverage_tariff_rules;

-- Create comprehensive policies for coverages table
-- 1. Admin policies (full access)
CREATE POLICY "Admins full access to coverages" ON public.coverages
  FOR ALL USING (
    -- Allow access based on JWT role metadata
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
    -- Allow access based on profiles table
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  ) WITH CHECK (
    -- Same conditions for INSERT
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- 2. Public read policies (read-only access for authenticated users)
CREATE POLICY "Authenticated users can read active coverages" ON public.coverages
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );

-- Create comprehensive policies for coverage_tariff_rules table
-- 1. Admin policies (full access)
CREATE POLICY "Admins full access to tariff rules" ON public.coverage_tariff_rules
  FOR ALL USING (
    -- Allow access based on JWT role metadata
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
    -- Allow access based on profiles table
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  ) WITH CHECK (
    -- Same conditions for INSERT
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- 2. Public read policies (read-only access for active rules)
CREATE POLICY "Authenticated users can read active tariff rules" ON public.coverage_tariff_rules
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND is_active = true
  );

-- Add comments for documentation
COMMENT ON POLICY "Admins full access to coverages" ON public.coverages IS 'Full CRUD access for admin users based on role in JWT or profiles table';
COMMENT ON POLICY "Authenticated users can read active coverages" ON public.coverages IS 'Read-only access to active coverages for authenticated users';
COMMENT ON POLICY "Admins full access to tariff rules" ON public.coverage_tariff_rules IS 'Full CRUD access for admin users based on role in JWT or profiles table';
COMMENT ON POLICY "Authenticated users can read active tariff rules" ON public.coverage_tariff_rules IS 'Read-only access to active tariff rules for authenticated users';