-- Migration: 011_insurer_accounts_and_seed.sql
-- Map insurer user profiles to insurer organizations and add missing seed insurers

-- Create mapping table between profiles (INSURER accounts) and insurers
CREATE TABLE IF NOT EXISTS public.insurer_accounts (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  insurer_id TEXT NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurer_accounts_insurer_id ON public.insurer_accounts(insurer_id);

ALTER TABLE public.insurer_accounts ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can read/write all, insurers can read own mapping
CREATE POLICY "Admins can manage insurer_accounts" ON public.insurer_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "Insurers can read own insurer_accounts" ON public.insurer_accounts
  FOR SELECT USING (profile_id = auth.uid());

-- Helper function: get current insurer_id for logged-in insurer (or NULL)
CREATE OR REPLACE FUNCTION public.get_current_insurer_id()
RETURNS TEXT AS $$
DECLARE
  current_insurer TEXT;
BEGIN
  -- If caller is not authenticated, return NULL
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Prefer explicit mapping
  SELECT ia.insurer_id INTO current_insurer
  FROM public.insurer_accounts ia
  WHERE ia.profile_id = auth.uid();

  -- If no mapping, attempt a best-effort match by company_name
  IF current_insurer IS NULL THEN
    SELECT i.id INTO current_insurer
    FROM public.insurers i
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE p.company_name IS NOT NULL
      AND (lower(i.name) = lower(p.company_name) OR lower(i.name) LIKE lower(p.company_name) || '%')
    LIMIT 1;
  END IF;

  RETURN current_insurer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed: insert missing insurer organizations for test accounts (idempotent)
INSERT INTO public.insurers (id, name, description, logo_url, rating, is_active, contact_email, phone)
VALUES
  ('assurauto-ci', 'AssurAuto CI', 'Assureur automobile en Cote d''Ivoire', NULL, 4.1, true, 'contact@assurauto.ci', '+22527201234'),
  ('sunu-ci', 'Sunu Assurance CI', 'Compagnie d''assurance en Cote d''Ivoire', NULL, 4.0, true, 'admin@sunuassurance.ci', '+225212345678'),
  ('nsia-banque-assurance', 'NSIA Banque Assurance', 'Banque assurance NSIA', NULL, 4.2, true, 'commercial@nsia.ci', '+225202123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  contact_email = EXCLUDED.contact_email,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Seed: map insurer profiles to their insurer organizations
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT id, email
    FROM public.profiles
    WHERE role = 'INSURER'
  ) LOOP
    -- Determine target insurer_id by email
    PERFORM 1;
    IF r.email = 'contact@assurauto.ci' THEN
      INSERT INTO public.insurer_accounts (profile_id, insurer_id)
      VALUES (r.id, 'assurauto-ci')
      ON CONFLICT (profile_id) DO UPDATE SET insurer_id = EXCLUDED.insurer_id, updated_at = NOW();
    ELSIF r.email = 'admin@sunuassurance.ci' THEN
      INSERT INTO public.insurer_accounts (profile_id, insurer_id)
      VALUES (r.id, 'sunu-ci')
      ON CONFLICT (profile_id) DO UPDATE SET insurer_id = EXCLUDED.insurer_id, updated_at = NOW();
    ELSIF r.email = 'commercial@nsia.ci' THEN
      INSERT INTO public.insurer_accounts (profile_id, insurer_id)
      VALUES (r.id, 'nsia-banque-assurance')
      ON CONFLICT (profile_id) DO UPDATE SET insurer_id = EXCLUDED.insurer_id, updated_at = NOW();
    END IF;
  END LOOP;
END $$;

