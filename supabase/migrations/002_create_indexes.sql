-- Migration: 002_create_indexes.sql
-- Création des indexes et contraintes pour optimiser les performances

-- Indexes pour la table profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX idx_profiles_company_name ON public.profiles(company_name) WHERE company_name IS NOT NULL;

-- Indexes pour la table user_sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_last_accessed ON public.user_sessions(last_accessed_at);

-- Indexes pour la table password_reset_tokens
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);
CREATE INDEX idx_password_reset_tokens_used ON public.password_reset_tokens(used) WHERE used = false;

-- Indexes pour la table audit_logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource) WHERE resource IS NOT NULL;
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- Contraintes supplémentaires
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_not_empty CHECK (length(trim(email)) > 0);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$');

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger sur la table profiles
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour nettoyer les sessions expirées automatiquement
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui s'exécute toutes les heures (via pg_cron si disponible)
-- Note: pg_cron doit être installé sur Supabase pour cette fonctionnalité
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- Trigger pour mettre à jour last_accessed_at lors de l'accès à une session
CREATE OR REPLACE FUNCTION public.update_session_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_session_access
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_session_access();

-- Commentaires pour documenter les indexes
COMMENT ON INDEX idx_profiles_email IS 'Index pour recherches par email';
COMMENT ON INDEX idx_profiles_role IS 'Index pour filtrer par rôle';
COMMENT ON INDEX idx_user_sessions_expires_at IS 'Index pour nettoyer les sessions expirées';
COMMENT ON INDEX idx_audit_logs_created_at IS 'Index pour les recherches chronologiques';
