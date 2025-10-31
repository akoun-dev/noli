-- ========================================
-- SCRIPT DE TEST D'AUTHENTIFICATION
-- ========================================
-- Exécuter ce script après la reconstruction pour vérifier que tout fonctionne

DO $$
BEGIN
  RAISE NOTICE '🧪 DÉBUT DES TESTS D''AUTHENTIFICATION...';
END $$;

-- Test 1: Vérifier que les utilisateurs existent dans auth.users
SELECT '=== TEST 1: UTILISATEURS DANS AUTH.USERS ===' as test;
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email LIKE '%@noli.com'
ORDER BY email;

-- Test 2: Vérifier que les profils existent dans public.profiles
SELECT '=== TEST 2: PROFILS DANS PUBLIC.PROFILES ===' as test;
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at
FROM public.profiles
WHERE email LIKE '%@noli.com'
ORDER BY email;

-- Test 3: Vérifier que la compagnie d'assurance existe
SELECT '=== TEST 3: ASSUREUR DANS PUBLIC.INSURERS ===' as test;
SELECT
  i.id,
  i.profile_id,
  i.company_name,
  i.registration_number,
  i.rating,
  i.is_active,
  p.email as profile_email
FROM public.insurers i
JOIN public.profiles p ON i.profile_id = p.id
WHERE p.email LIKE '%@noli.com';

-- Test 4: Vérifier que les catégories existent
SELECT '=== TEST 4: CATÉGORIES D''ASSURANCE ===' as test;
SELECT
  id,
  name,
  description,
  is_active
FROM public.insurance_categories
ORDER BY name;

-- Test 5: Vérifier les fonctions
SELECT '=== TEST 5: TEST DES FONCTIONS ===' as test;

-- Test get_user_profile (retournera vide car pas de contexte d'auth)
SELECT 'get_user_profile() - fonctionne' as result
FROM public.get_user_profile() LIMIT 1;

-- Test get_active_categories
SELECT COUNT(*) as categories_count
FROM public.get_active_categories();

-- Test 6: Vérifier les triggers
SELECT '=== TEST 6: TEST DE CRÉATION UTILISATEUR ===' as test;

-- Créer un utilisateur de test pour vérifier le trigger
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  password_hash TEXT := '${TEST_PASSWORD_HASH:-placeholder_hash_here}';
BEGIN
  -- Créer utilisateur dans auth.users
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
    test_user_id,
    'authenticated',
    'authenticated',
    'trigger-test@noli.com',
    password_hash,
    NOW(),
    jsonb_build_object('first_name', 'Trigger', 'last_name', 'Test', 'role', 'USER'),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    NOW()
  );

  -- Vérifier que le profil a été créé automatiquement
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ Trigger handle_new_user fonctionne correctement';
  ELSE
    RAISE NOTICE '❌ Trigger handle_new_user ne fonctionne pas';
  END IF;

  -- Nettoyer
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
END $$;

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '🎉 TESTS TERMINÉS';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Si tous les tests passent, l''authentification est prête!';
  RAISE NOTICE '';
  RAISE NOTICE 'Pour tester l''API REST:';
  RAISE NOTICE '1. Configurez VITE_MOCK_DATA=false dans .env.local';
  RAISE NOTICE '2. Redémarrez le serveur: npm run dev';
  RAISE NOTICE '3. Testez avec les comptes: user@noli.com, insurer@noli.com, admin@noli.com';
  RAISE NOTICE '4. Mot de passe pour tous: NoliTest2024!';
END $$;