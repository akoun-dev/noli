import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatNotificationTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return format(date, 'dd MMM yyyy', { locale: fr });
};

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'info':
    default:
      return 'ℹ️';
  }
};

export const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'info':
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export const validateNotificationPreferences = (preferences: any) => {
  const required = ['push', 'email', 'whatsapp'];
  const missing = required.filter(key => !(key in preferences));

  if (missing.length > 0) {
    throw new Error(`Préférences manquantes: ${missing.join(', ')}`);
  }

  return true;
};

export const createNotificationTitle = (type: string, data: any): string => {
  switch (type) {
    case 'quote_generated':
      return '📄 Nouveau devis disponible';
    case 'quote_approved':
      return '✅ Devis approuvé';
    case 'quote_expiring':
      return '⏰ Devis expirant bientôt';
    case 'payment_received':
      return '💰 Paiement reçu';
    case 'payment_due':
      return '💳 Paiement à venir';
    case 'payment_failed':
      return '❌ Échec de paiement';
    case 'policy_created':
      return '📋 Contrat créé';
    case 'policy_renewing':
      return '🔄 Renouvellement';
    case 'claim_submitted':
      return '📝 Sinistre déclaré';
    case 'claim_updated':
      return '📊 Mise à jour sinistre';
    case 'promotion':
      return '🎉 Offre spéciale';
    case 'maintenance':
      return '🔧 Maintenance';
    case 'security':
      return '🔒 Alerte sécurité';
    default:
      return '📢 Notification';
  }
};