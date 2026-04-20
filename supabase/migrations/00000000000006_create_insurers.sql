-- =============================================================================
-- Migration: Create Insurers Table
-- Date: 2024-05-09
-- Purpose: Store insurance company information
-- =============================================================================

CREATE TABLE public.insurers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  contact_email text,
  phone text,
  website text,
  contact_address text,
  license_number text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX insurers_code_idx ON public.insurers(code);
CREATE INDEX insurers_is_active_idx ON public.insurers(is_active);
CREATE INDEX insurers_name_idx ON public.insurers(name);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_insurers ON public.insurers;
CREATE TRIGGER trg_set_updated_at_insurers
  BEFORE UPDATE ON public.insurers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insurers_insurers_select ON public.insurers;
CREATE POLICY insurers_insurers_select
  ON public.insurers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS insurers_insurers_insert ON public.insurers;
CREATE POLICY insurers_insurers_insert
  ON public.insurers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS insurers_insurers_update ON public.insurers;
CREATE POLICY insurers_insurers_update
  ON public.insurers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS insurers_admin_delete ON public.insurers;
CREATE POLICY insurers_admin_delete
  ON public.insurers
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Comments
COMMENT ON TABLE public.insurers IS 'Table storing insurance company information';
COMMENT ON COLUMN public.insurers.code IS 'Unique code identifying the insurance company';
COMMENT ON COLUMN public.insurers.name IS 'Company name';
COMMENT ON COLUMN public.insurers.description IS 'Company description';
COMMENT ON COLUMN public.insurers.logo_url IS 'URL to company logo';
COMMENT ON COLUMN public.insurers.contact_email IS 'Primary contact email';
COMMENT ON COLUMN public.insurers.phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.insurers.website IS 'Company website URL';
COMMENT ON COLUMN public.insurers.contact_address IS 'Physical address';
COMMENT ON COLUMN public.insurers.license_number IS 'Insurance license number';
COMMENT ON COLUMN public.insurers.is_active IS 'Whether the insurer is active';

-- Grants
GRANT SELECT ON public.insurers TO authenticated;
GRANT INSERT, UPDATE ON public.insurers TO authenticated;
