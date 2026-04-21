-- Migration: Create notifications table
-- Date: 2026-04-21

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT CHECK (category IN ('quote', 'payment', 'policy', 'system', 'marketing')),
  action_url TEXT,
  action_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_status_idx ON public.notifications(status);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_category_idx ON public.notifications(category);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;

-- Comment
COMMENT ON TABLE public.notifications IS 'Notifications utilisateur pour alerts et mises à jour';

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push BOOLEAN NOT NULL DEFAULT true,
  email BOOLEAN NOT NULL DEFAULT true,
  whatsapp BOOLEAN NOT NULL DEFAULT true,
  quotes BOOLEAN NOT NULL DEFAULT true,
  policies BOOLEAN NOT NULL DEFAULT true,
  payments BOOLEAN NOT NULL DEFAULT true,
  promotions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS user_notification_preferences_user_id_idx ON public.user_notification_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their preferences" ON public.user_notification_preferences;

CREATE POLICY "Users can view their own preferences"
ON public.user_notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their preferences"
ON public.user_notification_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences"
ON public.user_notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_notification_preferences TO authenticated;

-- Comment
COMMENT ON TABLE public.user_notification_preferences IS 'Préférences de notification des utilisateurs';
