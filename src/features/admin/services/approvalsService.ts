import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Types pour les approbations
export interface PendingApproval {
  id: string
  type: 'user' | 'insurer' | 'offer' | 'quote'
  name: string
  email?: string
  description: string
  priority: 'high' | 'medium' | 'low'
  submitted: string
  data: any
}

// Fonctions pour récupérer les approbations en attente
export const fetchPendingApprovals = async (): Promise<PendingApproval[]> => {
  try {
    const approvals: PendingApproval[] = []

    // 1. Récupérer les assureurs en attente de validation
    const { data: pendingInsurers, error: insurersError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        company_name,
        first_name,
        last_name,
        created_at,
        phone
      `
      )
      .eq('role', 'INSURER')
      .eq('is_active', false)
      .order('created_at', { ascending: false })

    if (!insurersError && pendingInsurers) {
      pendingInsurers.forEach((insurer) => {
        approvals.push({
          id: insurer.id,
          type: 'insurer',
          name: insurer.company_name || `${insurer.first_name} ${insurer.last_name}`,
          email: insurer.email,
          description: `Nouvel assureur en attente de validation`,
          priority: 'high',
          submitted: new Date(insurer.created_at).toLocaleDateString('fr-FR'),
          data: insurer,
        })
      })
    }

    // 2. Récupérer les offres en brouillon
    const { data: draftOffers, error: offersError } = await supabase
      .from('insurance_offers')
      .select(
        `
        id,
        name,
        insurer_id,
        created_at,
        description
      `
      )
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!offersError && draftOffers) {
      // Récupérer les noms des assureurs
      const insurerIds = [...new Set(draftOffers.map((offer) => offer.insurer_id))]
      const { data: insurerProfiles } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', insurerIds)

      draftOffers.forEach((offer) => {
        const insurer = insurerProfiles?.find((p) => p.id === offer.insurer_id)
        approvals.push({
          id: offer.id,
          type: 'offer',
          name: offer.name,
          description: `Offre en brouillon par ${insurer?.company_name || 'Assureur inconnu'}`,
          priority: 'medium',
          submitted: new Date(offer.created_at).toLocaleDateString('fr-FR'),
          data: {
            ...offer,
            insurer_name: insurer?.company_name,
          },
        })
      })
    }

    // 3. Récupérer les utilisateurs récemment inscrits (moins de 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: recentUsers, error: usersError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        created_at
      `
      )
      .eq('role', 'USER')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (!usersError && recentUsers) {
      recentUsers.forEach((user) => {
        approvals.push({
          id: user.id,
          type: 'user',
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          description: 'Nouvel utilisateur à vérifier',
          priority: 'low',
          submitted: new Date(user.created_at).toLocaleDateString('fr-FR'),
          data: user,
        })
      })
    }

    // Trier par priorité puis par date
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return approvals.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(b.submitted).getTime() - new Date(a.submitted).getTime()
    })
  } catch (error) {
    logger.error('Error fetching pending approvals:', error)
    return []
  }
}

// Fonction pour approuver un assureur
export const approveInsurer = async (insurerId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', insurerId)
      .eq('role', 'INSURER')

    if (error) {
      logger.error('Error approving insurer:', error)
      return false
    }

    // Logger l'action
    await supabase.rpc('log_admin_action', {
      action_name: 'APPROVE_INSURER',
      resource_type: 'profile',
      resource_id: insurerId,
      new_values: { is_active: true },
    })

    return true
  } catch (error) {
    logger.error('Error in approveInsurer:', error)
    return false
  }
}

// Fonction pour approuver une offre
export const approveOffer = async (offerId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('insurance_offers')
      .update({ is_active: true })
      .eq('id', offerId)

    if (error) {
      logger.error('Error approving offer:', error)
      return false
    }

    // Logger l'action
    await supabase.rpc('log_admin_action', {
      action_name: 'APPROVE_OFFER',
      resource_type: 'insurance_offer',
      resource_id: offerId,
      new_values: { is_active: true },
    })

    return true
  } catch (error) {
    logger.error('Error in approveOffer:', error)
    return false
  }
}

// Fonction pour rejeter une approbation
export const rejectApproval = async (
  approval: PendingApproval,
  reason?: string
): Promise<boolean> => {
  try {
    switch (approval.type) {
      case 'insurer':
        // Marquer l'assureur comme inactif (rejeté)
        const { error: insurerError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', approval.id)

        if (insurerError) throw insurerError
        break

      case 'offer':
        // Supprimer l'offre en brouillon
        const { error: offerError } = await supabase
          .from('insurance_offers')
          .delete()
          .eq('id', approval.id)

        if (offerError) throw offerError
        break

      case 'user':
        // Pas de rejet pour les utilisateurs, juste une vérification manuelle
        logger.info(`User ${approval.name} marked as verified`)
        break
    }

    // Logger l'action
    await supabase.rpc('log_admin_action', {
      action_name: 'REJECT_APPROVAL',
      resource_type: approval.type,
      resource_id: approval.id,
      new_values: {
        rejected: true,
        reason: reason || "Rejeté par l'administrateur",
        rejected_at: new Date().toISOString(),
      },
    })

    return true
  } catch (error) {
    logger.error('Error rejecting approval:', error)
    return false
  }
}

// React Query Hooks
export const usePendingApprovals = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['admin-pending-approvals'],
    queryFn: fetchPendingApprovals,
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

export const useApproveInsurer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveInsurer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['admin-top-insurers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] })
    },
  })
}

export const useApproveOffer = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] })
    },
  })
}

export const useRejectApproval = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ approval, reason }: { approval: PendingApproval; reason?: string }) =>
      rejectApproval(approval, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-approvals'] })
    },
  })
}
