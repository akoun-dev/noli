import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Car,
  X,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: 'quote_request' | 'message' | 'call' | 'urgent' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  action?: {
    type: 'call' | 'email' | 'view' | 'approve' | 'reject';
    label: string;
    data?: any;
  };
  customer?: {
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  quoteId?: string;
}

interface NotificationSystemProps {
  onNotificationAction?: (action: string, data: any) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onNotificationAction,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'quote_request',
      title: 'Nouveau devis reçu',
      message: 'Jean Kouadio a demandé un devis pour une Toyota Yaris 2020',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      isRead: false,
      priority: 'medium',
      action: {
        type: 'view',
        label: 'Voir le devis',
        data: { quoteId: 'quote-123' }
      },
      customer: {
        name: 'Jean Kouadio',
        email: 'jean.kouadio@email.com',
        phone: '+225 07 00 00 00 00'
      },
      quoteId: 'quote-123'
    },
    {
      id: '2',
      type: 'urgent',
      title: 'Devis urgent - Expiration imminente',
      message: 'Le devis de Koffi Yao expire dans 2 heures',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      isRead: false,
      priority: 'high',
      action: {
        type: 'approve',
        label: 'Traiter maintenant',
        data: { quoteId: 'quote-456' }
      },
      customer: {
        name: 'Koffi Yao',
        email: 'koffi.yao@email.com',
        phone: '+225 07 00 00 00 02'
      },
      quoteId: 'quote-456'
    },
    {
      id: '3',
      type: 'call',
      title: 'Appel manqué',
      message: 'Marie Amani a tenté de vous joindre concernant son devis',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      isRead: true,
      priority: 'medium',
      action: {
        type: 'call',
        label: 'Rappeler',
        data: { phone: '+225 07 00 00 00 01' }
      },
      customer: {
        name: 'Marie Amani',
        email: 'marie.amani@email.com',
        phone: '+225 07 00 00 00 01'
      }
    },
    {
      id: '4',
      type: 'message',
      title: 'Nouveau message',
      message: 'Fatou Sylla: "Je voudrais modifier mon devis"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: true,
      priority: 'low',
      action: {
        type: 'email',
        label: 'Répondre',
        data: { email: 'fatou.sylla@email.com' }
      },
      customer: {
        name: 'Fatou Sylla',
        email: 'fatou.sylla@email.com',
        phone: '+225 07 00 00 00 03'
      }
    },
    {
      id: '5',
      type: 'system',
      title: 'Rapport journalier disponible',
      message: 'Votre rapport de performance du jour est prêt',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      isRead: true,
      priority: 'low',
      action: {
        type: 'view',
        label: 'Voir le rapport',
        data: { reportId: 'daily-123' }
      }
    }
  ]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleAction = (notification: Notification) => {
    if (notification.action) {
      onNotificationAction?.(notification.action.type, notification.action.data);
    }
    markAsRead(notification.id);
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_request':
        return <Car className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600';
    switch (type) {
      case 'quote_request':
        return 'text-blue-600';
      case 'message':
        return 'text-green-600';
      case 'call':
        return 'text-purple-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-96 max-h-96">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Tout marquer comme lu
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="p-0 focus:bg-gray-50"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div
                    className={`w-full p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>

                            {notification.customer && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <User className="h-3 w-3" />
                                  <span>{notification.customer.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  <span>{notification.customer.phone}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatTimeAgo(notification.timestamp)}
                              </span>

                              {notification.action && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => handleAction(notification)}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0"
                            onClick={() => removeNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/assureur/notifications">Voir toutes les notifications</a>
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sound indicator for real-time notifications */}
      <div className="absolute -top-1 -right-1">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};