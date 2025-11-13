-- Migration: Simplify calculate_coverage_premium to support only FIXED_AMOUNT and FREE
-- This removes complex tarification methods and keeps only simple pricing

CREATE OR REPLACE FUNCTION public.calculate_coverage_premium(
  p_coverage_id uuid,
  p_vehicle_data jsonb DEFAULT '{}'::jsonb,
  p_quote_data jsonb DEFAULT '{}'::jsonb
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule record;
  v_coverage record;
  v_premium numeric := 0;
BEGIN
  SELECT *
  INTO v_coverage
  FROM public.coverages
  WHERE id = p_coverage_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Simplified calculation: only FIXED_AMOUNT and FREE methods
  SELECT
    ctr.*
  INTO v_rule
  FROM public.coverage_tariff_rules ctr
  WHERE ctr.coverage_id = p_coverage_id
    AND ctr.is_active = TRUE
    AND ctr.calculation_type IN ('FIXED_AMOUNT', 'FREE')
  ORDER BY
    ctr.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Simple calculation based on calculation_type
  CASE v_rule.calculation_type
    WHEN 'FIXED_AMOUNT' THEN
      v_premium := COALESCE(v_rule.fixed_amount, 0);
    WHEN 'FREE' THEN
      v_premium := 0;
    ELSE
      v_premium := 0;
  END CASE;

  -- Apply min/max limits if defined
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
