-- =============================================================================
-- Storage hardening for the user "documents" bucket
-- =============================================================================
--
-- The application uploads user documents (identity papers, driving licence,
-- vehicle registration, …) to a Storage bucket called "documents", but no
-- bucket configuration or RLS policy was ever versioned. The code used
-- getPublicUrl(), which only works on a *public* bucket, meaning sensitive
-- documents were world-readable by URL and there was no server-side isolation
-- between users, no size limit and no MIME allowlist.
--
-- This migration makes the bucket private, caps size / MIME at the bucket
-- level, and adds per-user RLS on storage.objects so a user can only read and
-- write objects under their own `<uid>/…` prefix. The client was updated to use
-- signed URLs instead of public URLs.
-- =============================================================================

-- 1. Create (or harden) the private "documents" bucket ------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10 MiB, matches VITE_MAX_FILE_SIZE
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Per-user RLS on storage.objects for this bucket --------------------------
-- Object keys are laid out as `<auth.uid()>/<uuid>.<ext>` (see
-- src/lib/file-upload.ts::buildSafeStorageKey), so the first path segment is the
-- owner id. A user may only touch objects whose first segment matches their uid.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_read_own" ON storage.objects;
CREATE POLICY "documents_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "documents_insert_own" ON storage.objects;
CREATE POLICY "documents_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "documents_update_own" ON storage.objects;
CREATE POLICY "documents_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "documents_delete_own" ON storage.objects;
CREATE POLICY "documents_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
