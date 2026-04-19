import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Types pour le système de notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'general' | 'quote' | 'policy' | 'payment' | 'system' | 'approval';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  categories: Record<string, {
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
  }>;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  titleTemplate: string;
  messageTemplate: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  variables: string[];
  actionUrlTemplate?: string;
  actionTextTemplate?: string;
  isActive: boolean;
}

export interface NotificationLog {
  id: string;
  notificationId?: string;
  userId?: string;
  channel: 'email' | 'push' | 'sms' | 'whatsapp' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  provider?: string;
  externalId?: string;
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'general' | 'quote' | 'policy' | 'payment' | 'system' | 'approval';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface UpdateNotificationPreferencesRequest {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  categories?: Record<string, {
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
  }>;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

// API Functions

export const fetchNotifications = async (userId?: string, limit = 50): Promise<Notification[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchNotifications:', error);
    throw error;
  }
};

export const fetchUnreadNotifications = async (userId?: string): Promise<Notification[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('read', false)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching unread notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchUnreadNotifications:', error);
    throw error;
  }
};

export const fetchNotificationPreferences = async (userId?: string): Promise<NotificationPreferences | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error fetching notification preferences:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error in fetchNotificationPreferences:', error);
    throw error;
  }
};

export const updateNotificationPreferences = async (
  updates: UpdateNotificationPreferencesRequest,
  userId?: string
): Promise<NotificationPreferences> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: targetUserId,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error in updateNotificationPreferences:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId
    });

    if (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }

    return data || false;
  } catch (error) {
    logger.error('Error in markNotificationAsRead:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId?: string): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    const { data, error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_id: targetUserId
    });

    if (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    logger.error('Error in markAllNotificationsAsRead:', error);
    throw error;
  }
};

export const createNotification = async (notification: CreateNotificationRequest): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: notification.userId,
      p_title: notification.title,
      p_message: notification.message,
      p_type: notification.type || 'info',
      p_category: notification.category || 'general',
      p_action_url: notification.actionUrl,
      p_action_text: notification.actionText,
      p_metadata: notification.metadata || {},
      p_expires_at: notification.expiresAt
    });

    if (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Erreur lors de la création de la notification');
    }

    return data;
  } catch (error) {
    logger.error('Error in createNotification:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    throw error;
  }
};

export const fetchNotificationTemplates = async (): Promise<NotificationTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('Error fetching notification templates:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchNotificationTemplates:', error);
    throw error;
  }
};

export const fetchNotificationLogs = async (userId?: string, limit = 100): Promise<NotificationLog[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching notification logs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error in fetchNotificationLogs:', error);
    throw error;
  }
};

// React Query Hooks

export const useNotifications = (userId?: string, limit = 50) => {
  return useQuery({
    queryKey: ['notifications', userId, limit],
    queryFn: () => fetchNotifications(userId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUnreadNotifications = (userId?: string) => {
  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: () => fetchUnreadNotifications(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useNotificationPreferences = (userId?: string) => {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => fetchNotificationPreferences(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ updates, userId }: { updates: UpdateNotificationPreferencesRequest; userId?: string }) =>
      updateNotificationPreferences(updates, userId),
    onSuccess: () => {
      toast.success('Préférences de notification mises à jour');
      queryClient.invalidateQueries(['notification-preferences']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des préférences');
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de la notification');
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (count) => {
      toast.success(`${count} notification(s) marquée(s) comme lue(s)`);
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage des notifications');
    },
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      toast.success('Notification créée avec succès');
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la notification');
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success('Notification supprimée');
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la notification');
    },
  });
};

export const useNotificationTemplates = () => {
  return useQuery({
    queryKey: ['notification-templates'],
    queryFn: fetchNotificationTemplates,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useNotificationLogs = (userId?: string, limit = 100) => {
  return useQuery({
    queryKey: ['notification-logs', userId, limit],
    queryFn: () => fetchNotificationLogs(userId, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper functions

export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => !n.read).length;
};

export const getNotificationsByCategory = (notifications: Notification[]): Record<string, Notification[]> => {
  return notifications.reduce((acc, notification) => {
    const category = notification.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);
};

export const formatNotificationTime = (createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR');
};

export const getNotificationIcon = (type: string, category: string): string => {
  // Logique pour déterminer l'icône basée sur le type et la catégorie
  const iconMap: Record<string, string> = {
    'info-general': 'info',
    'success-quote': 'check-circle',
    'warning-payment': 'alert-triangle',
    'error-system': 'alert-circle',
    'info-policy': 'shield',
    'success-approval': 'check-circle',
  };

  const key = `${type}-${category}`;
  return iconMap[key] || type;
};