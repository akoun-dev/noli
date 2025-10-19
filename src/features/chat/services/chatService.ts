import { useEffect, useRef, useState } from 'react';

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

class ChatService {
  private ws: WebSocket | null = null;
  private callbacks: {
    onMessage?: (message: ChatMessage) => void;
    onTyping?: (indicator: TypingIndicator) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
  } = {};

  constructor() {
    // Simulation WebSocket - remplacer par véritable connexion WebSocket
    this.connect();
  }

  private connect() {
    try {
      // Simulation de connexion WebSocket
      logger.info('Connexion au chat WebSocket...');

      // Simuler une connexion réussie après 1 seconde
      setTimeout(() => {
        this.callbacks.onConnected?.();

        // Simuler des messages de bienvenue
        setTimeout(() => {
          this.callbacks.onMessage?.({
            id: 'welcome-1',
            senderId: 'assistant-1',
            senderName: 'Assistant NOLI',
            senderRole: 'ASSISTANT',
            content: 'Bonjour ! Je suis là pour vous aider. Posez-moi vos questions sur les assurances auto.',
            timestamp: new Date(),
            read: false,
            type: 'text',
          });
        }, 1500);
      }, 1000);

    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  // Gestion des callbacks
  onMessage(callback: (message: ChatMessage) => void) {
    this.callbacks.onMessage = callback;
  }

  onTyping(callback: (indicator: TypingIndicator) => void) {
    this.callbacks.onTyping = callback;
  }

  onConnected(callback: () => void) {
    this.callbacks.onConnected = callback;
  }

  onDisconnected(callback: () => void) {
    this.callbacks.onDisconnected = callback;
  }

  onError(callback: (error: Error) => void) {
    this.callbacks.onError = callback;
  }

  // Envoyer un message
  sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    try {
      // Simuler l'envoi du message
      logger.info('Message envoyé:', fullMessage);

      // Simuler une réponse automatique
      setTimeout(() => {
        this.simulateResponse(fullMessage);
      }, 2000 + Math.random() * 3000);

      return fullMessage;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  private simulateResponse(userMessage: ChatMessage) {
    const responses = [
      'Je comprends votre question. Laissez-moi vous aider avec ça.',
      'C\'est une excellente question ! Selon votre profil, je vous recommande...',
      'Pour vous donner la meilleure réponse, j\'ai besoin de quelques informations supplémentaires.',
      'Je peux vous proposer plusieurs options adaptées à vos besoins.',
      'Nos assureurs partenaires ont des formules très compétitives pour ce type de véhicule.',
    ];

    const agentResponses = [
      'Bonjour, je suis [Agent] de [Assureur]. Je vais étudier votre demande et vous répondre dans les plus brefs délais.',
      'Merci pour votre intérêt. Voici les informations que vous demandez...',
      'Je vous confirme que nous pouvons vous proposer une couverture adaptée à votre véhicule.',
      'Pourriez-vous me communiquer votre numéro de permis et la date de première mise en circulation ?',
      'Nos tarifs sont très compétitifs. Souhaitez-vous recevoir un devis personnalisé ?',
    ];

    const isUserMessage = userMessage.senderRole === 'USER';
    const responsePool = isUserMessage ? agentResponses : responses;
    const randomResponse = responsePool[Math.floor(Math.random() * responsePool.length)];

    const responseMessage: ChatMessage = {
      id: `response-${Date.now()}`,
      senderId: isUserMessage ? 'agent-1' : 'assistant-1',
      senderName: isUserMessage ? 'Conseiller Assurance' : 'Assistant NOLI',
      senderRole: isUserMessage ? 'INSURER' : 'ASSISTANT',
      content: randomResponse,
      timestamp: new Date(),
      read: false,
      type: 'text',
    };

    this.callbacks.onMessage?.(responseMessage);
  }

  // Indicateur de frappe
  sendTypingIndicator(isTyping: boolean, userId: string, userName: string) {
    const indicator: TypingIndicator = {
      userId,
      userName,
      isTyping,
    };

    logger.info('Typing indicator:', indicator);
    // Simuler l'envoi de l'indicateur
    setTimeout(() => {
      this.callbacks.onTyping?.(indicator);
    }, 100);
  }

  // Obtenir l'historique des messages
  async getChatHistory(roomId: string): Promise<ChatMessage[]> {
    // Simuler la récupération de l'historique
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockHistory: ChatMessage[] = [
          {
            id: 'history-1',
            senderId: 'assistant-1',
            senderName: 'Assistant NOLI',
            senderRole: 'ASSISTANT',
            content: 'Bonjour et bienvenue sur NOLI Assurance ! Comment puis-je vous aider aujourd\'hui ?',
            timestamp: new Date(Date.now() - 3600000),
            read: true,
            type: 'text',
          },
        ];
        resolve(mockHistory);
      }, 500);
    });
  }

  // Obtenir les salons de chat disponibles
  async getChatRooms(): Promise<ChatRoom[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockRooms: ChatRoom[] = [
          {
            id: 'room-1',
            name: 'Support NOLI',
            participants: [
              {
                id: 'user-1',
                name: 'Vous',
                role: 'USER',
                isOnline: true,
              },
              {
                id: 'assistant-1',
                name: 'Assistant NOLI',
                role: 'ASSISTANT',
                isOnline: true,
              },
            ],
            unreadCount: 0,
            createdAt: new Date(Date.now() - 86400000),
          },
        ];
        resolve(mockRooms);
      }, 300);
    });
  }

  // Marquer les messages comme lus
  markAsRead(roomId: string, messageIds: string[]) {
    logger.info('Messages marqués comme lus:', { roomId, messageIds });
    // Implémentation réelle avec WebSocket
  }

  // Envoyer un fichier
  sendFile(file: File, roomId: string) {
    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      senderId: 'user-1',
      senderName: 'Vous',
      senderRole: 'USER',
      content: `Fichier partagé: ${file.name}`,
      type: 'file',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
      },
    };

    return this.sendMessage(message);
  }

  // Envoyer une localisation
  sendLocation(location: { lat: number; lng: number; address: string }, roomId: string) {
    const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
      senderId: 'user-1',
      senderName: 'Vous',
      senderRole: 'USER',
      content: `Localisation partagée: ${location.address}`,
      type: 'location',
      metadata: { location },
    };

    return this.sendMessage(message);
  }

  // Déconnexion
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.onDisconnected?.();
  }
}

export const chatService = new ChatService();