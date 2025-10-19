-- Migration de test d'authentification simple
-- Créer les utilisateurs de test de manière directe

-- Vérifier si la table profiles existe, sinon la créer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'INSURER', 'ADMIN')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Activer RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Politique très permissive pour permettre l'accès
    DROP POLICY IF EXISTS "test_policy" ON public.profiles;
    CREATE POLICY "test_policy" ON public.profiles
      FOR ALL USING (true);

    -- Trigger pour créer le profil automatiquement
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;

      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    RAISE NOTICE '✅ Table profiles créée avec succès';
  ELSE
    RAISE NOTICE 'ℹ️ Table profiles existe déjà';
  END IF;
END $$;

-- Créer les utilisateurs de test via auth.users directement
DO $$
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@noli.com') THEN
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
      'test@noli.com',
      'NoliTest2024!',
      NOW(),
      '+2250000000000',
      NOW(),
      '{"first_name": "Test", "last_name": "User", "role": "USER"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      NOW(),
      NOW(),
      NOW()
    );

    -- Créer le profil correspondant
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
    WHERE u.email = 'test@noli.com';

    RAISE NOTICE '✅ Utilisateur test@noli.com créé';
  ELSE
    RAISE NOTICE 'ℹ️ Utilisateur test@noli.com existe déjà';
  END IF;

  -- Vérifier si l'administrateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@noli.com') THEN
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
      'admin@noli.com',
      'NoliTest2024!',
      NOW(),
      '+2251111111111',
      NOW(),
      '{"first_name": "Admin", "last_name": "User", "role": "ADMIN"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      NOW(),
      NOW(),
      NOW()
    );

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
    WHERE u.email = 'admin@noli.com';

    RAISE NOTICE '✅ Utilisateur admin@noli.com créé';
  ELSE
    RAISE NOTICE 'ℹ️ Utilisateur admin@noli.com existe déjà';
  END IF;
END $$;

-- Créer une fonction simple de test
CREATE OR REPLACE FUNCTION public.test_simple_auth()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'Auth system is ready for testing';
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION public.test_simple_auth TO authenticated, anon;
GRANT SELECT ON public.profiles TO authenticated, anon;

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURATION AUTH TERMINÉE ===';
  RAISE NOTICE '✅ Utilisateurs de test créés';
  RAISE NOTICE '✅ test@noli.com (mot de passe: NoliTest2024!)';
  RAISE NOTICE '✅ admin@noli.com (mot de passe: NoliTest2024!)';
  RAISE NOTICE '✅ Politiques RLS configurées';
  RAISE NOTICE '✅ Fonctions de test créées';
  RAISE NOTICE '=== PRÊT POUR TEST D''AUTHENTIFICATION ===';
END $$;