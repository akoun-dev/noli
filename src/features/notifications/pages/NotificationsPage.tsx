import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bell,
  Search,
  Filter,
  CheckCircle2,
  Archive,
  Trash2,
  Settings,
  Star,
  Clock,
  AlertTriangle,
  Info,
  Mail,
  MessageSquare,
  Smartphone,
  MoreHorizontal,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Notification,
  NotificationPreferences,
  useNotifications,
  useUnreadNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useArchiveNotification,
  useDeleteNotification,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useNotificationStats,
  useRealTimeNotifications,
  NotificationFilters
} from '../services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [page, setPage] = useState(1);

  // Real-time notifications
  useRealTimeNotifications(user?.id || '');

  const { data: notificationsData, isLoading } = useNotifications(user?.id || '', filters, page);
  const { data: unreadNotifications } = useUnreadNotifications(user?.id || '');
  const { data: preferences } = useNotificationPreferences(user?.id || '');
  const { data: stats } = useNotificationStats(user?.id || '');

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const archiveNotification = useArchiveNotification();
  const deleteNotification = useDeleteNotification();
  const updatePreferences = useUpdateNotificationPreferences();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead.mutateAsync(user.id);
    }
  };

  const handleArchive = async (notificationId: string) => {
    await archiveNotification.mutateAsync(notificationId);
  };

  const handleDelete = async (notificationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      await deleteNotification.mutateAsync(notificationId);
    }
  };

  const handleUpdatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (user?.id) {
      await updatePreferences.mutateAsync({ userId: user.id, preferences: newPreferences });
    }
  };

  const getFilteredNotifications = () => {
    if (!notificationsData) return [];

    let filtered = notificationsData.notifications;

    switch (activeTab) {
      case 'unread':
        return filtered.filter(n => n.status === 'unread');
      case 'quotes':
        return filtered.filter(n => n.category === 'quotes');
      case 'payments':
        return filtered.filter(n => n.category === 'payments');
      case 'policies':
        return filtered.filter(n => n.category === 'policies');
      default:
        return filtered;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_generated':
      case 'quote_approved':
      case 'quote_expired':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'payment_received':
      case 'payment_failed':
      case 'payment_reminder':
        return <Mail className="h-5 w-5 text-green-600" />;
      case 'policy_created':
      case 'policy_renewal_reminder':
      case 'policy_expired':
        return <Star className="h-5 w-5 text-purple-600" />;
      case 'security_alert':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'system_maintenance':
      case 'new_feature':
        return <Settings className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Bell className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connexion requise
          </h3>
          <p className="text-gray-600">
            Vous devez être connecté pour accéder aux notifications
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              Restez informé des dernières actualités de votre compte
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadNotifications && unreadNotifications.length > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
            <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Préférences
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Préférences de notification</DialogTitle>
                </DialogHeader>
                {preferences && (
                  <NotificationPreferencesForm
                    preferences={preferences}
                    onUpdate={handleUpdatePreferences}
                    isLoading={updatePreferences.isPending}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                  <p className="text-sm text-gray-600">Non lues</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.today}</p>
                  <p className="text-sm text-gray-600">Aujourd'hui</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.thisWeek}</p>
                  <p className="text-sm text-gray-600">Cette semaine</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.thisMonth}</p>
                  <p className="text-sm text-gray-600">Ce mois</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher des notifications..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  <SelectItem value="quotes">Devis</SelectItem>
                  <SelectItem value="payments">Paiements</SelectItem>
                  <SelectItem value="policies">Contrats</SelectItem>
                  <SelectItem value="security">Sécurité</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority || ''}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>Toutes</span>
            {stats && <Badge variant="secondary">{stats.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center space-x-2">
            <span>Non lues</span>
            {unreadNotifications && (
              <Badge variant="destructive">{unreadNotifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quotes">Devis</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="policies">Contrats</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune notification trouvée
                  </h3>
                  <p className="text-gray-600">
                    Vous n'avez aucune notification dans cette catégorie
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredNotifications().map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    notification.status === 'unread' ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${
                              notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                              {notification.status === 'unread' && (
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                              )}
                            </h3>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-4">
                            {notification.actionUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = notification.actionUrl}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                {notification.actionText || 'Voir les détails'}
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {notification.status === 'unread' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={markAsRead.isPending}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(notification.id)}
                              disabled={archiveNotification.isPending}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                              disabled={deleteNotification.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {notificationsData && notificationsData.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="px-3 py-2">
              Page {page} sur {notificationsData.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === notificationsData.totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Preferences Form Component
interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  isLoading: boolean;
}

const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  preferences,
  onUpdate,
  isLoading
}) => {
  const [formData, setFormData] = useState(preferences);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(formData);
  };

  const handleChannelChange = (channel: keyof typeof formData.channels, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }));
  };

  const handleCategoryChange = (category: keyof typeof formData.categories, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          enabled
        }
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Settings */}
      <div>
        <h4 className="text-lg font-medium mb-4">Paramètres généraux</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence des notifications
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                frequency: e.target.value as any
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              <option value="immediate">Immédiat</option>
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.quietHours.enabled}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  quietHours: {
                    ...prev.quietHours,
                    enabled: e.target.checked
                  }
                }))}
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-700">
                Activer les heures silencieuses
              </span>
            </label>
            {formData.quietHours.enabled && (
              <div className="flex space-x-2 mt-2">
                <input
                  type="time"
                  value={formData.quietHours.startTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    quietHours: {
                      ...prev.quietHours,
                      startTime: e.target.value
                    }
                  }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  disabled={isLoading}
                />
                <span className="self-center">à</span>
                <input
                  type="time"
                  value={formData.quietHours.endTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    quietHours: {
                      ...prev.quietHours,
                      endTime: e.target.value
                    }
                  }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div>
        <h4 className="text-lg font-medium mb-4">Canaux de notification</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.channels).map(([channel, enabled]) => (
            <label key={channel} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleChannelChange(channel as keyof typeof formData.channels, e.target.checked)}
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {channel === 'inApp' ? 'Application' : channel}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-lg font-medium mb-4">Catégories de notification</h4>
        <div className="space-y-4">
          {Object.entries(formData.categories).map(([category, settings]) => (
            <div key={category} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => handleCategoryChange(category as keyof typeof formData.categories, e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {category === 'quotes' ? 'Devis' :
                     category === 'payments' ? 'Paiements' :
                     category === 'policies' ? 'Contrats' :
                     category === 'account' ? 'Compte' :
                     category === 'security' ? 'Sécurité' :
                     category === 'system' ? 'Système' :
                     category === 'marketing' ? 'Marketing' :
                     category === 'support' ? 'Support' : category}
                  </span>
                </label>
              </div>

              {settings.enabled && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {settings.channels.map(channel => (
                    <label key={channel} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="h-3 w-3"
                      />
                      <span className="text-xs text-gray-600">
                        {channel === 'inApp' ? 'App' : channel}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </Button>
      </div>
    </form>
  );
};

export default NotificationsPage;