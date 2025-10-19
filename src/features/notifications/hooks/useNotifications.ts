import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

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

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push: true,
    email: true,
    whatsapp: true,
    quotes: true,
    policies: true,
    payments: true,
    promotions: false,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Vérifier si les notifications push sont supportées
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }

    // Charger les notifications depuis localStorage
    const savedNotifications = localStorage.getItem('noli:notifications');
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })));
    }

    // Charger les préférences
    const savedPreferences = localStorage.getItem('noli:notificationPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
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

  const showNotification = (data: NotificationData) => {
    // Ajouter à la liste des notifications
    const newNotification = { ...data, read: false };
    setNotifications(prev => [newNotification, ...prev]);

    // Sauvegarder dans localStorage
    const updatedNotifications = [newNotification, ...notifications];
    localStorage.setItem('noli:notifications', JSON.stringify(updatedNotifications));

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

    // Envoyer notification WhatsApp si activé
    if (preferences.whatsapp && data.type !== 'info') {
      sendWhatsAppNotification(data);
    }

    // Envoyer email si activé (simulation)
    if (preferences.email && data.type !== 'info') {
      sendEmailNotification(data);
    }
  };

  const sendWhatsAppNotification = async (data: NotificationData) => {
    // Simuler l'envoi WhatsApp (remplacer par véritable intégration)
    const message = `🚗 NOLI Assurance\n\n${data.title}\n${data.message}\n\nGérez vos notifications: https://noli.ci/notifications`;

    try {
      // Simuler appel API WhatsApp
      logger.info('Envoi WhatsApp:', message);

      // Stocker pour debug
      const whatsappLogs = JSON.parse(localStorage.getItem('noli:whatsappLogs') || '[]');
      whatsappLogs.push({
        timestamp: new Date().toISOString(),
        message,
        type: data.type,
      });
      localStorage.setItem('noli:whatsappLogs', JSON.stringify(whatsappLogs.slice(-10)));
    } catch (error) {
      logger.error('Erreur envoi WhatsApp:', error);
    }
  };

  const sendEmailNotification = async (data: NotificationData) => {
    // Simuler l'envoi email
    logger.info('Envoi email:', {
      subject: data.title,
      body: data.message,
      type: data.type,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    // Mettre à jour localStorage
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('noli:notifications', JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Mettre à jour localStorage
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('noli:notifications', JSON.stringify(updatedNotifications));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Mettre à jour localStorage
    const updatedNotifications = notifications.filter(n => n.id !== id);
    localStorage.setItem('noli:notifications', JSON.stringify(updatedNotifications));
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem('noli:notificationPreferences', JSON.stringify(updated));
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