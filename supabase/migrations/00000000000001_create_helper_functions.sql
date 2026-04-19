-- =============================================================================
-- Migration: Helper Functions
-- Date: 2024-05-09
-- Purpose: Define shared helper functions for triggers and operations
-- =============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Email normalization function
CREATE OR REPLACE FUNCTION public.normalize_email(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN NULL
    ELSE LOWER(TRIM(p_email))
  END;
$$;

-- Null if empty function
CREATE OR REPLACE FUNCTION public.null_if_empty(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_value IS NULL THEN NULL
    WHEN LENGTH(TRIM(p_value)) = 0 THEN NULL
    ELSE TRIM(p_value)
  END;
$$;
