import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/data/api/authService';
import { supabase } from '@/lib/supabase';

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
    // Initialiser l'authentification avec Supabase
    const initializeAuth = async () => {
      try {
        // Vérifier la session actuelle
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Récupérer le profil complet
          const user = await authService.getCurrentUser();
          const permissions = await authService.getUserPermissions();
          
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            permissions,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Écouter les changements de session Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const user = await authService.getCurrentUser();
            const permissions = await authService.getUserPermissions();
            
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
              permissions,
            });
          } catch (error) {
            console.error('Error getting user profile after sign in:', error);
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              permissions: [],
            });
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
            console.error('Error refreshing permissions:', error);
          }
        }
      }
    );

    // Cleanup
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.login({ email, password });
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
      console.error('OAuth login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
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
      console.error('Update user error:', error);
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
      console.error('Refresh token error:', error);
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
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authService.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Reset password error:', error);
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
