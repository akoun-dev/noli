-- Migration: 013_create_analytics_views.sql
-- Création des vues analytiques pour les dashboards
-- Ces vues optimisent les requêtes pour les statistiques et rapports

-- Vue pour les statistiques utilisateurs par rôle et période
CREATE OR REPLACE VIEW public.user_stats_view AS
SELECT
  p.role,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE p.is_active = true) as active_users,
  COUNT(*) FILTER (WHERE p.is_active = false) as inactive_users,
  COUNT(*) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
  COUNT(*) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week,
  COUNT(*) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days') as active_this_month,
  ROUND(
    (COUNT(*) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days')::decimal /
     NULLIF(COUNT(*) FILTER (WHERE p.created_at < CURRENT_DATE - INTERVAL '30 days'), 0)) * 100,
    2
  ) as growth_rate_percent
FROM public.profiles p
GROUP BY p.role;

-- Vue pour les statistiques des devis par statut et période
CREATE OR REPLACE VIEW public.quote_stats_view AS
SELECT
  q.status,
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE q.created_at >= CURRENT_DATE - INTERVAL '30 days') as quotes_this_month,
  COUNT(*) FILTER (WHERE q.created_at >= CURRENT_DATE - INTERVAL '7 days') as quotes_this_week,
  COUNT(*) FILTER (WHERE q.valid_until >= CURRENT_DATE) as valid_quotes,
  AVG(q.estimated_price) FILTER (WHERE q.estimated_price IS NOT NULL) as average_price,
  SUM(q.estimated_price) FILTER (WHERE q.estimated_price IS NOT NULL) as total_value,
  ic.name as category_name,
  COUNT(DISTINCT q.user_id) as unique_users
FROM public.quotes q
LEFT JOIN public.insurance_categories ic ON q.category_id = ic.id
GROUP BY q.status, ic.name;

-- Vue pour les statistiques des polices d'assurance
CREATE OR REPLACE VIEW public.policy_stats_view AS
SELECT
  p.status,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE p.start_date <= CURRENT_DATE AND p.end_date >= CURRENT_DATE) as active_policies,
  COUNT(*) FILTER (WHERE p.end_date < CURRENT_DATE) as expired_policies,
  COUNT(*) FILTER (WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days') as policies_this_month,
  SUM(p.premium_amount) as total_premium_amount,
  AVG(p.premium_amount) as average_premium,
  p.payment_frequency,
  i.name as insurer_name,
  COUNT(DISTINCT p.user_id) as unique_customers
FROM public.policies p
LEFT JOIN public.insurers i ON p.insurer_id = i.id
GROUP BY p.status, p.payment_frequency, i.name;

-- Vue pour les statistiques des paiements
CREATE OR REPLACE VIEW public.payment_stats_view AS
SELECT
  pay.status,
  COUNT(*) as total_payments,
  SUM(pay.amount) as total_amount,
  AVG(pay.amount) as average_amount,
  COUNT(*) FILTER (WHERE pay.payment_date >= CURRENT_DATE - INTERVAL '30 days') as payments_this_month,
  COUNT(*) FILTER (WHERE pay.payment_date >= CURRENT_DATE - INTERVAL '7 days') as payments_this_week,
  pay.payment_method,
  COUNT(DISTINCT pay.user_id) as unique_payers
FROM public.payments pay
GROUP BY pay.status, pay.payment_method;

-- Vue pour les performances des assureurs
CREATE OR REPLACE VIEW public.insurer_performance_view AS
SELECT
  i.id as insurer_id,
  i.name as insurer_name,
  i.rating,
  COUNT(DISTINCT io.id) as total_offers,
  COUNT(DISTINCT io.id) FILTER (WHERE io.is_active = true) as active_offers,
  COUNT(DISTINCT qo.id) as total_quote_offers,
  COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED') as approved_offers,
  COUNT(DISTINCT p.id) as total_policies,
  SUM(p.premium_amount) FILTER (WHERE p.status = 'ACTIVE') as active_premium_revenue,
  AVG(qo.price) FILTER (WHERE qo.status = 'APPROVED') as average_approved_price,
  ROUND(
    (COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED')::decimal /
     NULLIF(COUNT(DISTINCT qo.id), 0)) * 100,
    2
  ) as approval_rate_percent,
  COUNT(DISTINCT q.user_id) as unique_customers
FROM public.insurers i
LEFT JOIN public.insurance_offers io ON i.id = io.insurer_id
LEFT JOIN public.quote_offers qo ON i.id = qo.insurer_id
LEFT JOIN public.policies p ON i.id = p.insurer_id
LEFT JOIN public.quotes q ON qo.quote_id = q.id
GROUP BY i.id, i.name, i.rating;

-- Vue pour l'activité quotidienne de la plateforme
CREATE OR REPLACE VIEW public.daily_activity_view AS
SELECT
  DATE(created_at) as activity_date,
  COUNT(DISTINCT id) FILTER (WHERE table_name = 'profiles') as new_users,
  COUNT(DISTINCT id) FILTER (WHERE table_name = 'quotes') as new_quotes,
  COUNT(DISTINCT id) FILTER (WHERE table_name = 'policies') as new_policies,
  COUNT(DISTINCT id) FILTER (WHERE table_name = 'payments') as new_payments
FROM (
  SELECT id, created_at, 'profiles' as table_name FROM public.profiles
  UNION ALL
  SELECT id, created_at, 'quotes' as table_name FROM public.quotes
  UNION ALL
  SELECT id, created_at, 'policies' as table_name FROM public.policies
  UNION ALL
  SELECT id, created_at, 'payments' as table_name FROM public.payments
) daily_activity
GROUP BY DATE(created_at)
ORDER BY activity_date DESC;

-- Vue pour le funnel de conversion
CREATE OR REPLACE VIEW public.conversion_funnel_view AS
SELECT
  -- Total utilisateurs créés
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_created,

  -- Utilisateurs ayant créé au moins un devis
  (SELECT COUNT(DISTINCT user_id)
   FROM public.quotes
   WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as users_with_quotes,

  -- Devis créés
  (SELECT COUNT(*)
   FROM public.quotes
   WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as quotes_created,

  -- Offres faites aux utilisateurs
  (SELECT COUNT(*)
   FROM public.quote_offers
   WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as offers_made,

  -- Offres approuvées par les utilisateurs
  (SELECT COUNT(*)
   FROM public.quote_offers
   WHERE status = 'APPROVED'
   AND created_at >= CURRENT_DATE - INTERVAL '30 days') as offers_approved,

  -- Polices émises
  (SELECT COUNT(*)
   FROM public.policies
   WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as policies_issued;

-- Vue pour les tendances des catégories d'assurance
CREATE OR REPLACE VIEW public.category_trends_view AS
SELECT
  ic.id as category_id,
  ic.name as category_name,
  ic.icon,
  COUNT(DISTINCT q.id) as total_quotes,
  COUNT(DISTINCT q.id) FILTER (WHERE q.created_at >= CURRENT_DATE - INTERVAL '30 days') as quotes_this_month,
  COUNT(DISTINCT qo.id) as total_offers_received,
  COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED') as approved_offers,
  COUNT(DISTINCT p.id) as total_policies,
  AVG(q.estimated_price) FILTER (WHERE q.estimated_price IS NOT NULL) as average_quote_price,
  AVG(qo.price) FILTER (WHERE qo.status = 'APPROVED') as average_approved_price,
  ROUND(
    (COUNT(DISTINCT qo.id) FILTER (WHERE qo.status = 'APPROVED')::decimal /
     NULLIF(COUNT(DISTINCT q.id), 0)) * 100,
    2
  ) as conversion_rate_percent
FROM public.insurance_categories ic
LEFT JOIN public.quotes q ON ic.id = q.category_id
LEFT JOIN public.quote_offers qo ON q.id = qo.quote_id
LEFT JOIN public.policies p ON qo.id = p.quote_id
GROUP BY ic.id, ic.name, ic.icon
ORDER BY total_quotes DESC;

-- Commentaires pour documenter les vues
COMMENT ON VIEW public.user_stats_view IS 'Statistiques des utilisateurs par rôle et période';
COMMENT ON VIEW public.quote_stats_view IS 'Statistiques des devis par statut et catégorie';
COMMENT ON VIEW public.policy_stats_view IS 'Statistiques des polices d''assurance par statut et assureur';
COMMENT ON VIEW public.payment_stats_view IS 'Statistiques des paiements par statut et méthode';
COMMENT ON VIEW public.insurer_performance_view IS 'Tableau de performance des assureurs';
COMMENT ON VIEW public.daily_activity_view IS 'Activité quotidienne de la plateforme';
COMMENT ON VIEW public.conversion_funnel_view IS 'Funnel de conversion de la plateforme';
COMMENT ON VIEW public.category_trends_view IS 'Tendances par catégorie d''assurance';

-- Donner les permissions de lecture sur les vues
GRANT SELECT ON public.user_stats_view TO authenticated, anon;
GRANT SELECT ON public.quote_stats_view TO authenticated, anon;
GRANT SELECT ON public.policy_stats_view TO authenticated, anon;
GRANT SELECT ON public.payment_stats_view TO authenticated;
GRANT SELECT ON public.insurer_performance_view TO authenticated, anon;
GRANT SELECT ON public.daily_activity_view TO authenticated;
GRANT SELECT ON public.conversion_funnel_view TO authenticated;
GRANT SELECT ON public.category_trends_view TO authenticated, anon;