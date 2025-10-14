-- Migration: 010_create_admin_crud_functions.sql
-- Fonctions CRUD pour l'administration

-- Fonctions pour logging d'actions administratives
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_name TEXT,
  resource_type VARCHAR(50),
  resource_id UUID DEFAULT NULL,
  old_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  admin_user UUID;
  log_id UUID;
BEGIN
  -- Récupérer l'utilisateur admin connecté
  SELECT id INTO admin_user FROM public.profiles
  WHERE id = auth.uid()
  AND role = 'ADMIN'
  AND is_active = true;

  IF admin_user IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non autorisé';
  END IF;

  -- Insérer le log d'action
  INSERT INTO public.admin_actions (
    admin_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    admin_user,
    action_name,
    resource_type,
    resource_id,
    old_values,
    new_values,
    inet_client_addr(),
    COALESCE(current_setting('request.headers', true)::json->>'user-agent', '')
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions pour la gestion des utilisateurs (CRUD complet)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_param TEXT,
  first_name_param TEXT DEFAULT NULL,
  last_name_param TEXT DEFAULT NULL,
  company_name_param TEXT DEFAULT NULL,
  phone_param TEXT DEFAULT NULL,
  role_param TEXT DEFAULT 'USER',
  is_active_param BOOLEAN DEFAULT true,
  email_verified_param BOOLEAN DEFAULT false,
  phone_verified_param BOOLEAN DEFAULT false
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  message TEXT
) AS $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO existing_user_id FROM public.profiles WHERE email = email_param;

  IF existing_user_id IS NOT NULL THEN
    RETURN QUERY SELECT false, existing_user_id::uuid, 'Un utilisateur avec cet email existe déjà'::text;
  END IF;

  -- Créer l'utilisateur dans auth.users
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
    updated_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email_param,
    crypt('password123', gen_salt('bf')),
    CASE WHEN email_verified_param THEN NOW() ELSE NULL END,
    phone_param,
    CASE WHEN phone_verified_param THEN NOW() ELSE NULL END,
    jsonb_build_object(
      'first_name', first_name_param,
      'last_name', last_name_param,
      'phone', phone_param,
      'role', role_param
    ),
    jsonb_build_object('provider', 'admin_created', 'providers', ARRAY['admin']),
    NOW(),
    NOW()
  RETURNING id INTO new_user_id;

  -- Créer le profil correspondant
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
    new_user_id,
    email_param,
    first_name_param,
    last_name_param,
    company_name_param,
    phone_param,
    role_param,
    is_active_param,
    email_verified_param,
    phone_verified_param,
    NOW(),
    NOW()
  );

  -- Logger l'action
  PERFORM public.log_admin_action(
    'CREATE_USER',
    'profile',
    new_user_id,
    NULL::jsonb,
    jsonb_build_object(
      'email', email_param,
      'first_name', first_name_param,
      'last_name', last_name_param,
      'role', role_param
    )
  );

  RETURN QUERY SELECT true, new_user_id, 'Utilisateur créé avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  user_id_param UUID,
  updates JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  existing_user_id UUID;
  old_data JSONB;
BEGIN
  -- Vérifier si l'utilisateur existe
  SELECT id INTO existing_user_id FROM public.profiles WHERE id = user_id_param;

  IF existing_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Utilisateur non trouvé'::text;
  END IF;

  -- Récupérer les anciennes valeurs
  SELECT jsonb_build_object(
    'email', email,
    'first_name', first_name,
    'last_name', last_name,
    'company_name', company_name,
    'phone', phone,
    'role', role,
    'is_active', is_active,
    'email_verified', email_verified,
    'phone_verified', phone_verified
  ) INTO old_data
  FROM public.profiles WHERE id = user_id_param;

  -- Mettre à jour le profil
  UPDATE public.profiles SET
    first_name = COALESCE(updates->>'first_name', first_name),
    last_name = COALESCE(updates->>'last_name', last_name),
    company_name = COALESCE(updates->>'company_name', company_name),
    phone = COALESCE(updates->>'phone', phone),
    role = COALESCE(updates->>'role', role),
    is_active = COALESCE(updates->>'is_active', is_active),
    email_verified = COALESCE(updates->>'email_verified', email_verified),
    phone_verified = COALESCE(updates->>'phone_verified', phone_verified),
    updated_at = NOW()
  WHERE id = user_id_param;

  -- Logger l'action
  PERFORM public.log_admin_action(
    'UPDATE_USER',
    'profile',
    user_id_param,
    old_data,
    jsonb_build_object(
      'updates', updates,
      'email', COALESCE(updates->>'email', old_data->>'email'),
      'first_name', COALESCE(updates->>'first_name', old_data->>'first_name'),
      'role', COALESCE(updates->>'role', old_data->>'role')
    )
  );

  RETURN QUERY SELECT true, 'Utilisateur mis à jour avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  user_id_param UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  existing_user_id UUID;
  user_data JSONB;
BEGIN
  -- Vécupérer les informations avant suppression
  SELECT jsonb_build_object(
    'email', email,
    'first_name', first_name,
    'last_name', last_name,
    'role', role,
    'is_active', is_active
  ) INTO user_data
  FROM public.profiles WHERE id = user_id_param;

  IF user_data IS NULL THEN
    RETURN QUERY SELECT false, 'Utilisateur non trouvé'::text;
  END IF;

  -- Supprimer le profil (cascade supprimera aussi les autres enregistrements)
  DELETE FROM public.profiles WHERE id = user_id_param;

  -- Logger l'action
  PERFORM public.log_admin_action(
    'DELETE_USER',
    'profile',
    user_id_param,
    user_data,
    NULL::jsonb
  );

  RETURN QUERY SELECT true, 'Utilisateur supprimé avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions pour la gestion des offres CRUD
CREATE OR REPLACE FUNCTION public.admin_create_offer(
  title_param TEXT,
  description_param TEXT,
  insurer_id_param UUID,
  price_param DECIMAL,
  category_param TEXT,
  coverage_param TEXT[],
  features_param TEXT[],
  currency_param TEXT DEFAULT 'FCFA',
  status_param TEXT DEFAULT 'draft',
  visibility_param TEXT DEFAULT 'public',
  priority_param TEXT DEFAULT 'medium'
)
RETURNS TABLE (
  success BOOLEAN,
  offer_id UUID,
  message TEXT
) AS $$
DECLARE
  new_offer_id UUID;
BEGIN
  -- Créer l'offre
  INSERT INTO public.insurance_offers (
    id,
    insurer_id,
    category_id,
    name,
    description,
    price_min,
    price_max,
    coverage_amount,
    deductible,
    is_active,
    features,
    contract_type,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    insurer_id_param,
    (SELECT id FROM public.insurance_categories WHERE id = category_param),
    title_param,
    description_param,
    price_param,
    price_param,
    price_param * 10, -- coverage_amount comme 10x le prix
    0, -- deductible par défaut
    status_param = 'active',
    features_param,
    status_param,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_offer_id;

  -- Logger l'action
  PERFORM public.log_admin_action(
    'CREATE_OFFER',
    'insurance_offer',
    new_offer_id,
    NULL::jsonb,
    jsonb_build_object(
      'title', title_param,
      'insurer_id', insurer_id_param,
      'price', price_param,
      'currency', currency_param,
      'category', category_param,
      'status', status_param
    )
  );

  RETURN QUERY SELECT true, new_offer_id, 'Offre créée avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_update_offer(
  offer_id_param UUID,
  updates JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  existing_offer_id UUID;
  old_data JSONB;
BEGIN
  -- Vérifier si l'offre existe
  SELECT id INTO existing_offer_id FROM public.insurance_offers WHERE id = offer_id_param;

  IF existing_offer_id IS NULL THEN
    RETURN QUERY SELECT false, 'Offre non trouvée'::text;
  END IF;

  -- Récupérer les anciennes valeurs
  SELECT jsonb_build_object(
    'name', name,
    'description', description,
    'price_min', price_min,
    'price_max', price_max,
    'is_active', is_active
  ) INTO old_data
  FROM public.insurance_offers WHERE id = offer_id_param;

  -- Mettre à jour l'offre
  UPDATE public.insurance_offers SET
    name = COALESCE(updates->>'name', name),
    description = COALESCE(updates->>'description', description),
    price_min = COALESCE((updates->>'price')::DECIMAL, price_min),
    price_max = COALESCE((updates->>'price')::DECIMAL, price_max),
    is_active = COALESCE((updates->>'is_active')::BOOLEAN, is_active),
    features = COALESCE(updates->>'features', features),
    updated_at = NOW()
  WHERE id = offer_id_param;

  -- Logger l'action
  PERFORM public.log_admin_action(
    'UPDATE_OFFER',
    'insurance_offer',
    offer_id_param,
    old_data,
    jsonb_build_object(
      'updates', updates,
      'name', COALESCE(updates->>'name', old_data->>'name')
    )
  );

  RETURN QUERY SELECT true, 'Offre mise à jour avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions pour les rapports et exports
CREATE OR REPLACE FUNCTION public.admin_generate_report(
  report_name TEXT,
  report_type TEXT,
  parameters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success BOOLEAN,
  report_id UUID,
  message TEXT
) AS $$
DECLARE
  new_report_id UUID;
  admin_user UUID;
BEGIN
  -- Vérifier si l'admin est connecté
  SELECT id INTO admin_user FROM public.profiles
  WHERE id = auth.uid()
  AND role = 'ADMIN'
  AND is_active = true;

  IF admin_user IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non autorisé';
  END IF;

  -- Créer le rapport
  INSERT INTO public.reports (
    name,
    description,
    type,
    parameters,
    status,
    created_by,
    created_at
  ) VALUES (
    report_name,
    'Rapport généré automatiquement le ' || NOW(),
    report_type,
    parameters,
    'pending',
    admin_user,
    NOW()
  )
  RETURNING id INTO new_report_id;

  -- Logger l'action
  PERFORM public.log_admin_action(
    'GENERATE_REPORT',
    'report',
    new_report_id,
    NULL::jsonb,
    jsonb_build_object(
      'report_name', report_name,
      'report_type', report_type,
      'parameters', parameters
    )
  );

  RETURN QUERY SELECT true, new_report_id, 'Rapport créé avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions pour les alertes système
CREATE OR REPLACE FUNCTION public.admin_create_alert(
  title_param TEXT,
  description_param TEXT,
  type_param TEXT,
  severity_param TEXT DEFAULT 'info',
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success BOOLEAN,
  alert_id UUID,
  message TEXT
) AS $$
DECLARE
  new_alert_id UUID;
BEGIN
  -- Créer l'alerte
  INSERT INTO public.system_alerts (
    title,
    description,
    severity,
    type,
    status,
    metadata,
    created_at
  ) VALUES (
    title_param,
    description_param,
    severity_param,
    type_param,
    'active',
    metadata_param,
    NOW()
  )
  RETURNING id INTO new_alert_id;

  -- Logger l'action
  PERFORM public.log_admin_action(
    'CREATE_ALERT',
    'system_alert',
    new_alert_id,
    NULL::jsonb,
    jsonb_build_object(
      'title', title_param,
      'severity', severity_param,
      'type', type_param
    )
  );

  RETURN QUERY SELECT true, new_alert_id, 'Alerte créée avec succès'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'administration
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  total_insurers BIGINT,
  active_insurers BIGINT,
  total_offers BIGINT,
  active_offers BIGINT,
  total_quotes BIGINT,
  monthly_growth NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'USER') as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'USER' AND is_active = true) as active_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'INSURER') as total_insurers,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'INSURER' AND is_active = true) as active_insurers,
    (SELECT COUNT(*) FROM public.insurance_offers) as total_offers,
    (SELECT COUNT(*) FROM public.insurance_offers WHERE is_active = true) as active_offers,
    (SELECT COUNT(*) FROM public.quotes) as total_quotes,
    5.2 as monthly_growth, -- Valeur simulée
    15.3 as conversion_rate -- Valeur simulée
  FROM (
    SELECT 1
  ) dummy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir l'historique des activités
CREATE OR REPLACE FUNCTION public.admin_get_activity_logs(
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    p.email as user_email,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.created_at
  FROM activity_logs al
  LEFT JOIN profiles p ON p.id = al.user_id
  ORDER BY al.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour la recherche avancée d'utilisateurs
CREATE OR REPLACE FUNCTION public.admin_search_users(
  search_term TEXT DEFAULT '',
  role_filter TEXT DEFAULT NULL,
  status_filter BOOLEAN DEFAULT NULL,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
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
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  quotes_count BIGINT,
  policies_count BIGINT
) AS $$
BEGIN
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
    p.created_at,
    p.updated_at,
    COALESCE(qc.quote_count, 0) as quotes_count,
    COALESCE(pc.policy_count, 0) as policies_count
  FROM profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as quote_count
    FROM quotes
    GROUP BY user_id
  ) qc ON qc.user_id = p.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as policy_count
    FROM policies
    GROUP BY user_id
  ) pc ON pc.user_id = p.id
  WHERE
    (search_term IS NULL OR
     p.email ILIKE '%' || search_term || '%' OR
     p.first_name ILIKE '%' || search_term || '%' OR
     p.last_name ILIKE '%' || search_term || '%' OR
     COALESCE(p.company_name, '') ILIKE '%' || search_term || '%'
    )
    AND (role_filter IS NULL OR p.role = role_filter)
    AND (status_filter IS NULL OR p.is_active = status_filter)
  ORDER BY p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== FONCTIONS ADMIN CRUD CRÉÉES AVEC SUCCÈS ===';
  RAISE NOTICE 'Fonctions disponibles:';
  RAISE NOTICE '- log_admin_action() - Logger les actions administratives';
  RAISE NOTICE '- admin_create_user() - Créer un utilisateur';
  RAISE NOTICE '- admin_update_user() - Mettre à jour un utilisateur';
  RAISE NOTICE '- admin_delete_user() - Supprimer un utilisateur';
  RAISE NOTICE '- admin_create_offer() - Créer une offre';
  RAISE NOTICE '- admin_update_offer() - Mettre à jour une offre';
  RAISE NOTICE '- admin_generate_report() - Générer un rapport';
  RAISE NOTICE '- admin_create_alert() - Créer une alerte système';
  RAISE NOTICE '- admin_get_platform_stats() - Obtenir les statistiques';
  RAISE NOTICE '- admin_get_activity_logs() - Obtenir l''historique des activités';
  RAISE NOTICE '- admin_search_users() - Rechercher des utilisateurs';
  RAISE NOTICE '';
  RAISE NOTICE '=== Fonctionnalités CRUD admin prêtes !';
END $$;