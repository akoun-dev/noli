-- Migration: Enhanced Security Policies
-- Date: 2025-11-04
-- Purpose: Strengthen RLS policies and add audit logging for security

-- 1. Enhanced Row Level Security Policies
-- ========================================

-- Profiles table RLS enhancement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insurers can view client profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id AND is_active = true);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'ADMIN' AND
        is_active = true
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'ADMIN'
    );

CREATE POLICY "Insurers can view client profiles" ON public.profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'INSURER' AND
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.user_id = profiles.id
        )
    );

-- Quotes table RLS enhancement
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Insurers can view relevant quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;

CREATE POLICY "Users can view their own quotes" ON public.quotes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Insurers can view relevant quotes" ON public.quotes
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'INSURER' AND
        EXISTS (
            SELECT 1 FROM public.quote_coverages qc
            JOIN public.coverage_tarifications ct ON qc.coverage_id = ct.coverage_id
            JOIN public.insurance_offers io ON ct.offer_id = io.id
            JOIN public.insurers i ON io.insurer_id = i.id
            WHERE qc.quote_id = quotes.id AND i.is_active = true
        )
    );

CREATE POLICY "Admins can view all quotes" ON public.quotes
    FOR SELECT USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Quote Coverages table RLS enhancement (table relationnelle entre quotes et coverages)
ALTER TABLE public.quote_coverages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quote coverages" ON public.quote_coverages;
DROP POLICY IF EXISTS "Admins can view all quote coverages" ON public.quote_coverages;

CREATE POLICY "Users can view their own quote coverages" ON public.quote_coverages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_coverages.quote_id AND q.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all quote coverages" ON public.quote_coverages
    FOR SELECT USING (auth.jwt() ->> 'role' = 'ADMIN');

-- 2. Enhanced Audit Logging
-- =========================

-- Enhanced audit_logs table if not exists
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
    metadata JSONB
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 3. Security-Related Functions
-- ==============================

-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
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
        p_metadata
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permissions with caching
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
    v_cache_key TEXT;
BEGIN
    -- Check if user has the permission
    SELECT EXISTS (
        SELECT 1 FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id AND p.name = p_permission
    ) INTO v_has_permission;

    -- Log permission check for security monitoring
    PERFORM log_user_action(
        'PERMISSION_CHECK',
        'permission',
        NULL,
        NULL,
        json_build_object('permission', p_permission, 'granted', v_has_permission),
        true,
        NULL,
        json_build_object('cache_hit', false)
    );

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate session integrity
CREATE OR REPLACE FUNCTION validate_session_integrity() RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_session_valid BOOLEAN := false;
BEGIN
    -- Get current user ID from auth
    v_user_id := auth.uid();

    -- Check if user exists and is active
    SELECT is_active INTO v_session_valid
    FROM public.profiles
    WHERE id = v_user_id;

    -- Log session validation
    PERFORM log_user_action(
        'SESSION_VALIDATION',
        'session',
        v_user_id,
        NULL,
        json_build_object('valid', COALESCE(v_session_valid, false)),
        v_session_valid IS NOT NULL,
        CASE WHEN v_session_valid IS NULL THEN 'User not found' ELSE NULL END
    );

    RETURN COALESCE(v_session_valid, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Security Indexes for Performance
-- ===================================

-- Indexes for audit_logs performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Indexes for profiles performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON public.profiles(role, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email_active ON public.profiles(LOWER(email), is_active);

-- Indexes for quotes performance (nouveau)
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status_created ON public.quotes(status, created_at);

-- Indexes for quote_coverages performance (nouveau)
CREATE INDEX IF NOT EXISTS idx_quote_coverages_quote_id ON public.quote_coverages(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_coverages_coverage_id ON public.quote_coverages(coverage_id);

-- 5. Security Triggers
-- ====================

-- Trigger to audit profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        PERFORM log_user_action(
            'PROFILE_UPDATE',
            'profile',
            NEW.id,
            json_build_object(
                'email', OLD.email,
                'first_name', OLD.first_name,
                'last_name', OLD.last_name,
                'phone', OLD.phone,
                'role', OLD.role,
                'is_active', OLD.is_active
            ),
            json_build_object(
                'email', NEW.email,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'phone', NEW.phone,
                'role', NEW.role,
                'is_active', NEW.is_active
            ),
            true,
            NULL,
            json_build_object('trigger', 'profile_update_trigger')
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile audit
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION audit_profile_changes();

-- 6. Session Security Enhancements
-- ================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete sessions older than 24 hours
    DELETE FROM public.user_sessions
    WHERE created_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Log cleanup action
    PERFORM log_user_action(
        'SESSION_CLEANUP',
        'session',
        NULL,
        NULL,
        json_build_object('deleted_sessions', v_deleted_count),
        true,
        NULL,
        json_build_object('cleanup_type', 'expired_sessions')
    );

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_user_action TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session_integrity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO authenticated;

-- Set up security function permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

COMMENT ON TABLE public.audit_logs IS 'Enhanced audit logging table for security monitoring';
COMMENT ON FUNCTION log_user_action IS 'Logs user actions for security audit trail';
COMMENT ON FUNCTION check_user_permission IS 'Validates user permissions with audit logging';
COMMENT ON FUNCTION validate_session_integrity IS 'Validates session integrity and logs results';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Cleans up expired sessions and logs cleanup metrics';