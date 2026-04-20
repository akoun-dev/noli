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
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('insurer-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insurer_alerts',
          filter: 'insurer_id=eq.current_insurer'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);

      // Get current insurer ID
      const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id');
      if (insurerError || !insurerData || insurerData.length === 0) {
        logger.error('Unable to retrieve insurer information');
        return;
      }

      const insurerId = insurerData[0].insurer_id;

      // Load alerts from insurer_alerts table
      const { data: alerts, error } = await supabase
        .from('insurer_alerts')
        .select('*')
        .eq('insurer_id', insurerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (alerts) {
        const mappedNotifications: Notification[] = alerts.map(alert => ({
          id: alert.id,
          type: alert.alert_type || 'system',
          title: alert.title || 'Notification',
          message: alert.message || '',
          timestamp: alert.created_at,
          isRead: alert.is_read ?? false,
          priority: alert.priority || 'low',
          action: alert.action_data ? {
            type: alert.action_data.type || 'view',
            label: alert.action_data.label || 'Voir',
            data: alert.action_data.data
          } : undefined,
          customer: alert.customer_data ? {
            name: alert.customer_data.name || '',
            email: alert.customer_data.email || '',
            phone: alert.customer_data.phone || '',
            avatar: alert.customer_data.avatar
          } : undefined,
          quoteId: alert.quote_id
        }));

        setNotifications(mappedNotifications);
      }
    } catch (err) {
      logger.error('Error loading notifications', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('insurer_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      logger.error('Error marking notification as read', { error: err });
    }
  };

  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

      if (unreadIds.length === 0) return;

      // Update in database
      const { error } = await supabase
        .from('insurer_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      logger.error('Error marking all as read', { error: err });
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.action) {
      onNotificationAction?.(notification.action.type, notification.action.data);
    }
    markAsRead(notification.id);
  };

  const removeNotification = async (notificationId: string) => {
    try {
      // Delete from database (or mark as deleted)
      const { error } = await supabase
        .from('insurer_alerts')
        .update({ is_deleted: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      logger.error('Error removing notification', { error: err });
    }
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
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
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
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};
