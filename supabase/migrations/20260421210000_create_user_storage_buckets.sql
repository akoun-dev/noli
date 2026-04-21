-- Migration: Create user storage buckets for avatars and documents
-- Date: 2026-04-21

-- NOTE: This migration is for documentation purposes only
-- Local Supabase will auto-create storage buckets when first accessed
-- Production: Create buckets via Supabase CLI or Dashboard

-- Documentation for manual bucket creation:

-- Bucket: avatars
--   Purpose: User profile pictures
--   Public: Yes (for displaying avatars)
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
--   Path pattern: {userId}/{timestamp}_{random}.{ext}

-- Bucket: documents
--   Purpose: User personal documents
--   Public: No (private)
--   File size limit: 10MB
--   Allowed MIME types: application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   Path pattern: {userId}/{timestamp}_{random}.{ext}

-- Storage structure notes:
-- - Avatars are publicly accessible via public URLs
-- - Documents are private to each user
-- - Each user can only access their own files
-- - Files are organized by user ID in the path
