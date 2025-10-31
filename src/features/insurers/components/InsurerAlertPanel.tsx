import { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  User,
  Settings,
  Filter,
  Archive,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  insurerAlertService,
  InsurerAlert,
  AlertSettings,
  AlertMetrics,
} from '../services/insurerAlertService';

export const InsurerAlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<InsurerAlert[]>([]);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    // S'abonner aux alertes
    const unsubscribe = insurerAlertService.subscribe((newAlerts) => {
      setAlerts(newAlerts);
      setMetrics(insurerAlertService.getMetrics());
    });

    // Charger les paramètres
    setSettings(insurerAlertService.getSettings());

    return unsubscribe;
  }, []);

  const handleMarkAsRead = (alertId: string) => {
    insurerAlertService.markAsRead(alertId);
  };

  const handleMarkAllAsRead = () => {
    insurerAlertService.markAllAsRead();
  };

  const handleResolveAlert = (alertId: string) => {
    insurerAlertService.resolveAlert(alertId, 'current-user');
  };

  const handleSettingsUpdate = (newSettings: Partial<AlertSettings>) => {
    insurerAlertService.updateSettings(newSettings);
    setSettings(insurerAlertService.getSettings());
  };

  const getFilteredAlerts = () => {
    let filtered = [...alerts];

    // Filtrer par statut
    if (filter === 'unread') {
      filtered = filtered.filter(alert => !alert.isRead && !alert.resolvedAt);
    } else if (filter === 'critical') {
      filtered = filtered.filter(alert => alert.severity === 'critical' && !alert.resolvedAt);
    }

    // Filtrer par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(alert => alert.type === selectedType);
    }

    return filtered;
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Bell className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'high':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const alertTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'quote_request', label: 'Demandes de devis' },
    { value: 'quote_expiring', label: 'Devis expirants' },
    { value: 'payment_due', label: 'Paiements dus' },
    { value: 'policy_expiring', label: 'Contrats expirants' },
    { value: 'client_inactive', label: 'Clients inactifs' },
    { value: 'conversion_rate_low', label: 'Taux de conversion' },
    { value: 'system_error', label: 'Erreurs système' },
    { value: 'performance_alert', label: 'Performance' },
  ];

  const filteredAlerts = getFilteredAlerts();
  const unreadCount = alerts.filter(a => !a.isRead && !a.resolvedAt).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolvedAt).length;

  return (
    <div className="space-y-6">
      {/* En-tête avec métriques */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total alertes</p>
                <p className="text-2xl font-bold">{metrics.totalAlerts}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non lues</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.unreadAlerts}</p>
              </div>
              <BellRing className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux résolution</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(metrics.resolutionRate * 100)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Panneau principal */}
      <Card className="h-[600px] flex">
        <Tabs defaultValue="alerts" className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="alerts">Alertes ({unreadCount})</TabsTrigger>
                <TabsTrigger value="settings">Paramètres</TabsTrigger>
                <TabsTrigger value="analytics">Analytiques</TabsTrigger>
              </TabsList>

              {criticalCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <TabsContent value="alerts" className="flex-1 flex flex-col m-0">
            {/* Filtres */}
            <div className="p-4 border-b flex gap-2">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Non lues ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('critical')}
                >
                  Critiques ({criticalCount})
                </Button>
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            </div>

            {/* Liste des alertes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune alerte à afficher</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`p-4 ${getSeverityColor(alert.severity)} ${
                      !alert.isRead ? 'border-l-4 border-l-current' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.severity)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <p className="text-sm mt-1 opacity-90">{alert.message}</p>

                            {alert.clientName && (
                              <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                                <User className="h-3 w-3" />
                                <span>{alert.clientName}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs opacity-75 whitespace-nowrap">
                              {formatTime(alert.timestamp)}
                            </span>
                          </div>
                        </div>

                        {alert.actionUrl && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = alert.actionUrl!}
                              className="text-xs"
                            >
                              {alert.actionText}
                            </Button>

                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(alert.id)}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Marquer comme lu
                              </Button>
                            )}

                            {!alert.resolvedAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id)}
                                className="text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Résoudre
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 p-6 overflow-y-auto">
            {settings && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Paramètres des alertes</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activer les notifications</Label>
                      <p className="text-sm text-muted-foreground">Recevoir des alertes en temps réel</p>
                    </div>
                    <Switch
                      checked={settings.enableNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate({ enableNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertes email</Label>
                      <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
                    </div>
                    <Switch
                      checked={settings.enableEmailAlerts}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate({ enableEmailAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertes SMS</Label>
                      <p className="text-sm text-muted-foreground">Recevoir les alertes critiques par SMS</p>
                    </div>
                    <Switch
                      checked={settings.enableSmsAlerts}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate({ enableSmsAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notifications push</Label>
                      <p className="text-sm text-muted-foreground">Notifications navigateur</p>
                    </div>
                    <Switch
                      checked={settings.enablePushAlerts}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate({ enablePushAlerts: checked })
                      }
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Heures de silence</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activer les heures de silence</Label>
                      <p className="text-sm text-muted-foreground">
                        Ne pas déranger entre {settings.quietHours.start} et {settings.quietHours.end}
                      </p>
                    </div>
                    <Switch
                      checked={settings.quietHours.enabled}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate({
                          quietHours: { ...settings.quietHours, enabled: checked }
                        })
                      }
                    />
                  </div>

                  {settings.quietHours.enabled && (
                    <div className="flex gap-4 mt-3">
                      <div>
                        <Label className="text-xs">Début</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.start}
                          onChange={(e) =>
                            handleSettingsUpdate({
                              quietHours: { ...settings.quietHours, start: e.target.value }
                            })
                          }
                          className="w-32"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fin</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.end}
                          onChange={(e) =>
                            handleSettingsUpdate({
                              quietHours: { ...settings.quietHours, end: e.target.value }
                            })
                          }
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 p-6 overflow-y-auto">
            {metrics && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Analytiques des alertes</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Répartition par type</h4>
                    <div className="space-y-2">
                      {Object.entries(metrics.alertsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Répartition par sévérité</h4>
                    <div className="space-y-2">
                      {Object.entries(metrics.alertsBySeverity).map(([severity, count]) => (
                        <div key={severity} className="flex justify-between text-sm">
                          <span className="capitalize">{severity}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Performance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Temps moyen de résolution</p>
                      <p className="text-lg font-semibold">
                        {Math.round(metrics.averageResolutionTime)} min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taux de résolution</p>
                      <p className="text-lg font-semibold">
                        {Math.round(metrics.resolutionRate * 100)}%
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};