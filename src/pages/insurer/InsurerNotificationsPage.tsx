import React, { useState } from 'react';
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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'quote_request',
      title: 'Nouveau devis reçu',
      message: 'Jean Kouadio a demandé un devis pour une Toyota Yaris 2020. Le client est intéressé par l\'offre Tiers Simple avec une couverture étendue.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
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
      message: 'Le devis de Koffi Yao expire dans 2 heures. Client VIP avec un BMW X3 2021. Montant du devis: 150,000 FCFA.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
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
      message: 'Marie Amani a tenté de vous joindre concernant son devis pour une Honda Civic 2019. Elle souhaitait discuter des options de couverture.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
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
      title: 'Nouveau message reçu',
      message: 'Fatou Sylla: "Je voudrais modifier mon devis pour ajouter la garantie vol. Mon véhicule est un Peugeot 208 2018."',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
      title: 'Rapport de performance quotidien',
      message: 'Votre rapport de performance du jour est prêt. Taux de conversion: 71%, CA journalier: 1,266,667 FCFA.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      priority: 'low',
      action: {
        type: 'view',
        label: 'Voir le rapport',
        data: { reportId: 'daily-123' }
      }
    },
    {
      id: '6',
      type: 'quote_request',
      title: 'Devis approuvé automatiquement',
      message: 'Le devis de Paul Kouamé a été approuvé automatiquement selon vos règles de souscription. Véhicule: Renault Clio 2019.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      priority: 'low',
      customer: {
        name: 'Paul Kouamé',
        email: 'paul.kouame@email.com',
        phone: '+225 07 00 00 00 04'
      },
      quoteId: 'quote-789'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');

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
      logger.info('Action:', notification.action.type, notification.action.data);
      // Here you would typically navigate or perform the action
    }
    markAsRead(notification.id);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
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
    if (diffMinutes < 60) return `Il y a ${diffMinutes} minutes`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} heures`;

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jours`;
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
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune notification trouvée
              </h3>
              <p className="text-gray-500">
                Aucune notification ne correspond à vos critères de recherche.
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