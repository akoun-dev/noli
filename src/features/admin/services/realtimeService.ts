import { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// Types pour les événements temps réel
export interface RealtimeEvent {
  type: 'USER_ACTIVITY' | 'SYSTEM_ALERT' | 'QUOTE_UPDATE' | 'OFFER_UPDATE' | 'METRICS_UPDATE';
  data: any;
  timestamp: string;
}

export interface SystemMetrics {
  users: {
    online: number;
    total: number;
    newToday: number;
  };
  quotes: {
    created: number;
    pending: number;
    approved: number;
  };
  system: {
    cpu: number;
    memory: number;
    storage: number;
    uptime: number;
  };
}

export interface RealtimeNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  autoDismiss?: boolean;
  timestamp: string;
}

// Hook pour le monitoring temps réel
export const useRealtimeMonitoring = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Gérer la connexion
  useEffect(() => {
    const connectRealtime = () => {
      try {
        // Écouter les changements sur les profils (nouvel utilisateurs, activations)
        const profilesChannel = supabase
          .channel('admin-profiles-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles'
            },
            (payload) => {
              logger.info('Profile change detected:', payload);
              handleProfileChange(payload);
            }
          )
          .subscribe((status) => {
            logger.info('Profiles channel status:', status);
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            }
          });

        // Écouter les changements sur les quotes
        const quotesChannel = supabase
          .channel('admin-quotes-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'quotes'
            },
            (payload) => {
              logger.info('Quote change detected:', payload);
              handleQuoteChange(payload);
            }
          )
          .subscribe();

        // Écouter les alertes système
        const alertsChannel = supabase
          .channel('admin-alerts-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'system_alerts'
            },
            (payload) => {
              logger.info('System alert detected:', payload);
              handleSystemAlert(payload);
            }
          )
          .subscribe();

        // Écouter les logs d'audit
        const auditChannel = supabase
          .channel('admin-audit-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'audit_logs'
            },
            (payload) => {
              logger.info('Audit log detected:', payload);
              handleAuditLog(payload);
            }
          )
          .subscribe();

        channelsRef.current = [profilesChannel, quotesChannel, alertsChannel, auditChannel];

        // Démarrer le monitoring des métriques système
        startMetricsMonitoring();

      } catch (error) {
        logger.error('Error connecting to realtime:', error);
        setIsConnected(false);
      }
    };

    connectRealtime();

    // Nettoyage
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  // Interval pour les métriques
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMetricsMonitoring = () => {
    // Mettre à jour les métriques toutes les 30 secondes
    metricsIntervalRef.current = setInterval(async () => {
      try {
        await updateSystemMetrics();
      } catch (error) {
        logger.error('Error updating metrics:', error);
      }
    }, 30000);

    // Première mise à jour immédiate
    updateSystemMetrics();
  };

  const updateSystemMetrics = async () => {
    try {
      const [usersCount, quotesCount, dbSize] = await Promise.all([
        // Nombre d'utilisateurs actifs (connectés dernièrement)
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

        // Statistiques des quotes
        supabase
          .from('quotes')
          .select('status', { count: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return {
              created: data?.length || 0,
              pending: data?.filter(q => q.status === 'PENDING').length || 0,
              approved: data?.filter(q => q.status === 'APPROVED').length || 0
            };
          }),

        // Taille de la base de données
        supabase.rpc('get_database_size').then(({ data, error }) => {
          if (error) throw error;
          return data || 0;
        })
      ]);

      // Calculer les utilisateurs en ligne (dernière activité < 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const { count: onlineUsers } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo.toISOString());

      // Nouveaux utilisateurs aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const metrics: SystemMetrics = {
        users: {
          online: onlineUsers || 0,
          total: usersCount || 0,
          newToday: newUsersToday || 0
        },
        quotes: quotesCount as any,
        system: {
          cpu: Math.random() * 100, // Simulé - à remplacer par vraies métriques
          memory: Math.random() * 100,
          storage: Math.min(100, (dbSize as number) / 10), // Simulé
          uptime: 99.8 // Simulé
        }
      };

      setSystemMetrics(metrics);

    } catch (error) {
      logger.error('Error fetching system metrics:', error);
    }
  };

  const handleProfileChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      addNotification({
        type: 'success',
        title: 'Nouvel Utilisateur',
        message: `${newRecord.first_name} ${newRecord.last_name} a rejoint la plateforme`,
        timestamp: new Date().toISOString()
      });
    } else if (eventType === 'UPDATE' && oldRecord?.is_active !== newRecord?.is_active) {
      addNotification({
        type: newRecord.is_active ? 'success' : 'warning',
        title: newRecord.is_active ? 'Utilisateur Activé' : 'Utilisateur Désactivé',
        message: `${newRecord.first_name} ${newRecord.last_name} a été ${newRecord.is_active ? 'activé' : 'désactivé'}`,
        timestamp: new Date().toISOString()
      });
    }

    // Mettre à jour les métriques
    updateSystemMetrics();
  };

  const handleQuoteChange = (payload: any) => {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      addNotification({
        type: 'info',
        title: 'Nouveau Devis',
        message: `Un nouveau devis a été créé pour ${newRecord.vehicle_type}`,
        timestamp: new Date().toISOString(),
        actionUrl: `/admin/devis/${newRecord.id}`
      });
    } else if (eventType === 'UPDATE') {
      addNotification({
        type: 'info',
        title: 'Devis Mis à Jour',
        message: `Le statut d'un devis a été changé vers ${newRecord.status}`,
        timestamp: new Date().toISOString()
      });
    }

    // Mettre à jour les métriques
    updateSystemMetrics();
  };

  const handleSystemAlert = (payload: any) => {
    const alert = payload.new;

    addNotification({
      type: alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : 'info',
      title: `Alerte Système: ${alert.title}`,
      message: alert.message,
      timestamp: alert.created_at,
      autoDismiss: alert.severity === 'low'
    });

    // Afficher une toast notification pour les alertes critiques
    if (alert.severity === 'critical' || alert.severity === 'high') {
      toast.error(`🚨 ${alert.title}: ${alert.message}`, {
        duration: 10000
      });
    }
  };

  const handleAuditLog = (payload: any) => {
    const log = payload.new;

    // Traiter les logs d'audit critiques
    if (log.severity === 'CRITICAL' || log.action === 'SECURITY_BREACH') {
      addNotification({
        type: 'error',
        title: 'Alerte de Sécurité',
        message: `Activité suspecte détectée: ${log.action}`,
        timestamp: log.timestamp,
        actionUrl: '/admin/audit-logs'
      });

      toast.error(`🔒 Alert de sécurité: ${log.action}`, {
        duration: 15000
      });
    }
  };

  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9)
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Garder seulement les 50 plus récentes

    // Auto-dismiss si configuré
    if (notification.autoDismiss) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected,
    systemMetrics,
    notifications,
    activeUsers,
    dismissNotification,
    dismissAllNotifications,
    refreshMetrics: updateSystemMetrics
  };
};

// Hook pour les activités en temps réel
export const useRealtimeActivity = (limit: number = 20) => {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // Charger les activités récentes au démarrage
    const loadRecentActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (error) throw error;

        setActivities(data || []);
      } catch (error) {
        logger.error('Error loading recent activities:', error);
      }
    };

    loadRecentActivities();

    // Écouter les nouvelles activités
    const channel = supabase
      .channel('admin-activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          setActivities(prev => [payload.new, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return activities;
};

// Hook pour les alertes système en temps réel
export const useRealtimeAlerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Charger les alertes actives
    const loadActiveAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('system_alerts')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setAlerts(data || []);
      } catch (error) {
        logger.error('Error loading active alerts:', error);
      }
    };

    loadActiveAlerts();

    // Écouter les nouvelles alertes
    const channel = supabase
      .channel('admin-system-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_alerts'
        },
        (payload) => {
          const { eventType, new: newAlert, old: oldAlert } = payload;

          if (eventType === 'INSERT') {
            setAlerts(prev => [newAlert, ...prev]);
          } else if (eventType === 'UPDATE') {
            setAlerts(prev => prev.map(alert =>
              alert.id === newAlert.id ? newAlert : alert
            ));
          } else if (eventType === 'DELETE') {
            setAlerts(prev => prev.filter(alert => alert.id !== oldAlert.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'resolved',
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString(),
          resolution
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error resolving alert:', error);
    }
  };

  return {
    alerts,
    acknowledgeAlert,
    resolveAlert
  };
};