-- Migration: 004_create_insurance_tables.sql
-- Création des tables pour le système d'assurance

-- Table des catégories d'assurance
CREATE TABLE IF NOT EXISTS public.insurance_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des assureurs
CREATE TABLE IF NOT EXISTS public.insurers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des offres d'assurance
CREATE TABLE IF NOT EXISTS public.insurance_offers (
  id TEXT PRIMARY KEY,
  insurer_id TEXT REFERENCES public.insurers(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.insurance_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_min DECIMAL(10,2) CHECK (price_min >= 0),
  price_max DECIMAL(10,2) CHECK (price_max >= price_min),
  coverage_amount DECIMAL(12,2) CHECK (coverage_amount >= 0),
  deductible DECIMAL(10,2) DEFAULT 0 CHECK (deductible >= 0),
  is_active BOOLEAN DEFAULT true,
  features TEXT[] DEFAULT '{}',
  contract_type TEXT CHECK (contract_type IN ('basic', 'comprehensive', 'all_risks', 'third_party_plus', 'family', 'eco', 'student', 'young_driver', 'retirement', 'savings')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des devis (quotes)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.insurance_categories(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  personal_data JSONB DEFAULT '{}',
  vehicle_data JSONB DEFAULT '{}',
  property_data JSONB DEFAULT '{}',
  coverage_requirements JSONB DEFAULT '{}',
  estimated_price DECIMAL(10,2),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des polices d'assurance (policies)
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id TEXT REFERENCES public.insurance_offers(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id TEXT REFERENCES public.insurers(id) ON DELETE RESTRICT,
  policy_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  premium_amount DECIMAL(10,2) NOT NULL CHECK (premium_amount > 0),
  payment_frequency TEXT DEFAULT 'MONTHLY' CHECK (payment_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
  coverage_details JSONB DEFAULT '{}',
  terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'DIRECT_DEBIT', 'CHECK')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tarifications
CREATE TABLE IF NOT EXISTS public.tarification_rules (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.insurance_categories(id) ON DELETE CASCADE,
  age_min INTEGER CHECK (age_min >= 0),
  age_max INTEGER CHECK (age_max >= age_min),
  risk_factor TEXT NOT NULL,
  coefficient DECIMAL(5,3) NOT NULL CHECK (coefficient > 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_category_id ON public.quotes(category_id);

CREATE INDEX IF NOT EXISTS idx_policies_user_id ON public.policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_insurer_id ON public.policies(insurer_id);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON public.policies(policy_number);

CREATE INDEX IF NOT EXISTS idx_payments_policy_id ON public.payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_insurance_offers_insurer_id ON public.insurance_offers(insurer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_offers_category_id ON public.insurance_offers(category_id);
CREATE INDEX IF NOT EXISTS idx_insurance_offers_is_active ON public.insurance_offers(is_active);

CREATE INDEX IF NOT EXISTS idx_tarification_rules_category_id ON public.tarification_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_tarification_rules_is_active ON public.tarification_rules(is_active);

-- Activer Row Level Security (RLS)
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarification_rules ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les catégories (lecture publique)
CREATE POLICY "Categories are viewable by everyone" ON public.insurance_categories
  FOR SELECT USING (true);

-- Politiques RLS pour les assureurs (lecture publique)
CREATE POLICY "Insurers are viewable by everyone" ON public.insurers
  FOR SELECT USING (is_active = true);

-- Politiques RLS pour les offres (lecture publique pour les offres actives)
CREATE POLICY "Active offers are viewable by everyone" ON public.insurance_offers
  FOR SELECT USING (is_active = true);

-- Politiques RLS pour les devis (accès par utilisateur ou admin)
CREATE POLICY "Users can view own quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes" ON public.quotes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Politiques RLS pour les polices (accès par utilisateur, assureur ou admin)
CREATE POLICY "Users can view own policies" ON public.policies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Insurers can view relevant policies" ON public.policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'INSURER' AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all policies" ON public.policies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Politiques RLS pour les paiements (accès par utilisateur ou admin)
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Politiques RLS pour les tarifications (lecture publique pour les règles actives)
CREATE POLICY "Active tarification rules are viewable by everyone" ON public.tarification_rules
  FOR SELECT USING (is_active = true);

-- Triggers pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.insurance_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.insurers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.insurance_offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tarification_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();