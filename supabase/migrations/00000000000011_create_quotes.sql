-- =============================================================================
-- Migration: Create Quotes Table
-- Date: 2024-05-09
-- Purpose: Store insurance quote requests
-- =============================================================================

CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  category_id uuid,
  status public.quote_status NOT NULL DEFAULT 'DRAFT',
  personal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  vehicle_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  property_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  coverage_requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_price numeric,
  valid_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  visitor_profile_id uuid,
  visitor_token uuid DEFAULT gen_random_uuid() UNIQUE,
  visitor_email text CHECK (visitor_email IS NULL OR visitor_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::text),
  visitor_phone text,
  visitor_name text,
  requested_by_role public.quote_requested_by_role NOT NULL DEFAULT 'VISITOR',
  submission_channel public.quote_submission_channel NOT NULL DEFAULT 'PUBLIC_FORM',
  marketing_consent boolean NOT NULL DEFAULT false,
  terms_accepted boolean NOT NULL DEFAULT false,
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT quotes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.insurance_categories(id),
  CONSTRAINT quotes_visitor_profile_id_fkey FOREIGN KEY (visitor_profile_id) REFERENCES public.visitor_profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS quotes_user_idx ON public.quotes (user_id);
CREATE INDEX IF NOT EXISTS quotes_category_idx ON public.quotes (category_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes (status);
CREATE INDEX IF NOT EXISTS quotes_requested_by_role_idx ON public.quotes (requested_by_role, submission_channel);
CREATE INDEX IF NOT EXISTS quotes_visitor_token_idx ON public.quotes (visitor_token);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_quotes ON public.quotes;
CREATE TRIGGER trg_set_updated_at_quotes
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_owner_access ON public.quotes;
CREATE POLICY quotes_owner_access
  ON public.quotes
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS quotes_owner_manage ON public.quotes;
CREATE POLICY quotes_owner_manage
  ON public.quotes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS quotes_admin_all ON public.quotes;
CREATE POLICY quotes_admin_all
  ON public.quotes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
