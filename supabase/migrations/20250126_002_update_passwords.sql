-- Update test users passwords
-- Mettre à jour les mots de passe des utilisateurs de test avec des hash bcrypt valides

-- Mettre à jour les mots de passe pour "NoliTest2024!"
UPDATE auth.users SET 
  encrypted_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G',
  updated_at = NOW()
WHERE email IN (
  'jean.konan@noli.com',
  'marie.toure@noli.com', 
  'kouakou.bamba@noli.com',
  'yao.serge@noli.com',
  'kouadio.aisha@noli.com',
  'mamdou.toure@noli.com',
  'test.user@noli.com',
  'contact@assurauto.ci',
  'admin@sunuassurance.ci',
  'commercial@nsia.ci',
  'contact@sonafer.ci',
  'contact@sga.ci.com',
  'contact@allianz.ci',
  'admin@noliassurance.com',
  'super.admin@noliassurance.com',
  'admin.tech@noliassurance.com'
);

DO $$
BEGIN
  RAISE NOTICE '=== MOTS DE PASSE UTILISATEURS MIS À JOUR ===';
  RAISE NOTICE '✅ Tous les mots de passe ont été mis à jour avec le hash bcrypt';
  RAISE NOTICE '✅ Mot de passe universel: NoliTest2024!';
  RAISE NOTICE '';
  RAISE NOTICE 'Utilisateurs standards:';
  RAISE NOTICE '- jean.konan@noli.com';
  RAISE NOTICE '- marie.toure@noli.com';
  RAISE NOTICE '- kouakou.bamba@noli.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Assureurs:';
  RAISE NOTICE '- contact@assurauto.ci';
  RAISE NOTICE '- admin@sunuassurance.ci';
  RAISE NOTICE '';
  RAISE NOTICE 'Administrateurs:';
  RAISE NOTICE '- admin@noliassurance.com';
  RAISE NOTICE '- super.admin@noliassurance.com';
END $$;
