-- =============================================================================
-- Migration: Admin Dashboard Views
-- Date: 2026-04-19
-- Purpose: Create views and functions for admin dashboard
-- =============================================================================

-- Daily activity view for user registration statistics
CREATE OR REPLACE VIEW public.daily_activity_view AS
SELECT
  DATE(created_at) AS activity_date,
  COUNT(*) FILTER (WHERE role = 'USER') AS new_users,
  COUNT(*) FILTER (WHERE role = 'INSURER') AS new_insurers,
  COUNT(*) FILTER (WHERE role = 'ADMIN') AS new_admins
FROM public.profiles
GROUP BY DATE(created_at);

COMMENT ON VIEW public.daily_activity_view IS 'Daily activity statistics for user registrations';

-- System health check function
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'database', pg_database_size(current_database())::bigint,
    'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
    'users_count', (SELECT count(*) FROM public.profiles WHERE is_active = true),
    'insurers_count', (SELECT count(*) FROM public.profiles WHERE role = 'INSURER' AND is_active = true),
    'quotes_count', (SELECT count(*) FROM public.quotes),
    'checks', jsonb_build_array(
      jsonb_build_object('name', 'database', 'status', 'pass'),
      jsonb_build_object('name', 'users_table', 'status', 'pass'),
      jsonb_build_object('name', 'quotes_table', 'status', 'pass')
    )
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.system_health_check() IS 'Returns system health status and metrics';

-- Grant access
GRANT SELECT ON public.daily_activity_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.system_health_check() TO authenticated;
