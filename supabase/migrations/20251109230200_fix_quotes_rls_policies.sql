-- Fix RLS policies for quotes table to allow user access
-- This migration fixes permission issues for accessing user quotes

-- Enable RLS on quotes table if not already enabled
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can manage their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Insurers can view relevant quotes" ON public.quotes;
DROP POLICY IF EXISTS "Insurers can update relevant quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can manage all quotes" ON public.quotes;
DROP POLICY IF EXISTS quotes_owner_access ON public.quotes;
DROP POLICY IF EXISTS quotes_owner_manage ON public.quotes;

-- Create simple, working policies for quotes
CREATE POLICY "Allow users to view their own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own quotes" ON public.quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own quotes" ON public.quotes
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own quotes" ON public.quotes
    FOR DELETE USING (auth.uid() = user_id);

-- Enable necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;

-- Also fix insurance_categories access if needed
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_categories_public_select" ON public.insurance_categories;
DROP POLICY IF EXISTS "insurance_categories_manage_authenticated" ON public.insurance_categories;

CREATE POLICY "Allow everyone to view active insurance categories" ON public.insurance_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Allow authenticated users to manage insurance categories" ON public.insurance_categories
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

GRANT SELECT ON public.insurance_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurance_categories TO authenticated;