import { supabase } from '@/lib/supabase'
import {
  Database,
  InsuranceOffer as DBInsuranceOffer,
  Insurer as DBInsurer,
  InsuranceCategory as DBInsuranceCategory,
} from '@/types/database'
import { logger } from '@/lib/logger'
import { coverageTarificationService } from '@/services/coverageTarificationService'

// Types pour les offres
export interface Offer {
  id: string
  insurer_id: string
  category_id: string
  name: string
  description: string | null
  price_min: number | null
  price_max: number | null
  coverage_amount: number | null
  deductible: number
  is_active: boolean
  features: string[] | null
  contract_type: string | null
  logo_url?: string
  insurer_name?: string
  category_name?: string
  created_at: string
  updated_at: string
}

export interface Insurer {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  rating: number | null
  is_active: boolean
  contact_email: string | null
  phone: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface OfferCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface OfferFormData {
  name: string
  description: string
  insurer_id: string
  category_id: string
  price_min: number
  price_max: number
  coverage_amount: number
  deductible: number
  is_active: boolean
  features: string[]
  contract_type: string
}

export interface OfferFilters {
  category_id?: string
  insurer_id?: string
  is_active?: boolean
  contract_type?: string
  price_min?: number
  price_max?: number
  search?: string
  limit?: number
  offset?: number
}

export interface OfferAnalytics {
  offer_id: string
  period: string
  views: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  conversion_rate: number
  average_position: number
}

export interface OfferStats {
  total: number
  active: number
  pending: number
  draft: number
  inactive: number
  total_clicks: number
  total_conversions: number
  avg_conversion_rate: number
  total_revenue: number
  top_performing: Offer[]
}

// Types pour les assureurs
export interface InsurerOfferInput {
  name: string
  type: 'Tiers Simple' | 'Tiers +' | 'Tous Risques'
  price: number
  coverage: string
  description: string
  deductible: number
  maxCoverage: number
  duration: number
  features: string[]
  conditions?: string
  isActive?: boolean
}

const typeToContract: Record<string, string> = {
  'Tiers Simple': 'basic',
  'Tiers +': 'third_party_plus',
  'Tous Risques': 'all_risks',
}

// Helper functions
function mapDbToOffer(
  db: DBInsuranceOffer,
  insurer?: DBInsurer,
  category?: DBInsuranceCategory
): Offer {
  return {
    id: db.id,
    insurer_id: db.insurer_id,
    category_id: db.category_id,
    name: db.name,
    description: db.description,
    price_min: db.price_min,
    price_max: db.price_max,
    coverage_amount: db.coverage_amount,
    deductible: db.deductible,
    is_active: db.is_active,
    features: db.features,
    contract_type: db.contract_type,
    logo_url: insurer?.logo_url || undefined,
    insurer_name: insurer?.name || undefined,
    category_name: category?.name || undefined,
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

function mapOfferToDb(
  offer: OfferFormData
): Omit<DBInsuranceOffer, 'id' | 'created_at' | 'updated_at'> {
  return {
    insurer_id: offer.insurer_id,
    category_id: offer.category_id,
    name: offer.name,
    description: offer.description,
    price_min: offer.price_min,
    price_max: offer.price_max,
    coverage_amount: offer.coverage_amount,
    deductible: offer.deductible,
    is_active: offer.is_active,
    features: offer.features,
    contract_type: offer.contract_type,
  }
}

function mapDbToInsurer(db: DBInsurer): Insurer {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    logo_url: db.logo_url,
    rating: db.rating,
    is_active: db.is_active,
    contact_email: db.contact_email,
    phone: db.phone,
    website: db.website,
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

function mapDbToCategory(db: DBInsuranceCategory): OfferCategory {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    icon: db.icon,
    created_at: db.created_at,
    updated_at: db.updated_at,
  }
}

// Service Supabase direct
const offerService = {
  // Récupérer l'ID de l'assureur actuel
  async getCurrentInsurerId(): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_current_insurer_id')
      if (error) throw error
      return (data as string) || null
    } catch (e) {
      logger.error('getCurrentInsurerId error:', e)
      return null
    }
  },

  // Récupérer toutes les offres publiques
  async getPublicOffers(filters?: OfferFilters): Promise<Offer[]> {
    let query = supabase
      .from('insurance_offers')
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    // Appliquer les filtres
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id)
    }

    if (filters?.contract_type) {
      query = query.eq('contract_type', filters.contract_type)
    }

    if (filters?.price_min) {
      query = query.gte('price_min', filters.price_min)
    }

    if (filters?.price_max) {
      query = query.lte('price_max', filters.price_max)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erreur lors de la récupération des offres publiques: ${error.message}`)
    }

    return (data || []).map((offer) =>
      mapDbToOffer(offer, offer.insurers, offer.insurance_categories)
    )
  },

  // Récupérer les offres de l'assureur connecté
  async getInsurerOffers(): Promise<Offer[]> {
    const insurerId = await this.getCurrentInsurerId()
    if (!insurerId) return []

    const { data, error } = await supabase
      .from('insurance_offers')
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .eq('insurer_id', insurerId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération des offres de l'assureur: ${error.message}`)
    }

    return (data || []).map((offer) =>
      mapDbToOffer(offer, offer.insurers, offer.insurance_categories)
    )
  },

  // Récupérer toutes les offres (admin)
  async getAllOffers(filters?: OfferFilters): Promise<Offer[]> {
    let query = supabase
      .from('insurance_offers')
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .order('updated_at', { ascending: false })

    // Appliquer les filtres
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.contract_type) {
      query = query.eq('contract_type', filters.contract_type)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erreur lors de la récupération des offres: ${error.message}`)
    }

    return (data || []).map((offer) =>
      mapDbToOffer(offer, offer.insurers, offer.insurance_categories)
    )
  },

  // Récupérer une offre par son ID
  async getOfferById(id: string): Promise<Offer> {
    const { data, error } = await supabase
      .from('insurance_offers')
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Offre non trouvée')
      }
      throw new Error(`Erreur lors de la récupération de l'offre: ${error.message}`)
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories)
  },

  // Créer une offre (assureur)
  async createInsurerOffer(input: InsurerOfferInput): Promise<Offer> {
    const insurerId = await this.getCurrentInsurerId()
    if (!insurerId) {
      throw new Error('Assureur introuvable pour le compte en cours')
    }

    // Trouver la catégorie auto (ou créer une logique plus sophistiquée)
    const { data: category } = await supabase
      .from('insurance_categories')
      .select('id')
      .eq('name', 'Auto')
      .single()

    const categoryId = category?.id || 'auto'

    const { data, error } = await supabase
      .from('insurance_offers')
      .insert({
        insurer_id: insurerId,
        category_id: categoryId,
        name: input.name,
        description: input.description,
        price_min: input.price,
        price_max: input.price,
        coverage_amount: input.maxCoverage,
        deductible: input.deductible,
        is_active: input.isActive ?? true,
        features: input.features,
        contract_type: typeToContract[input.type] || 'basic',
      } as any)
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de l'offre: ${error.message}`)
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories)
  },

  // Créer une offre (admin)
  async createOffer(offerData: OfferFormData): Promise<Offer> {
    const dbData = mapOfferToDb(offerData)

    const { data, error } = await supabase
      .from('insurance_offers')
      .insert(dbData)
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de l'offre: ${error.message}`)
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories)
  },

  // Mettre à jour une offre (assureur)
  async updateInsurerOffer(offerId: string, input: Partial<InsurerOfferInput>): Promise<Offer> {
    const updates: Partial<DBInsuranceOffer> = {
      name: input.name,
      description: input.description,
      price_min: input.price,
      price_max: input.price,
      coverage_amount: input.maxCoverage,
      deductible: input.deductible,
      is_active: input.isActive,
      features: input.features,
      contract_type: input.type ? typeToContract[input.type] || 'basic' : undefined,
      updated_at: new Date().toISOString(),
    }

    // Nettoyer les valeurs undefined
    Object.keys(updates).forEach(
      (key) =>
        updates[key as keyof DBInsuranceOffer] === undefined &&
        delete updates[key as keyof DBInsuranceOffer]
    )

    const { data, error } = await supabase
      .from('insurance_offers')
      .update(updates as any)
      .eq('id', offerId)
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Offre non trouvée')
      }
      throw new Error(`Erreur lors de la mise à jour de l'offre: ${error.message}`)
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories)
  },

  // Mettre à jour une offre (admin)
  async updateOffer(offerId: string, updates: Partial<OfferFormData>): Promise<Offer> {
    const dbUpdates = mapOfferToDb(updates as any)

    const { data, error } = await supabase
      .from('insurance_offers')
      .update(dbUpdates as any)
      .eq('id', offerId)
      .select(
        `
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `
      )
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Offre non trouvée')
      }
      throw new Error(`Erreur lors de la mise à jour de l'offre: ${error.message}`)
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories)
  },

  // Supprimer une offre
  async deleteOffer(offerId: string): Promise<void> {
    const { error } = await supabase.from('insurance_offers').delete().eq('id', offerId)

    if (error) {
      throw new Error(`Erreur lors de la suppression de l'offre: ${error.message}`)
    }
  },

  // Mettre à jour le statut d'une offre
  async updateOfferStatus(offerId: string, status: boolean): Promise<Offer> {
    return this.updateOffer(offerId, { is_active: status } as OfferFormData)
  },

  // Récupérer les assureurs
  async getInsurers(): Promise<Insurer[]> {
    const { data, error } = await supabase
      .from('insurers')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(`Erreur lors de la récupération des assureurs: ${error.message}`)
    }

    return (data || []).map(mapDbToInsurer)
  },

  // Récupérer les catégories
  async getCategories(): Promise<OfferCategory[]> {
    const { data, error } = await supabase.from('insurance_categories').select('*').order('name')

    if (error) {
      throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`)
    }

    return (data || []).map(mapDbToCategory)
  },

  // Dupliquer une offre
  async duplicateOffer(offerId: string): Promise<Offer> {
    const original = await this.getOfferById(offerId)

    const duplicatedData: OfferFormData = {
      name: `${original.name} (Copie)`,
      description: original.description || '',
      insurer_id: original.insurer_id,
      category_id: original.category_id,
      price_min: original.price_min || 0,
      price_max: original.price_max || 0,
      coverage_amount: original.coverage_amount || 0,
      deductible: original.deductible,
      is_active: false, // Inactif par défaut
      features: original.features || [],
      contract_type: original.contract_type || 'basic',
    }

    return this.createOffer(duplicatedData)
  },

  // Exporter les offres
  async exportOffers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const offers = await this.getAllOffers()

    // Créer le contenu CSV
    const headers = [
      'ID',
      'Nom',
      'Assureur',
      'Catégorie',
      'Prix min',
      'Prix max',
      'Couverture',
      'Franchise',
      'Statut',
      'Type de contrat',
      'Date de création',
    ]

    const rows = offers.map((offer) => [
      offer.id,
      offer.name,
      offer.insurer_name || '',
      offer.category_name || '',
      (offer.price_min || 0).toString(),
      (offer.price_max || 0).toString(),
      (offer.coverage_amount || 0).toString(),
      offer.deductible.toString(),
      offer.is_active ? 'Actif' : 'Inactif',
      offer.contract_type || '',
      new Date(offer.created_at).toLocaleDateString('fr-FR'),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    return new Blob([csvContent], { type: 'text/csv' })
  },

  // Récupérer les statistiques des offres
  async getOfferStats(): Promise<OfferStats> {
    const { data: offers, error } = await supabase
      .from('insurance_offers')
      .select('is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(100) // Limiter pour les performances

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
    }

    const total = offers?.length || 0
    const active = offers?.filter((o) => o.is_active).length || 0
    const inactive = total - active

    // Pour les données plus complexes, on pourrait utiliser des vues ou des fonctions
    return {
      total,
      active,
      pending: 0, // À implémenter si nécessaire
      draft: 0, // À implémenter si nécessaire
      inactive,
      total_clicks: 0, // À implémenter avec analytics
      total_conversions: 0,
      avg_conversion_rate: 0,
      total_revenue: 0,
      top_performing: [], // À implémenter avec analytics
    }
  },

  // Récupérer les devis d'un utilisateur avec couverture par garantie
  async getUserQuotes(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select(
        `
        *,
        insurance_categories(name, icon),
        quote_coverage_premiums(
          id,
          coverage_id,
          premium_amount,
          is_included,
          coverages(
            type,
            name,
            calculation_type,
            is_mandatory
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération des devis: ${error.message}`)
    }

    // Transformer les données pour correspondre à l'interface attendue
    return (data || []).map((quote: any) => {
      // Calculer le prix total basé sur les garanties sélectionnées
      const coveragePremiums = quote.quote_coverage_premiums || [];
      const selectedPremiums = coveragePremiums.filter((cp: any) => cp.is_included);
      const totalPrice = selectedPremiums.reduce((sum: number, cp: any) => sum + (cp.premium_amount || 0), 0);

      // Extraire les garanties pour l'affichage
      const selectedCoverages = selectedPremiums.map((cp: any) => cp.coverages?.name || cp.coverage_id).filter(Boolean);

      return {
        id: quote.id,
        insurerName: 'Assureur', // À récupérer depuis les offres associées plus tard
        offerName: quote.insurance_categories?.name || 'Devis',
        category: quote.insurance_categories?.name || 'Non spécifié',
        status: quote.status,
        price: {
          monthly: Math.round(totalPrice / 12),
          annual: totalPrice,
        },
        createdAt: new Date(quote.created_at),
        validUntil: new Date(quote.valid_until || Date.now() + 30 * 24 * 60 * 60 * 1000),
        vehicleInfo:
          quote.vehicle_data?.marque && quote.vehicle_data?.modele
            ? `${quote.vehicle_data.marque} ${quote.vehicle_data.modele}`
            : undefined,
        // Nouvelles propriétés pour la tarification par garantie
        selectedCoverages,
        coverageCount: selectedCoverages.length,
        totalPremium: totalPrice,
        estimatedPrice: quote.estimated_price, // Garder pour compatibilité
        vehicleData: quote.vehicle_data,
        coverageData: quote.coverage_requirements,
      };
    });
  },

  // Créer un devis avec le système de tarification par garantie
  async createQuoteWithCoverage(quoteData: {
    user_id: string;
    category_id: string;
    personal_data: any;
    vehicle_data: any;
    coverage_requirements: any;
    selected_coverages?: Array<{
      coverage_id: string;
      is_included: boolean;
      formula_name?: string;
    }>;
  }): Promise<any> {
    try {
      // Créer le devis principal
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: quoteData.user_id,
          category_id: quoteData.category_id,
          status: 'DRAFT',
          personal_data: quoteData.personal_data,
          vehicle_data: quoteData.vehicle_data,
          coverage_requirements: quoteData.coverage_requirements,
        })
        .select()
        .single();

      if (quoteError) {
        throw new Error(`Erreur lors de la création du devis: ${quoteError.message}`);
      }

      // Ajouter les garanties si spécifiées
      if (quoteData.selected_coverages && quoteData.selected_coverages.length > 0) {
        for (const coverage of quoteData.selected_coverages) {
          await coverageTarificationService.addCoverageToQuote(
            quote.id,
            coverage.coverage_id,
            {
              ...quoteData.vehicle_data,
              ...(coverage.formula_name && { formula_name: coverage.formula_name })
            },
            coverage.is_included
          );
        }
      }

      // Calculer et mettre à jour le prix total
      const totalPremium = await coverageTarificationService.calculateQuoteTotalPremium(quote.id);

      // Mettre à jour le devis avec le prix calculé
      await supabase
        .from('quotes')
        .update({
          estimated_price: totalPremium,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      return {
        ...quote,
        estimated_price: totalPremium,
        total_premium: totalPremium,
      };
    } catch (error) {
      logger.error('Error creating quote with coverage:', error);
      throw error;
    }
  },
}

export default offerService
