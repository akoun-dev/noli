import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Session } from '@supabase/supabase-js'
import { User } from '@/types'
import { authService } from '@/data/api/authService'
import { supabase, supabaseHelpers } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { usePermissionCache, permissionCache } from '@/lib/permission-cache'
import { useQueryClient } from '@tanstack/react-query'

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

// États distincts pour le state machine
type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: Permission[]
  profileError: ProfileError | null
  authStatus: AuthStatus
}

interface AuthContextType extends Omit<AuthState, 'authStatus'> {
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

  // Utiliser useRef pour éviter les dépendances cycliques dans useEffect
  const stateRef = useRef<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
    profileError: null,
    authStatus: 'initializing',
  })

  const [, forceUpdate] = useState({})
  const setState = (newState: Partial<AuthState>) => {
    stateRef.current = { ...stateRef.current, ...newState }
    forceUpdate({})
  }

  // IMPORTANT: Lire directement depuis stateRef.current pour avoir toujours les valeurs à jour
  // Le useState initial n'est qu'un placeholder
  const [state] = useState<AuthState>(stateRef.current)
  const getState = () => stateRef.current

  // Références pour éviter les race conditions
  const initializationInProgress = useRef(false)
  const currentSessionId = useRef<string | null>(null)
  const profileLoadPromise = useRef<Map<string, Promise<User | null>>>(new Map())

  // ============================================
  // HELPER: Exponential backoff pour les retries
  // ============================================
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // ============================================
  // LOAD PERMISSIONS: Avec timeout et fallback
  // ============================================
  const loadPermissions = useCallback(async (userId: string): Promise<Permission[]> => {
    try {
      // Timeout de 5 secondes pour les permissions
      const timeoutPromise = new Promise<Permission[]>((_, reject) =>
        setTimeout(() => reject(new Error('Permissions timeout')), 5000)
      )

      const permissions = await Promise.race([
        getUserPermissions(userId, () => authService.getUserPermissions(userId)),
        timeoutPromise
      ]) as Permission[]

      logger.auth('Permissions loaded:', permissions.length)
      return permissions
    } catch (error) {
      logger.warn('Could not load permissions, using fallback:', error)
      // Utiliser les permissions basées sur le rôle depuis le state
      const userRole = stateRef.current.user?.role || 'USER'
      return getFallbackPermissions(userRole)
    }
  }, [])

  // Permissions de secours basées sur le rôle
  const getFallbackPermissions = (role: string): Permission[] => {
    switch (role) {
      case 'ADMIN':
        return [
          { permission_name: 'admin_access', resource_type: 'all', can_read: true, can_write: true, can_delete: true },
          { permission_name: 'user_management', resource_type: 'users', can_read: true, can_write: true, can_delete: true },
        ]
      case 'INSURER':
        return [
          { permission_name: 'insurer_access', resource_type: 'all', can_read: true, can_write: true, can_delete: false },
          { permission_name: 'offer_management', resource_type: 'offers', can_read: true, can_write: true, can_delete: true },
        ]
      default:
        return [
          { permission_name: 'user_access', resource_type: 'all', can_read: true, can_write: false, can_delete: false },
        ]
    }
  }

  // ============================================
  // LOAD PROFILE: Avec retry et cache
  // ============================================
  const loadProfile = useCallback(async (userId: string, sessionUser: Session['user']): Promise<User | null> => {
    const MAX_RETRIES = 2
    const BASE_DELAY = 500

    // Vérifier si on a déjà une promise en cours pour cet utilisateur
    const existingPromise = profileLoadPromise.current.get(userId)
    if (existingPromise) {
      logger.debug('Profile load already in progress, returning existing promise')
      return existingPromise
    }

    const profilePromise = (async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          logger.debug('Loading user profile', { userId, attempt: attempt + 1, maxRetries: MAX_RETRIES + 1 })

          // IMPORTANT: S'assurer que la session est active avant de requêter la DB
          // Cela garantit que le JWT est disponible pour les requêtes RLS
          const { data: sessionData } = await supabase.auth.getSession()
          if (!sessionData.session) {
            logger.warn('No active session, using session metadata')
            return buildUserFromSession(sessionUser)
          }

          const { data, error } = await supabase
            .from('profiles')
            .select(`
              *,
              insurer_accounts (
                insurer_id,
                insurers (
                  logo_url
                )
              )
            `)
            .eq('id', userId)
            .maybeSingle()

          if (error) {
            // Gérer les erreurs spécifiques
            if (error.code === 'PGRST116' && attempt === 0) {
              logger.info('Profile not found, attempting recovery', { userId })
              const recovered = await attemptProfileRecovery(userId)
              if (recovered) {
                // Réessayer après récupération
                continue
              }
            }

            // Pour les erreurs de permission ou réseau, réessayer avec backoff
            if (attempt < MAX_RETRIES && (
              error.message.includes('permission') ||
              error.message.includes('denied') ||
              error.message.includes('network') ||
              error.message.includes('fetch')
            )) {
              const delay = BASE_DELAY * Math.pow(2, attempt)
              logger.debug(`Retrying after error, delay: ${delay}ms`, { attempt: attempt + 1 })
              await sleep(delay)
              continue
            }

            // Erreur fatale, utiliser le profil depuis la session
            logger.warn('Profile load failed, using session metadata', { userId, error: error.message })
            return buildUserFromSession(sessionUser)
          }

          if (!data) {
            // Pas de données, essayer de récupérer ou utiliser les métadonnées
            if (attempt === 0) {
              await attemptProfileRecovery(userId)
              continue
            }
            logger.warn('No profile found, using session metadata')
            return buildUserFromSession(sessionUser)
          }

          logger.info('Profile loaded successfully', { userId, email: data.email })

          // Pour les assureurs, utiliser le logo depuis la table insurers
          let insurerLogo = null
          if (Array.isArray(data.insurer_accounts) && data.insurer_accounts.length > 0) {
            const insurerData = data.insurer_accounts[0]?.insurers
            if (insurerData) {
              // Si logo_url existe, l'utiliser, sinon générer l'URL par défaut
              insurerLogo = insurerData.logo_url
              if (!insurerLogo && data.insurer_accounts[0]?.insurer_id) {
                const insurerId = data.insurer_accounts[0].insurer_id
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                insurerLogo = `${supabaseUrl}/storage/v1/object/public/insurer-logos/${insurerId}.png`
              }
            }
          }

          const avatarUrl = data.role === 'INSURER'
            ? (insurerLogo || data.avatar_url || '')
            : (data.avatar_url || '')

          return {
            id: data.id,
            email: data.email || sessionUser.email || '',
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            companyName: data.company_name || '',
            role: (data.role || sessionUser.user_metadata?.role || 'USER') as 'USER' | 'INSURER' | 'ADMIN',
            phone: data.phone || '',
            avatar: avatarUrl,
            createdAt: data.created_at ? new Date(data.created_at) : new Date(sessionUser.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
            address: data.address || '',
            dateOfBirth: data.date_of_birth || '',
            lastLogin: data.last_login ? new Date(data.last_login) : new Date(),
            emailVerified: data.email_verified ?? !!sessionUser.email_confirmed_at,
            phoneVerified: data.phone_verified ?? !!data.phone,
          }
        } catch (error) {
          logger.error('Error loading profile', error instanceof Error ? error : undefined, { userId, attempt })

          if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, attempt)
            await sleep(delay)
          } else {
            // Dernier essai échoué, utiliser les métadonnées de session
            logger.warn('All retries failed, using session metadata')
            return buildUserFromSession(sessionUser)
          }
        }
      }

      return buildUserFromSession(sessionUser)
    })()

    profileLoadPromise.current.set(userId, profilePromise)

    try {
      const result = await profilePromise
      profileLoadPromise.current.delete(userId)
      return result
    } catch (error) {
      profileLoadPromise.current.delete(userId)
      return buildUserFromSession(sessionUser)
    }
  }, [supabase])

  // Construire un user depuis les métadonnées de session (fallback)
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
    address: '',
    dateOfBirth: '',
    lastLogin: new Date(),
    emailVerified: !!sessionUser.email_confirmed_at,
    phoneVerified: !!sessionUser.phone,
  })

  // Récupération du profil depuis les métadonnées session
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

  // ============================================
  // INITIALISATION: Un seul chemin, sans race condition
  // ============================================
  useEffect(() => {
    let isMounted = true

    // Timeout de sécurité: forcer isLoading à false après 8 secondes
    const safetyTimeout = setTimeout(() => {
      if (isMounted && stateRef.current.isLoading && stateRef.current.authStatus === 'initializing') {
        logger.warn('Auth initialization timeout - forcing completion')
        setState({
          isLoading: false,
          authStatus: stateRef.current.isAuthenticated ? 'authenticated' : 'error',
          profileError: {
            type: 'unknown',
            message: "Délai d'initialisation dépassé",
            details: "L'initialisation a pris trop de temps. Certaines fonctionnalités peuvent être limitées.",
          }
        })
      }
    }, 8000)

    // Fonction principale d'initialisation
    const initializeAuth = async () => {
      // Éviter les initialisations multiples
      if (initializationInProgress.current) {
        logger.debug('Auth initialization already in progress')
        return
      }

      initializationInProgress.current = true

      try {
        logger.debug('Starting auth initialization')

        // 1. Récupérer la session depuis Supabase
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          logger.warn('Initial session fetch warning:', error)
        }

        if (!session?.user) {
          // Pas de session = utilisateur non connecté
          if (isMounted) {
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              permissions: [],
              profileError: null,
              authStatus: 'unauthenticated',
            })
          }
          return
        }

        // 2. Créer l'utilisateur basique depuis la session
        const sessionId = session.user.id
        currentSessionId.current = sessionId

        // 3. Charger le profil complet avec retry
        const profileUser = await loadProfile(sessionId, session.user)

        // 4. Charger les permissions (sans bloquer)
        loadPermissions(sessionId)
          .then(permissions => {
            if (isMounted) {
              setState({ permissions })
            }
          })
          .catch(err => {
            logger.warn('Failed to load permissions:', err)
          })

        // 5. Finaliser l'état
        if (isMounted && currentSessionId.current === sessionId) {
          setState({
            user: profileUser,
            isAuthenticated: true,
            isLoading: false,
            profileError: null,
            authStatus: 'authenticated',
          })

          logger.info('Auth initialized successfully', {
            userId: sessionId,
            role: profileUser.role,
            email: profileUser.email
          })
        }
      } catch (error) {
        logger.error('Error during auth initialization:', error)
        if (isMounted) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],
            profileError: {
              type: 'unknown',
              message: "Erreur d'initialisation",
              details: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
            },
            authStatus: 'error',
          })
        }
      } finally {
        initializationInProgress.current = false
      }
    }

    // Lancer l'initialisation
    initializeAuth()

    // 6. S'abonner aux changements d'auth (pour SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state event:', event, session?.user?.id)

      if (!isMounted) return

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            const userId = session.user.id
            currentSessionId.current = userId

            setState({ isLoading: true, authStatus: 'initializing' })

            const profileUser = await loadProfile(userId, session.user)
            const permissions = await loadPermissions(userId)

            setState({
              user: profileUser,
              isAuthenticated: true,
              isLoading: false,
              permissions,
              profileError: null,
              authStatus: 'authenticated',
            })
          }
          break

        case 'SIGNED_OUT':
          // Nettoyer le cache
          if (stateRef.current.user?.id) {
            permissionCache.invalidateUser(stateRef.current.user.id)
          }
          profileLoadPromise.current.clear()
          currentSessionId.current = null

          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],
            profileError: null,
            authStatus: 'unauthenticated',
          })
          break

        case 'TOKEN_REFRESHED':
          if (session?.user && stateRef.current.isAuthenticated) {
            // Mettre à jour les permissions en arrière-plan
            loadPermissions(session.user.id).then(permissions => {
              if (isMounted) {
                setState({ permissions })
              }
            })
          }
          break

        case 'USER_UPDATED':
          if (session?.user && stateRef.current.isAuthenticated) {
            // Mettre à jour les métadonnées utilisateur
            setState({
              user: stateRef.current.user ? {
                ...stateRef.current.user,
                firstName: session.user.user_metadata?.first_name || stateRef.current.user.firstName,
                lastName: session.user.user_metadata?.last_name || stateRef.current.user.lastName,
                avatar: session.user.user_metadata?.avatar_url || stateRef.current.user.avatar,
              } : null
            })
          }
          break
      }
    })

    // Cleanup
    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [loadProfile, loadPermissions])

  // ============================================
  // LOGIN: Simplifié avec état garanti
  // ============================================
  const login = async (email: string, password: string, securityContextData?: any) => {
    logger.auth('🔐 AuthContext.login appelé avec:', email)
    setState({ isLoading: true, authStatus: 'initializing', profileError: null })

    try {
      const response = await authService.login({ email, password })
      logger.auth('✅ authService.login réussi:', response.user)

      // Charger les permissions en arrière-plan (ne pas bloquer)
      loadPermissions(response.user.id).then(permissions => {
        setState({ permissions })
      })

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        authStatus: 'authenticated',
      })

      return {
        user: response.user,
        rateLimitInfo: response.rateLimitInfo,
        captchaRequired: response.captchaRequired,
        securityAlerts: response.securityAlerts
      }
    } catch (error) {
      logger.error('❌ Erreur dans AuthContext.login:', error)
      setState({
        isLoading: false,
        authStatus: 'error',
        profileError: {
          type: 'unknown',
          message: 'Erreur de connexion',
          details: error instanceof Error ? error.message : 'Identifiants invalides',
        }
      })
      throw error
    }
  }

  const register = async (userData: Partial<User> & { password: string; role?: 'USER' | 'INSURER' | 'ADMIN' }) => {
    setState({ isLoading: true, authStatus: 'initializing', profileError: null })
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

      // Charger les permissions en arrière-plan
      loadPermissions(response.user.id).then(permissions => {
        setState({ permissions })
      })

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        authStatus: 'authenticated',
      })

      return response.user
    } catch (error) {
      setState({
        isLoading: false,
        authStatus: 'error',
        profileError: {
          type: 'unknown',
          message: "Erreur d'inscription",
          details: error instanceof Error ? error.message : "Impossible de créer le compte",
        }
      })
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

  // ============================================
  // LOGOUT: Nettoyage complet et garanti
  // ============================================
  const logout = async () => {
    const userId = stateRef.current.user?.id

    logger.auth('🚪 AuthContext.logout appelé')

    // 1. Invalider les caches
    if (userId) {
      permissionCache.invalidateUser(userId)
    }
    permissionCache.invalidateAll()
    profileLoadPromise.current.clear()
    currentSessionId.current = null

    // 2. Réinitialiser l'état immédiatement
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      profileError: null,
      authStatus: 'unauthenticated',
    })

    // 3. Nettoyer localStorage/sessionStorage
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.startsWith('supabase.') || key.startsWith('auth'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => {
        try { localStorage.removeItem(key) } catch { /* ignore */ }
      })
      sessionStorage.clear()
    } catch (e) {
      logger.warn('Error clearing storage during logout:', e)
    }

    // 4. Vider le cache React Query
    try {
      queryClient.clear()
    } catch (e) {
      logger.warn('Error clearing React Query cache:', e)
    }

    // 5. Sign out from Supabase (non-bloquant)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      logger.warn('Supabase signOut error (non-critical):', error)
    }

    // 6. Naviguer vers login
    navigate('/auth/connexion', { replace: true })
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData)

      setState({ user: updatedUser })
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

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
        authStatus: 'authenticated',
      })
    } catch (error) {
      logger.error('Refresh token error:', error)
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
        authStatus: 'unauthenticated',
      })
      throw error
    }
  }

  const hasPermission = (permission: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    const perm = stateRef.current.permissions.find(p => p.permission_name === permission)

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
    setState({ profileError: null })
  }

  const refreshProfile = async () => {
    if (stateRef.current.user) {
      setState({ isLoading: true, profileError: null })

      try {
        const { data: { user: sessionUser } } = await supabase.auth.getUser()
        if (sessionUser) {
          const profileUser = await loadProfile(sessionUser.id, sessionUser)
          const permissions = await loadPermissions(sessionUser.id)

          setState({
            user: profileUser,
            permissions,
            isLoading: false,
            profileError: null,
          })
        }
      } catch (error) {
        logger.error('Error refreshing profile:', error)
        setState({
          isLoading: false,
          profileError: {
            type: 'unknown',
            message: 'Erreur lors du rafraîchissement du profil',
            details: error instanceof Error ? error.message : undefined,
          }
        })
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...getState(),
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
