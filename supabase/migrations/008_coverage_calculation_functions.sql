-- Advanced calculation functions for coverage-based premium calculation

-- Function to calculate premium for a specific coverage
CREATE OR REPLACE FUNCTION public.calculate_coverage_premium(
  p_coverage_id text,
  p_vehicle_data jsonb,
  p_quote_data jsonb DEFAULT '{}'::jsonb
)
RETURNS numeric AS $$
DECLARE
  v_coverage record;
  v_rule record;
  v_premium numeric := 0;
  v_si bigint; -- Sum Insured
  v_vn bigint; -- Valeur à Neuf
  v_fiscal_power integer;
  v_fuel_type text;
  v_vehicle_category text;
  v_formula_name text;
BEGIN
  -- Get coverage details
  SELECT * INTO v_coverage FROM public.coverages WHERE id = p_coverage_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coverage % not found or inactive', p_coverage_id;
  END IF;

  -- Extract vehicle data
  v_si := COALESCE((p_vehicle_data->>'sum_insured')::bigint, 0);
  v_vn := COALESCE((p_vehicle_data->>'new_value')::bigint, 0);
  v_fiscal_power := COALESCE((p_vehicle_data->>'fiscal_power')::integer, 0);
  v_fuel_type := COALESCE(p_vehicle_data->>'fuel_type', 'essence');
  v_vehicle_category := COALESCE(p_vehicle_data->>'category', '401');
  v_formula_name := COALESCE(p_vehicle_data->>'formula_name', (p_quote_data->>'formula_name'));

  -- Handle different calculation types
  CASE v_coverage.calculation_type
    WHEN 'FREE' THEN
      v_premium := 0;

    WHEN 'FIXED_AMOUNT' THEN
      -- Get fixed amount rule
      SELECT * INTO v_rule FROM public.coverage_tariff_rules
      WHERE coverage_id = p_coverage_id
        AND is_active = true
        AND (formula_name IS NULL OR formula_name = v_formula_name OR
             (formula_name = 'basic' AND v_formula_name IS NULL))
      LIMIT 1;

      IF FOUND THEN
        v_premium := v_rule.fixed_amount;
      END IF;

    WHEN 'PERCENTAGE_SI' THEN
      -- Get percentage rule based on SI value
      SELECT * INTO v_rule FROM public.coverage_tariff_rules
      WHERE coverage_id = p_coverage_id
        AND is_active = true
        AND (min_vehicle_value IS NULL OR v_si >= min_vehicle_value)
        AND (max_vehicle_value IS NULL OR v_si <= max_vehicle_value)
      LIMIT 1;

      IF FOUND THEN
        v_premium := v_si * v_rule.base_rate;

        -- Apply min/max amounts
        IF v_rule.min_amount IS NOT NULL THEN
          v_premium := GREATEST(v_premium, v_rule.min_amount);
        END IF;
        IF v_rule.max_amount IS NOT NULL THEN
          v_premium := LEAST(v_premium, v_rule.max_amount);
        END IF;
      END IF;

    WHEN 'PERCENTAGE_VN' THEN
      -- Get percentage rule based on VN value
      SELECT * INTO v_rule FROM public.coverage_tariff_rules
      WHERE coverage_id = p_coverage_id
        AND is_active = true
        AND (min_vehicle_value IS NULL OR v_vn >= min_vehicle_value)
        AND (max_vehicle_value IS NULL OR v_vn <= max_vehicle_value)
      LIMIT 1;

      IF FOUND THEN
        v_premium := v_vn * v_rule.base_rate;

        -- Apply conditions for tierce plafonnée
        IF v_coverage.type IN ('TIERCE_COMPLETE_PLAFONNEE', 'TIERCE_COLLISION_PLAFONNEE') THEN
          -- Apply franchise reduction if applicable
          IF (v_rule.conditions->>'franchise')::bigint > 0 THEN
            v_premium := v_premium * (1 - (v_rule.conditions->>'reduction')::numeric);
          END IF;
        END IF;

        -- Apply min/max amounts
        IF v_rule.min_amount IS NOT NULL THEN
          v_premium := GREATEST(v_premium, v_rule.min_amount);
        END IF;
        IF v_rule.max_amount IS NOT NULL THEN
          v_premium := LEAST(v_premium, v_rule.max_amount);
        END IF;
      END IF;

    WHEN 'MTPL_TARIFF' THEN
      -- Get MTPL tariff based on fiscal power and fuel type
      SELECT base_premium INTO v_premium FROM public.mtpl_tariffs
      WHERE vehicle_category = v_vehicle_category::vehicle_category
        AND fiscal_power = v_fiscal_power
        AND fuel_type = v_fuel_type
        AND is_active = true;

      IF v_premium IS NULL THEN
        -- Fallback to nearest fiscal power
        SELECT base_premium INTO v_premium FROM public.mtpl_tariffs
        WHERE vehicle_category = v_vehicle_category::vehicle_category
          AND fiscal_power <= v_fiscal_power
          AND fuel_type = v_fuel_type
          AND is_active = true
        ORDER BY fiscal_power DESC
        LIMIT 1;
      END IF;

    WHEN 'FORMULA_BASED' THEN
      -- Get formula-based rule
      SELECT * INTO v_rule FROM public.coverage_tariff_rules
      WHERE coverage_id = p_coverage_id
        AND is_active = true
        AND formula_name = v_formula_name
      LIMIT 1;

      IF FOUND THEN
        v_premium := v_rule.fixed_amount;
      END IF;

    ELSE
      RAISE EXCEPTION 'Unsupported calculation type: %', v_coverage.calculation_type;
  END CASE;

  RETURN COALESCE(v_premium, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total premium for a quote
CREATE OR REPLACE FUNCTION public.calculate_quote_total_premium(quote_id_param uuid)
RETURNS numeric AS $$
DECLARE
  v_quote record;
  v_total_premium numeric := 0;
  v_coverage_premium numeric;
  v_coverage record;
BEGIN
  -- Get quote data
  SELECT * INTO v_quote FROM public.quotes WHERE id = quote_id_param;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % not found', quote_id_param;
  END IF;

  -- Calculate premium for each coverage in the quote
  FOR v_coverage IN
    SELECT coverage_id FROM public.quote_coverage_premiums
    WHERE quote_id = quote_id_param AND is_included = true
  LOOP
    SELECT premium_amount INTO v_coverage_premium
    FROM public.quote_coverage_premiums
    WHERE quote_id = quote_id_param AND coverage_id = v_coverage.coverage_id;

    v_total_premium := v_total_premium + v_coverage_premium;
  END LOOP;

  RETURN v_total_premium;
END;
$$ LANGUAGE plpgsql;

-- Function to update quote coverage premiums
CREATE OR REPLACE FUNCTION public.update_quote_coverage_premiums(p_quote_id uuid)
RETURNS void AS $$
DECLARE
  v_quote record;
  v_coverage record;
  v_premium numeric;
  v_calculation_params jsonb;
BEGIN
  -- Get quote data
  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % not found', p_quote_id;
  END IF;

  -- Update premiums for all coverages in the quote
  FOR v_coverage IN
    SELECT * FROM public.quote_coverage_premiums
    WHERE quote_id = p_quote_id
  LOOP
    -- Merge vehicle data from quote and coverage-specific parameters
    v_calculation_params := v_quote.vehicle_data || v_coverage.calculation_parameters;

    -- Calculate new premium
    v_premium := public.calculate_coverage_premium(
      v_coverage.coverage_id,
      v_calculation_params,
      jsonb_build_object('formula_name', (v_coverage.calculation_parameters->>'formula_name'))
    );

    -- Update the premium
    UPDATE public.quote_coverage_premiums
    SET premium_amount = v_premium,
        updated_at = now()
    WHERE id = v_coverage.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to add coverage to quote
CREATE OR REPLACE FUNCTION public.add_coverage_to_quote(
  p_quote_id uuid,
  p_coverage_id text,
  p_calculation_parameters jsonb DEFAULT '{}'::jsonb,
  p_is_included boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
  v_quote record;
  v_coverage record;
  v_premium numeric;
  v_new_premium_id uuid;
BEGIN
  -- Validate quote exists
  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % not found', p_quote_id;
  END IF;

  -- Validate coverage exists
  SELECT * INTO v_coverage FROM public.coverages WHERE id = p_coverage_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coverage % not found or inactive', p_coverage_id;
  END IF;

  -- Check if coverage already exists for this quote
  IF EXISTS (SELECT 1 FROM public.quote_coverage_premiums
             WHERE quote_id = p_quote_id AND coverage_id = p_coverage_id) THEN
    -- Update existing coverage
    UPDATE public.quote_coverage_premiums
    SET calculation_parameters = p_calculation_parameters,
        is_included = p_is_included,
        updated_at = now()
    WHERE quote_id = p_quote_id AND coverage_id = p_coverage_id;

    RETURN (SELECT id FROM public.quote_coverage_premiums
            WHERE quote_id = p_quote_id AND coverage_id = p_coverage_id);
  END IF;

  -- Calculate premium
  v_premium := public.calculate_coverage_premium(
    p_coverage_id,
    v_quote.vehicle_data || p_calculation_parameters,
    p_calculation_parameters
  );

  -- Insert new coverage premium
  INSERT INTO public.quote_coverage_premiums (
    quote_id,
    coverage_id,
    calculation_parameters,
    premium_amount,
    is_included
  ) VALUES (
    p_quote_id,
    p_coverage_id,
    p_calculation_parameters,
    v_premium,
    p_is_included
  ) RETURNING id INTO v_new_premium_id;

  RETURN v_new_premium_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get available coverage options for a vehicle category
CREATE OR REPLACE FUNCTION public.get_available_coverages(p_vehicle_category text)
RETURNS TABLE (
  coverage_id text,
  coverage_type coverage_type,
  name text,
  description text,
  calculation_type calculation_type,
  is_mandatory boolean,
  estimated_min_premium numeric,
  estimated_max_premium numeric,
  available_formulas jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.type,
    c.name,
    c.description,
    c.calculation_type,
    c.is_mandatory,
    MIN(CASE WHEN tr.fixed_amount IS NOT NULL THEN tr.fixed_amount ELSE tr.min_amount END) as estimated_min_premium,
    MAX(CASE WHEN tr.fixed_amount IS NOT NULL THEN tr.fixed_amount ELSE tr.max_amount END) as estimated_max_premium,
    jsonb_agg(DISTINCT tr.formula_name ORDER BY tr.formula_name) FILTER (WHERE tr.formula_name IS NOT NULL) as available_formulas
  FROM public.coverages c
  LEFT JOIN public.coverage_tariff_rules tr ON c.id = tr.coverage_id AND tr.is_active = true
  WHERE c.is_active = true
  GROUP BY c.id, c.type, c.name, c.description, c.calculation_type, c.is_mandatory
  ORDER BY c.display_order;
END;
$$ LANGUAGE plpgsql;