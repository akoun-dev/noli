-- =============================================================================
-- Migration: Custom Roles System
-- Date: 2026-04-19
-- Purpose: Create a flexible RBAC system with custom roles and permissions
-- Maintains backward compatibility with existing USER, INSURER, ADMIN roles
-- =============================================================================

-- =============================================================================
-- TABLE: permissions
-- Defines all available permissions in the system
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.permissions IS 'Available permissions in the system';
COMMENT ON COLUMN public.permissions.name IS 'Unique permission identifier (e.g., user.view, offer.create)';
COMMENT ON COLUMN public.permissions.resource IS 'Resource type (user, offer, quote, policy, analytics, etc.)';
COMMENT ON COLUMN public.permissions.action IS 'Action type (view, create, update, delete, respond, assign)';
COMMENT ON COLUMN public.permissions.category IS 'Permission category for grouping in UI';

-- Indexes
CREATE INDEX IF NOT EXISTS permissions_resource_idx ON public.permissions (resource);
CREATE INDEX IF NOT EXISTS permissions_category_idx ON public.permissions (category);
CREATE INDEX IF NOT EXISTS permissions_name_idx ON public.permissions (name);

-- =============================================================================
-- TABLE: custom_roles
-- Custom roles with granular permissions
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

-- =============================================================================
-- TABLE: role_permissions
-- Associates permissions with roles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Add comments
COMMENT ON TABLE public.role_permissions IS 'Associates permissions with custom roles';

-- Indexes
CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON public.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_idx ON public.role_permissions (permission_id);

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

-- =============================================================================
-- INSERT DEFAULT PERMISSIONS (21 permissions)
-- =============================================================================
INSERT INTO public.permissions (name, resource, action, description, category) VALUES
  -- User Management
  ('user.view', 'user', 'view', 'Voir les utilisateurs', 'USER_MANAGEMENT'),
  ('user.create', 'user', 'create', 'Créer des utilisateurs', 'USER_MANAGEMENT'),
  ('user.update', 'user', 'update', 'Modifier les utilisateurs', 'USER_MANAGEMENT'),
  ('user.delete', 'user', 'delete', 'Supprimer des utilisateurs', 'USER_MANAGEMENT'),

  -- Offer Management
  ('offer.view', 'offer', 'view', 'Voir les offres', 'OFFER_MANAGEMENT'),
  ('offer.create', 'offer', 'create', 'Créer des offres', 'OFFER_MANAGEMENT'),
  ('offer.update', 'offer', 'update', 'Modifier des offres', 'OFFER_MANAGEMENT'),
  ('offer.delete', 'offer', 'delete', 'Supprimer des offres', 'OFFER_MANAGEMENT'),

  -- Quote Management
  ('quote.view', 'quote', 'view', 'Voir les devis', 'QUOTE_MANAGEMENT'),
  ('quote.create', 'quote', 'create', 'Créer des devis', 'QUOTE_MANAGEMENT'),
  ('quote.respond', 'quote', 'respond', 'Répondre aux devis', 'QUOTE_MANAGEMENT'),

  -- Policy Management
  ('policy.view', 'policy', 'view', 'Voir les polices', 'POLICY_MANAGEMENT'),
  ('policy.create', 'policy', 'create', 'Créer des polices', 'POLICY_MANAGEMENT'),
  ('policy.update', 'policy', 'update', 'Modifier des polices', 'POLICY_MANAGEMENT'),

  -- Analytics
  ('analytics.view', 'analytics', 'view', 'Voir les analytics', 'ANALYTICS'),

  -- Audit Logs
  ('audit.view', 'audit', 'view', 'Voir les journaux d''audit', 'AUDIT_LOGS'),

  -- System Config
  ('system.view', 'system', 'view', 'Voir la configuration système', 'SYSTEM_CONFIG'),
  ('system.update', 'system', 'update', 'Modifier la configuration système', 'SYSTEM_CONFIG'),

  -- Role Management
  ('role.view', 'role', 'view', 'Voir les rôles', 'ROLE_MANAGEMENT'),
  ('role.create', 'role', 'create', 'Créer des rôles', 'ROLE_MANAGEMENT'),
  ('role.update', 'role', 'update', 'Modifier des rôles', 'ROLE_MANAGEMENT'),
  ('role.delete', 'role', 'delete', 'Supprimer des rôles', 'ROLE_MANAGEMENT'),
  ('role.assign', 'role', 'assign', 'Assigner des rôles aux utilisateurs', 'ROLE_MANAGEMENT')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- CREATE SYSTEM ROLES with permissions
-- =============================================================================

-- Helper function to get permission ID by name
CREATE OR REPLACE FUNCTION get_permission_id(p_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.permissions WHERE name = p_name LIMIT 1;
$$;

-- USER Role (basic permissions)
INSERT INTO public.custom_roles (id, name, description, is_system_role, is_active, created_by)
VALUES (
  gen_random_uuid(),
  'USER',
  'Accès client standard pour comparer des offres et gérer ses polices',
  true,
  true,
  NULL
)
ON CONFLICT (name) DO NOTHING;

-- Insert USER permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM public.custom_roles WHERE name = 'USER' LIMIT 1),
  id
FROM public.permissions
WHERE name IN ('offer.view', 'quote.view', 'quote.create', 'policy.view', 'user.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- INSURER Role (offer and quote management)
INSERT INTO public.custom_roles (id, name, description, is_system_role, is_active, created_by)
VALUES (
  gen_random_uuid(),
  'INSURER',
  'Gestion des offres, devis et polices pour une compagnie d''assurance',
  true,
  true,
  NULL
)
ON CONFLICT (name) DO NOTHING;

-- Insert INSURER permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM public.custom_roles WHERE name = 'INSURER' LIMIT 1),
  id
FROM public.permissions
WHERE name IN (
  'offer.view', 'offer.create', 'offer.update', 'offer.delete',
  'quote.view', 'quote.respond',
  'policy.view', 'policy.create', 'policy.update',
  'analytics.view',
  'user.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN Role (all permissions)
INSERT INTO public.custom_roles (id, name, description, is_system_role, is_active, created_by)
VALUES (
  gen_random_uuid(),
  'ADMIN',
  'Accès complet à toutes les fonctionnalités du système',
  true,
  true,
  NULL
)
ON CONFLICT (name) DO NOTHING;

-- Insert ADMIN permissions (all)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM public.custom_roles WHERE name = 'ADMIN' LIMIT 1),
  id
FROM public.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Permissions table RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permissions_authenticated_read ON public.permissions;
CREATE POLICY permissions_authenticated_read
  ON public.permissions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS permissions_admin_manage ON public.permissions;
CREATE POLICY permissions_admin_manage
  ON public.permissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Custom roles table RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS custom_roles_authenticated_read_active ON public.custom_roles;
CREATE POLICY custom_roles_authenticated_read_active
  ON public.custom_roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS custom_roles_admin_manage ON public.custom_roles;
CREATE POLICY custom_roles_admin_manage
  ON public.custom_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Role permissions table RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_permissions_authenticated_read ON public.role_permissions;
CREATE POLICY role_permissions_authenticated_read
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_roles
      WHERE custom_roles.id = role_permissions.role_id
      AND custom_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS role_permissions_admin_manage ON public.role_permissions;
CREATE POLICY role_permissions_admin_manage
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- UPDATE PROFILES TABLE RLS for custom_role_id
-- =============================================================================

DROP POLICY IF EXISTS profiles_update_custom_role ON public.profiles;
CREATE POLICY profiles_update_custom_role
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- UPDATED/NEW FUNCTIONS
-- =============================================================================

-- Get user permissions (supports both custom and system roles)
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
  v_custom_role_id uuid;
  v_system_role public.profile_role := 'USER';
BEGIN
  -- Get user's role information
  SELECT custom_role_id, COALESCE(role, 'USER')
  INTO v_custom_role_id, v_system_role
  FROM public.profiles
  WHERE id = p_user_uuid
    AND is_active = TRUE
  LIMIT 1;

  -- If user has a custom role, return those permissions
  IF v_custom_role_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      p.name AS permission_name,
      p.resource AS resource_type,
      (p.action = 'view')::boolean AS can_read,
      (p.action IN ('create', 'update', 'respond', 'assign'))::boolean AS can_write,
      (p.action = 'delete')::boolean AS can_delete,
      p.description,
      p.category
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.custom_roles cr ON cr.id = rp.role_id
    WHERE cr.id = v_custom_role_id
      AND cr.is_active = TRUE;

  -- Otherwise, return system role permissions
  ELSE
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
    WHERE definitions.role = v_system_role;
  END IF;
END;
$$;

-- User has permission check (supports both custom and system roles)
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
  v_custom_role_id uuid;
  v_system_role public.profile_role := 'USER';
BEGIN
  IF p_permission_name IS NULL OR p_target_user IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get user's role information
  SELECT custom_role_id, COALESCE(role, 'USER')
  INTO v_custom_role_id, v_system_role
  FROM public.profiles
  WHERE id = p_target_user
    AND is_active = TRUE
  LIMIT 1;

  -- Check custom role permissions
  IF v_custom_role_id IS NOT NULL THEN
    SELECT *
    INTO perm
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.custom_roles cr ON cr.id = rp.role_id
    WHERE cr.id = v_custom_role_id
      AND cr.is_active = TRUE
      AND p.name = p_permission_name
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    -- Map action to permission type
    CASE normalized_action
      WHEN 'read' THEN RETURN (perm.action = 'view');
      WHEN 'write' THEN RETURN (perm.action IN ('create', 'update', 'respond', 'assign'));
      WHEN 'delete' THEN RETURN (perm.action = 'delete');
      ELSE RETURN FALSE;
    END CASE;

  -- Check system role permissions
  ELSE
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
  END IF;
END;
$$;

-- Is admin check (supports both custom and system roles)
CREATE OR REPLACE FUNCTION public.is_admin_custom(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_custom_role_id uuid;
  v_system_role public.profile_role;
BEGIN
  -- Get user's role information
  SELECT custom_role_id, role
  INTO v_custom_role_id, v_system_role
  FROM public.profiles
  WHERE id = p_user_id
    AND is_active = TRUE
  LIMIT 1;

  -- Check if system role is ADMIN
  IF v_system_role = 'ADMIN' THEN
    RETURN TRUE;
  END IF;

  -- Check if custom role has admin-like permissions
  IF v_custom_role_id IS NOT NULL THEN
    -- Check if role has all admin permissions
    RETURN EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      JOIN public.permissions p ON p.id = rp.permission_id
      JOIN public.custom_roles cr ON cr.id = rp.role_id
      WHERE cr.id = v_custom_role_id
        AND cr.is_active = TRUE
        AND p.category IN ('SYSTEM_CONFIG', 'ROLE_MANAGEMENT', 'USER_MANAGEMENT')
      HAVING COUNT(DISTINCT p.category) >= 3
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT SELECT, INSERT, UPDATE ON public.permissions TO authenticated;
GRANT SELECT ON public.permissions TO anon;

GRANT SELECT, INSERT, UPDATE ON public.custom_roles TO authenticated;
GRANT SELECT ON public.custom_roles TO anon;

GRANT SELECT, INSERT, DELETE ON public.role_permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO anon;

-- =============================================================================
-- HELPER FUNCTIONS FOR ROLE MANAGEMENT
-- =============================================================================

-- Function to check if a role can be deleted (not system and not assigned)
CREATE OR REPLACE FUNCTION public.can_delete_role(p_role_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_system boolean;
  v_user_count bigint;
BEGIN
  -- Check if role is a system role
  SELECT is_system_role
  INTO v_is_system
  FROM public.custom_roles
  WHERE id = p_role_id;

  IF v_is_system THEN
    RETURN FALSE;
  END IF;

  -- Check if role is assigned to any user
  SELECT COUNT(*)
  INTO v_user_count
  FROM public.profiles
  WHERE custom_role_id = p_role_id;

  RETURN v_user_count = 0;
END;
$$;

-- Function to get role with permissions
CREATE OR REPLACE FUNCTION public.get_role_with_permissions(p_role_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  is_system_role boolean,
  is_active boolean,
  permission_id uuid,
  permission_name text,
  permission_resource text,
  permission_action text,
  permission_category text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    cr.id,
    cr.name,
    cr.description,
    cr.is_system_role,
    cr.is_active,
    p.id AS permission_id,
    p.name AS permission_name,
    p.resource AS permission_resource,
    p.action AS permission_action,
    p.category AS permission_category
  FROM public.custom_roles cr
  LEFT JOIN public.role_permissions rp ON rp.role_id = cr.id
  LEFT JOIN public.permissions p ON p.id = rp.permission_id
  WHERE cr.id = p_role_id;
$$;
