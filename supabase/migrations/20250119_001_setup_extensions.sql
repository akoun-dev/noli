-- Extension setup
-- Activer les extensions PostgreSQL nécessaires

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  RAISE NOTICE '=== EXTENSIONS CONFIGURÉES ===';
  RAISE NOTICE '✅ uuid-ossp: Génération d''UUID disponible';
  RAISE NOTICE '✅ pgcrypto: Fonctions de cryptage disponibles';
END $$;