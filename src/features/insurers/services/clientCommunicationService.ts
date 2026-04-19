import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    // Simulation de récupération depuis API
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        id: 'client-1',
        name: 'Marie Konan',
        email: 'marie.konan@email.com',
        phone: '+225 07 01 23 45 67',
        avatar: '',
        registrationDate: new Date('2024-01-15'),
        lastActivity: new Date('2024-01-20'),
        status: 'active',
        totalQuotes: 3,
        convertedQuotes: 1,
        totalRevenue: 250000,
        location: 'Abidjan, Cocody',
        preferredContactMethod: 'whatsapp',
        insuranceNeeds: {
          vehicleType: 'Berline',
          coverageType: 'Tiers Étendu',
          budget: 200000,
        },
      },
      {
        id: 'client-2',
        name: 'Kouassi Yeo',
        email: 'kouassi.yeo@email.com',
        phone: '+225 07 02 34 56 78',
        avatar: '',
        registrationDate: new Date('2024-01-10'),
        lastActivity: new Date('2024-01-18'),
        status: 'prospect',
        totalQuotes: 1,
        convertedQuotes: 0,
        totalRevenue: 0,
        location: 'Abidjan, Plateau',
        preferredContactMethod: 'email',
        insuranceNeeds: {
          vehicleType: 'SUV',
          coverageType: 'Tous Risques',
          budget: 350000,
        },
      },
      {
        id: 'client-3',
        name: 'Awa Bamba',
        email: 'awa.bamba@email.com',
        phone: '+225 07 03 45 67 89',
        avatar: '',
        registrationDate: new Date('2023-12-20'),
        lastActivity: new Date('2024-01-19'),
        status: 'active',
        totalQuotes: 5,
        convertedQuotes: 2,
        totalRevenue: 450000,
        location: 'Abidjan, Yopougon',
        preferredContactMethod: 'phone',
        insuranceNeeds: {
          vehicleType: 'Citadine',
          coverageType: 'Tiers Simple',
          budget: 150000,
        },
      },
    ];
  }

  // Récupérer l'historique de communications avec un client
  async getCommunicationHistory(clientId: string, insurerId: string): Promise<Communication[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'comm-1',
        clientId,
        insurerId,
        type: 'email',
        direction: 'outgoing',
        subject: 'Suivi de votre devis d\'assurance',
        content: 'Bonjour Madame Konan, je fais suite à votre demande de devis. Avez-vous eu le temps de l\'examiner ?',
        status: 'read',
        priority: 'medium',
        timestamp: new Date('2024-01-20T10:30:00'),
        metadata: {
          quoteId: 'quote-123',
        },
      },
      {
        id: 'comm-2',
        clientId,
        insurerId,
        type: 'phone',
        direction: 'incoming',
        content: 'Client appelé pour demander des précisions sur la franchise',
        status: 'delivered',
        priority: 'medium',
        timestamp: new Date('2024-01-20T14:15:00'),
      },
      {
        id: 'comm-3',
        clientId,
        insurerId,
        type: 'whatsapp',
        direction: 'outgoing',
        content: 'Merci pour votre appel. Voici le résumé de notre conversation : [lien vers document]',
        status: 'delivered',
        priority: 'medium',
        timestamp: new Date('2024-01-20T14:30:00'),
      },
    ];
  }

  // Envoyer une communication à un client
  async sendCommunication(communication: Omit<Communication, 'id' | 'timestamp' | 'status'>): Promise<Communication> {
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newCommunication: Communication = {
      ...communication,
      id: `comm-${Date.now()}`,
      timestamp: new Date(),
      status: 'sent',
    };

    // Simuler la mise à jour du statut
    setTimeout(() => {
      newCommunication.status = 'delivered';
    }, 2000);

    setTimeout(() => {
      newCommunication.status = 'read';
    }, 5000);

    return newCommunication;
  }

  // Envoyer une communication en masse
  async sendBulkCommunication(
    clientIds: string[],
    templateId: string,
    customizations?: Record<string, string>
  ): Promise<{ success: string[]; failed: string[] }> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation d'envoi en masse
    const success = clientIds.slice(0, Math.floor(clientIds.length * 0.9));
    const failed = clientIds.slice(success.length);

    return { success, failed };
  }

  // Planifier une communication
  async scheduleCommunication(
    communication: Omit<Communication, 'id' | 'timestamp' | 'status'>,
    scheduledFor: Date
  ): Promise<Communication> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      ...communication,
      id: `comm-${Date.now()}`,
      timestamp: new Date(),
      scheduledFor,
      status: 'sent',
    };
  }

  // Obtenir les templates de communication
  async getTemplates(insurerId: string): Promise<CommunicationTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'template-1',
        name: 'Suivi devis initial',
        type: 'email',
        subject: 'Votre devis d\'assurance automobile NOLI',
        content: 'Bonjour {clientName},\n\nJe fais suite à votre demande de devis du {requestDate}. Vous trouverez ci-joint notre meilleure proposition.\n\nN\'hésitez pas à me contacter pour toute question.\n\nCordialement,\n{agentName}',
        variables: ['clientName', 'requestDate', 'agentName', 'insurerName'],
        category: 'quote_followup',
        isActive: true,
      },
      {
        id: 'template-2',
        name: 'Rappel devis expirant',
        type: 'whatsapp',
        content: '🚗 Bonjour {clientName}, votre devis {insurerName} expire dans {daysLeft} jours. Souhaitez-vous que je vous envoie une nouvelle proposition ?',
        variables: ['clientName', 'insurerName', 'daysLeft', 'agentName'],
        category: 'quote_followup',
        isActive: true,
      },
      {
        id: 'template-3',
        name: 'Message de bienvenue',
        type: 'email',
        subject: 'Bienvenue chez {insurerName} !',
        content: 'Bonjour {clientName},\n\nBienvenue parmi nos clients ! Nous sommes ravis de vous compter parmi nous.\n\nVotre contrat {policyNumber} est maintenant actif.\n\nCordialement,\nL\'équipe {insurerName}',
        variables: ['clientName', 'insurerName', 'policyNumber', 'agentName'],
        category: 'welcome',
        isActive: true,
      },
    ];
  }

  // Obtenir les règles d'alerte
  async getAlertRules(insurerId: string): Promise<AlertRule[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        id: 'rule-1',
        name: 'Suivi automatique devis',
        description: 'Envoyer un rappel 48h après la demande de devis si pas de réponse',
        trigger: {
          type: 'quote_request',
          conditions: {
            hours_without_response: 48,
          },
        },
        actions: {
          type: 'send_email',
          template: 'template-1',
          delay: 48,
        },
        isActive: true,
      },
      {
        id: 'rule-2',
        name: 'Alerte devis expirant',
        description: 'Notifier 7 jours avant l\'expiration du devis',
        trigger: {
          type: 'quote_expiring',
          conditions: {
            days_before_expiry: 7,
          },
        },
        actions: {
          type: 'send_whatsapp',
          template: 'template-2',
          delay: 0,
        },
        isActive: true,
      },
      {
        id: 'rule-3',
        name: 'Client inactif',
        description: 'Contacter les clients sans activité depuis 30 jours',
        trigger: {
          type: 'client_inactive',
          conditions: {
            days_inactive: 30,
          },
        },
        actions: {
          type: 'create_task',
          delay: 0,
        },
        isActive: true,
      },
    ];
  }

  // Créer ou mettre à jour une règle d'alerte
  async saveAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      ...rule,
      id: `rule-${Date.now()}`,
    };
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
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      totalSent: 245,
      totalDelivered: 238,
      totalRead: 189,
      responseRate: 0.73,
      averageResponseTime: 4.2, // heures
      channelBreakdown: {
        email: 120,
        whatsapp: 85,
        phone: 40,
      },
    };
  }
}

export const clientCommunicationService = ClientCommunicationService.getInstance();