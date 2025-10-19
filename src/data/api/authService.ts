import { User, LoginCredentials, RegisterData } from '@/types';
import { supabaseHelpers, supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface AuthResponse {
  user: User;
  session: unknown;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.auth('AuthService.login appelé avec email:', credentials.email);
    
    try {
      logger.auth('Étape 1: Appel de supabaseHelpers.signIn');
      const data = await supabaseHelpers.signIn(credentials.email, credentials.password);
      
      logger.auth('Étape 2: signIn réussi, user ID:', data.user?.id);
      
      // Récupérer le profil complet avec les permissions
      logger.auth('Étape 3: Appel de getProfile pour user ID:', data.user?.id);
      const profile = await supabaseHelpers.getProfile(data.user?.id);
      
      if (!profile) {
        logger.error('Étape 4: Profil utilisateur non trouvé pour:', data.user?.id);
        throw new Error('Profil utilisateur non trouvé');
      }

      logger.auth('Étape 4: Profil trouvé, rôle:', profile.role);

      // Logger la connexion
      try {
        await supabaseHelpers.logAction('LOGIN', 'session', data.user?.id);
        logger.auth('Étape 5: Action de connexion loggée');
      } catch (logError) {
        logger.warn('Étape 5: Impossible de logger l action de connexion:', logError);
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
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      logger.auth('Étape 6: Login complété avec succès pour:', user.email);
      return {
        user,
        session: data.session,
      };
    } catch (error) {
      logger.error('Login error dans AuthService:', error);
      logger.error('Détails de l erreur de login:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // S'inscrire avec Supabase Auth
      const authData = await supabaseHelpers.signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role: 'USER', // Default role for new registrations
      });

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // Logger la création du compte
      await supabaseHelpers.logAction('ACCOUNT_CREATED', 'profile', authData.user.id);

      const user: User = {
        id: authData.user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'USER',
        phone: data.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        user,
        session: authData.session,
      };
    } catch (error) {
      logger.error('Register error:', error);
      throw error;
    }
  }

  async loginWithOAuth(provider: 'google' | 'facebook' | 'github'): Promise<void> {
    try {
      await supabaseHelpers.signInWithOAuth(provider);
    } catch (error) {
      logger.error('OAuth login error:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      if (!session?.user) throw new Error('Session invalide');

      // Récupérer le profil mis à jour
      const profile = await supabaseHelpers.getProfile(session.user.id);
      
      if (!profile) {
        throw new Error('Profil utilisateur non trouvé');
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
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      return {
        user,
        session,
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Logger la déconnexion avant de se déconnecter
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabaseHelpers.logAction('LOGOUT', 'session', user.id);
      }
      
      await supabaseHelpers.signOut();
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      // Créer un token de reset personnalisé
      const resetToken = await supabaseHelpers.createPasswordResetToken(email);
      
      // Envoyer l'email de reset via Supabase
      await supabaseHelpers.resetPassword(email);
      
      logger.info(`[DEBUG] Reset token created for ${email}: ${resetToken}`);
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await supabaseHelpers.usePasswordResetToken(token, newPassword);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
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
      });

      // Logger la mise à jour du profil
      await supabaseHelpers.logAction('PROFILE_UPDATE', 'profile', profile.id, updates);

      const user: User = {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        companyName: profile.company_name,
        role: profile.role,
        phone: profile.phone,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      return user;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const profile = await supabaseHelpers.getProfile(user.id);
      
      if (!profile) return null;

      return {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        companyName: profile.company_name,
        role: profile.role,
        phone: profile.phone,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    } catch (error) {
      logger.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session && !!session.user;
    } catch (error) {
      logger.error('Check auth error:', error);
      return false;
    }
  }

  async getUserPermissions(): Promise<string[]> {
    try {
      return await supabaseHelpers.getUserPermissions();
    } catch (error) {
      logger.error('Get permissions error:', error);
      return [];
    }
  }

  async hasPermission(permission: string): Promise<boolean> {
    try {
      return await supabaseHelpers.hasPermission(permission);
    } catch (error) {
      logger.error('Check permission error:', error);
      return false;
    }
  }

  async getUserSessions(): Promise<unknown[]> {
    try {
      return await supabaseHelpers.getUserSessions();
    } catch (error) {
      logger.error('Get sessions error:', error);
      return [];
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      await supabaseHelpers.revokeSession(sessionId);
    } catch (error) {
      logger.error('Revoke session error:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();
