-- Simple user creation using basic approach
-- Création simple d'utilisateurs de test

-- D'abord, nettoyer les anciens comptes de test
DELETE FROM public.profiles WHERE email LIKE '%@noli.com';
DELETE FROM auth.users WHERE email LIKE '%@noli.com';

-- Créer les utilisateurs avec un mot de passe simple (à changer via l'interface)
-- Note: Nous utilisons "changeme123" comme mot de passe temporaire

-- 1. Utilisateur de test standard
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
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- hash for "changeme123"
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

-- 2. Assureur de test
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
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- hash for "changeme123"
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

-- 3. Administrateur de test
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
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- hash for "changeme123"
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

-- Créer les profiles correspondants
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
WHERE u.email IN ('user@noli.com', 'assureur@noli.com', 'admin@noli.com')
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Créer une compagnie d'assurance pour l'assureur de test
INSERT INTO public.insurers (profile_id, company_name, registration_number, rating, is_active)
SELECT
  p.id,
  'Assurance Test CI',
  'REG2025TEST001',
  5,
  true
FROM public.profiles p
WHERE p.email = 'assureur@noli.com'
AND NOT EXISTS (
  SELECT 1 FROM public.insurers i WHERE i.profile_id = p.id
);

DO $$
BEGIN
  RAISE NOTICE '=== COMPTES DE TEST CRÉÉS ===';
  RAISE NOTICE '✅ 3 comptes utilisateurs créés';
  RAISE NOTICE '✅ Profils créés dans public.profiles';
  RAISE NOTICE '✅ Compagnie d''assurance créée';
  RAISE NOTICE '';
  RAISE NOTICE '=== COMPTES DISPONIBLES ===';
  RAISE NOTICE 'Email: user@noli.com | Rôle: USER | Mot de passe: changeme123';
  RAISE NOTICE 'Email: assureur@noli.com | Rôle: INSURER | Mot de passe: changeme123';
  RAISE NOTICE 'Email: admin@noli.com | Rôle: ADMIN | Mot de passe: changeme123';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Changez les mots de passe après première connexion!';
END $$;