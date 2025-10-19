-- Migration pour créer les vues analytiques optimisées
-- Créée le 2024-01-18 pour optimiser les requêtes analytics

-- Vue pour les statistiques utilisateurs
CREATE OR REPLACE VIEW user_stats_view AS
SELECT
  'USER' as role,
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

-- Vue pour les statistiques des devis
CREATE OR REPLACE VIEW quote_stats_view AS
SELECT
  q.status,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE q.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as quotes_this_month,
  COUNT(*) FILTER (WHERE q.created_at >= DATE_TRUNC('week', CURRENT_DATE)) as quotes_this_week,
  COUNT(*) FILTER (WHERE q.status IN ('APPROVED', 'REJECTED')) as valid_quotes,
  ROUND(AVG(qo.price)) as average_price,
  ROUND(AVG(qo.price) * COUNT(*)) as total_value,
  ic.name as category_name,
  COUNT(DISTINCT q.user_id) as unique_users
FROM quotes q
LEFT JOIN quote_offers qo ON q.id = qo.quote_id
LEFT JOIN insurance_categories ic ON q.category_id = ic.id
GROUP BY q.status, ic.name;

-- Vue pour les statistiques des polices
CREATE OR REPLACE VIEW policy_stats_view AS
SELECT
  p.status,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE p.status = 'ACTIVE') as active_policies,
  COUNT(*) FILTER (WHERE p.status = 'EXPIRED') as expired_policies,
  COUNT(*) FILTER (WHERE p.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as policies_this_month,
  ROUND(SUM(p.premium_amount)) as total_premium_amount,
  ROUND(AVG(p.premium_amount)) as average_premium,
  p.payment_frequency,
  i.name as insurer_name,
  COUNT(DISTINCT p.user_id) as unique_customers
FROM policies p
LEFT JOIN insurers i ON p.insurer_id = i.id
GROUP BY p.status, p.payment_frequency, i.name;

-- Vue pour les statistiques de paiement
CREATE OR REPLACE VIEW payment_stats_view AS
SELECT
  p.status,
  COUNT(*) as total_payments,
  ROUND(SUM(p.amount)) as total_amount,
  ROUND(AVG(p.amount)) as average_amount,
  COUNT(*) FILTER (WHERE p.payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as payments_this_month,
  COUNT(*) FILTER (WHERE p.payment_date >= DATE_TRUNC('week', CURRENT_DATE)) as payments_this_week,
  p.payment_method,
  COUNT(DISTINCT p.user_id) as unique_payers
FROM payments p
GROUP BY p.status, p.payment_method;

-- Vue pour la performance des assureurs
CREATE OR REPLACE VIEW insurer_performance_view AS
SELECT
  i.id as insurer_id,
  i.name as insurer_name,
  i.rating,
  COUNT(DISTINCT io.id) as total_offers,
  COUNT(DISTINCT io.id) FILTER (WHERE io.is_active = TRUE) as active_offers,
  COUNT(DISTINCT qo.id) as total_quote_offers,
  COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED') as approved_offers,
  COUNT(DISTINCT p.id) as total_policies,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'ACTIVE') as active_policies,
  ROUND(SUM(p.premium_amount) FILTER (WHERE p.status = 'ACTIVE')) as active_premium_revenue,
  ROUND(AVG(qo.price) FILTER (WHERE qo.status = 'APPROVED')) as average_approved_price,
  CASE
    WHEN COUNT(DISTINCT qo.id) > 0
    THEN ROUND((COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED')::DECIMAL / COUNT(DISTINCT qo.id)) * 100, 2)
    ELSE 0
  END as approval_rate_percent,
  COUNT(DISTINCT q.user_id) as unique_customers
FROM insurers i
LEFT JOIN insurance_offers io ON i.id = io.insurer_id
LEFT JOIN quote_offers qo ON i.id = qo.insurer_id
LEFT JOIN quotes q ON qo.quote_id = q.id
LEFT JOIN policies p ON i.id = p.insurer_id
WHERE i.is_active = TRUE
GROUP BY i.id, i.name, i.rating;

-- Vue pour l'activité quotidienne
CREATE OR REPLACE VIEW daily_activity_view AS
SELECT
  DATE(al.created_at) as activity_date,
  COUNT(*) FILTER (WHERE al.action = 'ACCOUNT_CREATED') as new_users,
  COUNT(*) FILTER (WHERE al.action LIKE '%QUOTE%') as new_quotes,
  COUNT(*) FILTER (WHERE al.action LIKE '%POLICY%') as new_policies,
  COUNT(*) FILTER (WHERE al.action LIKE '%PAYMENT%') as new_payments
FROM audit_logs al
WHERE al.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(al.created_at)
ORDER BY activity_date DESC;

-- Vue pour l'entonnoir de conversion
CREATE OR REPLACE VIEW conversion_funnel_view AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'USER') as users_created,
  (SELECT COUNT(DISTINCT user_id) FROM quotes) as users_with_quotes,
  (SELECT COUNT(*) FROM quotes) as quotes_created,
  (SELECT COUNT(*) FROM quote_offers) as offers_made,
  (SELECT COUNT(*) FROM quote_offers WHERE status = 'APPROVED') as offers_approved,
  (SELECT COUNT(*) FROM policies) as policies_issued;

-- Vue pour les tendances par catégorie
CREATE OR REPLACE VIEW category_trends_view AS
SELECT
  ic.id as category_id,
  ic.name as category_name,
  ic.icon,
  COUNT(DISTINCT q.id) as total_quotes,
  COUNT(DISTINCT q.id) FILTER (WHERE q.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as quotes_this_month,
  COUNT(DISTINCT qo.offer_id) as total_offers_received,
  COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED') as approved_offers,
  COUNT(DISTINCT p.id) as total_policies,
  ROUND(AVG(qo.price)) as average_quote_price,
  ROUND(AVG(qo.price) FILTER (WHERE qo.status = 'APPROVED')) as average_approved_price,
  CASE
    WHEN COUNT(DISTINCT qo.offer_id) > 0
    THEN ROUND((COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED')::DECIMAL / COUNT(DISTINCT qo.offer_id)) * 100, 2)
    ELSE 0
  END as conversion_rate_percent
FROM insurance_categories ic
LEFT JOIN quotes q ON ic.id = q.category_id
LEFT JOIN quote_offers qo ON q.id = qo.quote_id
LEFT JOIN policies p ON qo.id = p.quote_id
GROUP BY ic.id, ic.name, ic.icon
ORDER BY total_quotes DESC;

-- Vue pour les utilisateurs avec leur profil complet
CREATE OR REPLACE VIEW user_with_profile AS
SELECT
  p.*,
  u.email as auth_email,
  u.email_verified as auth_email_verified,
  u.phone as auth_phone,
  u.created_at as auth_created_at,
  u.last_sign_in_at as auth_last_sign_in_at,
  u.banned_until as auth_banned_until,
  u.deleted_at as auth_deleted_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.deleted_at IS NULL;

-- Vue pour les polices avec tous les détails
CREATE OR REPLACE VIEW policy_with_details AS
SELECT
  p.*,
  q.personal_data,
  q.vehicle_data,
  q.coverage_requirements,
  io.name as offer_name,
  io.description as offer_description,
  io.features as offer_features,
  i.name as insurer_name,
  i.logo_url as insurer_logo,
  i.rating as insurer_rating,
  profile.first_name || ' ' || profile.last_name as customer_name,
  profile.email as customer_email,
  profile.phone as customer_phone
FROM policies p
LEFT JOIN quotes q ON p.quote_id = q.id
LEFT JOIN quote_offers qo ON p.offer_id = qo.id
LEFT JOIN insurance_offers io ON qo.offer_id = io.id
LEFT JOIN insurers i ON p.insurer_id = i.id
LEFT JOIN profiles profile ON p.user_id = profile.id
WHERE p.deleted_at IS NULL;

-- Vue pour les sinistres avec détails
CREATE OR REPLACE VIEW claim_with_details AS
SELECT
  c.*,
  p.policy_number,
  p.premium_amount as policy_premium,
  io.name as offer_name,
  i.name as insurer_name,
  i.logo_url as insurer_logo,
  profile.first_name || ' ' || profile.last_name as customer_name,
  profile.email as customer_email,
  profile.phone as customer_phone,
  v.brand as vehicle_brand,
  v.model as vehicle_model,
  v.year as vehicle_year,
  v.license_plate as vehicle_license_plate
FROM claims c
LEFT JOIN policies p ON c.policy_id = p.id
LEFT JOIN quote_offers qo ON p.offer_id = qo.id
LEFT JOIN insurance_offers io ON qo.offer_id = io.id
LEFT JOIN insurers i ON p.insurer_id = i.id
LEFT JOIN profiles profile ON p.user_id = profile.id
LEFT JOIN vehicles v ON c.vehicle_id = v.id
WHERE c.deleted_at IS NULL;

-- Vue pour les devis avec détails
CREATE OR REPLACE VIEW quote_with_details AS
SELECT
  q.*,
  qo.price as offer_price,
  qo.status as offer_status,
  qo.notes as offer_notes,
  io.name as offer_name,
  io.description as offer_description,
  io.deductible as offer_deductible,
  io.features as offer_features,
  i.name as insurer_name,
  i.logo_url as insurer_logo,
  i.rating as insurer_rating,
  profile.first_name || ' ' || profile.last_name as customer_name,
  profile.email as customer_email,
  profile.phone as customer_phone
FROM quotes q
LEFT JOIN quote_offers qo ON q.id = qo.quote_id
LEFT JOIN insurance_offers io ON qo.offer_id = io.id
LEFT JOIN insurers i ON qo.insurer_id = i.id
LEFT JOIN profiles profile ON q.user_id = profile.id
WHERE q.deleted_at IS NULL;

-- Index pour optimiser les performances des vues
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON profiles(role, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_status_created ON quotes(status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quote_offers_status ON quote_offers(status);
CREATE INDEX IF NOT EXISTS idx_policies_status_created ON policies(status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON payments(status, payment_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_action ON audit_logs(created_at, action);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_insurers_active ON insurers(is_active);
CREATE INDEX IF NOT EXISTS idx_insurance_offers_active ON insurance_offers(is_active, category_id);

-- Politiques de sécurité pour les vues (RLS)
ALTER VIEW user_stats_view OWNER TO postgres;
ALTER VIEW quote_stats_view OWNER TO postgres;
ALTER VIEW policy_stats_view OWNER TO postgres;
ALTER VIEW payment_stats_view OWNER TO postgres;
ALTER VIEW insurer_performance_view OWNER TO postgres;
ALTER VIEW daily_activity_view OWNER TO postgres;
ALTER VIEW conversion_funnel_view OWNER TO postgres;
ALTER VIEW category_trends_view OWNER TO postgres;
ALTER VIEW user_with_profile OWNER TO postgres;
ALTER VIEW policy_with_details OWNER TO postgres;
ALTER VIEW claim_with_details OWNER TO postgres;
ALTER VIEW quote_with_details OWNER TO postgres;

-- Commentaires pour documenter les vues
COMMENT ON VIEW user_stats_view IS 'Statistiques agrégées des utilisateurs par rôle et période';
COMMENT ON VIEW quote_stats_view IS 'Statistiques agrégées des devis par statut et catégorie';
COMMENT ON VIEW policy_stats_view IS 'Statistiques agrégées des polices par statut et assureur';
COMMENT ON VIEW payment_stats_view IS 'Statistiques agrégées des paiements par statut et méthode';
COMMENT ON VIEW insurer_performance_view IS 'Performance détaillée des assureurs avec métriques de conversion';
COMMENT ON VIEW daily_activity_view IS 'Activité quotidienne du plateforme sur les 90 derniers jours';
COMMENT ON VIEW conversion_funnel_view IS 'Entonnoir de conversion des utilisateurs vers les polices';
COMMENT ON VIEW category_trends_view IS 'Tendances par catégorie d''assurance avec taux de conversion';
COMMENT ON VIEW user_with_profile IS 'Profil utilisateur complet avec données d''authentification';
COMMENT ON VIEW policy_with_details IS 'Police avec tous les détails associés (client, véhicule, offre)';
COMMENT ON VIEW claim_with_details IS 'Sinistre avec tous les détails associés (police, véhicule, client)';
COMMENT ON VIEW quote_with_details IS 'Devis avec tous les détails associés (offre, assureur, client)';