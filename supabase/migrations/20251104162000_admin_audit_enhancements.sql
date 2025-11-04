-- Migration: Admin Audit Enhancements
-- Date: 2025-11-04
-- Purpose: Complete audit logging system for admin operations
-- This file consolidates and enhances the admin audit functionality

-- 1. Enhanced Admin Audit Tables
-- ==============================

-- Ensure audit_logs table exists with all required columns
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    session_id UUID REFERENCES public.user_sessions(id),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- Admin-specific audit view
CREATE OR REPLACE VIEW public.admin_audit_logs AS
SELECT
    al.id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.old_values,
    al.new_values,
    al.ip_address,
    al.user_agent,
    al.success,
    al.error_message,
    al.severity,
    al.created_at,
    al.metadata,
    p.email as user_email,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.role as user_role
FROM public.audit_logs al
LEFT JOIN public.profiles p ON al.user_id = p.id
WHERE p.role = 'ADMIN' OR al.resource_type IN ('user', 'insurer', 'admin', 'system')
ORDER BY al.created_at DESC;

-- 2. Admin-Specific Security Functions
-- =====================================

-- Function to log admin actions with enhanced metadata
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info' DEFAULT 'info',
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_role TEXT;
BEGIN
    -- Get current user role for enhanced logging
    SELECT role INTO v_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Insert enhanced audit log entry
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        success,
        error_message,
        severity,
        metadata
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent',
        p_success,
        p_error_message,
        p_severity,
        jsonb_build_object(
            'admin_role', v_user_role,
            'timestamp', NOW(),
            'session_id', (SELECT id FROM public.user_sessions WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
            'metadata', p_metadata
        )
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for user management operations
CREATE OR REPLACE FUNCTION admin_user_operation(
    p_operation TEXT,
    p_target_user_id UUID,
    p_changes JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_target_user_role TEXT;
    v_log_id UUID;
BEGIN
    -- Get target user information
    SELECT role INTO v_target_user_role
    FROM public.profiles
    WHERE id = p_target_user_id;

    -- Log the admin operation
    v_log_id := log_admin_action(
        'ADMIN_USER_' || UPPER(p_operation),
        'user',
        p_target_user_id,
        json_build_object('role', v_target_user_role),
        p_changes,
        true,
        NULL,
        CASE
            WHEN p_operation = 'delete' THEN 'warning'
            WHEN p_operation = 'suspend' THEN 'warning'
            ELSE 'info'
        END,
        json_build_object(
            'operation', p_operation,
            'reason', p_reason,
            'target_role', v_target_user_role
        )
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for system configuration changes
CREATE OR REPLACE FUNCTION admin_config_change(
    p_config_key TEXT,
    p_old_value JSONB,
    p_new_value JSONB,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_log_id UUID;
BEGIN
    v_log_id := log_admin_action(
        'CONFIG_CHANGE',
        'system_config',
        NULL,
        json_build_object('key', p_config_key, 'value', p_old_value),
        json_build_object('key', p_config_key, 'value', p_new_value),
        true,
        NULL,
        'info',
        json_build_object(
            'config_key', p_config_key,
            'reason', p_reason
        )
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Security Monitoring Functions
-- ================================

-- Function to detect suspicious admin activity
CREATE OR REPLACE FUNCTION detect_suspicious_admin_activity(
    p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    suspicious_actions BIGINT,
    unique_ips BIGINT,
    failed_actions BIGINT,
    risk_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.user_id,
        p.email,
        COUNT(*) as suspicious_actions,
        COUNT(DISTINCT al.ip_address) as unique_ips,
        COUNT(*) FILTER (WHERE NOT al.success) as failed_actions,
        CASE
            WHEN COUNT(*) FILTER (WHERE NOT al.success) > 5 THEN 'HIGH'
            WHEN COUNT(DISTINCT al.ip_address) > 3 THEN 'MEDIUM'
            WHEN COUNT(*) > 100 THEN 'MEDIUM'
            ELSE 'LOW'
        END as risk_level
    FROM public.audit_logs al
    JOIN public.profiles p ON al.user_id = p.id
    WHERE p.role = 'ADMIN'
    AND al.created_at > NOW() - (p_hours_back || ' hours')::INTERVAL
    AND (
        NOT al.success
        OR al.action LIKE '%LOGIN%'
        OR al.action LIKE '%DELETE%'
        OR al.action LIKE '%SUSPEND%'
        OR al.severity IN ('warning', 'error', 'critical')
    )
    GROUP BY al.user_id, p.email
    HAVING COUNT(*) FILTER (WHERE NOT al.success) > 0
       OR COUNT(DISTINCT al.ip_address) > 1
       OR COUNT(*) > 50;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin activity summary
CREATE OR REPLACE FUNCTION get_admin_activity_summary(
    p_days_back INTEGER DEFAULT 7
) RETURNS TABLE (
    date_trunc DATE,
    total_actions BIGINT,
    successful_actions BIGINT,
    failed_actions BIGINT,
    unique_admins BIGINT,
    critical_actions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('day', al.created_at)::DATE as date_trunc,
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE al.success) as successful_actions,
        COUNT(*) FILTER (WHERE NOT al.success) as failed_actions,
        COUNT(DISTINCT al.user_id) as unique_admins,
        COUNT(*) FILTER (WHERE al.severity = 'critical') as critical_actions
    FROM public.audit_logs al
    JOIN public.profiles p ON al.user_id = p.id
    WHERE p.role = 'ADMIN'
    AND al.created_at > NOW() - (p_days_back || ' days')::INTERVAL
    GROUP BY DATE_TRUNC('day', al.created_at)::DATE
    ORDER BY date_trunc DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Audit Data Retention and Cleanup
-- ====================================

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_audit_logs(
    p_retention_days INTEGER DEFAULT 365
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
    v_log_id UUID;
BEGIN
    -- Delete old audit logs based on retention policy
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND severity NOT IN ('critical', 'error');

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Log the cleanup operation
    v_log_id := log_admin_action(
        'AUDIT_CLEANUP',
        'audit_logs',
        NULL,
        NULL,
        json_build_object('deleted_count', v_deleted_count, 'retention_days', p_retention_days),
        true,
        NULL,
        'info',
        json_build_object('automated_cleanup', true)
    );

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enhanced Triggers for Admin Operations
-- =========================================

-- Trigger for user management changes
CREATE OR REPLACE FUNCTION audit_user_management_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Check if role or status changed
        IF OLD.role IS DISTINCT FROM NEW.role OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            PERFORM log_admin_action(
                'USER_MANAGEMENT_UPDATE',
                'user',
                NEW.id,
                json_build_object('role', OLD.role, 'is_active', OLD.is_active),
                json_build_object('role', NEW.role, 'is_active', NEW.is_active),
                true,
                NULL,
                CASE
                    WHEN NEW.is_active = false THEN 'warning'
                    WHEN OLD.role IS DISTINCT FROM NEW.role THEN 'warning'
                    ELSE 'info'
                END,
                json_build_object('trigger', 'user_management_update', 'changed_fields',
                    json_build_object(
                        'role_changed', OLD.role IS DISTINCT FROM NEW.role,
                        'status_changed', OLD.is_active IS DISTINCT FROM NEW.is_active
                    )
                )
            );
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        PERFORM log_admin_action(
            'USER_MANAGEMENT_DELETE',
            'user',
            OLD.id,
            json_build_object('role', OLD.role, 'is_active', OLD.is_active),
            NULL,
            true,
            NULL,
            'critical',
            json_build_object('trigger', 'user_management_delete', 'deleted_user', OLD.email)
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for user management auditing
DROP TRIGGER IF EXISTS user_management_audit_trigger ON public.profiles;
CREATE TRIGGER user_management_audit_trigger
    AFTER UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION audit_user_management_changes();

-- 6. Indexes for Performance
-- ===========================

-- Enhanced indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_severity ON public.audit_logs(user_id, severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date ON public.audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_date ON public.audit_logs(severity, created_at DESC);

-- Index for admin_audit_logs view performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON public.profiles(role) WHERE role = 'ADMIN';

-- 7. Grant Permissions
-- ====================

-- Grant permissions for audit functions
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION admin_user_operation TO authenticated;
GRANT EXECUTE ON FUNCTION admin_config_change TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_admin_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_audit_logs TO authenticated;

-- Grant view permissions for admin audit logs
GRANT SELECT ON public.admin_audit_logs TO authenticated;

-- Enhanced table permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT UPDATE ON public.audit_logs TO authenticated;

-- 8. Comments and Documentation
-- ==============================

COMMENT ON TABLE public.audit_logs IS 'Enhanced audit logging table with admin-specific features and severity levels';
COMMENT ON VIEW public.admin_audit_logs IS 'Admin-specific audit log view with user details';

COMMENT ON FUNCTION log_admin_action IS 'Logs admin actions with enhanced metadata and severity levels';
COMMENT ON FUNCTION admin_user_operation IS 'Handles admin user management operations with audit logging';
COMMENT ON FUNCTION admin_config_change IS 'Logs system configuration changes made by admins';
COMMENT ON FUNCTION detect_suspicious_admin_activity IS 'Detects and reports suspicious admin activity patterns';
COMMENT ON FUNCTION get_admin_activity_summary IS 'Provides activity summary for admin dashboards';
COMMENT ON FUNCTION cleanup_audit_logs IS 'Cleans up old audit logs based on retention policy';

COMMENT ON TRIGGER user_management_audit_trigger ON public.profiles IS 'Audits all user management changes for security';

-- 9. Migration Validation
-- =======================

-- Function to validate the migration was successful
CREATE OR REPLACE FUNCTION validate_admin_audit_migration() RETURNS BOOLEAN AS $$
DECLARE
    v_table_exists BOOLEAN;
    v_view_exists BOOLEAN;
    v_function_count INTEGER;
BEGIN
    -- Check if table and view exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'audit_logs' AND table_schema = 'public'
    ) INTO v_table_exists;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'admin_audit_logs' AND table_schema = 'public'
    ) INTO v_view_exists;

    -- Count admin-specific functions
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_name LIKE '%admin%'
    AND routine_schema = 'public'
    AND routine_type = 'FUNCTION';

    -- Log validation results
    PERFORM log_admin_action(
        'MIGRATION_VALIDATION',
        'system',
        NULL,
        NULL,
        json_build_object(
            'audit_logs_table', v_table_exists,
            'admin_audit_logs_view', v_view_exists,
            'admin_functions', v_function_count
        ),
        v_table_exists AND v_view_exists AND v_function_count >= 5,
        v_table_exists AND v_view_exists AND v_function_count >= 5 ? NULL : 'Migration validation failed',
        CASE
            WHEN v_table_exists AND v_view_exists AND v_function_count >= 5 THEN 'info'
            ELSE 'error'
        END,
        json_build_object('migration', 'admin_audit_enhancements')
    );

    RETURN v_table_exists AND v_view_exists AND v_function_count >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;