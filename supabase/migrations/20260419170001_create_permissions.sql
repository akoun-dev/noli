-- =============================================================================
-- Migration: Permissions Table
-- Date: 2026-04-19
-- Purpose: Define all available permissions in the system
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

-- RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS permissions_authenticated_read ON public.permissions;
CREATE POLICY permissions_authenticated_read
  ON public.permissions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS permissions_admin_insert ON public.permissions;
CREATE POLICY permissions_admin_insert
  ON public.permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS permissions_admin_update ON public.permissions;
CREATE POLICY permissions_admin_update
  ON public.permissions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GRANTS
GRANT SELECT, INSERT, UPDATE ON public.permissions TO authenticated;
GRANT SELECT ON public.permissions TO anon;
