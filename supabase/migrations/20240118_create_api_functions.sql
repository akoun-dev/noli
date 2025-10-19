-- Migration pour créer les fonctions API et vues optimisées
-- Créée le 2024-01-18 pour la migration des services vers Supabase

-- Fonction pour obtenir l'ID de l'assureur actuel
CREATE OR REPLACE FUNCTION get_current_insurer_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  insurer_account RECORD;
BEGIN
  -- Récupérer l'ID de l'utilisateur authentifié
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Vérifier si c'est un assureur et récupérer son ID d'assureur
  SELECT insurer_id INTO insurer_account
  FROM insurer_accounts
  WHERE profile_id = current_user_id;

  IF insurer_account IS NOT NULL THEN
    RETURN insurer_account.insurer_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Fonction pour obtenir le profil utilisateur avec permissions
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID DEFAULT NULL)
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  permissions TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Utiliser l'utilisateur fourni ou l'utilisateur actuel
  target_user_id := COALESCE(user_uuid, auth.uid());

  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

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
    ARRAY_AGG(DISTINCT rp.permission) as permissions
  FROM profiles p
  LEFT JOIN role_permissions rp ON p.role = rp.role
  WHERE p.id = target_user_id
  GROUP BY p.id, p.email, p.first_name, p.last_name, p.company_name,
           p.phone, p.role, p.avatar_url, p.is_active, p.email_verified,
           p.phone_verified, p.created_at, p.updated_at;

  RETURN;
END;
$$;

-- Fonction pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  permissions TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT permission) INTO permissions
  FROM role_permissions rp
  JOIN profiles p ON rp.role = p.role
  WHERE p.id = user_uuid AND p.is_active = TRUE;

  RETURN COALESCE(permissions, ARRAY[]::TEXT[]);
END;
$$;

-- Fonction pour vérifier si un utilisateur a une permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT, target_user UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_perm BOOLEAN := FALSE;
  check_user_id UUID;
BEGIN
  check_user_id := COALESCE(target_user, auth.uid());

  IF check_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM role_permissions rp
    JOIN profiles p ON rp.role = p.role
    WHERE p.id = check_user_id
      AND p.is_active = TRUE
      AND rp.permission = permission_name
  ) INTO has_perm;

  RETURN has_perm;
END;
$$;

-- Fonction pour logger une action utilisateur
CREATE OR REPLACE FUNCTION log_user_action(
  user_action TEXT,
  resource_name TEXT DEFAULT NULL,
  resource_id_value TEXT DEFAULT NULL,
  metadata_value JSON DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  INSERT INTO audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    ip_address,
    user_agent,
    metadata,
    created_at
  ) VALUES (
    current_user_id,
    user_action,
    resource_name,
    resource_id_value,
    current_setting('request.headers')::JSON->>'x-forwarded-for',
    current_setting('request.headers')::JSON->>'user-agent',
    metadata_value,
    NOW()
  );
END;
$$;

-- Fonction pour logger une action utilisateur (version sécurisée)
CREATE OR REPLACE FUNCTION log_user_action_safe(
  user_action TEXT,
  resource_name TEXT DEFAULT NULL,
  resource_id_value TEXT DEFAULT NULL,
  metadata_value JSON DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Version sécurisée qui ne lève pas d'erreur
  BEGIN
    PERFORM log_user_action(user_action, resource_name, resource_id_value, metadata_value);
  EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas la propager
    INSERT INTO audit_logs (
      user_id,
      action,
      resource,
      metadata,
      created_at
    ) VALUES (
      auth.uid(),
      'LOG_ERROR',
      'log_user_action_safe',
      JSON_BUILD_OBJECT(
        'original_action', user_action,
        'error_message', SQLERRM
      ),
      NOW()
    );
  END;
END;
$$;

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT 'general',
  p_action_url TEXT DEFAULT NULL,
  p_action_text TEXT DEFAULT NULL,
  p_metadata JSON DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    action_url,
    action_text,
    metadata,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_category,
    p_action_url,
    p_action_text,
    p_metadata,
    p_expires_at,
    NOW(),
    NOW()
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  rows_affected INTEGER;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());

  UPDATE notifications
  SET read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id
    AND user_id = target_user_id;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  RETURN rows_affected > 0;
END;
$$;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  rows_affected INTEGER;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());

  UPDATE notifications
  SET read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE user_id = target_user_id
    AND read = FALSE;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  RETURN rows_affected;
END;
$$;

-- Fonction pour obtenir les notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  category TEXT,
  action_url TEXT,
  action_text TEXT,
  metadata JSON,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(p_user_id, auth.uid());

  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.message,
    n.type,
    n.category,
    n.action_url,
    n.action_text,
    n.metadata,
    n.created_at
  FROM notifications n
  WHERE n.user_id = target_user_id
    AND n.read = FALSE
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT p_limit;

  RETURN;
END;
$$;

-- Fonction pour créer les préférences de notification par défaut
CREATE OR REPLACE FUNCTION create_default_notification_preferences(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pref_id UUID;
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    sms_enabled,
    whatsapp_enabled,
    categories,
    quiet_hours_start,
    quiet_hours_end,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    JSON_BUILD_OBJECT(
      'general', TRUE,
      'quote', TRUE,
      'policy', TRUE,
      'payment', TRUE,
      'system', TRUE
    ),
    '22:00',
    '08:00',
    'Africa/Abidjan',
    NOW(),
    NOW()
  ) RETURNING id INTO pref_id;

  RETURN pref_id;
END;
$$;

-- Fonction pour obtenir la taille de la base de données
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size INTEGER;
BEGIN
  -- Cette fonction nécessite des droits étendus en production
  -- Pour l'instant, retourner une valeur simulée
  SELECT (random() * 500 + 50)::INTEGER INTO db_size;

  RETURN db_size;
END;
$$;

-- Fonction pour obtenir les connexions actives
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connections INTEGER;
BEGIN
  -- Simuler le nombre de connexions actives
  SELECT (random() * 100 + 10)::INTEGER INTO connections;

  RETURN connections;
END;
$$;

-- Fonction pour obtenir les statistiques de la plateforme (admin)
CREATE OR REPLACE FUNCTION admin_get_platform_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  new_this_month BIGINT,
  new_this_week BIGINT,
  active_this_month BIGINT,
  growth_rate_percent DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est un admin
  IF NOT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN role_permissions rp ON p.role = rp.role
    WHERE p.id = auth.uid()
      AND rp.permission = 'manage:system'
      AND p.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_users,
    COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_users,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_this_month,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as new_this_week,
    COUNT(*) FILTER (WHERE is_active = TRUE AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as active_this_month,
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) > 0
      THEN ROUND(
        (COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::DECIMAL /
         COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) - 1) * 100, 2
      )
      ELSE 0
    END as growth_rate_percent
  FROM profiles
  WHERE role = 'USER';

  RETURN;
END;
$$;

-- Fonction pour créer un token de reset de mot de passe
CREATE OR REPLACE FUNCTION create_password_reset_token(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  token TEXT;
  token_id UUID;
BEGIN
  -- Trouver l'utilisateur
  SELECT id INTO user_record
  FROM profiles
  WHERE email = LOWER(user_email)
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Générer un token
  token := encode(gen_random_bytes(32), 'hex');
  token_id := gen_random_uuid();

  -- Invalider les anciens tokens
  UPDATE password_reset_tokens
  SET used = TRUE
  WHERE user_id = user_record.id AND used = FALSE;

  -- Insérer le nouveau token
  INSERT INTO password_reset_tokens (
    id,
    user_id,
    token,
    expires_at,
    used,
    created_at
  ) VALUES (
    token_id,
    user_record.id,
    token,
    NOW() + INTERVAL '1 hour',
    FALSE,
    NOW()
  );

  RETURN token;
END;
$$;

-- Fonction pour utiliser un token de reset de mot de passe
CREATE OR REPLACE FUNCTION use_password_reset_token(token_value TEXT, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Trouver le token
  SELECT * INTO token_record
  FROM password_reset_tokens
  WHERE token = token_value
    AND used = FALSE
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Mettre à jour le mot de passe (via Supabase Auth)
  -- Note: Ceci nécessite une implémentation spécifique selon votre setup

  -- Marquer le token comme utilisé
  UPDATE password_reset_tokens
  SET used = TRUE
  WHERE id = token_record.id;

  -- Logger l'action
  PERFORM log_user_action('PASSWORD_RESET', 'profile', token_record.user_id::TEXT);

  RETURN TRUE;
END;
$$;

-- Créer les permissions de rôle par défaut
INSERT INTO role_permissions (role, permission) VALUES
  ('USER', 'read:own_profile'),
  ('USER', 'update:own_profile'),
  ('USER', 'read:own_quotes'),
  ('USER', 'create:quotes'),
  ('USER', 'read:own_policies'),
  ('USER', 'create:payments'),
  ('USER', 'read:own_offers'),
  ('USER', 'create:offers'),
  ('USER', 'update:own_offers'),
  ('USER', 'read:quotes'),
  ('USER', 'respond:quotes'),
  ('USER', 'read:own_analytics'),

  ('INSURER', 'read:own_profile'),
  ('INSURER', 'update:own_profile'),
  ('INSURER', 'manage:clients'),
  ('INSURER', 'read:all_offers'),
  ('INSURER', 'create:offers'),
  ('INSURER', 'update:all_offers'),
  ('INSURER', 'delete:offers'),
  ('INSURER', 'read:all_quotes'),
  ('INSURER', 'manage:quotes'),
  ('INSURER', 'read:own_analytics'),

  ('ADMIN', 'read:all_profiles'),
  ('ADMIN', 'update:all_profiles'),
  ('ADMIN', 'create:profiles'),
  ('ADMIN', 'delete:profiles'),
  ('ADMIN', 'read:all_offers'),
  ('ADMIN', 'create:offers'),
  ('ADMIN', 'update:all_offers'),
  ('ADMIN', 'delete:offers'),
  ('ADMIN', 'read:all_quotes'),
  ('ADMIN', 'manage:quotes'),
  ('ADMIN', 'read:all_audit_logs'),
  ('ADMIN', 'manage:tarification'),
  ('ADMIN', 'manage:system'),
  ('ADMIN', 'manage:notifications'),
  ('ADMIN', 'read:analytics'),
  ('ADMIN', 'export:data')
ON CONFLICT (role, permission) DO NOTHING;

-- Créer les triggers pour les logs automatiques
CREATE OR REPLACE FUNCTION trigger_log_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_user_action_safe('ACCOUNT_CREATED', 'profile', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_new_user();

-- Créer le trigger pour les préférences de notification par défaut
CREATE OR REPLACE FUNCTION trigger_create_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_default_notification_preferences(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_notification_preferences();

-- Logger les connexions/déconnexions
CREATE OR REPLACE FUNCTION trigger_log_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_user_action_safe('USER_LOGIN', 'session', NEW.id::TEXT);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_log_user_logout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_user_action_safe('USER_LOGOUT', 'session', OLD.id::TEXT);
  RETURN OLD;
END;
$$;