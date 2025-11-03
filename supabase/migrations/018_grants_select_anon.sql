-- Allow anonymous read on coverages and rules; RLS still restricts rows
GRANT SELECT ON public.coverages TO anon;
GRANT SELECT ON public.coverage_tariff_rules TO anon;

