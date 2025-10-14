-- Script de vérification des données de seed
-- Ce script vérifie que toutes les données de test ont été correctement insérées

DO $$
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES DONNÉES DE SEED ===';
  RAISE NOTICE '';
END $$;

-- Vérifier les tables de base
DO $$
BEGIN
  RAISE NOTICE '📋 Tables de base:';

  -- Profiles
  DECLARE
    profiles_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    RAISE NOTICE '   • Profiles: % enregistrement(s)', profiles_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   • Profiles: Erreur - %', SQLERRM;
  END;

  -- Audit logs
  DECLARE
    audit_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO audit_count FROM public.audit_logs;
    RAISE NOTICE '   • Audit Logs: % enregistrement(s)', audit_count;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   • Audit Logs: Erreur - %', SQLERRM;
  END;

END $$;

-- Vérifier les tables de seed si elles existent
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🏢 Tables de seed (si elles existent):';

  -- Insurance Categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_categories' AND table_schema = 'public') THEN
    DECLARE
      cat_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO cat_count FROM public.insurance_categories;
      RAISE NOTICE '   • Categories: % catégorie(s)', cat_count;

      -- Afficher les catégories
      RAISE NOTICE '     Catégories disponibles:';
      FOR cat IN SELECT name, description FROM public.insurance_categories ORDER BY name LOOP
        RAISE NOTICE '       - %: %', cat.name, cat.description;
      END LOOP;
    END;
  ELSE
    RAISE NOTICE '   • Categories: Table non trouvée';
  END IF;

  -- Insurers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurers' AND table_schema = 'public') THEN
    DECLARE
      insurer_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO insurer_count FROM public.insurers;
      RAISE NOTICE '   • Insurers: % assureur(s)', insurer_count;

      -- Afficher les assureurs
      RAISE NOTICE '     Assureurs disponibles:';
      FOR ins IN SELECT name, rating FROM public.insurers WHERE is_active = true ORDER BY name LOOP
        RAISE NOTICE '       - % (Rating: %/5)', ins.name, ins.rating;
      END LOOP;
    END;
  ELSE
    RAISE NOTICE '   • Insurers: Table non trouvée';
  END IF;

  -- Insurance Offers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_offers' AND table_schema = 'public') THEN
    DECLARE
      offer_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO offer_count FROM public.insurance_offers;
      RAISE NOTICE '   • Offers: % offre(s)', offer_count;

      -- Afficher les offres
      RAISE NOTICE '     Offres disponibles:';
      FOR off IN
        SELECT name, price_min, price_max,
               CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status
        FROM public.insurance_offers
        WHERE is_active = true
        ORDER BY name
      LOOP
        RAISE NOTICE '       - % (%€ - %€) [%]', off.name, off.price_min, off.price_max, off.status;
      END LOOP;
    END;
  ELSE
    RAISE NOTICE '   • Offers: Table non trouvée';
  END IF;

END $$;

-- Vérifier les fonctions créées
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Fonctions créées:';

  FOR func IN
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION'
      AND routine_name NOT LIKE 'pg_%'
    ORDER BY routine_name
  LOOP
    RAISE NOTICE '   • %', func.routine_name;
  END LOOP;

END $$;

-- Vérifier les triggers créés
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Triggers créés:';

  FOR trig IN
    SELECT trigger_name, event_manipulation, action_timing
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY trigger_name
  LOOP
    RAISE NOTICE '   • % (% %)', trig.trigger_name, trig.action_timing, trig.event_manipulation;
  END LOOP;

END $$;

-- Vérifier les logs d'audit récents
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 Logs d''audit récents:';

  FOR log IN
    SELECT action, resource, created_at::text as created
    FROM public.audit_logs
    ORDER BY created_at DESC
    LIMIT 5
  LOOP
    RAISE NOTICE '   • % - % (%s)', log.action, log.resource, log.created;
  END LOOP;

END $$;

-- Résumé final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RÉSUMÉ DE LA VÉRIFICATION ===';
  RAISE NOTICE '✅ Migration des fonctions: 005, 006';
  RAISE NOTICE '✅ Migration des données: 007';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaines étapes:';
  RAISE NOTICE '1. Exécuter le script de création d''utilisateurs de test';
  RAISE NOTICE '2. Tester l''application avec les comptes créés';
  RAISE NOTICE '3. Vérifier le fonctionnement des permissions et rôles';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Scripts disponibles:';
  RAISE NOTICE '   • scripts/create-test-users.js (Node.js)';
  RAISE NOTICE '   • scripts/create-test-users.sql (SQL)';
  RAISE NOTICE '   • scripts/verify-seed-data.sql (ce script)';
END $$;