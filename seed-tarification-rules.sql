-- Création des règles de tarification pour les garanties existantes
-- Ces règles permettent de calculer les primes en fonction des données du véhicule

-- Règle pour Responsabilité Civile (obligatoire)
INSERT INTO coverage_tariff_rules (
  id,
  coverage_id,
  formula_name,
  calculation_type,
  fixed_amount,
  min_amount,
  max_amount,
  base_rate,
  conditions,
  is_active,
  created_at,
  updated_at,
  created_by
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Responsabilité civile' LIMIT 1),
  'RC_BASE',
  'FIXED_AMOUNT',
  25000, -- 25 000 FCFA par défaut
  15000, -- Minimum 15 000 FCFA
  100000, -- Maximum 100 000 FCFA
  1.0,
  '{"vehicle_category": "401", "min_fiscal_power": 4, "max_fiscal_power": 15}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Règle pour Défense / Recours
INSERT INTO coverage_tariff_rules (
  id,
  coverage_id,
  formula_name,
  calculation_type,
  fixed_amount,
  conditions,
  is_active,
  created_at,
  updated_at,
  created_by
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Défense / Recours' LIMIT 1),
  'DEFENSE_BASE',
  'FIXED_AMOUNT',
  7950,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Règle pour Avance sur recours
INSERT INTO coverage_tariff_rules (
  id,
  coverage_id,
  formula_name,
  calculation_type,
  fixed_amount,
  conditions,
  is_active,
  created_at,
  updated_at,
  created_by
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Avance sur recours' LIMIT 1),
  'AVANCE_BASE',
  'FIXED_AMOUNT',
  15000,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Règle pour Vol des accessoires
INSERT INTO coverage_tariff_rules (
  id,
  coverage_id,
  formula_name,
  calculation_type,
  fixed_amount,
  conditions,
  is_active,
  created_at,
  updated_at,
  created_by
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Vol des accessoires (Vol des lève-vitres)' LIMIT 1),
  'VOL_ACCESSOIRES_BASE',
  'FIXED_AMOUNT',
  15000,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Règles pour les Packs
INSERT INTO coverage_tariff_rules (
  id,
  coverage_id,
  formula_name,
  calculation_type,
  fixed_amount,
  conditions,
  is_active,
  created_at,
  updated_at,
  created_by
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Pack Bronze' LIMIT 1),
  'PACK_BRONZE_BASE',
  'FIXED_AMOUNT',
  45000,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
),
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Pack Silver' LIMIT 1),
  'PACK_SILVER_BASE',
  'FIXED_AMOUNT',
  65000,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
),
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Pack Gold' LIMIT 1),
  'PACK_GOLD_BASE',
  'FIXED_AMOUNT',
  85000,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Règles pour garanties gratuites
INSERT INTO coverage_tariff_rules (
  id,
  coverage_id,
  formula_name,
  calculation_type,
  fixed_amount,
  conditions,
  is_active,
  created_at,
  updated_at,
  created_by
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Recours des Tiers Incendie' LIMIT 1),
  'RECOURS_TIERS_INCENDIE_FREE',
  'FREE',
  0,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
),
(
  gen_random_uuid(),
  (SELECT id FROM coverages WHERE name = 'Pack Ivory' LIMIT 1),
  'PACK_IVORY_FREE',
  'FREE',
  0,
  '{"vehicle_category": "401"}',
  true,
  NOW(),
  NOW(),
  (SELECT id FROM profiles WHERE email = 'admin@noliassurance.com' LIMIT 1)
) ON CONFLICT DO NOTHING;