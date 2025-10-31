-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('USER', 'INSURER', 'ADMIN');
CREATE TYPE contract_type AS ENUM ('basic', 'comprehensive', 'all_risks', 'third_party_plus', 'family', 'eco', 'student', 'young_driver', 'retirement', 'savings');
CREATE TYPE payment_method_type AS ENUM ('CREDIT_CARD', 'BANK_TRANSFER', 'DIRECT_DEBIT', 'CHECK');
CREATE TYPE payment_status_type AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE policy_status_type AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');
CREATE TYPE quote_status_type AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE payment_frequency_type AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- Create tables in dependency order

-- Profiles table (base for all users)
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text CHECK (length(TRIM(BOTH FROM email)) > 0),
  first_name text,
  last_name text,
  company_name text,
  phone text CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$'::text),
  role user_role DEFAULT 'USER',
  avatar_url text,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Insurance categories
CREATE TABLE public.insurance_categories (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insurance_categories_pkey PRIMARY KEY (id)
);

-- Insurers
CREATE TABLE public.insurers (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  rating numeric CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  is_active boolean DEFAULT true,
  contact_email text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insurers_pkey PRIMARY KEY (id)
);

-- Insurance offers
CREATE TABLE public.insurance_offers (
  id text NOT NULL,
  insurer_id text NOT NULL,
  category_id text NOT NULL,
  name text NOT NULL,
  description text,
  price_min numeric CHECK (price_min >= 0::numeric),
  price_max numeric,
  coverage_amount numeric CHECK (coverage_amount >= 0::numeric),
  deductible numeric DEFAULT 0 CHECK (deductible >= 0::numeric),
  is_active boolean DEFAULT true,
  features text[] DEFAULT '{}'::text[],
  contract_type contract_type,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT insurance_offers_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_offers_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE,
  CONSTRAINT insurance_offers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.insurance_categories(id) ON DELETE CASCADE
);

-- Quotes
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id text NOT NULL,
  status quote_status_type DEFAULT 'DRAFT',
  personal_data jsonb DEFAULT '{}'::jsonb,
  vehicle_data jsonb DEFAULT '{}'::jsonb,
  property_data jsonb DEFAULT '{}'::jsonb,
  coverage_requirements jsonb DEFAULT '{}'::jsonb,
  estimated_price numeric,
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT quotes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.insurance_categories(id) ON DELETE CASCADE
);

-- Policies
CREATE TABLE public.policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  offer_id text NOT NULL,
  user_id uuid NOT NULL,
  insurer_id text NOT NULL,
  policy_number text NOT NULL UNIQUE,
  status policy_status_type DEFAULT 'ACTIVE',
  start_date date NOT NULL,
  end_date date NOT NULL,
  premium_amount numeric NOT NULL CHECK (premium_amount > 0::numeric),
  payment_frequency payment_frequency_type DEFAULT 'MONTHLY',
  coverage_details jsonb DEFAULT '{}'::jsonb,
  terms_conditions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT policies_pkey PRIMARY KEY (id),
  CONSTRAINT policies_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT policies_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  CONSTRAINT policies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT policies_insurer_id_fkey FOREIGN KEY (insurer_id) REFERENCES public.insurers(id) ON DELETE CASCADE,
  CONSTRAINT chk_policy_dates CHECK (start_date < end_date)
);

-- Payments
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_date date NOT NULL,
  payment_method payment_method_type,
  status payment_status_type DEFAULT 'PENDING',
  transaction_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE,
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tarification rules
CREATE TABLE public.tarification_rules (
  id text NOT NULL,
  category_id text NOT NULL,
  age_min integer CHECK (age_min >= 0),
  age_max integer,
  risk_factor text NOT NULL,
  coefficient numeric NOT NULL CHECK (coefficient > 0::numeric),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tarification_rules_pkey PRIMARY KEY (id),
  CONSTRAINT tarification_rules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.insurance_categories(id) ON DELETE CASCADE
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource text,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Password reset tokens
CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- User sessions
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  refresh_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);