import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export interface InsurerAlert {
  id: string;
  type: 'quote_request' | 'quote_expiring' | 'payment_due' | 'policy_expiring' | 'client_inactive' | 'conversion_rate_low' | 'system_error' | 'performance_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  clientId?: string;
  clientName?: string;
  quoteId?: string;
  policyId?: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    [key: string]: unknown;
  };
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AlertSettings {
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  enablePushAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  alertTypes: {
    [key: string]: {
      enabled: boolean;
      threshold?: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    };
  };
}

export interface AlertMetrics {
  totalAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  resolutionRate: number;
}

export class InsurerAlertService {
  private static instance: InsurerAlertService;
  private listeners: ((alerts: InsurerAlert[]) => void)[] = [];
  private wsConnection: WebSocket | null = null;
  private settings: AlertSettings = {
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSmsAlerts: false,
    enablePushAlerts: true,
    quietHours: {
      enabled: true,
      start: '20:00',
      end: '08:00',
    },
    alertTypes: {
      quote_request: { enabled: true, severity: 'medium' },
      quote_expiring: { enabled: true, severity: 'high' },
      payment_due: { enabled: true, severity: 'high' },
      policy_expiring: { enabled: true, severity: 'high' },
      client_inactive: { enabled: true, severity: 'medium' },
      conversion_rate_low: { enabled: true, severity: 'high' },
      system_error: { enabled: true, severity: 'critical' },
      performance_alert: { enabled: true, severity: 'medium' },
    },
  };

  static getInstance(): InsurerAlertService {
    if (!InsurerAlertService.instance) {
      InsurerAlertService.instance = new InsurerAlertService();
    }
    return InsurerAlertService.instance;
  }

  constructor() {
    this.initializeWebSocket();
    this.loadSettings();
  }

  private initializeWebSocket() {
    // Connexion WebSocket réelle à Supabase
    this.setupSupabaseRealtime();
  }

  private setupSupabaseRealtime() {
    // Écouter les changements en temps réel sur la table insurer_alerts
    supabase
      .channel('insurer_alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insurer_alerts' },
        (payload) => {
          logger.info('Changement détecté dans insurer_alerts:', payload.event);
          this.loadAlerts(); // Recharger les alertes
        }
      )
      .subscribe((status) => {
        logger.info('Abonnement aux alertes en temps réel:', status);
      });
  }

  private async loadAlerts() {
    try {
      // Récupérer l'ID de l'assureur actuel
      const insurerId = await this.getCurrentInsurerId();
      if (!insurerId) return;

      const { data: alerts, error } = await supabase
        .from('insurer_alerts')
        .select('*')
        .eq('insurer_id', insurerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors du chargement des alertes:', error);
        throw error;
      }

      const transformedAlerts: InsurerAlert[] = alerts.map(alert => ({
        id: alert.id,
        type: alert.type as any,
        severity: alert.severity as any,
        title: alert.title,
        message: alert.message,
        clientId: alert.client_id || undefined,
        clientName: alert.client_name || undefined,
        quoteId: alert.quote_id || undefined,
        policyId: alert.policy_id || undefined,
        timestamp: new Date(alert.created_at),
        isRead: alert.is_read,
        actionRequired: alert.action_required,
        actionUrl: alert.action_url || undefined,
        actionText: alert.action_text || undefined,
        metadata: alert.metadata || {},
        resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
        resolvedBy: alert.resolved_by || undefined,
      }));

      this.notifyListeners(transformedAlerts);
    } catch (err) {
      logger.error('Exception dans loadAlerts:', err);
    }
  }

  private async getCurrentInsurerId(): Promise<string | null> {
    try {
      // Récupérer l'ID de l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;

      // Récupérer le compte assureur
      const { data: insurerAccount, error } = await supabase
        .from('insurer_accounts')
        .select('insurer_id')
        .eq('profile_id', user.id)
        .single();

      if (error || !insurerAccount) return null;

      return insurerAccount.insurer_id;
    } catch (err) {
      logger.error('Erreur lors de la récupération de l\'ID de l\'assureur:', err);
      return null;
    }
  }

  // S'abonner aux alertes
  subscribe(callback: (alerts: InsurerAlert[]) => void) {
    this.listeners.push(callback);
    this.loadAlerts(); // Charger les alertes initialement

    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(alerts: InsurerAlert[]) {
    this.listeners.forEach(callback => callback([...alerts]));
  }

  // Obtenir toutes les alertes
  async getAlerts(): Promise<InsurerAlert[]> {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) return [];

    const { data: alerts, error } = await supabase
      .from('insurer_alerts')
      .select('*')
      .eq('insurer_id', insurerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as any,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      clientId: alert.client_id || undefined,
      clientName: alert.client_name || undefined,
      quoteId: alert.quote_id || undefined,
      policyId: alert.policy_id || undefined,
      timestamp: new Date(alert.created_at),
      isRead: alert.is_read,
      actionRequired: alert.action_required,
      actionUrl: alert.action_url || undefined,
      actionText: alert.action_text || undefined,
      metadata: alert.metadata || {},
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
      resolvedBy: alert.resolved_by || undefined,
    }));
  }

  // Obtenir les alertes non lues
  async getUnreadAlerts(): Promise<InsurerAlert[]> {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) return [];

    const { data: alerts, error } = await supabase
      .from('insurer_alerts')
      .select('*')
      .eq('insurer_id', insurerId)
      .eq('is_read', false)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erreur lors de la récupération des alertes non lues:', error);
      throw error;
    }

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as any,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      clientId: alert.client_id || undefined,
      clientName: alert.client_name || undefined,
      quoteId: alert.quote_id || undefined,
      policyId: alert.policy_id || undefined,
      timestamp: new Date(alert.created_at),
      isRead: alert.is_read,
      actionRequired: alert.action_required,
      actionUrl: alert.action_url || undefined,
      actionText: alert.action_text || undefined,
      metadata: alert.metadata || {},
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
      resolvedBy: alert.resolved_by || undefined,
    }));
  }

  // Obtenir les alertes critiques
  async getCriticalAlerts(): Promise<InsurerAlert[]> {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) return [];

    const { data: alerts, error } = await supabase
      .from('insurer_alerts')
      .select('*')
      .eq('insurer_id', insurerId)
      .eq('severity', 'critical')
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erreur lors de la récupération des alertes critiques:', error);
      throw error;
    }

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type as any,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      clientId: alert.client_id || undefined,
      clientName: alert.client_name || undefined,
      quoteId: alert.quote_id || undefined,
      policyId: alert.policy_id || undefined,
      timestamp: new Date(alert.created_at),
      isRead: alert.is_read,
      actionRequired: alert.action_required,
      actionUrl: alert.action_url || undefined,
      actionText: alert.action_text || undefined,
      metadata: alert.metadata || {},
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
      resolvedBy: alert.resolved_by || undefined,
    }));
  }

  // Ajouter une alerte
  async addAlert(alert: Omit<InsurerAlert, 'id' | 'timestamp' | 'isRead' | 'resolvedAt' | 'resolvedBy'>) {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) throw new Error('Impossible de déterminer l\'ID de l\'assureur');

    const { data, error } = await supabase
      .from('insurer_alerts')
      .insert({
        insurer_id: insurerId,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        client_id: alert.clientId,
        client_name: alert.clientName,
        quote_id: alert.quoteId,
        policy_id: alert.policyId,
        is_read: false,
        action_required: alert.actionRequired,
        action_url: alert.actionUrl,
        action_text: alert.actionText,
        metadata: alert.metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error('Erreur lors de l\'ajout de l\'alerte:', error);
      throw error;
    }

    // Envoyer une notification push si configuré
    if (this.settings.enablePushAlerts && this.isWithinQuietHours()) {
      this.sendPushNotification({
        id: data.id,
        type: data.type as any,
        severity: data.severity as any,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.created_at),
        isRead: data.is_read,
        actionRequired: data.action_required,
      });
    }
  }

  // Marquer une alerte comme lue
  async markAsRead(alertId: string) {
    const { error } = await supabase
      .from('insurer_alerts')
      .update({
        is_read: true,
      })
      .eq('id', alertId);

    if (error) {
      logger.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  // Marquer toutes les alertes comme lues
  async markAllAsRead() {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) throw new Error('Impossible de déterminer l\'ID de l\'assureur');

    const { error } = await supabase
      .from('insurer_alerts')
      .update({
        is_read: true,
      })
      .eq('insurer_id', insurerId)
      .is('resolved_at', null);

    if (error) {
      logger.error('Erreur lors du marquage de toutes les alertes comme lues:', error);
      throw error;
    }
  }

  // Résoudre une alerte
  async resolveAlert(alertId: string, resolvedBy: string) {
    const { error } = await supabase
      .from('insurer_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId);

    if (error) {
      logger.error('Erreur lors de la résolution de l\'alerte:', error);
      throw error;
    }
  }

  // Obtenir les métriques d'alertes
  async getMetrics(): Promise<AlertMetrics> {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) {
      return {
        totalAlerts: 0,
        unreadAlerts: 0,
        criticalAlerts: 0,
        alertsByType: {},
        alertsBySeverity: {},
        averageResolutionTime: 0,
        resolutionRate: 0,
      };
    }

    const { data: allAlerts, error } = await supabase
      .from('insurer_alerts')
      .select('*')
      .eq('insurer_id', insurerId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erreur lors de la récupération des métriques:', error);
      throw error;
    }

    const totalAlerts = allAlerts.length;
    const unreadAlerts = allAlerts.filter(a => !a.is_read && !a.resolved_at).length;
    const criticalAlerts = allAlerts.filter(a => a.severity === 'critical' && !a.resolved_at).length;

    const alertsByType = allAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsBySeverity = allAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedAlerts = allAlerts.filter(a => a.resolved_at);
    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, alert) => {
          const resolutionTime = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
          return sum + resolutionTime;
        }, 0) / resolvedAlerts.length / 60000 // en minutes
      : 0;

    const resolutionRate = totalAlerts > 0 ? resolvedAlerts.length / totalAlerts : 0;

    return {
      totalAlerts,
      unreadAlerts,
      criticalAlerts,
      alertsByType,
      alertsBySeverity,
      averageResolutionTime,
      resolutionRate,
    };
  }

  // Obtenir les paramètres
  getSettings(): AlertSettings {
    return { ...this.settings };
  }

  // Mettre à jour les paramètres
  updateSettings(newSettings: Partial<AlertSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private saveSettings() {
    // Sauvegarder dans localStorage
    localStorage.setItem('insurer-alert-settings', JSON.stringify(this.settings));
  }

  private loadSettings() {
    // Charger depuis localStorage
    const saved = localStorage.getItem('insurer-alert-settings');
    if (saved) {
      this.settings = JSON.parse(saved);
    }
  }

  private isWithinQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return true;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= this.settings.quietHours.start || currentTime <= this.settings.quietHours.end;
  }

  private sendPushNotification(alert: Partial<InsurerAlert>) {
    // Simuler l'envoi de notification push
    logger.info('Push notification sent:', alert);
    // En production, utiliser l'API de notification du navigateur ou un service comme Firebase
  }
}

export const insurerAlertService = InsurerAlertService.getInstance();