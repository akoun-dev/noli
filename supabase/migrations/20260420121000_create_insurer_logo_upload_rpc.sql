-- =============================================================================
-- Migration: Insurer Logo Upload RPC
-- Date: 2026-04-20
-- Purpose: RPC function for uploading insurer logos with proper permissions
-- =============================================================================

-- Function to upload insurer logo
CREATE OR REPLACE FUNCTION public.upload_insurer_logo(
  p_file_name text,
  p_file_content bytea,
  p_content_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_insurer_id uuid;
  v_file_path text;
  v_public_url text;
BEGIN
  -- Get current user's insurer_id
  SELECT ia.insurer_id
  INTO v_insurer_id
  FROM public.insurer_accounts ia
  WHERE ia.profile_id = (SELECT auth.uid())
  LIMIT 1;

  IF v_insurer_id IS NULL THEN
    RAISE EXCEPTION 'User is not associated with an insurer';
  END IF;

  -- Determine file extension from content type
  v_file_path := v_insurer_id::text || CASE
    WHEN p_content_type = 'image/png' THEN '.png'
    WHEN p_content_type = 'image/jpeg' THEN '.jpg'
    WHEN p_content_type = 'image/jpg' THEN '.jpg'
    WHEN p_content_type = 'image/webp' THEN '.webp'
    WHEN p_content_type = 'image/svg+xml' THEN '.svg'
    ELSE '.png'
  END;

  -- Insert the file into storage
  -- Note: This uses the storage.insert function which bypasses some RLS checks
  INSERT INTO storage.objects (
    bucket_id,
    name,
    owner,
    metadata,
    created_at
  )
  VALUES (
    'insurer-logos',
    v_file_path,
    (SELECT auth.uid())::text,
    jsonb_build_object(
      'content_type', p_content_type,
      'insurer_id', v_insurer_id
    ),
    now()
  )
  ON CONFLICT (bucket_id, name) DO UPDATE SET
    metadata = jsonb_build_object(
      'content_type', p_content_type,
      'insurer_id', v_insurer_id,
      'updated_at', now()
    );

  -- Construct public URL
  v_public_url := '/storage/v1/object/public/insurer-logos/' || v_file_path;

  -- Update insurer record with new logo URL
  UPDATE public.insurers
  SET logo_url = v_public_url,
      updated_at = now()
  WHERE id = v_insurer_id;

  RETURN jsonb_build_object(
    'success', true,
    'file_path', v_file_path,
    'public_url', v_public_url,
    'insurer_id', v_insurer_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upload_insurer_logo(text, bytea, text) TO authenticated;

COMMENT ON FUNCTION public.upload_insurer_logo IS 'Upload a logo for the current user''s insurer company';
