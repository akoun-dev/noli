-- Fix for Supabase RPC Functions
-- Date: 2025-01-16
-- Purpose: Fix enum issues and type mismatches in admin RPC functions

-- Fix 1: Update all references to 'ANONYMOUS' role to use actual role values
-- Instead of filtering out 'ANONYMOUS', we'll check for actual valid roles

-- Drop and recreate get_platform_statistics function
DROP FUNCTION IF EXISTS get_platform_statistics(p_days_back INTEGER);

CREATE OR REPLACE FUNCTION get_platform_statistics(
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    change_percentage NUMERIC,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Total users (exclude NULL roles instead of 'ANONYMOUS')
    SELECT
        'total_users'::TEXT,
        COUNT(*)::NUMERIC,
        (
            (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at))) * 100.0 /
            NULLIF(LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)), 0)
        ),
        'Total registered users'::TEXT
    FROM public.profiles
    WHERE role IN ('USER', 'INSURER', 'ADMIN')
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL

    UNION ALL

    -- Active users
    SELECT
        'active_users'::TEXT,
        COUNT(*)::NUMERIC,
        0, -- Would need historical comparison
        'Users with active sessions'::TEXT
    FROM public.profiles p
    WHERE p.role IN ('USER', 'INSURER', 'ADMIN')
    AND EXISTS (
        SELECT 1 FROM public.user_sessions s
        WHERE s.user_id = p.id AND s.is_active = true
    )

    UNION ALL

    -- Total quotes
    SELECT
        'total_quotes'::TEXT,
        COUNT(*)::NUMERIC,
        (
            (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', created_at))) * 100.0 /
            NULLIF(LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', created_at)), 0)
        ),
        'Total insurance quotes created'::TEXT
    FROM public.quotes
    WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL

    UNION ALL

    -- Quote completion rate
    SELECT
        'quote_completion_rate'::TEXT,
        (
            (SELECT COUNT(*) FROM public.quotes WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL AND status = 'APPROVED') * 100.0 /
            NULLIF((SELECT COUNT(*) FROM public.quotes WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL), 0)
        ),
        0,
        'Quote completion percentage (APPROVED status)'::TEXT

    UNION ALL

    -- Failed login attempts
    SELECT
        'failed_logins'::TEXT,
        COUNT(*)::NUMERIC,
        0,
        'Failed login attempts'::TEXT
    FROM public.audit_logs
    WHERE action LIKE '%LOGIN%'
    AND NOT success
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Drop and recreate get_user_activity_breakdown function
DROP FUNCTION IF EXISTS get_user_activity_breakdown(p_days_back INTEGER);

CREATE OR REPLACE FUNCTION get_user_activity_breakdown(
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
        COALESCE(COUNT(DISTINCT s.user_id) FILTER (WHERE DATE(s.created_at) = d.date), 0) as active_users,
        COALESCE(COUNT(DISTINCT q.id) FILTER (WHERE DATE(q.created_at) = d.date), 0) as quotes_created,
        COALESCE(COUNT(DISTINCT q.id) FILTER (WHERE DATE(q.created_at) = d.date AND q.status = 'APPROVED'), 0) as quotes_approved,
        COALESCE(COUNT(DISTINCT al.user_id) FILTER (WHERE DATE(al.created_at) = d.date AND al.action LIKE '%LOGIN%'), 0) as login_attempts,
        COALESCE(COUNT(DISTINCT al.user_id) FILTER (WHERE DATE(al.created_at) = d.date AND al.action LIKE '%LOGIN%' AND NOT al.success), 0) as failed_logins
    FROM dates d
    LEFT JOIN public.profiles p ON DATE(p.created_at) = d.date AND p.role IN ('USER', 'INSURER', 'ADMIN')
    LEFT JOIN public.user_sessions s ON DATE(s.created_at) = d.date AND s.is_active = true
    LEFT JOIN public.quotes q ON DATE(q.created_at) = d.date
    LEFT JOIN public.audit_logs al ON DATE(al.created_at) = d.date AND al.action LIKE '%LOGIN%'
    GROUP BY d.date
    ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: Drop and recreate system_health_check function with correct JSONB type
DROP FUNCTION IF EXISTS system_health_check();

CREATE OR REPLACE FUNCTION system_health_check() RETURNS TABLE (
    component TEXT,
    status TEXT,
    message TEXT,
    last_check TIMESTAMPTZ,
    metadata JSON
) AS $$  -- Changed from JSONB to JSON to match the expected return type
DECLARE
    v_total_connections INTEGER;
    v_active_sessions INTEGER;
    v_disk_usage NUMERIC;
    v_failed_logins_recent INTEGER;
BEGIN
    -- Database connections
    SELECT count(*) INTO v_total_connections
    FROM pg_stat_activity;

    -- Active sessions
    SELECT COUNT(*) INTO v_active_sessions
    FROM public.user_sessions
    WHERE is_active = true AND expires_at > NOW();

    -- Recent failed logins (last hour)
    SELECT COUNT(*) INTO v_failed_logins_recent
    FROM public.audit_logs
    WHERE action LIKE '%LOGIN%'
    AND NOT success
    AND created_at > NOW() - INTERVAL '1 hour';

    RETURN QUERY
    -- Database component
    SELECT
        'database'::TEXT,
        CASE
            WHEN v_total_connections < 100 THEN 'healthy'
            WHEN v_total_connections < 200 THEN 'warning'
            ELSE 'critical'
        END::TEXT,
        'Connections: ' || v_total_connections::TEXT,
        NOW(),
        json_build_object('connections', v_total_connections, 'max_connections', 100)::json  -- Explicit cast to JSON

    UNION ALL

    -- Sessions component
    SELECT
        'sessions'::TEXT,
        CASE
            WHEN v_active_sessions < 50 THEN 'healthy'
            WHEN v_active_sessions < 100 THEN 'warning'
            ELSE 'critical'
        END::TEXT,
        'Active sessions: ' || v_active_sessions::TEXT,
        NOW(),
        json_build_object('active_sessions', v_active_sessions)::json  -- Explicit cast to JSON

    UNION ALL

    -- Security component
    SELECT
        'security'::TEXT,
        CASE
            WHEN v_failed_logins_recent < 10 THEN 'healthy'
            WHEN v_failed_logins_recent < 50 THEN 'warning'
            ELSE 'critical'
        END::TEXT,
        'Failed logins (1h): ' || v_failed_logins_recent::TEXT,
        NOW(),
        json_build_object('failed_logins_1h', v_failed_logins_recent)::json  -- Explicit cast to JSON

    UNION ALL

    -- Storage component (placeholder)
    SELECT
        'storage'::TEXT,
        'healthy'::TEXT,
        'Storage status normal',
        NOW(),
        json_build_object('status', 'operational')::json;  -- Explicit cast to JSON

    -- Log system health check
    PERFORM log_admin_action(
        'SYSTEM_HEALTH_CHECK',
        'system',
        NULL,
        NULL,
        json_build_object(
            'database_connections', v_total_connections,
            'active_sessions', v_active_sessions,
            'failed_logins_recent', v_failed_logins_recent
        ),
        true,
        NULL,
        'info',
        json_build_object('automated_check', true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 4: Update get_users function to remove 'ANONYMOUS' references
DROP FUNCTION IF EXISTS get_users(
    p_page INTEGER,
    p_page_size INTEGER,
    p_search TEXT,
    p_role TEXT,
    p_is_active BOOLEAN,
    p_sort_by TEXT,
    p_sort_direction TEXT
);

CREATE OR REPLACE FUNCTION get_users(
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
    v_admin_id UUID := auth.uid();
BEGIN
    -- Log admin access
    PERFORM log_admin_action(
        'ADMIN_ACCESS_USERS_LIST',
        'user',
        NULL,
        NULL,
        json_build_object(
            'page', p_page,
            'page_size', p_page_size,
            'search', p_search,
            'role', p_role,
            'is_active', p_is_active
        ),
        true,
        NULL,
        'info',
        json_build_object('pagination', true)
    );

    -- Calculate offset
    v_offset := (p_page - 1) * p_page_size;

    -- Get total count
    SELECT COUNT(*) INTO v_total_users FROM public.profiles WHERE role IN ('USER', 'INSURER', 'ADMIN');

    -- Build filtered query
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.role,
        p.is_active,
        p.created_at,
        p.updated_at,
        s.last_accessed_at as last_login,
        v_total_users,
        (
            SELECT COUNT(*)
            FROM public.profiles p2
            WHERE
                (p_search IS NULL OR
                 p_search = '' OR
                 LOWER(p2.first_name || ' ' || p2.last_name || ' ' || p2.email) LIKE LOWER('%' || p_search || '%'))
                AND (p_role IS NULL OR p2.role = p_role)
                AND (p_is_active IS NULL OR p2.is_active = p_is_active)
                AND p2.role IN ('USER', 'INSURER', 'ADMIN')
        ) as filtered_count
    FROM public.profiles p
    LEFT JOIN public.user_sessions s ON s.user_id = p.id AND s.is_active = true
    WHERE
        (p_search IS NULL OR
         p_search = '' OR
         LOWER(p.first_name || ' ' || p.last_name || ' ' || p.email) LIKE LOWER('%' || p_search || '%'))
        AND (p_role IS NULL OR p.role = p_role)
        AND (p_is_active IS NULL OR p.is_active = p_is_active)
        AND p.role IN ('USER', 'INSURER', 'ADMIN')
    ORDER BY
        CASE
            WHEN p_sort_by = 'email' THEN p.email
            WHEN p_sort_by = 'first_name' THEN p.first_name
            WHEN p_sort_by = 'last_name' THEN p.last_name
            WHEN p_sort_by = 'role' THEN p.role
            WHEN p_sort_by = 'is_active' THEN p.is_active::TEXT
            ELSE p.created_at
        END ASC
    LIMIT p_page_size OFFSET v_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 5: Update export_user_data function
DROP FUNCTION IF EXISTS export_user_data(p_user_id UUID, p_format TEXT);

CREATE OR REPLACE FUNCTION export_user_data(
    p_user_id UUID DEFAULT NULL,
    p_format TEXT DEFAULT 'json'
) RETURNS TEXT AS $$
DECLARE
    v_export_data JSONB;
    v_user_email TEXT;
    v_admin_id UUID := auth.uid();
BEGIN
    -- Get user data
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
    AND p.role IN ('USER', 'INSURER', 'ADMIN');

    -- Get user email for logging
    SELECT email INTO v_user_email
    FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid());

    -- Log export action
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute permissions for all fixed functions
GRANT EXECUTE ON FUNCTION get_platform_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION system_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION get_users TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data TO authenticated;

-- Update comments
COMMENT ON FUNCTION get_platform_statistics IS 'Fixed version - Returns comprehensive platform statistics for admin dashboard';
COMMENT ON FUNCTION get_user_activity_breakdown IS 'Fixed version - Provides daily user activity breakdown for analytics';
COMMENT ON FUNCTION system_health_check IS 'Fixed version - Performs system health check with correct JSON return type';
COMMENT ON FUNCTION get_users IS 'Fixed version - Retrieves paginated list of users with proper role filtering';
COMMENT ON FUNCTION export_user_data IS 'Fixed version - Exports user data in specified format with proper role filtering';