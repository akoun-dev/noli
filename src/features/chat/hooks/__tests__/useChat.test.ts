import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChat } from '../useChat';
import { chatService, ChatMessage, ChatRoom, TypingIndicator } from '../services/chatService';

// Mock chatService
vi.mock('../services/chatService', () => ({
  chatService: {
    onMessage: vi.fn(),
    onTyping: vi.fn(),
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
    getChatHistory: vi.fn(),
    getChatRooms: vi.fn(),
    sendMessage: vi.fn(),
    sendFile: vi.fn(),
    sendLocation: vi.fn(),
    markAsRead: vi.fn(),
    sendTypingIndicator: vi.fn(),
    disconnect: vi.fn(),
  },
}));

describe('useChat', () => {
  const mockRoomId = 'room-123';
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      senderId: 'user-1',
      senderName: 'John Doe',
      senderRole: 'USER',
      content: 'Hello',
      type: 'text',
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      senderId: 'insurer-1',
      senderName: 'AXA Assurances',
      senderRole: 'INSURER',
      content: 'Hello! How can I help you?',
      type: 'text',
      read: false,
      timestamp: new Date().toISOString(),
    },
  ];

  const mockRooms: ChatRoom[] = [
    {
      id: 'room-1',
      name: 'General Support',
      type: 'support',
      participants: [],
      lastMessage: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(chatService.getChatHistory).mockResolvedValue(mockMessages);
    vi.mocked(chatService.getChatRooms).mockResolvedValue(mockRooms);
    vi.mocked(chatService.sendMessage).mockResolvedValue(mockMessages[0]);
    vi.mocked(chatService.sendFile).mockResolvedValue(mockMessages[0]);
    vi.mocked(chatService.sendLocation).mockResolvedValue(mockMessages[0]);

    // Mock callback functions
    vi.mocked(chatService.onMessage).mockImplementation((callback: (message: ChatMessage) => void) => {
      // Store callback for later use
      (chatService as { _messageCallback?: (message: ChatMessage) => void })._messageCallback = callback;
    });

    vi.mocked(chatService.onTyping).mockImplementation((callback: (indicator: TypingIndicator) => void) => {
      (chatService as { _typingCallback?: (indicator: TypingIndicator) => void })._typingCallback = callback;
    });

    vi.mocked(chatService.onConnected).mockImplementation((callback: () => void) => {
      (chatService as { _connectedCallback?: () => void })._connectedCallback = callback;
    });

    vi.mocked(chatService.onDisconnected).mockImplementation((callback: () => void) => {
      (chatService as { _disconnectedCallback?: () => void })._disconnectedCallback = callback;
    });

    vi.mocked(chatService.onError).mockImplementation((callback: (error: Error) => void) => {
      (chatService as { _errorCallback?: (error: Error) => void })._errorCallback = callback;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      // Act
      const { result } = renderHook(() => useChat());

      // Assert
      expect(result.current.messages).toEqual([]);
      expect(result.current.rooms).toEqual([]);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isTyping).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should setup chat service callbacks on mount', () => {
      // Act
      renderHook(() => useChat());

      // Assert
      expect(chatService.onMessage).toHaveBeenCalled();
      expect(chatService.onTyping).toHaveBeenCalled();
      expect(chatService.onConnected).toHaveBeenCalled();
      expect(chatService.onDisconnected).toHaveBeenCalled();
      expect(chatService.onError).toHaveBeenCalled();
    });

    it('should load chat rooms on mount', async () => {
      // Act
      const { result } = renderHook(() => useChat());

      // Assert
      expect(chatService.getChatRooms).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.rooms).toEqual(mockRooms);
      });
    });

    it('should load chat history when roomId is provided', async () => {
      // Act
      const { result } = renderHook(() => useChat(mockRoomId));

      // Assert
      expect(chatService.getChatHistory).toHaveBeenCalledWith(mockRoomId);

      await waitFor(() => {
        expect(result.current.messages).toEqual(mockMessages);
      });
    });

    it('should disconnect on unmount', () => {
      // Act
      const { unmount } = renderHook(() => useChat());

      // Assert
      expect(chatService.disconnect).not.toHaveBeenCalled();

      // Cleanup
      unmount();

      expect(chatService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Connection state management', () => {
    it('should update connection state when connected', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());

      // Act
      act(() => {
        (chatService as { _connectedCallback?: () => void })._connectedCallback?.();
      });

      // Assert
      expect(result.current.isConnected).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should update connection state when disconnected', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());

      // First connect
      act(() => {
        (chatService as { _connectedCallback?: () => void })._connectedCallback?.();
      });

      // Then disconnect
      act(() => {
        (chatService as { _disconnectedCallback?: () => void })._disconnectedCallback?.();
      });

      // Assert
      expect(result.current.isConnected).toBe(false);
    });

    it('should handle error state', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());
      const error = new Error('Connection failed');

      // Act
      act(() => {
        (chatService as { _errorCallback?: (error: Error) => void })._errorCallback?.(error);
      });

      // Assert
      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('Message handling', () => {
    it('should add new message when received', async () => {
      // Arrange
      const { result } = renderHook(() => useChat(mockRoomId));
      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      const newMessage: ChatMessage = {
        id: '3',
        senderId: 'insurer-1',
        senderName: 'AXA Assurances',
        senderRole: 'INSURER',
        content: 'New message',
        type: 'text',
        read: false,
        timestamp: new Date().toISOString(),
      };

      // Act
      act(() => {
        (chatService as { _messageCallback?: (message: ChatMessage) => void })._messageCallback?.(newMessage);
      });

      // Assert
      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[2]).toEqual(newMessage);
    });

    it('should send message successfully', async () => {
      // Arrange
      const { result } = renderHook(() => useChat(mockRoomId));
      const messageContent = 'Test message';

      // Act
      await act(async () => {
        await result.current.sendMessage(messageContent);
      });

      // Assert
      expect(chatService.sendMessage).toHaveBeenCalledWith({
        senderId: 'user-1',
        senderName: 'Vous',
        senderRole: 'USER',
        content: messageContent,
        type: 'text',
        read: false,
      });

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(3); // 2 initial + 1 new
      });
    });

    it('should handle send message error', async () => {
      // Arrange
      const errorMessage = 'Send failed';
      vi.mocked(chatService.sendMessage).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useChat(mockRoomId));

      // Act & Assert
      await act(async () => {
        try {
          await result.current.sendMessage('Test message');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Impossible d\'envoyer le message');
    });

    it('should send file successfully', async () => {
      // Arrange
      const { result } = renderHook(() => useChat(mockRoomId));
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      // Act
      await act(async () => {
        await result.current.sendFile(file);
      });

      // Assert
      expect(chatService.sendFile).toHaveBeenCalledWith(file, mockRoomId);

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(3);
      });
    });

    it('should throw error when sending file without roomId', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      // Act & Assert
      await act(async () => {
        await expect(result.current.sendFile(file)).rejects.toThrow('Aucun salon sélectionné');
      });
    });

    it('should send location successfully', async () => {
      // Arrange
      const { result } = renderHook(() => useChat(mockRoomId));
      const location = { lat: 5.3, lng: -4.0, address: 'Abidjan, Côte d\'Ivoire' };

      // Act
      await act(async () => {
        await result.current.sendLocation(location);
      });

      // Assert
      expect(chatService.sendLocation).toHaveBeenCalledWith(location, mockRoomId);

      await waitFor(() => {
        expect(result.current.messages).toHaveLength(3);
      });
    });

    it('should throw error when sending location without roomId', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());
      const location = { lat: 5.3, lng: -4.0, address: 'Abidjan, Côte d\'Ivoire' };

      // Act & Assert
      await act(async () => {
        await expect(result.current.sendLocation(location)).rejects.toThrow('Aucun salon sélectionné');
      });
    });
  });

  describe('Message status management', () => {
    it('should mark messages as read', () => {
      // Arrange
      const { result } = renderHook(() => useChat(mockRoomId));
      const messageIds = ['1', '2'];

      // Act
      act(() => {
        result.current.markAsRead(messageIds);
      });

      // Assert
      expect(chatService.markAsRead).toHaveBeenCalledWith(mockRoomId, messageIds);

      result.current.messages.forEach((message, index) => {
        if (messageIds.includes(message.id)) {
          expect(message.read).toBe(true);
        }
      });
    });

    it('should mark all unread messages as read', async () => {
      // Arrange
      const { result } = renderHook(() => useChat(mockRoomId));
      await waitFor(() => {
        expect(result.current.messages).toHaveLength(2);
      });

      // Act
      act(() => {
        result.current.markAllAsRead();
      });

      // Assert
      const unreadMessages = mockMessages.filter(msg => !msg.read && msg.senderRole !== 'USER');
      expect(chatService.markAsRead).toHaveBeenCalledWith(
        mockRoomId,
        unreadMessages.map(msg => msg.id)
      );
    });

    it('should not mark messages as read without roomId', () => {
      // Arrange
      const { result } = renderHook(() => useChat());

      // Act
      act(() => {
        result.current.markAsRead(['1', '2']);
      });

      // Assert
      expect(chatService.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('Typing indicators', () => {
    it('should handle typing indicator when received', () => {
      // Arrange
      const { result } = renderHook(() => useChat());
      const typingIndicator: TypingIndicator = {
        userId: 'user-2',
        userName: 'Jane Doe',
        isTyping: true,
      };

      // Act
      act(() => {
        (chatService as { _typingCallback?: (indicator: TypingIndicator) => void })._typingCallback?.(typingIndicator);
      });

      // Assert
      expect(result.current.isTyping).toEqual(typingIndicator);
    });

    it('should clear typing indicator when not typing', () => {
      // Arrange
      const { result } = renderHook(() => useChat());
      const typingIndicator: TypingIndicator = {
        userId: 'user-2',
        userName: 'Jane Doe',
        isTyping: false,
      };

      // Act
      act(() => {
        (chatService as { _typingCallback?: (indicator: TypingIndicator) => void })._typingCallback?.(typingIndicator);
      });

      // Assert
      expect(result.current.isTyping).toBe(null);
    });

    it('should send typing indicator', () => {
      // Arrange
      const { result } = renderHook(() => useChat());

      // Act
      act(() => {
        result.current.sendTypingIndicator(true);
      });

      // Assert
      expect(chatService.sendTypingIndicator).toHaveBeenCalledWith(true, 'user-1', 'Vous');
    });
  });

  describe('Loading states', () => {
    it('should set loading state when loading chat history', async () => {
      // Arrange
      vi.mocked(chatService.getChatHistory).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockMessages), 100))
      );

      const { result } = renderHook(() => useChat(mockRoomId));

      // Assert initial loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle chat history loading error', async () => {
      // Arrange
      vi.mocked(chatService.getChatHistory).mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useChat(mockRoomId));

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert error state
      expect(result.current.error).toBe('Impossible de charger l\'historique des messages');
    });

    it('should handle chat rooms loading error', async () => {
      // Arrange
      vi.mocked(chatService.getChatRooms).mockRejectedValue(new Error('Load rooms failed'));

      const { result } = renderHook(() => useChat());

      // Wait for error to be set
      await waitFor(() => {
        expect(result.current.error).toBe('Impossible de charger les salons de chat');
      });
    });
  });

  describe('Manual operations', () => {
    it('should manually reload chat history', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());

      // Clear initial calls
      vi.clearAllMocks();
      vi.mocked(chatService.getChatHistory).mockResolvedValue(mockMessages);

      // Act
      await act(async () => {
        await result.current.loadChatHistory(mockRoomId);
      });

      // Assert
      expect(chatService.getChatHistory).toHaveBeenCalledWith(mockRoomId);
      expect(result.current.messages).toEqual(mockMessages);
    });

    it('should manually reload chat rooms', async () => {
      // Arrange
      const { result } = renderHook(() => useChat());

      // Clear initial calls
      vi.clearAllMocks();
      vi.mocked(chatService.getChatRooms).mockResolvedValue(mockRooms);

      // Act
      await act(async () => {
        await result.current.loadChatRooms();
      });

      // Assert
      expect(chatService.getChatRooms).toHaveBeenCalled();
      expect(result.current.rooms).toEqual(mockRooms);
    });
  });
});