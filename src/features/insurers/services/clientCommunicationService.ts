import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  registrationDate: Date;
  lastActivity?: Date;
  status: 'active' | 'inactive' | 'prospect';
  totalQuotes: number;
  convertedQuotes: number;
  totalRevenue: number;
  location?: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  insuranceNeeds?: {
    vehicleType: string;
    coverageType: string;
    budget: number;
  };
}

export interface Communication {
  id: string;
  clientId: string;
  insurerId: string;
  type: 'email' | 'phone' | 'whatsapp' | 'sms' | 'in_app';
  direction: 'incoming' | 'outgoing';
  subject?: string;
  content: string;
  attachments?: string[];
  status: 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  scheduledFor?: Date;
  metadata?: {
    quoteId?: string;
    policyId?: string;
    claimId?: string;
    campaignId?: string;
  };
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  category: 'welcome' | 'quote_followup' | 'payment_reminder' | 'renewal' | 'cross_sell' | 'support';
  isActive: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'quote_request' | 'quote_expiring' | 'payment_due' | 'policy_expiring' | 'client_inactive' | 'conversion_rate_low';
    conditions: Record<string, any>;
  };
  actions: {
    type: 'send_email' | 'send_whatsapp' | 'create_task' | 'notify_manager' | 'flag_client';
    template?: string;
    delay?: number; // en heures
  };
  isActive: boolean;
}

export class ClientCommunicationService {
  private static instance: ClientCommunicationService;

  static getInstance(): ClientCommunicationService {
    if (!ClientCommunicationService.instance) {
      ClientCommunicationService.instance = new ClientCommunicationService();
    }
    return ClientCommunicationService.instance;
  }

  // Récupérer les clients d'un assureur
  async getClients(insurerId: string): Promise<Client[]> {
    try {
      logger.info(`Récupération des clients pour l'assureur ${insurerId}`);

      // Récupérer les clients depuis la base de données
      const { data: clients, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'USER')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la récupération des clients:', error);
        throw error;
      }

      // Transformer les données pour correspondre à l'interface Client
      return clients.map(client => ({
        id: client.id,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
        email: client.email,
        phone: client.phone || '',
        avatar: client.avatar_url || '',
        registrationDate: new Date(client.created_at),
        lastActivity: client.updated_at ? new Date(client.updated_at) : undefined,
        status: 'active', // Par défaut, à affiner plus tard
        totalQuotes: 0, // À calculer depuis les devis
        convertedQuotes: 0, // À calculer depuis les devis
        totalRevenue: 0, // À calculer depuis les polices
        location: '', // À ajouter dans le profil si nécessaire
        preferredContactMethod: 'email', // Par défaut
        insuranceNeeds: {
          vehicleType: '',
          coverageType: '',
          budget: 0,
        },
      }));
    } catch (err) {
      logger.error('Exception dans getClients:', err);
      throw err;
    }
  }

  // Récupérer l'historique de communications avec un client
  async getCommunicationHistory(clientId: string, insurerId: string): Promise<Communication[]> {
    try {
      logger.info(`Récupération de l'historique de communication pour le client ${clientId}`);

      const { data: communications, error } = await supabase
        .from('client_communications')
        .select('*')
        .eq('client_id', clientId)
        .eq('insurer_id', insurerId)
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la récupération de l\'historique:', error);
        throw error;
      }

      return communications.map(comm => ({
        id: comm.id,
        clientId: comm.client_id,
        insurerId: comm.insurer_id,
        type: comm.type as any,
        direction: comm.direction as any,
        subject: comm.subject || undefined,
        content: comm.content,
        attachments: comm.attachments || [],
        status: comm.status as any,
        priority: comm.priority as any,
        timestamp: new Date(comm.timestamp),
        scheduledFor: comm.scheduled_for ? new Date(comm.scheduled_for) : undefined,
        metadata: comm.metadata || {},
      }));
    } catch (err) {
      logger.error('Exception dans getCommunicationHistory:', err);
      throw err;
    }
  }

  // Envoyer une communication à un client
  async sendCommunication(communication: Omit<Communication, 'id' | 'timestamp' | 'status'>): Promise<Communication> {
    try {
      logger.info('Envoi d\'une communication:', communication.type);

      const { data, error } = await supabase
        .from('client_communications')
        .insert({
          client_id: communication.clientId,
          insurer_id: communication.insurerId,
          type: communication.type,
          direction: communication.direction,
          subject: communication.subject,
          content: communication.content,
          attachments: communication.attachments,
          status: 'sent',
          priority: communication.priority,
          timestamp: new Date().toISOString(),
          scheduled_for: communication.scheduledFor?.toISOString(),
          metadata: communication.metadata,
        })
        .select()
        .single();

      if (error) {
        logger.error('Erreur lors de l\'envoi de la communication:', error);
        throw error;
      }

      return {
        id: data.id,
        clientId: data.client_id,
        insurerId: data.insurer_id,
        type: data.type as any,
        direction: data.direction as any,
        subject: data.subject || undefined,
        content: data.content,
        attachments: data.attachments || [],
        status: data.status as any,
        priority: data.priority as any,
        timestamp: new Date(data.timestamp),
        scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
        metadata: data.metadata || {},
      };
    } catch (err) {
      logger.error('Exception dans sendCommunication:', err);
      throw err;
    }
  }

  // Envoyer une communication en masse
  async sendBulkCommunication(
    clientIds: string[],
    templateId: string,
    customizations?: Record<string, string>
  ): Promise<{ success: string[]; failed: string[] }> {
    try {
      logger.info(`Envoi de communication en masse à ${clientIds.length} clients`);

      // Récupérer le template
      const { data: template, error: templateError } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        logger.error('Erreur lors de la récupération du template:', templateError);
        throw templateError;
      }

      const success: string[] = [];
      const failed: string[] = [];

      // Envoyer à chaque client
      for (const clientId of clientIds) {
        try {
          const content = this.applyTemplate(template.content, customizations || {});
          const subject = template.subject ? this.applyTemplate(template.subject, customizations || {}) : undefined;

          await this.sendCommunication({
            clientId,
            insurerId: template.insurer_id,
            type: template.type as any,
            direction: 'outgoing',
            content,
            subject,
            priority: 'medium',
            metadata: { templateId, ...customizations },
          });

          success.push(clientId);
        } catch (err) {
          logger.error(`Échec de l'envoi à ${clientId}:`, err);
          failed.push(clientId);
        }
      }

      return { success, failed };
    } catch (err) {
      logger.error('Exception dans sendBulkCommunication:', err);
      throw err;
    }
  }

  private applyTemplate(template: string, customizations: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => customizations[key] || match);
  }

  // Planifier une communication
  async scheduleCommunication(
    communication: Omit<Communication, 'id' | 'timestamp' | 'status'>,
    scheduledFor: Date
  ): Promise<Communication> {
    try {
      logger.info('Planification d\'une communication pour:', scheduledFor);

      const { data, error } = await supabase
        .from('client_communications')
        .insert({
          client_id: communication.clientId,
          insurer_id: communication.insurerId,
          type: communication.type,
          direction: communication.direction,
          subject: communication.subject,
          content: communication.content,
          attachments: communication.attachments,
          status: 'sent',
          priority: communication.priority,
          timestamp: new Date().toISOString(),
          scheduled_for: scheduledFor.toISOString(),
          metadata: communication.metadata,
        })
        .select()
        .single();

      if (error) {
        logger.error('Erreur lors de la planification:', error);
        throw error;
      }

      return {
        id: data.id,
        clientId: data.client_id,
        insurerId: data.insurer_id,
        type: data.type as any,
        direction: data.direction as any,
        subject: data.subject || undefined,
        content: data.content,
        attachments: data.attachments || [],
        status: data.status as any,
        priority: data.priority as any,
        timestamp: new Date(data.timestamp),
        scheduledFor: new Date(data.scheduled_for),
        metadata: data.metadata || {},
      };
    } catch (err) {
      logger.error('Exception dans scheduleCommunication:', err);
      throw err;
    }
  }

  // Obtenir les templates de communication
  async getTemplates(insurerId: string): Promise<CommunicationTemplate[]> {
    try {
      logger.info(`Récupération des templates pour l'assureur ${insurerId}`);

      const { data: templates, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('insurer_id', insurerId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Erreur lors de la récupération des templates:', error);
        throw error;
      }

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        type: template.type as any,
        subject: template.subject || undefined,
        content: template.content,
        variables: template.variables || [],
        category: template.category as any,
        isActive: template.is_active,
      }));
    } catch (err) {
      logger.error('Exception dans getTemplates:', err);
      throw err;
    }
  }

  // Obtenir les règles d'alerte
  async getAlertRules(insurerId: string): Promise<AlertRule[]> {
    try {
      logger.info(`Récupération des règles d'alerte pour l'assureur ${insurerId}`);

      const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('insurer_id', insurerId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Erreur lors de la récupération des règles:', error);
        throw error;
      }

      return rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || '',
        trigger: {
          type: rule.trigger_type as any,
          conditions: rule.trigger_conditions || {},
        },
        actions: {
          type: rule.action_type as any,
          template: rule.action_template || undefined,
          delay: rule.action_delay || 0,
        },
        isActive: rule.is_active,
      }));
    } catch (err) {
      logger.error('Exception dans getAlertRules:', err);
      throw err;
    }
  }

  // Créer ou mettre à jour une règle d'alerte
  async saveAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      logger.info('Sauvegarde d\'une règle d\'alerte:', rule.name);

      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          insurer_id: rule.actions.template || '', // À obtenir depuis le contexte
          name: rule.name,
          description: rule.description,
          trigger_type: rule.trigger.type,
          trigger_conditions: rule.trigger.conditions,
          action_type: rule.actions.type,
          action_template: rule.actions.template,
          action_delay: rule.actions.delay,
          is_active: rule.isActive,
        })
        .select()
        .single();

      if (error) {
        logger.error('Erreur lors de la sauvegarde de la règle:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        trigger: {
          type: data.trigger_type as any,
          conditions: data.trigger_conditions || {},
        },
        actions: {
          type: data.action_type as any,
          template: data.action_template || undefined,
          delay: data.action_delay || 0,
        },
        isActive: data.is_active,
      };
    } catch (err) {
      logger.error('Exception dans saveAlertRule:', err);
      throw err;
    }
  }

  // Obtenir les statistiques de communication
  async getCommunicationStats(insurerId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    responseRate: number;
    averageResponseTime: number;
    channelBreakdown: Record<string, number>;
  }> {
    try {
      logger.info(`Récupération des statistiques de communication pour ${insurerId}`);

      // Calculer la date de début en fonction de la période
      const now = new Date();
      const startDate = new Date();
      if (period === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === '90d') {
        startDate.setDate(now.getDate() - 90);
      } else {
        startDate.setDate(now.getDate() - 30);
      }

      const { data: communications, error } = await supabase
        .from('client_communications')
        .select('*')
        .eq('insurer_id', insurerId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
      }

      const totalSent = communications.length;
      const totalDelivered = communications.filter(c => c.status === 'delivered').length;
      const totalRead = communications.filter(c => c.status === 'read').length;
      const responseRate = totalSent > 0 ? totalRead / totalSent : 0;

      // Calculer le temps de réponse moyen (simplifié)
      const averageResponseTime = 4.2; // Valeur par défaut, à calculer plus précisément

      // Répartition par canal
      const channelBreakdown: Record<string, number> = {
        email: 0,
        whatsapp: 0,
        phone: 0,
      };

      communications.forEach(comm => {
        if (comm.type in channelBreakdown) {
          channelBreakdown[comm.type]++;
        }
      });

      return {
        totalSent,
        totalDelivered,
        totalRead,
        responseRate,
        averageResponseTime,
        channelBreakdown,
      };
    } catch (err) {
      logger.error('Exception dans getCommunicationStats:', err);
      throw err;
    }
  }
}

export const clientCommunicationService = ClientCommunicationService.getInstance();