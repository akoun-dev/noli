import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageCircle, ExternalLink, Check } from 'lucide-react';
import { Notification } from '../../notifications/services/notificationService';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onActionClick?: (url: string) => void;
}

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'push':
      return <Bell className="h-4 w-4" />;
    case 'whatsapp':
      return <MessageCircle className="h-4 w-4" />;
    case 'sms':
      return <MessageCircle className="h-4 w-4" />;
    case 'in_app':
      return <Bell className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'quotes':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
    case 'policies':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
    case 'payments':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700';
    case 'system':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
    case 'marketing':
      return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700';
    case 'account':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700';
    case 'security':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
    case 'support':
      return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'quotes':
      return 'Devis';
    case 'policies':
      return 'Contrats';
    case 'payments':
      return 'Paiements';
    case 'system':
      return 'Système';
    case 'marketing':
      return 'Marketing';
    case 'account':
      return 'Compte';
    case 'security':
      return 'Sécurité';
    case 'support':
      return 'Support';
    default:
      return category;
  }
};

const getPriorityLabel = (priority: Notification['priority']) => {
  switch (priority) {
    case 'high':
      return 'Haute';
    case 'medium':
      return 'Moyenne';
    case 'low':
      return 'Basse';
    default:
      return priority;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onActionClick,
}) => {
  const isUnread = notification.status === 'unread';

  return (
    <Card
      className={cn(
        'w-full transition-all duration-200 hover:shadow-md',
        isUnread && 'border-l-4 border-l-primary bg-primary/5'
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 space-y-2 sm:space-y-3">
            {/* Header */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {notification.channels && notification.channels.length > 0 && getChannelIcon(notification.channels[0])}
                <span className="text-xs sm:text-sm font-medium capitalize">
                  {notification.channels && notification.channels.length > 0 ? notification.channels[0].replace('_', ' ') : 'in_app'}
                </span>
              </div>
              <Badge className={cn('text-xs', getPriorityColor(notification.priority))}>
                {getPriorityLabel(notification.priority)}
              </Badge>
              <Badge className={cn('text-xs', getCategoryColor(notification.category))}>
                {getCategoryLabel(notification.category)}
              </Badge>
              {isUnread && (
                <Badge variant="default" className="text-xs">
                  Non lu
                </Badge>
              )}
            </div>

            {/* Title and Message */}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm sm:text-base text-foreground">{notification.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{notification.message}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <span>
                {format(new Date(notification.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </span>
              {notification.readAt && (
                <span>
                  Lu le {format(new Date(notification.readAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </span>
              )}
            </div>

            {/* Action Button */}
            {notification.actionUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionClick?.(notification.actionUrl!)}
                className="mt-2 text-xs sm:text-sm"
              >
                <ExternalLink className="h-3 w-3 mr-1 sm:mr-2" />
                {notification.actionText || 'Voir les détails'}
              </Button>
            )}
          </div>

          {/* Mark as Read Button */}
          {isUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="p-2 h-8 w-8 sm:h-8 sm:w-8 flex-shrink-0 self-start sm:self-auto"
              title="Marquer comme lu"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};