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
  isInitializing: boolean  // Nouveau : pour savoir si l'auth est en cours d'init
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
    isInitializing: true,  // Commence à true, passe à false après l'init
    permissions: [],
  })

  // Fonction pour charger les permissions
  const loadPermissions = async (userId: string) => {
    try {
      const permissions = await getUserPermissions(
        userId,
        () => authService.getUserPermissions(userId)
      )
      logger.auth('Permissions loaded:', permissions.length)
      setState((prev) => ({ ...prev, permissions }))

      // 🔒 SÉCURITÉ : Plus de stockage des permissions dans localStorage
      // Les permissions sont basées sur le rôle et sont rechargées depuis les métadonnées
    } catch (error) {
      logger.warn('Could not load permissions:', error)
    }
  }

  // Fonction pour récupérer le rôle depuis la table profiles
  // @param userId - L'ID de l'utilisateur
  // @param fallbackRole - Le rôle à utiliser en cas d'erreur/timeout (généralement depuis user_metadata)
  const fetchRoleFromProfile = async (userId: string, fallbackRole: string = 'USER'): Promise<string> => {
    try {
      // Timeout augmenté à 15 secondes pour éviter les faux positifs
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout fetching role')), 15000)
      })

      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single(),
        timeoutPromise
      ]) as any

      if (error) {
        logger.warn('Could not fetch role from profiles:', error)
        // 🔒 SÉCURITÉ : Utiliser le rôle du user_metadata comme fallback pour éviter la régression de privilèges
        logger.auth('Using fallback role from metadata:', fallbackRole)
        return fallbackRole
      }

      const dbRole = data?.role || fallbackRole
      logger.auth('Role fetched from profiles table:', dbRole)
      return dbRole
    } catch (error) {
      logger.warn('Error fetching role from profiles:', error)
      // 🔒 SÉCURITÉ : En cas d'erreur ou timeout, utiliser le rôle du user_metadata comme fallback
      logger.auth('Using fallback role from metadata after error:', fallbackRole)
      return fallbackRole
    }
  }

  // Fonction pour synchroniser le rôle avec user_metadata
  const syncRoleToMetadata = async (userId: string, dbRole: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.user_metadata?.role !== dbRole) {
        logger.auth('Syncing role to metadata:', { metadataRole: user.user_metadata?.role, dbRole })
        await supabase.auth.updateUser({
          data: { role: dbRole }
        })
      }
    } catch (error) {
      logger.warn('Could not sync role to metadata:', error)
    }
  }

  // Fonction pour mettre à jour le rôle depuis la BD et mettre à jour l'état
  const updateRoleFromDatabase = async (userId: string, currentUser: User) => {
    try {
      const dbRole = await fetchRoleFromProfile(userId, currentUser.role)

      // Si le rôle est différent, mettre à jour l'état et synchroniser
      if (currentUser.role !== dbRole) {
        logger.auth('Role mismatch detected, updating:', {
          currentRole: currentUser.role,
          dbRole
        })

        // Mettre à jour l'état avec le bon rôle
        setState((prev) => ({
          ...prev,
          user: { ...prev.user!, role: dbRole as 'USER' | 'INSURER' | 'ADMIN' }
        }))

        // Synchroniser avec user_metadata
        await syncRoleToMetadata(userId, dbRole)

        return dbRole
      }

      return currentUser.role
    } catch (error) {
      logger.warn('Could not update role from database:', error)
      return currentUser.role
    }
  }

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
          // 🔒 SÉCURITÉ : Créer l'utilisateur d'abord avec user_metadata
          // pour éviter le blocage, puis mettre à jour le rôle depuis la BD
          const metadataRole = session.user.user_metadata?.role || 'USER'

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            companyName: session.user.user_metadata?.company || '',
            // Rôle depuis les métadonnées temporairement
            role: metadataRole as 'USER' | 'INSURER' | 'ADMIN',
            phone: session.user.phone || '',
            avatar: session.user.user_metadata?.avatar_url || '',
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date(),
          }

          logger.auth('User created from session metadata, role:', user.role)

          // D'abord définir l'état pour éviter le blocage (mais isInitializing reste true)
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitializing: true,  // Reste true jusqu'à la récupération du rôle
            permissions: [],
          })

          // Puis mettre à jour le rôle depuis la BD
          fetchRoleFromProfile(session.user.id, metadataRole).then((dbRole) => {
            logger.auth('🔍 [DEBUG] Role comparison:', { metadataRole, dbRole })

            if (user.role !== dbRole) {
              logger.auth('🔍 [DEBUG] Updating role from DB:', { from: user.role, to: dbRole })

              // Synchroniser avec user_metadata
              syncRoleToMetadata(session.user.id, dbRole)

              // Mettre à jour l'état avec le bon rôle
              setState((prev) => {
                logger.auth('🔍 [DEBUG] State update - changing role from', prev.user?.role, 'to', dbRole)
                return {
                  ...prev,
                  user: { ...prev.user!, role: dbRole as 'USER' | 'INSURER' | 'ADMIN' }
                }
              })
            }

            // Une fois le rôle récupéré, marquer l'init comme terminée
            logger.auth('🔍 [DEBUG] Setting isInitializing to FALSE')
            setState((prev) => {
              logger.auth('🔍 [DEBUG] State before isInitializing=false:', { isLoading: prev.isLoading, isInitializing: prev.isInitializing, userRole: prev.user?.role })
              return { ...prev, isInitializing: false }
            })
          }).catch((err) => {
            logger.warn('🔍 [DEBUG] Failed to fetch role from DB:', err)
            // Même en cas d'erreur, marquer l'init comme terminée pour éviter le blocage
            logger.auth('🔍 [DEBUG] Setting isInitializing to FALSE (error case)')
            setState((prev) => ({ ...prev, isInitializing: false }))
          })

          // Charger les permissions en arrière-plan
          loadPermissions(session.user.id)

        } else {
          // 🔒 SÉCURITÉ : Nettoyer tout cache résiduel du localStorage
          // Plus de restauration depuis le cache pour éviter les attaques
          try {
            localStorage.removeItem('noli_user')
            localStorage.removeItem('noli_permissions')
          } catch (e) {
            // Ignorer les erreurs de nettoyage
          }

          logger.auth('No session found, setting unauthenticated state')
          setState((prev) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitializing: false,
            permissions: []
          }))
        }
      } catch (error) {
        logger.error('Auth initialization error:', error)
        setState((prev) => ({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
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

        // 🔒 SÉCURITÉ : Créer l'utilisateur d'abord avec user_metadata
        // pour éviter le blocage, puis mettre à jour le rôle depuis la BD
        const metadataRole = session.user.user_metadata?.role || 'USER'

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          companyName: session.user.user_metadata?.company || '',
          role: metadataRole as 'USER' | 'INSURER' | 'ADMIN',
          phone: session.user.phone || '',
          avatar: session.user.user_metadata?.avatar_url || '',
          createdAt: new Date(session.user.created_at),
          updatedAt: new Date(),
        }

        logger.auth('Setting state from session metadata, role:', user.role)

        // D'abord définir l'état pour éviter le blocage (mais isInitializing reste true)
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitializing: true,  // Reste true jusqu'à la récupération du rôle
          permissions: [],
        })

        // Puis mettre à jour le rôle depuis la BD en arrière-plan (non bloquant)
        fetchRoleFromProfile(session.user.id, metadataRole).then((dbRole) => {
          logger.auth('SIGNED_IN - Role comparison:', { metadataRole, dbRole })

          if (user.role !== dbRole) {
            logger.auth('Updating role from DB:', { from: user.role, to: dbRole })

            // Synchroniser avec user_metadata
            syncRoleToMetadata(session.user.id, dbRole)

            // Mettre à jour l'état avec le bon rôle
            setState((prev) => ({
              ...prev,
              user: { ...prev.user!, role: dbRole as 'USER' | 'INSURER' | 'ADMIN' }
            }))
          }

          // Une fois le rôle récupéré, marquer l'init comme terminée
          setState((prev) => ({ ...prev, isInitializing: false }))
        }).catch((err) => {
          logger.warn('Failed to fetch role from DB:', err)
          // Même en cas d'erreur, marquer l'init comme terminée
          setState((prev) => ({ ...prev, isInitializing: false }))
        })

        // Nettoyer tout ancien cache résiduel
        try {
          localStorage.removeItem('noli_user')
        } catch (e) {
          // Ignorer
        }

        // Charger les permissions en arrière-plan
        loadPermissions(user.id)
      } else if (event === 'SIGNED_OUT') {
        logger.auth('🚪 Processing SIGNED_OUT event - NETTOYAGE SÉCURISÉ')
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitializing: false,
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
    return () => subscription.unsubscribe()
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
        isInitializing: false,
        permissions: [],
      })

      // Charger les permissions en arrière-plan sans bloquer avec cache
      loadPermissions(response.user.id)

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
      setState((prev) => ({ ...prev, isLoading: false, isInitializing: false }))
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
        isInitializing: false,
        permissions,
      })

      return response.user
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false, isInitializing: false }))
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
    setState({ user: null, isAuthenticated: false, isLoading: false, isInitializing: false, permissions: [] })

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
        isInitializing: false,
        permissions,
      })
    } catch (error) {
      logger.error('Refresh token error:', error)
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
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
