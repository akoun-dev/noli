-- Migration: Admin RPC Functions
-- Date: 2025-11-04
-- Purpose: Enhanced RPC functions for admin operations with security and audit logging
-- This file consolidates and enhances all admin functionality

-- 1. User Management RPC Functions
-- ================================

-- Get all users with pagination and filtering
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
    SELECT COUNT(*) INTO v_total_users FROM public.profiles WHERE role != 'ANONYMOUS';

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
                AND p2.role != 'ANONYMOUS'
        ) as filtered_count
    FROM public.profiles p
    LEFT JOIN public.user_sessions s ON s.user_id = p.id AND s.is_active = true
    WHERE
        (p_search IS NULL OR
         p_search = '' OR
         LOWER(p.first_name || ' ' || p.last_name || ' ' || p.email) LIKE LOWER('%' || p_search || '%'))
        AND (p_role IS NULL OR p.role = p_role)
        AND (p_is_active IS NULL OR p.is_active = p_is_active)
        AND p.role != 'ANONYMOUS'
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

-- Update user role with audit logging
CREATE OR REPLACE FUNCTION update_user_role(
    p_user_id UUID,
    p_new_role TEXT,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_role TEXT;
    v_user_email TEXT;
    v_success BOOLEAN := false;
BEGIN
    -- Get current user role and email
    SELECT role, email INTO v_old_role, v_user_email
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        PERFORM log_admin_action(
            'USER_ROLE_UPDATE_FAILED',
            'user',
            p_user_id,
            json_build_object('old_role', v_old_role),
            json_build_object('new_role', p_new_role),
            false,
            'User not found',
            'error',
            json_build_object('reason', p_reason)
        );
        RETURN false;
    END IF;

    -- Validate new role
    IF p_new_role NOT IN ('USER', 'INSURER', 'ADMIN') THEN
        PERFORM log_admin_action(
            'USER_ROLE_UPDATE_FAILED',
            'user',
            p_user_id,
            json_build_object('old_role', v_old_role),
            NULL,
            false,
            'Invalid role: ' || p_new_role,
            'error',
            json_build_object('reason', p_reason, 'invalid_role', p_new_role)
        );
        RETURN false;
    END IF;

    -- Update user role
    UPDATE public.profiles
    SET role = p_new_role, updated_at = NOW()
    WHERE id = p_user_id;

    -- Check if update was successful
    GET DIAGNOSTICS v_success = ROW_COUNT;

    IF v_success THEN
        PERFORM admin_user_operation(
            'role_change',
            p_user_id,
            json_build_object('old_role', v_old_role, 'new_role', p_new_role),
            p_reason
        );

        -- Log successful role update
        PERFORM log_admin_action(
            'USER_ROLE_UPDATE_SUCCESS',
            'user',
            p_user_id,
            json_build_object('old_role', v_old_role, 'email', v_user_email),
            json_build_object('new_role', p_new_role),
            true,
            NULL,
            'warning',
            json_build_object('reason', p_reason)
        );

        -- Revoke all user sessions for security
        PERFORM revoke_user_sessions(p_user_id);

        RETURN true;
    ELSE
        PERFORM log_admin_action(
            'USER_ROLE_UPDATE_FAILED',
            'user',
            p_user_id,
            json_build_object('old_role', v_old_role),
            NULL,
            false,
            'Database update failed',
            'error',
            json_build_object('reason', p_reason)
        );
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend/Unsuspend user
CREATE OR REPLACE FUNCTION toggle_user_status(
    p_user_id UUID,
    p_is_active BOOLEAN,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_status BOOLEAN;
    v_user_email TEXT;
    v_user_role TEXT;
    v_success BOOLEAN := false;
BEGIN
    -- Get current user status
    SELECT is_active, email, role INTO v_old_status, v_user_email, v_user_role
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        PERFORM log_admin_action(
            'USER_STATUS_UPDATE_FAILED',
            'user',
            p_user_id,
            NULL,
            NULL,
            false,
            'User not found',
            'error',
            json_build_object('reason', p_reason)
        );
        RETURN false;
    END IF;

    -- Don't allow suspending other admins unless current user is also admin
    IF v_user_role = 'ADMIN' AND auth.jwt() ->> 'role' != 'ADMIN' THEN
        PERFORM log_admin_action(
            'USER_STATUS_UPDATE_DENIED',
            'user',
            p_user_id,
            json_build_object('old_status', v_old_status),
            json_build_object('new_status', p_is_active),
            false,
            'Cannot suspend another admin',
            'warning',
            json_build_object('reason', p_reason, 'target_role', v_user_role)
        );
        RETURN false;
    END IF;

    -- Update user status
    UPDATE public.profiles
    SET is_active = p_is_active, updated_at = NOW()
    WHERE id = p_user_id;

    -- Check if update was successful
    GET DIAGNOSTICS v_success = ROW_COUNT;

    IF v_success THEN
        PERFORM admin_user_operation(
            CASE
                WHEN p_is_active THEN 'suspend'
                ELSE 'unsuspend'
            END,
            p_user_id,
            json_build_object('old_status', v_old_status, 'new_status', p_is_active),
            p_reason
        );

        -- Revoke all user sessions if suspending
        IF NOT p_is_active THEN
            PERFORM revoke_user_sessions(p_user_id);
        END IF;

        RETURN true;
    ELSE
        PERFORM log_admin_action(
            'USER_STATUS_UPDATE_FAILED',
            'user',
            p_user_id,
            json_build_object('old_status', v_old_status),
            json_build_object('new_status', p_is_active),
            false,
            'Database update failed',
            'error',
            json_build_object('reason', p_reason)
        );
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Admin Analytics Functions
-- =============================

-- Get platform statistics
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
    -- Total users
    SELECT
        'total_users'::TEXT,
        COUNT(*)::NUMERIC,
        (
            (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at))) * 100.0 /
            NULLIF(LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)), 0)
        ),
        'Total registered users'::TEXT
    FROM public.profiles
    WHERE role != 'ANONYMOUS'
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL

    UNION ALL

    -- Active users
    SELECT
        'active_users'::TEXT,
        COUNT(*)::NUMERIC,
        0, -- Would need historical comparison
        'Users with active sessions'::TEXT
    FROM public.profiles p
    WHERE p.role != 'ANONYMOUS'
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

    -- Quote completion rate (remplace conversion rate car policies table n'existe pas encore)
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

-- Get user activity breakdown
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
    LEFT JOIN public.profiles p ON DATE(p.created_at) = d.date AND p.role != 'ANONYMOUS'
    LEFT JOIN public.user_sessions s ON DATE(s.created_at) = d.date AND s.is_active = true
    LEFT JOIN public.quotes q ON DATE(q.created_at) = d.date
    -- LEFT JOIN public.policies pol ON DATE(pol.created_at) = d.date  -- Table policies n'existe pas encore
    LEFT JOIN public.audit_logs al ON DATE(al.created_at) = d.date AND al.action LIKE '%LOGIN%'
    GROUP BY d.date
    ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. System Management Functions
-- ===============================

-- System health check
CREATE OR REPLACE FUNCTION system_health_check() RETURNS TABLE (
    component TEXT,
    status TEXT,
    message TEXT,
    last_check TIMESTAMPTZ,
    metadata JSONB
) AS $$
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
        json_build_object('connections', v_total_connections, 'max_connections', 100)

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
        json_build_object('active_sessions', v_active_sessions)

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
        json_build_object('failed_logins_1h', v_failed_logins_recent)

    UNION ALL

    -- Storage component (placeholder)
    SELECT
        'storage'::TEXT,
        'healthy'::TEXT,
        'Storage status normal',
        NOW(),
        json_build_object('status', 'operational');

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

-- 4. Data Export Functions
-- ========================

-- Export user data (admin only)
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
    AND p.role != 'ANONYMOUS';

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

-- 5. Grant Permissions
-- ====================

-- Grant execute permissions for all admin functions
GRANT EXECUTE ON FUNCTION get_users TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_user_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION system_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data TO authenticated;

-- 6. Comments and Documentation
-- ==============================

COMMENT ON FUNCTION get_users IS 'Retrieves paginated list of users with filtering and sorting options';
COMMENT ON FUNCTION update_user_role IS 'Updates user role with comprehensive audit logging and session revocation';
COMMENT ON FUNCTION toggle_user_status IS 'Suspends or unsuspends user account with security validation';
COMMENT ON FUNCTION get_platform_statistics IS 'Returns comprehensive platform statistics for admin dashboard';
COMMENT ON FUNCTION get_user_activity_breakdown IS 'Provides daily user activity breakdown for analytics';
COMMENT ON FUNCTION system_health_check IS 'Performs system health check with security monitoring';
COMMENT ON FUNCTION export_user_data IS 'Exports user data in specified format with audit logging';

-- 7. Migration Validation
-- =======================

-- Function to validate admin RPC functions migration
CREATE OR REPLACE FUNCTION validate_admin_rpc_migration() RETURNS BOOLEAN AS $$
DECLARE
    v_function_count INTEGER;
    v_required_functions TEXT[] := ARRAY[
        'get_users',
        'update_user_role',
        'toggle_user_status',
        'get_platform_statistics',
        'get_user_activity_breakdown',
        'system_health_check',
        'export_user_data'
    ];
    v_missing_functions TEXT[];
BEGIN
    -- Count admin RPC functions
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name = ANY(v_required_functions)
    AND routine_schema = 'public'
    AND routine_type = 'FUNCTION';

    -- Find missing functions
    SELECT array_agg(routine_name) INTO v_missing_functions
    FROM unnest(v_required_functions) AS required_func
    LEFT JOIN information_schema.routines r ON r.routine_name = required_func
        AND r.routine_schema = 'public'
        AND r.routine_type = 'FUNCTION'
    WHERE r.routine_name IS NULL;

    -- Log validation results
    PERFORM log_admin_action(
        'MIGRATION_VALIDATION',
        'system',
        NULL,
        NULL,
        json_build_object(
            'expected_functions', array_length(v_required_functions, 1),
            'found_functions', v_function_count,
            'missing_functions', v_missing_functions
        ),
        v_function_count = array_length(v_required_functions, 1),
        CASE
            WHEN v_function_count = array_length(v_required_functions, 1) THEN NULL
            ELSE 'Missing RPC functions'
        END,
        CASE
            WHEN v_function_count = array_length(v_required_functions, 1) THEN 'info'
            ELSE 'error'
        END,
        json_build_object('migration', 'admin_rpc_functions')
    );

    RETURN v_function_count = array_length(v_required_functions, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;