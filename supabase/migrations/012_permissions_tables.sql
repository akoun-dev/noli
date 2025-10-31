-- Migration: Tables for permissions and roles management

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id text NOT NULL,
  name text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

-- Create permission_categories table
CREATE TABLE IF NOT EXISTS public.permission_categories (
  category text NOT NULL,
  label text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permission_categories_pkey PRIMARY KEY (category)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id text NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- Create role_permissions table (junction table)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id text NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_unique UNIQUE (role_id, permission_id)
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  additional_permissions text[] DEFAULT '{}',
  revoked_permissions text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_unique UNIQUE (user_id)
);

-- Insert default permission categories
INSERT INTO public.permission_categories (category, label, description) VALUES
('USER_MANAGEMENT', 'Gestion des utilisateurs', 'Permissions pour la gestion des comptes utilisateurs'),
('ROLE_MANAGEMENT', 'Gestion des rôles', 'Permissions pour la gestion des rôles et permissions'),
('OFFER_MANAGEMENT', 'Gestion des offres', 'Permissions pour la gestion des offres d''assurance'),
('QUOTE_MANAGEMENT', 'Gestion des devis', 'Permissions pour la gestion des devis'),
('POLICY_MANAGEMENT', 'Gestion des polices', 'Permissions pour la gestion des polices d''assurance'),
('PAYMENT_MANAGEMENT', 'Gestion des paiements', 'Permissions pour la gestion des paiements'),
('ANALYTICS', 'Analytique', 'Permissions pour l''accès aux rapports et statistiques'),
('AUDIT_LOGS', 'Journaux d''audit', 'Permissions pour l''accès aux journaux d''audit'),
('SYSTEM_CONFIG', 'Configuration système', 'Permissions pour la configuration du système'),
('BACKUP_RESTORE', 'Backup et restauration', 'Permissions pour la gestion des sauvegardes'),
('DATA_IMPORT_EXPORT', 'Import/Export de données', 'Permissions pour l''importation et exportation de données'),
('NOTIFICATION_MANAGEMENT', 'Gestion des notifications', 'Permissions pour la gestion des notifications')
ON CONFLICT (category) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (id, name, resource, action, description, category) VALUES
-- User Management
('user-view', 'Voir les utilisateurs', 'USER', 'READ', 'Consulter la liste des utilisateurs', 'USER_MANAGEMENT'),
('user-create', 'Créer des utilisateurs', 'USER', 'CREATE', 'Créer de nouveaux utilisateurs', 'USER_MANAGEMENT'),
('user-update', 'Modifier les utilisateurs', 'USER', 'UPDATE', 'Modifier les informations des utilisateurs', 'USER_MANAGEMENT'),
('user-delete', 'Supprimer des utilisateurs', 'USER', 'DELETE', 'Supprimer des utilisateurs', 'USER_MANAGEMENT'),
('user-activate', 'Activer/Désactiver des utilisateurs', 'USER', 'ACTIVATE', 'Activer ou désactiver des comptes utilisateurs', 'USER_MANAGEMENT'),

-- Role Management
('role-view', 'Voir les rôles', 'ROLE', 'READ', 'Consulter la liste des rôles', 'ROLE_MANAGEMENT'),
('role-create', 'Créer des rôles', 'ROLE', 'CREATE', 'Créer de nouveaux rôles', 'ROLE_MANAGEMENT'),
('role-update', 'Modifier les rôles', 'ROLE', 'UPDATE', 'Modifier les rôles existants', 'ROLE_MANAGEMENT'),
('role-delete', 'Supprimer des rôles', 'ROLE', 'DELETE', 'Supprimer des rôles', 'ROLE_MANAGEMENT'),
('role-assign', 'Attribuer des rôles', 'ROLE', 'ASSIGN', 'Attribuer des rôles aux utilisateurs', 'ROLE_MANAGEMENT'),

-- Offer Management
('offer-view', 'Voir les offres', 'OFFER', 'READ', 'Consulter les offres d''assurance', 'OFFER_MANAGEMENT'),
('offer-create', 'Créer des offres', 'OFFER', 'CREATE', 'Créer de nouvelles offres d''assurance', 'OFFER_MANAGEMENT'),
('offer-update', 'Modifier les offres', 'OFFER', 'UPDATE', 'Modifier les offres existantes', 'OFFER_MANAGEMENT'),
('offer-delete', 'Supprimer des offres', 'OFFER', 'DELETE', 'Supprimer des offres', 'OFFER_MANAGEMENT'),
('offer-publish', 'Publier des offres', 'OFFER', 'PUBLISH', 'Publier ou dépublier des offres', 'OFFER_MANAGEMENT'),

-- Quote Management
('quote-view', 'Voir les devis', 'QUOTE', 'READ', 'Consulter les devis', 'QUOTE_MANAGEMENT'),
('quote-update', 'Modifier les devis', 'QUOTE', 'UPDATE', 'Modifier les devis existants', 'QUOTE_MANAGEMENT'),
('quote-delete', 'Supprimer les devis', 'QUOTE', 'DELETE', 'Supprimer des devis', 'QUOTE_MANAGEMENT'),
('quote-respond', 'Répondre aux devis', 'QUOTE', 'RESPOND', 'Accepter ou rejeter les devis', 'QUOTE_MANAGEMENT'),

-- Policy Management
('policy-view', 'Voir les polices', 'POLICY', 'READ', 'Consulter les polices d''assurance', 'POLICY_MANAGEMENT'),
('policy-create', 'Créer des polices', 'POLICY', 'CREATE', 'Créer de nouvelles polices', 'POLICY_MANAGEMENT'),
('policy-update', 'Modifier les polices', 'POLICY', 'UPDATE', 'Modifier les polices existantes', 'POLICY_MANAGEMENT'),
('policy-cancel', 'Annuler des polices', 'POLICY', 'CANCEL', 'Annuler des polices', 'POLICY_MANAGEMENT'),

-- Payment Management
('payment-view', 'Voir les paiements', 'PAYMENT', 'READ', 'Consulter l''historique des paiements', 'PAYMENT_MANAGEMENT'),
('payment-process', 'Traiter les paiements', 'PAYMENT', 'PROCESS', 'Traiter les paiements', 'PAYMENT_MANAGEMENT'),
('payment-refund', 'Rembourser des paiements', 'PAYMENT', 'REFUND', 'Effectuer des remboursements', 'PAYMENT_MANAGEMENT'),

-- Analytics
('analytics-view', 'Voir les analytics', 'ANALYTICS', 'READ', 'Consulter les rapports et statistiques', 'ANALYTICS'),
('analytics-export', 'Exporter des rapports', 'ANALYTICS', 'EXPORT', 'Exporter des rapports', 'ANALYTICS'),

-- Audit Logs
('audit-view', 'Voir les journaux d''audit', 'AUDIT', 'READ', 'Consulter les journaux d''audit', 'AUDIT_LOGS'),
('audit-export', 'Exporter les journaux d''audit', 'AUDIT', 'EXPORT', 'Exporter les journaux d''audit', 'AUDIT_LOGS'),

-- System Config
('system-config-view', 'Voir la configuration système', 'SYSTEM', 'READ', 'Consulter la configuration système', 'SYSTEM_CONFIG'),
('system-config-update', 'Modifier la configuration système', 'SYSTEM', 'UPDATE', 'Modifier la configuration système', 'SYSTEM_CONFIG'),
('system-maintenance', 'Maintenance système', 'SYSTEM', 'MAINTENANCE', 'Effectuer des opérations de maintenance', 'SYSTEM_CONFIG'),

-- Backup and Restore
('backup-create', 'Créer des sauvegardes', 'BACKUP', 'CREATE', 'Créer des sauvegardes du système', 'BACKUP_RESTORE'),
('backup-restore', 'Restaurer des sauvegardes', 'BACKUP', 'RESTORE', 'Restaurer des sauvegardes', 'BACKUP_RESTORE'),
('backup-manage', 'Gérer les sauvegardes', 'BACKUP', 'MANAGE', 'Gérer les sauvegardes existantes', 'BACKUP_RESTORE'),

-- Data Import/Export
('data-import', 'Importer des données', 'DATA', 'IMPORT', 'Importer des données dans le système', 'DATA_IMPORT_EXPORT'),
('data-export', 'Exporter des données', 'DATA', 'EXPORT', 'Exporter des données du système', 'DATA_IMPORT_EXPORT'),

-- Notification Management
('notification-view', 'Voir les notifications', 'NOTIFICATION', 'READ', 'Consulter les notifications', 'NOTIFICATION_MANAGEMENT'),
('notification-send', 'Envoyer des notifications', 'NOTIFICATION', 'SEND', 'Envoyer des notifications', 'NOTIFICATION_MANAGEMENT'),
('notification-manage', 'Gérer les notifications', 'NOTIFICATION', 'MANAGE', 'Gérer les notifications système', 'NOTIFICATION_MANAGEMENT')
ON CONFLICT (id) DO NOTHING;

-- Insert default roles
INSERT INTO public.roles (id, name, description, is_active, created_by) VALUES
('super-admin', 'Super Administrateur', 'Accès complet à toutes les fonctionnalités du système', true, 'system'),
('admin', 'Administrateur', 'Gestion complète des utilisateurs, rôles et configuration système', true, 'system'),
('insurer-admin', 'Administrateur Assureur', 'Gestion complète des offres, devis et polices pour une compagnie d''assurance', true, 'system'),
('insurer-agent', 'Agent Assureur', 'Gestion quotidienne des offres et devis', true, 'system'),
('user', 'Utilisateur', 'Accès client standard pour comparer des offres et gérer ses polices', true, 'system'),
('auditor', 'Auditeur', 'Accès en lecture seule pour audit et conformité', true, 'system')
ON CONFLICT (id) DO NOTHING;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'super-admin', id FROM public.permissions;

-- Admin gets most permissions except backup/restore
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'admin', id FROM public.permissions 
WHERE category NOT IN ('BACKUP_RESTORE');

-- Insurer Admin gets offer, quote, policy, analytics, payment permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'insurer-admin', id FROM public.permissions 
WHERE category IN ('OFFER_MANAGEMENT', 'QUOTE_MANAGEMENT', 'POLICY_MANAGEMENT', 'ANALYTICS', 'PAYMENT_MANAGEMENT');

-- Insurer Agent gets limited permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'insurer-agent', id FROM public.permissions 
WHERE (category = 'OFFER_MANAGEMENT' AND action IN ('READ', 'UPDATE')) OR
      (category = 'QUOTE_MANAGEMENT' AND action IN ('READ', 'RESPOND')) OR
      (category = 'POLICY_MANAGEMENT' AND action = 'READ') OR
      (category = 'ANALYTICS' AND action = 'READ');

-- User gets basic permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'user', id FROM public.permissions 
WHERE (category = 'OFFER_MANAGEMENT' AND action = 'READ') OR
      (category = 'QUOTE_MANAGEMENT' AND action IN ('READ', 'CREATE', 'UPDATE')) OR
      (category = 'POLICY_MANAGEMENT' AND action IN ('READ', 'UPDATE')) OR
      (category = 'PAYMENT_MANAGEMENT' AND action = 'READ');

-- Auditor gets read-only permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'auditor', id FROM public.permissions 
WHERE action = 'READ';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON public.permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON public.roles(created_by);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_role_id ON public.user_permissions(role_id);

-- Create triggers for updated_at
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on permissions tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions table
CREATE POLICY "Anyone can view active permissions" ON public.permissions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for permission_categories table
CREATE POLICY "Anyone can view permission categories" ON public.permission_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage permission categories" ON public.permission_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for roles table
CREATE POLICY "Anyone can view active roles" ON public.roles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for role_permissions table
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for user_permissions table
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Grant permissions
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO authenticated;

GRANT SELECT ON public.permission_categories TO authenticated;
GRANT ALL ON public.permission_categories TO authenticated;

GRANT SELECT ON public.roles TO authenticated;
GRANT ALL ON public.roles TO authenticated;

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO authenticated;

GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO authenticated;