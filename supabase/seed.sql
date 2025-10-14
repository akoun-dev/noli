-- Seed data pour le projet Noli
-- Ce fichier contient les données initiales pour le développement et les tests
-- Best practices Supabase: utiliser ce fichier pour les données de développement

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insérer des données de catégories d'assurance
INSERT INTO public.insurance_categories (id, name, description, icon) VALUES
('auto', 'Assurance Auto', 'Protection complète pour votre véhicule', 'car'),
('habitation', 'Assurance Habitation', 'Sécurisez votre logement et vos biens', 'home'),
('sante', 'Assurance Santé', 'Couverture médicale pour vous et votre famille', 'heart'),
('vie', 'Assurance Vie', 'Prévoyance et épargne pour l''avenir', 'shield'),
('prevoyance', 'Prévoyance', 'Protection contre les accidents et invalidité', 'umbrella'),
('pro', 'Assurance Professionnelle', 'Protection pour les professionnels et entreprises', 'briefcase')
ON CONFLICT (id) DO NOTHING;

-- Insérer des assureurs avec des données réalistes
INSERT INTO public.insurers (id, name, description, logo_url, rating, is_active, contact_email, phone) VALUES
('assur-001', 'AXA France', 'L''un des leaders de l''assurance en France', 'https://example.com/logos/axa.png', 4.2, true, 'contact@axa.fr', '+33971821234'),
('assur-002', 'MAAF', 'Mutuelle des artisans de France', 'https://example.com/logos/maaf.png', 4.1, true, 'contact@maaf.fr', '+33971821235'),
('assur-003', 'GMF', 'Groupama Mutuelle Familiale', 'https://example.com/logos/gmf.png', 4.0, true, 'contact@gmf.fr', '+33971821236'),
('assur-004', 'Matmut', 'Mutuelle des étudiants', 'https://example.com/logos/matmut.png', 4.3, true, 'contact@matmut.fr', '+33971821237'),
('assur-005', 'Allianz France', 'Compagnie d''assurance mondiale', 'https://example.com/logos/allianz.png', 4.4, true, 'contact@allianz.fr', '+33971821238')
ON CONFLICT (id) DO NOTHING;

-- Insérer des offres d'assurance variées
INSERT INTO public.insurance_offers (
  id, insurer_id, category_id, name, description, price_min, price_max, coverage_amount,
  deductible, is_active, features, contract_type
) VALUES
-- Offres Auto
('offer-auto-001', 'assur-001', 'auto', 'Auto Confort', 'Assurance auto tous risques avec assistance', 450, 800, 80000, 300, true,
ARRAY['Assistance 24/7', 'Véhicule de remplacement 7j', 'Protection juridique', 'Bris glace'], 'all_risks'),
('offer-auto-002', 'assur-002', 'auto', 'Auto économique', 'Assurance au tiers + vol et incendie', 280, 450, 30000, 500, true,
ARRAY['Responsabilité civile', 'Défense pénale', 'Vol', 'Incendie'], 'third_party_plus'),
('offer-auto-003', 'assur-003', 'auto', 'Auto Junior', 'Assurance jeune conducteur', 350, 600, 50000, 400, true,
ARRAY['Apprentissage accompagné', 'Bonus accéléré', 'Assistance'], 'young_driver'),

-- Offres Habitation
('offer-hab-001', 'assur-001', 'habitation', 'Habitation Premium', 'Protection complète habitation', 350, 600, 500000, 200, true,
ARRAY['Incendie', 'Vol', 'Dégâts des eaux', 'Responsabilité civile', 'Protection juridique'], 'comprehensive'),
('offer-hab-002', 'assur-004', 'habitation', 'Habitation étudiant', 'Assurance colocation', 120, 250, 80000, 150, true,
ARRAY['Vol contenu', 'Incendie', 'Responsabilité civile locative'], 'student'),
('offer-hab-003', 'assur-002', 'habitation', 'Habitation écologique', 'Assurance maison BBC', 280, 500, 400000, 250, true,
ARRAY['Économies d''énergie', 'Panneaux solaires', 'Isolation', 'Diagnostics'], 'eco'),

-- Offres Santé
('offer-sante-001', 'assur-005', 'sante', 'Santé Confort', 'Complémentaire santé complète', 80, 180, 200000, 30, true,
ARRAY['Hospitalisation', 'Consultations', 'Optique', 'Dentaire', 'Pharmacie'], 'comprehensive'),
('offer-sante-002', 'assur-003', 'sante', 'Santé Essentiel', 'Couverture santé de base', 35, 85, 80000, 20, true,
ARRAY['Hospitalisation', 'Consultations', 'Pharmacie'], 'basic'),
('offer-sante-003', 'assur-001', 'sante', 'Santé Famille', 'Couverture familiale', 150, 320, 300000, 25, true,
ARRAY['Famille complète', 'Orthodontie', 'Maternité', 'Vaccination'], 'family'),

-- Offres Vie
('offer-vie-001', 'assur-005', 'vie', 'Vie Retraite', 'Préparation retraite', 200, 800, 500000, 0, true,
ARRAY['Fond euros', 'Unités de compte', 'Frais réduits', 'Flexibilité'], 'retirement'),
('offer-vie-002', 'assur-002', 'vie', 'Vie Épargne', 'Épargne flexible', 100, 400, 200000, 0, true,
ARRAY['Disponibilité', 'Fonds sécurisés', 'Plus-values', 'Fiscalité'], 'savings')

ON CONFLICT (id) DO NOTHING;

-- Insérer des exemples de tarification
INSERT INTO public.tarification_rules (
  id, category_id, age_min, age_max, risk_factor, coefficient, description
) VALUES
('tarif-001', 'auto', 18, 25, 'age', 1.5, 'Majoration jeune conducteur'),
('tarif-002', 'auto', 26, 65, 'age', 1.0, 'Tarif standard'),
('tarif-003', 'auto', 66, 100, 'age', 1.2, 'Majoration senior'),
('tarif-004', 'habitation', 18, 100, 'location', 0.8, 'Réduction locataire'),
('tarif-005', 'habitation', 18, 100, 'proprietor', 1.0, 'Tarif propriétaire'),
('tarif-006', 'sante', 18, 30, 'age', 0.7, 'Réduction jeune actif'),
('tarif-007', 'sante', 31, 50, 'age', 1.0, 'Tarif standard'),
('tarif-008', 'sante', 51, 100, 'age', 1.3, 'Majoration senior')

ON CONFLICT (id) DO NOTHING;

-- Logs d'audit de démonstration
INSERT INTO public.audit_logs (
  id, action, resource, resource_id, metadata, created_at
) VALUES
(gen_random_uuid(), 'SYSTEM_BOOT', 'system', '001',
 jsonb_build_object('message', 'Système Noli initialisé', 'version', '1.0.0', 'environment', 'development'),
 NOW()),
(gen_random_uuid(), 'SEED_DATA_LOADED', 'system', '002',
 jsonb_build_object('categories_count', 6, 'insurers_count', 5, 'offers_count', 9, 'tarification_rules_count', 8),
 NOW()),
(gen_random_uuid(), 'DATABASE_READY', 'system', '003',
 jsonb_build_object('status', 'ready', 'description', 'Base de données prête pour le développement'),
 NOW())

ON CONFLICT DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== DONNÉES DE DÉVELOPPEMENT CHARGÉES AVEC SUCCÈS ===';
  RAISE NOTICE '=== Catégories d''assurance: 6';
  RAISE NOTICE '=== Assureurs: 5 compagnies';
  RAISE NOTICE '=== Offres d''assurance: 9 offres';
  RAISE NOTICE '=== Règles de tarification: 8 règles';
  RAISE NOTICE '=== Logs d''audit: 3 entrées de démonstration';
  RAISE NOTICE '';
  RAISE NOTICE '=== Prochaines étapes:';
  RAISE NOTICE '1. Créer des utilisateurs de test avec les scripts fournis';
  RAISE NOTICE '2. Démarrer l''application: npm run dev';
  RAISE NOTICE '3. Tester le système avec les différents rôles';
  RAISE NOTICE '';
  RAISE NOTICE '=== Base de données Noli prête pour le développement !';
END $$;