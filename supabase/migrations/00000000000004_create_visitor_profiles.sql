-- =============================================================================
-- Migration: Create Visitor Profiles Table
-- Date: 2024-05-09
-- Purpose: Store temporary profile data for unauthenticated visitors
-- =============================================================================

CREATE TABLE public.visitor_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  email text,
  full_name text,
  phone text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_marketing boolean NOT NULL DEFAULT false,
  consent_terms boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT visitor_profiles_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS visitor_profiles_email_idx ON public.visitor_profiles (LOWER(email));

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_visitor_profiles ON public.visitor_profiles;
CREATE TRIGGER trg_set_updated_at_visitor_profiles
  BEFORE UPDATE ON public.visitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visitor_profiles_no_direct_access ON public.visitor_profiles;
CREATE POLICY visitor_profiles_no_direct_access
  ON public.visitor_profiles
  FOR ALL
  TO PUBLIC
  USING (FALSE)
  WITH CHECK (FALSE);

-- Grants
GRANT SELECT ON public.visitor_profiles TO authenticated, service_role;
