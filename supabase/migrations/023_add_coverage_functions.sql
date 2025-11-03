-- Add RPC functions for coverage management
-- These functions are used by the coverage selector and other components

-- Function to get available coverages (simple version)
CREATE OR REPLACE FUNCTION get_available_coverages()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  calculation_type TEXT,
  is_active BOOLEAN,
  is_mandatory BOOLEAN,
  fixed_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.calculation_type::text,
    c.is_active,
    c.is_mandatory,
    (SELECT cr.fixed_amount
     FROM coverage_tariff_rules cr
     WHERE cr.coverage_id = c.id
       AND cr.fixed_amount IS NOT NULL
       AND cr.is_active = true
     LIMIT 1) as fixed_amount
  FROM coverages c
  WHERE c.is_active = true
  ORDER BY c.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the function with parameters if it exists to avoid conflicts
DROP FUNCTION IF EXISTS get_available_coverages(p_vehicle_category text, p_vehicle_value bigint, p_fiscal_power integer, p_fuel_type text);

-- Function to calculate coverage premium
CREATE OR REPLACE FUNCTION calculate_coverage_premium(
  p_coverage_id TEXT,
  p_vehicle_category TEXT,
  p_vehicle_value BIGINT,
  p_fiscal_power INTEGER,
  p_fuel_type TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_premium NUMERIC;
BEGIN
  -- Simple calculation: return fixed_amount if available, otherwise 0
  SELECT COALESCE(cr.fixed_amount, 0) INTO v_premium
  FROM coverage_tariff_rules cr
  WHERE cr.coverage_id = p_coverage_id
    AND cr.is_active = true
    AND cr.fixed_amount IS NOT NULL
  LIMIT 1;

  RETURN v_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop function with parameters if it exists to avoid conflicts
DROP FUNCTION IF EXISTS calculate_coverage_premium(p_vehicle_category text, p_vehicle_value bigint, p_fiscal_power integer, p_fuel_type text, p_coverage_id text);

-- Grant execute permission to all users (development only)
GRANT EXECUTE ON FUNCTION get_available_coverages() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_coverages() TO anon;
GRANT EXECUTE ON FUNCTION get_available_coverages() TO public;
GRANT EXECUTE ON FUNCTION calculate_coverage_premium() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_coverage_premium() TO anon;
GRANT EXECUTE ON FUNCTION calculate_coverage_premium() TO public;