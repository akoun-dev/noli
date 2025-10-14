-- Migration: 009_create_admin_crud_tables.sql
-- Tables et fonctions CRUD pour l'administration

-- Table pour le suivi des administrateurs
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les notes administratives
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les logs d'activité détaillés
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les alertes système
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Table pour les rapports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  file_path TEXT,
  file_size BIGINT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les configurations système
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les templates de notifications
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les exports de données
CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  format VARCHAR(20) DEFAULT 'csv' CHECK (format IN ('csv', 'xlsx', 'json')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  file_path TEXT,
  file_size BIGINT,
  row_count INTEGER DEFAULT 0,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les backups de données
CREATE TABLE IF NOT EXISTS public.data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size BIGINT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_resource ON public.admin_actions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notes_resource ON public.admin_notes(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_admin_id ON public.admin_notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_priority ON public.admin_notes(priority);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON public.system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON public.system_alerts(type);

CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.reports(created_by);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates(type);

CREATE INDEX IF NOT EXISTS idx_data_exports_requested_by ON public.data_exports(requested_by);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON public.data_exports(status);

CREATE INDEX IF NOT EXISTS idx_data_backups_type ON public.data_backups(type);
CREATE INDEX IF NOT EXISTS idx_data_backups_expires_at ON public.data_backups(expires_at);

-- RLS (Row Level Security)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour admin_actions (seuls les admins peuvent voir/modifier)
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

CREATE POLICY "Admins can insert admin actions" ON public.admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

CREATE POLICY "Admins can update admin actions" ON public.admin_actions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

-- RLS Policies pour admin_notes
CREATE POLICY "Admins can view admin notes" ON public.admin_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

CREATE POLICY "Admins can insert admin notes" ON public.admin_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

CREATE POLICY "Admins can update admin notes" ON public.admin_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

-- RLS Policies pour system_alerts (tous les utilisateurs connectés peuvent voir)
CREATE POLICY "Authenticated users can view system alerts" ON public.system_alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage system alerts" ON public.system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

-- RLS Policies pour reports
CREATE POLICY "Admins can view reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

CREATE POLICY "Admins can manage reports" ON public.reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'ADMIN'
      AND p.is_active = true
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
CREATE TRIGGER handle_admin_actions_updated_at
  BEFORE UPDATE ON public.admin_actions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insertion des configurations système par défaut
INSERT INTO public.system_config (key, value, description, is_public) VALUES
('app_name', '"NOLI Assurance"', 'Nom de l''application', true),
('app_version', '"1.0.0"', 'Version de l''application', true),
('max_upload_size', '10485760', 'Taille maximale des fichiers uploadés (octets)', false),
('session_timeout', '3600', 'Délai d''expiration des sessions (secondes)', false),
('backup_retention_days', '30', 'Nombre de jours de rétention des backups', false),
('maintenance_mode', 'false', 'Mode maintenance activé/désactivé', false),
('smtp_config', '{"host": "", "port": 587, "username": "", "password": "", "from": ""}', 'Configuration SMTP', false)
ON CONFLICT (key) DO NOTHING;

-- Templates de notification par défaut (sans accents)
INSERT INTO public.notification_templates (name, type, subject, content, variables) VALUES
('Bienvenue utilisateur', 'welcome', 'Bienvenue sur NOLI Assurance',
'Bonjour {{first_name}} {{last_name}}, bienvenue sur la plateforme NOLI Assurance ! Votre compte a ete cree avec succes.',
'["first_name", "last_name"]'),

('Reinitialisation mot de passe', 'password_reset', 'Reinitialisation de votre mot de passe',
'Bonjour {{first_name}}, cliquez sur ce lien pour reinitialiser votre mot de passe : {{reset_link}}. Le lien expire dans {{expiry_hours}} heures.',
'["first_name", "reset_link", "expiry_hours"]'),

('Offre creee', 'offer_created', 'Nouvelle offre d''assurance disponible',
'Bonjour {{first_name}}, une nouvelle offre d''assurance "{{offer_title}}" est disponible. Prix a partir de {{price}} {{currency}}.',
'["first_name", "offer_title", "price", "currency"]')
ON CONFLICT DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '=== TABLES ADMIN CRUD CREEES AVEC SUCCES ===';
  RAISE NOTICE 'Tables creees:';
  RAISE NOTICE '- admin_actions (Actions administratives)';
  RAISE NOTICE '- admin_notes (Notes administratives)';
  RAISE NOTICE '- activity_logs (Logs d''activité)';
  RAISE NOTICE '- system_alerts (Alertes système)';
  RAISE NOTICE '- reports (Rapports)';
  RAISE NOTICE '- system_config (Configurations système)';
  RAISE NOTICE '- notification_templates (Templates de notifications)';
  RAISE NOTICE '- data_exports (Exports de données)';
  RAISE NOTICE '- data_backups (Backups de données)';
  RAISE NOTICE '';
  RAISE NOTICE 'Configurations système et templates insérés';
  RAISE NOTICE '=== Fonctionnalités admin prêtes à l''emploi !';
END $$;