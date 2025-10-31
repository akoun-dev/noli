-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Public tables (no RLS or view-only)
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;
-- REMOVED: tarification_rules table has been replaced by coverage-based system
-- ALTER TABLE public.tarification_rules ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin policies - corrected to check role in user_metadata or app_metadata
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN' OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
);
CREATE POLICY "Admins can create profiles" ON public.profiles FOR INSERT WITH CHECK (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN' OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN' OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
);

-- Comprehensive admin policy for all operations
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'ADMIN' OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'ADMIN'
);

-- Quotes policies
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create quotes" ON public.quotes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Insurers can view quotes for their offers" ON public.quotes FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.insurance_offers io
    JOIN public.policies p ON p.offer_id = io.id
    WHERE io.insurer_id IN (SELECT id::text FROM public.profiles WHERE id = auth.uid() AND role = 'INSURER')
));

-- Policies policies
CREATE POLICY "Users can view own policies" ON public.policies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create policies" ON public.policies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Insurers can view their policies" ON public.policies FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.insurers i ON i.id = insurer_id::text
    WHERE p.id = auth.uid() AND p.role = 'INSURER'
));

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Public read access for catalog tables
CREATE POLICY "Anyone can view insurance categories" ON public.insurance_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view insurers" ON public.insurers FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view insurance offers" ON public.insurance_offers FOR SELECT USING (is_active = true);
-- REMOVED: tarification_rules table has been replaced by coverage-based system
-- CREATE POLICY "Anyone can view tarification rules" ON public.tarification_rules FOR SELECT USING (is_active = true);

-- Admin only policies for sensitive tables
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Allow users to manage their own sessions and tokens
CREATE POLICY "Users can manage own sessions" ON public.user_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own reset tokens" ON public.password_reset_tokens FOR ALL USING (user_id = auth.uid());