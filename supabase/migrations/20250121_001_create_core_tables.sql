-- Tables principales
-- Création des tables de base du système

-- Table des profils utilisateurs
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

-- Table des catégories d'assurance
CREATE TABLE public.insurance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des assureurs
CREATE TABLE public.insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  registration_number TEXT,
  license_number TEXT,
  address TEXT,
  website TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des offres d'assurance
CREATE TABLE public.insurance_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id UUID REFERENCES public.insurers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.insurance_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coverage_amount NUMERIC,
  premium_amount NUMERIC,
  deductible NUMERIC,
  terms TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des devis
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

-- Table des offres associées aux devis
CREATE TABLE public.quote_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  price NUMERIC,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  notes TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des contrats
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id UUID REFERENCES public.insurers(id) ON DELETE CASCADE,
  quote_offer_id UUID REFERENCES public.quote_offers(id) ON DELETE CASCADE,
  policy_number TEXT UNIQUE NOT NULL,
  premium_amount NUMERIC,
  coverage_amount NUMERIC,
  deductible NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED')),
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'MOBILE_MONEY')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  RAISE NOTICE '=== TABLES PRINCIPALES CRÉÉES ===';
  RAISE NOTICE '✅ profiles - Profils utilisateurs';
  RAISE NOTICE '✅ insurance_categories - Catégories d''assurance';
  RAISE NOTICE '✅ insurers - Assureurs';
  RAISE NOTICE '✅ insurance_offers - Offres d''assurance';
  RAISE NOTICE '✅ quotes - Devis';
  RAISE NOTICE '✅ quote_offers - Offres associées aux devis';
  RAISE NOTICE '✅ policies - Contrats';
  RAISE NOTICE '✅ payments - Paiements';
END $$;