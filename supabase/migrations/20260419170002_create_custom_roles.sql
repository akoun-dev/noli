-- =============================================================================
-- Migration: Custom Roles Table
-- Date: 2026-04-19
-- Purpose: Custom roles with granular permissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.custom_roles IS 'Custom roles with granular permissions';
COMMENT ON COLUMN public.custom_roles.is_system_role IS 'System roles (USER, INSURER, ADMIN) cannot be modified or deleted';
COMMENT ON COLUMN public.custom_roles.is_active IS 'Inactive roles cannot be assigned to users';

-- Indexes
CREATE INDEX IF NOT EXISTS custom_roles_name_idx ON public.custom_roles (name);
CREATE INDEX IF NOT EXISTS custom_roles_active_idx ON public.custom_roles (is_active);
CREATE INDEX IF NOT EXISTS custom_roles_system_idx ON public.custom_roles (is_system_role);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_custom_roles ON public.custom_roles;
CREATE TRIGGER trg_set_updated_at_custom_roles
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS custom_roles_authenticated_read_active ON public.custom_roles;
CREATE POLICY custom_roles_authenticated_read_active
  ON public.custom_roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS custom_roles_admin_insert ON public.custom_roles;
CREATE POLICY custom_roles_admin_insert
  ON public.custom_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS custom_roles_admin_update ON public.custom_roles;
CREATE POLICY custom_roles_admin_update
  ON public.custom_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS custom_roles_admin_delete ON public.custom_roles;
CREATE POLICY custom_roles_admin_delete
  ON public.custom_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- ALTER TABLE: profiles
-- Add custom_role_id column for backward compatibility
-- =============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.custom_role_id IS 'Custom role assigned to user (null = use system role from role column)';

-- Index for quick lookup of users by custom role
CREATE INDEX IF NOT EXISTS profiles_custom_role_idx ON public.profiles (custom_role_id) WHERE custom_role_id IS NOT NULL;

-- UPDATE PROFILES TABLE RLS for custom_role_id
DROP POLICY IF EXISTS profiles_update_custom_role ON public.profiles;
CREATE POLICY profiles_update_custom_role
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GRANTS
GRANT SELECT, INSERT, UPDATE ON public.custom_roles TO authenticated;
GRANT SELECT ON public.custom_roles TO anon;
