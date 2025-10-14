-- Script SQL direct pour créer les utilisateurs de test
-- À exécuter dans la console SQL du dashboard Supabase
-- Nécessite les droits d'admin sur auth.users

-- Vérifier que les fonctions existent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user' AND routine_schema = 'public') THEN
    RAISE EXCEPTION 'La fonction handle_new_user n''existe pas. Veuillez appliquer les migrations 005 et 006.';
  END IF;
END $$;

-- Désactiver temporairement le trigger pour éviter les boucles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer les utilisateurs de test
DO $$
DECLARE
  users_created INTEGER := 0;
BEGIN
  -- Administrateur
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      last_sign_in_at,
      raw_user_meta_data,
      raw_app_meta_data,
      is_super_admin,
      phone,
      phone_confirmed_at,
      email_change_token_new,
      recovery_token,
      email_change,
      invited_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@noli.com',
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'first_name', 'Admin',
        'last_name', 'Noli',
        'role', 'ADMIN'
      ),
      jsonb_build_object(
        'provider', 'email',
        'role', 'ADMIN'
      ),
      false,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );

    -- Créer manuellement le profil (puisque le trigger est désactivé)
    INSERT INTO public.profiles (
      id, email, first_name, last_name, role, is_active, email_verified, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin@noli.com',
      'Admin',
      'Noli',
      'ADMIN',
      true,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Admin créé: admin@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%duplicate key%' THEN
      RAISE NOTICE '✅ Admin existe déjà: admin@noli.com';
      users_created := users_created + 1;
    ELSE
      RAISE NOTICE '❌ Erreur création admin: %', SQLERRM;
    END IF;
  END;

  -- Assureur 1
  BEGIN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, phone, phone_confirmed_at, email_change_token_new, recovery_token,
      email_change, invited_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'assureur1@noli.com',
      crypt('Assureur123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'first_name', 'Jean',
        'last_name', 'Dupont',
        'role', 'INSURER',
        'company', 'AssurPro',
        'license', 'INS-001'
      ),
      jsonb_build_object(
        'provider', 'email',
        'role', 'INSURER'
      ),
      false,
      '+33612345679',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );

    INSERT INTO public.profiles (
      id, email, first_name, last_name, role, company_name, phone, is_active, email_verified, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      'assureur1@noli.com',
      'Jean',
      'Dupont',
      'INSURER',
      'AssurPro',
      '+33612345679',
      true,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Assureur 1 créé: assureur1@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%duplicate key%' THEN
      RAISE NOTICE '✅ Assureur 1 existe déjà: assureur1@noli.com';
      users_created := users_created + 1;
    ELSE
      RAISE NOTICE '❌ Erreur création assureur 1: %', SQLERRM;
    END IF;
  END;

  -- Assureur 2
  BEGIN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, phone, phone_confirmed_at, email_change_token_new, recovery_token,
      email_change, invited_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'assureur2@noli.com',
      crypt('Assureur123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'first_name', 'Marie',
        'last_name', 'Martin',
        'role', 'INSURER',
        'company', 'SecuHome',
        'license', 'INS-002'
      ),
      jsonb_build_object(
        'provider', 'email',
        'role', 'INSURER'
      ),
      false,
      '+33612345680',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );

    INSERT INTO public.profiles (
      id, email, first_name, last_name, role, company_name, phone, is_active, email_verified, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      'assureur2@noli.com',
      'Marie',
      'Martin',
      'INSURER',
      'SecuHome',
      '+33612345680',
      true,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Assureur 2 créé: assureur2@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%duplicate key%' THEN
      RAISE NOTICE '✅ Assureur 2 existe déjà: assureur2@noli.com';
      users_created := users_created + 1;
    ELSE
      RAISE NOTICE '❌ Erreur création assureur 2: %', SQLERRM;
    END IF;
  END;

  -- Utilisateur 1
  BEGIN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, phone, phone_confirmed_at, email_change_token_new, recovery_token,
      email_change, invited_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'user1@noli.com',
      crypt('User123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'first_name', 'Pierre',
        'last_name', 'Durand',
        'role', 'USER',
        'birth_date', '1985-05-15'
      ),
      jsonb_build_object(
        'provider', 'email',
        'role', 'USER'
      ),
      false,
      '+33612345681',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );

    INSERT INTO public.profiles (
      id, email, first_name, last_name, role, phone, is_active, email_verified, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000004',
      'user1@noli.com',
      'Pierre',
      'Durand',
      'USER',
      '+33612345681',
      true,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Utilisateur 1 créé: user1@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%duplicate key%' THEN
      RAISE NOTICE '✅ Utilisateur 1 existe déjà: user1@noli.com';
      users_created := users_created + 1;
    ELSE
      RAISE NOTICE '❌ Erreur création utilisateur 1: %', SQLERRM;
    END IF;
  END;

  -- Utilisateur 2
  BEGIN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, phone, phone_confirmed_at, email_change_token_new, recovery_token,
      email_change, invited_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'user2@noli.com',
      crypt('User123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object(
        'first_name', 'Sophie',
        'last_name', 'Petit',
        'role', 'USER',
        'birth_date', '1990-12-20'
      ),
      jsonb_build_object(
        'provider', 'email',
        'role', 'USER'
      ),
      false,
      '+33612345682',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );

    INSERT INTO public.profiles (
      id, email, first_name, last_name, role, phone, is_active, email_verified, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      'user2@noli.com',
      'Sophie',
      'Petit',
      'USER',
      '+33612345682',
      true,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Utilisateur 2 créé: user2@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%duplicate key%' THEN
      RAISE NOTICE '✅ Utilisateur 2 existe déjà: user2@noli.com';
      users_created := users_created + 1;
    ELSE
      RAISE NOTICE '❌ Erreur création utilisateur 2: %', SQLERRM;
    END IF;
  END;

  -- Résumé
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Création des utilisateurs terminée!';
  RAISE NOTICE '📊 Total utilisateurs créés: %', users_created;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Comptes de test disponibles:';
  RAISE NOTICE '   • admin@noli.com (Admin) - Mot de passe: Admin123!';
  RAISE NOTICE '   • assureur1@noli.com (Assureur) - Mot de passe: Assureur123!';
  RAISE NOTICE '   • assureur2@noli.com (Assureur) - Mot de passe: Assureur123!';
  RAISE NOTICE '   • user1@noli.com (Utilisateur) - Mot de passe: User123!';
  RAISE NOTICE '   • user2@noli.com (Utilisateur) - Mot de passe: User123!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Notes importantes:';
  RAISE NOTICE '   - Tous les comptes sont créés avec email_confirm=true';
  RAISE NOTICE '   - Les profils associés sont créés automatiquement';
  RAISE NOTICE '   - Les mots de passe sont hashés avec bcrypt';

END $$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vérifier que tout a été créé correctement
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérification des comptes créés:';

  FOR profile IN
    SELECT id, email, first_name, last_name, role, is_active, email_verified
    FROM public.profiles
    WHERE email LIKE '%@noli.com'
    ORDER BY role, email
  LOOP
    RAISE NOTICE '   • % (% %) - % - %',
      profile.email,
      profile.first_name,
      profile.last_name,
      profile.role,
      CASE WHEN profile.is_active THEN 'Actif' ELSE 'Inactif' END;
  END LOOP;

  -- Compter les utilisateurs par rôle
  RAISE NOTICE '';
  RAISE NOTICE '📊 Répartition par rôle:';
  FOR role_count IN
    SELECT role, COUNT(*) as count
    FROM public.profiles
    WHERE email LIKE '%@noli.com'
    GROUP BY role
    ORDER BY count DESC
  LOOP
    RAISE NOTICE '   • %: % utilisateur(s)', role_count.role, role_count.count;
  END LOOP;

END $$;