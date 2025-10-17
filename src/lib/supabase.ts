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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
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
    // Utiliser l'ID de l'utilisateur connecté si aucun ID n'est fourni
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) {
      logger.warn('getProfile: No user ID provided or available');
      return null;
    }

    const { data, error } = await supabase
      .rpc('get_user_profile', {
        user_uuid: targetUserId
      });

    if (error) {
      logger.error('getProfile RPC error:', error);
      // Ne pas throw l'erreur pour éviter de bloquer l'authentification
      return null;
    }

    // La fonction retourne un tableau, prendre le premier élément
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    return null;
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
    // Utiliser l'ID de l'utilisateur connecté si aucun ID n'est fourni
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!targetUserId) {
      logger.warn('getUserPermissions: No user ID provided or available');
      return [];
    }

    const { data, error } = await supabase
      .rpc('get_user_permissions', {
        user_uuid: targetUserId
      });

    if (error) {
      logger.error('getUserPermissions RPC error:', error);
      // Ne pas throw l'erreur pour éviter de bloquer l'authentification
      return [];
    }

    // get_user_permissions retourne un tableau de permissions
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }

    return [];
  },

  async hasPermission(permission: string, userId?: string) {
    const { data, error } = await supabase
      .rpc('user_has_permission', { 
        permission_name: permission,
        target_user: userId 
      });
    
    if (error) throw error;
    return data;
  },

  // Audit logs
  async logAction(action: string, resource?: string, resourceId?: string, metadata?: AuditMetadata) {
    const { error } = await supabase
      .rpc('log_user_action', {
        user_action: action,
        resource_name: resource,
        resource_id_value: resourceId,
        metadata_value: metadata || {}
      });
    
    if (error) throw error;
  },

  // Password reset tokens
  async createPasswordResetToken(email: string) {
    const { data, error } = await supabase
      .rpc('create_password_reset_token', { 
        user_email: email 
      });
    
    if (error) throw error;
    return data;
  },

  async usePasswordResetToken(token: string, newPassword: string) {
    // D'abord valider le token avec notre fonction
    const { data, error } = await supabase
      .rpc('use_password_reset_token', { 
        token_value: token,
        new_password: newPassword
      });
    
    if (error) throw error;
    
    // Puis mettre à jour le mot de passe avec Supabase Auth
    await this.updatePassword(newPassword);
    
    return data;
  },

  // Sessions
  async getUserSessions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async revokeSession(sessionId: string) {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  // Audit logs (admin seulement)
  async getAuditLogs(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          email,
          first_name,
          last_name,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  // Utilisateurs (admin seulement)
  async getUsers(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: 'USER' | 'INSURER' | 'ADMIN') {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deactivateUser(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Export du client et des helpers
export default supabase;
