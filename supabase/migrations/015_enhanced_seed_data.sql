-- Migration: 015_enhanced_seed_data.sql
-- Données de seed enrichies et réalistes pour le système complet

-- Extension pour la génération de données aléatoires
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ajouter la colonne website manquante dans la table insurers
ALTER TABLE public.insurers ADD COLUMN IF NOT EXISTS website TEXT;

-- Catégories d'assurance complètes
INSERT INTO public.insurance_categories (id, name, description, icon) VALUES
('auto', 'Assurance Automobile', 'Protection complète pour votre véhicule : auto, moto, camion', 'car'),
('habitation', 'Assurance Habitation', 'Sécurisez votre logement et vos biens contre tous les risques', 'home'),
('sante', 'Assurance Santé', 'Couverture médicale complète pour vous et votre famille', 'heart'),
('vie', 'Assurance Vie', 'Prévoyance, épargne et transmission de patrimoine', 'shield'),
('voyage', 'Assurance Voyage', 'Protection lors de vos déplacements à l''étranger', 'plane'),
('scolaire', 'Assurance Scolaire', 'Garanties pour les enfants et étudiants', 'graduation-cap'),
('professionnelle', 'Assurance Professionnelle', 'Responsabilité civile professionnelle et multirisques', 'briefcase'),
('agricole', 'Assurance Agricole', 'Protection pour les exploitations agricoles', 'tractor'),
('marine', 'Assurance Maritime', 'Transport maritime et marchandises', 'anchor'),
('aviation', 'Assurance Aviation', 'Aviation civile et privée', 'plane-takeoff')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Assureurs réalistes et variés
INSERT INTO public.insurers (id, name, description, logo_url, rating, is_active, contact_email, phone, website) VALUES
('nsia-assurance', 'NSIA Assurance', 'Compagnie d''assurance ivoirienne leader, part de NSIA Groupe', 'https://example.com/logos/nsia.png', 4.3, true, 'contact@nsia-assurance.ci', '+225202123456', 'https://www.nsiagroup.com'),
('sunu-assurance', 'Sunu Assurance Côte d''Ivoire', 'Faire partie du Sunu Group, présence dans 13 pays africains', 'https://example.com/logos/sunu.png', 4.1, true, 'contact@sunuassurance.ci', '+225212345678', 'https://www.sunu.com'),
('axa-cote-ivoire', 'AXA Côte d''Ivoire', 'Filiale ivoirienne du groupe AXA, mondial de l''assurance', 'https://example.com/logos/axa.png', 4.5, true, 'service.client@axa.ci', '+225272012345', 'https://www.axa.ci'),
('allianz-ci', 'Allianz Côte d''Ivoire', 'Assureur global allemand présent en Côte d''Ivoire', 'https://example.com/logos/allianz.png', 4.4, true, 'contact@allianz.ci', '+225272098765', 'https://www.allianz.ci'),
('saham-assurance', 'Saham Assurance', 'Groupe africain d''assurance basé au Maroc', 'https://example.com/logos/saham.png', 4.0, true, 'info@saham.ci', '+225212065432', 'https://www.saham.com'),
('coris-assurance', 'Coris Assurance', 'Compagnie ivoirienne d''assurance et de réassurance', 'https://example.com/logos/coris.png', 3.9, true, 'contact@corisbank.com', '+225202066543', 'https://www.corisbank.com'),
('aga-assurance', 'AGA Assurance', 'Compagnie d''assurance et de garantie agricole', 'https://example.com/logos/aga.png', 3.8, true, 'contact@aga-ci.com', '+225272011122', 'https://www.aga-ci.com'),
('sonatur-assurance', 'Sonatur Assurance', 'Société nationale d''assurance et de réassurance', 'https://example.com/logos/sonatur.png', 3.7, true, 'contact@sonatur.ci', '+225202099887', 'https://www.sonatur.ci'),
('le-phenix', 'Le Phénix Assurance', 'Compagnie d''assurance ivoirienne créée en 1958', 'https://example.com/logos/phenix.png', 4.2, true, 'contact@phenix.ci', '+225212077665', 'https://www.lephenix.ci'),
('colina-assurance', 'Colina Assurance', 'Assurance vie, capitalisation et prévoyance', 'https://example.com/logos/colina.png', 4.0, true, 'contact@colina.ci', '+225272044321', 'https://www.colina.com')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  contact_email = EXCLUDED.contact_email,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  updated_at = NOW();

-- Offres d'assurance variées et réalistes
INSERT INTO public.insurance_offers (
  id, insurer_id, category_id, name, description, price_min, price_max, coverage_amount,
  deductible, is_active, features, contract_type
) VALUES
-- Offres Automobile
('offer-auto-001', 'nsia-assurance', 'auto', 'Auto Confort NSIA', 'Assurance auto tous risques avec assistance 24/7', 25000, 85000, 5000000, 50000, true,
 ARRAY['Assistance dépannage 24/7', 'Véhicule de remplacement 7j', 'Protection juridique', 'Défense pénale', 'Bris de glace'], 'all_risks'),

('offer-auto-002', 'sunu-assurance', 'auto', 'Sunu Auto Éco', 'Formule économique au tiers pour petits budgets', 8000, 15000, 1000000, 200000, true,
 ARRAY['Responsabilité civile', 'Défense pénale', 'Recours contre tiers'], 'basic'),

('offer-auto-003', 'axa-cote-ivoire', 'auto', 'AXA Auto Premium', 'Couverture haut de gamme avec garanties étendues', 45000, 120000, 10000000, 25000, true,
 ARRAY['Assistance 24/7', 'Véhicule de remplacement premium', 'Protection conducteur', 'Bris de glace', 'Vol, incendie, tous accidents', 'Catégorie socio-professionnelle'], 'comprehensive'),

('offer-auto-004', 'allianz-ci', 'auto', 'Allianz Tiers+', 'Tiers amélioré avec garanties complémentaires', 18000, 35000, 2500000, 100000, true,
 ARRAY['Responsabilité civile', 'Défense pénale', 'Bris de glace', 'Vol contenu véhicule'], 'third_party_plus'),

-- Offres Habitation
('offer-hab-001', 'nsia-assurance', 'habitation', 'Habitation Protection NSIA', 'Protection complète pour votre maison et biens', 15000, 45000, 20000000, 100000, true,
 ARRAY['Incendie', 'Explosion', 'Foudre', 'Vol', 'Dégâts des eaux', 'Responsabilité civile vie privée'], 'comprehensive'),

('offer-hab-002', 'coris-assurance', 'habitation', 'Coris Habitation Essentiel', 'Formule de base pour appartement en ville', 8000, 20000, 10000000, 250000, true,
 ARRAY['Incendie', 'Explosion', 'Dégâts des eaux', 'Vol'], 'basic'),

('offer-hab-003', 'le-phenix', 'habitation', 'Phénix Résidence Premium', 'Couverture haut de gamme pour résidences de luxe', 35000, 80000, 50000000, 50000, true,
 ARRAY['Tous risques', 'Biens de valeur', 'Responsabilité civile familiale', 'Protection juridique', 'Assistance domicile'], 'all_risks'),

-- Offres Santé
('offer-sante-001', 'colina-assurance', 'sante', 'Colina Santé Familiale', 'Couverture santé complète pour toute la famille', 25000, 75000, 10000000, 10000, true,
 ARRAY['Hospitalisation', 'Consultations', 'Médicaments', 'Analyses laboratoire', 'Imagerie médicale', 'Dentaire', 'Optique'], 'comprehensive'),

('offer-sante-002', 'aga-assurance', 'sante', 'AGA Santé Essentiel', 'Formule santé économique pour jeunes actifs', 12000, 30000, 5000000, 25000, true,
 ARRAY['Hospitalisation', 'Consultations générales', 'Médicaments génériques', 'Urgences'], 'basic'),

('offer-sante-003', 'sonatur-assurance', 'sante', 'Sonatur Santé Confort', 'Couverture santé équilibrée avec bons remboursements', 20000, 55000, 7500000, 15000, true,
 ARRAY['Hospitalisation', 'Consultations spécialisées', 'Médicaments', 'Analyses', 'Dentaire limité'], 'comprehensive'),

-- Offres Vie
('offer-vie-001', 'colina-assurance', 'vie', 'Colina Épargne Retraite', 'Préparez votre retraite avec une épargne sécurisée', 50000, 200000, 50000000, 0, true,
 ARRAY['Garantie capital', 'Anticipations en cas de vie', 'Options fiscales avantageuses', 'Gestion profilée'], 'savings'),

('offer-vie-002', 'nsia-assurance', 'vie', 'NSIA Vie Protection', 'Assurance décès pour protéger vos proches', 15000, 60000, 25000000, 0, true,
 ARRAY['Garantie décès', 'Double effet en cas d''accident', 'Exonération primes', 'Rente éducation enfants'], 'family'),

-- Offres Voyage
('offer-voyage-001', 'axa-cote-ivoire', 'voyage', 'AXA Voyage Mondial', 'Couverture complète pour vos voyages internationaux', 8000, 25000, 2000000, 25000, true,
 ARRAY['Frais médicaux urgents', 'Rapatriement médical', 'Annulation voyage', 'Bagages perdus', 'Responsabilité civile voyage'], 'comprehensive'),

('offer-voyage-002', 'allianz-ci', 'voyage', 'Allianz Voyage Europe', 'Protection pour voyages en zone Schengen', 12000, 35000, 3000000, 20000, true,
 ARRAY['Garanties Schengen', 'Frais médicaux', 'Assistance 24/7', 'Perte documents'], 'comprehensive')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  coverage_amount = EXCLUDED.coverage_amount,
  deductible = EXCLUDED.deductible,
  features = EXCLUDED.features,
  contract_type = EXCLUDED.contract_type,
  updated_at = NOW();

-- Règles de tarification réalistes
INSERT INTO public.tarification_rules (
  id, category_id, age_min, age_max, risk_factor, coefficient, description, is_active
) VALUES
-- Règles Automobile
('rule-auto-001', 'auto', 18, 25, 'jeune_conducteur', 1.8, 'Majoration pour jeunes conducteurs (18-25 ans)', true),
('rule-auto-002', 'auto', 26, 35, 'conducteur_expérimenté', 1.0, 'Tarif standard pour conducteurs expérimentés', true),
('rule-auto-003', 'auto', 36, 65, 'conducteur_senior', 0.9, 'Réduction pour conducteurs seniors (36-65 ans)', true),
('rule-auto-004', 'auto', 66, 100, 'conducteur_âgé', 1.2, 'Majoration pour conducteurs âgés (66+ ans)', true),
('rule-auto-005', 'auto', NULL, NULL, 'vehicule_luxe', 1.5, 'Majoration pour véhicules de luxe', true),
('rule-auto-006', 'auto', NULL, NULL, 'usage_professionnel', 1.3, 'Majoration pour usage professionnel', true),
('rule-auto-007', 'auto', NULL, NULL, 'zone_urbaine', 1.2, 'Majoration pour circulation en zone urbaine', true),
('rule-auto-008', 'auto', NULL, NULL, 'bonus_malus_0', 0.5, 'Bonus maximum (50% de réduction)', true),

-- Règles Habitation
('rule-hab-001', 'habitation', NULL, NULL, 'appartement', 0.8, 'Réduction pour appartement', true),
('rule-hab-002', 'habitation', NULL, NULL, 'maison_individuelle', 1.0, 'Tarif standard pour maison individuelle', true),
('rule-hab-003', 'habitation', NULL, NULL, 'villa_luxe', 1.5, 'Majoration pour villa de luxe', true),
('rule-hab-004', 'habitation', NULL, NULL, 'alarme_sécurisée', 0.9, 'Réduction pour système d''alarme', true),
('rule-hab-005', 'habitation', NULL, NULL, 'quartier_risqué', 1.4, 'Majoration pour quartier à risque', true),

-- Règles Santé
('rule-sante-001', 'sante', 18, 30, 'jeune_adulte', 0.7, 'Réduction pour jeunes adultes (18-30 ans)', true),
('rule-sante-002', 'sante', 31, 50, 'adulte_actif', 1.0, 'Tarif standard pour adultes actifs', true),
('rule-sante-003', 'sante', 51, 65, 'senior', 1.3, 'Majoration pour seniors (51-65 ans)', true),
('rule-sante-004', 'sante', 66, 100, 'retraité', 1.5, 'Majoration pour retraités (66+ ans)', true),
('rule-sante-005', 'sante', NULL, NULL, 'fumeur', 1.4, 'Majoration pour fumeurs', true),
('rule-sante-006', 'sante', NULL, NULL, 'sportif_régulier', 0.9, 'Réduction pour sportifs réguliers', true),

-- Règles Vie
('rule-vie-001', 'vie', 18, 35, 'jeune', 0.6, 'Tarif préférentiel jeunes (18-35 ans)', true),
('rule-vie-002', 'vie', 36, 50, 'adulte', 1.0, 'Tarif standard adultes (36-50 ans)', true),
('rule-vie-003', 'vie', 51, 65, 'senior', 1.4, 'Majoration seniors (51-65 ans)', true),
('rule-vie-004', 'vie', NULL, NULL, 'non_fumeur', 0.8, 'Réduction pour non-fumeurs', true),
('rule-vie-005', 'vie', NULL, NULL, 'bonne_santé', 0.9, 'Réduction bonne santé', true)

ON CONFLICT (id) DO UPDATE SET
  coefficient = EXCLUDED.coefficient,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Créer des exemples de notifications système
INSERT INTO public.notifications (
  user_id, title, message, type, category, action_url, action_text, metadata
)
SELECT
  p.id,
  'Bienvenue sur Noli Assurance !',
  'Votre compte a été créé avec succès. Découvrez nos offres d''assurance adaptées à vos besoins.',
  'success',
  'general',
  '/offres',
  'Voir les offres',
  '{"onboarding": true, "first_login": true}'::jsonb
FROM public.profiles p
WHERE p.is_active = true
LIMIT 10
ON CONFLICT DO NOTHING;

-- Logs d'audit pour les données de seed
INSERT INTO public.audit_logs (
  action, resource, resource_id, metadata, created_at
) VALUES
('SEED_DATA_LOADED', 'insurance_categories', 'batch-001',
 jsonb_build_object('count', 10, 'description', 'Catégories d''assurance créées'), NOW()),
('SEED_DATA_LOADED', 'insurers', 'batch-001',
 jsonb_build_object('count', 10, 'description', 'Assureurs ivoiriens créés'), NOW()),
('SEED_DATA_LOADED', 'insurance_offers', 'batch-001',
 jsonb_build_object('count', 14, 'description', 'Offres d''assurance variées créées'), NOW()),
('SEED_DATA_LOADED', 'tarification_rules', 'batch-001',
 jsonb_build_object('count', 18, 'description', 'Règles de tarification créées'), NOW()),
('SEED_DATA_LOADED', 'notifications', 'batch-001',
 jsonb_build_object('count', 10, 'description', 'Notifications de bienvenue créées'), NOW())
ON CONFLICT DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== DONNÉES DE SEED ENRICHIES INSÉRÉES AVEC SUCCÈS ===';
  RAISE NOTICE 'Catégories: 10 catégories d''assurance créées';
  RAISE NOTICE 'Assureurs: 10 assureurs ivoiriens et internationaux créés';
  RAISE NOTICE 'Offres: 14 offres d''assurance réalistes créées';
  RAISE NOTICE 'Règles: 18 règles de tarification implémentées';
  RAISE NOTICE 'Notifications: Notifications système créées';
  RAISE NOTICE 'Audit: Logs de traçabilité créés';
  RAISE NOTICE '=== SYSTÈME PRÊT POUR DÉMONSTRATION ===';
END $$;