import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { authService } from '@/data/api/authService'
import { supabase } from '@/lib/supabase'
import LoginPage from '@/features/auth/pages/LoginPage'

// Mock dependencies
vi.mock('@/data/api/authService')
vi.mock('@/lib/supabase')
vi.mock('@/lib/logger')

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Test wrapper with all providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProvider>{children}</UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Acme Corp',
  role: 'USER' as const,
  phone: '+2250102030405',
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'John',
      last_name: 'Doe',
      company: 'Acme Corp',
      role: 'USER',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    app_metadata: {},
    aud: 'authenticated',
    phone: '+2250102030405',
    created_at: '2024-01-01T00:00:00Z',
  },
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer' as const,
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: 'mock-subscription-id',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    })

    vi.mocked(authService.login).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    })

    vi.mocked(authService.logout).mockResolvedValue(undefined)
    vi.mocked(authService.getUserPermissions).mockResolvedValue(['read:quotes', 'write:quotes'])

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Login Flow', () => {
    it('should complete successful login flow', async () => {
      // Arrange
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Assert initial state
      expect(screen.getByText(/Connexion/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument()

      // Act - Fill form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      })

      fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
        target: { value: 'password123' },
      })

      // Act - Submit form
      fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

      // Assert loading state
      expect(screen.getByRole('button', { name: /Connexion en cours/i })).toBeDisabled()

      // Assert successful login
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // Assert redirection (would be handled by router in real app)
      await waitFor(() => {
        expect(window.location.pathname).toBe('/tableau-de-bord') // This would happen in real implementation
      })
    })

    it('should handle login error', async () => {
      // Arrange
      const error = new Error('Invalid credentials')
      vi.mocked(authService.login).mockRejectedValue(error)

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Act - Fill and submit form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      })

      fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
        target: { value: 'wrong-password' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

      // Assert error handling
      await waitFor(() => {
        expect(screen.getByText(/Email ou mot de passe incorrect/i)).toBeInTheDocument()
      })

      // Assert button is re-enabled
      expect(screen.getByRole('button', { name: /Se connecter/i })).toBeEnabled()
    })

    it('should validate form inputs', async () => {
      // Arrange
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Act - Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

      // Assert validation errors
      await waitFor(() => {
        expect(screen.getByText(/L'email est requis/i)).toBeInTheDocument()
        expect(screen.getByText(/Le mot de passe est requis/i)).toBeInTheDocument()
      })

      // Act - Fill invalid email
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'invalid-email' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

      // Assert email validation error
      await waitFor(() => {
        expect(screen.getByText(/Email invalide/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      // Arrange
      vi.mocked(authService.login).mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Act - Fill and submit form
      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'test@example.com' },
      })

      fireEvent.change(screen.getByLabelText(/Mot de passe/i), {
        target: { value: 'password123' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

      // Assert network error handling
      await waitFor(() => {
        expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Persistence', () => {
    it('should restore session on page reload', async () => {
      // Arrange - Mock existing session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock localStorage to have token
      vi.mocked(window.localStorage.getItem).mockReturnValue('mock-token')

      // Act - Render app (simulating page reload)
      render(
        <TestWrapper>
          <div>Test App</div>
        </TestWrapper>
      )

      // Assert - Session should be restored
      await waitFor(() => {
        expect(supabase.auth.getSession).toHaveBeenCalled()
      })

      // In real implementation, user would be redirected to dashboard
    })

    it('should handle session expiration', async () => {
      // Arrange - Mock expired session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        // @ts-expect-error - Typage complexe de l'erreur Supabase
        error: {
          message: 'Session expired',
          code: 'session_expired',
          status: 400,
          __isAuthError: true,
          name: 'AuthError',
        },
      })

      // Act - Render app
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      )

      // Assert - Should show login page
      await waitFor(() => {
        expect(screen.getByText(/Connexion/i)).toBeInTheDocument()
      })
    })
  })

  describe('Logout Flow', () => {
    it('should complete successful logout flow', async () => {
      // Arrange - Start with authenticated user
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock dashboard component with logout button
      const MockDashboard = () => (
        <div>
          <h1>Tableau de bord</h1>
          <button onClick={() => authService.logout()}>Se déconnecter</button>
        </div>
      )

      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      )

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
      })

      // Act - Click logout
      fireEvent.click(screen.getByText('Se déconnecter'))

      // Assert logout call
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
      })

      // In real implementation, user would be redirected to login page
    })

    it('should handle logout error', async () => {
      // Arrange
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      vi.mocked(authService.logout).mockRejectedValue(new Error('Logout failed'))

      const MockDashboard = () => (
        <div>
          <h1>Tableau de bord</h1>
          <button onClick={() => authService.logout()}>Se déconnecter</button>
        </div>
      )

      render(
        <TestWrapper>
          <MockDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
      })

      // Act - Click logout
      fireEvent.click(screen.getByText('Se déconnecter'))

      // Assert error handling
      await waitFor(() => {
        expect(screen.getByText(/Erreur lors de la déconnexion/i)).toBeInTheDocument()
      })
    })
  })

  describe('OAuth Authentication', () => {
    it('should initiate Google OAuth flow', async () => {
      // Arrange
      vi.mocked(authService.loginWithOAuth).mockResolvedValue(undefined)

      const LoginPageWithOAuth = () => (
        <div>
          <h1>Connexion</h1>
          <button onClick={() => authService.loginWithOAuth('google')}>
            Continuer avec Google
          </button>
        </div>
      )

      render(
        <TestWrapper>
          <LoginPageWithOAuth />
        </TestWrapper>
      )

      // Act - Click Google OAuth button
      fireEvent.click(screen.getByText('Continuer avec Google'))

      // Assert OAuth initiation
      await waitFor(() => {
        expect(authService.loginWithOAuth).toHaveBeenCalledWith('google')
      })
    })

    it('should handle OAuth error', async () => {
      // Arrange
      vi.mocked(authService.loginWithOAuth).mockRejectedValue(new Error('OAuth failed'))

      const LoginPageWithOAuth = () => (
        <div>
          <h1>Connexion</h1>
          <button onClick={() => authService.loginWithOAuth('google')}>
            Continuer avec Google
          </button>
        </div>
      )

      render(
        <TestWrapper>
          <LoginPageWithOAuth />
        </TestWrapper>
      )

      // Act - Click Google OAuth button
      fireEvent.click(screen.getByText('Continuer avec Google'))

      // Assert error handling
      await waitFor(() => {
        expect(screen.getByText(/Erreur lors de la connexion avec Google/i)).toBeInTheDocument()
      })
    })
  })

  describe('Password Reset Flow', () => {
    it('should complete password reset flow', async () => {
      // Arrange
      vi.mocked(authService.forgotPassword).mockResolvedValue(undefined)

      // Create a state variable to track success
      const resetSuccess = false
      const resetError: string | null = null

      const ForgotPasswordPage = () => {
        const [success, setSuccess] = React.useState(false)
        const [error, setError] = React.useState<string | null>(null)

        const handleSubmit = async () => {
          const email = (screen.getByTestId('email-input') as HTMLInputElement).value
          try {
            await authService.forgotPassword(email)
            setSuccess(true)
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
          }
        }

        return (
          <div>
            <h1>Mot de passe oublié</h1>
            <input type='email' placeholder='Email' data-testid='email-input' />
            <button onClick={handleSubmit}>Envoyer les instructions</button>
            {success && <div data-testid='success-message'>Instructions envoyées</div>}
            {error && <div data-testid='error-message'>{error}</div>}
          </div>
        )
      }

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      )

      // Act - Fill email and submit
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' },
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Envoyer les instructions'))
      })

      // Assert password reset request
      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com')
      })

      // Assert success message
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('Instructions envoyées')
      })
    })

    it('should handle password reset error', async () => {
      // Arrange
      vi.mocked(authService.forgotPassword).mockRejectedValue(new Error('Email non trouvé'))

      // Create a state variable to track error
      const resetError: string | null = null

      const ForgotPasswordPage = () => {
        const [error, setError] = React.useState<string | null>(null)

        const handleSubmit = async () => {
          const email = (screen.getByTestId('email-input') as HTMLInputElement).value
          try {
            await authService.forgotPassword(email)
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
          }
        }

        return (
          <div>
            <h1>Mot de passe oublié</h1>
            <input type='email' placeholder='Email' data-testid='email-input' />
            <button onClick={handleSubmit}>Envoyer les instructions</button>
            {error && <div data-testid='error-message'>{error}</div>}
          </div>
        )
      }

      render(
        <TestWrapper>
          <ForgotPasswordPage />
        </TestWrapper>
      )

      // Act - Fill email and submit
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'nonexistent@example.com' },
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Envoyer les instructions'))
      })

      // Assert error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Email non trouvé')
      })
    })
  })

  describe('Cross-context Integration', () => {
    it('should sync auth state with user context', async () => {
      // Arrange - Mock authenticated user
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const TestComponent = () => {
        const auth = useAuth()
        const user = useUser()

        return (
          <div>
            <div data-testid='auth-state'>
              {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
            <div data-testid='user-profile'>{user.profile ? 'Profile Loaded' : 'No Profile'}</div>
          </div>
        )
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // Assert initial states
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated')
      expect(screen.getByTestId('user-profile')).toHaveTextContent('No Profile')

      // Assert after authentication
      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated')
      })

      // Assert user profile is loaded
      await waitFor(() => {
        expect(screen.getByTestId('user-profile')).toHaveTextContent('Profile Loaded')
      })
    })

    it('should handle auth state changes across components', async () => {
      // Arrange
      let onAuthStateChangeCallback: (event: string, session: unknown) => void

      // @ts-expect-error - Typage complexe de Supabase dans les tests
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
        (callback: (event: string, session: unknown) => void) => {
          onAuthStateChangeCallback = callback
          return {
            data: {
              subscription: { unsubscribe: vi.fn() },
            },
          }
        }
      )

      const AuthAwareComponent = () => {
        const auth = useAuth()

        return (
          <div>
            <div data-testid='auth-status'>
              {auth.isAuthenticated ? 'Connected' : 'Disconnected'}
            </div>
            <div data-testid='user-email'>{auth.user?.email || 'No user'}</div>
          </div>
        )
      }

      render(
        <TestWrapper>
          <AuthAwareComponent />
        </TestWrapper>
      )

      // Assert initial state
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Disconnected')
      })

      // Act - Simulate login
      act(() => {
        onAuthStateChangeCallback!('SIGNED_IN', mockSession)
      })

      // Assert state updated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connected')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')

      // Act - Simulate logout
      act(() => {
        onAuthStateChangeCallback!('SIGNED_OUT', null)
      })

      // Assert state updated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Disconnected')
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
    })
  })
})
