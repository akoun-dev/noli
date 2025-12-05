-- =============================================================================
-- Migration: Fix admin_user_operation function signature
-- Date: 2025-12-05
-- Purpose: Fix the admin_user_operation function to match the correct
--          log_admin_action signature and resolve the function does not exist error
-- =============================================================================

-- Drop the problematic admin_user_operation function
DROP FUNCTION IF EXISTS public.admin_user_operation(
  p_operation TEXT,
  p_target_user_id UUID,
  p_changes JSONB,
  p_reason TEXT
);

-- Recreate admin_user_operation with the correct signature that matches
-- the log_admin_action function from 20251104162000_admin_audit_enhancements.sql
CREATE OR REPLACE FUNCTION public.admin_user_operation(
  p_operation TEXT,
  p_target_user_id UUID,
  p_changes JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_target_user_role TEXT;
  v_log_id UUID;
BEGIN
  -- Get target user information
  SELECT role INTO v_target_user_role
  FROM public.profiles
  WHERE id = p_target_user_id;

  -- Log admin operation using the correct log_admin_action signature
  v_log_id := log_admin_action(
    'ADMIN_USER_' || UPPER(p_operation),
    'user',
    p_target_user_id,
    json_build_object('role', v_target_user_role),
    p_changes,
    true,
    NULL,
    CASE
      WHEN p_operation = 'delete' THEN 'warning'
      WHEN p_operation = 'suspend' THEN 'warning'
      ELSE 'info'
    END,
    json_build_object(
      'operation', p_operation,
      'reason', p_reason,
      'target_role', v_target_user_role
    )
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Return false if logging fails, but don't fail the whole operation
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_user_operation TO authenticated;