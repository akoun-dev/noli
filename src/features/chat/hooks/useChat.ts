import { useState, useEffect, useCallback } from 'react';
import { chatService, ChatMessage, ChatRoom, TypingIndicator } from '../services/chatService';

export const useChat = (roomId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<TypingIndicator | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configuration des callbacks
    chatService.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    chatService.onTyping((indicator) => {
      setIsTyping(indicator.isTyping ? indicator : null);
    });

    chatService.onConnected(() => {
      setIsConnected(true);
      setError(null);
    });

    chatService.onDisconnected(() => {
      setIsConnected(false);
    });

    chatService.onError((err) => {
      setError(err.message);
    });

    // Charger les salons de chat
    loadChatRooms();

    // Si un roomId est spécifié, charger l'historique
    if (roomId) {
      loadChatHistory(roomId);
    }

    return () => {
      chatService.disconnect();
    };
  }, [roomId]);

  const loadChatHistory = useCallback(async (roomId: string) => {
    setIsLoading(true);
    try {
      const history = await chatService.getChatHistory(roomId);
      setMessages(history);
    } catch (err) {
      setError('Impossible de charger l\'historique des messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChatRooms = useCallback(async () => {
    try {
      const roomsData = await chatService.getChatRooms();
      setRooms(roomsData);
    } catch (err) {
      setError('Impossible de charger les salons de chat');
    }
  }, []);

  const sendMessage = useCallback(async (content: string, type: ChatMessage['type'] = 'text') => {
    try {
      const message = await chatService.sendMessage({
        senderId: 'user-1',
        senderName: 'Vous',
        senderRole: 'USER',
        content,
        type,
        read: false,
      });

      // Mettre à jour les messages locaux
      setMessages(prev => [...prev, message]);

      return message;
    } catch (err) {
      setError('Impossible d\'envoyer le message');
      throw err;
    }
  }, []);

  const sendFile = useCallback(async (file: File) => {
    if (!roomId) throw new Error('Aucun salon sélectionné');

    try {
      const message = await chatService.sendFile(file, roomId);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (err) {
      setError('Impossible d\'envoyer le fichier');
      throw err;
    }
  }, [roomId]);

  const sendLocation = useCallback(async (location: { lat: number; lng: number; address: string }) => {
    if (!roomId) throw new Error('Aucun salon sélectionné');

    try {
      const message = await chatService.sendLocation(location, roomId);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (err) {
      setError('Impossible d\'envoyer la localisation');
      throw err;
    }
  }, [roomId]);

  const markAsRead = useCallback((messageIds: string[]) => {
    if (!roomId) return;

    chatService.markAsRead(roomId, messageIds);
    setMessages(prev =>
      prev.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      )
    );
  }, [roomId]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    chatService.sendTypingIndicator(isTyping, 'user-1', 'Vous');
  }, []);

  // Marquer tous les messages comme lus
  const markAllAsRead = useCallback(() => {
    const unreadMessages = messages.filter(msg => !msg.read && msg.senderRole !== 'USER');
    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages.map(msg => msg.id));
    }
  }, [messages, markAsRead]);

  return {
    messages,
    rooms,
    isConnected,
    isTyping,
    isLoading,
    error,
    sendMessage,
    sendFile,
    sendLocation,
    markAsRead,
    markAllAsRead,
    sendTypingIndicator,
    loadChatHistory,
    loadChatRooms,
  };
};