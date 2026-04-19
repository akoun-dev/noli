import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { User } from '@/types'
import { authService } from '@/data/api/authService'
import { supabase, supabaseHelpers } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { usePermissionCache, permissionCache } from '@/lib/permission-cache'
import { useQueryClient } from '@tanstack/react-query'
import { testDatabaseConnection } from '@/lib/helpers/supabaseHealthCheck'

export interface Permission {
  permission_name: string
  resource_type: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
  description?: string
  category?: string
}

export type ProfileError = {
  type: 'network' | 'database' | 'not_found' | 'permission' | 'unknown'
  message: string
  details?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: Permission[]
  profileError: ProfileError | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, securityContextData?: any) => Promise<{
    user: User;
    rateLimitInfo?: { allowed: boolean; remainingAttempts: number; lockoutTime?: number };
    captchaRequired?: boolean;
    securityAlerts?: any[];
  }>
  register: (userData: Partial<User> & { password: string }) => Promise<User>
  loginWithOAuth: (provider: 'google' | 'facebook' | 'github') => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<User>
  refreshToken: () => Promise<void>
  hasPermission: (permission: string, action?: 'read' | 'write' | 'delete') => boolean
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  clearProfileError: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const { getUserPermissions } = usePermissionCache()
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
    profileError: null,
  })

  const [initializedSession, setInitializedSession] = useState(false)

  // Fonction pour charger les permissions
  const loadPermissions = async (userId: string) => {
    try {
      const permissions = await getUserPermissions(
        userId,
        () => authService.getUserPermissions(userId)
      )
      logger.auth('Permissions loaded:', permissions.length)
      setState((prev) => ({ ...prev, permissions }))
    } catch (error) {
      logger.warn('Could not load permissions:', error)
    }
  }

  // Fonction pour charger le profil utilisateur
  const loadProfile = async (userId: string, retryCount = 0) => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000

    try {
      logger.debug('Loading user profile', { userId, attempt: retryCount + 1, maxRetries: MAX_RETRIES + 1 })

      // Direct profile load without health check for faster loading
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        logger.error('Error loading profile from Supabase', error as Error, { userId })

        if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
          logger.error('Schema cache error - profiles table not accessible', undefined, { userId })
          setProfileError({
            type: 'database',
            message: 'Connexion à la base de données impossible',
            details: "Could not find the table 'public.profiles' in the schema cache\n\nLa table des profils n'existe pas ou n'est pas accessible. Veuillez contacter le support.",
          })
          setState(prev => ({ ...prev, isLoading: false }))
          return
        }

        if (error.code === 'PGRST116') {
          logger.info('Profile not found, attempting recovery', { userId })
          const recovered = await attemptProfileRecovery(userId)
          if (recovered) {
            return loadProfile(userId, retryCount + 1)
          }

          setProfileError({
            type: 'not_found',
            message: 'Profil introuvable',
            details: "Votre profil n'a pas été créé correctement. Tentative de récupération échouée.",
          })
        } else if (error.message.includes('permission') || error.message.includes('denied')) {
          logger.warn('Permission error detected', { userId })

          if (retryCount < MAX_RETRIES) {
            logger.debug('Retrying after permission error', { attempt: retryCount + 1 })
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
            return loadProfile(userId, retryCount + 1)
          }

          setProfileError({
            type: 'permission',
            message: 'Connexion à la base de données impossible',
            details: 'permission denied for table profiles\n\nVérifiez votre connexion Internet et réessayez dans quelques instants.',
          })
        } else {
          setProfileError({
            type: 'database',
            message: 'Erreur de base de données',
            details: error.message,
          })
        }

        throw error
      }

      if (!data) {
        logger.warn('No profile found for user', { userId })

        if (retryCount === 0) {
          logger.info('Attempting profile recovery', { userId })
          const recovered = await attemptProfileRecovery(userId)
          if (recovered) {
            return loadProfile(userId, 1)
          }
        }

        if (retryCount < MAX_RETRIES) {
          logger.debug('Retrying profile load', { delay: RETRY_DELAY * (retryCount + 1) })
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
          return loadProfile(userId, retryCount + 1)
        }

        logger.error('Profile not found after all retries', undefined, { userId })
        setProfileError({
          type: 'not_found',
          message: 'Profil introuvable',
          details: 'Impossible de trouver votre profil après plusieurs tentatives. Veuillez contacter le support.',
        })
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      logger.info('Profile loaded successfully', { userId, email: data.email })

      const profileUser: User = {
        id: data.id,
        email: data.email || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        companyName: data.company_name || '',
        role: (data.role || 'USER') as 'USER' | 'INSURER' | 'ADMIN',
        phone: data.phone || '',
        avatar: data.avatar_url || '',
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
        address: data.address || '',
        dateOfBirth: data.date_of_birth || '',
        lastLogin: data.last_login ? new Date(data.last_login) : new Date(),
        emailVerified: data.email_verified ?? true,
        phoneVerified: data.phone_verified ?? !!data.phone,
      }

      // Update user state with profile data (allow updates even if user was not yet set)
      setState(prev => {
        const updatedUser = prev.user ? { ...prev.user, ...profileUser } : profileUser
        return {
          ...prev,
          user: updatedUser,
          isLoading: false,
          profileError: null,
        }
      })

      loadPermissions(userId)
    } catch (error: unknown) {
      logger.error('Error loading profile', error instanceof Error ? error : undefined, { userId })

      if (retryCount < MAX_RETRIES) {
        logger.debug('Retrying after error', { delay: RETRY_DELAY * (retryCount + 1) })
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
        return loadProfile(userId, retryCount + 1)
      }

      if (!state.profileError) {
        setProfileError({
          type: 'unknown',
          message: 'Erreur inconnue',
          details: error instanceof Error ? error.message : "Une erreur inattendue s'est produite.",
        })
      }
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Helper pour setProfileError
  const setProfileError = (error: ProfileError | null) => {
    setState(prev => ({ ...prev, profileError: error }))
  }

  // Fonction pour récupérer le profil depuis session
  const attemptProfileRecovery = async (userId: string): Promise<boolean> => {
    try {
      logger.info('Attempting to create profile for user', { userId })

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return false

      const role = userData.user.user_metadata?.role || 'USER'
      const firstName = userData.user.user_metadata?.first_name || ''
      const lastName = userData.user.user_metadata?.last_name || ''
      const phone = userData.user.phone || userData.user.user_metadata?.phone || ''

      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email: userData.user.email || null,
          first_name: firstName,
          last_name: lastName,
          company_name: userData.user.user_metadata?.company || '',
          role,
          phone,
          is_active: true,
        },
        { onConflict: 'id' }
      )

      if (error) {
        logger.error('Profile creation failed', error as Error, { userId })
        return false
      }

      logger.info('Profile created successfully', { userId })
      return true
    } catch (error) {
      logger.error('Profile recovery exception', error instanceof Error ? error : undefined, { userId })
      return false
    }
  }

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setState(prev => {
        if (prev.isLoading) {
          console.warn('Auth loading timeout - forcing loading to false')
          return { ...prev, isLoading: false }
        }
        return prev
      })
    }, 10000)

    let disposed = false

    const buildUserFromSession = (sessionUser: Session['user']): User => ({
      id: sessionUser.id,
      email: sessionUser.email || '',
      firstName: sessionUser.user_metadata?.first_name || '',
      lastName: sessionUser.user_metadata?.last_name || '',
      companyName: sessionUser.user_metadata?.company || '',
      role: (sessionUser.user_metadata?.role || 'USER') as 'USER' | 'INSURER' | 'ADMIN',
      phone: sessionUser.phone || '',
      avatar: sessionUser.user_metadata?.avatar_url || '',
      createdAt: new Date(sessionUser.created_at),
      updatedAt: new Date(),
    })

    const handleSessionChange = async (session: Session | null, source: 'initial' | 'event') => {
      if (disposed) {
        return
      }

      // Pour les initialisations initiales, ne traiter qu'une fois
      if (source === 'initial') {
        if (initializedSession) {
          return
        }
        setInitializedSession(true)
      }

      if (!session?.user) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
          profileError: null,
        })
        return
      }

      const user = buildUserFromSession(session.user)

      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: true,
        profileError: null,
      }))

      await loadProfile(session.user.id)
    }

    const initializeSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.warn('Initial session fetch warning:', error)
        }

        await handleSessionChange(session, 'initial')
      } catch (error) {
        logger.error('Error fetching initial session', error)
        setState(prev => ({ ...prev, isLoading: false }))
        setInitializedSession(true)
      }
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session?.user)) {
        await handleSessionChange(session, 'event')
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
          profileError: null,
        })
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        loadPermissions(session.user.id)
      } else if (event === 'INITIAL_SESSION' && !session) {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          profileError: null,
        }))
      }
    })

    return () => {
      disposed = true
      setInitializedSession(false) // Réinitialiser pour les prochains montages
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const login = async (email: string, password: string, securityContextData?: any) => {
    logger.auth('🔐 AuthContext.login appelé avec:', email)
    setState(prev => ({ ...prev, isLoading: true, profileError: null }))

    try {
      const response = await authService.login({ email, password })
      logger.auth('✅ authService.login réussi:', response.user)

      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      }))

      // Charger les permissions en arrière-plan
      loadPermissions(response.user.id)

      return {
        user: response.user,
        rateLimitInfo: response.rateLimitInfo,
        captchaRequired: response.captchaRequired,
        securityAlerts: response.securityAlerts
      }
    } catch (error) {
      logger.error('❌ Erreur dans AuthContext.login:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const register = async (userData: Partial<User> & { password: string; role?: 'USER' | 'INSURER' | 'ADMIN' }) => {
    setState(prev => ({ ...prev, isLoading: true, profileError: null }))
    try {
      const registerData = {
        email: userData.email!,
        password: userData.password,
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        phone: userData.phone,
        role: userData.role,
      }

      const response = await authService.register(registerData)
      const permissions = await getUserPermissions(
        response.user.id,
        () => authService.getUserPermissions(response.user.id)
      )

      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      }))

      return response.user
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const loginWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
    try {
      await authService.loginWithOAuth(provider)
    } catch (error) {
      logger.error('OAuth login error:', error)
      throw error
    }
  }

  const logout = async () => {
    const userId = state.user?.id

    // Invalidate permission cache first
    if (userId) {
      permissionCache.invalidateUser(userId)
    }

    // Clear all permission cache
    permissionCache.invalidateAll()

    // Clear localStorage FIRST before Supabase signOut
    // This prevents any refresh attempts during logout
    try {
      // Clear all Supabase-related keys from localStorage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.startsWith('supabase.') || key.startsWith('auth'))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          // Ignore errors
        }
      })

      // Also clear sessionStorage
      sessionStorage.clear()
    } catch (e) {
      logger.warn('Error clearing storage during logout:', e)
    }

    // Reset state immediately
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      profileError: null,
    })

    // Clear React Query cache
    queryClient.clear()

    // Sign out from Supabase (after local cleanup)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      logger.warn('Supabase signOut error (non-critical):', error)
    }

    // Navigate to login
    navigate('/auth/connexion', { replace: true })
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData)

      setState(prev => ({
        ...prev,
        user: updatedUser,
      }))

      return updatedUser
    } catch (error) {
      logger.error('Update user error:', error)
      throw error
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      const permissions = await getUserPermissions(
        response.user.id,
        () => authService.getUserPermissions(response.user.id)
      )

      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      }))
    } catch (error) {
      logger.error('Refresh token error:', error)
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      }))
      throw error
    }
  }

  const hasPermission = (permission: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    const perm = state.permissions.find(p => p.permission_name === permission)

    if (!perm) {
      return false
    }

    switch (action) {
      case 'read':
        return perm.can_read
      case 'write':
        return perm.can_write
      case 'delete':
        return perm.can_delete
      default:
        return false
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email)
    } catch (error) {
      logger.error('Forgot password error:', error)
      throw error
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authService.resetPassword(token, newPassword)
    } catch (error) {
      logger.error('Reset password error:', error)
      throw error
    }
  }

  const clearProfileError = () => {
    setProfileError(null)
  }

  const refreshProfile = async () => {
    if (state.user) {
      setState(prev => ({ ...prev, isLoading: true, profileError: null }))
      await loadProfile(state.user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginWithOAuth,
        logout,
        updateUser,
        refreshToken,
        hasPermission,
        forgotPassword,
        resetPassword,
        clearProfileError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
