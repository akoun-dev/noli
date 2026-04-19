-- =============================================================================
-- Migration: Create insurer with profile return function
-- Date: 2025-12-05
-- Purpose: Add a function that creates an insurer and returns the complete profile
--          to avoid synchronization issues between creation and retrieval
-- =============================================================================

-- Function to create insurer and return complete profile
CREATE OR REPLACE FUNCTION public.create_insurer_with_profile(
  email_param text,
  company_name_param text,
  phone_param text DEFAULT NULL,
  description_param text DEFAULT NULL,
  website_param text DEFAULT NULL,
  license_number_param text DEFAULT NULL,
  address_param text DEFAULT NULL,
  is_active_param boolean DEFAULT true
) RETURNS TABLE (
  success boolean,
  insurer_id uuid,
  profile json,
  message text
) AS $$
DECLARE
  v_insurer_id uuid;
  v_profile json;
BEGIN
  -- Insert new insurer profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    company_name,
    phone,
    role,
    is_active,
    description,
    website,
    license_number,
    address
  ) VALUES (
    gen_random_uuid(),
    email_param,
    NULL, -- first_name
    NULL, -- last_name
    company_name_param,
    phone_param,
    'INSURER'::public.profile_role,
    is_active_param,
    description_param,
    website_param,
    license_number_param,
    address_param
  )
  RETURNING id INTO v_insurer_id;

  -- Get the complete profile as JSON
  SELECT row_to_json(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_insurer_id;

  -- Log the creation
  PERFORM admin_user_operation(
    'create',
    v_insurer_id,
    jsonb_build_object(
      'email', email_param,
      'company_name', company_name_param,
      'role', 'INSURER',
      'is_active', is_active_param
    ),
    'Insurer creation with profile'
  );

  -- Return success with complete profile
  RETURN QUERY SELECT 
    true::boolean, 
    v_insurer_id::uuid, 
    v_profile::json, 
    'Insurer created successfully'::text;

EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT 
      false::boolean, 
      NULL::uuid, 
      NULL::json, 
      'Email already exists'::text;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false::boolean, 
      NULL::uuid, 
      NULL::json, 
      COALESCE(SQLERRM, 'Unexpected error')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_insurer_with_profile(
  email_param text,
  company_name_param text,
  phone_param text,
  description_param text,
  website_param text,
  license_number_param text,
  address_param text,
  is_active_param boolean
) TO authenticated;