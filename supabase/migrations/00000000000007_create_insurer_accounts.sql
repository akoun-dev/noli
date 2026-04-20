-- =============================================================================
-- Migration: Create Insurer Accounts Table
-- Date: 2024-05-09
-- Purpose: Link profiles to insurer companies
-- =============================================================================

CREATE TABLE public.insurer_accounts (
  profile_id uuid NOT NULL,
  insurer_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT insurer_accounts_pkey PRIMARY KEY (profile_id),
  CONSTRAINT insurer_accounts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT insurer_accounts_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS insurer_accounts_insurer_idx ON public.insurer_accounts (insurer_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurer_accounts ON public.insurer_accounts;
CREATE TRIGGER trg_set_updated_at_insurer_accounts
  BEFORE UPDATE ON public.insurer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.insurer_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurer_accounts_self_select ON public.insurer_accounts;
CREATE POLICY insurer_accounts_self_select
  ON public.insurer_accounts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = profile_id);

DROP POLICY IF EXISTS insurer_accounts_self_insert ON public.insurer_accounts;
CREATE POLICY insurer_accounts_self_insert
  ON public.insurer_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = profile_id);

DROP POLICY IF EXISTS insurer_accounts_admin_insert ON public.insurer_accounts;
CREATE POLICY insurer_accounts_admin_insert
  ON public.insurer_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS insurer_accounts_admin_select ON public.insurer_accounts;
CREATE POLICY insurer_accounts_admin_select
  ON public.insurer_accounts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS insurer_accounts_admin_update ON public.insurer_accounts;
CREATE POLICY insurer_accounts_admin_update
  ON public.insurer_accounts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS insurer_accounts_admin_delete ON public.insurer_accounts;
CREATE POLICY insurer_accounts_admin_delete
  ON public.insurer_accounts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- Functions: insurer registration and linking
-- =============================================================================

-- Function to allow insurer creation during registration
CREATE OR REPLACE FUNCTION public.create_insurer_for_registration(
  p_code text,
  p_name text,
  p_description text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_insurer_id uuid;
BEGIN
  -- Check user is authenticated
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Create the insurer
  INSERT INTO public.insurers (code, name, description, contact_email, phone, website, is_active)
  VALUES (p_code, p_name, p_description, p_contact_email, p_phone, p_website, TRUE)
  RETURNING id INTO v_insurer_id;

  RETURN v_insurer_id;
END;
$$;

-- Function to link insurer account during registration
CREATE OR REPLACE FUNCTION public.create_insurer_account_link(
  p_insurer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check user is authenticated
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Create the link or update if already exists
  INSERT INTO public.insurer_accounts (profile_id, insurer_id)
  VALUES ((SELECT auth.uid()), p_insurer_id)
  ON CONFLICT (profile_id)
  DO UPDATE SET
    insurer_id = EXCLUDED.insurer_id,
    updated_at = NOW()
  WHERE insurer_accounts.profile_id = (SELECT auth.uid());

  RETURN TRUE;
END;
$$;

-- Function to create insurer AND link account in one atomic transaction
CREATE OR REPLACE FUNCTION public.create_insurer_with_link(
  p_code text,
  p_name text,
  p_description text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL
)
RETURNS TABLE(insurer_id uuid, success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_insurer_id uuid;
  v_profile_id uuid;
BEGIN
  -- Check user is authenticated
  v_profile_id := (SELECT auth.uid());
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if user already has an insurer account
  IF EXISTS (
    SELECT 1 FROM public.insurer_accounts
    WHERE profile_id = v_profile_id
  ) THEN
    -- Get the existing insurer ID
    SELECT insurer_id INTO v_insurer_id FROM public.insurer_accounts WHERE profile_id = v_profile_id;
    RETURN QUERY SELECT
      v_insurer_id,
      FALSE,
      'User already has an insurer account'::text;
    RETURN;
  END IF;

  -- Create the insurer
  INSERT INTO public.insurers (code, name, description, contact_email, phone, website, is_active)
  VALUES (p_code, p_name, p_description, p_contact_email, p_phone, p_website, TRUE)
  RETURNING id INTO v_insurer_id;

  -- Create the link
  INSERT INTO public.insurer_accounts (profile_id, insurer_id)
  VALUES (v_profile_id, v_insurer_id);

  -- Return success
  RETURN QUERY SELECT
    v_insurer_id,
    TRUE,
    'Insurer created and linked successfully'::text;
END;
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.create_insurer_for_registration(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_insurer_account_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_insurer_with_link(text, text, text, text, text, text) TO authenticated;

-- Add column comments for insurers table
COMMENT ON COLUMN public.insurers.contact_address IS 'Adresse physique de l''assureur';
COMMENT ON COLUMN public.insurers.license_number IS 'Numéro de licence d''assurance';

-- Grants
GRANT SELECT ON public.insurer_accounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurer_accounts TO authenticated;
