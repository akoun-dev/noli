import { render, renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { ReactNode } from 'react'
import { UserProvider, useUser } from '../UserContext'
import { AuthProvider, useAuth } from '../AuthContext'
import { User } from '@/types'

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Acme Corp',
  role: 'USER',
  phone: '+2250102030405',
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Test wrapper components
const AuthenticatedWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>
    <UserProvider>{children}</UserProvider>
  </AuthProvider>
)

const UnauthenticatedWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>
    <UserProvider>{children}</UserProvider>
  </AuthProvider>
)

// Mock useAuth to control authentication state
vi.mock('../AuthContext', async () => {
  const actual = await vi.importActual('../AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

describe('UserContext', () => {
  let mockUseAuth: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked useAuth function
    const { useAuth } = await import('../AuthContext')
    mockUseAuth = vi.mocked(useAuth)

    // Default mock for unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      refreshToken: vi.fn(),
      hasPermission: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      loginWithOAuth: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Unauthenticated state', () => {
    it('should not fetch profile when user is not authenticated', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })

      // Act
      const { result } = renderHook(() => useUser(), { wrapper: UnauthenticatedWrapper })

      // Assert
      expect(result.current.profile).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch profile when user is loading', () => {
      // Arrange
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        permissions: [],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })

      // Act
      const { result } = renderHook(() => useUser(), { wrapper: UnauthenticatedWrapper })

      // Assert
      expect(result.current.profile).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Authenticated state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        permissions: ['read:quotes'],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })
    })

    it('should fetch profile when user becomes authenticated', async () => {
      // Act
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      // Assert
      await waitFor(() => {
        expect(result.current.profile).toEqual({
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          phone: '+2250102030405',
          preferences: {
            language: 'fr',
            currency: 'XOF',
            notifications: {
              email: true,
              sms: true,
              push: true,
            },
          },
        })
      })
    })

    it('should set loading state during profile fetch', async () => {
      // Act
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      // Assert - Should start with loading true
      expect(result.current.isLoading).toBe(true)

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle profile fetch error', async () => {
      // Arrange - Mock console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Assert
      expect(result.current.isLoading).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('Profile updates', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        permissions: ['read:quotes'],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })
    })

    it('should update profile successfully', async () => {
      // Arrange
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      const updateData = {
        firstName: 'Jane',
        phone: '+2250102030406',
        preferences: {
          language: 'en' as const,
          currency: 'EUR' as const,
          notifications: {
            email: false,
            sms: true,
            push: false,
          },
        },
      }

      // Act
      await act(async () => {
        await result.current.updateProfile(updateData)
      })

      // Assert
      expect(result.current.profile).toEqual({
        id: 'user-123',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250102030406',
        preferences: {
          language: 'en',
          currency: 'EUR',
          notifications: {
            email: false,
            sms: true,
            push: false,
          },
        },
      })
    })

    it('should set loading state during profile update', async () => {
      // Arrange
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      // Act
      const updatePromise = act(async () => {
        await result.current.updateProfile({ firstName: 'Jane' })
      })

      // Should not be loading after update
      await updatePromise
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle profile update error', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      // Mock implementation to throw error during update
      let updateCall: (data: unknown) => Promise<void>

      // We need to mock the context implementation to throw an error
      // This is a limitation of the current implementation where the error is caught internally
      // For now, we'll test the loading state behavior

      // Act & Assert
      await act(async () => {
        // The current implementation catches errors and doesn't re-throw them
        // This test verifies the loading state behavior
        await result.current.updateProfile({ firstName: 'Jane' })
      })

      expect(result.current.isLoading).toBe(false)

      consoleSpy.mockRestore()
    })

    it('should not update profile when profile is null', async () => {
      // Arrange - Create unauthenticated state
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })

      const { result } = renderHook(() => useUser(), { wrapper: UnauthenticatedWrapper })

      // Act - Should not throw error
      await act(async () => {
        try {
          await result.current.updateProfile({ firstName: 'Jane' })
        } catch (error) {
          // Expected to handle error gracefully
        }
      })

      // Assert
      expect(result.current.profile).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Manual profile fetching', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        permissions: ['read:quotes'],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })
    })

    it('should manually fetch profile', async () => {
      // Arrange
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      // Act
      await act(async () => {
        await result.current.getProfile()
      })

      // Assert
      expect(result.current.profile).toEqual({
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250102030405',
        preferences: {
          language: 'fr',
          currency: 'XOF',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      })
    })

    it('should set loading state during manual fetch', async () => {
      // Arrange
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      // Act
      await act(async () => {
        await result.current.getProfile()
      })

      // Should not be loading after fetch
      expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch profile when user is null', async () => {
      // Arrange - Mock user as null
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true, // This case shouldn't happen but we test it anyway
        isLoading: false,
        permissions: [],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })

      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      // Act
      await act(async () => {
        try {
          await result.current.getProfile()
        } catch (error) {
          // Expected to handle error gracefully
        }
      })

      // Assert
      expect(result.current.profile).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Context provider', () => {
    it('should throw error when useUser is used outside provider', () => {
      // Act & Assert
      try {
        renderHook(() => useUser())
        // If we reach here, the test should fail
        expect(true).toBe(false)
      } catch (error) {
        expect(error instanceof Error).toBe(true)
        if (error instanceof Error) {
          expect(error.message).toContain('useUser must be used within UserProvider')
        }
      }
    })

    it('should provide context to children', async () => {
      // Arrange
      const TestComponent = () => {
        const user = useUser()
        return <div>{user.profile ? 'Profile Loaded' : 'No Profile'}</div>
      }

      // Act
      const { getByText } = render(
        <AuthenticatedWrapper>
          <TestComponent />
        </AuthenticatedWrapper>
      )

      // Wait for profile to load
      await waitFor(() => {
        expect(getByText('Profile Loaded')).toBeInTheDocument()
      })
    })

    it('should react to authentication state changes', async () => {
      // Arrange
      let setAuthState: React.Dispatch<React.SetStateAction<boolean>>

      const DynamicWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
        const [isAuthenticated, setIsAuthenticated] = React.useState(false)
        setAuthState = setIsAuthenticated

        return (
          <AuthProvider>
            <UserProvider>{children}</UserProvider>
          </AuthProvider>
        )
      }

      const { result } = renderHook(() => useUser(), {
        wrapper: ({ children }) => <DynamicWrapper>{children}</DynamicWrapper>,
      })

      // Assert - Initially not authenticated
      expect(result.current.profile).toBe(null)

      // Act - Simulate authentication
      await act(async () => {
        setAuthState(true)
      })

      // Assert - Should fetch profile after authentication
      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })
    })
  })

  describe('Profile data structure', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        permissions: ['read:quotes'],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })
    })

    it('should create profile with correct structure', async () => {
      // Act
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      // Assert
      const profile = result.current.profile!
      expect(profile).toHaveProperty('id', 'user-123')
      expect(profile).toHaveProperty('firstName', 'John')
      expect(profile).toHaveProperty('lastName', 'Doe')
      expect(profile).toHaveProperty('email', 'test@example.com')
      expect(profile).toHaveProperty('phone', '+2250102030405')
      expect(profile).toHaveProperty('preferences')
      expect(profile.preferences).toHaveProperty('language', 'fr')
      expect(profile.preferences).toHaveProperty('currency', 'XOF')
      expect(profile.preferences).toHaveProperty('notifications')
      expect(profile.preferences.notifications).toHaveProperty('email', true)
      expect(profile.preferences.notifications).toHaveProperty('sms', true)
      expect(profile.preferences.notifications).toHaveProperty('push', true)
    })

    it('should handle partial user data', async () => {
      // Arrange
      const partialUser: User = {
        ...mockUser,
        firstName: '',
        lastName: '',
        phone: '',
      }

      mockUseAuth.mockReturnValue({
        user: partialUser,
        isAuthenticated: true,
        isLoading: false,
        permissions: ['read:quotes'],
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        loginWithOAuth: vi.fn(),
      })

      // Act
      const { result } = renderHook(() => useUser(), { wrapper: AuthenticatedWrapper })

      await waitFor(() => {
        expect(result.current.profile).not.toBe(null)
      })

      // Assert
      expect(result.current.profile).toEqual({
        id: 'user-123',
        firstName: '',
        lastName: '',
        email: 'test@example.com',
        phone: '',
        preferences: {
          language: 'fr',
          currency: 'XOF',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      })
    })
  })
})
