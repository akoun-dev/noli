-- Add simple profile creation function for signup
-- This function will be used to create user profiles during signup

-- Drop the problematic email normalization function if it exists
DROP FUNCTION IF EXISTS public.normalize_email(text);

-- Simple email normalization
CREATE OR REPLACE FUNCTION public.normalize_email(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT LOWER(TRIM(p_email));
$$;

-- Simple profile creation function for signup
CREATE OR REPLACE FUNCTION public.create_user_profile_signup(
  p_user_id uuid,
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_company_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles;
BEGIN
  -- Validate required fields
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id est obligatoire' USING ERRCODE = '23502';
  END IF;

  IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
    RAISE EXCEPTION 'p_email est obligatoire' USING ERRCODE = '23502';
  END IF;

  -- Create or update profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    company_name,
    role,
    avatar_url,
    is_active,
    email_verified,
    phone_verified
  )
  VALUES (
    p_user_id,
    public.normalize_email(p_email),
    CASE WHEN LENGTH(TRIM(COALESCE(p_first_name, ''))) > 0 THEN TRIM(p_first_name) ELSE NULL END,
    CASE WHEN LENGTH(TRIM(COALESCE(p_last_name, ''))) > 0 THEN TRIM(p_last_name) ELSE NULL END,
    CASE WHEN LENGTH(TRIM(COALESCE(p_phone, ''))) > 0 THEN TRIM(p_phone) ELSE NULL END,
    CASE WHEN LENGTH(TRIM(COALESCE(p_company_name, ''))) > 0 THEN TRIM(p_company_name) ELSE NULL END,
    'USER'::public.profile_role,
    CASE WHEN LENGTH(TRIM(COALESCE(p_avatar_url, ''))) > 0 THEN TRIM(p_avatar_url) ELSE NULL END,
    TRUE,
    TRUE,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = public.normalize_email(p_email),
    first_name = CASE WHEN LENGTH(TRIM(COALESCE(p_first_name, ''))) > 0 THEN TRIM(p_first_name) ELSE NULL END,
    last_name = CASE WHEN LENGTH(TRIM(COALESCE(p_last_name, ''))) > 0 THEN TRIM(p_last_name) ELSE NULL END,
    phone = CASE WHEN LENGTH(TRIM(COALESCE(p_phone, ''))) > 0 THEN TRIM(p_phone) ELSE NULL END,
    company_name = CASE WHEN LENGTH(TRIM(COALESCE(p_company_name, ''))) > 0 THEN TRIM(p_company_name) ELSE NULL END,
    avatar_url = CASE WHEN LENGTH(TRIM(COALESCE(p_avatar_url, ''))) > 0 THEN TRIM(p_avatar_url) ELSE NULL END,
    updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

-- Grant execute permissions to anon and authenticated users for signup
GRANT EXECUTE ON FUNCTION public.create_user_profile_signup(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text
) TO anon, authenticated;

-- Also create a simple function to check if profile exists
CREATE OR REPLACE FUNCTION public.profile_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.profile_exists(uuid) TO anon, authenticated;