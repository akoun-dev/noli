export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  quotes: boolean;
  policies: boolean;
  payments: boolean;
  promotions: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  components: WhatsAppComponent[];
}

export interface WhatsAppComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  buttons?: WhatsAppButton[];
}

export interface WhatsAppButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}