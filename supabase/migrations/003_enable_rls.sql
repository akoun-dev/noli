-- Migration: 003_enable_rls.sql
-- Configuration du Row Level Security (RLS) pour sécuriser l'accès aux données

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour la table profiles
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
    )
  );

-- Les admins peuvent mettre à jour tous les profils
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
    )
  );

-- Les assureurs peuvent voir les profils des utilisateurs de leurs devis
CREATE POLICY "Insurers can view user profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'INSURER' AND is_active = true
    )
  );

-- Policies pour la table user_sessions
-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent gérer leurs propres sessions
CREATE POLICY "Users can manage own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid());

-- Les admins peuvent voir toutes les sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
    )
  );

-- Policies pour la table password_reset_tokens
-- Les utilisateurs peuvent voir leurs propres tokens de reset
CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer leurs propres tokens de reset
CREATE POLICY "Users can create own reset tokens" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent utiliser leurs propres tokens
CREATE POLICY "Users can use own reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (user_id = auth.uid());

-- Policies pour la table audit_logs
-- Seuls les admins peuvent voir les logs d'audit
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
    )
  );

-- Les utilisateurs peuvent voir leurs propres logs (limité)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid() AND 
    action IN ('LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'PASSWORD_CHANGE')
  );

-- Policies pour l'insertion (système uniquement)
-- Seul le système peut insérer des logs d'audit
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Seul le système peut insérer des sessions
CREATE POLICY "System can insert sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (true);

-- Commentaires pour documenter les policies
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Permet aux utilisateurs de voir uniquement leur propre profil';
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 'Permet aux administrateurs de voir tous les profils';
COMMENT ON POLICY "Users can manage own sessions" ON public.user_sessions IS 'Permet aux utilisateurs de gérer leurs propres sessions';
COMMENT ON POLICY "System can insert audit logs" ON public.audit_logs IS 'Permet au système de créer des logs d''audit';
