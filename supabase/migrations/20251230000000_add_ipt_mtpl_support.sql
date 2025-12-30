-- Migration: Add IPT_PLACES_FORMULA, IC_IPT_FORMULA, and MTPL_TARIFF support to calculate_coverage_premium
-- This enables the RPC to correctly calculate premiums for these methods using metadata parameters

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
  v_ipt_config jsonb;
  v_ic_ipt_config jsonb;
  v_mtpl_tariff jsonb;
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
  v_seats integer;
  v_formula_number integer;
  v_formula jsonb;
  v_places_tariff jsonb;
  v_places_tariffs jsonb;
  v_category text;
  v_fiscal_power integer;
  v_fuel text;
  v_formula_key text;
BEGIN
  SELECT *
  INTO v_coverage
  FROM public.coverages
  WHERE id = p_coverage_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Extract vehicle data
  v_category := NULLIF(p_vehicle_data->>'category', '');
  v_fiscal_power := NULLIF(p_vehicle_data->>'fiscal_power', '')::integer;
  v_fuel := NULLIF(p_vehicle_data->>'fuel_type', '');

  -- Extract configuration from metadata
  v_glass_standard := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'glassStandardConfig';
  v_glass := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'glassRoofConfig';
  v_fire_theft := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'fireTheftConfig';
  v_tierce_cap := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'tierceCapConfig';
  v_ipt_config := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'iptConfig';
  v_ic_ipt_config := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'icIptConfig';
  v_mtpl_tariff := COALESCE(v_coverage.metadata, '{}'::jsonb) -> 'parameters' -> 'mtplTariffConfig';

  -- GLASS_STANDARD calculation
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

  -- GLASS_ROOF calculation
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

  -- TIERCE_CAP calculation
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

  -- FIRE_THEFT calculation
  IF v_fire_theft IS NOT NULL THEN
    v_sum_insured := NULLIF(p_vehicle_data->>'sum_insured', '')::numeric;
    IF v_sum_insured IS NULL THEN
      v_sum_insured := NULLIF(p_vehicle_data->>'new_value', '')::numeric;
    END IF;

    IF v_sum_insured IS NULL OR v_sum_insured <= 0 THEN
      -- Continue to check other calculation methods
      NULL;
    ELSE
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
  END IF;

  -- IPT_PLACES_FORMULA calculation (Individuelle Personnes Transportées)
  IF v_ipt_config IS NOT NULL THEN
    -- Extract seats from vehicle data (multiple possible field names)
    v_seats := NULLIF(p_vehicle_data->>'seats', '')::integer;
    IF v_seats IS NULL THEN
      v_seats := NULLIF(p_vehicle_data->>'passenger_seats', '')::integer;
    END IF;
    IF v_seats IS NULL THEN
      v_seats := NULLIF(p_vehicle_data->>'nb_places', '')::integer;
    END IF;
    IF v_seats IS NULL THEN
      v_seats := 5; -- Default fallback
    END IF;

    -- Extract formula number from vehicle data or use default
    v_formula_number := NULLIF(p_vehicle_data->>'formula_name', '')::integer;
    IF v_formula_number IS NULL THEN
      v_formula_number := COALESCE((v_ipt_config->>'defaultFormula')::integer, 1);
    END IF;

    -- Find the matching formula in the configuration
    FOR v_formula IN
      SELECT * FROM jsonb_array_elements(COALESCE(v_ipt_config->'formulas', '[]'::jsonb))
    LOOP
      IF (v_formula->>'formula')::integer = v_formula_number THEN
        v_places_tariffs := v_formula->'placesTariffs';

        -- Find the applicable tariff for the number of seats
        -- Find the first tariff where places >= seats
        FOR v_places_tariff IN
          SELECT *
          FROM jsonb_array_elements(COALESCE(v_places_tariffs, '[]'::jsonb))
          ORDER BY (value->>'places')::integer ASC
        LOOP
          IF (v_places_tariff->>'places')::integer >= v_seats THEN
            v_premium := (v_places_tariff->>'prime')::numeric;
            RETURN GREATEST(COALESCE(v_premium, 0), 0);
          END IF;
        END LOOP;

        -- If no exact match found, use the highest places tariff
        IF v_premium = 0 THEN
          FOR v_places_tariff IN
            SELECT *
            FROM jsonb_array_elements(COALESCE(v_places_tariffs, '[]'::jsonb))
            ORDER BY (value->>'places')::integer DESC
            LIMIT 1
          LOOP
            v_premium := (v_places_tariff->>'prime')::numeric;
          END LOOP;
        END IF;

        RETURN GREATEST(COALESCE(v_premium, 0), 0);
      END IF;
    END LOOP;
  END IF;

  -- IC_IPT_FORMULA calculation (Individuelle Conducteur)
  IF v_ic_ipt_config IS NOT NULL THEN
    -- Extract formula number from vehicle data or use default
    v_formula_number := NULLIF(p_vehicle_data->>'formula_name', '')::integer;
    IF v_formula_number IS NULL THEN
      v_formula_number := COALESCE((v_ic_ipt_config->>'defaultFormula')::integer, 1);
    END IF;

    -- Find the matching formula in the configuration
    FOR v_formula IN
      SELECT * FROM jsonb_array_elements(COALESCE(v_ic_ipt_config->'formulas', '[]'::jsonb))
    LOOP
      IF (v_formula->>'formula')::integer = v_formula_number THEN
        v_premium := (v_formula->>'prime')::numeric;
        RETURN GREATEST(COALESCE(v_premium, 0), 0);
      END IF;
    END LOOP;
  END IF;

  -- MTPL_TARIFF calculation (Responsabilité Civile)
  IF v_mtpl_tariff IS NOT NULL THEN
    -- Determine the tariff key based on fuel type and fiscal power
    IF v_fuel IS NOT NULL AND v_fiscal_power IS NOT NULL THEN
      v_formula_key := CASE
        WHEN LOWER(v_fuel) LIKE '%essence%' OR LOWER(v_fuel) LIKE '%ess%' THEN
          CASE
            WHEN v_fiscal_power <= 2 THEN 'essence_1_2'
            WHEN v_fiscal_power <= 6 THEN 'essence_3_6'
            WHEN v_fiscal_power <= 9 THEN 'essence_7_9'
            WHEN v_fiscal_power <= 11 THEN 'essence_10_11'
            ELSE 'essence_12_plus'
          END
        WHEN LOWER(v_fuel) LIKE '%diesel%' OR LOWER(v_fuel) LIKE '%gasoil%' THEN
          CASE
            WHEN v_fiscal_power = 1 THEN 'diesel_1'
            WHEN v_fiscal_power <= 4 THEN 'diesel_2_4'
            WHEN v_fiscal_power <= 6 THEN 'diesel_5_6'
            WHEN v_fiscal_power <= 8 THEN 'diesel_7_8'
            ELSE 'diesel_9_plus'
          END
        ELSE NULL
      END;

      IF v_formula_key IS NOT NULL THEN
        v_premium := (v_mtpl_tariff->>v_formula_key)::numeric;
        RETURN GREATEST(COALESCE(v_premium, 0), 0);
      END IF;
    END IF;
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

-- Also update add_coverage_to_quote to ensure seats are included in vehicle_data
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
  v_enhanced_vehicle_data jsonb;
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

  -- Merge calculation_parameters into vehicle_data for IPT_PLACES_FORMULA support
  -- This ensures formula_name and other parameters are available
  v_enhanced_vehicle_data := COALESCE(v_vehicle_data, '{}'::jsonb);

  -- Add seats from calculation_parameters if present
  IF p_calculation_parameters ? 'seats' AND NOT (v_enhanced_vehicle_data ? 'seats') THEN
    v_enhanced_vehicle_data := v_enhanced_vehicle_data || jsonb_build_object('seats', p_calculation_parameters->>'seats');
  END IF;

  -- Add formula_name from calculation_parameters if present
  IF p_calculation_parameters ? 'formula_name' AND NOT (v_enhanced_vehicle_data ? 'formula_name') THEN
    v_enhanced_vehicle_data := v_enhanced_vehicle_data || jsonb_build_object('formula_name', p_calculation_parameters->>'formula_name');
  END IF;

  -- Add passenger_seats and nb_places for compatibility
  IF p_calculation_parameters ? 'seats' THEN
    IF NOT (v_enhanced_vehicle_data ? 'passenger_seats') THEN
      v_enhanced_vehicle_data := v_enhanced_vehicle_data || jsonb_build_object('passenger_seats', p_calculation_parameters->>'seats');
    END IF;
    IF NOT (v_enhanced_vehicle_data ? 'nb_places') THEN
      v_enhanced_vehicle_data := v_enhanced_vehicle_data || jsonb_build_object('nb_places', p_calculation_parameters->>'seats');
    END IF;
  END IF;

  v_premium := public.calculate_coverage_premium(
    p_coverage_id,
    v_enhanced_vehicle_data,
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
