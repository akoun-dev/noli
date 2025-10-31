import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@/types'
import { authService } from '@/data/api/authService'
import { supabase, supabaseHelpers } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { secureAuthService } from '@/lib/secure-auth'
import { usePermissionCache } from '@/lib/permission-cache'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>
  register: (userData: Partial<User> & { password: string }) => Promise<User>
  loginWithOAuth: (provider: 'google' | 'facebook' | 'github') => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<User>
  refreshToken: () => Promise<void>
  hasPermission: (permission: string) => boolean
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const { getUserPermissions } = usePermissionCache()
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
  })

  useEffect(() => {
    // Initialiser l'authentification sécurisée avec Supabase
    const initializeAuth = async () => {
      try {
        logger.auth('Initializing secure auth...')

        // Initialiser l'authentification sécurisée
        secureAuthService.initializeSecureAuth()

        // Nettoyer les anciens tokens localStorage et migrer vers les cookies
        await secureAuthService.migrateToSecureStorage()

        // Vérifier la session actuelle avec retry
        let session = null
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries && !session) {
          try {
            const {
              data: { session: currentSession },
              error,
            } = await supabase.auth.getSession()

            if (currentSession) {
              session = currentSession
              break
            }

            if (error) {
              logger.warn(`Session check attempt ${retryCount + 1} failed:`, error)
            }

            // Attendre avant de réessayer
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)))
            }
            retryCount++
          } catch (retryError) {
            logger.warn(`Session check attempt ${retryCount + 1} error:`, retryError)
            retryCount++
          }
        }

        logger.auth('Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          retryCount,
        })

        if (session?.user) {
          // Priorité 1: Essayer de récupérer le profil complet depuis la base de données
          let user: User | null = null

          try {
            const profile = await supabaseHelpers.getProfile(session.user.id)
            if (profile) {
              user = {
                id: profile.id,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                companyName: profile.company_name,
                role: profile.role,
                phone: profile.phone,
                avatar: profile.avatar_url,
                createdAt: new Date(profile.created_at),
                updatedAt: new Date(profile.updated_at),
              }
              logger.auth('User profile loaded from database:', profile.role)
            }
          } catch (profileError) {
            logger.warn('Could not load profile from database, using session data:', profileError)
          }

          // Priorité 2: Utiliser les données de la session si le profil n'est pas disponible
          if (!user) {
            user = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name || '',
              lastName: session.user.user_metadata?.last_name || '',
              companyName: session.user.user_metadata?.company || '',
              role: session.user.user_metadata?.role || 'USER',
              phone: session.user.phone || '',
              avatar: session.user.user_metadata?.avatar_url || '',
              createdAt: new Date(session.user.created_at),
              updatedAt: new Date(),
            }
            logger.auth('User created from session metadata, role:', user.role)
          }

          logger.auth('Setting authenticated state for:', user.email)
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions: [], // Sera chargé en arrière-plan
          })

          // Sauvegarder dans le localStorage pour la persistance
          try {
            localStorage.setItem('noli_user', JSON.stringify({
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              timestamp: Date.now()
            }))
          } catch (storageError) {
            logger.warn('Could not save user to localStorage:', storageError)
          }

          // Essayer de charger les permissions en arrière-plan avec cache
          try {
            const permissions = await getUserPermissions(
              user.id,
              () => authService.getUserPermissions(user.id)
            )
            logger.auth('Permissions loaded:', permissions.length)
            setState((prev) => ({ ...prev, permissions }))

            // Sauvegarder les permissions pour la persistance
            try {
              localStorage.setItem('noli_permissions', JSON.stringify({
                permissions,
                timestamp: Date.now()
              }))
            } catch (storageError) {
              logger.warn('Could not save permissions to localStorage:', storageError)
            }
          } catch (error) {
            logger.warn('Could not load permissions on init:', error)
          }
        } else {
          // Essayer de restaurer depuis le cache si disponible
          try {
            const cachedUser = localStorage.getItem('noli_user')
            const cachedPermissions = localStorage.getItem('noli_permissions')

            if (cachedUser) {
              const userData = JSON.parse(cachedUser)
              const now = Date.now()
              const cacheAge = now - userData.timestamp

              // Le cache est valide pendant 5 minutes
              if (cacheAge < 5 * 60 * 1000) {
                const user: User = {
                  id: userData.id,
                  email: userData.email,
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  companyName: '',
                  role: userData.role,
                  phone: '',
                  avatar: '',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }

                let permissions: string[] = []
                if (cachedPermissions) {
                  const permData = JSON.parse(cachedPermissions)
                  if (now - permData.timestamp < 5 * 60 * 1000) {
                    permissions = permData.permissions
                  }
                }

                logger.auth('Restoring user from cache:', user.email)
                setState({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  permissions,
                })

                // Continuer en arrière-plan pour vérifier la session réelle
                setTimeout(() => {
                  if (!session) {
                    logger.auth('Cache expired, clearing state')
                    setState({
                      user: null,
                      isAuthenticated: false,
                      isLoading: false,
                      permissions: [],
                    })
                    localStorage.removeItem('noli_user')
                    localStorage.removeItem('noli_permissions')
                  }
                }, 1000)

                return
              }
            }
          } catch (cacheError) {
            logger.warn('Error reading from cache:', cacheError)
          }

          logger.auth('No session or valid cache found, setting unauthenticated state')
          setState((prev) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: []
          }))

          // Nettoyer le cache
          localStorage.removeItem('noli_user')
          localStorage.removeItem('noli_permissions')
        }
      } catch (error) {
        logger.error('Auth initialization error:', error)
        setState((prev) => ({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: []
        }))
      }
    }

    initializeAuth()

    // Écouter les changements de session Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.auth('Auth state changed:', {
        event,
        userId: session?.user?.id,
        hasSession: !!session,
        userEmail: session?.user?.email,
      })

      if (event === 'SIGNED_IN' && session?.user) {
        logger.auth('Processing SIGNED_IN event for:', session.user.email)

        // Utiliser directement les données de la session pour éviter les problèmes RPC
        // lors de l'actualisation de page
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          companyName: session.user.user_metadata?.company || '',
          role: session.user.user_metadata?.role || 'USER',
          phone: session.user.phone || '',
          avatar: session.user.user_metadata?.avatar_url || '',
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(),
        }

        logger.auth('Setting state from session data (no RPC calls)')
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          permissions: [], // Sera chargé en arrière-plan
        })

        // Sauvegarder dans le cache
        try {
          localStorage.setItem('noli_user', JSON.stringify({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            timestamp: Date.now()
          }))
        } catch (storageError) {
          logger.warn('Could not save user to localStorage on sign in:', storageError)
        }

        // Charger les permissions en arrière-plan sans bloquer avec cache
        try {
          logger.auth('Loading permissions in background...')
          const permissions = await getUserPermissions(
            user.id,
            () => authService.getUserPermissions(user.id)
          )
          logger.auth('Background permissions loaded:', permissions.length)
          setState((prev) => ({ ...prev, permissions }))

          // Sauvegarder les permissions
          try {
            localStorage.setItem('noli_permissions', JSON.stringify({
              permissions,
              timestamp: Date.now()
            }))
          } catch (storageError) {
            logger.warn('Could not save permissions to localStorage:', storageError)
          }
        } catch (error) {
          logger.warn('Could not load permissions in background:', error)
        }
      } else if (event === 'SIGNED_OUT') {
        logger.auth('Processing SIGNED_OUT event')
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
        })

        // Nettoyer le cache
        localStorage.removeItem('noli_user')
        localStorage.removeItem('noli_permissions')
      } else if (event === 'TOKEN_REFRESHED') {
        // Rafraîchir les permissions après le refresh du token
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const permissions = await authService.getUserPermissions(user.id)
            setState((prev) => ({ ...prev, permissions }))

            // Mettre à jour le cache
            try {
              localStorage.setItem('noli_permissions', JSON.stringify({
                permissions,
                timestamp: Date.now()
              }))
            } catch (storageError) {
              logger.warn('Could not update permissions in localStorage:', storageError)
            }
          }
        } catch (error) {
          logger.error('Error refreshing permissions:', error)
        }
      }
    })

    // Cleanup
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    logger.auth('🔐 AuthContext.login appelé avec:', email)
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      logger.auth('📞 Appel de authService.login...')
      const response = await authService.login({ email, password })
      logger.auth('✅ authService.login réussi:', response.user)

      logger.auth('📞 Chargement des permissions avec cache...')
      const permissions = await getUserPermissions(
        response.user.id,
        () => authService.getUserPermissions(response.user.id)
      )
      logger.auth('✅ Permissions chargées:', permissions)

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      })

      logger.auth("🎉 État mis à jour, retour de l'utilisateur:", response.user)
      return response.user
    } catch (error) {
      logger.error('❌ Erreur dans AuthContext.login:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const register = async (userData: Partial<User> & { password: string }) => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      const registerData = {
        email: userData.email!,
        password: userData.password,
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        phone: userData.phone,
      }

      const response = await authService.register(registerData)
      const permissions = await getUserPermissions(
        response.user.id,
        () => authService.getUserPermissions(response.user.id)
      )

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      })

      return response.user
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const loginWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
    try {
      await authService.loginWithOAuth(provider)
      // Le redirigement et la mise à jour de l'état seront gérés par le callback OAuth
    } catch (error) {
      logger.error('OAuth login error:', error)
      throw error
    }
  }

  const logout = async () => {
    logger.auth('🚪 AuthContext.logout appelé')

    // Forcer le chargement immédiatement pour indiquer la déconnexion
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      logger.auth('📞 Appel de authService.logout...')
      await authService.logout()
      logger.auth('✅ authService.logout réussi')
    } catch (error) {
      logger.error('❌ Erreur dans AuthContext.logout:', error)
      // Continuer quand même avec le nettoyage local même si la déconnexion distante échoue
    }

    // Nettoyer l'état local IMMÉDIATEMENT
    logger.auth("🔄 Nettoyage complet de l'état utilisateur...")
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Important: mettre isLoading à false après le nettoyage
      permissions: [],
    })

    // Nettoyage complet du stockage local et session
    try {
      // Supabase storage keys
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
      localStorage.removeItem('supabase.auth.code.verifier')
      localStorage.removeItem('supabase.auth.pkce_code_verifier')
      localStorage.removeItem('supabase.auth.expires_at')
      localStorage.removeItem('supabase.auth.provider_token')
      localStorage.removeItem('supabase.auth.provider_refresh_token')

      // Application-specific keys
      localStorage.removeItem('noli_user')
      localStorage.removeItem('noli_permissions')
      localStorage.removeItem('noli_last_activity')

      // Nettoyage complet du sessionStorage
      sessionStorage.clear()

      logger.auth('✅ Nettoyage stockage local terminé')
    } catch (storageError) {
      logger.warn('Storage cleanup error:', storageError)
    }

    // Forcer la déconnexion Supabase avec timeout plus court
    try {
      const { supabase } = await import('@/lib/supabase')
      const signOutPromise = supabase.auth.signOut({ scope: 'global' })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout after 2 seconds')), 2000)
      )
      await Promise.race([signOutPromise, timeoutPromise])
      logger.auth('✅ Déconnexion Supabase terminée')
    } catch (refreshError) {
      logger.warn('Supabase signOut error during logout (expected):', refreshError)
    }

    // Forcer la mise à jour du state une dernière fois pour s'assurer qu'il est bien nettoyé
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
    })

    logger.auth('✅ État de déconnexion finalisé')

    // Forcer une redirection complète vers la page d'accueil avec refresh
    logger.auth('🌐 Redirection vers /...')
    navigate('/', { replace: true })

    // Forcer un rechargement de la page pour s'assurer que tous les états sont réinitialisés
    setTimeout(() => {
      window.location.href = '/'
    }, 100)
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData)

      setState((prev) => ({
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

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      })
    } catch (error) {
      logger.error('Refresh token error:', error)
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      })
      throw error
    }
  }

  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission)
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook exporté séparément pour éviter le warning react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
