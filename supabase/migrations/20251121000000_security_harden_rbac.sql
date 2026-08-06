-- =============================================================================
-- Security hardening: RBAC / privilege-escalation remediation
-- =============================================================================
--
-- Context (verified against the current schema before writing this migration):
--
--   * public.is_admin() derived the role from `auth.jwt() ->> 'role'`, which is
--     the *Postgres* role claim ("authenticated"), never the application role.
--     As a result every `*_admin_all` RLS policy silently never matched, and
--     the whole admin surface relied on SECURITY DEFINER RPCs that performed no
--     authorization check at all.
--
--   * The admin RPCs (admin_update_user, admin_create_user, admin_delete_user,
--     update_user_role, get_users, export_user_data, get_platform_statistics, …)
--     are SECURITY DEFINER and were GRANTed to `authenticated` with no caller
--     check → any logged-in user could self-promote to ADMIN, create/delete
--     users, or dump every profile.
--
--   * The `profiles_update_own` policy (FOR UPDATE USING auth.uid() = id) placed
--     no restriction on the `role` / `is_active` columns, so a user could simply
--     `update profiles set role = 'ADMIN' where id = <self>`.
--
--   * The analytics views were plain (definer-rights) views GRANTed to
--     `authenticated`, bypassing the RLS of their underlying tables.
--
-- Fix strategy (defense in depth):
--   1. Re-root trust: is_admin()/is_insurer() read the role from public.profiles
--      (server-side, non-recursive SECURITY DEFINER).
--   2. A single BEFORE INSERT/UPDATE/DELETE trigger on public.profiles blocks any
--      change to `role` / `is_active` (and hard deletes) unless the *real* caller
--      (auth.uid()) is an admin. Because auth.uid() is unaffected by SECURITY
--      DEFINER, this closes the escalation path even when it goes through the
--      unguarded admin RPCs. Backend/service_role calls (auth.uid() IS NULL) and
--      migrations are unaffected.
--   3. assert_admin() guards the read-only exfiltration RPCs.
--   4. Analytics views switched to security_invoker so RLS is enforced.
-- =============================================================================

-- 1. Trust root: derive the application role from the profiles table -----------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_insurer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'INSURER'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True when the current end user (auth.uid()) has the ADMIN application role, read from public.profiles. SECURITY DEFINER so it bypasses RLS without recursing.';

-- 2. Authorization helper for SECURITY DEFINER RPCs ----------------------------

CREATE OR REPLACE FUNCTION public.assert_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL => no end-user JWT (service_role / backend / migration).
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: administrator privileges required'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_admin() TO authenticated, service_role;

-- 3. Prevent privilege escalation on public.profiles at the row level ----------

CREATE OR REPLACE FUNCTION public.enforce_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trusted backend contexts (service_role, migrations) have no end-user JWT.
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Admins may do anything (including through the admin RPCs).
  IF public.is_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Non-admin end users below this point.
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Not authorized to delete profiles'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Self-registration as USER or INSURER is an existing product flow, but an
    -- end user may NEVER provision themselves as ADMIN. ADMIN accounts must be
    -- created by another admin (or the backend via service_role).
    IF NEW.role = 'ADMIN'::public.profile_role THEN
      RAISE EXCEPTION 'Self-provisioning an ADMIN account is not allowed'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Not authorized to change account role'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Not authorized to change account active status'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_privileges_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_privileges_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_privileges();

-- Also tighten the existing RLS policy so a non-admin cannot even attempt to
-- write to another user's profile row.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Guard the read-only exfiltration RPCs -------------------------------------
--    Bodies are reproduced verbatim from 20251116000000 / 20251104163000 with a
--    single assert_admin() gate added at the top.

CREATE OR REPLACE FUNCTION public.get_platform_statistics(
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    change_percentage NUMERIC,
    description TEXT
) AS $$
BEGIN
    PERFORM public.assert_admin();
    RETURN QUERY
    SELECT
        'total_users'::TEXT,
        COUNT(*)::NUMERIC,
        0::NUMERIC,
        'Total registered users'::TEXT
    FROM public.profiles
    WHERE role IN ('USER', 'INSURER', 'ADMIN')
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL

    UNION ALL

    SELECT
        'total_quotes'::TEXT,
        COUNT(*)::NUMERIC,
        0::NUMERIC,
        'Total insurance quotes created'::TEXT
    FROM public.quotes
    WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL

    UNION ALL

    SELECT
        'quote_completion_rate'::TEXT,
        CASE
            WHEN (SELECT COUNT(*) FROM public.quotes WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL) > 0
            THEN (
                (SELECT COUNT(*) FROM public.quotes WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL AND status = 'APPROVED') * 100.0 /
                (SELECT COUNT(*) FROM public.quotes WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL)
            )
            ELSE 0
        END,
        0::NUMERIC,
        'Quote completion percentage (APPROVED status)'::TEXT

    UNION ALL

    SELECT
        'total_insurers'::TEXT,
        COUNT(*)::NUMERIC,
        0::NUMERIC,
        'Total registered insurers'::TEXT
    FROM public.profiles
    WHERE role = 'INSURER'
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_activity_breakdown(
    p_days_back INTEGER DEFAULT 7
) RETURNS TABLE (
    date_trunc DATE,
    new_users BIGINT,
    active_users BIGINT,
    quotes_created BIGINT,
    quotes_approved BIGINT,
    login_attempts BIGINT,
    failed_logins BIGINT
) AS $$
BEGIN
    PERFORM public.assert_admin();
    RETURN QUERY
    WITH dates AS (
        SELECT generate_series(
            NOW() - (p_days_back || ' days')::INTERVAL,
            NOW(),
            '1 day'::INTERVAL
        )::DATE as date
    )
    SELECT
        d.date,
        COALESCE(COUNT(DISTINCT p.id) FILTER (WHERE DATE(p.created_at) = d.date), 0) as new_users,
        0 as active_users,
        COALESCE(COUNT(DISTINCT q.id) FILTER (WHERE DATE(q.created_at) = d.date), 0) as quotes_created,
        COALESCE(COUNT(DISTINCT q.id) FILTER (WHERE DATE(q.created_at) = d.date AND q.status = 'APPROVED'), 0) as quotes_approved,
        0 as login_attempts,
        0 as failed_logins
    FROM dates d
    LEFT JOIN public.profiles p ON DATE(p.created_at) = d.date AND p.role IN ('USER', 'INSURER', 'ADMIN')
    LEFT JOIN public.quotes q ON DATE(q.created_at) = d.date
    GROUP BY d.date
    ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.system_health_check() RETURNS TABLE (
    component TEXT,
    status TEXT,
    message TEXT,
    last_check TIMESTAMPTZ,
    metadata JSON
) AS $$
BEGIN
    PERFORM public.assert_admin();
    RETURN QUERY
    SELECT
        'database'::TEXT,
        'healthy'::TEXT,
        'Database connections normal'::TEXT,
        NOW(),
        '{"connections": 5, "max_connections": 100}'::json

    UNION ALL

    SELECT
        'sessions'::TEXT,
        'healthy'::TEXT,
        'Session management normal'::TEXT,
        NOW(),
        '{"active_sessions": 10}'::json

    UNION ALL

    SELECT
        'security'::TEXT,
        'healthy'::TEXT,
        'Security checks passed'::TEXT,
        NOW(),
        '{"failed_logins_1h": 0}'::json

    UNION ALL

    SELECT
        'storage'::TEXT,
        'healthy'::TEXT,
        'Storage status normal'::TEXT,
        NOW(),
        '{"usage_percent": 45}'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_users(
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 20,
    p_search TEXT DEFAULT NULL,
    p_role TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_direction TEXT DEFAULT 'DESC'
) RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    total_users BIGINT,
    filtered_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_total_users BIGINT;
    v_filtered_count BIGINT;
BEGIN
    PERFORM public.assert_admin();

    v_offset := (p_page - 1) * p_page_size;

    -- NB: columns are qualified with the `pr` alias below. The RETURNS TABLE OUT
    -- parameters (role, first_name, email, is_active, …) are in scope as PL/pgSQL
    -- variables, so unqualified references here are ambiguous and error at run
    -- time; aliasing resolves it. (Pre-existing latent bug, fixed here.)
    SELECT COUNT(*) INTO v_total_users
    FROM public.profiles pr
    WHERE pr.role IN ('USER', 'INSURER', 'ADMIN');

    SELECT COUNT(*) INTO v_filtered_count
    FROM public.profiles pr
    WHERE
        (p_search IS NULL OR p_search = '' OR LOWER(pr.first_name || ' ' || pr.last_name || ' ' || pr.email) LIKE LOWER('%' || p_search || '%'))
        AND (p_role IS NULL OR pr.role::text = p_role)
        AND (p_is_active IS NULL OR pr.is_active = p_is_active)
        AND pr.role IN ('USER', 'INSURER', 'ADMIN');

    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.role::text,
        p.is_active,
        p.created_at,
        p.updated_at,
        NULL::TIMESTAMPTZ as last_login,
        v_total_users,
        v_filtered_count
    FROM public.profiles p
    WHERE
        (p_search IS NULL OR p_search = '' OR LOWER(p.first_name || ' ' || p.last_name || ' ' || p.email) LIKE LOWER('%' || p_search || '%'))
        AND (p_role IS NULL OR p.role::text = p_role)
        AND (p_is_active IS NULL OR p.is_active = p_is_active)
        AND p.role IN ('USER', 'INSURER', 'ADMIN')
    ORDER BY
        CASE
            WHEN p_sort_by = 'email' THEN p.email
            WHEN p_sort_by = 'first_name' THEN p.first_name
            WHEN p_sort_by = 'last_name' THEN p.last_name
            WHEN p_sort_by = 'role' THEN p.role::text
            WHEN p_sort_by = 'is_active' THEN p.is_active::TEXT
            ELSE p.created_at::text
        END ASC
    LIMIT p_page_size OFFSET v_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.export_user_data(
    p_user_id UUID DEFAULT NULL,
    p_format TEXT DEFAULT 'json'
) RETURNS TEXT AS $$
DECLARE
    v_export_data JSONB;
    v_user_email TEXT;
BEGIN
    PERFORM public.assert_admin();

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'email', p.email,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'role', p.role,
            'is_active', p.is_active,
            'created_at', p.created_at,
            'updated_at', p.updated_at,
            'quotes', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', q.id,
                        'created_at', q.created_at,
                        'status', q.status,
                        'total_premium', q.total_premium
                    )
                ) FROM public.quotes q WHERE q.user_id = p.id
            )
        )
    ) INTO v_export_data
    FROM public.profiles p
    WHERE (p_user_id IS NULL OR p.id = p_user_id)
    AND p.role != 'ANONYMOUS';

    SELECT email INTO v_user_email
    FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid());

    PERFORM log_admin_action(
        'USER_DATA_EXPORT',
        'user',
        p_user_id,
        NULL,
        json_build_object(
            'format', p_format,
            'user_id', p_user_id,
            'data_size', length(v_export_data::TEXT)
        ),
        true,
        NULL,
        'warning',
        json_build_object(
            'export_type', 'user_data',
            'target_email', v_user_email
        )
    );

    RETURN v_export_data::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Analytics views must enforce the caller's RLS, not the definer's ----------

ALTER VIEW IF EXISTS public.user_stats_view         SET (security_invoker = on);
ALTER VIEW IF EXISTS public.quote_stats_view        SET (security_invoker = on);
ALTER VIEW IF EXISTS public.policy_stats_view       SET (security_invoker = on);
ALTER VIEW IF EXISTS public.payment_stats_view      SET (security_invoker = on);
ALTER VIEW IF EXISTS public.insurer_performance_view SET (security_invoker = on);
ALTER VIEW IF EXISTS public.daily_activity_view     SET (security_invoker = on);
ALTER VIEW IF EXISTS public.conversion_funnel_view  SET (security_invoker = on);
ALTER VIEW IF EXISTS public.category_trends_view    SET (security_invoker = on);
