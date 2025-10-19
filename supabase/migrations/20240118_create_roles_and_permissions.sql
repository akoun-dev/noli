-- Migration pour créer les tables de rôles et permissions
-- Créée le 2024-01-18 pour gérer les permissions fines du système

-- Table pour les permissions de rôle
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Table pour les sessions utilisateur (tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  device_info JSONB,
  ip_address INET,
  location JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  sign_out_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les tokens de reset de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les alertes système
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  source TEXT,
  metadata JSONB,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les logs d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les comptes assureurs (lier profiles à insurers)
CREATE TABLE IF NOT EXISTS insurer_accounts (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insurer_id UUID NOT NULL REFERENCES insurers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'agent', 'readonly')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, insurer_id)
);

-- Table pour les catégories d'assurance
CREATE TABLE IF NOT EXISTS insurance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les règles de tarification
CREATE TABLE IF NOT EXISTS tarification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES insurance_categories(id) ON DELETE CASCADE,
  age_min INTEGER,
  age_max INTEGER,
  risk_factor TEXT NOT NULL,
  coefficient DECIMAL(5,3) NOT NULL CHECK (coefficient > 0),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les documents uploadés
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_name TEXT,
  type TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  url TEXT NOT NULL,
  path TEXT,
  metadata JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les paramètres système
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'payment', 'notification', 'security', 'feature', 'email', 'sms')),
  is_public BOOLEAN DEFAULT FALSE,
  is_readonly BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les templates de notification
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  action_url_template TEXT,
  action_text_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les logs d'envoi de notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'whatsapp', 'in_app')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider TEXT,
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les véhicules (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  usage TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  power INTEGER,
  license_plate TEXT NOT NULL,
  vin_number TEXT,
  registration_date DATE NOT NULL,
  value DECIMAL(12,2),
  is_primary BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les catégories d'assurance par défaut
INSERT INTO insurance_categories (id, name, description, icon, color, sort_order) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Auto', 'Assurance pour véhicules automobiles', 'car', '#3B82F6', 1),
  ('550e8400-e29b-41d4-a716-446655440002', 'Moto', 'Assurance pour motocyclettes', 'motorcycle', '#10B981', 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Habitat', 'Assurance habitation', 'home', '#F59E0B', 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Santé', 'Assurance santé et complémentaire', 'heart', '#EF4444', 4),
  ('550e8400-e29b-41d4-a716-446655440005', 'Voyage', 'Assurance voyage', 'plane', '#8B5CF6', 5)
ON CONFLICT (id) DO NOTHING;

-- Insérer les paramètres système par défaut
INSERT INTO system_settings (key, value, type, description, category, is_public) VALUES
  ('platform.name', '"Noli Assurance"', 'string', 'Nom de la plateforme', 'general', true),
  ('platform.version', '"1.0.0"', 'string', 'Version de la plateforme', 'general', true),
  ('platform.max_file_size', '10485760', 'number', 'Taille max des fichiers (10MB)', 'general', false),
  ('quote.validity_days', '30', 'number', 'Durée de validité des devis en jours', 'general', false),
  ('payment.reminder_days', '7', 'number', 'Jours avant rappel de paiement', 'payment', false),
  ('notification.quiet_hours_start', '"22:00"', 'string', 'Début heures silencieuses', 'notification', true),
  ('notification.quiet_hours_end', '"08:00"', 'string', 'Fin heures silencieuses', 'notification', true),
  ('security.max_login_attempts', '5', 'number', 'Tentatives max de connexion', 'security', false),
  ('security.session_timeout', '24', 'number', 'Timeout de session (heures)', 'security', false),
  ('email.from_address', '"noreply@noli.ci"', 'string', 'Adresse email d''envoi', 'email', false),
  ('email.from_name', '"Noli Assurance"', 'string', 'Nom d''expéditeur email', 'email', false),
  ('sms.provider', '"orange"', 'string', 'Fournisseur SMS', 'sms', false)
ON CONFLICT (key) DO NOTHING;

-- Insérer les templates de notification par défaut
INSERT INTO notification_templates (name, title_template, message_template, type, category, variables) VALUES
  ('quote_generated', 'Nouveau devis généré', 'Bonjour {{firstName}}, votre devis #{{quoteId}} de {{insurerName}} est prêt. Prix: {{price}} FCFA.', 'info', 'quote', '{"firstName": "string", "quoteId": "string", "insurerName": "string", "price": "number", "downloadUrl": "string"}'),
  ('quote_approved', 'Devis approuvé', 'Félicitations {{firstName}}! Votre devis #{{quoteId}} a été approuvé par {{insurerName}}.', 'success', 'quote', '{"firstName": "string", "quoteId": "string", "insurerName": "string", "nextSteps": "string"}'),
  ('quote_expiring', 'Devis expire bientôt', 'Votre devis #{{quoteId}} expire dans {{days}} jours. Connectez-vous pour le consulter.', 'warning', 'quote', '{"quoteId": "string", "days": "number"}'),
  ('payment_due', 'Paiement dû', 'Votre paiement de {{amount}} FCFA est dû pour votre police #{{policyNumber}}.', 'warning', 'payment', '{"amount": "number", "policyNumber": "string", "dueDate": "string"}'),
  ('payment_received', 'Paiement reçu', 'Merci! Votre paiement de {{amount}} FCFA a bien été reçu.', 'success', 'payment', '{"amount": "number", "policyNumber": "string"}'),
  ('policy_renewal', 'Renouvellement de police', 'Votre police #{{policyNumber}} expire le {{expiryDate}}. Renouvelez-la pour continuer votre couverture.', 'warning', 'policy', '{"policyNumber": "string", "expiryDate": "string"}'),
  ('claim_updated', 'Mise à jour de sinistre', 'Votre sinistre #{{claimNumber}} a été mis à jour. Statut: {{status}}', 'info', 'claim', '{"claimNumber": "string", "status": "string"}'),
  ('welcome', 'Bienvenue sur Noli Assurance', 'Bienvenue {{firstName}}! Votre compte a été créé avec succès.', 'success', 'general', '{"firstName": "string"}')
ON CONFLICT (name) DO NOTHING;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_password_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_tokens_expires ON password_reset_tokens(expires_at, used);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_insurer_accounts_insurer ON insurer_accounts(insurer_id);
CREATE INDEX IF NOT EXISTS idx_insurer_accounts_profile ON insurer_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_tarification_rules_category ON tarification_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_tarification_rules_active ON tarification_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_primary ON vehicles(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted ON vehicles(deleted_at) WHERE deleted_at IS NULL;

-- Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables qui en ont besoin
CREATE TRIGGER set_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_insurer_accounts_updated_at
  BEFORE UPDATE ON insurer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_insurance_categories_updated_at
  BEFORE UPDATE ON insurance_categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_tarification_rules_updated_at
  BEFORE UPDATE ON tarification_rules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Activer RLS sur les nouvelles tables
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Politiques RSL de base
-- role_permissions: lecture seule pour tout le monde
CREATE POLICY "Anyone can read role permissions" ON role_permissions
  FOR SELECT USING (true);

-- user_sessions: seul l'utilisateur propriétaire peut voir ses sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (user_id = auth.uid());

-- password_reset_tokens: seul l'utilisateur propriétaire peut voir ses tokens
CREATE POLICY "Users can view own reset tokens" ON password_reset_tokens
  FOR SELECT USING (user_id = auth.uid());

-- system_alerts: les admins peuvent tout voir, les autres voient seulement les actifs
CREATE POLICY "Admins can view all alerts" ON system_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN role_permissions rp ON p.role = rp.role
      WHERE p.id = auth.uid() AND rp.permission = 'manage:system' AND p.is_active = TRUE
    )
  );

CREATE POLICY "Non-admins can view active alerts only" ON system_alerts
  FOR SELECT USING (
    status = 'active' AND severity IN ('medium', 'high', 'critical')
  );

-- audit_logs: les admins peuvent tout voir, les autres voient seulement leurs propres logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN role_permissions rp ON p.role = rp.role
      WHERE p.id = auth.uid() AND rp.permission = 'read:all_audit_logs' AND p.is_active = TRUE
    )
  );

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- insurer_accounts: lecture pour les assureurs concernés, écriture pour les admins
CREATE POLICY "Users can view own insurer accounts" ON insurer_accounts
  FOR SELECT USING (
    profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM insurer_accounts ia
      WHERE ia.profile_id = auth.uid() AND ia.insurer_id = insurer_accounts.insurer_id
    )
  );

-- documents: lecture pour les utilisateurs concernés et admins
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN role_permissions rp ON p.role = rp.role
      WHERE p.id = auth.uid() AND rp.permission = 'read:all_profiles' AND p.is_active = TRUE
    )
  );

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- notification_logs: lecture pour les utilisateurs concernés et admins
CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN role_permissions rp ON p.role = rp.role
      WHERE p.id = auth.uid() AND rp.permission = 'manage:notifications' AND p.is_active = TRUE
    )
  );

-- vehicles: lecture pour les utilisateurs concernés et admins
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN role_permissions rp ON p.role = rp.role
      WHERE p.id = auth.uid() AND rp.permission = 'read:all_profiles' AND p.is_active = TRUE
    )
  );

CREATE POLICY "Users can insert own vehicles" ON vehicles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own vehicles" ON vehicles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own vehicles" ON vehicles
  FOR DELETE USING (user_id = auth.uid());