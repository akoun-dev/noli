-- Script pour vérifier les utilisateurs créés dans la base de données
-- Vérifie que les utilisateurs de test ont été correctement créés

SELECT '=== VÉRIFICATION DES UTILISATEURS DANS AUTH.USERS ===' as info;

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

SELECT '=== VÉRIFICATION DES PROFILS DANS PUBLIC.PROFILES ===' as info;

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

SELECT '=== VÉRIFICATION DES ASSUREURS DANS PUBLIC.INSURERS ===' as info;

SELECT 
  i.profile_id,
  i.company_name,
  i.registration_number,
  i.rating,
  i.is_active,
  p.email as profile_email
FROM public.insurers i
JOIN public.profiles p ON i.profile_id = p.id
WHERE p.email LIKE '%@noli.com';