-- =============================================================================
-- Migration: Fix admin_create_user to create insurer entries
-- Date: 2025-12-05
-- Purpose: Correct the admin_create_user function to create entries in both
--          profiles and insurers tables when role is INSURER, ensuring
--          proper data synchronization
-- =============================================================================

-- Drop and recreate the function with insurer creation logic
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
  insurer_id uuid,
  message text
) AS $$
DECLARE
  v_user_id uuid;
  v_insurer_id uuid;
  v_insurer_exists boolean;
BEGIN
  -- Créer le profil dans tous les cas
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

  -- Si c'est un assureur, créer l'entrée dans la table insurers et le lien
  IF role_param = 'INSURER' THEN
    -- Vérifier si un assureur avec le même nom existe déjà
    SELECT EXISTS(SELECT 1 FROM public.insurers WHERE name = company_name_param) INTO v_insurer_exists;
    
    IF v_insurer_exists THEN
      -- Si l'assureur existe déjà, récupérer son ID
      SELECT id INTO v_insurer_id 
      FROM public.insurers 
      WHERE name = company_name_param 
      LIMIT 1;
    ELSE
      -- Créer une nouvelle entrée dans la table insurers
      INSERT INTO public.insurers (
        id,
        name,
        description,
        contact_email,
        phone,
        website,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        company_name_param,
        NULL, -- description
        email_param,
        phone_param,
        NULL, -- website
        COALESCE(is_active_param, true),
        NOW(),
        NOW()
      )
      RETURNING id INTO v_insurer_id;
    END IF;

    -- Créer le lien dans insurer_accounts
    INSERT INTO public.insurer_accounts (
      profile_id,
      insurer_id,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_insurer_id,
      NOW(),
      NOW()
    );
  END IF;

  -- Logger l'opération d'audit
  PERFORM admin_user_operation(
    'create',
    v_user_id,
    jsonb_build_object(
      'email', email_param,
      'role', role_param,
      'is_active', is_active_param,
      'company_name', company_name_param,
      'insurer_id', v_insurer_id
    ),
    'Manual admin creation with insurer support'
  );

  -- Retourner le résultat avec le nouvel insurer_id
  RETURN QUERY SELECT 
    true::boolean, 
    v_user_id::uuid, 
    v_insurer_id::uuid,
    'User created successfully'::text;

EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT 
      false::boolean, 
      NULL::uuid, 
      NULL::uuid,
      'Email already exists'::text;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false::boolean, 
      NULL::uuid, 
      NULL::uuid,
      COALESCE(SQLERRM, 'Unexpected error')::text;
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

-- Create a helper function to check and fix existing insurer profiles
CREATE OR REPLACE FUNCTION public.fix_existing_insurer_profiles()
RETURNS TABLE (
  profile_id uuid,
  email text,
  company_name text,
  insurer_id uuid,
  status text,
  message text
) AS $$
DECLARE
  v_profile RECORD;
  v_insurer_id uuid;
  v_insurer_exists boolean;
BEGIN
  -- Parcourir tous les profils assureurs qui n'ont pas de lien insurer_accounts
  FOR v_profile IN 
    SELECT p.id, p.email, p.company_name, p.created_at
    FROM public.profiles p
    WHERE p.role = 'INSURER'
      AND NOT EXISTS (
        SELECT 1 FROM public.insurer_accounts ia 
        WHERE ia.profile_id = p.id
      )
  LOOP
    -- Vérifier si un assureur avec le même nom existe déjà
    SELECT EXISTS(SELECT 1 FROM public.insurers WHERE name = v_profile.company_name) INTO v_insurer_exists;
    
    IF v_insurer_exists THEN
      -- Si l'assureur existe déjà, récupérer son ID
      SELECT id INTO v_insurer_id 
      FROM public.insurers 
      WHERE name = v_profile.company_name 
      LIMIT 1;
      
      RETURN QUERY SELECT 
        v_profile.id::uuid,
        v_profile.email::text,
        v_profile.company_name::text,
        v_insurer_id::uuid,
        'linked_existing'::text,
        'Linked to existing insurer'::text;
    ELSE
      -- Créer une nouvelle entrée dans la table insurers
      INSERT INTO public.insurers (
        id,
        name,
        contact_email,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_profile.company_name,
        v_profile.email,
        true,
        v_profile.created_at,
        NOW()
      )
      RETURNING id INTO v_insurer_id;
      
      RETURN QUERY SELECT 
        v_profile.id::uuid,
        v_profile.email::text,
        v_profile.company_name::text,
        v_insurer_id::uuid,
        'created_new'::text,
        'Created new insurer entry'::text;
    END IF;

    -- Créer le lien dans insurer_accounts
    INSERT INTO public.insurer_accounts (
      profile_id,
      insurer_id,
      created_at,
      updated_at
    ) VALUES (
      v_profile.id,
      v_insurer_id,
      NOW(),
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.fix_existing_insurer_profiles() TO authenticated;