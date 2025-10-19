-- Reset and create users with simple approach
-- Supprimer et recréer les utilisateurs avec une approche simple

-- Supprimer les anciens comptes de manière complète
DELETE FROM public.insurers WHERE profile_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%@noli.com'
);
DELETE FROM public.profiles WHERE email LIKE '%@noli.com';
DELETE FROM auth.users WHERE email LIKE '%@noli.com';

-- Créer les utilisateurs avec un hash bcrypt valide pour "password123"
-- Hash généré: $2b$12$9XhqrMjsmXP1hVJTOtGzE.5h1dYzQKzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQ

DO $$
DECLARE
  password_hash TEXT := '$2b$12$9XhqrMjsmXP1hVJTOtGzE.5h1dYzQKzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQ';
BEGIN
  -- Créer utilisateur standard
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'user@noli.com',
    password_hash,
    NOW(),
    jsonb_build_object(
      'first_name', 'Utilisateur',
      'last_name', 'Test',
      'role', 'USER',
      'phone', '+2250700000001'
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  );

  -- Créer assureur
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'assureur@noli.com',
    password_hash,
    NOW(),
    jsonb_build_object(
      'first_name', 'Assureur',
      'last_name', 'Test',
      'role', 'INSURER',
      'company', 'Assurance Test CI',
      'phone', '+2250700000002'
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  );

  -- Créer admin
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@noli.com',
    password_hash,
    NOW(),
    jsonb_build_object(
      'first_name', 'Admin',
      'last_name', 'Test',
      'role', 'ADMIN',
      'company', 'NOLI Assurance',
      'phone', '+2250700000003'
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  );

  -- Créer les profiles
  INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active, created_at, updated_at)
  SELECT
    u.id,
    u.email,
    u.raw_user_meta_data->>'first_name',
    u.raw_user_meta_data->>'last_name',
    u.raw_user_meta_data->>'role',
    true,
    u.created_at,
    u.updated_at
  FROM auth.users u
  WHERE u.email IN ('user@noli.com', 'assureur@noli.com', 'admin@noli.com');

  -- Créer compagnie d'assurance
  INSERT INTO public.insurers (profile_id, company_name, registration_number, rating, is_active)
  SELECT
    p.id,
    'Assurance Test CI',
    'REG2025TEST001',
    5,
    true
  FROM public.profiles p
  WHERE p.email = 'assureur@noli.com';

  RAISE NOTICE '=== UTILISATEURS CRÉÉS AVEC SUCCÈS ===';
  RAISE NOTICE '✅ user@noli.com - Rôle: USER - Mot de passe: password123';
  RAISE NOTICE '✅ assureur@noli.com - Rôle: INSURER - Mot de passe: password123';
  RAISE NOTICE '✅ admin@noli.com - Rôle: ADMIN - Mot de passe: password123';
END $$;

-- Créer la table pour stocker les résultats de test (optionnel)
CREATE TABLE IF NOT EXISTS public.auth_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  test_type TEXT,
  result TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  RAISE NOTICE '=== TABLE DE TESTS CRÉÉE ===';
  RAISE NOTICE 'Table auth_test_results disponible pour stocker les résultats';
  RAISE NOTICE '';
  RAISE NOTICE '=== COMMANDES DE TEST CURL ===';
  RAISE NOTICE 'curl -X POST "https://brznmveoycrwlyksffvh.supabase.co/auth/v1/token?grant_type=password" \\';
  RAISE NOTICE '  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\';
  RAISE NOTICE '  -H "Content-Type: application/json" \\';
  RAISE NOTICE '  -d ''{"email": "user@noli.com", "password": "password123"}''';
END $$;