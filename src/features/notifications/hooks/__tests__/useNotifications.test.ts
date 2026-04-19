import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotifications, NotificationData } from '../useNotifications'

// Create a complete mock for Notification
const mockNotification = {
  close: vi.fn(),
  onclick: null as (() => void) | null,
}

// Create a mock Notification constructor
const MockNotificationConstructor = vi.fn().mockImplementation((title, options) => ({
  ...mockNotification,
  title,
  ...options,
}))

// Create a mock object for static properties
const MockNotification = {
  ...MockNotificationConstructor,
  requestPermission: vi.fn(),
  permission: 'default' as 'default' | 'granted' | 'denied',
}

// Set up the Notification mock with proper static properties
Object.defineProperty(MockNotification, 'permission', {
  value: 'default',
  writable: true,
})

Object.defineProperty(window, 'Notification', {
  value: MockNotification,
  writable: true,
})

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      showNotification: vi.fn(),
    }),
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.location and window.focus
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

Object.defineProperty(window, 'focus', {
  value: vi.fn(),
  writable: true,
})

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()

    // Reset Notification permission
    Object.defineProperty(MockNotification, 'permission', {
      value: 'default',
      writable: true,
    })

    // Reset window.Notification mock
    MockNotificationConstructor.mockClear()
    MockNotification.requestPermission.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      // Act
      const { result } = renderHook(() => useNotifications())

      // Assert
      expect(result.current.notifications).toEqual([])
      expect(result.current.preferences).toEqual({
        push: true,
        email: true,
        whatsapp: true,
        quotes: true,
        policies: true,
        payments: true,
        promotions: false,
      })
      expect(result.current.isSupported).toBe(true)
      expect(result.current.permission).toBe('default')
      expect(result.current.unreadCount).toBe(0)
    })

    it('should detect when notifications are not supported', () => {
      // Arrange
      const originalNotification = window.Notification
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
      })

      // Act
      const { result } = renderHook(() => useNotifications())

      // Assert
      expect(result.current.isSupported).toBe(false)

      // Restore
      window.Notification = originalNotification
    })

    it('should load saved notifications from localStorage', () => {
      // Arrange
      const savedNotifications = [
        {
          id: '1',
          title: 'Test',
          message: 'Test message',
          type: 'info' as const,
          timestamp: '2024-01-01T00:00:00.000Z',
          read: false,
        },
      ]

      localStorageMock.setItem('noli:notifications', JSON.stringify(savedNotifications))

      // Act
      const { result } = renderHook(() => useNotifications())

      // Assert
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toEqual({
        ...savedNotifications[0],
        timestamp: new Date(savedNotifications[0].timestamp),
      })
    })

    it('should load saved preferences from localStorage', () => {
      // Arrange
      const savedPreferences = {
        push: false,
        email: true,
        whatsapp: false,
        quotes: true,
        policies: false,
        payments: true,
        promotions: true,
      }

      localStorageMock.setItem('noli:notificationPreferences', JSON.stringify(savedPreferences))

      // Act
      const { result } = renderHook(() => useNotifications())

      // Assert
      expect(result.current.preferences).toEqual(savedPreferences)
    })

    it('should set initial permission from Notification API', () => {
      // Arrange
      Object.defineProperty(MockNotification, 'permission', {
        value: 'granted',
        writable: true,
      })

      // Act
      const { result } = renderHook(() => useNotifications())

      // Assert
      expect(result.current.permission).toBe('granted')
    })
  })

  describe('Permission management', () => {
    it('should request notification permission successfully', async () => {
      // Arrange
      MockNotification.requestPermission.mockResolvedValue('granted')

      const { result } = renderHook(() => useNotifications())

      // Act
      const granted = await act(async () => {
        return await result.current.requestPermission()
      })

      // Assert
      expect(granted).toBe(true)
      expect(result.current.permission).toBe('granted')
      expect(MockNotification.requestPermission).toHaveBeenCalled()
    })

    it('should handle denied permission', async () => {
      // Arrange
      MockNotification.requestPermission.mockResolvedValue('denied')

      const { result } = renderHook(() => useNotifications())

      // Act
      const granted = await act(async () => {
        return await result.current.requestPermission()
      })

      // Assert
      expect(granted).toBe(false)
      expect(result.current.permission).toBe('denied')
    })

    it('should return false when notifications are not supported', async () => {
      // Arrange
      const originalNotification = window.Notification
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
      })

      const { result } = renderHook(() => useNotifications())

      // Act
      const granted = await act(async () => {
        return await result.current.requestPermission()
      })

      // Assert
      expect(granted).toBe(false)

      // Restore
      window.Notification = originalNotification
    })

    it('should handle permission request error', async () => {
      // Arrange
      MockNotification.requestPermission.mockRejectedValue(new Error('Permission denied'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useNotifications())

      // Act
      const granted = await act(async () => {
        return await result.current.requestPermission()
      })

      // Assert
      expect(granted).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la demande de permission:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Notification display', () => {
    it('should add notification to list', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toEqual({
        ...notificationData,
        read: false,
      })
      expect(result.current.unreadCount).toBe(1)
    })

    it('should save notification to localStorage', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'noli:notifications',
        expect.stringContaining('Test Title')
      )
    })

    it('should create browser notification when permission granted and push enabled', () => {
      // Arrange
      Object.defineProperty(MockNotification, 'permission', {
        value: 'granted',
        writable: true,
      })

      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
        actionUrl: 'https://example.com',
        actionText: 'View Details',
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(window.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test message',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: '1',
        requireInteraction: false,
        silent: false,
      })

      // Test notification click handler
      const notification = MockNotificationConstructor.mock.results[0].value
      notification.onclick()

      expect(window.focus).toHaveBeenCalled()
      expect(window.location.href).toBe('https://example.com')
    })

    it('should not create browser notification when permission denied', () => {
      // Arrange
      Object.defineProperty(MockNotification, 'permission', {
        value: 'denied',
        writable: true,
      })

      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(window.Notification).not.toHaveBeenCalled()
    })

    it('should not create browser notification when push disabled', () => {
      // Arrange
      Object.defineProperty(MockNotification, 'permission', {
        value: 'granted',
        writable: true,
      })

      const { result } = renderHook(() => useNotifications())

      // Disable push notifications
      act(() => {
        result.current.updatePreferences({ push: false })
      })

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(window.Notification).not.toHaveBeenCalled()
    })

    it('should send WhatsApp notification for non-info types when enabled', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'success',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Envoi WhatsApp:',
        expect.stringContaining('Test Title')
      )

      expect(localStorageMock.setItem).toHaveBeenCalledWith('noli:whatsappLogs', expect.any(String))

      consoleSpy.mockRestore()
    })

    it('should not send WhatsApp notification for info type', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(consoleSpy).not.toHaveBeenCalledWith('Envoi WhatsApp:', expect.any(String))

      consoleSpy.mockRestore()
    })

    it('should send email notification for non-info types when enabled', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'warning',
        timestamp: new Date(),
        read: false,
      }

      // Act
      act(() => {
        result.current.showNotification(notificationData)
      })

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Envoi email:', {
        subject: 'Test Title',
        body: 'Test message',
        type: 'warning',
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Notification management', () => {
    it('should mark notification as read', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      act(() => {
        result.current.showNotification(notificationData)
      })

      expect(result.current.notifications[0].read).toBe(false)
      expect(result.current.unreadCount).toBe(1)

      // Act
      act(() => {
        result.current.markAsRead('1')
      })

      // Assert
      expect(result.current.notifications[0].read).toBe(true)
      expect(result.current.unreadCount).toBe(0)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'noli:notifications',
        expect.any(String)
      )
    })

    it('should mark all notifications as read', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notifications: NotificationData[] = [
        {
          id: '1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'info',
          timestamp: new Date(),
          read: false,
        },
        {
          id: '2',
          title: 'Test 2',
          message: 'Message 2',
          type: 'success',
          timestamp: new Date(),
          read: false,
        },
      ]

      notifications.forEach((notification) => {
        act(() => {
          result.current.showNotification(notification)
        })
      })

      expect(result.current.unreadCount).toBe(2)

      // Act
      act(() => {
        result.current.markAllAsRead()
      })

      // Assert
      expect(result.current.notifications.every((n) => n.read)).toBe(true)
      expect(result.current.unreadCount).toBe(0)
    })

    it('should delete notification', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      act(() => {
        result.current.showNotification(notificationData)
      })

      expect(result.current.notifications).toHaveLength(1)

      // Act
      act(() => {
        result.current.deleteNotification('1')
      })

      // Assert
      expect(result.current.notifications).toHaveLength(0)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'noli:notifications',
        expect.any(String)
      )
    })
  })

  describe('Preferences management', () => {
    it('should update preferences', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const newPreferences = {
        push: false,
        whatsapp: false,
        promotions: true,
      }

      // Act
      act(() => {
        result.current.updatePreferences(newPreferences)
      })

      // Assert
      expect(result.current.preferences).toEqual({
        push: false,
        email: true,
        whatsapp: false,
        quotes: true,
        policies: true,
        payments: true,
        promotions: true,
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'noli:notificationPreferences',
        JSON.stringify(result.current.preferences)
      )
    })

    it('should merge preferences with existing ones', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      // Act
      act(() => {
        result.current.updatePreferences({ email: false })
      })

      // Assert
      expect(result.current.preferences.email).toBe(false)
      expect(result.current.preferences.push).toBe(true) // Should remain unchanged
    })
  })

  describe('Unread count', () => {
    it('should calculate unread count correctly', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notifications: NotificationData[] = [
        {
          id: '1',
          title: 'Test 1',
          message: 'Message 1',
          type: 'info',
          timestamp: new Date(),
          read: false,
        },
        {
          id: '2',
          title: 'Test 2',
          message: 'Message 2',
          type: 'success',
          timestamp: new Date(),
          read: true,
        },
        {
          id: '3',
          title: 'Test 3',
          message: 'Message 3',
          type: 'warning',
          timestamp: new Date(),
          read: false,
        },
      ]

      // Act
      notifications.forEach((notification) => {
        act(() => {
          result.current.showNotification(notification)
        })
      })

      // Assert
      expect(result.current.unreadCount).toBe(2)
    })

    it('should update unread count when marking as read', () => {
      // Arrange
      const { result } = renderHook(() => useNotifications())

      const notificationData: NotificationData = {
        id: '1',
        title: 'Test Title',
        message: 'Test message',
        type: 'info',
        timestamp: new Date(),
        read: false,
      }

      act(() => {
        result.current.showNotification(notificationData)
      })

      expect(result.current.unreadCount).toBe(1)

      // Act
      act(() => {
        result.current.markAsRead('1')
      })

      // Assert
      expect(result.current.unreadCount).toBe(0)
    })
  })
})
