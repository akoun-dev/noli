-- Migration: 004_create_functions.sql
-- Création des fonctions et triggers pour l'authentification

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')
  );
  
  -- Logger la création du compte
  INSERT INTO public.audit_logs (
    user_id, 
    action, 
    resource, 
    resource_id, 
    metadata
  ) VALUES (
    NEW.id,
    'ACCOUNT_CREATED',
    'profile',
    NEW.id::text,
    jsonb_build_object(
      'email', NEW.email,
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
      'provider', NEW.app_metadata->>'provider'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil après inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour logger les actions des utilisateurs
CREATE OR REPLACE FUNCTION public.log_user_action(
  user_action TEXT,
  resource_name TEXT DEFAULT NULL,
  resource_id_value TEXT DEFAULT NULL,
  metadata_value JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, 
    action, 
    resource, 
    resource_id, 
    ip_address, 
    user_agent, 
    metadata
  ) VALUES (
    auth.uid(),
    user_action,
    resource_name,
    resource_id_value,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    metadata_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un token de réinitialisation de mot de passe
CREATE OR REPLACE FUNCTION public.create_password_reset_token(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_record public.profiles%ROWTYPE;
  reset_token TEXT;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record FROM public.profiles WHERE email = user_email AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Générer un token unique
  reset_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insérer le token de reset
  INSERT INTO public.password_reset_tokens (
    user_id, 
    token, 
    expires_at
  ) VALUES (
    user_record.id,
    reset_token,
    NOW() + INTERVAL '1 hour' -- Token valide 1 heure
  );
  
  -- Logger la demande de reset
  PERFORM public.log_user_action(
    'PASSWORD_RESET_REQUESTED',
    'profile',
    user_record.id::text,
    jsonb_build_object('email', user_email)
  );
  
  RETURN reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider et utiliser un token de reset
CREATE OR REPLACE FUNCTION public.use_password_reset_token(token_value TEXT, new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  token_record public.password_reset_tokens%ROWTYPE;
BEGIN
  -- Récupérer le token
  SELECT * INTO token_record FROM public.password_reset_tokens 
  WHERE token = token_value AND used = false AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token invalide ou expiré';
  END IF;
  
  -- Marquer le token comme utilisé
  UPDATE public.password_reset_tokens 
  SET used = true 
  WHERE id = token_record.id;
  
  -- Logger l'utilisation du token
  PERFORM public.log_user_action(
    'PASSWORD_RESET_COMPLETED',
    'profile',
    token_record.user_id::text,
    jsonb_build_object('token_used', token_value)
  );
  
  -- Note: Le changement de mot de passe sera géré par Supabase Auth
  -- Cette fonction sert principalement à la validation et au logging
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le profil utilisateur avec ses permissions
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  permissions TEXT[]
) AS $$
DECLARE
  target_user UUID := COALESCE(user_uuid, auth.uid());
  user_permissions TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Vérifier si l'utilisateur a le droit d'accéder à ce profil
  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Si ce n'est pas son propre profil, vérifier les permissions
  IF target_user != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Permission refusée';
    END IF;
  END IF;
  
  -- Déterminer les permissions selon le rôle
  PERFORM public.get_user_permissions(target_user) INTO user_permissions;
  
  -- Retourner le profil et les permissions
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.company_name,
    p.phone,
    p.role,
    p.avatar_url,
    p.is_active,
    p.email_verified,
    p.phone_verified,
    p.created_at,
    p.updated_at,
    user_permissions
  FROM public.profiles p
  WHERE p.id = target_user AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les permissions d'un utilisateur selon son rôle
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
  user_role TEXT;
  user_permissions TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO user_role FROM public.profiles WHERE id = user_uuid AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Définir les permissions selon le rôle
  CASE user_role
    WHEN 'USER' THEN
      user_permissions := ARRAY[
        'read:own_profile',
        'update:own_profile',
        'read:own_quotes',
        'create:quotes',
        'read:own_policies',
        'create:payments'
      ];
    WHEN 'INSURER' THEN
      user_permissions := ARRAY[
        'read:own_profile',
        'update:own_profile',
        'read:own_offers',
        'create:offers',
        'update:own_offers',
        'read:quotes',
        'respond:quotes',
        'read:own_analytics',
        'manage:clients'
      ];
    WHEN 'ADMIN' THEN
      user_permissions := ARRAY[
        'read:all_profiles',
        'update:all_profiles',
        'create:profiles',
        'delete:profiles',
        'read:all_offers',
        'create:offers',
        'update:all_offers',
        'delete:offers',
        'read:all_quotes',
        'manage:quotes',
        'read:all_audit_logs',
        'manage:tarification',
        'manage:system'
      ];
  END CASE;
  
  RETURN user_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.user_has_permission(permission_name TEXT, target_user UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions TEXT[];
BEGIN
  user_permissions := public.get_user_permissions(COALESCE(target_user, auth.uid()));
  RETURN permission_name = ANY(user_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les connexions
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_user_action(
    'LOGIN',
    'session',
    NEW.id::text,
    jsonb_build_object(
      'provider', NEW.raw_user_meta_data->>'provider',
      'last_sign_in', NEW.last_sign_in_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les déconnexions
CREATE OR REPLACE FUNCTION public.log_user_logout()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_user_action(
    'LOGOUT',
    'session',
    OLD.id::text,
    jsonb_build_object('session_ended', NOW())
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documenter les fonctions
COMMENT ON FUNCTION public.handle_new_user() IS 'Crée automatiquement un profil lors de l''inscription';
COMMENT ON FUNCTION public.log_user_action() IS 'Enregistre une action dans les logs d''audit';
COMMENT ON FUNCTION public.create_password_reset_token() IS 'Génère un token de réinitialisation de mot de passe';
COMMENT ON FUNCTION public.use_password_reset_token() IS 'Valide et utilise un token de reset';
COMMENT ON FUNCTION public.get_user_profile() IS 'Retourne le profil utilisateur avec ses permissions';
COMMENT ON FUNCTION public.get_user_permissions() IS 'Retourne les permissions selon le rôle';
COMMENT ON FUNCTION public.user_has_permission() IS 'Vérifie si un utilisateur a une permission spécifique';
