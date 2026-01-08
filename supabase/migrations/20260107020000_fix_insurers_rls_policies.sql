-- =============================================================================
-- Migration: Fix insurers table RLS policies for admin access
-- Goal: Allow admins to fully manage insurers (CREATE, READ, UPDATE, DELETE)
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users to active insurers" ON public.insurers;
DROP POLICY IF EXISTS "insurers_public_active_select" ON public.insurers;
DROP POLICY IF EXISTS "insurers_public_select" ON public.insurers;
DROP POLICY IF EXISTS "insurers_admin_manage" ON public.insurers;
DROP POLICY IF EXISTS "insurers_manage_admin" ON public.insurers;
DROP POLICY IF EXISTS "insurers_read_own" ON public.insurers;
DROP POLICY IF EXISTS "insurers_insert_admin" ON public.insurers;
DROP POLICY IF EXISTS "insurers_update_own" ON public.insurers;
DROP POLICY IF EXISTS "insurers_admin_all" ON public.insurers;

-- Policy 1: Public can read active insurers (for catalog)
CREATE POLICY "insurers_public_read_active"
  ON public.insurers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Policy 2: Authenticated users can read all insurers (for admins)
CREATE POLICY "insurers_authenticated_read_all"
  ON public.insurers
  FOR SELECT
  TO authenticated
  USING (true);  -- Allow reading all insurers

-- Policy 3: Admins can insert insurers
CREATE POLICY "insurers_admin_insert"
  ON public.insurers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
    )
  );

-- Policy 4: Admins can update insurers
CREATE POLICY "insurers_admin_update"
  ON public.insurers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
    )
  );

-- Policy 5: Admins can delete insurers
CREATE POLICY "insurers_admin_delete"
  ON public.insurers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
    )
  );

-- Grant permissions
GRANT SELECT ON public.insurers TO anon, authenticated;
GRANT ALL ON public.insurers TO authenticated;

-- Add comment
COMMENT ON TABLE public.insurers IS 'Insurance companies catalog - managed by admins';
