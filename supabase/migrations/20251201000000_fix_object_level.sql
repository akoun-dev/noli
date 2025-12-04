-- Migration fix-object-level for Storage API
-- This migration fixes object-level permissions for the storage system

-- Create the storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bucket_id text NOT NULL,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_accessed_at timestamptz DEFAULT now() NOT NULL,
  file_tokens jsonb DEFAULT '[]'::jsonb,
  path_tokens text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  size int8 DEFAULT 0 NOT NULL,
  etag text NOT NULL,
  version text NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT objects_name_format CHECK ((name ~ '^[^\\0]+$')),
  CONSTRAINT objects_bucket_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) ON DELETE CASCADE
);

-- Create storage.migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.migrations (
  name text NOT NULL,
  hash text NOT NULL,
  executed_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (name)
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own objects" ON storage.objects;

-- Create fresh object-level policies
CREATE POLICY "Users can view their own objects" ON storage.objects
  FOR SELECT USING (bucket_id IN (SELECT bucket_id FROM storage.buckets WHERE name = 'user-data' AND owner = auth.uid()) OR owner = auth.uid());

CREATE POLICY "Users can insert their own objects" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN (SELECT bucket_id FROM storage.buckets WHERE name = 'user-data' AND owner = auth.uid()) OR owner = auth.uid());

CREATE POLICY "Users can update their own objects" ON storage.objects
  FOR UPDATE USING (bucket_id IN (SELECT bucket_id FROM storage.buckets WHERE name = 'user-data' AND owner = auth.uid()) OR owner = auth.uid());

CREATE POLICY "Users can delete their own objects" ON storage.objects
  FOR DELETE USING (bucket_id IN (SELECT bucket_id FROM storage.buckets WHERE name = 'user-data' AND owner = auth.uid()) OR owner = auth.uid());

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- Create the trigger for updated_at
DROP TRIGGER IF EXISTS objects_updated_at ON storage.objects;
CREATE TRIGGER objects_updated_at
  BEFORE UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage.updated_at();