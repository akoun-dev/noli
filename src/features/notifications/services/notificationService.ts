import React from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  category: NotificationCategory;
  channels: NotificationChannel[];
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  isSystem: boolean;
}

export type NotificationType =
  | 'quote_generated'
  | 'quote_approved'
  | 'quote_expired'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_reminder'
  | 'policy_created'
  | 'policy_renewal_reminder'
  | 'policy_expired'
  | 'account_update'
  | 'security_alert'
  | 'system_maintenance'
  | 'new_feature'
  | 'marketing'
  | 'support_message';

export type NotificationCategory =
  | 'quotes'
  | 'payments'
  | 'policies'
  | 'account'
  | 'security'
  | 'system'
  | 'marketing'
  | 'support';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'whatsapp' | 'push';

export interface NotificationData {
  quoteId?: string;
  policyId?: string;
  paymentId?: string;
  amount?: number;
  insurer?: string;
  expiryDate?: string;
  actionRequired?: boolean;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    inApp: boolean;
  };
  categories: Record<NotificationCategory, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byCategory: Record<NotificationCategory, number>;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: NotificationCategory;
  status?: 'unread' | 'read' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'quote_generated',
    title: 'Nouveau devis disponible',
    message: 'Votre devis pour Toyota Yaris est prêt. Prime annuelle: 125,000 FCFA',
    data: {
      quoteId: 'quote_123',
      amount: 125000,
      insurer: 'NSIA Assurance'
    },
    priority: 'medium',
    status: 'unread',
    category: 'quotes',
    channels: ['in_app', 'email'],
    createdAt: '2024-01-20T10:30:00Z',
    actionUrl: '/mes-devis',
    actionText: 'Voir le devis',
    isSystem: false
  },
  {
    id: '2',
    userId: '1',
    type: 'payment_received',
    title: 'Paiement confirmé',
    message: 'Votre paiement de 125,000 FCFA a été reçu avec succès',
    data: {
      paymentId: 'pay_123',
      amount: 125000,
      policyId: 'policy_123'
    },
    priority: 'high',
    status: 'read',
    category: 'payments',
    channels: ['in_app', 'email', 'sms'],
    createdAt: '2024-01-19T14:20:00Z',
    readAt: '2024-01-19T14:25:00Z',
    actionUrl: '/mes-contrats',
    actionText: 'Voir le contrat',
    isSystem: false
  },
  {
    id: '3',
    userId: '1',
    type: 'policy_renewal_reminder',
    title: 'Rappel de renouvellement',
    message: 'Votre contrat POL-2024-001 expire dans 15 jours',
    data: {
      policyId: 'policy_123',
      expiryDate: '2024-02-05'
    },
    priority: 'high',
    status: 'unread',
    category: 'policies',
    channels: ['in_app', 'email', 'sms'],
    createdAt: '2024-01-18T09:00:00Z',
    actionUrl: '/mes-contrats',
    actionText: 'Renouveler maintenant',
    isSystem: true
  },
  {
    id: '4',
    userId: '1',
    type: 'system_maintenance',
    title: 'Maintenance prévue',
    message: 'Le système sera indisponible le 25 janvier de 02:00 à 04:00',
    priority: 'medium',
    status: 'read',
    category: 'system',
    channels: ['in_app'],
    createdAt: '2024-01-17T16:00:00Z',
    readAt: '2024-01-17T16:05:00Z',
    isSystem: true
  }
];

const mockPreferences: NotificationPreferences = {
  userId: '1',
  channels: {
    email: true,
    sms: true,
    whatsapp: true,
    push: true,
    inApp: true
  },
  categories: {
    quotes: { enabled: true, channels: ['in_app', 'email', 'sms'] },
    payments: { enabled: true, channels: ['in_app', 'email', 'sms'] },
    policies: { enabled: true, channels: ['in_app', 'email', 'sms', 'whatsapp'] },
    account: { enabled: true, channels: ['in_app', 'email'] },
    security: { enabled: true, channels: ['in_app', 'email', 'sms'] },
    system: { enabled: true, channels: ['in_app'] },
    marketing: { enabled: false, channels: [] },
    support: { enabled: true, channels: ['in_app', 'email'] }
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  },
  frequency: 'immediate'
};

const mockStats: NotificationStats = {
  total: 156,
  unread: 12,
  byType: {
    quote_generated: 45,
    quote_approved: 23,
    quote_expired: 8,
    payment_received: 34,
    payment_failed: 5,
    payment_reminder: 12,
    policy_created: 18,
    policy_renewal_reminder: 7,
    policy_expired: 2,
    account_update: 15,
    security_alert: 3,
    system_maintenance: 8,
    new_feature: 12,
    marketing: 25,
    support_message: 6
  },
  byCategory: {
    quotes: 76,
    payments: 51,
    policies: 27,
    account: 15,
    security: 3,
    system: 8,
    marketing: 25,
    support: 6
  },
  today: 3,
  thisWeek: 18,
  thisMonth: 67
};

// Real-time simulation
let notificationListeners: ((notification: Notification) => void)[] = [];

// API Functions
export const fetchNotifications = async (userId: string, filters?: NotificationFilters, page = 1, limit = 20): Promise<{
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  let filtered = [...mockNotifications];

  // Apply filters
  if (filters?.type) {
    filtered = filtered.filter(n => n.type === filters.type);
  }

  if (filters?.category) {
    filtered = filtered.filter(n => n.category === filters.category);
  }

  if (filters?.status) {
    filtered = filtered.filter(n => n.status === filters.status);
  }

  if (filters?.priority) {
    filtered = filtered.filter(n => n.priority === filters.priority);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(searchLower) ||
      n.message.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.dateRange) {
    filtered = filtered.filter(n => {
      const notificationDate = new Date(n.createdAt);
      return notificationDate >= new Date(filters.dateRange!.start) &&
             notificationDate <= new Date(filters.dateRange!.end);
    });
  }

  // Sort by creation date (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    notifications: paginated,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit)
  };
};

export const fetchUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockNotifications.filter(n => n.status === 'unread');
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const notification = mockNotifications.find(n => n.id === notificationId);
  if (!notification) {
    throw new Error('Notification non trouvée');
  }

  notification.status = 'read';
  notification.readAt = new Date().toISOString();

  return notification;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  mockNotifications.forEach(notification => {
    if (notification.userId === userId && notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = new Date().toISOString();
    }
  });
};

export const archiveNotification = async (notificationId: string): Promise<Notification> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const notification = mockNotifications.find(n => n.id === notificationId);
  if (!notification) {
    throw new Error('Notification non trouvée');
  }

  notification.status = 'archived';

  return notification;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  const index = mockNotifications.findIndex(n => n.id === notificationId);
  if (index === -1) {
    throw new Error('Notification non trouvée');
  }

  mockNotifications.splice(index, 1);
};

export const fetchNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return { ...mockPreferences, userId };
};

export const updateNotificationPreferences = async (userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  Object.assign(mockPreferences, preferences);
  return { ...mockPreferences };
};

export const fetchNotificationStats = async (userId: string): Promise<NotificationStats> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockStats;
};

// Real-time functions
export const subscribeToNotifications = (userId: string, callback: (notification: Notification) => void) => {
  const listener = (notification: Notification) => {
    if (notification.userId === userId) {
      callback(notification);
    }
  };

  notificationListeners.push(listener);

  // Simulate real-time notifications
  const simulateNotification = () => {
    const types: NotificationType[] = ['quote_generated', 'payment_received', 'system_maintenance'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const newNotification: Notification = {
      id: Date.now().toString(),
      userId,
      type: randomType,
      title: 'Nouvelle notification',
      message: 'Ceci est une notification simulée en temps réel',
      priority: 'medium',
      status: 'unread',
      category: 'system',
      channels: ['in_app'],
      createdAt: new Date().toISOString(),
      isSystem: true
    };

    // Add to mock notifications
    mockNotifications.unshift(newNotification);

    // Notify listeners
    notificationListeners.forEach(listener => listener(newNotification));
  };

  // Simulate random notifications every 30 seconds
  const interval = setInterval(simulateNotification, 30000);

  // Return unsubscribe function
  return () => {
    notificationListeners = notificationListeners.filter(l => l !== listener);
    clearInterval(interval);
  };
};

// React Query Hooks
export const useNotifications = (userId: string, filters?: NotificationFilters, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['notifications', userId, filters, page, limit],
    queryFn: () => fetchNotifications(userId, filters, page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true
  });
};

export const useInfiniteNotifications = (userId: string, filters?: NotificationFilters) => {
  return useInfiniteQuery({
    queryKey: ['notifications-infinite', userId, filters],
    queryFn: ({ pageParam = 1 }) => fetchNotifications(userId, filters, pageParam),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUnreadNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['unread-notifications', userId],
    queryFn: () => fetchUnreadNotifications(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 1 * 60 * 1000, // Refetch every minute
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (notification) => {
      queryClient.invalidateQueries(['notifications', notification.userId]);
      queryClient.invalidateQueries(['unread-notifications', notification.userId]);
      queryClient.invalidateQueries(['notification-stats', notification.userId]);
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage de la notification comme lue');
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries(['notifications', userId]);
      queryClient.invalidateQueries(['unread-notifications', userId]);
      queryClient.invalidateQueries(['notification-stats', userId]);
      toast.success('Toutes les notifications ont été marquées comme lues');
    },
    onError: (error) => {
      toast.error('Erreur lors du marquage des notifications comme lues');
    },
  });
};

export const useArchiveNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveNotification,
    onSuccess: (notification) => {
      queryClient.invalidateQueries(['notifications', notification.userId]);
      queryClient.invalidateQueries(['unread-notifications', notification.userId]);
      toast.success('Notification archivée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'archivage de la notification');
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, notificationId) => {
      // Find the notification to get userId for cache invalidation
      const notification = mockNotifications.find(n => n.id === notificationId);
      if (notification) {
        queryClient.invalidateQueries(['notifications', notification.userId]);
        queryClient.invalidateQueries(['unread-notifications', notification.userId]);
        queryClient.invalidateQueries(['notification-stats', notification.userId]);
      }
      toast.success('Notification supprimée avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la notification');
    },
  });
};

export const useNotificationPreferences = (userId: string) => {
  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: () => fetchNotificationPreferences(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: Partial<NotificationPreferences> }) =>
      updateNotificationPreferences(userId, preferences),
    onSuccess: (preferences) => {
      queryClient.invalidateQueries(['notification-preferences', preferences.userId]);
      toast.success('Préférences mises à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des préférences');
    },
  });
};

export const useNotificationStats = (userId: string) => {
  return useQuery({
    queryKey: ['notification-stats', userId],
    queryFn: () => fetchNotificationStats(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useRealTimeNotifications = (userId: string) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      // Update queries when new notification arrives
      queryClient.invalidateQueries(['notifications', userId]);
      queryClient.invalidateQueries(['unread-notifications', userId]);
      queryClient.invalidateQueries(['notification-stats', userId]);

      // Show toast notification for high priority notifications
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast(notification.title, {
          description: notification.message,
          action: notification.actionText ? {
            label: notification.actionText,
            onClick: () => {
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }
          } : undefined
        });
      }
    });

    return unsubscribe;
  }, [userId, queryClient]);
};