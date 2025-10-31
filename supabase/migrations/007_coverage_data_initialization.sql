-- Initialize coverage-based tarification system with data from tarification.txt

-- Insert all coverage types
INSERT INTO public.coverages (id, type, name, description, calculation_type, is_mandatory, display_order) VALUES
('RC', 'RC', 'Responsabilité Civile', 'Responsabilité Civile Automobile (MTPL)', 'MTPL_TARIFF', true, 1),
('RECOURS_TIERS_INCENDIE', 'RECOURS_TIERS_INCENDIE', 'Recours des Tiers Incendie', 'Recours des Tiers Incendie (inclus dans RC)', 'FREE', false, 2),
('DEFENSE_RECOURS', 'DEFENSE_RECOURS', 'Défense et Recours', 'Défense et Recours', 'FIXED_AMOUNT', false, 3),
('IPT', 'IPT', 'Individuelle Conducteur / IPT', 'Individuelle Conducteur', 'FORMULA_BASED', false, 4),
('AVANCE_RECOURS', 'AVANCE_RECOURS', 'Avance sur recours', 'Avance sur recours', 'FIXED_AMOUNT', false, 5),
('INCENDIE', 'INCENDIE', 'Incendie', 'Garantie Incendie', 'PERCENTAGE_SI', false, 6),
('VOL', 'VOL', 'Vol', 'Garantie Vol', 'PERCENTAGE_SI', false, 7),
('VOL_MAINS_ARMEES', 'VOL_MAINS_ARMEES', 'Vol à mains armées', 'Garantie Vol à mains armées', 'PERCENTAGE_SI', false, 8),
('VOL_ACCESSOIRES', 'VOL_ACCESSOIRES', 'Vol des accessoires', 'Vol des accessoires', 'FIXED_AMOUNT', false, 9),
('BRIS_GLACES', 'BRIS_GLACES', 'Bris de glaces', 'Bris de glaces', 'PERCENTAGE_VN', false, 10),
('BRIS_GLACES_TOITS', 'BRIS_GLACES_TOITS', 'Extension Bris de glaces Toits ouvrants', 'Extension Bris de glaces', 'PERCENTAGE_VN', false, 11),
('TIERCE_COMPLETE', 'TIERCE_COMPLETE', 'Tierce complète', 'Tierce complète', 'PERCENTAGE_VN', false, 12),
('TIERCE_COMPLETE_PLAFONNEE', 'TIERCE_COMPLETE_PLAFONNEE', 'Tierce complète plafonnée', 'Tierce complète plafonnée', 'PERCENTAGE_VN', false, 13),
('TIERCE_COLLISION', 'TIERCE_COLLISION', 'Tierce collision', 'Tierce collision', 'PERCENTAGE_VN', false, 14),
('TIERCE_COLLISION_PLAFONNEE', 'TIERCE_COLLISION_PLAFONNEE', 'Tierce collision plafonnée', 'Tierce collision plafonnée', 'PERCENTAGE_VN', false, 15),
('ASSISTANCE_AUTO', 'ASSISTANCE_AUTO', 'Assistance Auto', 'Assistance Auto', 'FORMULA_BASED', false, 16),
('PACK_ASSISTANCE', 'PACK_ASSISTANCE', 'Packs Assistance', 'Packs Assistance (Ivory/Silver/Bronze/Gold)', 'FORMULA_BASED', false, 17);

-- Insert fixed amount coverage rules
INSERT INTO public.coverage_tariff_rules (coverage_id, fixed_amount, is_active, conditions) VALUES
('DEFENSE_RECOURS', 7950, true, '{"default": true}'),
('DEFENSE_RECOURS', 4240, true, '{"special_pack": true}'),
('AVANCE_RECOURS', 15000, true, '{}'),
('VOL_ACCESSOIRES', 15000, true, '{}');

-- Insert percentage-based coverage rules (SI)
INSERT INTO public.coverage_tariff_rules (coverage_id, base_rate, min_amount, max_amount, is_active, conditions) VALUES
-- Incendie: 0.32% to 0.42% of SI
('INCENDIE', 0.0032, 0, null, true, '{"rate_type": "min"}'),
('INCENDIE', 0.0042, 0, null, true, '{"rate_type": "max"}'),

-- Vol: 1.1% if SI ≤ 25M, 2.1% if SI > 25M
('VOL', 0.011, 0, 25000000, true, '{"condition": "si_le_25m"}'),
('VOL', 0.021, 25000001, null, true, '{"condition": "si_gt_25m"}'),

-- Vol à mains armées: 1.6% if SI ≤ 25M, 2.2% if SI > 25M
('VOL_MAINS_ARMEES', 0.016, 0, 25000000, true, '{"condition": "si_le_25m"}'),
('VOL_MAINS_ARMEES', 0.022, 25000001, null, true, '{"condition": "si_gt_25m"}');

-- Insert percentage-based coverage rules (VN)
INSERT INTO public.coverage_tariff_rules (coverage_id, base_rate, min_amount, max_amount, is_active, conditions) VALUES
-- Bris de glaces: 0.3% to 0.4% of VN
('BRIS_GLACES', 0.003, 0, null, true, '{"rate_type": "min"}'),
('BRIS_GLACES', 0.004, 0, null, true, '{"rate_type": "max"}'),

-- Extension Bris de glaces: 0.42% to 0.52% of VN
('BRIS_GLACES_TOITS', 0.0042, 0, null, true, '{"rate_type": "min"}'),
('BRIS_GLACES_TOITS', 0.0052, 0, null, true, '{"rate_type": "max"}');

-- Insert IPT formulas
INSERT INTO public.coverage_tariff_rules (coverage_id, fixed_amount, formula_name, is_active) VALUES
('IPT', 5500, 'formule_1', true),
('IPT', 8400, 'formule_2', true),
('IPT', 15900, 'formule_3', true);

-- Insert Assistance Auto formulas
INSERT INTO public.coverage_tariff_rules (coverage_id, fixed_amount, formula_name, is_active) VALUES
('ASSISTANCE_AUTO', 0, 'basic', true),
('ASSISTANCE_AUTO', 48000, 'essentiel', true),
('ASSISTANCE_AUTO', 65000, 'confort', true),
('ASSISTANCE_AUTO', 55000, 'relax', true),
('ASSISTANCE_AUTO', 80000, 'liberte', true),
('ASSISTANCE_AUTO', 85000, 'premium', true);

-- Insert Assistance Packs
INSERT INTO public.coverage_tariff_rules (coverage_id, fixed_amount, formula_name, is_active) VALUES
('PACK_ASSISTANCE', 0, 'ivory', true),
('PACK_ASSISTANCE', 65000, 'silver', true),
('PACK_ASSISTANCE', 48000, 'bronze', true),
('PACK_ASSISTANCE', 85000, 'gold', true);

-- Insert Tierce complète plafonnée rules
INSERT INTO public.coverage_tariff_rules (coverage_id, base_rate, conditions, is_active) VALUES
('TIERCE_COMPLETE_PLAFONNEE', 0.08, '{"franchise": 0, "description": "Sans franchise"}', true),
('TIERCE_COMPLETE_PLAFONNEE', 0.07, '{"franchise": 250000, "reduction": 0.20, "description": "Franchise 250k"}', true),
('TIERCE_COMPLETE_PLAFONNEE', 0.06, '{"franchise": 500000, "reduction": 0.30, "description": "Franchise 500k"}', true),

-- Insert Tierce collision plafonnée rules
('TIERCE_COLLISION_PLAFONNEE', 0.08, '{"franchise": 0, "description": "Sans franchise"}', true),
('TIERCE_COLLISION_PLAFONNEE', 0.07, '{"franchise": 250000, "reduction": 0.20, "description": "Franchise 250k"}', true),
('TIERCE_COLLISION_PLAFONNEE', 0.06, '{"franchise": 500000, "reduction": 0.30, "description": "Franchise 500k"}', true);

-- Sample MTPL tariffs (will need to be completed with actual data)
INSERT INTO public.mtpl_tariffs (vehicle_category, fiscal_power, fuel_type, base_premium, is_active) VALUES
('401', 4, 'essence', 25000, true),
('401', 5, 'essence', 28000, true),
('401', 6, 'essence', 32000, true),
('401', 7, 'essence', 37000, true),
('401', 8, 'essence', 43000, true),
('401', 9, 'essence', 50000, true),
('401', 10, 'essence', 58000, true),
('401', 11, 'essence', 67000, true),
('401', 4, 'diesel', 28000, true),
('401', 5, 'diesel', 31000, true),
('401', 6, 'diesel', 35000, true),
('401', 7, 'diesel', 40000, true),
('401', 8, 'diesel', 46000, true),
('401', 9, 'diesel', 53000, true),
('401', 10, 'diesel', 61000, true),
('401', 11, 'diesel', 70000, true);

-- Sample TCM/TCL rates for vehicle categories
INSERT INTO public.tcm_tcl_rates (vehicle_category, coverage_type, rate, deductible_level, is_active) VALUES
('401', 'TIERCE_COMPLETE', 0.08, 0, true),
('401', 'TIERCE_COMPLETE', 0.07, 250000, true),
('401', 'TIERCE_COMPLETE', 0.06, 500000, true),
('401', 'TIERCE_COLLISION', 0.08, 0, true),
('401', 'TIERCE_COLLISION', 0.07, 250000, true),
('401', 'TIERCE_COLLISION', 0.06, 500000, true),

('402', 'TIERCE_COMPLETE', 0.09, 0, true),
('402', 'TIERCE_COMPLETE', 0.08, 250000, true),
('402', 'TIERCE_COMPLETE', 0.07, 500000, true),
('402', 'TIERCE_COLLISION', 0.09, 0, true),
('402', 'TIERCE_COLLISION', 0.08, 250000, true),
('402', 'TIERCE_COLLISION', 0.07, 500000, true);