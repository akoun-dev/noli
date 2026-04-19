import { useState, useEffect } from 'react';
import {
  clientCommunicationService,
  Client,
  Communication,
  CommunicationTemplate,
  AlertRule,
} from '../services/clientCommunicationService';

export const useClientCommunication = (insurerId: string) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    loadTemplates();
    loadAlertRules();
  }, [insurerId]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const clientsData = await clientCommunicationService.getClients(insurerId);
      setClients(clientsData);
    } catch (err) {
      setError('Impossible de charger les clients');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommunicationHistory = async (clientId: string) => {
    try {
      const history = await clientCommunicationService.getCommunicationHistory(
        clientId,
        insurerId
      );
      setCommunications(history);
    } catch (err) {
      setError('Impossible de charger l\'historique de communication');
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await clientCommunicationService.getTemplates(insurerId);
      setTemplates(templatesData);
    } catch (err) {
      setError('Impossible de charger les templates');
    }
  };

  const loadAlertRules = async () => {
    try {
      const rulesData = await clientCommunicationService.getAlertRules(insurerId);
      setAlertRules(rulesData);
    } catch (err) {
      setError('Impossible de charger les règles d\'alerte');
    }
  };

  const sendCommunication = async (
    clientId: string,
    type: Communication['type'],
    content: string,
    subject?: string
  ) => {
    try {
      const communication = await clientCommunicationService.sendCommunication({
        clientId,
        insurerId,
        type,
        direction: 'outgoing',
        content,
        subject,
        status: 'sent',
        priority: 'medium',
      });

      setCommunications(prev => [communication, ...prev]);
      return communication;
    } catch (err) {
      setError('Impossible d\'envoyer la communication');
      throw err;
    }
  };

  const sendBulkCommunication = async (
    clientIds: string[],
    templateId: string,
    customizations?: Record<string, string>
  ) => {
    try {
      const result = await clientCommunicationService.sendBulkCommunication(
        clientIds,
        templateId,
        customizations
      );

      // Actualiser les communications pour les clients sélectionnés
      for (const clientId of result.success) {
        await loadCommunicationHistory(clientId);
      }

      return result;
    } catch (err) {
      setError('Impossible d\'envoyer la communication en masse');
      throw err;
    }
  };

  const scheduleCommunication = async (
    clientId: string,
    type: Communication['type'],
    content: string,
    scheduledFor: Date,
    subject?: string
  ) => {
    try {
      const communication = await clientCommunicationService.scheduleCommunication(
        {
          clientId,
          insurerId,
          type,
          direction: 'outgoing',
          content,
          subject,
          status: 'sent',
          priority: 'medium',
        },
        scheduledFor
      );

      setCommunications(prev => [communication, ...prev]);
      return communication;
    } catch (err) {
      setError('Impossible de planifier la communication');
      throw err;
    }
  };

  const saveAlertRule = async (rule: Omit<AlertRule, 'id'>) => {
    try {
      const savedRule = await clientCommunicationService.saveAlertRule(rule);
      setAlertRules(prev => [...prev, savedRule]);
      return savedRule;
    } catch (err) {
      setError('Impossible de sauvegarder la règle d\'alerte');
      throw err;
    }
  };

  const selectClient = async (client: Client) => {
    setSelectedClient(client);
    await loadCommunicationHistory(client.id);
  };

  const clearError = () => setError(null);

  // Calculer des statistiques dérivées
  const activeClients = clients.filter(c => c.status === 'active');
  const prospects = clients.filter(c => c.status === 'prospect');
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalRevenue, 0);
  const averageConversionRate = clients.length > 0
    ? clients.reduce((sum, client) => sum + (client.convertedQuotes / Math.max(client.totalQuotes, 1)), 0) / clients.length
    : 0;

  return {
    // Données
    clients,
    communications,
    templates,
    alertRules,
    selectedClient,

    // États
    isLoading,
    error,

    // Statistiques
    activeClients,
    prospects,
    totalRevenue,
    averageConversionRate,

    // Actions
    loadClients,
    loadCommunicationHistory,
    loadTemplates,
    loadAlertRules,
    sendCommunication,
    sendBulkCommunication,
    scheduleCommunication,
    saveAlertRule,
    selectClient,
    clearError,
    setSelectedClient,
  };
};