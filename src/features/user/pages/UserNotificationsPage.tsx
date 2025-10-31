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
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead(user.id);
    }
  };

  const handleActionClick = (url: string) => {
    window.location.href = url;
  };

  const notifications = (notificationsData as any)?.notifications || [];
  const unreadNotifications = unreadNotificationsData || [];

  const filteredNotifications = notifications.filter((notification: any) => {
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterChannel !== 'all' && !notification.channels.includes(filterChannel as any)) return false;
    if (filterStatus !== 'all' && notification.status !== filterStatus) return false;
    return true;
  });

  const unreadFiltered = filteredNotifications.filter((n: any) => n.status === 'unread');
  const readFiltered = filteredNotifications.filter((n: any) => n.status === 'read');

  const channelStats = {
    email: (stats?.byType?.quote_generated || 0) + (stats?.byType?.payment_received || 0),
    push: unreadNotifications.length,
    whatsapp: preferences?.channels.whatsapp ? stats?.thisWeek || 0 : 0,
    sms: preferences?.channels.sms ? stats?.thisWeek || 0 : 0,
  };

  const NotificationStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-xl sm:text-2xl font-bold">{channelStats.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Push</p>
              <p className="text-xl sm:text-2xl font-bold">{channelStats.push}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">WhatsApp</p>
              <p className="text-xl sm:text-2xl font-bold">{channelStats.whatsapp}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Inbox className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Non lues</p>
              <p className="text-xl sm:text-2xl font-bold">{stats?.unread || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Centre de Notifications</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Restez informé de toutes vos activités d'assurance</p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.unread && stats.unread > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Tout marquer comme lu</span>
              <span className="sm:hidden">Tout lire</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {!statsLoading && stats && <NotificationStatsCards />}

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg sm:text-xl">Notifications</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full sm:col-span-2 lg:col-span-1">
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
        <CardContent className="p-4 sm:p-6">
          {/* Tab Navigation */}
          <div className="grid w-full grid-cols-2 h-auto border-b mb-6">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 py-3 px-2 sm:px-4 border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="text-sm sm:text-base">Notifications</span>
              {stats?.unread && stats.unread > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {stats.unread}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2 py-3 px-2 sm:px-4 border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm sm:text-base">Préférences</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'notifications' && (
            <div className="mt-6">
              {/* Unread Notifications */}
              {unreadFiltered.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold">Notifications non lues</h3>
                    <Badge variant="outline" className="text-sm">{unreadFiltered.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {unreadFiltered.map((notification: any) => (
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
                  <h3 className="text-lg sm:text-xl font-semibold">Notifications lues</h3>
                  <Badge variant="outline" className="text-sm">{readFiltered.length}</Badge>
                </div>

                {notificationsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-3 sm:p-4">
                          <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : readFiltered.length > 0 ? (
                  <div className="space-y-3">
                    {readFiltered.map((notification: any) => (
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
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune notification trouvée</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune notification lue pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="mt-6">
              {preferencesLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="p-4 sm:p-6">
                        <div className="h-6 bg-muted rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-3">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="h-16 bg-muted rounded"></div>
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
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Impossible de charger vos préférences</p>
                </div>
              )}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserNotificationsPage;