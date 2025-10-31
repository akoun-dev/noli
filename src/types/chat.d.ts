export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'USER' | 'INSURER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'file' | 'quote' | 'location';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    quoteId?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: {
    id: string;
    name: string;
    role: 'USER' | 'INSURER' | 'ASSISTANT';
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  relatedQuoteId?: string;
  relatedInsurerId?: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  autoResponse: boolean;
  responseDelay: number; // en minutes
}