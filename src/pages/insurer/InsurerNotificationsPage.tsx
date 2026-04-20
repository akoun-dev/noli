import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Car,
  User,
  Settings,
  Trash2,
  Archive
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export const InsurerNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('insurer-alerts-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insurer_alerts'
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
        .is('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

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

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notification.customer && notification.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesRead = readFilter === 'all' ||
                       (readFilter === 'read' && notification.isRead) ||
                       (readFilter === 'unread' && !notification.isRead);

    return matchesSearch && matchesType && matchesPriority && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('insurer_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      logger.error('Error marking notification as read', { error: err });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('insurer_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      logger.error('Error marking all as read', { error: err });
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.action) {
      logger.info('Action:', notification.action.type, notification.action.data);
      // Navigate or perform action
    }
    markAsRead(notification.id);
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Mark as deleted instead of actually deleting
      const { error } = await supabase
        .from('insurer_alerts')
        .update({ is_deleted: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      logger.error('Error deleting notification', { error: err });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_request':
        return <Car className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'call':
        return <Phone className="h-5 w-5" />;
      case 'urgent':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-600';
    switch (type) {
      case 'quote_request':
        return 'bg-blue-100 text-blue-600';
      case 'message':
        return 'bg-green-100 text-green-600';
      case 'call':
        return 'bg-purple-100 text-purple-600';
      case 'urgent':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Gérez vos alertes et communications</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Non lues</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => {
                    const notificationDate = new Date(n.timestamp);
                    const today = new Date();
                    return notificationDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="quote_request">Devis</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="call">Appels</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des notifications...</p>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || readFilter !== 'all'
                  ? 'Aucune notification trouvée'
                  : 'Aucune notification'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || readFilter !== 'all'
                  ? 'Aucune notification ne correspond à vos critères de recherche.'
                  : 'Vous n\'avez pas encore de notifications.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.isRead ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                            {notification.priority === 'high' ? 'Urgent' : notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Badge>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{notification.message}</p>

                        {notification.customer && (
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {notification.customer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{notification.customer.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {notification.customer.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {notification.customer.phone}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>

                          <div className="flex items-center gap-2">
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(notification)}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default InsurerNotificationsPage;
