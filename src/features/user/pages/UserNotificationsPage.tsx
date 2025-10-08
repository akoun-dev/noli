import React, { useState } from 'react';
import {
  useNotifications,
  useUnreadNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationPreferences,
  useNotificationStats,
  useRealTimeNotifications
} from '../../notifications/services/notificationService';
import { NotificationItem } from '../components/NotificationItem';
import { NotificationPreferencesComponent } from '../components/NotificationPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageCircle, Check, Settings, Filter, Calendar, Search, Trash2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const UserNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Real-time notifications
  useRealTimeNotifications(user?.id || '');

  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications(user?.id || '');
  const { data: unreadNotificationsData, isLoading: unreadLoading } = useUnreadNotifications(user?.id || '');
  const { data: stats, isLoading: statsLoading } = useNotificationStats(user?.id || '');
  const { data: preferences, isLoading: preferencesLoading } = useNotificationPreferences(user?.id || '');
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead.mutateAsync(user.id);
    }
  };

  const handleActionClick = (url: string) => {
    window.location.href = url;
  };

  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = unreadNotificationsData || [];

  const filteredNotifications = notifications.filter(notification => {
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterChannel !== 'all' && !notification.channels.includes(filterChannel as any)) return false;
    if (filterStatus !== 'all' && notification.status !== filterStatus) return false;
    return true;
  });

  const unreadFiltered = filteredNotifications.filter(n => n.status === 'unread');
  const readFiltered = filteredNotifications.filter(n => n.status === 'read');

  const channelStats = {
    email: stats?.byType?.quote_generated || 0 + stats?.byType?.payment_received || 0,
    push: unreadNotifications.length,
    whatsapp: preferences?.channels.whatsapp ? stats?.thisWeek || 0 : 0,
    sms: preferences?.channels.sms ? stats?.thisWeek || 0 : 0,
  };

  const NotificationStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-2xl font-bold">{channelStats.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Bell className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Push</p>
              <p className="text-2xl font-bold">{channelStats.push}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <MessageCircle className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
              <p className="text-2xl font-bold">{channelStats.whatsapp}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Inbox className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Non lues</p>
              <p className="text-2xl font-bold">{stats?.unread || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Centre de Notifications</h1>
          <p className="text-muted-foreground">Restez informé de toutes vos activités d'assurance</p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.unread && stats.unread > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {!statsLoading && stats && <NotificationStatsCards />}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="quote">Devis</SelectItem>
                  <SelectItem value="policy">Contrats</SelectItem>
                  <SelectItem value="payment">Paiements</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous canaux</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
              </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {stats?.unread && stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Préférences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
              {/* Unread Notifications */}
              {unreadFiltered.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Notifications non lues</h3>
                    <Badge variant="outline">{unreadFiltered.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {unreadFiltered.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onActionClick={handleActionClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Read Notifications */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Notifications lues</h3>
                  <Badge variant="outline">{readFiltered.length}</Badge>
                </div>

                {notificationsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : readFiltered.length > 0 ? (
                  <div className="space-y-3">
                    {readFiltered.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onActionClick={handleActionClick}
                      />
                    ))}
                  </div>
                ) : filterCategory !== 'all' || filterChannel !== 'all' || filterStatus !== 'all' ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification trouvée</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune notification lue pour le moment</p>
                  </div>
                )}
              </div>
            </TabsContent>

        <TabsContent value="preferences" className="mt-6">
              {preferencesLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="h-16 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : preferences ? (
                <NotificationPreferencesComponent
                  preferences={preferences}
                  isLoading={preferencesLoading}
                />
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Impossible de charger vos préférences</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserNotificationsPage;