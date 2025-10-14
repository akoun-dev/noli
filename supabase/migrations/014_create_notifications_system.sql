-- Migration: 014_create_notifications_system.sql
-- Création du système de notifications pour les trois interfaces

-- Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'quote', 'policy', 'payment', 'system', 'approval')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des préférences de notification
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT true,
  categories JSONB DEFAULT '{
    "general": {"email": true, "push": true, "sms": false, "whatsapp": true},
    "quote": {"email": true, "push": true, "sms": false, "whatsapp": true},
    "policy": {"email": true, "push": true, "sms": true, "whatsapp": true},
    "payment": {"email": true, "push": true, "sms": true, "whatsapp": false},
    "system": {"email": true, "push": true, "sms": false, "whatsapp": false},
    "approval": {"email": true, "push": true, "sms": false, "whatsapp": true}
  }',
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'Africa/Abidjan',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: La table notification_templates existe déjà depuis la migration 009
-- Nous ajoutons seulement les colonnes manquantes si nécessaire
ALTER TABLE public.notification_templates
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS action_url_template TEXT,
ADD COLUMN IF NOT EXISTS action_text_template TEXT;

-- Table des logs d'envoi de notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'whatsapp', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider TEXT,
  external_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON public.notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON public.notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);

-- Activer Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques RLS pour les préférences de notification
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notification preferences" ON public.notification_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques RLS pour les templates (lecture publique pour les actifs)
CREATE POLICY "Active templates are viewable by everyone" ON public.notification_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

-- Politiques RLS pour les logs de notifications
CREATE POLICY "Users can view own notification logs" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs" ON public.notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.is_active = true
    )
  );

CREATE POLICY "System can insert notification logs" ON public.notification_logs
  FOR INSERT WITH CHECK (true);

-- Trigger pour mettre à jour les timestamps
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT 'general',
  p_action_url TEXT DEFAULT NULL,
  p_action_text TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, category,
    action_url, action_text, metadata, expires_at
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_category,
    p_action_url, p_action_text, p_metadata, p_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = p_notification_id
  AND (p_user_id IS NULL OR user_id = p_user_id);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications d'un utilisateur comme lues
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
  p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE read = false
  AND (p_user_id IS NULL OR user_id = p_user_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les notifications non lues d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_unread_notifications(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  category TEXT,
  action_url TEXT,
  action_text TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.message,
    n.type,
    n.category,
    n.action_url,
    n.action_text,
    n.metadata,
    n.created_at
  FROM public.notifications n
  WHERE n.read = false
  AND (p_user_id IS NULL OR n.user_id = p_user_id)
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer les préférences par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences(
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_preference_id UUID;
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_preference_id;

  RETURN v_preference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les préférences de notification
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_notification_preferences(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur la table profiles
CREATE TRIGGER handle_new_user_notifications
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notifications();

-- Insérer les templates de notification par défaut (si n'existent pas déjà)
DO $$
BEGIN
  -- Vérifier si les templates existent déjà avant insertion
  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'quote_generated') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('quote_generated', 'info', 'Nouveau devis généré', 'Bonjour {{firstName}}, votre devis {{quoteId}} a été généré avec succès. Prix estimé : {{price}}€', '["firstName", "quoteId", "price"]', 'quote');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'quote_approved') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('quote_approved', 'success', 'Devis approuvé', 'Félicitations {{firstName}} ! Votre devis {{quoteId}} a été approuvé par {{insurerName}}', '["firstName", "quoteId", "insurerName"]', 'quote');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'quote_rejected') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('quote_rejected', 'error', 'Devis rejeté', 'Bonjour {{firstName}}, votre devis {{quoteId}} n''a pas pu être approuvé. Motif : {{reason}}', '["firstName", "quoteId", "reason"]', 'quote');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'policy_created') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('policy_created', 'success', 'Police d''assurance créée', 'Votre police {{policyNumber}} est maintenant active. Prime mensuelle : {{premiumAmount}}€', '["policyNumber", "premiumAmount"]', 'policy');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'payment_received') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('payment_received', 'success', 'Paiement reçu', 'Nous avons bien reçu votre paiement de {{amount}}€ pour la police {{policyNumber}}', '["amount", "policyNumber"]', 'payment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'payment_failed') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('payment_failed', 'error', 'Paiement échoué', 'Votre paiement de {{amount}}€ a échoué. Veuillez mettre à jour vos informations bancaires', '["amount"]', 'payment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'insurer_approved') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('insurer_approved', 'success', 'Compte assureur approuvé', 'Félicitations ! Votre compte assureur a été approuvé. Vous pouvez maintenant créer des offres', '[]', 'approval');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'offer_approved') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('offer_approved', 'success', 'Offre approuvée', 'Votre offre "{{offerName}}" a été approuvée et est maintenant visible par les utilisateurs', '["offerName"]', 'approval');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.notification_templates WHERE name = 'system_maintenance') THEN
    INSERT INTO public.notification_templates (name, type, subject, content, variables, category) VALUES
    ('system_maintenance', 'warning', 'Maintenance système', 'Le système sera en maintenance le {{date}} de {{startTime}} à {{endTime}}', '["date", "startTime", "endTime"]', 'system');
  END IF;
END $$;

-- Commentaires pour documenter les tables
COMMENT ON TABLE public.notifications IS 'Notifications pour les utilisateurs du système';
COMMENT ON TABLE public.notification_preferences IS 'Préférences de notification par utilisateur';
COMMENT ON TABLE public.notification_templates IS 'Templates de notification système';
COMMENT ON TABLE public.notification_logs IS 'Logs d''envoi des notifications';