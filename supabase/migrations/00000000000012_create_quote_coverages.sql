-- =============================================================================
-- Migration: Create Quote Coverages Table
-- Date: 2024-05-09
-- Purpose: Link coverages to quotes with pricing
-- =============================================================================

CREATE TABLE public.quote_coverages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  coverage_id uuid NOT NULL,
  tariff_rule_id uuid,
  calculation_parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  premium_amount numeric NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT false,
  is_mandatory boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT quote_coverages_pkey PRIMARY KEY (id),
  CONSTRAINT quote_coverages_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE,
  CONSTRAINT quote_coverages_coverage_id_fkey FOREIGN KEY (coverage_id) REFERENCES public.coverages(id) ON DELETE CASCADE,
  CONSTRAINT quote_coverages_tariff_rule_id_fkey FOREIGN KEY (tariff_rule_id) REFERENCES public.coverage_tariff_rules(id) ON DELETE SET NULL
);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS quote_coverages_unique_idx ON public.quote_coverages (quote_id, coverage_id);
CREATE INDEX IF NOT EXISTS quote_coverages_quote_idx ON public.quote_coverages (quote_id, is_included);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_quote_coverages ON public.quote_coverages;
CREATE TRIGGER trg_set_updated_at_quote_coverages
  BEFORE UPDATE ON public.quote_coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Sync mandatory flag from coverage definition
CREATE OR REPLACE FUNCTION public.sync_quote_coverages_mandatory()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  SELECT c.is_mandatory
  INTO NEW.is_mandatory
  FROM public.coverages c
  WHERE c.id = NEW.coverage_id;

  IF NEW.is_mandatory IS NULL THEN
    NEW.is_mandatory := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quote_coverages_mandatory ON public.quote_coverages;
CREATE TRIGGER trg_sync_quote_coverages_mandatory
  BEFORE INSERT OR UPDATE OF coverage_id
  ON public.quote_coverages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_quote_coverages_mandatory();

-- RLS
ALTER TABLE public.quote_coverages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_coverages_user_access ON public.quote_coverages;
CREATE POLICY quote_coverages_user_access
  ON public.quote_coverages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_coverages.quote_id
        AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quote_coverages_user_manage ON public.quote_coverages;
CREATE POLICY quote_coverages_user_manage
  ON public.quote_coverages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_coverages.quote_id
        AND q.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_coverages.quote_id
        AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quote_coverages_admin_manage ON public.quote_coverages;
CREATE POLICY quote_coverages_admin_manage
  ON public.quote_coverages
  FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_insurer())
  WITH CHECK (public.is_admin() OR public.is_insurer());

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_coverages TO authenticated;
