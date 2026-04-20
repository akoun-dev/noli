-- =============================================================================
-- Migration: Admin Update History Table
-- Date: 2026-04-19
-- Purpose: Track data modifications
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Update History - Track data modifications
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_update_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'export')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  user_email text,
  details text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'pending')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_update_history_entity_type_idx
  ON public.admin_update_history (entity_type);
CREATE INDEX IF NOT EXISTS admin_update_history_action_idx
  ON public.admin_update_history (action);
CREATE INDEX IF NOT EXISTS admin_update_history_user_id_idx
  ON public.admin_update_history (user_id);
CREATE INDEX IF NOT EXISTS admin_update_history_created_at_idx
  ON public.admin_update_history (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_update_history_entity_id_idx
  ON public.admin_update_history (entity_id);

ALTER TABLE public.admin_update_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all history
DROP POLICY IF EXISTS admin_update_history_admin_select ON public.admin_update_history;
CREATE POLICY admin_update_history_admin_select
  ON public.admin_update_history
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: Admins can insert history
DROP POLICY IF EXISTS admin_update_history_admin_insert ON public.admin_update_history;
CREATE POLICY admin_update_history_admin_insert
  ON public.admin_update_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT ON public.admin_update_history TO authenticated;
