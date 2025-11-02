-- Ensure Admins can write (INSERT/UPDATE/DELETE) to coverages table

-- coverages: add INSERT/UPDATE/DELETE policies for admins
DO $$
BEGIN
  -- INSERT policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverages'
      AND policyname = 'Admins can insert coverages'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can insert coverages" ON public.coverages
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;

  -- UPDATE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverages'
      AND policyname = 'Admins can update coverages'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can update coverages" ON public.coverages
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;

  -- DELETE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverages'
      AND policyname = 'Admins can delete coverages'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can delete coverages" ON public.coverages
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;
END $$;

-- coverage_tariff_rules: add INSERT/UPDATE/DELETE policies for admins
DO $$
BEGIN
  -- INSERT policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverage_tariff_rules'
      AND policyname = 'Admins can insert tariff rules'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can insert tariff rules" ON public.coverage_tariff_rules
        FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;

  -- UPDATE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverage_tariff_rules'
      AND policyname = 'Admins can update tariff rules'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can update tariff rules" ON public.coverage_tariff_rules
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;

  -- DELETE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'coverage_tariff_rules'
      AND policyname = 'Admins can delete tariff rules'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can delete tariff rules" ON public.coverage_tariff_rules
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''ADMIN'')
          OR ((auth.jwt() ->> ''app_metadata'')::jsonb ->> ''role'' = ''ADMIN''
              OR (auth.jwt() ->> ''user_metadata'')::jsonb ->> ''role'' = ''ADMIN'')
        );
    ';
  END IF;
END $$;