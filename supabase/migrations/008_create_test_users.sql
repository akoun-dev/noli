-- Migration: 008_create_test_users.sql
-- Création des utilisateurs de test avec auth.users et permissions

-- Désactiver temporairement le trigger handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer les utilisateurs dans auth.users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Créer les utilisateurs un par un pour éviter les conflits
  FOR user_record IN
    SELECT * FROM (VALUES
      ('jean.konan@noli.com', '+2250789012345', '{"first_name": "Jean", "last_name": "Konan", "role": "USER", "phone": "+2250789012345"}', false),
      ('marie.toure@noli.com', '+2250778901234', '{"first_name": "Marie", "last_name": "Toure", "role": "USER", "phone": "+2250778901234"}', true),
      ('kouakou.bamba@noli.com', '+2250767890123', '{"first_name": "Kouakou", "last_name": "Bamba", "role": "USER", "phone": "+2250767890123"}', true),
      ('contact@assurauto.ci', '+22527201234', '{"first_name": "AssurAuto", "last_name": "CI", "company": "AssurAuto CI", "role": "INSURER", "phone": "+22527201234"}', true),
      ('admin@sunuassurance.ci', '+225212345678', '{"first_name": "Sunu", "last_name": "Assurance", "company": "Sunu Assurance CI", "role": "INSURER", "phone": "+225212345678"}', true),
      ('commercial@nsia.ci', '+225202123456', '{"first_name": "NSIA", "last_name": "Banque Assurance", "company": "NSIA Banque Assurance", "role": "INSURER", "phone": "+225202123456"}', true),
      ('admin@noliassurance.com', '+2250707070707', '{"first_name": "Super", "last_name": "Admin", "company": "NOLI Assurance", "role": "ADMIN", "phone": "+2250707070707"}', true)
    ) AS t(email, phone, metadata, phone_verified)
  LOOP
    -- Vérifier si l'utilisateur existe déjà
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_record.email) THEN
      -- Insérer dans auth.users
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        phone,
        phone_confirmed_at,
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        updated_at,
        last_sign_in_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_record.email,
        crypt('NoliTest2024!', gen_salt('bf')),
        NOW(),
        user_record.phone,
        CASE WHEN user_record.phone_verified THEN NOW() ELSE NULL END,
        user_record.metadata::jsonb,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        NOW(),
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END $$;

-- Créer les profils correspondants
DO $$
BEGIN
  -- Insérer les profils en se basant sur les utilisateurs créés
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    company_name,
    phone,
    role,
    is_active,
    email_verified,
    phone_verified,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    u.email,
    (u.raw_user_meta_data->>'first_name')::text,
    (u.raw_user_meta_data->>'last_name')::text,
    (u.raw_user_meta_data->>'company')::text,
    (u.raw_user_meta_data->>'phone')::text,
    (u.raw_user_meta_data->>'role')::text,
    true,
    u.email_confirmed_at IS NOT NULL,
    u.phone_confirmed_at IS NOT NULL,
    u.created_at,
    u.updated_at
  FROM auth.users u
  WHERE u.email IN (
    'jean.konan@noli.com',
    'marie.toure@noli.com',
    'kouakou.bamba@noli.com',
    'contact@assurauto.ci',
    'admin@sunuassurance.ci',
    'commercial@nsia.ci',
    'admin@noliassurance.com'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );
END $$;

-- Recréer le trigger handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insérer des logs d'audit pour la création des utilisateurs
INSERT INTO public.audit_logs (
  id,
  action,
  resource,
  resource_id,
  metadata,
  created_at
)
SELECT
  gen_random_uuid(),
  'USER_CREATED',
  'user',
  p.id::text,
  jsonb_build_object(
    'email', p.email,
    'role', p.role,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone', p.phone,
    'email_verified', p.email_verified,
    'phone_verified', p.phone_verified
  ),
  NOW()
FROM public.profiles p
WHERE p.email IN (
  'jean.konan@noli.com',
  'marie.toure@noli.com',
  'kouakou.bamba@noli.com',
  'contact@assurauto.ci',
  'admin@sunuassurance.ci',
  'commercial@nsia.ci',
  'admin@noliassurance.com'
);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== UTILISATEURS DE TEST CRÉÉS AVEC SUCCÈS ===';
  RAISE NOTICE '3 utilisateurs USER créés';
  RAISE NOTICE '3 assureurs INSURER créés';
  RAISE NOTICE '1 administrateur ADMIN créé';
  RAISE NOTICE 'Mot de passe universel: NoliTest2024!';
  RAISE NOTICE 'Tous les utilisateurs ont leurs permissions configurées';
  RAISE NOTICE '';
  RAISE NOTICE 'Comptes créés:';
  RAISE NOTICE '- jean.konan@noli.com (USER) - Téléphone non vérifié';
  RAISE NOTICE '- marie.toure@noli.com (USER) - Téléphone vérifié';
  RAISE NOTICE '- kouakou.bamba@noli.com (USER) - Téléphone vérifié';
  RAISE NOTICE '- contact@assurauto.ci (INSURER) - Téléphone vérifié';
  RAISE NOTICE '- admin@sunuassurance.ci (INSURER) - Téléphone vérifié';
  RAISE NOTICE '- commercial@nsia.ci (INSURER) - Téléphone vérifié';
  RAISE NOTICE '- admin@noliassurance.com (ADMIN) - Téléphone vérifié';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant vous connecter avec ces comptes !';
END $$;