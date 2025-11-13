-- Fix RLS policies for coverage-related tables
-- This migration ensures all coverage tables have proper RLS policies

-- Enable RLS on coverage tables
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_tariff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_coverages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for coverages table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.coverages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.coverages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.coverages;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.coverages;

-- Create policies for coverages table
CREATE POLICY "Allow everyone to view active coverages" ON public.coverages
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Allow authenticated users to manage coverages" ON public.coverages
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Grant permissions for coverages
GRANT SELECT ON public.coverages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coverages TO authenticated;

-- Drop existing policies for coverage_tariff_rules table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.coverage_tariff_rules;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.coverage_tariff_rules;

-- Create policies for coverage_tariff_rules table
CREATE POLICY "Allow everyone to view active tariff rules" ON public.coverage_tariff_rules
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Allow authenticated users to manage tariff rules" ON public.coverage_tariff_rules
    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Grant permissions for coverage_tariff_rules
GRANT SELECT ON public.coverage_tariff_rules TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coverage_tariff_rules TO authenticated;

-- Drop existing policies for quote_coverages table
DROP POLICY IF EXISTS "Users can view their own quote coverages" ON public.quote_coverages;
DROP POLICY IF EXISTS "Users can manage their own quote coverages" ON public.quote_coverages;
DROP POLICY IF EXISTS "Admins can view all quote coverages" ON public.quote_coverages;
DROP POLICY IF EXISTS "Admins can manage all quote coverages" ON public.quote_coverages;

-- Create policies for quote_coverages table
CREATE POLICY "Allow users to view their own quote coverages" ON public.quote_coverages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_coverages.quote_id
            AND q.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow users to manage their own quote coverages" ON public.quote_coverages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_coverages.quote_id
            AND q.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_coverages.quote_id
            AND q.user_id = auth.uid()
        )
    );

-- Grant permissions for quote_coverages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_coverages TO authenticated;

-- Also ensure the quote_coverage_premiums view has proper permissions
GRANT SELECT ON public.quote_coverage_premiums TO anon, authenticated;