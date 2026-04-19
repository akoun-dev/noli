import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export interface Insurer {
  id: string
  companyName: string
  email: string
  phone?: string
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
}

export interface InsurerFormData {
  companyName: string
  email: string
  phone?: string
  description?: string
  website?: string
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
  }
}

// API Functions
export const fetchInsurers = async (): Promise<Insurer[]> => {
  try {
    logger.auth('🔍 [fetchInsurers] Starting fetch...')
    const { data: insurers, error } = await supabase
      .from('insurers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('🔍 [fetchInsurers] Error fetching insurers:', error)
      throw error
    }

    logger.auth('🔍 [fetchInsurers] Insurers fetched:', insurers?.length || 0)

    // Convertir les assureurs et ajouter les statistiques
    const result = await Promise.all(
      insurers.map(async (insurerData) => {
        logger.auth('🔍 [fetchInsurers] Processing insurer:', insurerData.name || insurerData.id)

        const insurer: Insurer = {
          id: insurerData.id,
          companyName: insurerData.name || '',
          email: insurerData.contact_email || '',
          phone: insurerData.phone,
          role: 'INSURER',
          status: insurerData.is_active ? 'active' : 'inactive',
          createdAt: insurerData.created_at,
          lastLogin: insurerData.updated_at,
          profileCompleted: !!(insurerData.name && insurerData.contact_email),
          quotesCount: 0,
          offersCount: 0,
          conversionRate: 0,
          description: insurerData.description,
          website: insurerData.website,
        }

        // Récupérer le nombre d'offres pour cet assureur
        try {
          const { count: offersCount } = await supabase
            .from('insurance_offers')
            .select('*', { count: 'exact', head: true })
            .eq('insurer_id', insurerData.id)

          insurer.offersCount = offersCount || 0
          logger.auth('🔍 [fetchInsurers] Offers count for', insurerData.name, ':', offersCount)
        } catch (err) {
          logger.warn('🔍 [fetchInsurers] Error fetching offers for', insurerData.name, ':', err)
          insurer.offersCount = 0
        }

        // Récupérer le nombre de quotes associés aux offres de cet assureur
        try {
          const { data: offers } = await supabase
            .from('insurance_offers')
            .select('quote_id')
            .eq('insurer_id', insurerData.id)

          const uniqueQuoteIds = new Set(offers?.map(o => o.quote_id) || [])
          insurer.quotesCount = uniqueQuoteIds.size
          logger.auth('🔍 [fetchInsurers] Unique quotes for', insurerData.name, ':', uniqueQuoteIds.size)
        } catch (err) {
          logger.warn('🔍 [fetchInsurers] Error fetching quotes for', insurerData.name, ':', err)
          insurer.quotesCount = 0
        }

        insurer.conversionRate = 0 // Pas de conversion rate applicable pour les compagnies

        return insurer
      })
    )

    logger.auth('🔍 [fetchInsurers] Completed, returning', result.length, 'insurers')
    return result
  } catch (error) {
    logger.error('🔍 [fetchInsurers] Error in fetchInsurers:', error)
    throw error
  }
}

export const fetchInsurerById = async (id: string): Promise<Insurer> => {
  try {
    const { data: insurerData, error } = await supabase
      .from('insurers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching insurer:', error)
      throw error
    }

    const insurer: Insurer = {
      id: insurerData.id,
      companyName: insurerData.name || '',
      email: insurerData.contact_email || '',
      phone: insurerData.phone,
      role: 'INSURER',
      status: insurerData.is_active ? 'active' : 'inactive',
      createdAt: insurerData.created_at,
      lastLogin: insurerData.updated_at,
      profileCompleted: !!(insurerData.name && insurerData.contact_email),
      quotesCount: 0,
      offersCount: 0,
      conversionRate: 0,
      description: insurerData.description,
      website: insurerData.website,
    }

    // Récupérer les statistiques
    const { count: offersCount } = await supabase
      .from('insurance_offers')
      .select('*', { count: 'exact', head: true })
      .eq('insurer_id', insurerData.id)

    const { data: offers } = await supabase
      .from('insurance_offers')
      .select('quote_id')
      .eq('insurer_id', insurerData.id)

    const uniqueQuoteIds = new Set(offers?.map(o => o.quote_id) || [])

    insurer.offersCount = offersCount || 0
    insurer.quotesCount = uniqueQuoteIds.size
    insurer.conversionRate = 0

    return insurer
  } catch (error) {
    logger.error('Error in fetchInsurerById:', error)
    throw error
  }
}

export const createInsurer = async (data: InsurerFormData): Promise<Insurer> => {
  try {
    // Créer directement dans la table insurers
    const { data: insurerData, error } = await supabase
      .from('insurers')
      .insert({
        name: data.companyName,
        contact_email: data.email,
        phone: data.phone,
        description: data.description,
        website: data.website,
        is_active: data.status === 'active',
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating insurer:', error)
      throw error
    }

    return await fetchInsurerById(insurerData.id)
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
    // Préparer les mises à jour
    const updates: any = {}

    if (data.companyName !== undefined) updates.name = data.companyName
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.description !== undefined) updates.description = data.description
    if (data.website !== undefined) updates.website = data.website
    if (data.status !== undefined) updates.is_active = data.status === 'active'

    const { error } = await supabase
      .from('insurers')
      .update(updates)
      .eq('id', id)

    if (error) {
      logger.error('Error updating insurer:', error)
      throw error
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
    const { error } = await supabase
      .from('insurers')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Error deleting insurer:', error)
      throw error
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
      'Site Web',
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
      insurer.website || '',
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
    const { data: insurersData, error } = await supabase
      .from('insurers')
      .select('*')
      .or(`name.ilike.%${query}%,contact_email.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error searching insurers:', error)
      throw error
    }

    const insurers = await Promise.all(
      insurersData.map(async (insurerData) => {
        const insurer: Insurer = {
          id: insurerData.id,
          companyName: insurerData.name || '',
          email: insurerData.contact_email || '',
          phone: insurerData.phone,
          role: 'INSURER',
          status: insurerData.is_active ? 'active' : 'inactive',
          createdAt: insurerData.created_at,
          lastLogin: insurerData.updated_at,
          profileCompleted: !!(insurerData.name && insurerData.contact_email),
          quotesCount: 0,
          offersCount: 0,
          conversionRate: 0,
          description: insurerData.description,
          website: insurerData.website,
        }

        const { data: offers } = await supabase
          .from('insurance_offers')
          .select('quote_id')
          .eq('insurer_id', insurerData.id)

        const { count: offersCount } = await supabase
          .from('insurance_offers')
          .select('*', { count: 'exact', head: true })
          .eq('insurer_id', insurerData.id)

        const uniqueQuoteIds = new Set(offers?.map(o => o.quote_id) || [])

        insurer.quotesCount = uniqueQuoteIds.size
        insurer.offersCount = offersCount || 0
        insurer.conversionRate = 0

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
    const { data: insurersData, error } = await supabase
      .from('insurers')
      .select('*')
      .eq('is_active', status === 'active')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching insurers by status:', error)
      throw error
    }

    const insurers = await Promise.all(
      insurersData.map(async (insurerData) => {
        const insurer: Insurer = {
          id: insurerData.id,
          companyName: insurerData.name || '',
          email: insurerData.contact_email || '',
          phone: insurerData.phone,
              role: 'INSURER',
          status: status,
          createdAt: insurerData.created_at,
          lastLogin: insurerData.updated_at,
          profileCompleted: !!(insurerData.name && insurerData.contact_email),
          quotesCount: 0,
          offersCount: 0,
          conversionRate: 0,
          description: insurerData.description,
          website: insurerData.website,
            }

        const { data: offers } = await supabase
          .from('insurance_offers')
          .select('quote_id')
          .eq('insurer_id', insurerData.id)

        const { count: offersCount } = await supabase
          .from('insurance_offers')
          .select('*', { count: 'exact', head: true })
          .eq('insurer_id', insurerData.id)

        const uniqueQuoteIds = new Set(offers?.map(o => o.quote_id) || [])

        insurer.quotesCount = uniqueQuoteIds.size
        insurer.offersCount = offersCount || 0
        insurer.conversionRate = 0

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
