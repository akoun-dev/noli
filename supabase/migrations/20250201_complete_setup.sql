-- ========================================
-- MIGRATION COMPLÈTE - CONFIGURATION INITIALE
-- ========================================
-- Cette migration remplace toutes les migrations précédentes
-- Elle nettoie et configure la base de données en une seule fois

-- Nettoyage préalable
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.quote_offers CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.insurance_offers CASCADE;
DROP TABLE IF EXISTS public.insurers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.insurance_categories CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_permissions() CASCADE;
DROP FUNCTION IF EXISTS public.user_has_permission() CASCADE;
DROP FUNCTION IF EXISTS public.log_user_action() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_active_categories() CASCADE;

DELETE FROM auth.users WHERE email LIKE '%@noli.com';

-- Création des tables principales
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'INSURER', 'ADMIN')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.insurance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  license_number TEXT,
  address TEXT,
  website TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.insurance_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id UUID REFERENCES public.insurers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.insurance_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coverage_amount NUMERIC(12,2),
  premium_amount NUMERIC(12,2),
  deductible NUMERIC(12,2),
  terms TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.insurance_categories(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  vehicle_info JSONB DEFAULT '{}',
  driver_info JSONB DEFAULT '{}',
  coverage_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.quote_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  price NUMERIC(12,2),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  notes TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quote_id, offer_id)
);

CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id UUID REFERENCES public.insurers(id) ON DELETE CASCADE,
  quote_offer_id UUID REFERENCES public.quote_offers(id) ON DELETE CASCADE,
  policy_number TEXT UNIQUE NOT NULL,
  premium_amount NUMERIC(12,2),
  coverage_amount NUMERIC(12,2),
  deductible NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'MOBILE_MONEY')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création des fonctions et triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name, company_name, phone, role,
    is_active, email_verified, phone_verified, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    true, NEW.email_confirmed_at IS NOT NULL,
    NEW.phone_confirmed_at IS NOT NULL, NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID, email TEXT, first_name TEXT, last_name TEXT, company_name TEXT,
  phone TEXT, role TEXT, is_active BOOLEAN, email_verified BOOLEAN,
  phone_verified BOOLEAN, avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user UUID := COALESCE(user_uuid, auth.uid());
BEGIN
  IF target_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT p.id, p.email, p.first_name, p.last_name, p.company_name, p.phone,
         p.role, p.is_active, p.email_verified, p.phone_verified, p.avatar_url,
         p.created_at, p.updated_at
  FROM public.profiles p WHERE p.id = target_user;
END;
$$;

-- Configuration RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Everyone can view insurance categories" ON public.insurance_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own quotes" ON public.quotes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view active offers" ON public.insurance_offers
  FOR SELECT USING (is_active = true);

-- Index de performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_insurers_profile_id ON public.insurers(profile_id);
CREATE INDEX idx_insurance_offers_insurer_id ON public.insurance_offers(insurer_id);
CREATE INDEX idx_insurance_offers_category_id ON public.insurance_offers(category_id);
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_policies_user_id ON public.policies(user_id);

-- Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated, anon;

-- Données initiales
INSERT INTO public.insurance_categories (name, description) VALUES
('Auto', 'Assurance automobile pour tous types de véhicules'),
('Moto', 'Assurance pour motos et scooters'),
('Habitation', 'Assurance habitation et propriété'),
('Voyage', 'Assurance voyage et rapatriement'),
('Santé', 'Assurance santé et complémentaire santé'),
('Responsabilité Civile', 'Assurance responsabilité civile professionnelle et privée')
ON CONFLICT (name) DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Base de données configuree avec succes';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Tables principales creees';
  RAISE NOTICE 'Fonctions et triggers configures';
  RAISE NOTICE 'Politiques RLS appliquees';
  RAISE NOTICE 'Index de performance crees';
  RAISE NOTICE 'Categories d assurance initialisees';
  RAISE NOTICE 'Structure creee: profiles, insurance_categories, insurers, insurance_offers, quotes, quote_offers, policies, payments';
  RAISE NOTICE 'Base de donnees prete pour l application!';
END $$;