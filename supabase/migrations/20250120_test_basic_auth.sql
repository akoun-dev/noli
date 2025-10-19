-- Test basic authentication
-- Migration simple pour tester l'authentification

-- Créer table profiles simple
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Politique simple
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

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

-- Fonction simple pour obtenir le profil
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_active
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated, anon;

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURATION AUTH DE BASE TERMINÉE ===';
  RAISE NOTICE '✅ Table profiles créée';
  RAISE NOTICE '✅ RLS activé avec politique simple';
  RAISE NOTICE '✅ Trigger handle_new_user créé';
  RAISE NOTICE '✅ Fonction get_user_profile créée';
  RAISE NOTICE '=== Prêt pour tester l''authentification ===';
END $$;