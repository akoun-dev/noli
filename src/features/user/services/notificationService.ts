import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Notification, NotificationPreferences, NotificationStats } from '../types/notification';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Default empty values pour le fallback (pas de données mock)
const emptyNotifications: Notification[] = [];

const defaultPreferences: NotificationPreferences = {
  email: {
    quoteUpdates: true,
    policyRenewals: true,
    paymentReminders: true,
    marketing: false,
    systemAlerts: true,
  },
  push: {
    quoteUpdates: true,
    policyRenewals: true,
    paymentReminders: true,
    marketing: false,
    systemAlerts: true,
  },
  whatsapp: {
    quoteUpdates: false,
    policyRenewals: true,
    paymentReminders: true,
    marketing: false,
    systemAlerts: false,
  },
  sms: {
    quoteUpdates: false,
    policyRenewals: true,
    paymentReminders: true,
    systemAlerts: false,
  },
};

const emptyStats: NotificationStats = {
  total: 0,
  unread: 0,
  byCategory: {
    quote: 0,
    payment: 0,
    policy: 0,
    system: 0,
    marketing: 0,
  },
  byChannel: {
    email: 0,
    push: 0,
    whatsapp: 0,
    sms: 0,
  },
};

// API functions
export const fetchUserNotifications = async (userId?: string): Promise<Notification[]> => {
  try {
    if (!userId) {
      return emptyNotifications;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as Notification[]) || emptyNotifications;
  } catch (err) {
    logger.error('Error fetching user notifications:', err);
    return emptyNotifications;
  }
};

export const fetchNotificationPreferences = async (userId?: string): Promise<NotificationPreferences> => {
  try {
    if (!userId) {
      return defaultPreferences;
    }

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return defaults
        return defaultPreferences;
      }
      throw error;
    }

    return (data as NotificationPreferences) || defaultPreferences;
  } catch (err) {
    logger.error('Error fetching notification preferences:', err);
    return defaultPreferences;
  }
};

export const fetchNotificationStats = async (userId?: string): Promise<NotificationStats> => {
  try {
    if (!userId) {
      return emptyStats;
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('category, channel, status')
      .eq('user_id', userId);

    if (error) throw error;

    if (!notifications || notifications.length === 0) {
      return emptyStats;
    }

    // Calculate stats from actual data
    const total = notifications.length;
    const unread = notifications.filter(n => n.status === 'unread').length;

    const byCategory: NotificationStats['byCategory'] = {
      quote: 0,
      payment: 0,
      policy: 0,
      system: 0,
      marketing: 0,
    };

    const byChannel: NotificationStats['byChannel'] = {
      email: 0,
      push: 0,
      whatsapp: 0,
      sms: 0,
    };

    notifications.forEach(n => {
      if (n.category && n.category in byCategory) {
        byCategory[n.category as keyof typeof byCategory]++;
      }
      if (n.channel && n.channel in byChannel) {
        byChannel[n.channel as keyof typeof byChannel]++;
      }
    });

    return { total, unread, byCategory, byChannel };
  } catch (err) {
    logger.error('Error fetching notification stats:', err);
    return emptyStats;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (err) {
    logger.error('Error marking notification as read:', err);
    throw err;
  }
};

export const markAllNotificationsAsRead = async (userId?: string): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('User ID required');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'unread');

    if (error) throw error;
  } catch (err) {
    logger.error('Error marking all notifications as read:', err);
    throw err;
  }
};

export const updateNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreferences
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (err) {
    logger.error('Error updating notification preferences:', err);
    throw err;
  }
};

export const sendTestNotification = async (channel: 'email' | 'push' | 'whatsapp'): Promise<void> => {
  // TODO: Implémenter l'envoi de notification test
  toast.info(`Fonctionnalité de notification test via ${channel} à implémenter`);
};

// React Query hooks
export const useUserNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ['user-notifications', userId],
    queryFn: () => fetchUserNotifications(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useNotificationPreferences = (userId?: string) => {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => fetchNotificationPreferences(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useNotificationStats = (userId?: string) => {
  return useQuery({
    queryKey: ['notification-stats', userId],
    queryFn: () => fetchNotificationStats(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de la notification comme lue');
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => markAllNotificationsAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast.success('Toutes les notifications ont été marquées comme lues');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage des notifications');
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: NotificationPreferences }) =>
      updateNotificationPreferences(userId, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Préférences de notification mises à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des préférences');
    },
  });
};

export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: sendTestNotification,
  });
};
