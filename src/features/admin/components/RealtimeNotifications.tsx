import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useRealtimeMonitoring, RealtimeNotification } from '@/features/admin/services/realtimeService';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: RealtimeNotification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
};

const getNotificationColor = (type: RealtimeNotification['type']) => {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/20';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/30 dark:bg-yellow-900/20';
    case 'error':
      return 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/20';
    case 'info':
    default:
      return 'border-blue-200 bg-blue-50 dark:border-blue-800/30 dark:bg-blue-900/20';
  }
};

interface RealtimeNotificationsProps {
  className?: string;
}

export const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({ className }) => {
  const {
    isConnected,
    systemMetrics,
    notifications,
    dismissNotification,
    dismissAllNotifications,
    refreshMetrics
  } = useRealtimeMonitoring();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(true);

  // Cacher le statut de connexion après 3 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConnectionStatus(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isConnected]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 24 * 60) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / (24 * 60))}j`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Statut de connexion */}
      {showConnectionStatus && (
        <Card className={cn(
          "border-l-4 transition-all duration-300",
          isConnected
            ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-l-red-500 bg-red-50 dark:bg-red-900/20"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Connecté en temps réel
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      Connexion temps réel perdue
                    </span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectionStatus(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques système en temps réel */}
      {systemMetrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Métriques en Temps Réel</span>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMetrics}
                  className="h-8 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Utilisateurs */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {systemMetrics.users.online}
                </div>
                <div className="text-xs text-muted-foreground">En ligne</div>
                <div className="text-xs text-green-600">
                  +{systemMetrics.users.newToday} aujourd'hui
                </div>
              </div>

              {/* Devis */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {systemMetrics.quotes.pending}
                </div>
                <div className="text-xs text-muted-foreground">Devis en attente</div>
                <div className="text-xs text-blue-600">
                  {systemMetrics.quotes.approved} approuvés
                </div>
              </div>

              {/* CPU */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(systemMetrics.system.cpu)}%
                </div>
                <div className="text-xs text-muted-foreground">CPU</div>
                <div className={cn(
                  "text-xs",
                  systemMetrics.system.cpu > 80 ? "text-red-600" : "text-green-600"
                )}>
                  {systemMetrics.system.cpu > 80 ? "Élevé" : "Normal"}
                </div>
              </div>

              {/* Uptime */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {systemMetrics.system.uptime}%
                </div>
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="text-xs text-green-600">
                  Excellent
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications temps réel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications Temps Réel</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissAllNotifications}
                  className="h-8 px-2 text-xs"
                >
                  Tout effacer
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-2"
              >
                {isExpanded ? "Moins" : "Plus"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune notification récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, isExpanded ? notifications.length : 5).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border rounded-lg transition-all duration-200 hover:shadow-sm",
                    getNotificationColor(notification.type)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-foreground">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs mt-1"
                            onClick={() => {
                              // Navigation vers l'URL d'action
                              window.location.href = notification.actionUrl!;
                            }}
                          >
                            Voir les détails →
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {!isExpanded && notifications.length > 5 && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="text-xs"
                  >
                    Voir {notifications.length - 5} notifications supplémentaires
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeNotifications;