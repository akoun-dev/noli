-- Migration: Coverage-based Tarification System
-- Implements the detailed insurance premium calculation by coverage/guarantee

-- Drop existing simple tarification_rules table (will be replaced)
DROP TABLE IF EXISTS public.tarification_rules CASCADE;

-- Create vehicle categories for tariff calculation
CREATE TYPE public.vehicle_category AS ENUM ('401', '402', '403', '404', '405');

-- Create coverage types
CREATE TYPE public.coverage_type AS ENUM (
  'RC',                    -- Responsabilité Civile
  'RECOURS_TIERS_INCENDIE', -- Recours des Tiers Incendie
  'DEFENSE_RECOURS',       -- Défense et Recours
  'IPT',                   -- Individuelle Conducteur
  'AVANCE_RECOURS',        -- Avance sur recours
  'INCENDIE',              -- Incendie
  'VOL',                   -- Vol
  'VOL_MAINS_ARMEES',      -- Vol à mains armées
  'VOL_ACCESSOIRES',       -- Vol des accessoires
  'BRIS_GLACES',           -- Bris de glaces
  'BRIS_GLACES_TOITS',     -- Extension Bris de glaces Toits ouvrants
  'TIERCE_COMPLETE',       -- Tierce complète
  'TIERCE_COMPLETE_PLAFONNEE', -- Tierce complète plafonnée
  'TIERCE_COLLISION',      -- Tierce collision
  'TIERCE_COLLISION_PLAFONNEE', -- Tierce collision plafonnée
  'ASSISTANCE_AUTO',       -- Assistance Auto
  'PACK_ASSISTANCE'        -- Packs Assistance
);

-- Create calculation types
CREATE TYPE public.calculation_type AS ENUM (
  'FIXED_AMOUNT',          -- Prime fixe
  'PERCENTAGE_SI',         -- Pourcentage du capital assuré (SI)
  'PERCENTAGE_VN',         -- Pourcentage de la valeur à neuf (VN)
  'MTPL_TARIFF',           -- MTPL tariff (puissance fiscale + carburant)
  'FORMULA_BASED',         -- Basé sur formule complexe
  'FREE'                   -- Gratuit
);

-- Create coverage definitions
CREATE TABLE public.coverages (
  id text NOT NULL,
  type coverage_type NOT NULL,
  name text NOT NULL,
  description text,
  calculation_type calculation_type NOT NULL,
  is_mandatory boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coverages_pkey PRIMARY KEY (id),
  CONSTRAINT coverages_type_unique UNIQUE (type)
);

-- Coverage calculation rules with parameters
CREATE TABLE public.coverage_tariff_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coverage_id text NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
  vehicle_category vehicle_category,
  min_vehicle_value bigint,
  max_vehicle_value bigint,
  min_fiscal_power integer,
  max_fiscal_power integer,
  fuel_type text, -- essence, diesel, etc.
  formula_name text, -- for complex formulas (e.g., 'formula_1', 'basic', 'silver')
  base_rate numeric, -- percentage rate
  fixed_amount numeric, -- fixed prime amount
  min_amount numeric CHECK (min_amount >= 0),
  max_amount numeric CHECK (max_amount >= 0),
  conditions jsonb DEFAULT '{}'::jsonb, -- additional conditions or parameters
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coverage_tariff_rules_pkey PRIMARY KEY (id)
);

-- Vehicle fiscal power and fuel type tariffs (for MTPL)
CREATE TABLE public.mtpl_tariffs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_category vehicle_category NOT NULL,
  fiscal_power integer NOT NULL,
  fuel_type text NOT NULL,
  base_premium numeric NOT NULL CHECK (base_premium > 0),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mtpl_tariffs_pkey PRIMARY KEY (id),
  CONSTRAINT mtpl_tariffs_unique UNIQUE (vehicle_category, fiscal_power, fuel_type)
);

-- TCM/TCL rates for tierce complète/collision
CREATE TABLE public.tcm_tcl_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_category vehicle_category NOT NULL,
  coverage_type coverage_type NOT NULL, -- TIERCE_COMPLETE or TIERCE_COLLISION
  rate numeric NOT NULL CHECK (rate > 0),
  deductible_level bigint, -- franchise amount (0 for no deductible)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tcm_tcl_rates_pkey PRIMARY KEY (id),
  CONSTRAINT tcm_tcl_rates_unique UNIQUE (vehicle_category, coverage_type, deductible_level)
);

-- Coverage templates for insurance offers
CREATE TABLE public.offer_coverage_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  offer_id text NOT NULL REFERENCES public.insurance_offers(id) ON DELETE CASCADE,
  coverage_id text NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
  is_included boolean DEFAULT false,
  is_optional boolean DEFAULT true,
  formula_parameters jsonb DEFAULT '{}'::jsonb, -- specific parameters for this offer
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT offer_coverage_templates_pkey PRIMARY KEY (id),
  CONSTRAINT offer_coverage_templates_unique UNIQUE (offer_id, coverage_id)
);

-- Calculated premiums for quotes/policies
CREATE TABLE public.quote_coverage_premiums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  coverage_id text NOT NULL REFERENCES public.coverages(id) ON DELETE CASCADE,
  tariff_rule_id uuid REFERENCES public.coverage_tariff_rules(id),
  calculation_parameters jsonb DEFAULT '{}'::jsonb,
  premium_amount numeric NOT NULL CHECK (premium_amount >= 0),
  is_included boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quote_coverage_premiums_pkey PRIMARY KEY (id),
  CONSTRAINT quote_coverage_premiums_unique UNIQUE (quote_id, coverage_id)
);

-- Update trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_coverages_updated_at BEFORE UPDATE ON public.coverages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coverage_tariff_rules_updated_at BEFORE UPDATE ON public.coverage_tariff_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mtpl_tariffs_updated_at BEFORE UPDATE ON public.mtpl_tariffs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tcm_tcl_rates_updated_at BEFORE UPDATE ON public.tcm_tcl_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offer_coverage_templates_updated_at BEFORE UPDATE ON public.offer_coverage_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_coverage_premiums_updated_at BEFORE UPDATE ON public.quote_coverage_premiums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();