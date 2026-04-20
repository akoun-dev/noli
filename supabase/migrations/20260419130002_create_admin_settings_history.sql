-- =============================================================================
-- Migration: Admin Settings History Table
-- Date: 2026-04-19
-- Purpose: Create table for settings change history
-- =============================================================================

-- Table for settings change history
CREATE TABLE IF NOT EXISTS public.admin_settings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  change_reason text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS admin_settings_history_key_idx
  ON public.admin_settings_history (setting_key);
CREATE INDEX IF NOT EXISTS admin_settings_history_changed_by_idx
  ON public.admin_settings_history (changed_by);
CREATE INDEX IF NOT EXISTS admin_settings_history_created_at_idx
  ON public.admin_settings_history (created_at DESC);

-- RLS
ALTER TABLE public.admin_settings_history ENABLE ROW LEVEL SECURITY;

-- Policies for settings history
DROP POLICY IF EXISTS admin_settings_history_admin_select ON public.admin_settings_history;
CREATE POLICY admin_settings_history_admin_select
  ON public.admin_settings_history
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS admin_settings_history_admin_insert ON public.admin_settings_history;
CREATE POLICY admin_settings_history_admin_insert
  ON public.admin_settings_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT ON public.admin_settings_history TO authenticated;
