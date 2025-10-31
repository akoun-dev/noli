-- ========================================
-- SCRIPT DE CRÉATION DES COMPTES ADMIN PAR DÉFAUT
-- ========================================
-- Exécuter ce script pour créer les comptes utilisateurs de test/admin

DO $$
BEGIN
  RAISE NOTICE '🚀 CRÉATION DES COMPTES UTILISATEURS PAR DÉFAUT...';
END $$;

-- Création des mots de passe hashés (mot de passe: NoliTest2024!)
-- Hash généré avec bcrypt pour le mot de passe "NoliTest2024!"
DO $$
DECLARE
  admin_password_hash TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QDwoxNjJ6';
  user_password_hash TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QDwoxNjJ6';
  insurer_password_hash TEXT := '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4QDwoxNjJ6';
BEGIN
  -- 1. Créer l'administrateur système
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
    '00000000-0000-0000-0000-000000000001'::uuid,
    'authenticated',
    'authenticated',
    'admin@noli.com',
    admin_password_hash,
    NOW(),
    jsonb_build_object(
      'first_name', 'Admin',
      'last_name', 'Système',
      'role', 'ADMIN',
      'is_active', true
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    raw_user_meta_data = jsonb_build_object(
      'first_name', 'Admin',
      'last_name', 'Système',
      'role', 'ADMIN',
      'is_active', true
    );

  -- 2. Créer l'utilisateur test
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
    '00000000-0000-0000-0000-000000000002'::uuid,
    'authenticated',
    'authenticated',
    'user@noli.com',
    user_password_hash,
    NOW(),
    jsonb_build_object(
      'first_name', 'Utilisateur',
      'last_name', 'Test',
      'role', 'USER',
      'is_active', true
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 3. Créer l'assureur test
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
    '00000000-0000-0000-0000-000000000003'::uuid,
    'authenticated',
    'authenticated',
    'insurer@noli.com',
    insurer_password_hash,
    NOW(),
    jsonb_build_object(
      'first_name', 'Assureur',
      'last_name', 'Test',
      'role', 'INSURER',
      'is_active', true
    ),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

END $$;

-- 4. Créer les profils correspondants dans public.profiles
-- Le trigger handle_new_user devrait les créer automatiquement, mais créons-les manuellement pour être sûrs

INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active, email_verified)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin@noli.com', 'Admin', 'Système', 'ADMIN', true, true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'user@noli.com', 'Utilisateur', 'Test', 'USER', true, true),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'insurer@noli.com', 'Assureur', 'Test', 'INSURER', true, true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

-- 5. Donner les permissions appropriées aux utilisateurs
-- Assurer que l'admin a toutes les permissions

INSERT INTO public.user_permissions (user_id, permission_id)
SELECT
  p.id as user_id,
  perm.id as permission_id
FROM public.profiles p
CROSS JOIN public.permissions perm
WHERE p.email = 'admin@noli.com'
  AND perm.is_system = true
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- 6. Créer une compagnie d'assurance pour l'utilisateur insurer
INSERT INTO public.insurers (profile_id, company_name, registration_number, rating, is_active, contact_email, phone)
VALUES
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Assurance Test CI', 'CI-ABJ-2024-TEST', 4.5, true, 'insurer@noli.com', '+22500000000')
ON CONFLICT (profile_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  registration_number = EXCLUDED.registration_number,
  rating = EXCLUDED.rating,
  is_active = EXCLUDED.is_active,
  contact_email = EXCLUDED.contact_email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

DO $$
BEGIN
  RAISE NOTICE '✅ COMPTES CRÉÉS AVEC SUCCÈS!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COMPTES DISPONIBLES:';
  RAISE NOTICE '🔹 ADMIN: admin@noli.com / NoliTest2024!';
  RAISE NOTICE '🔹 USER:  user@noli.com / NoliTest2024!';
  RAISE NOTICE '🔹 INSURER: insurer@noli.com / NoliTest2024!';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Tous les comptes sont maintenant prêts à être utilisés!';
END $$;