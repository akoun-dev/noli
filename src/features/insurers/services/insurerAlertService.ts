import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';

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
  private alerts: InsurerAlert[] = [];
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
    this.generateMockAlerts();
  }

  private initializeWebSocket() {
    // Simuler une connexion WebSocket
    this.simulateWebSocketConnection();
  }

  private simulateWebSocketConnection() {
    // Simuler des alertes en temps réel
    setInterval(() => {
      if (Math.random() > 0.8) {
        this.generateRandomAlert();
      }
    }, 30000); // Toutes les 30 secondes

    // Simuler la résolution d'alertes
    setInterval(() => {
      const unresolvedAlerts = this.alerts.filter(a => !a.resolvedAt);
      if (unresolvedAlerts.length > 0 && Math.random() > 0.7) {
        const alertToResolve = unresolvedAlerts[Math.floor(Math.random() * unresolvedAlerts.length)];
        this.resolveAlert(alertToResolve.id, 'system-auto-resolve');
      }
    }, 60000); // Toutes les minutes
  }

  private generateMockAlerts() {
    const mockAlerts: InsurerAlert[] = [
      {
        id: 'alert-1',
        type: 'quote_request',
        severity: 'medium',
        title: 'Nouvelle demande de devis',
        message: 'Marie Konan a demandé un devis pour une Toyota Yaris 2020',
        clientId: 'client-1',
        clientName: 'Marie Konan',
        quoteId: 'quote-123',
        timestamp: new Date(Date.now() - 300000),
        isRead: false,
        actionRequired: true,
        actionUrl: '/assureur/devis',
        actionText: 'Voir le devis',
      },
      {
        id: 'alert-2',
        type: 'quote_expiring',
        severity: 'high',
        title: 'Devis expirant bientôt',
        message: 'Le devis de Kouassi Yeo expire dans 48 heures',
        clientId: 'client-2',
        clientName: 'Kouassi Yeo',
        quoteId: 'quote-456',
        timestamp: new Date(Date.now() - 600000),
        isRead: false,
        actionRequired: true,
        actionUrl: '/assureur/devis',
        actionText: 'Contacter le client',
      },
      {
        id: 'alert-3',
        type: 'conversion_rate_low',
        severity: 'high',
        title: 'Taux de conversion faible',
        message: 'Votre taux de conversion est de 12% cette semaine (objectif: 25%)',
        timestamp: new Date(Date.now() - 1800000),
        isRead: true,
        actionRequired: true,
        actionUrl: '/assureur/analytics',
        actionText: 'Voir les analytics',
      },
    ];

    this.alerts = mockAlerts;
    this.notifyListeners();
  }

  private generateRandomAlert() {
    const alertTypes = Object.keys(this.settings.alertTypes);
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)] as InsurerAlert['type'];
    const settings = this.settings.alertTypes[type];

    if (!settings.enabled) return;

    const alert: InsurerAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: settings.severity,
      title: this.generateAlertTitle(type),
      message: this.generateAlertMessage(type),
      timestamp: new Date(),
      isRead: false,
      actionRequired: type !== 'system_error',
      actionUrl: this.getActionUrl(type),
      actionText: this.getActionText(type),
    };

    this.addAlert(alert);
  }

  private generateAlertTitle(type: InsurerAlert['type']): string {
    const titles = {
      quote_request: 'Nouvelle demande de devis',
      quote_expiring: 'Devis expirant bientôt',
      payment_due: 'Paiement dû',
      policy_expiring: 'Contrat expirant',
      client_inactive: 'Client inactif',
      conversion_rate_low: 'Taux de conversion faible',
      system_error: 'Erreur système',
      performance_alert: 'Alerte de performance',
    };
    return titles[type];
  }

  private generateAlertMessage(type: InsurerAlert['type']): string {
    const messages = {
      quote_request: 'Un nouveau client a demandé un devis',
      quote_expiring: 'Un devis arrive à échéance sous peu',
      payment_due: 'Un paiement doit être effectué',
      policy_expiring: 'Un contrat arrive à échéance',
      client_inactive: 'Un client n\'a pas eu d\'activité récente',
      conversion_rate_low: 'Le taux de conversion est inférieur à l\'objectif',
      system_error: 'Une erreur système a été détectée',
      performance_alert: 'Une métrique de performance nécessite attention',
    };
    return messages[type];
  }

  private getActionUrl(type: InsurerAlert['type']): string {
    const urls = {
      quote_request: '/assureur/devis',
      quote_expiring: '/assureur/devis',
      payment_due: '/assureur/paiements',
      policy_expiring: '/assureur/contrats',
      client_inactive: '/assureur/clients',
      conversion_rate_low: '/assureur/analytics',
      system_error: '/assureur/systeme',
      performance_alert: '/assureur/performance',
    };
    return urls[type];
  }

  private getActionText(type: InsurerAlert['type']): string {
    const texts = {
      quote_request: 'Voir le devis',
      quote_expiring: 'Contacter le client',
      payment_due: 'Vérifier le paiement',
      policy_expiring: 'Renouveler le contrat',
      client_inactive: 'Relancer le client',
      conversion_rate_low: 'Voir les analytics',
      system_error: 'Vérifier le système',
      performance_alert: 'Analyser la performance',
    };
    return texts[type];
  }

  // S'abonner aux alertes
  subscribe(callback: (alerts: InsurerAlert[]) => void) {
    this.listeners.push(callback);
    callback(this.alerts);

    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.alerts));
  }

  // Obtenir toutes les alertes
  getAlerts(): InsurerAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Obtenir les alertes non lues
  getUnreadAlerts(): InsurerAlert[] {
    return this.alerts.filter(alert => !alert.isRead && !alert.resolvedAt);
  }

  // Obtenir les alertes critiques
  getCriticalAlerts(): InsurerAlert[] {
    return this.alerts.filter(alert =>
      alert.severity === 'critical' && !alert.resolvedAt
    );
  }

  // Ajouter une alerte
  addAlert(alert: InsurerAlert) {
    this.alerts.unshift(alert);
    this.notifyListeners();

    // Envoyer une notification push si configuré
    if (this.settings.enablePushAlerts && this.isWithinQuietHours()) {
      this.sendPushNotification(alert);
    }
  }

  // Marquer une alerte comme lue
  markAsRead(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.notifyListeners();
    }
  }

  // Marquer toutes les alertes comme lues
  markAllAsRead() {
    this.alerts.forEach(alert => {
      alert.isRead = true;
    });
    this.notifyListeners();
  }

  // Résoudre une alerte
  resolveAlert(alertId: string, resolvedBy: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      this.notifyListeners();
    }
  }

  // Obtenir les métriques d'alertes
  getMetrics(): AlertMetrics {
    const totalAlerts = this.alerts.length;
    const unreadAlerts = this.getUnreadAlerts().length;
    const criticalAlerts = this.getCriticalAlerts().length;

    const alertsByType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsBySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedAlerts = this.alerts.filter(a => a.resolvedAt);
    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, alert) => {
          const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
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
    // Simuler la sauvegarde
    localStorage.setItem('insurer-alert-settings', JSON.stringify(this.settings));
  }

  private loadSettings() {
    // Simuler le chargement
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

  private sendPushNotification(alert: InsurerAlert) {
    // Simuler l'envoi de notification push
    logger.info('Push notification sent:', alert);
  }
}

export const insurerAlertService = InsurerAlertService.getInstance();