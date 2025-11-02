import { User, LoginCredentials, RegisterData } from '@/types'
import { supabaseHelpers, supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { ProfileInsert } from '@/types/database'

export interface AuthResponse {
  user: User
  session: unknown
}

export class AuthService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.auth('AuthService.login appelé avec email:', credentials.email)

    try {
      logger.auth('Étape 1: Appel de supabaseHelpers.signIn')
      const data = await supabaseHelpers.signIn(credentials.email, credentials.password)

      logger.auth('Étape 2: signIn réussi, user ID:', data.user?.id)

      // Récupérer le profil complet avec les permissions
      logger.auth('Étape 3: Appel de getProfile pour user ID:', data.user?.id)
      const profile = await supabaseHelpers.getProfile(data.user?.id)

      if (!profile) {
        logger.error('Étape 4: Profil utilisateur non trouvé pour:', data.user?.id)
        throw new Error('Profil utilisateur non trouvé')
      }

      logger.auth('Étape 4: Profil trouvé, rôle:', profile.role)

      // Synchroniser les métadonnées Auth avec le rôle du profil pour éviter
      // toute régression de rôle lors des rafraîchissements de page
      try {
        const currentUser = (await supabase.auth.getUser()).data.user
        const currentRole = currentUser?.user_metadata?.role
        if (currentUser && currentRole !== profile.role) {
          logger.auth('Mise à jour des métadonnées Auth (role ->)', profile.role)
          await supabase.auth.updateUser({
            data: {
              role: profile.role,
              first_name: profile.first_name,
              last_name: profile.last_name,
              company: profile.company_name,
              avatar_url: profile.avatar_url,
            },
          })
        }
      } catch (metaErr) {
        logger.warn('Impossible de synchroniser les métadonnées Auth:', metaErr)
      }

      // Logger la connexion
      try {
        await supabaseHelpers.logAction('LOGIN', 'session', data.user?.id)
        logger.auth('Étape 5: Action de connexion loggée')
      } catch (logError) {
        logger.warn('Étape 5: Impossible de logger l action de connexion:', logError)
      }

      const user: User = {
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

      logger.auth('🔍 Profil utilisé pour créer l utilisateur:', profile)
      logger.auth('👤 Rôle dans le profil:', profile.role)
      logger.auth('🎯 Rôle dans l objet User:', user.role)
      logger.auth('Étape 6: Login complété avec succès pour:', user.email, 'avec le rôle:', user.role)
      return {
        user,
        session: data.session,
      }
    } catch (error) {
      logger.error('Login error dans AuthService:', error)
      logger.error('Détails de l erreur de login:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      logger.auth("Tentative d'inscription pour:", data.email)

      // En développement, créer directement l'utilisateur puis le connecter
      const { supabase } = await import('@/lib/supabase')

      // 1. Créer l'utilisateur avec auto-confirmation (développement uniquement)
      const userRole = data.companyName ? 'INSURER' : 'USER'
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: userRole, // Déterminer le rôle selon le type de compte
            company: data.companyName || '',
            company_name: data.companyName || '',
            avatar_url: '',
            email_verified: true, // Auto-confirmation en développement
          }
        }
      })

      if (signUpError) {
        logger.error('Erreur lors de l\'inscription:', signUpError)
        throw new Error(signUpError.message)
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte')
      }

      logger.auth('Utilisateur Supabase créé:', authData.user.id)

      // 2. Si l'utilisateur est confirmé automatiquement, le connecter immédiatement
      if (authData.user.email_confirmed_at) {
        logger.auth('Utilisateur confirmé, connexion automatique...')

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (signInError) {
          logger.error('Erreur lors de la connexion automatique:', signInError)
          throw new Error(signInError.message)
        }

        logger.auth('Connexion automatique réussie, user ID:', signInData.user?.id)

        // Utiliser les données de connexion plutôt que d'inscription
        authData.session = signInData.session
        authData.user = signInData.user
      }

      // Créer le profil dans la table profiles
      let profileCreated = false
      
      try {
        logger.auth('Tentative de création du profil via RPC pour:', authData.user.id)

        // Utiliser la fonction RPC qui contourne les RLS
        const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)('create_user_profile', {
          user_id: authData.user.id,
          user_email: data.email,
          first_name: data.firstName || '',
          last_name: data.lastName || '',
          phone: data.phone || '',
          company_name: data.companyName || '',
          user_role: userRole
        })

        if (rpcError) {
          logger.error('Erreur lors de la création du profil via RPC:', rpcError)
          logger.error("Détails de l'erreur RPC:", {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
          })
          throw new Error(`Erreur création profil RPC: ${rpcError.message}`)
        }

        if (!rpcResult) {
          throw new Error('La fonction RPC a retourné false')
        }

        logger.auth('✅ Profil créé avec succès via RPC pour:', authData.user.id)
        profileCreated = true
      } catch (rpcErr) {
        logger.warn('Échec de la création via RPC, tentative directe:', rpcErr)
        
        // Si la RPC échoue, essayer directement avec le service client
        try {
          logger.auth('Tentative de création directe du profil pour:', authData.user.id)
          
          const profileData: ProfileInsert = {
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName || '',
            last_name: data.lastName || '',
            phone: data.phone || '',
            company_name: data.companyName || '',
            role: userRole,
            is_active: true,
            email_verified: true, // Auto-confirmation en développement
            phone_verified: false,
            avatar_url: '',
          }

          logger.auth('Données du profil à insérer:', profileData)

          // Utiliser le service client pour contourner les RLS
          const { error: directError } = await (supabase.from('profiles') as any)
            .insert(profileData)
            .select()

          if (directError) {
            logger.error('Erreur lors de la création directe du profil:', directError)
            logger.error("Détails de l'erreur directe:", {
              code: directError.code,
              message: directError.message,
              details: directError.details,
              hint: directError.hint,
            })
            throw new Error(`Erreur création profil directe: ${directError.message}`)
          }

          logger.auth('✅ Profil créé avec succès directement pour:', authData.user.id)
          profileCreated = true
        } catch (directErr) {
          logger.error('Les deux méthodes de création de profil ont échoué:', directErr)
          throw new Error(
            `Échec création profil: ${directErr instanceof Error ? directErr.message : 'Erreur inconnue'}`
          )
        }
      }

      if (!profileCreated) {
        throw new Error('Impossible de créer le profil utilisateur')
      }

      // Logger la création du compte
      try {
        await supabaseHelpers.logAction('ACCOUNT_CREATED', 'profile', authData.user.id)
      } catch (logError) {
        logger.warn('Impossible de logger la création du compte:', logError)
      }

      const user: User = {
        id: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: userRole,
        phone: data.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      logger.auth('✅ Inscription terminée avec succès:', user.id)

      return {
        user,
        session: authData.session,
      }
    } catch (error) {
      logger.error("❌ Erreur lors de l'inscription:", error)
      throw error
    }
  }

  // Fonction pour créer un profil manuellement (utile pour le debug)
  async createProfileManually(userId: string, userData: Partial<User>) {
    try {
      const { supabase } = await import('@/lib/supabase')

      const profileData = {
        id: userId,
        email: userData.email || '',
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        phone: userData.phone || '',
        company_name: userData.companyName || '',
        role: 'USER',
        is_active: true,
        email_verified: false,
        phone_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      logger.auth('Création manuelle du profil:', profileData)

      const { error: profileError } = await (supabase.from('profiles') as any).insert(profileData)

      if (profileError) {
        logger.error('Erreur création profil manuel:', profileError)
        throw new Error(`Erreur création profil: ${profileError.message}`)
      }

      logger.auth('✅ Profil créé manuellement avec succès:', userId)
      return true
    } catch (error) {
      logger.error('Erreur création manuelle du profil:', error)
      throw error
    }
  }

  async loginWithOAuth(provider: 'google' | 'facebook' | 'github'): Promise<void> {
    try {
      await supabaseHelpers.signInWithOAuth(provider)
    } catch (error) {
      logger.error('OAuth login error:', error)
      throw error
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession()

      if (error) throw error
      if (!session?.user) throw new Error('Session invalide')

      // Récupérer le profil mis à jour
      const profile = await supabaseHelpers.getProfile(session.user.id)

      if (!profile) {
        throw new Error('Profil utilisateur non trouvé')
      }

      const user: User = {
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

      return {
        user,
        session,
      }
    } catch (error) {
      logger.error('Refresh token error:', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    logger.auth('🚪 AuthService.logout appelé')

    // Tenter la déconnexion Supabase de manière non bloquante
    try {
      // Lancer la déconnexion en arrière-plan sans attendre
      supabase.auth.signOut().catch((err) => {
        logger.warn('Background signOut failed:', err)
      })

      logger.auth('✅ Déconnexion Supabase lancée (non bloquante)')
    } catch (error) {
      logger.warn('Logout error (non-critical):', error)
    }

    // Nettoyage local immédiat (non bloquant)
    try {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
      sessionStorage.clear()
      logger.auth('✅ Nettoyage local effectué')
    } catch (cleanupError) {
      logger.warn('Cleanup error:', cleanupError)
    }

    logger.auth('✅ AuthService.logout terminé')
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      // Créer un token de reset personnalisé
      const resetToken = await supabaseHelpers.createPasswordResetToken(email)

      // Envoyer l'email de reset via Supabase
      await supabaseHelpers.resetPassword(email)

      logger.info(`[DEBUG] Reset token created for ${email}: ${resetToken}`)
    } catch (error) {
      logger.error('Forgot password error:', error)
      throw error
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await supabaseHelpers.usePasswordResetToken(token, newPassword)
    } catch (error) {
      logger.error('Reset password error:', error)
      throw error
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const profile = await supabaseHelpers.updateProfile({
        first_name: updates.firstName,
        last_name: updates.lastName,
        company_name: updates.companyName,
        phone: updates.phone,
        avatar_url: updates.avatar,
      })

      // Logger la mise à jour du profil
      await supabaseHelpers.logAction('PROFILE_UPDATE', 'profile', profile.id, {
        action: 'PROFILE_UPDATE',
        resource: 'profile',
        details: updates,
      })

      const user: User = {
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

      return user
    } catch (error) {
      logger.error('Update profile error:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const profile = await supabaseHelpers.getProfile(user.id)

      if (!profile) return null

      return {
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
    } catch (error) {
      logger.error('Get current user error:', error)
      return null
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return !!session && !!session.user
    } catch (error) {
      logger.error('Check auth error:', error)
      return false
    }
  }

  async getUserPermissions(userId?: string): Promise<string[]> {
    try {
      const permissions = await supabaseHelpers.getUserPermissions(userId)
      // Extraire uniquement les noms des permissions
      return permissions.map((p) => p.permission_name)
    } catch (error) {
      logger.error('Get permissions error:', error)
      return []
    }
  }

  async hasPermission(permission: string): Promise<boolean> {
    try {
      return await supabaseHelpers.hasPermission(permission)
    } catch (error) {
      logger.error('Check permission error:', error)
      return false
    }
  }

  async getUserSessions(): Promise<unknown[]> {
    try {
      return await supabaseHelpers.getUserSessions()
    } catch (error) {
      logger.error('Get sessions error:', error)
      return []
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      await supabaseHelpers.revokeSession(sessionId)
    } catch (error) {
      logger.error('Revoke session error:', error)
      throw error
    }
  }
}

export const authService = AuthService.getInstance()
