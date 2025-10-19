import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/data/api/authService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { secureAuthService } from '@/lib/secure-auth';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (userData: Partial<User> & { password: string }) => Promise<User>;
  loginWithOAuth: (provider: 'google' | 'facebook' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User>;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
  });

  useEffect(() => {
    // Initialiser l'authentification sécurisée avec Supabase
    const initializeAuth = async () => {
      try {
        logger.auth('Initializing secure auth...');

        // Initialiser l'authentification sécurisée
        secureAuthService.initializeSecureAuth();

        // Nettoyer les anciens tokens localStorage et migrer vers les cookies
        await secureAuthService.migrateToSecureStorage();

        // Vérifier la session actuelle
        const { data: { session }, error } = await supabase.auth.getSession();

        logger.auth('Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error
        });

        if (session?.user) {
          // Pour l'initialisation, utiliser directement les données de la session
          // pour éviter les problèmes avec les appels RPC au chargement
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
          };

          logger.auth('Setting user state for:', session.user.email);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions: [], // Sera chargé plus tard si nécessaire
          });

          // Essayer de charger les permissions en arrière-plan sans bloquer
          try {
            const permissions = await authService.getUserPermissions();
            logger.auth('Permissions loaded:', permissions.length);
            setState(prev => ({ ...prev, permissions }));
          } catch (error) {
            logger.warn('Could not load permissions on init:', error);
          }
        } else {
          logger.auth('No session found, setting unauthenticated state');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Écouter les changements de session Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed:', {
          event,
          userId: session?.user?.id,
          hasSession: !!session,
          userEmail: session?.user?.email
        });

        if (event === 'SIGNED_IN' && session?.user) {
          logger.auth('Processing SIGNED_IN event for:', session.user.email);

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
          };

          logger.auth('Setting state from session data (no RPC calls)');
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions: [], // Sera chargé en arrière-plan
          });

          // Charger les permissions en arrière-plan sans bloquer
          try {
            logger.auth('Loading permissions in background...');
            const permissions = await authService.getUserPermissions();
            logger.auth('Background permissions loaded:', permissions.length);
            setState(prev => ({ ...prev, permissions }));
          } catch (error) {
            logger.warn('Could not load permissions in background:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],
          });
        } else if (event === 'TOKEN_REFRESHED') {
          // Rafraîchir les permissions après le refresh du token
          try {
            const permissions = await authService.getUserPermissions();
            setState(prev => ({ ...prev, permissions }));
          } catch (error) {
            logger.error('Error refreshing permissions:', error);
          }
        }
      }
    );

    // Cleanup
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext.login appelé avec:', email);
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('📞 Appel de authService.login...');
      const response = await authService.login({ email, password });
      console.log('✅ authService.login réussi:', response.user);

      console.log('📞 Chargement des permissions...');
      const permissions = await authService.getUserPermissions();
      console.log('✅ Permissions chargées:', permissions);

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      });

      console.log('🎉 État mis à jour, retour de l\'utilisateur:', response.user);
      return response.user;
    } catch (error) {
      console.error('❌ Erreur dans AuthContext.login:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const registerData = {
        email: userData.email!,
        password: userData.password,
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        phone: userData.phone,
      };

      const response = await authService.register(registerData);
      const permissions = await authService.getUserPermissions();

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      });
      
      return response.user;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
    try {
      await authService.loginWithOAuth(provider);
      // Le redirigement et la mise à jour de l'état seront gérés par le callback OAuth
    } catch (error) {
      logger.error('OAuth login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      });
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      return updatedUser;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      const permissions = await authService.getUserPermissions();
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        permissions,
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: [],
      });
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission);
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authService.resetPassword(token, newPassword);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  };

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
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
