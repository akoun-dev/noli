-- =============================================================================
-- Migration: public helpers for profile creation & quote claiming
-- Goal:
--   * Allow visitors to finalise profile creation securely (via RPC)
--   * Provide helper to claim visitor quotes after authentication
--   * Ensure policies stay strict while exposing controlled entry points
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: normalise text values
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.null_if_empty(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_value IS NULL THEN NULL
    WHEN LENGTH(TRIM(p_value)) = 0 THEN NULL
    ELSE TRIM(p_value)
  END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: upsert profile on behalf of a user (accessible to visitors post signup)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_profile_for_signup(
  p_user_id uuid,
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT 'USER',
  p_company_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_candidate text := UPPER(COALESCE(p_role, 'USER'));
  v_role public.profile_role;
  v_profile public.profiles;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id est obligatoire' USING ERRCODE = '23502';
  END IF;

  IF v_role_candidate NOT IN ('USER', 'INSURER', 'ADMIN') THEN
    v_role_candidate := 'USER';
  END IF;

  v_role := v_role_candidate::public.profile_role;

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
    public.null_if_empty(p_first_name),
    public.null_if_empty(p_last_name),
    public.null_if_empty(p_phone),
    public.null_if_empty(p_company_name),
    v_role,
    public.null_if_empty(p_avatar_url),
    TRUE,
    TRUE,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = public.normalize_email(p_email),
    first_name = public.null_if_empty(p_first_name),
    last_name = public.null_if_empty(p_last_name),
    phone = public.null_if_empty(p_phone),
    company_name = public.null_if_empty(p_company_name),
    role = v_role,
    avatar_url = public.null_if_empty(p_avatar_url),
    updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_profile_for_signup(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: claim visitor quotes after authentication
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_quotes_for_user(
  p_visitor_token uuid,
  p_quote_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (quote_id uuid, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_updated uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour rattacher les devis'
      USING ERRCODE = '42501';
  END IF;

  IF p_visitor_token IS NULL THEN
    RAISE EXCEPTION 'Token visiteur requis'
      USING ERRCODE = '23502';
  END IF;

  FOR v_updated IN
    SELECT q.id
    FROM public.quotes q
    WHERE q.visitor_token = p_visitor_token
      AND (p_quote_ids IS NULL OR q.id = ANY(p_quote_ids))
  LOOP
    UPDATE public.quotes
    SET user_id = v_user,
        requested_by_role = 'USER',
        updated_at = NOW()
    WHERE id = v_updated;

    quote_id := v_updated;
    status := 'attached';
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_quotes_for_user(uuid, uuid[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- Retro compatibility RPC expected by frontend (delegates to upsert helper)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_user_profile(
  company_name text,
  first_name text,
  last_name text,
  phone text,
  user_email text,
  user_id uuid,
  user_role text DEFAULT 'USER'
)
RETURNS public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.upsert_profile_for_signup(
    p_user_id := user_id,
    p_email := user_email,
    p_first_name := first_name,
    p_last_name := last_name,
    p_phone := phone,
    p_role := user_role,
    p_company_name := company_name
  );
$$;

GRANT EXECUTE ON FUNCTION public.create_user_profile(
  text,
  text,
  text,
  text,
  text,
  uuid,
  text
) TO anon, authenticated;
