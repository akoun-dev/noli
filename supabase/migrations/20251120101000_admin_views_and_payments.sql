-- =============================================================================
-- Migration: Admin analytics views, payments table and RPC helpers
-- Date: 2025-11-20
-- Purpose:
--   * Provide the aggregated views consumed by Admin dashboards
--   * Add the missing payments table used by policy and analytics flows
--   * Restore admin_create/update/delete_user RPC helpers with audit logging
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Payments table required by policy & analytics features
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_date timestamptz NOT NULL DEFAULT NOW(),
  payment_method text NOT NULL CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'DIRECT_DEBIT', 'CHECK')),
  status text NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_payments ON public.payments;
CREATE TRIGGER trg_set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS payments_policy_idx ON public.payments (policy_id);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status, payment_method);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_user_select ON public.payments;
CREATE POLICY payments_user_select
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payments_user_insert ON public.payments;
CREATE POLICY payments_user_insert
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payments_user_update ON public.payments;
CREATE POLICY payments_user_update
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS payments_admin_all ON public.payments;
CREATE POLICY payments_admin_all
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Aggregated admin analytics views
-- ---------------------------------------------------------------------------

-- User statistics per role
DROP VIEW IF EXISTS public.user_stats_view;
CREATE OR REPLACE VIEW public.user_stats_view AS
WITH base AS (
  SELECT
    role,
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE is_active) AS active_users,
    COUNT(*) FILTER (WHERE NOT is_active) AS inactive_users,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_this_week,
    COUNT(DISTINCT id) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM public.user_sessions s
        WHERE s.user_id = profiles.id
          AND s.last_accessed_at >= date_trunc('month', NOW())
          AND s.is_active = TRUE
      )
    ) AS active_this_month,
    COUNT(*) FILTER (
      WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
        AND created_at < date_trunc('month', NOW())
    ) AS new_prev_month
  FROM public.profiles
  WHERE role IN ('USER', 'INSURER', 'ADMIN')
  GROUP BY role
)
SELECT
  role,
  total_users,
  active_users,
  inactive_users,
  new_this_month,
  new_this_week,
  active_this_month,
  CASE
    WHEN new_prev_month > 0
      THEN ROUND(((new_this_month - new_prev_month)::numeric / new_prev_month) * 100, 2)
    ELSE 0
  END AS growth_rate_percent
FROM base;

GRANT SELECT ON public.user_stats_view TO authenticated;

-- Quote statistics by status/category
DROP VIEW IF EXISTS public.quote_stats_view;
CREATE OR REPLACE VIEW public.quote_stats_view AS
SELECT
  COALESCE(q.status::text, 'UNKNOWN') AS status,
  COUNT(*) AS total_quotes,
  COUNT(*) FILTER (WHERE q.created_at >= date_trunc('month', NOW())) AS quotes_this_month,
  COUNT(*) FILTER (WHERE q.created_at >= NOW() - INTERVAL '7 days') AS quotes_this_week,
  COUNT(*) FILTER (WHERE q.valid_until > NOW()) AS valid_quotes,
  AVG(q.estimated_price)::numeric AS average_price,
  SUM(q.estimated_price)::numeric AS total_value,
  c.name AS category_name,
  COUNT(DISTINCT q.user_id) AS unique_users
FROM public.quotes q
LEFT JOIN public.insurance_categories c ON c.id = q.category_id
GROUP BY q.status, c.name;

GRANT SELECT ON public.quote_stats_view TO authenticated;

-- Policy statistics (overrides previous lightweight version)
DROP VIEW IF EXISTS public.policy_stats_view;
CREATE OR REPLACE VIEW public.policy_stats_view AS
SELECT
  COALESCE(p.status::text, 'UNKNOWN') AS status,
  COUNT(*) AS total_policies,
  COUNT(*) FILTER (WHERE p.status = 'ACTIVE') AS active_policies,
  COUNT(*) FILTER (WHERE p.status = 'EXPIRED') AS expired_policies,
  COUNT(*) FILTER (WHERE p.created_at >= date_trunc('month', NOW())) AS policies_this_month,
  SUM(p.premium_amount)::numeric AS total_premium_amount,
  AVG(p.premium_amount)::numeric AS average_premium,
  p.payment_frequency,
  i.name AS insurer_name,
  COUNT(DISTINCT p.user_id) AS unique_customers
FROM public.policies p
LEFT JOIN public.insurers i ON i.id = p.insurer_id
GROUP BY p.status, p.payment_frequency, i.name;

GRANT SELECT ON public.policy_stats_view TO authenticated;

-- Payment statistics
DROP VIEW IF EXISTS public.payment_stats_view;
CREATE OR REPLACE VIEW public.payment_stats_view AS
SELECT
  COALESCE(pay.status, 'UNKNOWN') AS status,
  COUNT(*) AS total_payments,
  SUM(pay.amount)::numeric AS total_amount,
  AVG(pay.amount)::numeric AS average_amount,
  COUNT(*) FILTER (WHERE pay.payment_date >= date_trunc('month', NOW())) AS payments_this_month,
  COUNT(*) FILTER (WHERE pay.payment_date >= NOW() - INTERVAL '7 days') AS payments_this_week,
  pay.payment_method,
  COUNT(DISTINCT pay.user_id) AS unique_payers
FROM public.payments pay
GROUP BY pay.status, pay.payment_method;

GRANT SELECT ON public.payment_stats_view TO authenticated;

-- Insurer performance view
DROP VIEW IF EXISTS public.insurer_performance_view;
CREATE OR REPLACE VIEW public.insurer_performance_view AS
SELECT
  i.id AS insurer_id,
  i.name AS insurer_name,
  i.rating,
  COUNT(DISTINCT io.id) AS total_offers,
  COUNT(DISTINCT io.id) FILTER (WHERE io.is_active) AS active_offers,
  COUNT(qo.id) AS total_quote_offers,
  COUNT(qo.id) FILTER (WHERE qo.status = 'APPROVED') AS approved_offers,
  COUNT(DISTINCT p.id) AS total_policies,
  SUM(p.premium_amount) FILTER (WHERE p.status = 'ACTIVE')::numeric AS active_premium_revenue,
  AVG(qo.price) FILTER (WHERE qo.status = 'APPROVED')::numeric AS average_approved_price,
  CASE
    WHEN COUNT(qo.id) > 0
      THEN ROUND((COUNT(qo.id) FILTER (WHERE qo.status = 'APPROVED')::numeric / COUNT(qo.id)) * 100, 2)
    ELSE NULL
  END AS approval_rate_percent,
  COUNT(DISTINCT p.user_id) AS unique_customers
FROM public.insurers i
LEFT JOIN public.insurance_offers io ON io.insurer_id = i.id
LEFT JOIN public.quote_offers qo ON qo.insurer_id = i.id
LEFT JOIN public.policies p ON p.insurer_id = i.id
GROUP BY i.id, i.name, i.rating;

GRANT SELECT ON public.insurer_performance_view TO authenticated;

-- Daily activity (rolling 30 days)
DROP VIEW IF EXISTS public.daily_activity_view;
CREATE OR REPLACE VIEW public.daily_activity_view AS
WITH days AS (
  SELECT generate_series(
    date_trunc('day', NOW()) - INTERVAL '29 days',
    date_trunc('day', NOW()),
    INTERVAL '1 day'
  )::date AS activity_date
)
SELECT
  d.activity_date::text AS activity_date,
  COUNT(p.id) FILTER (WHERE DATE(p.created_at) = d.activity_date) AS new_users,
  COUNT(q.id) FILTER (WHERE DATE(q.created_at) = d.activity_date) AS new_quotes,
  COUNT(pol.id) FILTER (WHERE DATE(pol.created_at) = d.activity_date) AS new_policies,
  COUNT(pay.id) FILTER (WHERE DATE(pay.payment_date) = d.activity_date) AS new_payments
FROM days d
LEFT JOIN public.profiles p ON DATE(p.created_at) = d.activity_date
LEFT JOIN public.quotes q ON DATE(q.created_at) = d.activity_date
LEFT JOIN public.policies pol ON DATE(pol.created_at) = d.activity_date
LEFT JOIN public.payments pay ON DATE(pay.payment_date) = d.activity_date
GROUP BY d.activity_date
ORDER BY d.activity_date;

GRANT SELECT ON public.daily_activity_view TO authenticated;

-- Conversion funnel (single row view)
DROP VIEW IF EXISTS public.conversion_funnel_view;
CREATE OR REPLACE VIEW public.conversion_funnel_view AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'USER') AS users_created,
  (SELECT COUNT(*) FROM public.quotes WHERE user_id IS NOT NULL) AS users_with_quotes,
  (SELECT COUNT(*) FROM public.quotes) AS quotes_created,
  (SELECT COUNT(*) FROM public.quote_offers) AS offers_made,
  (SELECT COUNT(*) FROM public.quote_offers WHERE status = 'APPROVED') AS offers_approved,
  (SELECT COUNT(*) FROM public.policies) AS policies_issued;

GRANT SELECT ON public.conversion_funnel_view TO authenticated;

-- Category trends view
DROP VIEW IF EXISTS public.category_trends_view;
CREATE OR REPLACE VIEW public.category_trends_view AS
SELECT
  c.id AS category_id,
  c.name AS category_name,
  c.icon,
  COUNT(q.id) AS total_quotes,
  COUNT(q.id) FILTER (WHERE q.created_at >= date_trunc('month', NOW())) AS quotes_this_month,
  COUNT(qo.id) AS total_offers_received,
  COUNT(qo.id) FILTER (WHERE qo.status = 'APPROVED') AS approved_offers,
  COUNT(pol.id) AS total_policies,
  AVG(q.estimated_price)::numeric AS average_quote_price,
  AVG(qo.price) FILTER (WHERE qo.status = 'APPROVED')::numeric AS average_approved_price,
  CASE
    WHEN COUNT(qo.id) > 0
      THEN ROUND((COUNT(qo.id) FILTER (WHERE qo.status = 'APPROVED')::numeric / COUNT(qo.id)) * 100, 2)
    ELSE NULL
  END AS conversion_rate_percent
FROM public.insurance_categories c
LEFT JOIN public.quotes q ON q.category_id = c.id
LEFT JOIN public.quote_offers qo ON qo.quote_id = q.id
LEFT JOIN public.policies pol ON pol.quote_id = q.id
GROUP BY c.id, c.name, c.icon;

GRANT SELECT ON public.category_trends_view TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Admin RPC helpers for CRUD on profiles
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_create_user(
  email_param text,
  first_name_param text,
  last_name_param text,
  company_name_param text,
  phone_param text,
  role_param text,
  is_active_param boolean
);

CREATE OR REPLACE FUNCTION public.admin_create_user(
  email_param text,
  first_name_param text DEFAULT NULL,
  last_name_param text DEFAULT NULL,
  company_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  role_param text DEFAULT 'USER',
  is_active_param boolean DEFAULT true
) RETURNS TABLE (
  success boolean,
  user_id uuid,
  message text
) AS $$
DECLARE
  v_user_id uuid;
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    company_name,
    phone,
    role,
    is_active
  ) VALUES (
    gen_random_uuid(),
    email_param,
    first_name_param,
    last_name_param,
    company_name_param,
    phone_param,
    role_param::public.profile_role,
    COALESCE(is_active_param, true)
  )
  RETURNING id INTO v_user_id;

  PERFORM admin_user_operation(
    'create',
    v_user_id,
    jsonb_build_object(
      'email', email_param,
      'role', role_param,
      'is_active', is_active_param
    ),
    'Manual admin creation'
  );

  RETURN QUERY SELECT true, v_user_id, 'User created successfully';
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT false, NULL, 'Email already exists';
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL, COALESCE(SQLERRM, 'Unexpected error');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.admin_update_user(
  user_id_param uuid,
  first_name_param text,
  last_name_param text,
  company_name_param text,
  phone_param text,
  role_param text,
  is_active_param boolean
);

CREATE OR REPLACE FUNCTION public.admin_update_user(
  user_id_param uuid,
  first_name_param text DEFAULT NULL,
  last_name_param text DEFAULT NULL,
  company_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  role_param text DEFAULT NULL,
  is_active_param boolean DEFAULT NULL
) RETURNS TABLE (
  success boolean,
  user_id uuid,
  message text
) AS $$
DECLARE
  v_before jsonb;
  v_after jsonb;
BEGIN
  SELECT row_to_json(p.*)::jsonb INTO v_before
  FROM public.profiles p
  WHERE p.id = user_id_param;

  IF v_before IS NULL THEN
    RETURN QUERY SELECT false, NULL, 'User not found';
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    first_name = COALESCE(first_name_param, first_name),
    last_name = COALESCE(last_name_param, last_name),
    company_name = COALESCE(company_name_param, company_name),
    phone = COALESCE(phone_param, phone),
    role = COALESCE(role_param, role)::public.profile_role,
    is_active = COALESCE(is_active_param, is_active),
    updated_at = NOW()
  WHERE id = user_id_param;

  SELECT row_to_json(p.*)::jsonb INTO v_after
  FROM public.profiles p
  WHERE p.id = user_id_param;

  PERFORM admin_user_operation(
    'update',
    user_id_param,
    jsonb_build_object('before', v_before, 'after', v_after),
    'Admin update'
  );

  RETURN QUERY SELECT true, user_id_param, 'User updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, user_id_param, COALESCE(SQLERRM, 'Unexpected error');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.admin_delete_user(
  user_id_param uuid,
  hard_delete boolean
);

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  user_id_param uuid,
  hard_delete boolean DEFAULT false
) RETURNS TABLE (
  success boolean,
  user_id uuid,
  message text
) AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id_param) INTO v_exists;

  IF NOT v_exists THEN
    RETURN QUERY SELECT false, NULL, 'User not found';
    RETURN;
  END IF;

  IF hard_delete THEN
    DELETE FROM public.profiles WHERE id = user_id_param;
    PERFORM admin_user_operation('delete', user_id_param, NULL, 'Hard delete');
    RETURN QUERY SELECT true, user_id_param, 'User deleted';
  ELSE
    UPDATE public.profiles
    SET is_active = false,
        updated_at = NOW()
    WHERE id = user_id_param;
    PERFORM admin_user_operation('suspend', user_id_param, jsonb_build_object('is_active', false), 'Soft delete');
    RETURN QUERY SELECT true, user_id_param, 'User suspended';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, user_id_param, COALESCE(SQLERRM, 'Unexpected error');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_create_user(
  email_param text,
  first_name_param text,
  last_name_param text,
  company_name_param text,
  phone_param text,
  role_param text,
  is_active_param boolean
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_update_user(
  user_id_param uuid,
  first_name_param text,
  last_name_param text,
  company_name_param text,
  phone_param text,
  role_param text,
  is_active_param boolean
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(
  user_id_param uuid,
  hard_delete boolean
) TO authenticated;
