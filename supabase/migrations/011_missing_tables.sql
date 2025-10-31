-- Migration: Missing tables and functions for coverage-based tarification system

-- Create offer_coverage_mappings table referenced in RLS policies
CREATE TABLE IF NOT EXISTS public.offer_coverage_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  offer_id text NOT NULL REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  coverage_id text NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
  confidence_score numeric DEFAULT 1.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offer_coverage_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT offer_coverage_mappings_unique UNIQUE (offer_id, coverage_id)
);

-- Create function for calculating coverage premium
CREATE OR REPLACE FUNCTION public.calculate_coverage_premium(
  coverage_id_param text,
  vehicle_value_param bigint DEFAULT NULL,
  vehicle_category_param text DEFAULT NULL,
  fiscal_power_param integer DEFAULT NULL,
  fuel_type_param text DEFAULT NULL,
  formula_name_param text DEFAULT NULL
)
RETURNS TABLE (
  premium_amount numeric,
  calculation_method text,
  applied_rule_id uuid
) AS $$
DECLARE
  coverage_record RECORD;
  tariff_rule RECORD;
  mtpl_tariff RECORD;
  tcm_tcl_rate RECORD;
  calculated_premium numeric;
BEGIN
  -- Get coverage information
  SELECT * INTO coverage_record 
  FROM public.coverages 
  WHERE id = coverage_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate premium based on calculation type
  CASE coverage_record.calculation_type
    WHEN 'FIXED_AMOUNT' THEN
      SELECT * INTO tariff_rule 
      FROM public.coverage_tariff_rules 
      WHERE coverage_id = coverage_id_param 
        AND is_active = true 
        AND fixed_amount IS NOT NULL
      LIMIT 1;
      
      IF FOUND THEN
        calculated_premium := tariff_rule.fixed_amount;
      END IF;
      
    WHEN 'PERCENTAGE_SI' THEN
      SELECT * INTO tariff_rule 
      FROM public.coverage_tariff_rules 
      WHERE coverage_id = coverage_id_param 
        AND is_active = true 
        AND base_rate IS NOT NULL
        AND (min_vehicle_value IS NULL OR vehicle_value_param >= min_vehicle_value)
        AND (max_vehicle_value IS NULL OR vehicle_value_param <= max_vehicle_value)
      LIMIT 1;
      
      IF FOUND THEN
        calculated_premium := vehicle_value_param * tariff_rule.base_rate;
      END IF;
      
    WHEN 'PERCENTAGE_VN' THEN
      SELECT * INTO tariff_rule 
      FROM public.coverage_tariff_rules 
      WHERE coverage_id = coverage_id_param 
        AND is_active = true 
        AND base_rate IS NOT NULL
        AND (min_vehicle_value IS NULL OR vehicle_value_param >= min_vehicle_value)
        AND (max_vehicle_value IS NULL OR vehicle_value_param <= max_vehicle_value)
      LIMIT 1;
      
      IF FOUND THEN
        calculated_premium := vehicle_value_param * tariff_rule.base_rate;
      END IF;
      
    WHEN 'MTPL_TARIFF' THEN
      SELECT * INTO mtpl_tariff 
      FROM public.mtpl_tariffs 
      WHERE vehicle_category = vehicle_category_param::public.vehicle_category
        AND fiscal_power = fiscal_power_param
        AND fuel_type = fuel_type_param
        AND is_active = true
      LIMIT 1;
      
      IF FOUND THEN
        calculated_premium := mtpl_tariff.base_premium;
      END IF;
      
    WHEN 'FORMULA_BASED' THEN
      SELECT * INTO tariff_rule 
      FROM public.coverage_tariff_rules 
      WHERE coverage_id = coverage_id_param 
        AND is_active = true 
        AND formula_name = formula_name_param
      LIMIT 1;
      
      IF FOUND THEN
        calculated_premium := COALESCE(tariff_rule.fixed_amount, 0);
      END IF;
      
    WHEN 'FREE' THEN
      calculated_premium := 0;
      
    ELSE
      -- Default calculation for unknown types
      calculated_premium := 0;
  END CASE;
  
  -- Ensure minimum premium
  SELECT * INTO tariff_rule 
  FROM public.coverage_tariff_rules 
  WHERE coverage_id = coverage_id_param 
    AND is_active = true;
  
  IF FOUND AND tariff_rule.min_amount IS NOT NULL THEN
    calculated_premium := GREATEST(calculated_premium, tariff_rule.min_amount);
  END IF;
  
  -- Ensure maximum premium
  IF FOUND AND tariff_rule.max_amount IS NOT NULL THEN
    calculated_premium := LEAST(calculated_premium, tariff_rule.max_amount);
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(calculated_premium, 0) as premium_amount,
    coverage_record.calculation_type as calculation_method,
    tariff_rule.id as applied_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for calculating quote total premium
CREATE OR REPLACE FUNCTION public.calculate_quote_total_premium(quote_id_param uuid)
RETURNS numeric AS $$
DECLARE
  total_premium numeric := 0;
BEGIN
  SELECT COALESCE(SUM(premium_amount), 0) INTO total_premium
  FROM public.quote_coverage_premiums 
  WHERE quote_id = quote_id_param AND is_included = true;
  
  RETURN total_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for updating quote coverage premiums
CREATE OR REPLACE FUNCTION public.update_quote_coverage_premiums(p_quote_id uuid)
RETURNS void AS $$
DECLARE
  quote_record RECORD;
  coverage_record RECORD;
  premium_amount numeric;
BEGIN
  -- Get quote information
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Delete existing premiums for this quote
  DELETE FROM public.quote_coverage_premiums WHERE quote_id = p_quote_id;
  
  -- Calculate premiums for all active coverages
  FOR coverage_record IN 
    SELECT * FROM public.coverages WHERE is_active = true
  LOOP
    -- Calculate premium for this coverage
    SELECT premium_amount INTO premium_amount
    FROM public.calculate_coverage_premium(
      coverage_record.id,
      (quote_record.vehicle_data->>'value')::bigint,
      quote_record.vehicle_data->>'category',
      (quote_record.vehicle_data->>'fiscal_power')::integer,
      quote_record.vehicle_data->>'fuel_type',
      NULL
    );
    
    -- Insert premium record
    INSERT INTO public.quote_coverage_premiums (
      quote_id,
      coverage_id,
      premium_amount,
      is_included,
      calculation_parameters,
      created_at,
      updated_at
    ) VALUES (
      p_quote_id,
      coverage_record.id,
      premium_amount,
      coverage_record.is_mandatory,
      jsonb_build_object(
        'vehicle_value', quote_record.vehicle_data->>'value',
        'vehicle_category', quote_record.vehicle_data->>'category',
        'fiscal_power', quote_record.vehicle_data->>'fiscal_power',
        'fuel_type', quote_record.vehicle_data->>'fuel_type'
      ),
      now(),
      now()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for adding coverage to quote
CREATE OR REPLACE FUNCTION public.add_coverage_to_quote(
  p_quote_id uuid,
  p_coverage_id text,
  p_is_included boolean DEFAULT true
)
RETURNS void AS $$
DECLARE
  quote_record RECORD;
  premium_amount numeric;
BEGIN
  -- Get quote information
  SELECT * INTO quote_record
  FROM public.quotes
  WHERE id = p_quote_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate premium for this coverage
  SELECT premium_amount INTO premium_amount
  FROM public.calculate_coverage_premium(
    p_coverage_id,
    (quote_record.vehicle_data->>'value')::bigint,
    quote_record.vehicle_data->>'category',
    (quote_record.vehicle_data->>'fiscal_power')::integer,
    quote_record.vehicle_data->>'fuel_type',
    NULL
  );

  -- Insert or update premium record
  INSERT INTO public.quote_coverage_premiums (
    quote_id,
    coverage_id,
    premium_amount,
    is_included,
    calculation_parameters,
    created_at,
    updated_at
  ) VALUES (
    p_quote_id,
    p_coverage_id,
    premium_amount,
    p_is_included,
    jsonb_build_object(
      'vehicle_value', quote_record.vehicle_data->>'value',
      'vehicle_category', quote_record.vehicle_data->>'category',
      'fiscal_power', quote_record.vehicle_data->>'fiscal_power',
      'fuel_type', quote_record.vehicle_data->>'fuel_type'
    ),
    now(),
    now()
  )
  ON CONFLICT (quote_id, coverage_id) 
  DO UPDATE SET 
    premium_amount = EXCLUDED.premium_amount,
    is_included = EXCLUDED.is_included,
    calculation_parameters = EXCLUDED.calculation_parameters,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for getting available coverages
CREATE OR REPLACE FUNCTION public.get_available_coverages(
  p_vehicle_category text DEFAULT NULL,
  p_vehicle_value bigint DEFAULT NULL,
  p_fiscal_power integer DEFAULT NULL,
  p_fuel_type text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  type text,
  name text,
  description text,
  calculation_type text,
  is_mandatory boolean,
  is_active boolean,
  display_order integer,
  premium_amount numeric
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
    c.is_active,
    c.display_order,
    cp.premium_amount
  FROM public.coverages c
  LEFT JOIN LATERAL (
    SELECT premium_amount
    FROM public.calculate_coverage_premium(
      c.id,
      p_vehicle_value,
      p_vehicle_category,
      p_fiscal_power,
      p_fuel_type,
      NULL
    )
  ) cp ON true
  WHERE c.is_active = true
  ORDER BY c.display_order, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating updated_at on offer_coverage_mappings
CREATE TRIGGER update_offer_coverage_mappings_updated_at 
BEFORE UPDATE ON public.offer_coverage_mappings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for offer_coverage_mappings
CREATE INDEX IF NOT EXISTS idx_offer_coverage_mappings_offer_id ON public.offer_coverage_mappings(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_coverage_mappings_coverage_id ON public.offer_coverage_mappings(coverage_id);
CREATE INDEX IF NOT EXISTS idx_offer_coverage_mappings_confidence_score ON public.offer_coverage_mappings(confidence_score);

-- Create GIN index for JSONB columns in offer_coverage_mappings (if any)
-- CREATE INDEX IF NOT EXISTS idx_offer_coverage_mappings_metadata_gin ON public.offer_coverage_mappings USING gin(metadata);