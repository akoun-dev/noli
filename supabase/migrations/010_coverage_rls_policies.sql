-- Row Level Security policies for the coverage-based tarification system

-- Enable RLS on all new tables
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_tariff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtpl_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tcm_tcl_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_coverage_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_coverage_premiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_coverage_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for coverages table
CREATE POLICY "Anyone can view active coverages" ON public.coverages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coverages" ON public.coverages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Policies for coverage_tariff_rules table
CREATE POLICY "Anyone can view active tariff rules" ON public.coverage_tariff_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tariff rules" ON public.coverage_tariff_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Policies for mtpl_tariffs table
CREATE POLICY "Anyone can view active MTPL tariffs" ON public.mtpl_tariffs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage MTPL tariffs" ON public.mtpl_tariffs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Policies for tcm_tcl_rates table
CREATE POLICY "Anyone can view active TCM/TCL rates" ON public.tcm_tcl_rates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage TCM/TCL rates" ON public.tcm_tcl_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Policies for offer_coverage_templates table
CREATE POLICY "Anyone can view offer coverage templates" ON public.offer_coverage_templates
  FOR SELECT USING (true);

CREATE POLICY "Insurers can manage their offer templates" ON public.offer_coverage_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.insurance_offers io
      WHERE io.id = offer_coverage_templates.offer_id
        AND io.insurer_id = (
          SELECT insurer_id FROM public.profiles
          WHERE profiles.id = auth.uid()
        )
    )
  );

CREATE POLICY "Admins can manage all offer templates" ON public.offer_coverage_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Policies for quote_coverage_premiums table
CREATE POLICY "Users can view their own quote premiums" ON public.quote_coverage_premiums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_coverage_premiums.quote_id
        AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Insurers can view quote premiums for their offers" ON public.quote_coverage_premiums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.insurance_offers io ON q.category_id = io.category_id
      WHERE q.id = quote_coverage_premiums.quote_id
        AND io.insurer_id = (
          SELECT insurer_id FROM public.profiles
          WHERE profiles.id = auth.uid()
        )
    )
  );

CREATE POLICY "Admins can view all quote premiums" ON public.quote_coverage_premiums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Users can manage their own quote premiums" ON public.quote_coverage_premiums
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_coverage_premiums.quote_id
        AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create quote premiums" ON public.quote_coverage_premiums
  FOR INSERT WITH CHECK (true);

-- Policies for offer_coverage_mappings table
CREATE POLICY "Anyone can view offer coverage mappings" ON public.offer_coverage_mappings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage offer coverage mappings" ON public.offer_coverage_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Grant permissions
GRANT SELECT ON public.coverages TO authenticated;
GRANT SELECT ON public.coverage_tariff_rules TO authenticated;
GRANT SELECT ON public.mtpl_tariffs TO authenticated;
GRANT SELECT ON public.tcm_tcl_rates TO authenticated;
GRANT SELECT ON public.offer_coverage_templates TO authenticated;
GRANT SELECT ON public.quote_coverage_premiums TO authenticated;
GRANT SELECT ON public.offer_coverage_mappings TO authenticated;

GRANT ALL ON public.coverages TO authenticated;
GRANT ALL ON public.coverage_tariff_rules TO authenticated;
GRANT ALL ON public.mtpl_tariffs TO authenticated;
GRANT ALL ON public.tcm_tcl_rates TO authenticated;
GRANT ALL ON public.offer_coverage_templates TO authenticated;
GRANT ALL ON public.quote_coverage_premiums TO authenticated;
GRANT ALL ON public.offer_coverage_mappings TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.calculate_coverage_premium TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_quote_total_premium TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_quote_coverage_premiums TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_coverage_to_quote TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_coverages TO authenticated;

-- Create indexes for performance
CREATE INDEX idx_coverage_tariff_rules_coverage_id ON public.coverage_tariff_rules(coverage_id);
CREATE INDEX idx_coverage_tariff_rules_vehicle_category ON public.coverage_tariff_rules(vehicle_category) WHERE vehicle_category IS NOT NULL;
CREATE INDEX idx_coverage_tariff_rules_formula_name ON public.coverage_tariff_rules(formula_name) WHERE formula_name IS NOT NULL;
CREATE INDEX idx_coverage_tariff_rules_is_active ON public.coverage_tariff_rules(is_active);

CREATE INDEX idx_mtpl_tariffs_vehicle_category ON public.mtpl_tariffs(vehicle_category);
CREATE INDEX idx_mtpl_tariffs_fiscal_power ON public.mtpl_tariffs(fiscal_power);
CREATE INDEX idx_mtpl_tariffs_fuel_type ON public.mtpl_tariffs(fuel_type);
CREATE INDEX idx_mtpl_tariffs_is_active ON public.mtpl_tariffs(is_active);

CREATE INDEX idx_tcm_tcl_rates_vehicle_category ON public.tcm_tcl_rates(vehicle_category);
CREATE INDEX idx_tcm_tcl_rates_coverage_type ON public.tcm_tcl_rates(coverage_type);
CREATE INDEX idx_tcm_tcl_rates_deductible_level ON public.tcm_tcl_rates(deductible_level);
CREATE INDEX idx_tcm_tcl_rates_is_active ON public.tcm_tcl_rates(is_active);

CREATE INDEX idx_offer_coverage_templates_offer_id ON public.offer_coverage_templates(offer_id);
CREATE INDEX idx_offer_coverage_templates_coverage_id ON public.offer_coverage_templates(coverage_id);
CREATE INDEX idx_offer_coverage_templates_is_included ON public.offer_coverage_templates(is_included);

CREATE INDEX idx_quote_coverage_premiums_quote_id ON public.quote_coverage_premiums(quote_id);
CREATE INDEX idx_quote_coverage_premiums_coverage_id ON public.quote_coverage_premiums(coverage_id);
CREATE INDEX idx_quote_coverage_premiums_is_included ON public.quote_coverage_premiums(is_included);
CREATE INDEX idx_quote_coverage_premiums_premium_amount ON public.quote_coverage_premiums(premium_amount);

CREATE INDEX idx_offer_coverage_mappings_offer_id ON public.offer_coverage_mappings(offer_id);
CREATE INDEX idx_offer_coverage_mappings_coverage_id ON public.offer_coverage_mappings(coverage_id);
CREATE INDEX idx_offer_coverage_mappings_confidence_score ON public.offer_coverage_mappings(confidence_score);

-- GIN indexes for JSONB columns
CREATE INDEX idx_coverage_tariff_rules_conditions_gin ON public.coverage_tariff_rules USING gin(conditions);
CREATE INDEX idx_quote_coverage_premiums_calculation_params_gin ON public.quote_coverage_premiums USING gin(calculation_parameters);
CREATE INDEX idx_offer_coverage_templates_formula_params_gin ON public.offer_coverage_templates USING gin(formula_parameters);