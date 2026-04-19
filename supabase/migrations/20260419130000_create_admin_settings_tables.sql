-- =============================================================================
-- Migration: Admin Settings Tables
-- Date: 2026-04-19
-- Purpose: Create tables for system settings management
-- =============================================================================

-- Table for system settings (key-value pairs)
CREATE TABLE IF NOT EXISTS public.admin_system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_sensitive boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS admin_system_settings_category_idx
  ON public.admin_system_settings (category);
CREATE INDEX IF NOT EXISTS admin_settings_history_key_idx
  ON public.admin_settings_history (setting_key);
CREATE INDEX IF NOT EXISTS admin_settings_history_changed_by_idx
  ON public.admin_settings_history (changed_by);
CREATE INDEX IF NOT EXISTS admin_settings_history_created_at_idx
  ON public.admin_settings_history (created_at DESC);

-- RLS
ALTER TABLE public.admin_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings_history ENABLE ROW LEVEL SECURITY;

-- Policies for system settings
DROP POLICY IF EXISTS admin_system_settings_admin_select ON public.admin_system_settings;
CREATE POLICY admin_system_settings_admin_select
  ON public.admin_system_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS admin_system_settings_admin_manage ON public.admin_system_settings;
CREATE POLICY admin_system_settings_admin_manage
  ON public.admin_system_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_system_settings TO authenticated;
GRANT SELECT, INSERT ON public.admin_settings_history TO authenticated;

-- Function to get setting value
CREATE OR REPLACE FUNCTION public.get_setting(setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN value FROM public.admin_system_settings WHERE key = setting_key;
END;
$$;

-- Function to set setting value (with history tracking)
CREATE OR REPLACE FUNCTION public.set_setting(
  setting_key text,
  new_value jsonb,
  change_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_value jsonb;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  -- Get old value
  SELECT value INTO old_value
  FROM public.admin_system_settings
  WHERE key = setting_key;

  -- Insert or update the setting
  INSERT INTO public.admin_system_settings (key, value, updated_by)
  VALUES (setting_key, new_value, current_user_id)
  ON CONFLICT (key)
  DO UPDATE SET
    value = EXCLUDED.new_value,
    updated_by = current_user_id,
    updated_at = NOW();

  -- Log the change in history
  IF old_value IS DISTINCT FROM new_value OR old_value IS NULL THEN
    INSERT INTO public.admin_settings_history (setting_key, old_value, new_value, changed_by, change_reason)
    VALUES (setting_key, old_value, new_value, current_user_id, change_reason);
  END IF;
END;
$$;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION public.get_setting(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_setting(text, jsonb, text) TO authenticated;

-- Insert default system settings
INSERT INTO public.admin_system_settings (key, value, description, category) VALUES
  ('system', '{
    "siteName": "NOLI Assurance",
    "siteDescription": "Plateforme de comparaison d''assurance auto",
    "adminEmail": "admin@noli.ci",
    "contactPhone": "+225 21 25 00 00",
    "contactAddress": "Abidjan, Côte d''Ivoire",
    "maintenanceMode": false,
    "debugMode": false,
    "registrationEnabled": true,
    "emailVerification": true
  }', 'Paramètres système généraux', 'system'),

  ('security', '{
    "sessionTimeout": 3600,
    "maxLoginAttempts": 5,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireNumbers": true,
      "requireSpecialChars": false,
      "expireDays": 90
    }
  }', 'Paramètres de sécurité', 'security'),

  ('email', '{
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpUsername": "",
    "senderName": "NOLI Assurance",
    "senderEmail": "noreply@noli.ci",
    "encryption": "tls"
  }', 'Configuration SMTP (sensible)', 'email'),

  ('notifications', '{
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "newUserRegistration": true,
    "insurerApproval": true,
    "quoteRequests": true,
    "systemAlerts": true,
    "marketingEmails": false
  }', 'Préférences de notification', 'notifications'),

  ('ui', '{
    "theme": "light",
    "language": "fr",
    "dateFormat": "DD/MM/YYYY",
    "timezone": "Africa/Abidjan",
    "itemsPerPage": 20,
    "sidebarCollapsed": false,
    "showTooltips": true,
    "animationsEnabled": true
  }', 'Paramètres interface utilisateur', 'ui')
ON CONFLICT (key) DO NOTHING;
