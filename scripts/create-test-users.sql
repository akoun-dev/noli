-- Script SQL pour créer des utilisateurs de test
-- NOTE: Ce script doit être exécuté avec des privilèges d'admin Supabase
-- Il utilise la fonction auth.users directement

-- IMPORTANT: Ce script ne peut être exécuté que via la console SQL Supabase
-- ou avec un utilisateur ayant les droits nécessaires sur auth.users

-- Activer l'extension UUID si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fonction pour créer un utilisateur de test
CREATE OR REPLACE FUNCTION create_test_user(
  email TEXT,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'USER'
)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
  hashed_password TEXT;
BEGIN
  -- Générer un UUID pour l'utilisateur
  user_uuid := uuid_generate_v4();

  -- Hasher le mot de passe (simple pour les tests)
  -- En production, utilisez les fonctions de hash de Supabase Auth
  hashed_password := crypt(password, gen_salt('bf'));

  -- Insérer dans auth.users (nécessite des privilèges admin)
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
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email,
    hashed_password,
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object(
      'first_name', first_name,
      'last_name', last_name,
      'role', role
    ),
    jsonb_build_object(
      'provider', 'email',
      'role', role
    ),
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );

  -- Le profil sera créé automatiquement par le trigger
  RETURN user_uuid;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erreur lors de la création de l''utilisateur %: %', email, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Script pour créer les utilisateurs de test
DO $$
DECLARE
  users_created INTEGER := 0;
BEGIN
  -- Créer les utilisateurs de test avec gestion d'erreurs
  BEGIN
    PERFORM create_test_user('admin@noli.com', 'Admin123!', 'Admin', 'Noli', 'ADMIN');
    RAISE NOTICE '✅ Admin créé: admin@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Admin déjà existant ou erreur: %', SQLERRM;
  END;

  BEGIN
    PERFORM create_test_user('assureur1@noli.com', 'Assureur123!', 'Jean', 'Dupont', 'INSURER');
    RAISE NOTICE '✅ Assureur 1 créé: assureur1@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Assureur 1 déjà existant ou erreur: %', SQLERRM;
  END;

  BEGIN
    PERFORM create_test_user('assureur2@noli.com', 'Assureur123!', 'Marie', 'Martin', 'INSURER');
    RAISE NOTICE '✅ Assureur 2 créé: assureur2@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Assureur 2 déjà existant ou erreur: %', SQLERRM;
  END;

  BEGIN
    PERFORM create_test_user('user1@noli.com', 'User123!', 'Pierre', 'Durand', 'USER');
    RAISE NOTICE '✅ Utilisateur 1 créé: user1@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Utilisateur 1 déjà existant ou erreur: %', SQLERRM;
  END;

  BEGIN
    PERFORM create_test_user('user2@noli.com', 'User123!', 'Sophie', 'Petit', 'USER');
    RAISE NOTICE '✅ Utilisateur 2 créé: user2@noli.com';
    users_created := users_created + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Utilisateur 2 déjà existant ou erreur: %', SQLERRM;
  END;

  -- Afficher le résumé
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
  RAISE NOTICE '   - Les profils associés sont créés automatiquement via le trigger';
  RAISE NOTICE '   - Les mots de passe sont simples pour faciliter les tests';
END $$;

-- Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS create_test_user(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Vérifier les profils créés
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérification des profils créés:';

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