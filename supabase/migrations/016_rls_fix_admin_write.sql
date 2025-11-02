-- Ensure admins can INSERT/UPDATE/DELETE via RLS and support JWT-based role too

-- Helper condition (inlined):
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
--   OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
--       OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')

-- Coverages
DROP POLICY IF EXISTS "Admins can manage coverages" ON public.coverages;
CREATE POLICY "Admins can update/delete coverages" ON public.coverages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can insert coverages" ON public.coverages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can delete coverages" ON public.coverages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );

-- Coverage tariff rules
DROP POLICY IF EXISTS "Admins can manage tariff rules" ON public.coverage_tariff_rules;
CREATE POLICY "Admins can update/delete tariff rules" ON public.coverage_tariff_rules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can insert tariff rules" ON public.coverage_tariff_rules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can delete tariff rules" ON public.coverage_tariff_rules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );

-- MTPL tariffs
DROP POLICY IF EXISTS "Admins can manage MTPL tariffs" ON public.mtpl_tariffs;
CREATE POLICY "Admins can update/delete MTPL" ON public.mtpl_tariffs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can insert MTPL" ON public.mtpl_tariffs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can delete MTPL" ON public.mtpl_tariffs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );

-- TCM/TCL rates
DROP POLICY IF EXISTS "Admins can manage TCM/TCL rates" ON public.tcm_tcl_rates;
CREATE POLICY "Admins can update/delete TCM/TCL" ON public.tcm_tcl_rates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can insert TCM/TCL" ON public.tcm_tcl_rates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );
CREATE POLICY "Admins can delete TCM/TCL" ON public.tcm_tcl_rates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
    OR ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN'
        OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN')
  );

