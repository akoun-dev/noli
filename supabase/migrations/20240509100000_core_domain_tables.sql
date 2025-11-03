-- =============================================================================
-- Migration: core domain tables bootstrap
-- Purpose:
--   * Provide base tables required by subsequent coverage/quote migrations
--   * Align structure with existing TypeScript Database definitions
--   * Apply sane defaults and RLS scaffolding for Supabase setup
-- =============================================================================

-- Ensure UUID generation helper is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE public.profile_role AS ENUM ('USER', 'INSURER', 'ADMIN');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    CREATE TYPE public.quote_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Profiles table (mirrors Supabase auth users)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  role public.profile_role NOT NULL DEFAULT 'USER',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT TRUE,
  email_verified boolean NOT NULL DEFAULT FALSE,
  phone_verified boolean NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (LOWER(email));

DROP TRIGGER IF EXISTS trg_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Minimal policies (to be refined in dedicated migration)
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- ---------------------------------------------------------------------------
-- Insurance categories (used by quotes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insurance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_insurance_categories ON public.insurance_categories;
CREATE TRIGGER trg_set_updated_at_insurance_categories
  BEFORE UPDATE ON public.insurance_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurance_categories_public_select ON public.insurance_categories;
CREATE POLICY insurance_categories_public_select
  ON public.insurance_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS insurance_categories_manage_authenticated ON public.insurance_categories;
CREATE POLICY insurance_categories_manage_authenticated
  ON public.insurance_categories
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

GRANT SELECT ON public.insurance_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurance_categories TO authenticated;

-- ---------------------------------------------------------------------------
-- Quotes table (core for comparison flow)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.insurance_categories(id) ON DELETE SET NULL,
  status public.quote_status NOT NULL DEFAULT 'DRAFT',
  personal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  vehicle_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  property_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  coverage_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_price numeric,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotes_user_idx ON public.quotes (user_id);
CREATE INDEX IF NOT EXISTS quotes_category_idx ON public.quotes (category_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes (status);

DROP TRIGGER IF EXISTS trg_set_updated_at_quotes ON public.quotes;
CREATE TRIGGER trg_set_updated_at_quotes
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_owner_access ON public.quotes;
CREATE POLICY quotes_owner_access
  ON public.quotes
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quotes_owner_manage ON public.quotes;
CREATE POLICY quotes_owner_manage
  ON public.quotes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
