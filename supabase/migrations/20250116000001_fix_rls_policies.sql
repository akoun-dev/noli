-- Fix for Row Level Security (RLS) Policies
-- Date: 2025-01-16
-- Purpose: Fix 403 Forbidden errors on policies table access

-- Enable RLS on all admin-related tables if not already enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.insurance_offers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can update all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all offers" ON public.insurance_offers;
DROP POLICY IF EXISTS "Insurers can view own offers" ON public.insurance_offers;
DROP POLICY IF EXISTS "Public can view active offers" ON public.insurance_offers;

-- Create new comprehensive RLS policies

-- Profiles table policies
CREATE POLICY "Enable read access for all authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for registration" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable admin access to profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Quotes table policies
CREATE POLICY "Enable read access for own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for quotes creation" ON public.quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own quotes" ON public.quotes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable admin access to all quotes" ON public.quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Enable insurer access to related quotes" ON public.quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'INSURER'
        )
    );

-- Audit logs table policies
CREATE POLICY "Enable read access for own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for audit logging" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable admin access to all audit logs" ON public.audit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- User sessions table policies
CREATE POLICY "Enable read access for own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for session creation" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable admin access to all sessions" ON public.user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Insurance offers table policies
CREATE POLICY "Enable read access for all authenticated users" ON public.insurance_offers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for offers creation" ON public.insurance_offers
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('ADMIN', 'INSURER')
            )
        )
    );

CREATE POLICY "Enable update for own offers" ON public.insurance_offers
    FOR UPDATE USING (
        insurer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Enable delete for own offers" ON public.insurance_offers
    FOR DELETE USING (
        insurer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON public.profiles TO authenticated, service_role;
GRANT ALL ON public.quotes TO authenticated, service_role;
GRANT ALL ON public.audit_logs TO authenticated, service_role;
GRANT ALL ON public.user_sessions TO authenticated, service_role;
GRANT ALL ON public.insurance_offers TO authenticated, service_role;

-- Grant specific permissions for public access where needed
GRANT SELECT ON public.insurance_offers TO anon;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is insurer
CREATE OR REPLACE FUNCTION is_insurer() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'INSURER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_insurer() TO authenticated, service_role;

-- Add comments for documentation
COMMENT ON POLICY "Enable read access for all authenticated users" ON public.profiles IS 'Allows all authenticated users to read profiles';
COMMENT ON POLICY "Enable admin access to profiles" ON public.profiles IS 'Allows admins full access to profiles';
COMMENT ON POLICY "Enable admin access to all quotes" ON public.quotes IS 'Allows admins full access to quotes';
COMMENT ON POLICY "Enable admin access to all audit logs" ON public.audit_logs IS 'Allows admins full access to audit logs';
COMMENT ON POLICY "Enable admin access to all sessions" ON public.user_sessions IS 'Allows admins full access to user sessions';
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is admin';
COMMENT ON FUNCTION is_insurer() IS 'Helper function to check if current user is insurer';