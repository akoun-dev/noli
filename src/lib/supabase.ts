import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { logger } from '@/lib/logger';
import { UserMetadata, AuditMetadata } from '@/types/common';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Utiliser la configuration par défaut de Supabase pour le stockage
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Application-Name': 'noli-assurance',
    },
  },
});

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
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    logger.auth('Tentative de connexion pour:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('Erreur lors de signInWithPassword:', error);
        throw error;
      }
      
      logger.auth('signInWithPassword réussi pour:', email);
      return data;
    } catch (err) {
      logger.error('Exception dans signIn:', err);
      throw err;
    }
  },

  async signInWithOAuth(provider: 'google' | 'facebook' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
  },

  // Profil utilisateur
  async getProfile(userId?: string) {
    logger.auth('getProfile appelé avec userId:', userId);

    try {
      // Utiliser l'ID de l'utilisateur connecté si aucun ID n'est fourni
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        logger.warn('getProfile: No user ID provided or available');
        return null;
      }

      logger.auth('Utilisation des métadonnées utilisateur pour:', targetUserId);

      // Récupérer l'utilisateur et ses métadonnées
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        logger.error('getUser error:', error);
        return null;
      }

      if (!user) {
        logger.warn('Utilisateur non trouvé');
        return null;
      }

      // Construire le profil à partir des métadonnées
      const profile = {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: user.user_metadata?.role || 'USER',
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        phone: user.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        company_name: user.user_metadata?.company_name || ''
      };

      logger.auth('Profil construit à partir des métadonnées:', profile);
      return profile;
    } catch (err) {
      logger.error('Exception dans getProfile:', err);
      return null;
    }
  },

  async updateProfile(updates: Partial<UserMetadata>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Permissions
  async getUserPermissions(userId?: string) {
    logger.auth('getUserPermissions appelé avec userId:', userId);

    try {
      // Utiliser l'ID de l'utilisateur connecté si aucun ID n'est fourni
      const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

      if (!targetUserId) {
        logger.warn('getUserPermissions: No user ID provided or available');
        return [];
      }

      logger.auth('Utilisation des métadonnées pour les permissions de:', targetUserId);

      // Récupérer l'utilisateur et ses métadonnées
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        logger.error('getUser error:', error);
        return [];
      }

      if (!user) {
        logger.warn('Utilisateur non trouvé');
        return [];
      }

      // Déterminer les permissions basées sur le rôle
      const role = user.user_metadata?.role || 'USER';

      let permissions = [];
      switch (role) {
        case 'ADMIN':
          permissions = [
            { permission_name: 'admin_access', resource_type: 'all', can_read: true, can_write: true, can_delete: true },
            { permission_name: 'user_management', resource_type: 'users', can_read: true, can_write: true, can_delete: true },
            { permission_name: 'system_configuration', resource_type: 'system', can_read: true, can_write: true, can_delete: false }
          ];
          break;
        case 'INSURER':
          permissions = [
            { permission_name: 'insurer_access', resource_type: 'all', can_read: true, can_write: true, can_delete: false },
            { permission_name: 'offer_management', resource_type: 'offers', can_read: true, can_write: true, can_delete: true },
            { permission_name: 'client_management', resource_type: 'clients', can_read: true, can_write: true, can_delete: false }
          ];
          break;
        default: // USER
          permissions = [
            { permission_name: 'user_access', resource_type: 'all', can_read: true, can_write: false, can_delete: false },
            { permission_name: 'profile_management', resource_type: 'profile', can_read: true, can_write: true, can_delete: false }
          ];
      }

      logger.auth('Permissions générées pour le rôle', role, ':', permissions);
      return permissions;
    } catch (err) {
      logger.error('Exception dans getUserPermissions:', err);
      return [];
    }
  },

  async hasPermission(permission: string, userId?: string) {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.some(p => p.permission_name === permission);
    } catch (error) {
      logger.error('hasPermission error:', error);
      return false;
    }
  },

  // Audit logs
  async logAction(action: string, resource?: string, resourceId?: string, metadata?: AuditMetadata) {
    try {
      // Utiliser un logging simple via console pour l'instant
      logger.auth('Log action:', { action, resource, resourceId, metadata });
    } catch (error) {
      logger.warn('logAction error (non-bloquant):', error);
    }
  },

  // Password reset tokens
  async createPasswordResetToken(email: string) {
    try {
      // Générer un token simple pour l'instant
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      logger.auth('Password reset token created for', email);
      return token;
    } catch (error) {
      logger.error('createPasswordResetToken error:', error);
      throw error;
    }
  },

  async usePasswordResetToken(token: string, newPassword: string) {
    try {
      // Pour l'instant, simplement mettre à jour le mot de passe avec Supabase Auth
      // TODO: Implémenter une vraie validation de token
      await this.updatePassword(newPassword);
      logger.auth('Password reset completed for token:', token.substring(0, 8) + '...');
      return true;
    } catch (error) {
      logger.error('usePasswordResetToken error:', error);
      throw error;
    }
  },

  // Sessions
  async getUserSessions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Retourner la session actuelle dans un format compatible
      return [{
        id: session.access_token,
        user_id: session.user.id,
        created_at: session.created_at,
        updated_at: new Date().toISOString(),
        expires_at: new Date(session.expires_at! * 1000).toISOString(),
        is_active: true
      }];
    } catch (error) {
      logger.warn('getUserSessions error (non-bloquant):', error);
      return [];
    }
  },

  async revokeSession(sessionId: string) {
    try {
      // Pour l'instant, ne fait rien de spécial
      // TODO: Implémenter la révocation de session si nécessaire
      logger.auth('Session revocation requested for:', sessionId.substring(0, 8) + '...');
    } catch (error) {
      logger.warn('revokeSession error (non-bloquant):', error);
    }
  },

  // Audit logs (admin seulement)
  async getAuditLogs(limit = 50, offset = 0) {
    try {
      // Pour l'instant, retourner un tableau vide
      // TODO: Implémenter les logs d'audit quand la table sera créée
      logger.auth('getAuditLogs appelé - retourne tableau vide pour l\'instant');
      return [];
    } catch (error) {
      logger.warn('getAuditLogs error (non-bloquant):', error);
      return [];
    }
  },

  // Utilisateurs (admin seulement)
  async getUsers(limit = 50, offset = 0) {
    try {
      // Pour l'instant, retourner les utilisateurs de test
      // TODO: Implémenter la vraie liste d'utilisateurs quand la table profiles sera créée
      logger.auth('getUsers appelé - retourne utilisateurs de test pour l\'instant');
      return [
        {
          id: 'f561a583-adf7-49b9-b8a5-eae612a6eb7f',
          email: 'user2@noli.com',
          first_name: 'User',
          last_name: 'Two',
          role: 'USER',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '867714ba-adc4-41f9-87e1-d91bc7c8d51e',
          email: 'admin2@noli.com',
          first_name: 'Admin',
          last_name: 'Two',
          role: 'ADMIN',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      logger.warn('getUsers error (non-bloquant):', error);
      return [];
    }
  },

  async updateUserRole(userId: string, role: 'USER' | 'INSURER' | 'ADMIN') {
    try {
      // Pour l'instant, simplement logger la demande
      logger.auth('updateUserRole appelé pour', userId, '->', role);
      // TODO: Implémenter la mise à jour du rôle quand la table profiles sera créée
      return { id: userId, role: role };
    } catch (error) {
      logger.error('updateUserRole error:', error);
      throw error;
    }
  },

  async deactivateUser(userId: string) {
    try {
      // Pour l'instant, simplement logger la demande
      logger.auth('deactivateUser appelé pour', userId);
      // TODO: Implémenter la désactivation quand la table profiles sera créée
      return { id: userId, is_active: false };
    } catch (error) {
      logger.error('deactivateUser error:', error);
      throw error;
    }
  },
};

// Export du client et des helpers
export default supabase;
