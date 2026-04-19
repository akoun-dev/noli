-- =============================================================================
-- Migration: Create Profiles Table
-- Date: 2024-05-09
-- Purpose: User profiles linked to Supabase auth
-- =============================================================================

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  role public.profile_role NOT NULL DEFAULT 'USER',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  email_verified boolean NOT NULL DEFAULT false,
  phone_verified boolean NOT NULL DEFAULT false,
  address text,
  last_login timestamp with time zone,
  date_of_birth date,
  preferences jsonb NOT NULL DEFAULT '{
    "language": "fr",
    "currency": "XOF",
    "timezone": "Africa/Abidjan",
    "theme": "light",
    "notifications": {
      "email": true,
      "sms": true,
      "push": true,
      "whatsapp": false
    },
    "privacy": {
      "profileVisible": true,
      "showEmail": false,
      "showPhone": false
    }
  }'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (LOWER(email));

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- Profile-dependent helper functions (must be before RLS policies)
-- =============================================================================

-- Admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'
      AND is_active = TRUE
  );
$$;

-- Admin check function with user parameter
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'ADMIN'
      AND is_active = TRUE
  );
$$;

-- Insurer check function
CREATE OR REPLACE FUNCTION public.is_insurer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'INSURER'
      AND is_active = TRUE
  );
$$;

-- Insurer check function with user parameter
CREATE OR REPLACE FUNCTION public.is_insurer(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'INSURER'
      AND is_active = TRUE
  );
$$;

-- Get user role from profiles table (for auth initialization)
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_uuid uuid)
RETURNS public.profile_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = p_user_uuid
    AND is_active = TRUE
  LIMIT 1;
$$;

-- Get user profile with role (for initialization)
CREATE OR REPLACE FUNCTION public.get_user_profile_with_role(p_user_uuid uuid)
RETURNS TABLE(
  id uuid,
  email text,
  first_name text,
  last_name text,
  company_name text,
  role public.profile_role,
  avatar_url text,
  is_active boolean,
  email_verified boolean,
  phone_verified boolean,
  phone text,
  address text,
  last_login timestamp with time zone,
  date_of_birth date,
  preferences jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.company_name,
    p.role,
    p.avatar_url,
    p.is_active,
    p.email_verified,
    p.phone_verified,
    p.phone,
    p.address,
    p.last_login,
    p.date_of_birth,
    p.preferences,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = p_user_uuid;
$$;

-- Permissions helpers
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_uuid uuid)
RETURNS TABLE(
  permission_name text,
  resource_type text,
  can_read boolean,
  can_write boolean,
  can_delete boolean,
  description text,
  category text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  effective_role public.profile_role := 'USER';
BEGIN
  SELECT COALESCE(role, 'USER')
  INTO effective_role
  FROM public.profiles
  WHERE id = p_user_uuid
    AND is_active = TRUE
  LIMIT 1;

  RETURN QUERY
  SELECT
    definitions.permission_name,
    definitions.resource_type,
    definitions.can_read,
    definitions.can_write,
    definitions.can_delete,
    definitions.description,
    definitions.category
  FROM (
    VALUES
      ('ADMIN'::public.profile_role, 'admin_access', 'all', TRUE, TRUE, TRUE, 'Accès complet au système', 'SYSTEM'),
      ('ADMIN'::public.profile_role, 'user_management', 'users', TRUE, TRUE, TRUE, 'Gestion des comptes utilisateurs', 'USER_MANAGEMENT'),
      ('INSURER'::public.profile_role, 'insurer_access', 'all', TRUE, TRUE, FALSE, 'Accès insurtech étendu', 'SYSTEM'),
      ('INSURER'::public.profile_role, 'offer_management', 'offers', TRUE, TRUE, TRUE, 'Gestion des offres et devis', 'OFFER_MANAGEMENT'),
      ('USER'::public.profile_role, 'user_access', 'all', TRUE, FALSE, FALSE, 'Accès client standard', 'USER_MANAGEMENT'),
      ('USER'::public.profile_role, 'profile_management', 'profile', TRUE, TRUE, FALSE, 'Modification du profil personnel', 'USER_MANAGEMENT')
  ) AS definitions(role, permission_name, resource_type, can_read, can_write, can_delete, description, category)
  WHERE definitions.role = effective_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission_with_action(
  p_permission_name text,
  p_action text,
  p_target_user uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  perm RECORD;
  normalized_action text := lower(coalesce(p_action, 'read'));
BEGIN
  IF p_permission_name IS NULL OR p_target_user IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT *
  INTO perm
  FROM public.get_user_permissions(p_target_user) AS perm
  WHERE perm.permission_name = p_permission_name
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN CASE normalized_action
    WHEN 'read' THEN perm.can_read
    WHEN 'write' THEN perm.can_write
    WHEN 'delete' THEN perm.can_delete
    ELSE FALSE
  END;
END;
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
CREATE POLICY profiles_admin_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
