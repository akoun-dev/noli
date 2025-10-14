-- Migration: 007_seed_data.sql
-- Données initiales pour le système (sans utilisateurs authentifiés)

-- Créer des données de test qui ne dépendent pas des utilisateurs authentifiés
-- Ces données seront utilisées pour démontrer le fonctionnement du système

-- Note: Les comptes utilisateurs doivent être créés via l'interface d'inscription
-- car ils nécessitent une authentification Supabase

-- Créer des catégories d'assurance si la table existe
DO $$
BEGIN
  -- Vérifier si la table insurance_categories existe avant d'insérer
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_categories' AND table_schema = 'public') THEN
    INSERT INTO public.insurance_categories (id, name, description, icon) VALUES
    ('auto', 'Assurance Auto', 'Protection pour votre véhicule', 'car'),
    ('habitation', 'Assurance Habitation', 'Sécurisez votre logement', 'home'),
    ('sante', 'Assurance Santé', 'Couverture médicale complète', 'heart'),
    ('vie', 'Assurance Vie', 'Prévoyance et épargne', 'shield')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Créer des exemples d'assureurs si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurers' AND table_schema = 'public') THEN
    INSERT INTO public.insurers (id, name, description, logo_url, rating, is_active) VALUES
    ('insurer-001', 'AssurPro', 'Assurance professionnelle pour tous', 'https://example.com/logos/assurpro.png', 4.5, true),
    ('insurer-002', 'SecuHome', 'Spécialiste de l''assurance habitation', 'https://example.com/logos/secuhome.png', 4.2, true),
    ('insurer-003', 'AutoSecure', 'Le meilleur pour votre véhicule', 'https://example.com/logos/autosecure.png', 4.7, true),
    ('insurer-004', 'SantéPlus', 'Votre santé avant tout', 'https://example.com/logos/santeplus.png', 4.3, true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Créer des exemples d'offres d'assurance si la table existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_offers' AND table_schema = 'public') THEN
    INSERT INTO public.insurance_offers (
      id, insurer_id, category_id, name, description, price_min, price_max, coverage_amount,
      deductible, is_active, features
    ) VALUES
    ('offer-001', 'insurer-001', 'auto', 'Auto Confort', 'Assurance auto complète avec tous les risques', 300, 600, 50000, 500, true,
     ARRAY['Assistance 24/7', 'Véhicule de remplacement', 'Protection juridique']),
    ('offer-002', 'insurer-002', 'habitation', 'Habitation Premium', 'Protection complète pour votre maison', 250, 450, 300000, 1000, true,
     ARRAY['Incendie', 'Vol', 'Dégâts des eaux', 'Responsabilité civile']),
    ('offer-003', 'insurer-003', 'auto', 'Auto Économique', 'Assurance au tiers économique', 150, 250, 10000, 1000, true,
     ARRAY['Responsabilité civile', 'Défense pénale']),
    ('offer-004', 'insurer-004', 'sante', 'Santé Essentiel', 'Couverture santé de base', 50, 150, 100000, 20, true,
     ARRAY['Consultations', 'Médicaments', 'Hospitalisation'])
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Insérer quelques logs d'audit d'exemple pour tester le système
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    INSERT INTO public.audit_logs (
      id, action, resource, resource_id, metadata, created_at
    ) VALUES
    (gen_random_uuid(), 'SYSTEM_BOOT', 'system', '001',
     jsonb_build_object('message', 'Système initialisé', 'version', '1.0.0'),
     NOW()),
    (gen_random_uuid(), 'MIGRATION_APPLIED', 'migration', '007',
     jsonb_build_object('migration', '007_seed_data.sql', 'description', 'Données de test initiales'),
     NOW()),
    (gen_random_uuid(), 'FUNCTIONS_CREATED', 'functions', '005-006',
     jsonb_build_object('count', 10, 'description', 'Fonctions d''authentification créées'),
     NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== DONNÉES DE TEST INSÉRÉES AVEC SUCCÈS ===';
  RAISE NOTICE 'Catégories: Auto, Habitation, Santé, Vie';
  RAISE NOTICE 'Assureurs: 4 compagnies créées';
  RAISE NOTICE 'Offres: 4 offres d''assurance créées';
  RAISE NOTICE 'Logs d''audit: Exemples créés pour test';
  RAISE NOTICE '=== NOTE: Les comptes utilisateurs doivent être créés via l''interface d''inscription ===';
END $$;