import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { logger } from '@/lib/logger'
import { ProfileUpdate } from '@/types/database'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: Date
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  preferences: {
    language: 'fr' | 'en'
    currency: 'XOF' | 'EUR' | 'USD'
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
}

interface UserContextType {
  profile: UserProfile | null
  isLoading: boolean
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>
  getProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getProfile = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')

      // Récupérer les données du profil depuis la table profiles
      // Utiliser maybeSingle() pour éviter l'erreur 406 quand aucun profil n'existe
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        logger.error('Error fetching profile from DB:', error)
        logger.warn('Profil non trouvé dans la table profiles, fallback sur métadonnées:', error.message)
        // Continuer avec les métadonnées utilisateur si la table profiles n'a pas de données
      }

      if (!data) {
        logger.warn('Profil non trouvé dans la table profiles, fallback sur métadonnées')
        // Utiliser les métadonnées de l'utilisateur comme fallback
        const userProfile: UserProfile = {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          dateOfBirth: undefined,
          address: undefined,
          preferences: {
            language: 'fr',
            currency: 'XOF',
            notifications: {
              email: true,
              sms: true,
              push: true,
            },
          },
        }

        setProfile(userProfile)
        setIsLoading(false)
        return
      }

      const dbData = data as any
      const userProfile: UserProfile = {
        id: dbData.id || user.id,
        firstName: dbData.first_name || user.firstName || '',
        lastName: dbData.last_name || user.lastName || '',
        email: dbData.email || user.email || '',
        phone: dbData.phone || user.phone || '',
        dateOfBirth: undefined, // Pas dans la table profiles actuelle
        address: undefined, // Pas dans la table profiles actuelle
        preferences: {
          language: 'fr',
          currency: 'XOF',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      }

      setProfile(userProfile)
      logger.info('Profile loaded successfully for user:', user.id)
    } catch (error) {
      logger.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated && user) {
      getProfile()
    }
  }, [isAuthenticated, user, getProfile])

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!profile) return

    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')

      // Préparer les données pour la mise à jour
      const updateData: ProfileUpdate = {}

      if (profileData.firstName) updateData.first_name = profileData.firstName
      if (profileData.lastName) updateData.last_name = profileData.lastName
      if (profileData.phone) updateData.phone = profileData.phone
      // Les champs date_of_birth, address et preferences ne sont pas dans la table actuelle
      // TODO: Ajouter ces champs dans une migration si nécessaire

      // Mettre à jour le profil dans la base de données en utilisant une approche de contournement
      // pour les problèmes de types TypeScript avec Supabase
      const { data, error } = await (supabase.from('profiles') as any)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (error) {
        logger.error('Error updating profile in DB:', error)
        setIsLoading(false)
        return
      }

      // Mettre à jour le state local
      const updatedProfile: UserProfile = {
        ...profile,
        ...profileData,
        id: profile.id,
        firstName: profileData.firstName || profile.firstName,
        lastName: profileData.lastName || profile.lastName,
        email: profileData.email || profile.email,
        phone: profileData.phone || profile.phone,
        dateOfBirth: profile.dateOfBirth,
        address: profile.address,
        preferences: profileData.preferences || profile.preferences,
      }

      setProfile(updatedProfile)
      logger.info('Profile updated successfully for user:', profile.id)
    } catch (error) {
      logger.error('Error updating profile:', error)
      setIsLoading(false)
      return
    } finally {
      setIsLoading(false)
    }
  }

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
  )
}

// Hook exporté séparément pour éviter le warning react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
