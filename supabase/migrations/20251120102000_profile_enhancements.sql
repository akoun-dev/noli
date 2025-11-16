-- =============================================================================
-- Migration: Profile enhancements for Admin portal
-- Date: 2025-11-20
-- Purpose:
--   * Add missing profile columns (address, last_login) required by Admin UI
--   * Keep last_login in sync with session activity via trigger
-- =============================================================================

-- Add address column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'address'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN address text;
  END IF;
END $$;

-- Add last_login column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'last_login'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Provide compatibility wrapper for legacy triggers expecting JSON parameters
DO $$
BEGIN
  IF to_regprocedure('public.log_user_action(text,text,uuid,json,json,boolean,text,json)') IS NULL
     AND to_regprocedure('public.log_user_action(text,text,uuid,jsonb,jsonb,boolean,text,jsonb)') IS NOT NULL THEN
    EXECUTE $wrapper$
      CREATE OR REPLACE FUNCTION public.log_user_action(
        p_action TEXT,
        p_resource_type TEXT,
        p_resource_id UUID DEFAULT NULL,
        p_old_values JSON DEFAULT NULL,
        p_new_values JSON DEFAULT NULL,
        p_success BOOLEAN DEFAULT true,
        p_error_message TEXT DEFAULT NULL,
        p_metadata JSON DEFAULT NULL
      ) RETURNS UUID AS $body$
      BEGIN
        RETURN public.log_user_action(
          p_action,
          p_resource_type,
          p_resource_id,
          p_old_values::jsonb,
          p_new_values::jsonb,
          p_success,
          p_error_message,
          p_metadata::jsonb
        );
      END;
      $body$ LANGUAGE plpgsql SECURITY DEFINER;
    $wrapper$;
  END IF;
END $$;

-- Backfill last_login only if audit trigger dependencies are available
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_name = 'profile_audit_trigger'
      AND event_object_table = 'profiles'
      AND event_object_schema = 'public'
  ) INTO v_trigger_exists;

  IF v_trigger_exists THEN
    EXECUTE 'ALTER TABLE public.profiles DISABLE TRIGGER profile_audit_trigger';
  END IF;

  UPDATE public.profiles
  SET last_login = COALESCE(last_login, created_at)
  WHERE last_login IS NULL;

  IF v_trigger_exists THEN
    EXECUTE 'ALTER TABLE public.profiles ENABLE TRIGGER profile_audit_trigger';
  END IF;
END $$;

-- Helper function to refresh last_login from user_sessions activity
CREATE OR REPLACE FUNCTION public.refresh_profile_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = COALESCE(NEW.last_accessed_at, NOW())
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile.last_login whenever a session is created/refreshed
DROP TRIGGER IF EXISTS trg_refresh_profile_last_login ON public.user_sessions;
CREATE TRIGGER trg_refresh_profile_last_login
  AFTER INSERT OR UPDATE OF last_accessed_at
  ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_profile_last_login();
