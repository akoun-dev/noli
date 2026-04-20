-- =============================================================================
-- Migration: Insurer Logos Storage
-- Date: 2026-04-19
-- Purpose: Create storage bucket for insurer logos with proper policies
-- =============================================================================

-- Insert storage bucket for insurer logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'insurer-logos',
  'insurer-logos',
  true, -- Public access for logos to display on frontend
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: Allow authenticated users to view logos
DROP POLICY IF EXISTS "insurer_logos_public_select" ON storage.objects;
CREATE POLICY "insurer_logos_public_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'insurer-logos');

-- Policy: Allow admins to upload logos
DROP POLICY IF EXISTS "insurer_logos_admin_insert" ON storage.objects;
CREATE POLICY "insurer_logos_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'insurer-logos'
    AND public.is_admin()
  );

-- Policy: Allow admins to update/replace logos
DROP POLICY IF EXISTS "insurer_logos_admin_update" ON storage.objects;
CREATE POLICY "insurer_logos_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'insurer-logos'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'insurer-logos'
    AND public.is_admin()
  );

-- Policy: Allow admins to delete logos
DROP POLICY IF EXISTS "insurer_logos_admin_delete" ON storage.objects;
CREATE POLICY "insurer_logos_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'insurer-logos'
    AND public.is_admin()
  );

-- Policy: Allow insurers to upload their own logos
DROP POLICY IF EXISTS "insurer_logos_insurer_insert" ON storage.objects;
CREATE POLICY "insurer_logos_insurer_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'insurer-logos'
    AND (
      -- Admin can upload for any insurer
      public.is_admin()
      OR
      -- Insurer can upload for themselves - check by extracting insurer_id from filename
      (SELECT ia.insurer_id FROM public.insurer_accounts ia WHERE ia.profile_id = (SELECT auth.uid()))::text = (storage.foldername(name))[1]::text
      OR
      -- Also allow by checking the full filename pattern (insurer_id.ext)
      EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = (SELECT auth.uid())
          AND (name = ia.insurer_id::text || '.png'
               OR name = ia.insurer_id::text || '.jpg'
               OR name = ia.insurer_id::text || '.jpeg'
               OR name = ia.insurer_id::text || '.webp'
               OR name = ia.insurer_id::text || '.svg')
      )
    )
  );

-- Policy: Allow insurers to update their own logos
DROP POLICY IF EXISTS "insurer_logos_insurer_update" ON storage.objects;
CREATE POLICY "insurer_logos_insurer_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'insurer-logos'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = (SELECT auth.uid())
          AND (name = ia.insurer_id::text || '.png'
               OR name = ia.insurer_id::text || '.jpg'
               OR name = ia.insurer_id::text || '.jpeg'
               OR name = ia.insurer_id::text || '.webp'
               OR name = ia.insurer_id::text || '.svg')
      )
    )
  )
  WITH CHECK (
    bucket_id = 'insurer-logos'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = (SELECT auth.uid())
          AND (name = ia.insurer_id::text || '.png'
               OR name = ia.insurer_id::text || '.jpg'
               OR name = ia.insurer_id::text || '.jpeg'
               OR name = ia.insurer_id::text || '.webp'
               OR name = ia.insurer_id::text || '.svg')
      )
    )
  );

-- Policy: Allow insurers to delete their own logos
DROP POLICY IF EXISTS "insurer_logos_insurer_delete" ON storage.objects;
CREATE POLICY "insurer_logos_insurer_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'insurer-logos'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.insurer_accounts ia
        WHERE ia.profile_id = (SELECT auth.uid())
          AND (name = ia.insurer_id::text || '.png'
               OR name = ia.insurer_id::text || '.jpg'
               OR name = ia.insurer_id::text || '.jpeg'
               OR name = ia.insurer_id::text || '.webp'
               OR name = ia.insurer_id::text || '.svg')
      )
    )
  );

-- Grant usage on the schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Function to get public URL for insurer logo
CREATE OR REPLACE FUNCTION public.get_insurer_logo_url(insurer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(
      i.logo_url,
      '/storage/v1/object/public/insurer-logos/' || insurer_id::text || '.png'
    )
  FROM public.insurers i
  WHERE i.id = insurer_id;
$$;

COMMENT ON FUNCTION public.get_insurer_logo_url IS 'Returns the public URL for an insurer logo';
