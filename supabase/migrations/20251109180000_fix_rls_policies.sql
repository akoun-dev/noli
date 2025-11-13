-- Fix RLS policies cross-database reference and infinite recursion
-- This migration fixes two critical issues:
-- 1. Cross-database reference in upsert_profile_for_signup function
-- 2. Infinite recursion in quotes related policies

-- Fix 1: The upsert_profile_for_signup function already exists in 20240509112000_profile_public_helpers.sql
-- No need to recreate it here

-- Fix 2: Update RLS policies to use correct syntax
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insurers can view client profiles" ON public.profiles;
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;

-- Create new policies with correct syntax
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id AND is_active = true)
    WITH CHECK (auth.uid() = id AND is_active = true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

CREATE POLICY "Insurers can view client profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'INSURER'
        )
    );

-- Fix 3: Update quotes policies to avoid infinite recursion
-- First check if quotes table exists and has related policies
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'quotes'
    ) THEN
        -- Drop problematic quotes policies that might cause recursion
        DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
        DROP POLICY IF EXISTS "Insurers can view relevant quotes" ON public.quotes;
        DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;

        -- Create simple quotes policies without recursion
        CREATE POLICY "Users can view their own quotes" ON public.quotes
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can manage their own quotes" ON public.quotes
            FOR ALL USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Insurers can view relevant quotes" ON public.quotes
            FOR SELECT USING (
                auth.uid() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' = 'INSURER'
                )
            );

        CREATE POLICY "Insurers can update relevant quotes" ON public.quotes
            FOR UPDATE USING (
                auth.uid() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' = 'INSURER'
                )
            );

        CREATE POLICY "Admins can view all quotes" ON public.quotes
            FOR SELECT USING (
                auth.uid() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' = 'ADMIN'
                )
            );

        CREATE POLICY "Admins can manage all quotes" ON public.quotes
            FOR ALL USING (
                auth.uid() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' = 'ADMIN'
                )
            );
    END IF;
END $$;

-- Fix 4: Update quote_coverages policies if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'quote_coverages'
    ) THEN
        -- Drop potentially recursive policies
        DROP POLICY IF EXISTS "Users can view their own quote coverages" ON public.quote_coverages;
        DROP POLICY IF EXISTS "Users can manage their own quote coverages" ON public.quote_coverages;
        DROP POLICY IF EXISTS "Admins can view all quote coverages" ON public.quote_coverages;

        -- Create simple quote_coverages policies
        CREATE POLICY "Users can view their own quote coverages" ON public.quote_coverages
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.quotes q
                    WHERE q.id = quote_coverages.quote_id
                    AND q.user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can manage their own quote coverages" ON public.quote_coverages
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.quotes q
                    WHERE q.id = quote_coverages.quote_id
                    AND q.user_id = auth.uid()
                )
            );

        CREATE POLICY "Admins can view all quote coverages" ON public.quote_coverages
            FOR SELECT USING (
                auth.uid() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' = 'ADMIN'
                )
            );

        CREATE POLICY "Admins can manage all quote coverages" ON public.quote_coverages
            FOR ALL USING (
                auth.uid() IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM auth.users
                    WHERE id = auth.uid()
                    AND raw_user_meta_data->>'role' = 'ADMIN'
                )
            );
    END IF;
END $$;

-- Note: Permissions for upsert_profile_for_signup are already granted in 20240509112000_profile_public_helpers.sql