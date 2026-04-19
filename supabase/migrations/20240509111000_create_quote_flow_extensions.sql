-- =============================================================================
-- Migration: extend quote flows for visitor journeys & coverage pricing
-- Goal:
--   * Allow quote creation without authenticated session
--   * Persist visitor contact/profile data
--   * Provide RPCs for coverage CRUD & pricing (used in step 3)
--   * Keep existing authenticated flows compatible
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enumerations for quote metadata
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_submission_channel') THEN
    CREATE TYPE public.quote_submission_channel AS ENUM (
      'PUBLIC_FORM',
      'AUTHENTICATED_FLOW',
      'AGENT',
      'IMPORT'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_requested_by_role') THEN
    CREATE TYPE public.quote_requested_by_role AS ENUM (
      'VISITOR',
      'USER',
      'INSURER',
      'ADMIN'
    );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Visitor profile (pre-account) storage
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.visitor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email text,
  full_name text,
  phone text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_marketing boolean NOT NULL DEFAULT false,
  consent_terms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visitor_profiles_email_idx
  ON public.visitor_profiles (LOWER(email));

DROP TRIGGER IF EXISTS trg_set_updated_at_visitor_profiles ON public.visitor_profiles;
CREATE TRIGGER trg_set_updated_at_visitor_profiles
  BEFORE UPDATE ON public.visitor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visitor_profiles_no_direct_access ON public.visitor_profiles;
CREATE POLICY visitor_profiles_no_direct_access
  ON public.visitor_profiles
  FOR ALL
  TO PUBLIC
  USING (FALSE)
  WITH CHECK (FALSE);

-- ---------------------------------------------------------------------------
-- Quotes table adjustments for visitor flows
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quotes'
      AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.quotes
      ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END;
$$;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS visitor_profile_id uuid REFERENCES public.visitor_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visitor_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS visitor_email text,
  ADD COLUMN IF NOT EXISTS visitor_phone text,
  ADD COLUMN IF NOT EXISTS visitor_name text,
  ADD COLUMN IF NOT EXISTS requested_by_role public.quote_requested_by_role NOT NULL DEFAULT 'VISITOR',
  ADD COLUMN IF NOT EXISTS submission_channel public.quote_submission_channel NOT NULL DEFAULT 'PUBLIC_FORM',
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS quotes_requested_by_role_idx
  ON public.quotes (requested_by_role, submission_channel);

CREATE INDEX IF NOT EXISTS quotes_visitor_token_idx
  ON public.quotes (visitor_token);

-- Ensure visitor_email stored consistently
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_email_format_chk
  CHECK (visitor_email IS NULL OR visitor_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

-- ---------------------------------------------------------------------------
-- Utility: sanitize email helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_email(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN NULL
    ELSE LOWER(TRIM(p_email))
  END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: register visitor profile
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.register_visitor_profile(
  p_email text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_consent_marketing boolean DEFAULT false,
  p_consent_terms boolean DEFAULT true
)
RETURNS TABLE (visitor_profile_id uuid, visitor_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.visitor_profiles;
BEGIN
  INSERT INTO public.visitor_profiles (
    email,
    full_name,
    phone,
    metadata,
    consent_marketing,
    consent_terms
  )
  VALUES (
    public.normalize_email(p_email),
    NULLIF(TRIM(COALESCE(p_full_name, '')), ''),
    NULLIF(TRIM(COALESCE(p_phone, '')), ''),
    COALESCE(p_metadata, '{}'::jsonb),
    COALESCE(p_consent_marketing, FALSE),
    COALESCE(p_consent_terms, TRUE)
  )
  ON CONFLICT (email) WHERE email IS NOT NULL
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    metadata = public.visitor_profiles.metadata || EXCLUDED.metadata,
    consent_marketing = EXCLUDED.consent_marketing,
    consent_terms = EXCLUDED.consent_terms,
    updated_at = NOW()
  RETURNING * INTO v_profile;

  visitor_profile_id := v_profile.id;
  visitor_token := v_profile.public_token;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_visitor_profile(
  text,
  text,
  text,
  jsonb,
  boolean,
  boolean
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Coverage availability RPC (Step 3 data source)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_available_coverages(
  p_vehicle_category text DEFAULT NULL,
  p_vehicle_value numeric DEFAULT NULL,
  p_fiscal_power integer DEFAULT NULL,
  p_fuel_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  coverage_id uuid,
  type public.coverage_type,
  coverage_type public.coverage_type,
  name text,
  description text,
  calculation_type public.coverage_calculation_type,
  is_mandatory boolean,
  estimated_min_premium numeric,
  estimated_max_premium numeric,
  available_formulas text[],
  premium_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate_coverages AS (
    SELECT
      c.id,
      c.type,
      c.name,
      c.description,
      c.calculation_type,
      c.is_mandatory,
      ARRAY(
        SELECT DISTINCT cr.formula_name
        FROM public.coverage_tariff_rules cr
        WHERE cr.coverage_id = c.id
          AND cr.is_active = TRUE
          AND cr.formula_name IS NOT NULL
      ) AS formulas,
      MIN(
        CASE
          WHEN cr.fixed_amount IS NOT NULL THEN cr.fixed_amount
          WHEN cr.min_amount IS NOT NULL THEN cr.min_amount
          WHEN cr.base_rate IS NOT NULL AND p_vehicle_value IS NOT NULL THEN (p_vehicle_value * (cr.base_rate / 100))
          ELSE NULL
        END
      ) AS min_premium,
      MAX(
        CASE
          WHEN cr.fixed_amount IS NOT NULL THEN cr.fixed_amount
          WHEN cr.max_amount IS NOT NULL THEN cr.max_amount
          WHEN cr.base_rate IS NOT NULL AND p_vehicle_value IS NOT NULL THEN (p_vehicle_value * (cr.base_rate / 100))
          ELSE NULL
        END
      ) AS max_premium
    FROM public.coverages c
    LEFT JOIN public.coverage_tariff_rules cr
      ON cr.coverage_id = c.id
      AND cr.is_active = TRUE
      AND (cr.vehicle_category IS NULL OR cr.vehicle_category = COALESCE(p_vehicle_category, cr.vehicle_category))
      AND (cr.fuel_type IS NULL OR cr.fuel_type = COALESCE(p_fuel_type, cr.fuel_type))
      AND (cr.min_fiscal_power IS NULL OR cr.min_fiscal_power <= COALESCE(p_fiscal_power, cr.min_fiscal_power))
      AND (cr.max_fiscal_power IS NULL OR cr.max_fiscal_power >= COALESCE(p_fiscal_power, cr.max_fiscal_power))
    WHERE c.is_active = TRUE
    GROUP BY c.id, c.type, c.name, c.description, c.calculation_type, c.is_mandatory
  )
  SELECT
    c.id,
    c.id AS coverage_id,
    c.type,
    c.type AS coverage_type,
    c.name,
    c.description,
    c.calculation_type,
    c.is_mandatory,
    c.min_premium,
    c.max_premium,
    ARRAY_REMOVE(c.formulas, NULL::text) AS available_formulas,
    NULL::numeric AS premium_amount
  FROM candidate_coverages c
  ORDER BY c.is_mandatory DESC, c.type, c.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_coverages(
  text,
  numeric,
  integer,
  text
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Coverage premium calculation helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_coverage_premium(
  p_coverage_id uuid,
  p_vehicle_data jsonb,
  p_quote_data jsonb DEFAULT '{}'::jsonb
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value numeric;
  v_new_value numeric;
  v_category text;
  v_fiscal_power integer;
  v_fuel text;
  v_formula text;
  v_rule record;
  v_premium numeric := 0;
BEGIN
  v_value := NULLIF((p_vehicle_data->>'sum_insured')::numeric, 0);
  v_new_value := NULLIF((p_vehicle_data->>'new_value')::numeric, 0);
  v_category := NULLIF(p_vehicle_data->>'category', '');
  v_fiscal_power := NULLIF((p_vehicle_data->>'fiscal_power')::int, 0);
  v_fuel := NULLIF(p_vehicle_data->>'fuel_type', '');
  v_formula := NULLIF(p_vehicle_data->>'formula_name', '');

  SELECT
    ctr.*
  INTO v_rule
  FROM public.coverage_tariff_rules ctr
  WHERE ctr.coverage_id = p_coverage_id
    AND ctr.is_active = TRUE
    AND (ctr.vehicle_category IS NULL OR ctr.vehicle_category = COALESCE(v_category, ctr.vehicle_category))
    AND (ctr.fuel_type IS NULL OR ctr.fuel_type = COALESCE(v_fuel, ctr.fuel_type))
    AND (ctr.min_fiscal_power IS NULL OR ctr.min_fiscal_power <= COALESCE(v_fiscal_power, ctr.min_fiscal_power))
    AND (ctr.max_fiscal_power IS NULL OR ctr.max_fiscal_power >= COALESCE(v_fiscal_power, ctr.max_fiscal_power))
    AND (ctr.formula_name IS NULL OR ctr.formula_name = COALESCE(v_formula, ctr.formula_name))
  ORDER BY
    -- Prefer exact formula match, then highest thresholds
    (ctr.formula_name IS NULL) ASC,
    ctr.min_vehicle_value DESC NULLS LAST,
    ctr.min_fiscal_power DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_rule.fixed_amount IS NOT NULL THEN
    v_premium := v_rule.fixed_amount;
  ELSIF v_rule.base_rate IS NOT NULL THEN
    -- base rate applies on sum insured first, fallback to new value
    v_premium := COALESCE(v_value, v_new_value, 0) * (v_rule.base_rate / 100);
  ELSIF v_rule.min_amount IS NOT NULL THEN
    v_premium := v_rule.min_amount;
  END IF;

  IF v_rule.min_amount IS NOT NULL THEN
    v_premium := GREATEST(v_premium, v_rule.min_amount);
  END IF;

  IF v_rule.max_amount IS NOT NULL THEN
    v_premium := LEAST(v_premium, v_rule.max_amount);
  END IF;

  RETURN COALESCE(v_premium, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_coverage_premium(
  uuid,
  jsonb,
  jsonb
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Add / update coverage on a quote (used by comparison step)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_coverage_to_quote(
  p_quote_id uuid,
  p_coverage_id uuid,
  p_calculation_parameters jsonb DEFAULT '{}'::jsonb,
  p_is_included boolean DEFAULT FALSE,
  p_actor_token uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote public.quotes;
  v_vehicle_data jsonb;
  v_premium numeric := 0;
  v_record_id uuid;
BEGIN
  SELECT *
  INTO v_quote
  FROM public.quotes
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % introuvable', p_quote_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_quote.visitor_token IS NOT NULL AND p_actor_token IS NOT NULL AND v_quote.visitor_token <> p_actor_token THEN
    RAISE EXCEPTION 'Accès refusé pour le devis %', p_quote_id
      USING ERRCODE = '42501';
  END IF;

  v_vehicle_data := v_quote.vehicle_data;

  v_premium := public.calculate_coverage_premium(
    p_coverage_id,
    COALESCE(
      jsonb_build_object(
        'sum_insured', (v_vehicle_data->>'sum_insured')::numeric,
        'new_value', (v_vehicle_data->>'new_value')::numeric,
        'category', v_vehicle_data->>'category',
        'fiscal_power', (v_vehicle_data->>'fiscal_power')::int,
        'fuel_type', v_vehicle_data->>'fuel_type'
      ),
      '{}'::jsonb
    ),
    p_calculation_parameters
  );

  INSERT INTO public.quote_coverages (
    quote_id,
    coverage_id,
    tariff_rule_id,
    calculation_parameters,
    premium_amount,
    is_included,
    updated_by
  )
  VALUES (
    p_quote_id,
    p_coverage_id,
    NULL,
    COALESCE(p_calculation_parameters, '{}'::jsonb),
    COALESCE(v_premium, 0),
    COALESCE(p_is_included, FALSE),
    auth.uid()
  )
  ON CONFLICT (quote_id, coverage_id)
  DO UPDATE SET
    calculation_parameters = COALESCE(p_calculation_parameters, '{}'::jsonb),
    premium_amount = COALESCE(v_premium, 0),
    is_included = COALESCE(p_is_included, FALSE),
    updated_at = NOW(),
    updated_by = auth.uid()
  RETURNING id INTO v_record_id;

  RETURN v_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_coverage_to_quote(
  uuid,
  uuid,
  jsonb,
  boolean,
  uuid
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Recalculate premiums and aggregate helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_quote_coverage_premiums(
  p_quote_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle_data jsonb;
BEGIN
  SELECT vehicle_data
  INTO v_vehicle_data
  FROM public.quotes
  WHERE id = p_quote_id;

  UPDATE public.quote_coverages qc
  SET premium_amount = public.calculate_coverage_premium(qc.coverage_id, v_vehicle_data, qc.calculation_parameters),
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE qc.quote_id = p_quote_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_quote_coverage_premiums(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.calculate_quote_total_premium(
  p_quote_id uuid
)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(qc.premium_amount), 0)
  FROM public.quote_coverages qc
  WHERE qc.quote_id = p_quote_id
    AND qc.is_included = TRUE;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_quote_total_premium(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_quote_coverage_premiums(
  p_quote_id uuid
)
RETURNS TABLE (
  id uuid,
  quote_id uuid,
  coverage_id uuid,
  premium_amount numeric,
  is_included boolean,
  calculation_parameters jsonb,
  coverage_name text,
  coverage_type public.coverage_type
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qc.id,
    qc.quote_id,
    qc.coverage_id,
    qc.premium_amount,
    qc.is_included,
    qc.calculation_parameters,
    c.name AS coverage_name,
    c.type AS coverage_type
  FROM public.quote_coverages qc
  JOIN public.coverages c ON c.id = qc.coverage_id
  WHERE qc.quote_id = p_quote_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_quote_coverage_premiums(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Visitor-friendly quote creation & retrieval
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_quote_request(
  p_category_id uuid,
  p_personal_data jsonb,
  p_vehicle_data jsonb,
  p_coverage_requirements jsonb DEFAULT '{}'::jsonb,
  p_estimated_price numeric DEFAULT NULL,
  p_visitor_profile uuid DEFAULT NULL,
  p_submission_channel public.quote_submission_channel DEFAULT 'PUBLIC_FORM',
  p_marketing_consent boolean DEFAULT false,
  p_terms_accepted boolean DEFAULT true
)
RETURNS TABLE (quote_id uuid, visitor_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id uuid := gen_random_uuid();
  v_token uuid := gen_random_uuid();
  v_role public.quote_requested_by_role;
  v_email text;
  v_phone text;
  v_name text;
BEGIN
  v_email := public.normalize_email(p_personal_data->>'email');
  v_phone := NULLIF(TRIM(COALESCE(p_personal_data->>'phone', '')), '');
  v_name := NULLIF(TRIM(COALESCE(p_personal_data->>'full_name', '')), '');

  v_role := CASE
    WHEN auth.uid() IS NOT NULL THEN 'USER'
    ELSE 'VISITOR'
  END;

  INSERT INTO public.quotes (
    id,
    user_id,
    category_id,
    status,
    personal_data,
    vehicle_data,
    coverage_requirements,
    estimated_price,
    valid_until,
    visitor_profile_id,
    visitor_token,
    visitor_email,
    visitor_phone,
    visitor_name,
    requested_by_role,
    submission_channel,
    marketing_consent,
    terms_accepted
  )
  VALUES (
    v_quote_id,
    auth.uid(),
    p_category_id,
    'DRAFT',
    COALESCE(p_personal_data, '{}'::jsonb),
    COALESCE(p_vehicle_data, '{}'::jsonb),
    COALESCE(p_coverage_requirements, '{}'::jsonb),
    p_estimated_price,
    NOW() + INTERVAL '30 days',
    p_visitor_profile,
    v_token,
    v_email,
    v_phone,
    v_name,
    v_role,
    COALESCE(p_submission_channel, 'PUBLIC_FORM'),
    COALESCE(p_marketing_consent, FALSE),
    COALESCE(p_terms_accepted, TRUE)
  );

  quote_id := v_quote_id;
  visitor_token := v_token;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_quote_request(
  uuid,
  jsonb,
  jsonb,
  jsonb,
  numeric,
  uuid,
  public.quote_submission_channel,
  boolean,
  boolean
) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_quote(
  p_quote_id uuid,
  p_visitor_token uuid
)
RETURNS public.quotes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.*
  FROM public.quotes q
  WHERE q.id = p_quote_id
    AND q.visitor_token = p_visitor_token;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_quote(uuid, uuid) TO anon, authenticated;

