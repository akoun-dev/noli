import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    language: 'fr' | 'en';
    currency: 'XOF' | 'EUR' | 'USD';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

interface UserContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  getProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      getProfile();
    }
  }, [isAuthenticated, user]);

  const getProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual API call to get user profile
      const mockProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        preferences: {
          language: 'fr',
          currency: 'XOF',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      };

      setProfile(mockProfile);
    } catch (error) {
      logger.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!profile) return;

    setIsLoading(true);
    try {
      // TODO: Implement actual API call to update profile
      const updatedProfile = { ...profile, ...profileData };
      setProfile(updatedProfile);
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        isLoading,
        updateProfile,
        getProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};