import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/data/api/authService';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (userData: Partial<User>) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored auth token and validate it
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('noli:auth_token');
        const userStr = localStorage.getItem('noli:user');

        if (token && userStr) {
          const user = JSON.parse(userStr) as User;
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
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
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authService.login({ email, password });

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.user;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (userData: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const registerData = {
        email: userData.email!,
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        phone: userData.phone,
      };

      const response = await authService.register(registerData);

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.user;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
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
