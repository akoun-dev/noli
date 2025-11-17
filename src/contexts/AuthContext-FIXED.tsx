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
    // Timeout de sécurité plus court - 2 secondes maximum
    const loadingTimeout = setTimeout(() => {
      setState((prev) => {
        if (prev.isLoading) {
          logger.warn('Forcing isLoading to false after timeout - 2s')
          return {
            ...prev,
            isLoading: false
          }
        }
        return prev
      })
    }, 2000) // Réduit de 5s à 2s

    // Initialisation plus rapide avec fallback immédiat
    const initializeAuth = async () => {
      try {
        logger.auth('Initializing secure auth...')

        // Initialisation rapide de l'authentification sécurisée
        secureAuthService.initializeSecureAuth()

        // Nettoyage des anciens tokens (non bloquant)
        secureAuthService.cleanupLegacyTokens()

        // Migration vers le stockage sécurisé (non bloquant)
        secureAuthService.migrateToSecureStorage().catch(err => {
          logger.warn('Migration to secure storage failed:', err)
        })

        // Vérification de session SIMPLE - SANS retry infini
        let session = null
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()

          if (error) {
            logger.warn('Session check failed:', error)
          } else {
            session = currentSession
          }
        } catch (sessionError) {
          logger.warn('Session check exception:', sessionError)
        }

        logger.auth('Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
        })

        if (session?.user) {
          // Charger l'utilisateur depuis le cache local d'abord
          let cachedUser: any = null
          try {
            const cachedUserRaw = localStorage.getItem('noli_user')
            if (cachedUserRaw) {
              cachedUserData = JSON.parse(cachedUserRaw)
              if (cachedUserData?.id === session.user.id) {
                cachedUser = cachedUserData
                logger.auth('Found cached user data for faster loading')
              }
            }
          } catch (_) {
            // Ignorer les erreurs de cache
          }

          // Utiliser les données du cache immédiatement
          const user: User = {
            id: session.user.id,
            email: session.user.email || cachedUser?.email || '',
            firstName: session.user.user_metadata?.first_name || cachedUser?.firstName || '',
            lastName: session.user.user_metadata?.last_name || cachedUser?.lastName || '',
            companyName: session.user.user_metadata?.company || cachedUser?.companyName || '',
            role: session.user.user_metadata?.role || cachedUser?.role || 'USER',
            phone: session.user.phone || cachedUser?.phone || '',
            avatar: session.user.user_metadata?.avatar_url || cachedUser?.avatar || '',
            createdAt: new Date(session.user.created_at),
            updatedAt: new Date(),
          }

          // Mettre à jour l'état IMMÉDIATEMENT avec les données du cache
          setState({
            user,
            isAuthenticated: true,
            isLoading: false, // ⚡ PLUS D'ATTENTE - chargement terminé
            permissions: [], // Sera chargé en arrière-plan
          })

          logger.auth('User loaded from cache, auth state set to loaded')

          // Sauvegarder les données dans le cache (mis à jour si nécessaire)
          try {
            const cacheData = {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              companyName: user.companyName,
              phone: user.phone,
              avatar: user.avatar,
              timestamp: Date.now()
            }
            localStorage.setItem('noli_user', JSON.stringify(cacheData))
          } catch (storageError) {
            logger.warn('Could not save user to localStorage:', storageError)
          }

          // Charger les permissions en ARRIÈRE-PLAN (non bloquant)
          ;(async () => {
            try {
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
          })()

        } else {
          // Pas de session - état non authentifié immédiat
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false, // ⚡ PAS D'ATTENTE
            permissions: []
          })

          // Nettoyer le cache
          try {
            localStorage.removeItem('noli_user')
            localStorage.removeItem('noli_permissions')
          } catch (e) {
            logger.warn('Error clearing cache:', e)
          }
        }
      } catch (error) {
        logger.error('Auth initialization error:', error)
        // En cas d'erreur, éviter le loading infini
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false, // ⚡ FORCER isLoading à false même en erreur
          permissions: []
        })
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
        // Logique d'inscription similaire à ci-dessus mais plus rapide
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

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
        })

        // Charger les permissions en arrière-plan
        ;(async () => {
          try {
            const permissions = await getUserPermissions(
              user.id,
              () => authService.getUserPermissions(user.id)
            )
            setState((prev) => ({ ...prev, permissions }))
          } catch (error) {
            logger.warn('Could not load permissions after sign in:', error)
          }
        })()

      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
        })

        // Nettoyage du cache
        try {
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
              logger.warn(`Erreur suppression ${key}:`, e)
            }
          })

          sessionStorage.clear()
        } catch (e) {
          logger.warn('Erreur nettoyage SIGNED_OUT:', e)
        }
      }
    })

    // Cleanup
    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Le reste des méthodes reste inchangé...
  const login = async (email: string, password: string, securityContextData?: any) => {
    // ... (même code qu'avant)
  }

  const logout = async () => {
    // ... (même code qu'avant)
  }

  const updateUser = async (userData: Partial<User>) => {
    // ... (même code qu'avant)
  }

  const refreshToken = async () => {
    // ... (même code qu'avant)
  }

  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission)
  }

  const forgotPassword = async (email: string) => {
    // ... (même code qu'avant)
  }

  const resetPassword = async (token: string, newPassword: string) => {
    // ... (même code qu'avant)
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}