-- Script pour diagnostiquer les problèmes de création de profil
-- Exécuter ce script dans la console Supabase SQL

-- 1. Vérifier si la fonction RPC existe
SELECT 
  proname as function_name,
  pronargs as arg_count,
  prorettype as return_type
FROM pg_proc 
WHERE proname = 'create_user_profile';

-- 2. Vérifier les permissions sur la fonction
SELECT 
  grantee,
  privilege_type 
FROM information_schema.role_routines 
JOIN information_schema.role_usage_grants ON routine_name = object_name
WHERE routine_name = 'create_user_profile';

-- 3. Vérifier les politiques RLS sur la table profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Tester la création de profil via RPC (remplacer les valeurs)
-- SELECT create_user_profile(
--   'test-user-id'::uuid,
--   'test@example.com',
--   'Test',
--   'User',
--   '1234567890',
--   '',
--   'USER'
-- );

-- 5. Vérifier les utilisateurs dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Vérifier les profils existants
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Vérifier les logs d'erreurs récents
SELECT 
  error_level,
  error_message,
  error_detail,
  error_hint,
  query,
  timestamp
FROM pg_stat_activity 
WHERE state = 'active' AND query LIKE '%create_user_profile%'
ORDER BY timestamp DESC 
LIMIT 10;

-- 8. Vérifier si le service_role existe et a les permissions
SELECT 
  rolname,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolsuper
FROM pg_roles 
WHERE rolname = 'service_role';

-- 9. Accorder manuellement les permissions si nécessaire (décommenter si besoin)
-- GRANT ALL ON public.profiles TO service_role;
-- GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;