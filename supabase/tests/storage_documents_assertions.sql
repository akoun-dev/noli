-- =============================================================================
-- Storage RLS assertions — run AFTER the stub and the storage migration.
-- Verifies bucket privacy + per-user isolation on the "documents" bucket.
-- =============================================================================

-- Bucket must be private with the expected limits.
DO $$
DECLARE b record;
BEGIN
  SELECT * INTO b FROM storage.buckets WHERE id = 'documents';
  ASSERT b.public = false, 'documents bucket is not private';
  ASSERT b.file_size_limit = 10485760, 'documents bucket size limit is wrong';
  ASSERT array_length(b.allowed_mime_types, 1) = 6, 'documents mime allowlist is wrong';
  RAISE NOTICE 'bucket config OK';
END $$;

-- Seed two users' objects as the table owner (RLS not enforced for owner).
INSERT INTO storage.objects(bucket_id, name, owner) VALUES
  ('documents', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/f1.pdf', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('documents', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/f2.pdf', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Enforce RLS as the `authenticated` role, acting as user A.
SET ROLE authenticated;
SELECT set_config('test.uid', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);

DO $$
DECLARE n int;
BEGIN
  -- A sees only its own object.
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'documents';
  ASSERT n = 1, 'user A can see objects that are not theirs';

  -- A cannot write under B's prefix.
  BEGIN
    INSERT INTO storage.objects(bucket_id, name, owner)
      VALUES ('documents', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/evil.pdf',
              'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    RAISE EXCEPTION 'user A was able to write under another user prefix';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- expected
  END;

  -- A can write under its own prefix.
  INSERT INTO storage.objects(bucket_id, name, owner)
    VALUES ('documents', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/ok.pdf',
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

  RAISE NOTICE 'ALL STORAGE RLS ASSERTIONS PASSED';
END $$;

RESET ROLE;
