-- Row Level Security (RLS) setup
-- Configuration des politiques de sécurité au niveau des lignes

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

-- Politiques pour la table insurance_categories (lecture publique)
CREATE POLICY "Everyone can view insurance categories" ON public.insurance_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage insurance categories" ON public.insurance_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques pour la table insurers
CREATE POLICY "Insurers can view own profile" ON public.insurers
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Admins can manage insurers" ON public.insurers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques pour la table insurance_offers
CREATE POLICY "Insurers can manage own offers" ON public.insurance_offers
  FOR ALL USING (
    insurer_id IN (
      SELECT id FROM public.insurers WHERE profile_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Users can view active offers" ON public.insurance_offers
  FOR SELECT USING (is_active = true);

-- Politiques pour la table quotes
CREATE POLICY "Users can manage own quotes" ON public.quotes
  FOR ALL USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques pour la table quote_offers
CREATE POLICY "Users can view own quote offers" ON public.quote_offers
  FOR SELECT USING (
    quote_id IN (
      SELECT id FROM public.quotes WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Users can update own quote offers" ON public.quote_offers
  FOR UPDATE USING (
    quote_id IN (
      SELECT id FROM public.quotes WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques pour la table policies
CREATE POLICY "Users can view own policies" ON public.policies
  FOR SELECT USING (
    user_id = auth.uid() OR
    insurer_id IN (
      SELECT id FROM public.insurers WHERE profile_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Admins can manage all policies" ON public.policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques pour la table payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

DO $$
BEGIN
  RAISE NOTICE '=== POLITIQUES RLS CONFIGURÉES ===';
  RAISE NOTICE '✅ RLS activé sur toutes les tables';
  RAISE NOTICE '✅ Politiques de sécurité appliquées';
  RAISE NOTICE '✅ Accès basé sur les rôles utilisateurs';
END $$;