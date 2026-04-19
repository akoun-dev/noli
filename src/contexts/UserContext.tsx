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
  dateOfBirth?: string
  address?: string
  lastLogin?: string
  avatarUrl?: string
  emailVerified: boolean
  phoneVerified: boolean
  preferences: {
    language: 'fr' | 'en'
    currency: 'XOF' | 'EUR' | 'USD'
    timezone: string
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
      whatsapp: boolean
    }
    privacy: {
      profileVisible: boolean
      showEmail: boolean
      showPhone: boolean
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
    // Récupérer l'utilisateur depuis la session Supabase directement
    // pour éviter la dépendance cyclique avec AuthContext
    const { supabase } = await import('@/lib/supabase')
    const { data: { user: sessionUser } } = await supabase.auth.getUser()

    if (!sessionUser) {
      logger.debug('getProfile: no session user, skipping')
      return
    }

    const userId = sessionUser.id
    const metadata = sessionUser.user_metadata || {}

    setIsLoading(true)
    try {
      // Récupérer les données du profil depuis la table profiles
      // Utiliser maybeSingle() pour éviter l'erreur 406 quand aucun profil n'existe
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
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
          id: userId,
          firstName: metadata.first_name || user?.firstName || '',
          lastName: metadata.last_name || user?.lastName || '',
          email: sessionUser.email || '',
          phone: sessionUser.phone || metadata.phone || '',
          dateOfBirth: metadata.date_of_birth,
          address: metadata.address,
          lastLogin: user?.lastLogin?.toISOString(),
          avatarUrl: metadata.avatar_url || sessionUser.user_metadata?.avatar_url || '',
          emailVerified: !!sessionUser.email_confirmed_at,
          phoneVerified: !!sessionUser.phone,
          preferences: {
            language: metadata.language || 'fr',
            currency: metadata.currency || 'XOF',
            timezone: metadata.timezone || 'Africa/Abidjan',
            theme: metadata.theme || 'light',
            notifications: {
              email: true,
              sms: true,
              push: true,
              whatsapp: false,
            },
            privacy: {
              profileVisible: true,
              showEmail: false,
              showPhone: false,
            },
          },
        }

        setProfile(userProfile)
        setIsLoading(false)
        return
      }

      const dbData = data as any
      const prefs = dbData.preferences || {}

      const userProfile: UserProfile = {
        id: dbData.id || userId,
        firstName: dbData.first_name || metadata.first_name || user?.firstName || '',
        lastName: dbData.last_name || metadata.last_name || user?.lastName || '',
        email: dbData.email || sessionUser.email || '',
        phone: dbData.phone || sessionUser.phone || metadata.phone || '',
        dateOfBirth: dbData.date_of_birth || metadata.date_of_birth,
        address: dbData.address || metadata.address || user?.address,
        lastLogin: dbData.last_login || user?.lastLogin?.toISOString(),
        avatarUrl: dbData.avatar_url || metadata.avatar_url || '',
        emailVerified: dbData.email_verified ?? !!sessionUser.email_confirmed_at,
        phoneVerified: dbData.phone_verified ?? !!dbData.phone,
        preferences: {
          language: prefs.language || metadata.language || 'fr',
          currency: prefs.currency || metadata.currency || 'XOF',
          timezone: prefs.timezone || metadata.timezone || 'Africa/Abidjan',
          theme: prefs.theme || metadata.theme || 'light',
          notifications: {
            email: prefs.notifications?.email ?? true,
            sms: prefs.notifications?.sms ?? true,
            push: prefs.notifications?.push ?? true,
            whatsapp: prefs.notifications?.whatsapp ?? false,
          },
          privacy: {
            profileVisible: prefs.privacy?.profileVisible ?? true,
            showEmail: prefs.privacy?.showEmail ?? false,
            showPhone: prefs.privacy?.showPhone ?? false,
          },
        },
      }

      setProfile(userProfile)
      logger.info('Profile loaded successfully for user:', userId)
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
    if (!user) {
      logger.warn('updateProfile: no user, cannot update')
      return
    }

    const userId = profile?.id || user.id
    if (!userId) {
      logger.warn('updateProfile: no userId, cannot update')
      return
    }

    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')

      // Préparer les données pour la mise à jour
      const updateData: any = {}

      if (profileData.firstName) updateData.first_name = profileData.firstName
      if (profileData.lastName) updateData.last_name = profileData.lastName
      if (profileData.phone !== undefined) updateData.phone = profileData.phone
      if (profileData.address !== undefined) updateData.address = profileData.address
      if (profileData.dateOfBirth !== undefined) updateData.date_of_birth = profileData.dateOfBirth
      if (profileData.preferences) {
        // Fusionner avec les préférences existantes si disponibles
        const currentPrefs = profile?.preferences || {
          language: 'fr',
          currency: 'XOF',
          timezone: 'Africa/Abidjan',
          theme: 'light',
          notifications: {
            email: true,
            sms: true,
            push: true,
            whatsapp: false,
          },
          privacy: {
            profileVisible: true,
            showEmail: false,
            showPhone: false,
          },
        }

        updateData.preferences = {
          language: profileData.preferences.language ?? currentPrefs.language,
          currency: profileData.preferences.currency ?? currentPrefs.currency,
          timezone: profileData.preferences.timezone ?? currentPrefs.timezone,
          theme: profileData.preferences.theme ?? currentPrefs.theme,
          notifications: profileData.preferences.notifications ?? currentPrefs.notifications,
          privacy: profileData.preferences.privacy ?? currentPrefs.privacy,
        }
      }

      // Mettre à jour le profil dans la base de données
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        logger.error('Error updating profile in DB:', error)
        setIsLoading(false)
        throw error
      }

      // Mettre à jour le state local
      const updatedProfile: UserProfile = {
        ...(profile || {
          id: userId,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone,
          dateOfBirth: undefined,
          address: user.address,
          lastLogin: user.lastLogin?.toISOString(),
          avatarUrl: user.avatar || '',
          emailVerified: user.emailVerified ?? true,
          phoneVerified: user.phoneVerified ?? false,
          preferences: {
            language: 'fr',
            currency: 'XOF',
            timezone: 'Africa/Abidjan',
            theme: 'light',
            notifications: {
              email: true,
              sms: true,
              push: true,
              whatsapp: false,
            },
            privacy: {
              profileVisible: true,
              showEmail: false,
              showPhone: false,
            },
          },
        }),
        ...profileData,
        id: userId,
        firstName: profileData.firstName ?? profile?.firstName ?? user.firstName ?? '',
        lastName: profileData.lastName ?? profile?.lastName ?? user.lastName ?? '',
        email: profileData.email ?? profile?.email ?? user.email ?? '',
        phone: profileData.phone ?? profile?.phone ?? user.phone,
        dateOfBirth: profileData.dateOfBirth ?? profile?.dateOfBirth ?? undefined,
        address: profileData.address ?? profile?.address ?? user.address ?? undefined,
        preferences: profileData.preferences ?? profile?.preferences,
      }

      setProfile(updatedProfile)
      logger.info('Profile updated successfully for user:', userId)
    } catch (error) {
      logger.error('Error updating profile:', error)
      setIsLoading(false)
      throw error
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
