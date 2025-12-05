-- =============================================================================
-- Migration: Fix admin_create_user return type issue
-- Date: 2025-12-05
-- Purpose: Correct the return type of admin_create_user function to ensure
--          user_id is properly returned as uuid instead of text
-- =============================================================================

-- Drop and recreate the function with explicit type casting
DROP FUNCTION IF EXISTS public.admin_create_user(
  email_param text,
  first_name_param text,
  last_name_param text,
  company_name_param text,
  phone_param text,
  role_param text,
  is_active_param boolean
);

CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_param text,
  first_name_param text DEFAULT NULL,
  last_name_param text DEFAULT NULL,
  company_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  role_param text DEFAULT 'USER',
  is_active_param boolean DEFAULT true
) RETURNS TABLE (
  success boolean,
  user_id uuid,
  message text
) AS $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    company_name,
    phone,
    role,
    is_active
  ) VALUES (
    gen_random_uuid(),
    email_param,
    first_name_param,
    last_name_param,
    company_name_param,
    phone_param,
    role_param::public.profile_role,
    COALESCE(is_active_param, true)
  )
  RETURNING id INTO v_user_id;

  PERFORM admin_user_operation(
    'create',
    v_user_id,
    jsonb_build_object(
      'email', email_param,
      'role', role_param,
      'is_active', is_active_param
    ),
    'Manual admin creation'
  );

  -- Explicit type casting to ensure correct return types
  RETURN QUERY SELECT true::boolean, v_user_id::uuid, 'User created successfully'::text;
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, 'Email already exists'::text;
  WHEN OTHERS THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, COALESCE(SQLERRM, 'Unexpected error')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_create_user(
  email_param text,
  first_name_param text,
  last_name_param text,
  company_name_param text,
  phone_param text,
  role_param text,
  is_active_param boolean
) TO authenticated;