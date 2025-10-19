-- ========================================
-- SEED DATA - DONNÉES DE DÉVELOPPEMENT
-- ========================================
-- Ce fichier contient les données initiales pour le développement et les tests
-- Compatible avec le schéma de base de données recréé

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insérer des données de catégories d'assurance
INSERT INTO public.insurance_categories (name, description) VALUES
('Auto', 'Assurance automobile pour tous types de véhicules'),
('Moto', 'Assurance pour motos et scooters'),
('Habitation', 'Assurance habitation et propriété'),
('Voyage', 'Assurance voyage et rapatriement'),
('Santé', 'Assurance santé et complémentaire santé'),
('Responsabilité Civile', 'Assurance responsabilité civile professionnelle et privée')
ON CONFLICT (name) DO NOTHING;

-- Message de confirmation
DO $$
DECLARE
  categories_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO categories_count FROM public.insurance_categories;

  RAISE NOTICE '=== DONNÉES DE DÉVELOPPEMENT CHARGÉES AVEC SUCCÈS ===';
  RAISE NOTICE '✅ Catégories d''assurance: %', categories_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 CATÉGORIES DISPONIBLES:';
  RAISE NOTICE '  • Auto, Moto, Habitation, Voyage, Santé, Responsabilité Civile';
  RAISE NOTICE '';
  RAISE NOTICE '💡 POUR CRÉER LES ASSUREURS ET OFFRES:';
  RAISE NOTICE '1. Créez d''abord les utilisateurs via auth.users';
  RAISE NOTICE '2. Le trigger handle_new_user créera automatiquement les profils';
  RAISE NOTICE '3. Ensuite vous pourrez créer les assureurs et offres';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Base de données Noli prête pour le développement !';
END $$;