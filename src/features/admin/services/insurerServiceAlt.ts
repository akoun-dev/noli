import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface Insurer {
  id: string
  companyName: string
  email: string
  phone?: string
  address?: string
  role: 'INSURER'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  createdAt: string
  lastLogin: string
  profileCompleted: boolean
  quotesCount: number
  offersCount: number
  conversionRate: number
  description?: string
  website?: string
  licenseNumber?: string
}

export interface InsurerFormData {
  companyName: string
  email: string
  phone?: string
  address?: string
  description?: string
  website?: string
  licenseNumber?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
}

// Helper functions
const mapProfileToInsurer = (profile: any): Insurer => {
  const isActive = profile.is_active
  const status = isActive ? 'active' : 'pending'

  return {
    id: profile.id,
    companyName: profile.company_name || '',
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    role: 'INSURER',
    status: status as Insurer['status'],
    createdAt: profile.created_at,
    lastLogin: profile.last_login || profile.created_at,
    profileCompleted: !!(profile.company_name && profile.phone && profile.email),
    quotesCount: 0, // Sera calculé séparément
    offersCount: 0, // Sera calculé séparément
    conversionRate: 0, // Sera calculé séparément
    description: profile.description,
    website: profile.website,
    licenseNumber: profile.license_number,
  }
}

// Alternative createInsurer function that uses the new RPC
export const createInsurerWithProfile = async (data: InsurerFormData): Promise<Insurer> => {
  try {
    // Utiliser la nouvelle fonction RPC qui retourne le profil complet
    const { data: result, error } = await supabase.rpc('create_insurer_with_profile', {
      email_param: data.email,
      company_name_param: data.companyName,
      phone_param: data.phone,
      description_param: data.description,
      website_param: data.website,
      license_number_param: data.licenseNumber,
      address_param: data.address,
      is_active_param: data.status === 'active',
    })

    if (error) {
      logger.error('Error creating insurer with profile:', error)
      throw error
    }

    if (!result || result.length === 0 || !result[0].success) {
      throw new Error(result?.[0]?.message || "Erreur lors de la création de l'assureur")
    }

    // Utiliser le profil retourné directement
    const profile = result[0].profile
    const insurer = mapProfileToInsurer(profile)

    // Récupérer les statistiques (quotes et offers)
    const { count: quotesCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', insurer.id)

    const { count: offersCount } = await supabase
      .from('insurance_offers')
      .select('*', { count: 'exact', head: true })
      .eq('insurer_id', insurer.id)

    insurer.quotesCount = quotesCount || 0
    insurer.offersCount = offersCount || 0
    insurer.conversionRate =
      quotesCount && quotesCount > 0
        ? Math.round(((offersCount || 0) / quotesCount) * 10000) / 100
        : 0

    return insurer
  } catch (error) {
    logger.error('Error in createInsurerWithProfile:', error)
    throw error
  }
}

// React Query Hook for the alternative function
export const useCreateInsurerWithProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInsurerWithProfile,
    onSuccess: () => {
      toast.success('Assureur créé avec succès')
      queryClient.invalidateQueries(['admin-insurers'])
      queryClient.invalidateQueries(['admin-insurer-stats'])
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de l'assureur")
    },
  })
}