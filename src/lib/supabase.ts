import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database, ProfileUpdate } from '@/types/database'
import { logger } from '@/lib/logger'
import { UserMetadata, AuditMetadata } from '@/types/common'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Les variables d'environnement Supabase sont manquantes. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
  )
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Application-Name': 'noli-assurance',
        'x-connect-timeout': '30s',
        'x-read-timeout': '60s',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Note: supabasePublic est maintenant défini dans supabase-public.ts

// Helper functions pour les opérations courantes
export const supabaseHelpers = {
  // Authentification
  async signUp(email: string, password: string, metadata?: UserMetadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    logger.auth('Tentative de connexion pour:', email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error('Erreur lors de signInWithPassword:', error)
        throw error
      }

      logger.auth('signInWithPassword réussi pour:', email)
      return data
    } catch (err) {
      logger.error('Exception dans signIn:', err)
      throw err
    }
  },

  async signInWithOAuth(provider: 'google' | 'facebook' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  },

  // Profil utilisateur
  async getProfile(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

    if (!targetUserId) {
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle()

    if (error) {
      logger.warn('Profil non trouvé:', error)
      return null
    }

    return data
  },

  async updateProfile(updates: Partial<UserMetadata>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    // Construire l'objet de mise à jour avec les champs valides
    const updateData = {
      ...(updates.first_name && { first_name: updates.first_name }),
      ...(updates.last_name && { last_name: updates.last_name }),
      ...(updates.company_name && { company_name: updates.company_name }),
      ...(updates.company && { company_name: updates.company }),
      ...(updates.phone && { phone: updates.phone }),
      ...(updates.avatar_url && { avatar_url: updates.avatar_url }),
    }

    logger.auth('Tentative de mise à jour du profil:', updateData)

    // Utiliser une approche de contournement pour les problèmes de types
    const { data, error } = await (supabase.from('profiles') as any)
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error)
      throw error
    }

    logger.auth('✅ Profil mis à jour avec succès:', data)
    return data
  },

  // Permissions
  async getUserPermissions(userId?: string) {
    logger.auth('getUserPermissions appelé avec userId:', userId)

    try {
      // Utiliser l'ID de l'utilisateur connecté si aucun ID n'est fourni
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

      if (!targetUserId) {
        logger.warn('getUserPermissions: No user ID provided or available')
        return []
      }

      // 🔒 SÉCURITÉ : Récupérer les permissions depuis la base de données via RPC
      // Cela garantit que les permissions sont validées côté serveur
      const { data: permissionsData, error } = await supabase.rpc('get_user_permissions', {
        p_user_uuid: targetUserId
      })

      if (error) {
        logger.warn('Erreur RPC get_user_permissions, fallback sur métadonnées:', error)
        // Fallback: utiliser les métadonnées en cas d'erreur
        const { data: { user } } = await supabase.auth.getUser()
        const role = user?.user_metadata?.role || 'USER'
        return this.getFallbackPermissions(role)
      }

      if (!permissionsData || permissionsData.length === 0) {
        logger.warn('Aucune permission trouvée pour:', targetUserId)
        return []
      }

      logger.auth('Permissions récupérées depuis la BD:', permissionsData.length, 'permissions')
      return permissionsData as any
    } catch (err) {
      logger.error('Exception dans getUserPermissions:', err)
      // Fallback en cas d'exception
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.user_metadata?.role || 'USER'
      return this.getFallbackPermissions(role)
    }
  },

  // Fallback pour les permissions en cas d'erreur de BD
  getFallbackPermissions(role: string) {
    logger.auth('Utilisation des permissions fallback pour le rôle:', role)

    switch (role) {
      case 'ADMIN':
        return [
          {
            permission_name: 'admin_access',
            resource_type: 'all',
            can_read: true,
            can_write: true,
            can_delete: true,
          },
          {
            permission_name: 'user_management',
            resource_type: 'users',
            can_read: true,
            can_write: true,
            can_delete: true,
          },
        ]
      case 'INSURER':
        return [
          {
            permission_name: 'insurer_access',
            resource_type: 'all',
            can_read: true,
            can_write: true,
            can_delete: false,
          },
          {
            permission_name: 'offer_management',
            resource_type: 'offers',
            can_read: true,
            can_write: true,
            can_delete: true,
          },
        ]
      default: // USER
        return [
          {
            permission_name: 'user_access',
            resource_type: 'all',
            can_read: true,
            can_write: false,
            can_delete: false,
          },
          {
            permission_name: 'profile_management',
            resource_type: 'profile',
            can_read: true,
            can_write: true,
            can_delete: false,
          },
        ]
    }
  },

  async hasPermission(permission: string, action: 'read' | 'write' | 'delete' = 'read', userId?: string) {
    try {
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id

      if (!targetUserId) {
        return false
      }

      // 🔒 SÉCURITÉ : Vérifier la permission côté serveur via RPC
      const { data, error } = await supabase.rpc('user_has_permission_with_action', {
        p_permission_name: permission,
        p_action: action,
        p_target_user: targetUserId
      })

      if (error) {
        logger.warn('Erreur RPC user_has_permission_with_action:', error)
        // Fallback: vérifier localement
        const permissions = await this.getUserPermissions(targetUserId)
        const perm = permissions.find((p: any) => p.permission_name === permission)
        if (!perm) return false
        return action === 'read' ? perm.can_read : action === 'write' ? perm.can_write : perm.can_delete
      }

      return data === true
    } catch (error) {
      logger.error('hasPermission error:', error)
      return false
    }
  },

  // Audit logs
  async logAction(
    action: string,
    resource?: string,
    resourceId?: string,
    metadata?: AuditMetadata
  ) {
    try {
      // Utiliser un logging simple via console pour l'instant
      logger.auth('Log action:', { action, resource, resourceId, metadata })
    } catch (error) {
      logger.warn('logAction error (non-bloquant):', error)
    }
  },

  // Password reset tokens
  async createPasswordResetToken(email: string) {
    try {
      // 🔒 SÉCURITÉ : Utiliser la RPC pour créer un token de reset
      const { data: token, error } = await supabase.rpc('create_password_reset_token', {
        user_email: email
      })

      if (error) {
        logger.error('createPasswordResetToken error:', error)
        throw error
      }

      logger.auth('Password reset token created for', email)
      return token
    } catch (error) {
      logger.error('createPasswordResetToken error:', error)
      throw error
    }
  },

  async usePasswordResetToken(token: string, newPassword: string) {
    try {
      // 🔒 SÉCURITÉ : Utiliser la RPC pour valider le token et mettre à jour le mot de passe
      const { data, error } = await supabase.rpc('use_password_reset_token', {
        token_value: token,
        new_password: newPassword
      })

      if (error) {
        logger.error('usePasswordResetToken error:', error)
        throw error
      }

      logger.auth('Password reset completed for token:', token.substring(0, 8) + '...')
      return data === true
    } catch (error) {
      logger.error('usePasswordResetToken error:', error)
      throw error
    }
  },

  // Sessions
  async getUserSessions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      // 🔒 SÉCURITÉ : Récupérer les sessions depuis la table user_sessions
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false })

      if (error) {
        logger.warn('getUserSessions error:', error)
        return []
      }

      // Filtrer les sessions expirées
      const now = new Date()
      const activeSessions = (sessions || []).filter(
        s => new Date(s.expires_at) > now
      )

      return activeSessions
    } catch (error) {
      logger.warn('getUserSessions error (non-bloquant):', error)
      return []
    }
  },

  async revokeSession(sessionId: string) {
    try {
      logger.auth('Session revocation requested for:', sessionId.substring(0, 8) + '...')

      // 🔒 SÉCURITÉ : Marquer la session comme inactive dans la table user_sessions
      const { error } = await supabase
        .from('user_sessions')
        .update({ expires_at: new Date().toISOString() }) // Marquer comme expirée immédiatement
        .eq('id', sessionId)

      if (error) {
        logger.warn('revokeSession error:', error)
      } else {
        logger.auth('Session revoked successfully')
      }
    } catch (error) {
      logger.warn('revokeSession error (non-bloquant):', error)
    }
  },

  // Audit logs (admin seulement)
  async getAuditLogs(limit = 50, offset = 0) {
    try {
      logger.auth('getAuditLogs appelé')

      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error("Erreur lors de la récupération des logs d'audit:", error)
        return []
      }

      return logs || []
    } catch (error) {
      logger.warn('getAuditLogs error (non-bloquant):', error)
      return []
    }
  },

  // Utilisateurs (admin seulement)
  async getUsers(limit = 50, offset = 0) {
    try {
      logger.auth('getUsers appelé')

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error('Erreur lors de la récupération des utilisateurs:', error)
        return []
      }

      return profiles || []
    } catch (error) {
      logger.warn('getUsers error (non-bloquant):', error)
      return []
    }
  },

  async updateUserRole(userId: string, role: 'USER' | 'INSURER' | 'ADMIN', reason?: string) {
    try {
      logger.auth('updateUserRole appelé pour', userId, '->', role)

      // 🔒 SÉCURITÉ : Utiliser la RPC qui vérifie les permissions admin
      const { data, error } = await supabase.rpc('set_user_role', {
        p_user_uuid: userId,
        p_new_role: role,
        p_reason: reason || 'Changement de rôle manuel'
      })

      if (error) {
        logger.error('Erreur lors de la mise à jour du rôle:', error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('updateUserRole error:', error)
      throw error
    }
  },

  async deactivateUser(userId: string, reason?: string) {
    try {
      logger.auth('deactivateUser appelé pour', userId)

      // 🔒 SÉCURITÉ : Utiliser la RPC qui vérifie les permissions admin
      const { data, error } = await supabase.rpc('deactivate_user', {
        p_user_uuid: userId,
        p_reason: reason || 'Désactivation manuelle'
      })

      if (error) {
        logger.error('Erreur lors de la désactivation:', error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('deactivateUser error:', error)
      throw error
    }
  },

  async activateUser(userId: string, reason?: string) {
    try {
      logger.auth('activateUser appelé pour', userId)

      // 🔒 SÉCURITÉ : Utiliser la RPC qui vérifie les permissions admin
      const { data, error } = await supabase.rpc('activate_user', {
        p_user_uuid: userId,
        p_reason: reason || 'Activation manuelle'
      })

      if (error) {
        logger.error("Erreur lors de l'activation:", error)
        throw error
      }

      return data
    } catch (error) {
      logger.error('activateUser error:', error)
      throw error
    }
  },
}

// Export du client et des helpers
export default supabase
