-- =============================================================================
-- Security regression test for 20251121000000_security_harden_rbac.sql
-- =============================================================================
--
-- Self-contained: builds a minimal stub of the Supabase surface the migration
-- depends on (auth.uid(), profiles/quotes tables, profile_role enum,
-- log_admin_action), applies the migration, then asserts the RBAC behaviour.
-- Any failed ASSERT aborts the script with a non-zero status.
--
-- How to run against a throwaway Postgres 15/16 cluster:
--
--   initdb -D /tmp/pgt/data -U postgres --auth=trust
--   pg_ctl -D /tmp/pgt/data -o "-p 55432 -k /tmp/pgt" -l /tmp/pgt/log start
--   createuser ... # (see below) OR:
--   psql -h /tmp/pgt -p 55432 -U postgres \
--        -c "CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE anon;"
--   psql -h /tmp/pgt -p 55432 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/rbac_security_test.sql \
--        -f supabase/migrations/20251121000000_security_harden_rbac.sql \
--        -f supabase/tests/rbac_security_assertions.sql
--
-- (This file only builds the stub; assertions live in the companion file so the
-- migration can be sandwiched between them.)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

-- Simulate the authenticated end user via a GUC. Empty => no JWT (service_role).
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('test.uid', true), '')::uuid;
$$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT '{}'::jsonb;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE public.profile_role AS ENUM ('USER', 'INSURER', 'ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  role public.profile_role DEFAULT 'USER',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text,
  total_premium numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, action text, resource_type text, resource_id uuid,
  old_values jsonb, new_values jsonb, success boolean, error_message text,
  severity text, metadata jsonb, created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text, p_resource_type text, p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL, p_new_values jsonb DEFAULT NULL,
  p_success boolean DEFAULT true, p_error_message text DEFAULT NULL,
  p_severity text DEFAULT 'info', p_metadata jsonb DEFAULT NULL
) RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;

-- The pre-migration (vulnerable) policy the migration is expected to replace.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- A representative analytics view (must end up security_invoker).
CREATE OR REPLACE VIEW public.user_stats_view AS
  SELECT count(*) AS n FROM public.profiles;
