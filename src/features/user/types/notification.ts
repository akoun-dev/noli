export interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'push' | 'whatsapp';
  channel: 'email' | 'push' | 'whatsapp' | 'sms';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'unread';
  priority: 'low' | 'medium' | 'high';
  category: 'quote' | 'policy' | 'payment' | 'system' | 'marketing';
  metadata?: {
    quoteId?: string;
    policyId?: string;
    link?: string;
    actionButton?: {
      text: string;
      url: string;
    };
  };
  createdAt: string;
  readAt?: string;
  scheduledFor?: string;
}

export interface NotificationPreferences {
  email: {
    quoteUpdates: boolean;
    policyRenewals: boolean;
    paymentReminders: boolean;
    marketing: boolean;
    systemAlerts: boolean;
  };
  push: {
    quoteUpdates: boolean;
    policyRenewals: boolean;
    paymentReminders: boolean;
    marketing: boolean;
    systemAlerts: boolean;
  };
  whatsapp: {
    quoteUpdates: boolean;
    policyRenewals: boolean;
    paymentReminders: boolean;
    marketing: boolean;
    systemAlerts: boolean;
  };
  sms: {
    quoteUpdates: boolean;
    policyRenewals: boolean;
    paymentReminders: boolean;
    systemAlerts: boolean;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<string, number>;
  byChannel: Record<string, number>;
}