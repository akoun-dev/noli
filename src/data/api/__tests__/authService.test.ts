import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '../authService'
import { supabaseHelpers, supabase } from '@/lib/supabase'

// Mock Supabase dependencies
vi.mock('@/lib/supabase', () => ({
  supabaseHelpers: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    logAction: vi.fn(),
    resetPassword: vi.fn(),
    createPasswordResetToken: vi.fn(),
    usePasswordResetToken: vi.fn(),
    getUserPermissions: vi.fn(),
    hasPermission: vi.fn(),
    getUserSessions: vi.fn(),
    revokeSession: vi.fn(),
  },
  supabase: {
    auth: {
      refreshSession: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockAuthData = {
        user: { id: 'user-123' },
        session: { access_token: 'token-123' },
      }

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Acme Corp',
        role: 'USER',
        phone: '+1234567890',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(supabaseHelpers.signIn).mockResolvedValue(mockAuthData)
      vi.mocked(supabaseHelpers.getProfile).mockResolvedValue(mockProfile)
      vi.mocked(supabaseHelpers.logAction).mockResolvedValue(undefined)

      // Act
      const result = await authService.login(credentials)

      // Assert
      expect(supabaseHelpers.signIn).toHaveBeenCalledWith(credentials.email, credentials.password)
      expect(supabaseHelpers.getProfile).toHaveBeenCalledWith('user-123')
      expect(supabaseHelpers.logAction).toHaveBeenCalledWith('LOGIN', 'session', 'user-123')

      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          companyName: 'Acme Corp',
          role: 'USER',
          phone: '+1234567890',
          avatar: 'https://example.com/avatar.jpg',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        session: mockAuthData.session,
      })
    })

    it('should throw error when profile not found', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockAuthData = {
        user: { id: 'user-123' },
        session: { access_token: 'token-123' },
      }

      vi.mocked(supabaseHelpers.signIn).mockResolvedValue(mockAuthData)
      vi.mocked(supabaseHelpers.getProfile).mockResolvedValue(null)
      vi.mocked(supabaseHelpers.logAction).mockResolvedValue(undefined)

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Profil utilisateur non trouvé')
    })

    it('should throw error when sign in fails', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password',
      }

      const error = new Error('Invalid credentials')
      vi.mocked(supabaseHelpers.signIn).mockRejectedValue(error)

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
      }

      const mockAuthData = {
        user: { id: 'new-user-123' },
        session: { access_token: 'token-456' },
      }

      vi.mocked(supabaseHelpers.signUp).mockResolvedValue(mockAuthData)
      vi.mocked(supabaseHelpers.logAction).mockResolvedValue(undefined)

      // Act
      const result = await authService.register(registerData)

      // Assert
      expect(supabaseHelpers.signUp).toHaveBeenCalledWith(
        registerData.email,
        registerData.password,
        {
          first_name: registerData.firstName,
          last_name: registerData.lastName,
          phone: registerData.phone,
          role: 'USER',
        }
      )

      expect(supabaseHelpers.logAction).toHaveBeenCalledWith(
        'ACCOUNT_CREATED',
        'profile',
        'new-user-123'
      )

      expect(result).toEqual({
        user: {
          id: 'new-user-123',
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: 'USER',
          phone: registerData.phone,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        session: mockAuthData.session,
      })
    })

    it('should throw error when user creation fails', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567890',
      }

      const mockAuthData = {
        user: null,
        session: null,
      }

      vi.mocked(supabaseHelpers.signUp).mockResolvedValue(mockAuthData)

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        'Erreur lors de la création du compte'
      )
    })
  })

  describe('loginWithOAuth', () => {
    it('should initiate OAuth login with Google', async () => {
      // Arrange
      vi.mocked(supabaseHelpers.signInWithOAuth).mockResolvedValue(undefined)

      // Act
      await authService.loginWithOAuth('google')

      // Assert
      expect(supabaseHelpers.signInWithOAuth).toHaveBeenCalledWith('google')
    })

    it('should handle OAuth login errors', async () => {
      // Arrange
      const error = new Error('OAuth failed')
      vi.mocked(supabaseHelpers.signInWithOAuth).mockRejectedValue(error)

      // Act & Assert
      await expect(authService.loginWithOAuth('facebook')).rejects.toThrow('OAuth failed')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user has valid session', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      })

      // Act
      const result = await authService.isAuthenticated()

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when no session exists', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
      })

      // Act
      const result = await authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when session check fails', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Session check failed'))

      // Act
      const result = await authService.isAuthenticated()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('logout', () => {
    it('should successfully logout and log the action', async () => {
      // Arrange
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })
      vi.mocked(supabaseHelpers.signOut).mockResolvedValue(undefined)
      vi.mocked(supabaseHelpers.logAction).mockResolvedValue(undefined)

      // Act
      await authService.logout()

      // Assert
      expect(supabaseHelpers.logAction).toHaveBeenCalledWith('LOGOUT', 'session', 'user-123')
      expect(supabaseHelpers.signOut).toHaveBeenCalled()
    })

    it('should logout even when no user is found', async () => {
      // Arrange
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
      })
      vi.mocked(supabaseHelpers.signOut).mockResolvedValue(undefined)

      // Act
      await authService.logout()

      // Assert
      expect(supabaseHelpers.signOut).toHaveBeenCalled()
      expect(supabaseHelpers.logAction).not.toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      // Arrange
      const mockAuthUser = { id: 'user-123' }
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company_name: null,
        role: 'USER',
        phone: '+1234567890',
        avatar_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthUser },
      })
      vi.mocked(supabaseHelpers.getProfile).mockResolvedValue(mockProfile)

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        companyName: null,
        role: 'USER',
        phone: '+1234567890',
        avatar: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    })

    it('should return null when no authenticated user', async () => {
      // Arrange
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
      })

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when profile not found', async () => {
      // Arrange
      const mockAuthUser = { id: 'user-123' }
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockAuthUser },
      })
      vi.mocked(supabaseHelpers.getProfile).mockResolvedValue(null)

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when authentication check fails', async () => {
      // Arrange
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Auth check failed'))

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      // Arrange
      const mockPermissions = ['read:quotes', 'write:quotes', 'read:policies']
      vi.mocked(supabaseHelpers.getUserPermissions).mockResolvedValue(mockPermissions)

      // Act
      const result = await authService.getUserPermissions()

      // Assert
      expect(result).toEqual(mockPermissions)
    })

    it('should return empty array when permission check fails', async () => {
      // Arrange
      vi.mocked(supabaseHelpers.getUserPermissions).mockRejectedValue(
        new Error('Permission check failed')
      )

      // Act
      const result = await authService.getUserPermissions()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('hasPermission', () => {
    it('should return true when user has permission', async () => {
      // Arrange
      vi.mocked(supabaseHelpers.hasPermission).mockResolvedValue(true)

      // Act
      const result = await authService.hasPermission('read:quotes')

      // Assert
      expect(result).toBe(true)
    })

    it('should return false when user does not have permission', async () => {
      // Arrange
      vi.mocked(supabaseHelpers.hasPermission).mockResolvedValue(false)

      // Act
      const result = await authService.hasPermission('admin:access')

      // Assert
      expect(result).toBe(false)
    })

    it('should return false when permission check fails', async () => {
      // Arrange
      vi.mocked(supabaseHelpers.hasPermission).mockRejectedValue(
        new Error('Permission check failed')
      )

      // Act
      const result = await authService.hasPermission('read:quotes')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      // Act
      const instance1 = authService
      const instance2 = authService

      // Assert
      expect(instance1).toBe(instance2)
    })
  })
})
