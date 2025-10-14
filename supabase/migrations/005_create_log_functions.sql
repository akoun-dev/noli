-- Migration: 005_create_log_functions.sql
-- Création des fonctions de logging

-- Vérifier que les tables existent avant de créer les fonctions
DO $$
BEGIN
  -- Vérifier que la table profiles existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'La table profiles n''existe pas. Veuillez exécuter les migrations 001, 002, 003 d''abord.';
  END IF;

  -- Vérifier que la table audit_logs existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'La table audit_logs n''existe pas. Veuillez exécuter les migrations 001, 002, 003 d''abord.';
  END IF;
END $$;

-- Fonction pour logger les actions des utilisateurs
CREATE OR REPLACE FUNCTION public.log_user_action(
  user_action TEXT,
  resource_name TEXT DEFAULT NULL,
  resource_id_value TEXT DEFAULT NULL,
  metadata_value JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier si la table audit_logs existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    RETURN;
  END IF;

  -- Tenter d'insérer dans les logs d'audit avec gestion des erreurs
  BEGIN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource,
      resource_id,
      ip_address,
      user_agent,
      metadata
    ) VALUES (
      COALESCE(auth.uid(), NULL),
      user_action,
      resource_name,
      resource_id_value,
      inet_client_addr(),
      COALESCE(current_setting('request.headers', true)::json->>'user-agent', ''),
      metadata_value
    );
  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur (fonctions non disponibles, etc.), on ignore silencieusement
    NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

