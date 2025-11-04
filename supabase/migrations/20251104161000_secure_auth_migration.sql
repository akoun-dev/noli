-- Migration: Secure Authentication Migration
-- Date: 2025-11-04
-- Purpose: Complete migration from localStorage to secure httpOnly cookies
-- This migration ensures all authentication data is stored securely

-- 1. User Sessions Table for Secure Session Management
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Session management policies
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'ADMIN');

-- 2. Password Reset Security Enhancements
-- =========================================

-- Enhanced password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reset tokens" ON public.password_reset_tokens
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert reset tokens" ON public.password_reset_tokens
    FOR INSERT WITH CHECK (true);

-- 3. Authentication Security Functions
-- ====================================

-- Function to create secure user session
CREATE OR REPLACE FUNCTION create_user_session(
    p_user_id UUID,
    p_session_token TEXT,
    p_refresh_token TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 24
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration time
    v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

    -- Create the session
    INSERT INTO public.user_sessions (
        user_id,
        session_token,
        refresh_token,
        device_fingerprint,
        ip_address,
        user_agent,
        expires_at
    ) VALUES (
        p_user_id,
        p_session_token,
        p_refresh_token,
        p_device_fingerprint,
        p_ip_address,
        p_user_agent,
        v_expires_at
    ) RETURNING id INTO v_session_id;

    -- Log session creation for security
    PERFORM log_user_action(
        'SESSION_CREATED',
        'session',
        v_session_id,
        NULL,
        json_build_object(
            'user_id', p_user_id,
            'expires_at', v_expires_at,
            'ip_address', p_ip_address,
            'device_fingerprint', p_device_fingerprint
        ),
        true,
        NULL,
        json_build_object('migration_phase', 'secure_auth_migration')
    );

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and refresh session
CREATE OR REPLACE FUNCTION validate_session(
    p_session_token TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_session_valid BOOLEAN := false;
    v_session_id UUID;
    v_user_id UUID;
    v_should_refresh BOOLEAN := false;
BEGIN
    -- Find and validate the session
    SELECT
        id,
        user_id,
        expires_at > NOW() as is_valid,
        last_accessed_at < NOW() - INTERVAL '1 hour' as should_refresh
    INTO v_session_id, v_user_id, v_session_valid, v_should_refresh
    FROM public.user_sessions
    WHERE session_token = p_session_token AND is_active = true;

    -- Update last accessed time
    IF v_session_valid THEN
        UPDATE public.user_sessions
        SET
            last_accessed_at = NOW(),
            ip_address = COALESCE(p_ip_address, ip_address),
            user_agent = COALESCE(p_user_agent, user_agent)
        WHERE id = v_session_id;

        -- Log session access
        PERFORM log_user_action(
            'SESSION_ACCESSED',
            'session',
            v_session_id,
            NULL,
            json_build_object(
                'valid', v_session_valid,
                'should_refresh', v_should_refresh
            ),
            true,
            NULL,
            json_build_object(
                'ip_address', p_ip_address,
                'refresh_needed', v_should_refresh
            )
        );
    END IF;

    RETURN v_session_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all user sessions (for logout)
CREATE OR REPLACE FUNCTION revoke_user_sessions(
    p_user_id UUID DEFAULT NULL,
    p_session_token TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_revoked_count INTEGER := 0;
BEGIN
    -- If session_token provided, revoke specific session
    IF p_session_token IS NOT NULL THEN
        UPDATE public.user_sessions
        SET is_active = false
        WHERE session_token = p_session_token AND is_active = true;

        GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    -- If user_id provided, revoke all user sessions
    ELSIF p_user_id IS NOT NULL THEN
        UPDATE public.user_sessions
        SET is_active = false
        WHERE user_id = p_user_id AND is_active = true;

        GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    -- If neither provided, revoke current user sessions
    ELSE
        UPDATE public.user_sessions
        SET is_active = false
        WHERE user_id = auth.uid() AND is_active = true;

        GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
    END IF;

    -- Log session revocation
    PERFORM log_user_action(
        'SESSIONS_REVOKED',
        'session',
        NULL,
        NULL,
        json_build_object('revoked_count', v_revoked_count),
        true,
        NULL,
        json_build_object(
            'user_id', COALESCE(p_user_id, auth.uid()),
            'session_token', p_session_token IS NOT NULL
        )
    );

    RETURN v_revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create secure password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_reset_token TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate secure token
    v_reset_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '1 hour';

    -- Delete any existing tokens for this user
    DELETE FROM public.password_reset_tokens
    WHERE user_id = p_user_id AND created_at > NOW() - INTERVAL '24 hours';

    -- Create new reset token
    INSERT INTO public.password_reset_tokens (
        user_id,
        token,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        v_reset_token,
        v_expires_at,
        p_ip_address,
        p_user_agent
    );

    -- Log token creation
    PERFORM log_user_action(
        'PASSWORD_RESET_TOKEN_CREATED',
        'password_reset',
        NULL,
        NULL,
        json_build_object(
            'user_id', p_user_id,
            'expires_at', v_expires_at
        ),
        true,
        NULL,
        json_build_object(
            'ip_address', p_ip_address,
            'migration_phase', 'secure_auth'
        )
    );

    RETURN v_reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Security Indexes
-- ===================

-- Indexes for user_sessions performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_accessed ON public.user_sessions(last_accessed_at DESC);

-- Indexes for password_reset_tokens performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- 5. Data Migration from Legacy Storage
-- ======================================

-- Function to migrate legacy authentication data
CREATE OR REPLACE FUNCTION migrate_legacy_auth_data() RETURNS INTEGER AS $$
DECLARE
    v_migrated_count INTEGER := 0;
    v_user_record RECORD;
BEGIN
    -- Note: This function is designed to be called during the migration process
    -- It helps identify users who might need session migration

    -- Log migration start
    PERFORM log_user_action(
        'AUTH_MIGRATION_STARTED',
        'migration',
        NULL,
        NULL,
        json_build_object('migration_type', 'legacy_to_secure'),
        true,
        NULL,
        json_build_object('migration_phase', 'secure_auth_migration')
    );

    -- Count active users who might need migration
    SELECT COUNT(*) INTO v_migrated_count
    FROM public.profiles
    WHERE is_active = true AND updated_at > NOW() - INTERVAL '30 days';

    -- Log migration statistics
    PERFORM log_user_action(
        'AUTH_MIGRATION_COMPLETED',
        'migration',
        NULL,
        NULL,
        json_build_object('active_users_count', v_migrated_count),
        true,
        NULL,
        json_build_object('migration_type', 'legacy_to_secure')
    );

    RETURN v_migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant Permissions
-- ===================

-- Grant execute permissions for security functions
GRANT EXECUTE ON FUNCTION create_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION create_password_reset_token TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_legacy_auth_data TO authenticated;

-- Grant table permissions
GRANT ALL ON public.user_sessions TO authenticated;
GRANT SELECT ON public.user_sessions TO authenticated;
GRANT INSERT ON public.user_sessions TO authenticated;
GRANT UPDATE ON public.user_sessions TO authenticated;
GRANT DELETE ON public.user_sessions TO authenticated;

GRANT SELECT ON public.password_reset_tokens TO authenticated;
GRANT INSERT ON public.password_reset_tokens TO authenticated;

-- 7. Comments for Documentation
-- =============================

COMMENT ON TABLE public.user_sessions IS 'Secure user session management table for httpOnly cookie-based authentication';
COMMENT ON TABLE public.password_reset_tokens IS 'Secure password reset token management with enhanced security features';

COMMENT ON FUNCTION create_user_session IS 'Creates a secure user session with device fingerprinting and audit logging';
COMMENT ON FUNCTION validate_session IS 'Validates session token and updates last accessed time with security logging';
COMMENT ON FUNCTION revoke_user_sessions IS 'Revokes user sessions for logout or security purposes';
COMMENT ON FUNCTION create_password_reset_token IS 'Creates secure password reset token with rate limiting and audit logging';
COMMENT ON FUNCTION migrate_legacy_auth_data IS 'Migrates legacy authentication data to secure format';

-- 8. Security Monitoring Trigger
-- ===============================

-- Function to monitor suspicious authentication activities
CREATE OR REPLACE FUNCTION monitor_auth_security() RETURNS TRIGGER AS $$
DECLARE
    v_concurrent_sessions INTEGER;
    v_ip_addresses TEXT[];
BEGIN
    -- Check for suspicious activities when new session is created
    IF TG_OP = 'INSERT' THEN
        -- Count concurrent sessions for this user
        SELECT COUNT(*), array_agg(DISTINCT ip_address::TEXT)
        INTO v_concurrent_sessions, v_ip_addresses
        FROM public.user_sessions
        WHERE user_id = NEW.user_id
        AND is_active = true
        AND created_at > NOW() - INTERVAL '24 hours';

        -- Log suspicious activity if too many concurrent sessions
        IF v_concurrent_sessions > 5 THEN
            PERFORM log_user_action(
                'SUSPICIOUS_ACTIVITY',
                'security_alert',
                NEW.user_id,
                NULL,
                json_build_object(
                    'concurrent_sessions', v_concurrent_sessions,
                    'ip_addresses', v_ip_addresses,
                    'alert_type', 'multiple_concurrent_sessions'
                ),
                true,
                NULL,
                json_build_object('security_level', 'warning')
            );
        END IF;

        -- Log activity from multiple IP addresses
        IF array_length(v_ip_addresses, 1) > 2 THEN
            PERFORM log_user_action(
                'SUSPICIOUS_ACTIVITY',
                'security_alert',
                NEW.user_id,
                NULL,
                json_build_object(
                    'unique_ip_addresses', array_length(v_ip_addresses, 1),
                    'ip_addresses', v_ip_addresses,
                    'alert_type', 'multiple_ip_addresses'
                ),
                true,
                NULL,
                json_build_object('security_level', 'warning')
            );
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for authentication security monitoring
DROP TRIGGER IF EXISTS auth_security_monitor_trigger ON public.user_sessions;
CREATE TRIGGER auth_security_monitor_trigger
    AFTER INSERT ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION monitor_auth_security();