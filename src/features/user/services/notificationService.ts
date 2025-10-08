import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Notification, NotificationPreferences, NotificationStats } from '../types/notification';

// Mock data for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'email',
    channel: 'email',
    title: 'Nouvelle offre disponible',
    message: 'Une nouvelle offre d\'assurance correspond à votre demande de devis.',
    status: 'unread',
    priority: 'medium',
    category: 'quote',
    metadata: {
      quoteId: '1',
      link: '/mes-devis/1',
      actionButton: {
        text: 'Voir l\'offre',
        url: '/mes-devis/1',
      },
    },
    createdAt: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    userId: 'user1',
    type: 'push',
    channel: 'push',
    title: 'Votre devis a été approuvé',
    message: 'Félicitations ! Votre devis auprès de NSIA Assurance a été approuvé.',
    status: 'read',
    priority: 'high',
    category: 'quote',
    metadata: {
      quoteId: '1',
      link: '/mes-devis/1',
    },
    createdAt: '2024-01-16T14:20:00Z',
    readAt: '2024-01-16T15:00:00Z',
  },
  {
    id: '3',
    userId: 'user1',
    type: 'whatsapp',
    channel: 'whatsapp',
    title: 'Rappel de paiement',
    message: 'Votre paiement pour la police assurance est dû dans 3 jours.',
    status: 'unread',
    priority: 'high',
    category: 'payment',
    metadata: {
      policyId: '1',
      link: '/mes-contrats/1',
    },
    createdAt: '2024-01-18T09:15:00Z',
  },
  {
    id: '4',
    userId: 'user1',
    type: 'email',
    channel: 'email',
    title: 'Offre expirée',
    message: 'Votre devis auprès de AXA Côte d\'Ivoire a expiré.',
    status: 'read',
    priority: 'low',
    category: 'quote',
    metadata: {
      quoteId: '3',
      link: '/mes-devis/3',
    },
    createdAt: '2024-01-12T11:30:00Z',
    readAt: '2024-01-12T12:00:00Z',
  },
];

const mockPreferences: NotificationPreferences = {
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

const mockStats: NotificationStats = {
  total: 4,
  unread: 2,
  byCategory: {
    quote: 3,
    payment: 1,
    policy: 0,
    system: 0,
    marketing: 0,
  },
  byChannel: {
    email: 2,
    push: 1,
    whatsapp: 1,
    sms: 0,
  },
};

// API functions
export const fetchUserNotifications = async (): Promise<Notification[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockPreferences;
};

export const fetchNotificationStats = async (): Promise<NotificationStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockStats;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // In real app, this would make an API call
  const notification = mockNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.status = 'read';
    notification.readAt = new Date().toISOString();
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // In real app, this would make an API call
  mockNotifications.forEach(notification => {
    if (notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = new Date().toISOString();
    }
  });
};

export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  // In real app, this would make an API call
  Object.assign(mockPreferences, preferences);
};

export const sendTestNotification = async (channel: 'email' | 'push' | 'whatsapp'): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // In real app, this would make an API call
  toast.success(`Notification test envoyée via ${channel}`);
};

// React Query hooks
export const useUserNotifications = () => {
  return useQuery({
    queryKey: ['user-notifications'],
    queryFn: fetchUserNotifications,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: fetchNotificationPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: fetchNotificationStats,
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
    mutationFn: markAllNotificationsAsRead,
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
    mutationFn: updateNotificationPreferences,
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