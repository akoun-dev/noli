-- Ensure Admins can SELECT all coverage data regardless of is_active

-- coverages: add explicit SELECT policy for admins (JWT or profiles table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverages'
      AND policyname = 'Admins can select coverages'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can select coverages" ON public.coverages
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;
END $$;

-- coverage_tariff_rules: add explicit SELECT policy for admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverage_tariff_rules'
      AND policyname = 'Admins can select tariff rules'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can select tariff rules" ON public.coverage_tariff_rules
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;
END $$;
