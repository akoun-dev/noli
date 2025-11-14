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
  v_fire_theft jsonb;
  v_glass_standard jsonb;
  v_glass jsonb;
  v_tierce_cap jsonb;
  v_tierce_option jsonb;
  v_sum_insured numeric;
  v_new_value numeric;
  v_fire_rate numeric;
  v_theft_rate_low numeric;
  v_theft_rate_high numeric;
  v_armed_rate_low numeric;
  v_armed_rate_high numeric;
  v_threshold numeric;
  v_include_fire boolean;
  v_include_base boolean;
  v_include_armed boolean;
  v_total_rate numeric;
  v_glass_rate numeric;
  v_tierce_rate numeric;
  v_tierce_deduction numeric;
  v_selected_type text;
BEGIN
  SELECT *
  INTO v_coverage
  FROM public.coverages
  WHERE id = p_coverage_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_glass_standard := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'glassStandardConfig';
  v_glass := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'glassRoofConfig';
  v_fire_theft := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'fireTheftConfig';
  v_tierce_cap := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'tierceCapConfig';

  IF v_glass_standard IS NOT NULL THEN
    v_new_value := NULLIF(p_vehicle_data->>'new_value', '')::numeric;
    IF v_new_value IS NULL THEN
      v_new_value := NULLIF(p_vehicle_data->>'sum_insured', '')::numeric;
    END IF;

    IF v_new_value IS NOT NULL AND v_new_value > 0 THEN
      v_glass_rate := COALESCE((v_glass_standard->>'ratePercent')::numeric, 0) / 100;
      IF v_glass_rate > 0 THEN
        v_premium := v_new_value * v_glass_rate;
        RETURN GREATEST(COALESCE(v_premium, 0), 0);
      END IF;
    END IF;
  END IF;

  IF v_glass IS NOT NULL THEN
    v_sum_insured := NULLIF(p_vehicle_data->>'new_value', '')::numeric;
    IF v_sum_insured IS NULL THEN
      v_sum_insured := NULLIF(p_vehicle_data->>'sum_insured', '')::numeric;
    END IF;

    IF v_sum_insured IS NOT NULL AND v_sum_insured > 0 THEN
      v_glass_rate := COALESCE((v_glass->>'ratePercent')::numeric, 0) / 100;
      IF v_glass_rate > 0 THEN
        v_premium := v_sum_insured * v_glass_rate;
        RETURN GREATEST(COALESCE(v_premium, 0), 0);
      END IF;
    END IF;
  END IF;

  IF v_tierce_cap IS NOT NULL THEN
    v_new_value := NULLIF(p_vehicle_data->>'new_value', '')::numeric;
    IF v_new_value IS NULL THEN
      v_new_value := NULLIF(p_vehicle_data->>'sum_insured', '')::numeric;
    END IF;

    IF v_new_value IS NOT NULL AND v_new_value > 0 THEN
      v_selected_type := COALESCE(v_tierce_cap->>'selectedOption', 'NONE');

      SELECT option_elem
      INTO v_tierce_option
      FROM jsonb_array_elements(v_tierce_cap->'options') AS option_elem
      WHERE option_elem->>'type' = v_selected_type
      LIMIT 1;

      IF v_tierce_option IS NULL THEN
        SELECT option_elem
        INTO v_tierce_option
        FROM jsonb_array_elements(v_tierce_cap->'options') AS option_elem
        WHERE option_elem->>'type' = 'NONE'
        LIMIT 1;
      END IF;

      IF v_tierce_option IS NOT NULL THEN
        v_tierce_rate := COALESCE((v_tierce_option->>'ratePercent')::numeric, 0) / 100;
        v_tierce_deduction := COALESCE((v_tierce_option->>'deductionPercent')::numeric, 0) / 100;
        v_premium := v_new_value * v_tierce_rate * (1 - v_tierce_deduction);
        RETURN GREATEST(COALESCE(v_premium, 0), 0);
      END IF;
    END IF;
  END IF;

  IF v_fire_theft IS NOT NULL THEN
    v_sum_insured := NULLIF(p_vehicle_data->>'sum_insured', '')::numeric;
    IF v_sum_insured IS NULL THEN
      v_sum_insured := NULLIF(p_vehicle_data->>'new_value', '')::numeric;
    END IF;

    IF v_sum_insured IS NULL OR v_sum_insured <= 0 THEN
      RETURN 0;
    END IF;

    v_fire_rate := COALESCE((v_fire_theft->>'fireRatePercent')::numeric, 0) / 100;
    v_theft_rate_low := COALESCE((v_fire_theft->>'theftRateBelowThresholdPercent')::numeric, 0) / 100;
    v_theft_rate_high := COALESCE((v_fire_theft->>'theftRateAboveThresholdPercent')::numeric, 0) / 100;
    v_armed_rate_low := COALESCE((v_fire_theft->>'armedTheftRateBelowThresholdPercent')::numeric, 0) / 100;
    v_armed_rate_high := COALESCE((v_fire_theft->>'armedTheftRateAboveThresholdPercent')::numeric, 0) / 100;
    v_threshold := COALESCE((v_fire_theft->>'sumInsuredThreshold')::numeric, 25000000);
    v_include_fire := COALESCE((v_fire_theft->>'includeFireComponent')::boolean, TRUE);
    v_include_base := COALESCE((v_fire_theft->>'includeBaseTheftComponent')::boolean, TRUE);
    v_include_armed := COALESCE((v_fire_theft->>'includeArmedTheftComponent')::boolean, FALSE);

    IF v_threshold IS NULL OR v_threshold <= 0 THEN
      v_threshold := 25000000;
    END IF;

    v_total_rate := 0;
    IF v_include_fire THEN
      v_total_rate := v_total_rate + v_fire_rate;
    END IF;

    IF v_include_base THEN
      v_total_rate := v_total_rate + CASE
        WHEN v_sum_insured <= v_threshold THEN v_theft_rate_low
        ELSE v_theft_rate_high
      END;
    END IF;

    IF v_include_armed THEN
      v_total_rate := v_total_rate + CASE
        WHEN v_sum_insured <= v_threshold THEN v_armed_rate_low
        ELSE v_armed_rate_high
      END;
    END IF;

    v_premium := v_sum_insured * v_total_rate;

    RETURN GREATEST(COALESCE(v_premium, 0), 0);
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
