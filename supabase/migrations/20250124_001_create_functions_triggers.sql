-- Functions and triggers
-- Création des fonctions utilitaires et triggers

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer le profil uniquement s'il n'existe pas déjà
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
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    true,
    NEW.email_confirmed_at IS NOT NULL,
    NEW.phone_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour obtenir le profil utilisateur
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT,
  is_active BOOLEAN,
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user UUID := COALESCE(user_uuid, auth.uid());
BEGIN
  IF target_user IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.company_name,
    p.phone,
    p.role,
    p.is_active,
    p.email_verified,
    p.phone_verified,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = target_user;
END;
$$;

-- Fonction pour obtenir les permissions utilisateur
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID DEFAULT NULL)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user UUID := COALESCE(user_uuid, auth.uid());
  user_role TEXT;
  user_permissions TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF target_user IS NULL THEN
    RETURN user_permissions;
  END IF;

  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = target_user AND is_active = true;

  IF user_role IS NULL THEN
    RETURN user_permissions;
  END IF;

  user_permissions := CASE
    WHEN user_role = 'ADMIN' THEN ARRAY[
      'read:all_profiles', 'write:all_profiles', 'delete:all_profiles',
      'read:all_quotes', 'write:all_quotes', 'delete:all_quotes',
      'read:all_policies', 'write:all_policies', 'delete:all_policies',
      'read:all_payments', 'write:all_payments', 'delete:all_payments',
      'manage:insurers', 'manage:categories', 'manage:system'
    ]
    WHEN user_role = 'INSURER' THEN ARRAY[
      'read:own_offers', 'write:own_offers', 'read:own_quotes',
      'read:own_policies', 'manage:own_clients', 'read:analytics'
    ]
    ELSE ARRAY[
      'read:own_profile', 'write:own_profile', 'read:own_quotes',
      'read:own_policies', 'write:own_quotes', 'read:own_payments'
    ]
  END;

  RETURN user_permissions;
END;
$$;

-- Fonction pour vérifier une permission spécifique
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT, target_user UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_permissions TEXT[];
  user_uuid UUID := COALESCE(target_user, auth.uid());
BEGIN
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;

  user_permissions := public.get_user_permissions(user_uuid);
  RETURN permission_name = ANY(user_permissions);
END;
$$;

-- Fonction pour logger les actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  action_name TEXT,
  resource_type TEXT DEFAULT NULL,
  resource_id TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log simple (peut être étendu plus tard avec une table audit_logs)
  RAISE NOTICE 'User Action: % - %:% - %',
    auth.uid()::TEXT,
    action_name,
    COALESCE(resource_type, 'N/A'),
    COALESCE(resource_id, 'N/A');
END;
$$;

-- Fonction pour obtenir les statistiques utilisateur
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  role TEXT,
  total_users BIGINT,
  active_users BIGINT,
  new_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    role,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_this_month
  FROM public.profiles
  GROUP BY role;
END;
$$;

-- Fonction pour obtenir les catégories d'assurance actives
CREATE OR REPLACE FUNCTION public.get_active_categories()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    name,
    description
  FROM public.insurance_categories
  WHERE is_active = true
  ORDER BY name;
END;
$$;

-- Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.user_has_permission TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_user_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_active_categories TO authenticated, anon;

DO $$
BEGIN
  RAISE NOTICE '=== FONCTIONS ET TRIGGERS CRÉÉS ===';
  RAISE NOTICE '✅ handle_new_user - Trigger auto-profil';
  RAISE NOTICE '✅ get_user_profile - Obtenir profil utilisateur';
  RAISE NOTICE '✅ get_user_permissions - Permissions utilisateur';
  RAISE NOTICE '✅ user_has_permission - Vérifier permission';
  RAISE NOTICE '✅ log_user_action - Logger actions';
  RAISE NOTICE '✅ get_user_stats - Statistiques utilisateurs';
  RAISE NOTICE '✅ get_active_categories - Catégories actives';
END $$;