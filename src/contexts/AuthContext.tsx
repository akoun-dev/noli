import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@/types'
import { authService } from '@/data/api/authService'
import { supabase, supabaseHelpers } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { secureAuthService } from '@/lib/secure-auth'
import { usePermissionCache } from '@/lib/permission-cache'
import { useQueryClient } from '@tanstack/react-query'
import { securityUtils } from '@/lib/security-utils'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
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
  hasPermission: (permission: string) => boolean
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
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
  })

  useEffect(() => {
    // Timeout de sécurité pour éviter le loading infini
    const loadingTimeout = setTimeout(() => {
      setState((prev) => {
        if (prev.isLoading) {
          logger.warn('Forcing isLoading to false after timeout')
          return {
            ...prev,
            isLoading: false
          }
        }
        return prev
      })
    }, 5000) // 5 secondes max

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
          // Priorité 1: Lire le cache local pour préserver le rôle admin lors du refresh
        let cachedRole: string | undefined
        let cachedUserData: any = null
        try {
          const cachedUserRaw = localStorage.getItem('noli_user')
          if (cachedUserRaw) {
            cachedUserData = JSON.parse(cachedUserRaw)
            if (cachedUserData?.id === session.user.id && typeof cachedUserData?.role === 'string') {
              cachedRole = cachedUserData.role
              logger.auth('Found cached role for user:', cachedRole)
            }
          }
        } catch (_) {
          // Ignorer les erreurs de lecture du cache
        }

        // Priorité 2: Construire l'utilisateur directement depuis les métadonnées de session
        // Éviter les appels RPC qui peuvent échouer et causer la perte de rôle
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || cachedUserData?.firstName || '',
          lastName: session.user.user_metadata?.last_name || cachedUserData?.lastName || '',
          companyName: session.user.user_metadata?.company || cachedUserData?.companyName || '',
          // Important: préserver le rôle du cache pour éviter la régression vers USER
          role: session.user.user_metadata?.role || cachedRole || cachedUserData?.role || 'USER',
          phone: session.user.phone || cachedUserData?.phone || '',
          avatar: session.user.user_metadata?.avatar_url || cachedUserData?.avatar || '',
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(),
        }

        logger.auth('User created from session, role preserved:', user.role)

          logger.auth('Setting authenticated state for:', user.email)
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions: [], // Sera chargé en arrière-plan
          })

          // Sauvegarder dans le localStorage pour la persistance (priorité haute pour le rôle)
          try {
            const cacheData = {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role, // Critique: préserver le rôle exact
              companyName: user.companyName,
              phone: user.phone,
              avatar: user.avatar,
              timestamp: Date.now()
            }
            localStorage.setItem('noli_user', JSON.stringify(cacheData))
            logger.auth('User cached with role:', user.role)
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

                logger.auth('Restoring user from cache (preview only, not authenticated):', user.email)
                // Important: ne pas marquer l\'utilisateur comme authentifié à partir du cache
                // Cela évite que le Header affiche un état connecté sans session valide
                setState({
                  user,
                  isAuthenticated: false,
                  isLoading: false,
                  permissions: [],
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
        // Tenter d'utiliser le cache local pour préserver le rôle exact
        let cachedRole: string | undefined
        try {
          const cachedUserRaw = localStorage.getItem('noli_user')
          if (cachedUserRaw) {
            const cachedUser = JSON.parse(cachedUserRaw)
            if (cachedUser?.id === session.user.id && typeof cachedUser?.role === 'string') {
              cachedRole = cachedUser.role
            }
          }
        } catch (_) {
          // Ignorer
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          companyName: session.user.user_metadata?.company || '',
          role: session.user.user_metadata?.role || (cachedRole as any) || 'USER',
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

        // Sauvegarder dans le cache avec toutes les données nécessaires
        try {
          const cacheData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role, // Critique: préserver le rôle exact
            companyName: user.companyName,
            phone: user.phone,
            avatar: user.avatar,
            timestamp: Date.now()
          }
          localStorage.setItem('noli_user', JSON.stringify(cacheData))
          logger.auth('User cached on sign in with role:', user.role)
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
        logger.auth('🚪 Processing SIGNED_OUT event - NETTOYAGE SÉCURISÉ')
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
        })

        // Nettoyage SÉCURISÉ complet du cache local
        try {
          // Nettoyer toutes les clés liées à l'application
          const keysToRemove = [
            'noli_user',
            'noli_permissions',
            'noli_last_activity',
            'noli_admin_data',
            'noli_user_preferences',
            'noli_session_data'
          ]

          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key)
            } catch (e) {
              logger.warn(`Erreur suppression ${key} dans SIGNED_OUT:`, e)
            }
          })

          // Nettoyer toutes les clés Supabase restantes
          try {
            const dynamicKeys: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (!key) continue
              if (key.startsWith('sb-') || key.startsWith('supabase.') || key.startsWith('noli-')) {
                dynamicKeys.push(key)
              }
            }
            dynamicKeys.forEach(key => {
              try {
                localStorage.removeItem(key)
              } catch (e) {
                logger.warn(`Erreur suppression clé dynamique ${key} dans SIGNED_OUT:`, e)
              }
            })
          } catch (e) {
            logger.warn('Erreur nettoyage clés dynamiques dans SIGNED_OUT:', e)
          }

          // Vider sessionStorage
          try {
            sessionStorage.clear()
          } catch (e) {
            logger.warn('Erreur nettoyage sessionStorage dans SIGNED_OUT:', e)
          }

          logger.auth('✅ Nettoyage complet dans SIGNED_OUT terminé')
        } catch (e) {
          logger.warn('Erreur nettoyage dans SIGNED_OUT:', e)
        }
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
    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string, securityContextData?: any) => {
    logger.auth('🔐 AuthContext.login appelé avec:', email)
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      logger.auth('📞 Appel de authService.login...')
      const response = await authService.login({ email, password })
      logger.auth('✅ authService.login réussi:', response.user)

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions: [],
      })

      // Charger les permissions en arrière-plan sans bloquer la connexion
      ;(async () => {
        try {
          logger.auth('📦 Chargement asynchrone des permissions après login...')
          const permissions = await getUserPermissions(
            response.user.id,
            () => authService.getUserPermissions(response.user.id)
          )
          logger.auth('✅ Permissions asynchrones chargées:', permissions)
          setState((prev) => ({ ...prev, permissions }))

          try {
            localStorage.setItem('noli_permissions', JSON.stringify({
              permissions,
              timestamp: Date.now()
            }))
          } catch (storageError) {
            logger.warn('Could not cache permissions after login:', storageError)
          }
        } catch (permError) {
          logger.warn('Impossible de charger les permissions après login:', permError)
        }
      })()

      logger.auth("🎉 État mis à jour, retour de l'utilisateur:", response.user)

      // Retourner le format attendu par la page de login
      return {
        user: response.user,
        rateLimitInfo: response.rateLimitInfo,
        captchaRequired: response.captchaRequired,
        securityAlerts: response.securityAlerts
      }
    } catch (error) {
      logger.error('❌ Erreur dans AuthContext.login:', error)
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const register = async (userData: Partial<User> & { password: string; role?: 'USER' | 'INSURER' | 'ADMIN' }) => {
    setState((prev) => ({ ...prev, isLoading: true }))
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
    // Réduire les logs en production - seulement en mode développement
    if (import.meta.env.DEV) {
      logger.auth('🚪 AuthContext.logout appelé')
    }

    // 1) Réinitialiser immédiatement l'état pour refléter la déconnexion dans l'UI (Header, etc.)
    setState({ user: null, isAuthenticated: false, isLoading: false, permissions: [] })

    // 2) NETTOYAGE SÉCURISÉ mais moins verbeux du stockage
    try {
      // a) Nettoyer les clés Supabase et application en une seule passe
      const keysToRemove = [
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'supabase.auth.code.verifier',
        'supabase.auth.pkce_code_verifier',
        'supabase.auth.expires_at',
        'supabase.auth.provider_token',
        'supabase.auth.provider_refresh_token',
        'noli-auth-token',
        'noli_user',
        'noli_permissions',
        'noli_last_activity',
        'noli_admin_data',
        'noli_user_preferences',
        'noli_session_data'
      ]

      // Supprimer les clés statiques
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          // Ignorer silencieusement les erreurs de suppression
        }
      })

      // b) Nettoyer les clés dynamiques Supabase (sb-*, supabase.*, noli-*)
      try {
        const dynamicKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.startsWith('supabase.') || key.startsWith('noli-'))) {
            dynamicKeys.push(key)
          }
        }

        dynamicKeys.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // Ignorer silencieusement les erreurs
          }
        })
      } catch (e) {
        // Ignorer silencieusement les erreurs
      }

      // c) Nettoyer sessionStorage
      try {
        sessionStorage.clear()
      } catch (e) {
        // Ignorer silencieusement les erreurs
      }

    } catch (storageError) {
      // Ignorer silencieusement les erreurs de nettoyage
    }

    // 3) Nettoyer les caches de requêtes React Query
    try {
      queryClient.clear()
    } catch (e) {
      // Ignorer silencieusement les erreurs
    }

    // 4) Nettoyage sélectif du localStorage - préserver les préférences utilisateur
    try {
      const essentialKeys = new Set([
        'theme',
        'donia-bf-language',
        'debug_errors',
        'userPreferences',
        'noli:theme',
        'admin-theme',
        'ui-theme',
        'theme-preferences'
      ])

      const keysToPreserve: Array<{ key: string; value: string }> = []
      
      // Sauvegarder les clés essentielles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && essentialKeys.has(key)) {
          const value = localStorage.getItem(key)
          if (value) {
            keysToPreserve.push({ key, value })
          }
        }
      }

      // Vider le localStorage
      localStorage.clear()

      // Restaurer uniquement les clés essentielles
      keysToPreserve.forEach(({ key, value }) => {
        try {
          localStorage.setItem(key, value)
        } catch (e) {
          // Ignorer les erreurs de restauration
        }
      })

      if (import.meta.env.DEV && keysToPreserve.length > 0) {
        logger.auth(`♻️ ${keysToPreserve.length} préférences utilisateur préservées`)
      }

    } catch (e) {
      // En cas d'erreur, vider complètement le localStorage
      try {
        localStorage.clear()
      } catch (e2) {
        // Ignorer les erreurs finales
      }
    }

    // 5) Nettoyer les cookies si accessible
    try {
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('sb-') || name.includes('supabase') || name.includes('noli')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
        }
      })
    } catch (e) {
      // Ignorer les erreurs de nettoyage des cookies
    }

    // 6) Déconnexion Supabase
    try {
      await supabase.auth.signOut({ scope: 'local' })
      // Tenter la révocation globale sans bloquer
      supabase.auth.signOut({ scope: 'global' }).catch(() => {
        // Ignorer silencieusement les erreurs de révocation globale
      })
    } catch (e) {
      // Ignorer les erreurs de déconnexion Supabase
    }

    if (import.meta.env.DEV) {
      logger.auth('✅ Déconnexion terminée')
    }

    // 7) Vérification de sécurité (silencieuse)
    try {
      securityUtils.scheduleSecurityCheck()
    } catch (e) {
      // Ignorer les erreurs de planification
    }

    // 8) Navigation immédiate vers la page de connexion
    navigate('/auth/connexion', { replace: true })
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
