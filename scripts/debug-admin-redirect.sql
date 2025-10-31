-- ========================================
-- SCRIPT DE DÉBOGAGE POUR LA REDIRECTION ADMIN
-- ========================================
-- Exécuter ce script pour vérifier la configuration des utilisateurs admin

DO $$
BEGIN
  RAISE NOTICE '🔍 DÉBOGAGE DE LA REDIRECTION ADMIN...';
END $$;

-- 1. Vérifier les utilisateurs dans auth.users avec leurs métadonnées
DO $$
BEGIN
  RAISE NOTICE '📋 UTILISATEURS DANS auth.users:';
END $$;

SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email IN ('admin@noli.com', 'user@noli.com', 'insurer@noli.com')
ORDER BY email;

-- 2. Vérifier les profils correspondants dans public.profiles
DO $$
BEGIN
  RAISE NOTICE '📋 PROFILS CORRESPONDANTS DANS public.profiles:';
END $$;

SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  email_verified,
  created_at,
  updated_at
FROM public.profiles 
WHERE email IN ('admin@noli.com', 'user@noli.com', 'insurer@noli.com')
ORDER BY email;

-- 3. Vérifier s'il y a des incohérences entre auth.users et public.profiles
DO $$
BEGIN
  RAISE NOTICE '🔍 INHÉRENCES ENTRE auth.users ET public.profiles:';
END $$;

SELECT 
  au.email as auth_email,
  au.raw_user_meta_data->>'role' as auth_role,
  p.email as profile_email,
  p.role as profile_role,
  CASE 
    WHEN au.raw_user_meta_data->>'role' != p.role THEN 'INcohérence de rôle'
    WHEN au.email != p.email THEN 'Incohérence d email'
    ELSE 'OK'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email IN ('admin@noli.com', 'user@noli.com', 'insurer@noli.com')
ORDER BY au.email;

-- 4. Vérifier les permissions si la table existe
DO $$
BEGIN
  RAISE NOTICE '📋 PERMISSIONS UTILISATEURS:';
END $$;

-- Vérifier si la table user_permissions existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_permissions'
  ) THEN
    -- La table existe, afficher les permissions
    RAISE NOTICE 'Table user_permissions trouvée:';
    
    SELECT 
      p.email,
      p.role as profile_role,
      up.permission_id,
      up.created_at as permission_granted_at
    FROM public.profiles p
    LEFT JOIN public.user_permissions up ON p.id = up.user_id
    WHERE p.email IN ('admin@noli.com', 'user@noli.com', 'insurer@noli.com')
    ORDER BY p.email, up.permission_id;
  ELSE
    RAISE NOTICE 'Table user_permissions non trouvée - utilisation des métadonnées pour les permissions';
  END IF;
END $$;

-- 5. Recommandations
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RECOMMANDATIONS:';
  RAISE NOTICE '1. Vérifiez que les métadonnées role dans auth.users correspondent aux rôles dans public.profiles';
  RAISE NOTICE '2. Assurez-vous que les utilisateurs admin ont bien role = ''ADMIN'' dans les deux tables';
  RAISE NOTICE '3. Vérifiez les logs de l application pour voir le rôle récupéré lors de la connexion';
  RAISE NOTICE '4. Si problème persiste, vérifiez le fallback dans getProfile() qui utilise user_metadata';
  RAISE NOTICE '';
END $$;