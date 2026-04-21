import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  quotes: boolean;
  policies: boolean;
  payments: boolean;
  promotions: boolean;
}

const defaultPreferences: NotificationPreferences = {
  push: true,
  email: true,
  whatsapp: true,
  quotes: true,
  policies: true,
  payments: true,
  promotions: false,
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Charger les notifications depuis Supabase
  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const formattedNotifications = (data || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          timestamp: new Date(n.created_at),
          read: n.status === 'read',
          actionUrl: n.action_url,
          actionText: n.action_text,
        }));

        setNotifications(formattedNotifications);
      } catch (err) {
        logger.error('Error loading notifications:', err);
      }
    };

    loadNotifications();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Charger les préférences depuis Supabase
  useEffect(() => {
    if (!user?.id) return;

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setPreferences(data as NotificationPreferences);
        }
      } catch (err) {
        logger.error('Error loading notification preferences:', err);
      }
    };

    loadPreferences();
  }, [user?.id]);

  // Vérifier si les notifications push sont supportées
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      logger.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  };

  const showNotification = async (data: NotificationData) => {
    if (!user?.id) return;

    try {
      // Créer la notification dans Supabase
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: data.title,
          message: data.message,
          type: data.type,
          status: 'unread',
          action_url: data.actionUrl,
          action_text: data.actionText,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Afficher notification push si permission accordée
      if (permission === 'granted' && preferences.push) {
        const notification = new Notification(data.title, {
          body: data.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: data.id,
          requireInteraction: false,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          if (data.actionUrl) {
            window.location.href = data.actionUrl;
          }
          notification.close();
        };

        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // TODO: Implémenter l'envoi WhatsApp et email réels
      if (preferences.whatsapp && data.type !== 'info') {
        logger.info('WhatsApp notification à implémenter:', data);
      }

      if (preferences.email && data.type !== 'info') {
        logger.info('Email notification à implémenter:', data);
      }
    } catch (err) {
      logger.error('Error showing notification:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      logger.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'unread');

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      logger.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      logger.error('Error deleting notification:', err);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return;

    try {
      const updated = { ...preferences, ...newPreferences };

      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...updated,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setPreferences(updated);
    } catch (err) {
      logger.error('Error updating notification preferences:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    preferences,
    isSupported,
    permission,
    unreadCount,
    requestPermission,
    showNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
  };
};
