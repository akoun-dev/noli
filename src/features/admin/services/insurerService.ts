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

export interface InsurerStats {
  total: number
  active: number
  pending: number
  inactive: number
  suspended: number
  totalQuotes: number
  totalOffers: number
  avgConversionRate: number
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

// API Functions
export const fetchInsurers = async (): Promise<Insurer[]> => {
  try {
    logger.auth('🔍 [fetchInsurers] Starting fetch...')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'INSURER')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('🔍 [fetchInsurers] Error fetching profiles:', error)
      throw error
    }

    logger.auth('🔍 [fetchInsurers] Profiles fetched:', profiles?.length || 0)

    // Convertir les profils en assureurs et ajouter les statistiques
    const insurers = await Promise.all(
      profiles.map(async (profile) => {
        logger.auth('🔍 [fetchInsurers] Processing insurer:', profile.company_name || profile.id)

        const insurer = mapProfileToInsurer(profile)

        // Récupérer le nombre de quotes pour cet assureur
        try {
          const { count: quotesCount } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)

          insurer.quotesCount = quotesCount || 0
          logger.auth('🔍 [fetchInsurers] Quotes count for', profile.company_name, ':', quotesCount)
        } catch (err) {
          logger.warn('🔍 [fetchInsurers] Error fetching quotes for', profile.company_name, ':', err)
          insurer.quotesCount = 0
        }

        // Récupérer le nombre d'offres
        try {
          const { count: offersCount } = await supabase
            .from('insurance_offers')
            .select('*', { count: 'exact', head: true })
            .eq('insurer_id', profile.id)

          insurer.offersCount = offersCount || 0
          logger.auth('🔍 [fetchInsurers] Offers count for', profile.company_name, ':', offersCount)
        } catch (err) {
          logger.warn('🔍 [fetchInsurers] Error fetching offers for', profile.company_name, ':', err)
          insurer.offersCount = 0
        }

        insurer.conversionRate =
          insurer.quotesCount && insurer.quotesCount > 0
            ? Math.round((insurer.offersCount / insurer.quotesCount) * 10000) / 100
            : 0

        return insurer
      })
    )

    logger.auth('🔍 [fetchInsurers] Completed, returning', insurers.length, 'insurers')
    return insurers
  } catch (error) {
    logger.error('🔍 [fetchInsurers] Error in fetchInsurers:', error)
    throw error
  }
}

export const fetchInsurerById = async (id: string): Promise<Insurer> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching insurer:', error)
      throw error
    }

    // Verify the profile has INSURER role
    if (profile.role !== 'INSURER') {
      throw new Error(`Profile ${id} is not an insurer (role: ${profile.role})`)
    }

    const insurer = mapProfileToInsurer(profile)

    // Récupérer les statistiques
    const { count: quotesCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    const { count: offersCount } = await supabase
      .from('insurance_offers')
      .select('*', { count: 'exact', head: true })
      .eq('insurer_id', profile.id)

    insurer.quotesCount = quotesCount || 0
    insurer.offersCount = offersCount || 0
    insurer.conversionRate =
      quotesCount && quotesCount > 0
        ? Math.round(((offersCount || 0) / quotesCount) * 10000) / 100
        : 0

    return insurer
  } catch (error) {
    logger.error('Error in fetchInsurerById:', error)
    throw error
  }
}

export const createInsurer = async (data: InsurerFormData): Promise<Insurer> => {
  try {
    // Utiliser la fonction RPC admin_create_user
    const { data: result, error } = await supabase.rpc('admin_create_user', {
      email_param: data.email,
      first_name_param: null,
      last_name_param: null,
      company_name_param: data.companyName,
      phone_param: data.phone,
      role_param: 'INSURER',
      is_active_param: data.status === 'active',
    })

    if (error) {
      logger.error('Error creating insurer:', error)
      throw error
    }

    if (!result || result.length === 0 || !result[0].success) {
      throw new Error(result?.[0]?.message || "Erreur lors de la création de l'assureur")
    }

    // Mettre à jour les informations supplémentaires
    const insurerId = result[0].user_id
    const updates: any = {}
    if (data.description) updates.description = data.description
    if (data.website) updates.website = data.website
    if (data.licenseNumber) updates.license_number = data.licenseNumber
    if (data.address) updates.address = data.address

    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', insurerId)
    }

    // Récupérer l'assureur créé
    return await fetchInsurerById(insurerId)
  } catch (error) {
    logger.error('Error in createInsurer:', error)
    throw error
  }
}

export const updateInsurer = async (
  id: string,
  data: Partial<InsurerFormData>
): Promise<Insurer> => {
  try {
    // Utiliser la fonction RPC admin_update_user
    const updates: any = {}

    if (data.companyName !== undefined) updates.company_name = data.companyName
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.address !== undefined) updates.address = data.address
    if (data.description !== undefined) updates.description = data.description
    if (data.website !== undefined) updates.website = data.website
    if (data.licenseNumber !== undefined) updates.license_number = data.licenseNumber
    if (data.status !== undefined) updates.is_active = data.status === 'active'

    const { data: result, error } = await supabase.rpc('admin_update_user', {
      user_id_param: id,
      updates: updates,
    })

    if (error) {
      logger.error('Error updating insurer:', error)
      throw error
    }

    if (!result || result.length === 0 || !result[0].success) {
      throw new Error(result?.[0]?.message || "Erreur lors de la mise à jour de l'assureur")
    }

    // Récupérer l'assureur mis à jour
    return await fetchInsurerById(id)
  } catch (error) {
    logger.error('Error in updateInsurer:', error)
    throw error
  }
}

export const deleteInsurer = async (id: string): Promise<void> => {
  try {
    // Utiliser la fonction RPC admin_delete_user
    const { data, error } = await supabase.rpc('admin_delete_user', {
      user_id_param: id,
    })

    if (error) {
      logger.error('Error deleting insurer:', error)
      throw error
    }

    if (!data || data.length === 0 || !data[0].success) {
      throw new Error(data?.[0]?.message || "Erreur lors de la suppression de l'assureur")
    }
  } catch (error) {
    logger.error('Error in deleteInsurer:', error)
    throw error
  }
}

export const updateInsurerStatus = async (
  id: string,
  status: Insurer['status']
): Promise<Insurer> => {
  return await updateInsurer(id, { status })
}

export const approveInsurer = async (id: string): Promise<Insurer> => {
  return await updateInsurerStatus(id, 'active')
}

export const fetchInsurerStats = async (): Promise<InsurerStats> => {
  try {
    const insurers = await fetchInsurers()

    const stats = {
      total: insurers.length,
      active: insurers.filter((i) => i.status === 'active').length,
      pending: insurers.filter((i) => i.status === 'pending').length,
      inactive: insurers.filter((i) => i.status === 'inactive').length,
      suspended: insurers.filter((i) => i.status === 'suspended').length,
      totalQuotes: insurers.reduce((sum, i) => sum + i.quotesCount, 0),
      totalOffers: insurers.reduce((sum, i) => sum + i.offersCount, 0),
      avgConversionRate:
        insurers.length > 0
          ? insurers.reduce((sum, i) => sum + i.conversionRate, 0) / insurers.length
          : 0,
    }

    return stats
  } catch (error) {
    logger.error('Error in fetchInsurerStats:', error)
    throw error
  }
}

export const exportInsurers = async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
  try {
    const insurers = await fetchInsurers()

    // Create CSV content
    const headers = [
      'ID',
      'Nom',
      'Email',
      'Téléphone',
      'Adresse',
      'Site Web',
      'Licence',
      'Statut',
      'Date de création',
      'Nombre de devis',
      "Nombre d'offres",
      'Taux conversion',
    ]
    const rows = insurers.map((insurer) => [
      insurer.id,
      insurer.companyName,
      insurer.email,
      insurer.phone || '',
      insurer.address || '',
      insurer.website || '',
      insurer.licenseNumber || '',
      insurer.status,
      new Date(insurer.createdAt).toLocaleDateString('fr-FR'),
      insurer.quotesCount.toString(),
      insurer.offersCount.toString(),
      `${insurer.conversionRate}%`,
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  } catch (error) {
    logger.error('Error in exportInsurers:', error)
    throw error
  }
}

export const searchInsurers = async (query: string): Promise<Insurer[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'INSURER')
      .or(`company_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error searching insurers:', error)
      throw error
    }

    const insurers = await Promise.all(
      profiles.map(async (profile) => {
        const insurer = mapProfileToInsurer(profile)
        const { count: quotesCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)

        const { count: offersCount } = await supabase
          .from('insurance_offers')
          .select('*', { count: 'exact', head: true })
          .eq('insurer_id', profile.id)

        insurer.quotesCount = quotesCount || 0
        insurer.offersCount = offersCount || 0
        insurer.conversionRate =
          quotesCount && quotesCount > 0
            ? Math.round(((offersCount || 0) / quotesCount) * 10000) / 100
            : 0

        return insurer
      })
    )

    return insurers
  } catch (error) {
    logger.error('Error in searchInsurers:', error)
    throw error
  }
}

export const getInsurersByStatus = async (status: Insurer['status']): Promise<Insurer[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'INSURER')
      .eq('is_active', status === 'active')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching insurers by status:', error)
      throw error
    }

    const insurers = await Promise.all(
      profiles.map(async (profile) => {
        const insurer = mapProfileToInsurer(profile)
        insurer.status = status

        const { count: quotesCount } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)

        const { count: offersCount } = await supabase
          .from('insurance_offers')
          .select('*', { count: 'exact', head: true })
          .eq('insurer_id', profile.id)

        insurer.quotesCount = quotesCount || 0
        insurer.offersCount = offersCount || 0
        insurer.conversionRate =
          quotesCount && quotesCount > 0
            ? Math.round(((offersCount || 0) / quotesCount) * 10000) / 100
            : 0

        return insurer
      })
    )

    return insurers
  } catch (error) {
    logger.error('Error in getInsurersByStatus:', error)
    throw error
  }
}

export const getPendingInsurers = (): Promise<Insurer[]> => {
  return getInsurersByStatus('pending')
}

export const getActiveInsurers = (): Promise<Insurer[]> => {
  return getInsurersByStatus('active')
}

// React Query Hooks
export const useInsurers = (shouldFetch: boolean = true) => {
  logger.auth('🔍 [useInsurers] Hook called with shouldFetch:', shouldFetch)
  return useQuery({
    queryKey: ['admin-insurers'],
    queryFn: async () => {
      logger.auth('🔍 [useInsurers] Fetching insurers...')
      const result = await fetchInsurers()
      logger.auth('🔍 [useInsurers] Fetch result:', { count: result?.length || 0 })
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: shouldFetch,
  })
}

export const useInsurer = (id: string, shouldFetch: boolean = true) => {
  return useQuery({
    queryKey: ['admin-insurer', id],
    queryFn: () => fetchInsurerById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id && shouldFetch,
  })
}

export const useInsurerStats = (shouldFetch: boolean = true) => {
  return useQuery({
    queryKey: ['admin-insurer-stats'],
    queryFn: fetchInsurerStats,
    staleTime: 5 * 60 * 1000,
    enabled: shouldFetch,
  })
}

export const useCreateInsurer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInsurer,
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

export const useUpdateInsurer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsurerFormData> }) =>
      updateInsurer(id, data),
    onSuccess: () => {
      toast.success('Assureur mis à jour avec succès')
      queryClient.invalidateQueries(['admin-insurers'])
      queryClient.invalidateQueries(['admin-insurer-stats'])
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour de l'assureur")
    },
  })
}

export const useDeleteInsurer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteInsurer,
    onSuccess: () => {
      toast.success('Assureur supprimé avec succès')
      queryClient.invalidateQueries(['admin-insurers'])
      queryClient.invalidateQueries(['admin-insurer-stats'])
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression de l'assureur")
    },
  })
}

export const useUpdateInsurerStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Insurer['status'] }) =>
      updateInsurerStatus(id, status),
    onSuccess: () => {
      toast.success("Statut de l'assureur mis à jour avec succès")
      queryClient.invalidateQueries(['admin-insurers'])
      queryClient.invalidateQueries(['admin-insurer-stats'])
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du statut')
    },
  })
}

export const useApproveInsurer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveInsurer,
    onSuccess: () => {
      toast.success('Assureur approuvé avec succès')
      queryClient.invalidateQueries(['admin-insurers'])
      queryClient.invalidateQueries(['admin-insurer-stats'])
    },
    onError: (error) => {
      toast.error("Erreur lors de l'approbation de l'assureur")
    },
  })
}

export const useExportInsurers = () => {
  return useMutation({
    mutationFn: exportInsurers,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `assureurs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Assureurs exportés avec succès')
    },
    onError: (error) => {
      toast.error("Erreur lors de l'export des assureurs")
    },
  })
}

export const useSearchInsurers = () => {
  return useMutation({
    mutationFn: searchInsurers,
    onError: (error) => {
      toast.error('Erreur lors de la recherche des assureurs')
    },
  })
}
