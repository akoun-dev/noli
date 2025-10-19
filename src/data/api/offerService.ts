import { supabase } from '@/lib/supabase';
import { Database, DatabaseInsuranceOffer, DatabaseInsurer, DatabaseInsuranceCategory } from '@/types/database';
import { FallbackService } from '@/lib/api/fallback';
import { features } from '@/lib/config/features';

// Types pour les offres
export interface Offer {
  id: string;
  insurer_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  coverage_amount: number | null;
  deductible: number;
  is_active: boolean;
  features: string[] | null;
  contract_type: string | null;
  logo_url?: string;
  insurer_name?: string;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Insurer {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  rating: number | null;
  is_active: boolean;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferFormData {
  name: string;
  description: string;
  insurer_id: string;
  category_id: string;
  price_min: number;
  price_max: number;
  coverage_amount: number;
  deductible: number;
  is_active: boolean;
  features: string[];
  contract_type: string;
}

export interface OfferFilters {
  category_id?: string;
  insurer_id?: string;
  is_active?: boolean;
  contract_type?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OfferAnalytics {
  offer_id: string;
  period: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  average_position: number;
}

export interface OfferStats {
  total: number;
  active: number;
  pending: number;
  draft: number;
  inactive: number;
  total_clicks: number;
  total_conversions: number;
  avg_conversion_rate: number;
  total_revenue: number;
  top_performing: Offer[];
}

// Types pour les assureurs
export interface InsurerOfferInput {
  name: string;
  type: 'Tiers Simple' | 'Tiers +' | 'Tous Risques';
  price: number;
  coverage: string;
  description: string;
  deductible: number;
  maxCoverage: number;
  duration: number;
  features: string[];
  conditions?: string;
  isActive?: boolean;
}

const typeToContract: Record<string, string> = {
  'Tiers Simple': 'basic',
  'Tiers +': 'third_party_plus',
  'Tous Risques': 'all_risks',
};

// Helper functions
function mapDbToOffer(db: DatabaseInsuranceOffer, insurer?: DatabaseInsurer, category?: DatabaseInsuranceCategory): Offer {
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
  };
}

function mapOfferToDb(offer: OfferFormData): Omit<DatabaseInsuranceOffer, 'id' | 'created_at' | 'updated_at'> {
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
  };
}

function mapDbToInsurer(db: DatabaseInsurer): Insurer {
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
  };
}

function mapDbToCategory(db: DatabaseInsuranceCategory): OfferCategory {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    icon: db.icon,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

// Service Supabase
const supabaseOfferService = {
  // Récupérer l'ID de l'assureur actuel
  async getCurrentInsurerId(): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_current_insurer_id');
      if (error) throw error;
      return (data as string) || null;
    } catch (e) {
      console.error('getCurrentInsurerId error:', e);
      return null;
    }
  },

  // Récupérer toutes les offres publiques
  async getPublicOffers(filters?: OfferFilters): Promise<Offer[]> {
    let query = supabase
      .from('insurance_offers')
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .eq('is_active', true)
      .eq('insurers.is_active', true)
      .order('updated_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id);
    }

    if (filters?.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }

    if (filters?.price_min) {
      query = query.gte('price_min', filters.price_min);
    }

    if (filters?.price_max) {
      query = query.lte('price_max', filters.price_max);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des offres: ${error.message}`);
    }

    return (data || []).map(offer =>
      mapDbToOffer(offer, offer.insurers, offer.insurance_categories)
    );
  },

  // Récupérer les offres de l'assureur connecté
  async getInsurerOffers(): Promise<Offer[]> {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) return [];

    const { data, error } = await supabase
      .from('insurance_offers')
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .eq('insurer_id', insurerId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des offres de l'assureur: ${error.message}`);
    }

    return (data || []).map(offer =>
      mapDbToOffer(offer, offer.insurers, offer.insurance_categories)
    );
  },

  // Récupérer toutes les offres (admin)
  async getAllOffers(filters?: OfferFilters): Promise<Offer[]> {
    let query = supabase
      .from('insurance_offers')
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .order('updated_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.insurer_id) {
      query = query.eq('insurer_id', filters.insurer_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des offres: ${error.message}`);
    }

    return (data || []).map(offer =>
      mapDbToOffer(offer, offer.insurers, offer.insurance_categories)
    );
  },

  // Récupérer une offre par son ID
  async getOfferById(id: string): Promise<Offer> {
    const { data, error } = await supabase
      .from('insurance_offers')
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Offre non trouvée');
      }
      throw new Error(`Erreur lors de la récupération de l'offre: ${error.message}`);
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories);
  },

  // Créer une offre (assureur)
  async createInsurerOffer(input: InsurerOfferInput): Promise<Offer> {
    const insurerId = await this.getCurrentInsurerId();
    if (!insurerId) {
      throw new Error("Assureur introuvable pour le compte en cours");
    }

    // Trouver la catégorie auto (ou créer une logique plus sophistiquée)
    const { data: category } = await supabase
      .from('insurance_categories')
      .select('id')
      .eq('name', 'Auto')
      .single();

    const categoryId = category?.id || 'auto';

    const dbData = {
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
    };

    const { data, error } = await supabase
      .from('insurance_offers')
      .insert(dbData)
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'offre: ${error.message}`);
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories);
  },

  // Créer une offre (admin)
  async createOffer(offerData: OfferFormData): Promise<Offer> {
    const dbData = mapOfferToDb(offerData);

    const { data, error } = await supabase
      .from('insurance_offers')
      .insert(dbData)
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'offre: ${error.message}`);
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories);
  },

  // Mettre à jour une offre (assureur)
  async updateInsurerOffer(offerId: string, input: Partial<InsurerOfferInput>): Promise<Offer> {
    const updates: Partial<DatabaseInsuranceOffer> = {
      name: input.name,
      description: input.description,
      price_min: input.price,
      price_max: input.price,
      coverage_amount: input.maxCoverage,
      deductible: input.deductible,
      is_active: input.isActive,
      features: input.features,
      contract_type: input.type ? (typeToContract[input.type] || 'basic') : undefined,
      updated_at: new Date().toISOString(),
    };

    // Nettoyer les valeurs undefined
    Object.keys(updates).forEach(key =>
      updates[key as keyof DatabaseInsuranceOffer] === undefined &&
      delete updates[key as keyof DatabaseInsuranceOffer]
    );

    const { data, error } = await supabase
      .from('insurance_offers')
      .update(updates)
      .eq('id', offerId)
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Offre non trouvée');
      }
      throw new Error(`Erreur lors de la mise à jour de l'offre: ${error.message}`);
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories);
  },

  // Mettre à jour une offre (admin)
  async updateOffer(offerId: string, updates: Partial<OfferFormData>): Promise<Offer> {
    const dbUpdates = mapOfferToDb(updates as OfferFormData);

    const { data, error } = await supabase
      .from('insurance_offers')
      .update(dbUpdates)
      .eq('id', offerId)
      .select(`
        *,
        insurers!inner(name, logo_url),
        insurance_categories!inner(name, icon)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Offre non trouvée');
      }
      throw new Error(`Erreur lors de la mise à jour de l'offre: ${error.message}`);
    }

    return mapDbToOffer(data, data.insurers, data.insurance_categories);
  },

  // Supprimer une offre
  async deleteOffer(offerId: string): Promise<void> {
    const { error } = await supabase
      .from('insurance_offers')
      .delete()
      .eq('id', offerId);

    if (error) {
      throw new Error(`Erreur lors de la suppression de l'offre: ${error.message}`);
    }
  },

  // Mettre à jour le statut d'une offre
  async updateOfferStatus(offerId: string, status: boolean): Promise<Offer> {
    return this.updateOffer(offerId, { is_active: status } as OfferFormData);
  },

  // Récupérer les assureurs
  async getInsurers(): Promise<Insurer[]> {
    const { data, error } = await supabase
      .from('insurers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Erreur lors de la récupération des assureurs: ${error.message}`);
    }

    return (data || []).map(mapDbToInsurer);
  },

  // Récupérer les catégories
  async getCategories(): Promise<OfferCategory[]> {
    const { data, error } = await supabase
      .from('insurance_categories')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`);
    }

    return (data || []).map(mapDbToCategory);
  },

  // Dupliquer une offre
  async duplicateOffer(offerId: string): Promise<Offer> {
    const original = await this.getOfferById(offerId);

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
    };

    return this.createOffer(duplicatedData);
  },

  // Exporter les offres
  async exportOffers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const offers = await this.getAllOffers();

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
      'Date de création'
    ];

    const rows = offers.map(offer => [
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
      new Date(offer.created_at).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  },

  // Récupérer les statistiques des offres
  async getOfferStats(): Promise<OfferStats> {
    const { data: offers, error } = await supabase
      .from('insurance_offers')
      .select('is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(100); // Limiter pour les performances

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }

    const total = offers?.length || 0;
    const active = offers?.filter(o => o.is_active).length || 0;
    const inactive = total - active;

    // Pour les données plus complexes, on pourrait utiliser des vues ou des fonctions
    return {
      total,
      active,
      pending: 0, // À implémenter si nécessaire
      draft: 0,   // À implémenter si nécessaire
      inactive,
      total_clicks: 0,    // À implémenter avec analytics
      total_conversions: 0,
      avg_conversion_rate: 0,
      total_revenue: 0,
      top_performing: [],  // À implémenter avec analytics
    };
  },
};

// Mock data pour le fallback
const mockOffers: Offer[] = [
  {
    id: 'mock-offer-1',
    insurer_id: 'mock-insurer-1',
    category_id: 'mock-category-1',
    name: 'Assurance Auto Tous Risques',
    description: 'Protection complète pour votre véhicule',
    price_min: 50000,
    price_max: 150000,
    coverage_amount: 5000000,
    deductible: 50000,
    is_active: true,
    features: ['Assistance 24/7', 'Véhicule de remplacement', 'Protection juridique'],
    contract_type: 'all_risks',
    insurer_name: 'NSIA Assurance',
    category_name: 'Auto',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'mock-offer-2',
    insurer_id: 'mock-insurer-2',
    category_id: 'mock-category-1',
    name: 'Assurance Auto Tiers+',
    description: 'Protection intermédiaire avec garanties étendues',
    price_min: 25000,
    price_max: 75000,
    coverage_amount: 2000000,
    deductible: 75000,
    is_active: true,
    features: ['Assistance 24/7', 'Bris de glace'],
    contract_type: 'third_party_plus',
    insurer_name: 'SUNU Assurances',
    category_name: 'Auto',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  }
];

const mockInsurers: Insurer[] = [
  {
    id: 'mock-insurer-1',
    name: 'NSIA Assurance',
    description: 'Compagnie d\'assurance leader en Côte d\'Ivoire',
    logo_url: null,
    rating: 4.5,
    is_active: true,
    contact_email: 'contact@nsia.ci',
    phone: '+225 27 20 30 40 50',
    website: 'https://www.nsia.ci',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock-insurer-2',
    name: 'SUNU Assurances',
    description: 'Assurance et services financiers',
    logo_url: null,
    rating: 4.2,
    is_active: true,
    contact_email: 'info@sunu.com',
    phone: '+225 27 20 00 00 00',
    website: 'https://www.sunu.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

const mockCategories: OfferCategory[] = [
  {
    id: 'mock-category-1',
    name: 'Auto',
    description: 'Assurance pour véhicules automobiles',
    icon: 'car',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }
];

// Service avec fallback
export const offerService = {
  getCurrentInsurerId: () =>
    FallbackService.withFallback({
      mockData: () => 'mock-insurer-1',
      apiCall: () => supabaseOfferService.getCurrentInsurerId(),
      errorMessage: 'Service de récupération de l\'ID assureur indisponible',
    }),

  getPublicOffers: (filters?: OfferFilters) =>
    FallbackService.withFallback({
      mockData: () => mockOffers.filter(offer => offer.is_active),
      apiCall: () => supabaseOfferService.getPublicOffers(filters),
      errorMessage: 'Service de récupération des offres publiques indisponible',
    }),

  getInsurerOffers: () =>
    FallbackService.withFallback({
      mockData: () => mockOffers.filter(offer => offer.insurer_id === 'mock-insurer-1'),
      apiCall: () => supabaseOfferService.getInsurerOffers(),
      errorMessage: 'Service de récupération des offres de l\'assureur indisponible',
    }),

  getAllOffers: (filters?: OfferFilters) =>
    FallbackService.withFallback({
      mockData: () => mockOffers,
      apiCall: () => supabaseOfferService.getAllOffers(filters),
      errorMessage: 'Service de récupération des offres indisponible',
    }),

  getOfferById: (id: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const offer = mockOffers.find(o => o.id === id);
        if (!offer) throw new Error('Offre non trouvée');
        return offer;
      },
      apiCall: () => supabaseOfferService.getOfferById(id),
      errorMessage: 'Service de récupération de l\'offre indisponible',
    }),

  createInsurerOffer: (input: InsurerOfferInput) =>
    FallbackService.withFallback({
      mockData: () => {
        const newOffer: Offer = {
          id: `mock-offer-${Date.now()}`,
          insurer_id: 'mock-insurer-1',
          category_id: 'mock-category-1',
          name: input.name,
          description: input.description,
          price_min: input.price,
          price_max: input.price,
          coverage_amount: input.maxCoverage,
          deductible: input.deductible,
          is_active: input.isActive ?? true,
          features: input.features,
          contract_type: typeToContract[input.type] || 'basic',
          insurer_name: 'NSIA Assurance',
          category_name: 'Auto',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockOffers.unshift(newOffer);
        return newOffer;
      },
      apiCall: () => supabaseOfferService.createInsurerOffer(input),
      errorMessage: 'Service de création d\'offre indisponible',
    }),

  createOffer: (offerData: OfferFormData) =>
    FallbackService.withFallback({
      mockData: () => {
        const newOffer: Offer = {
          id: `mock-offer-${Date.now()}`,
          insurer_id: offerData.insurer_id,
          category_id: offerData.category_id,
          name: offerData.name,
          description: offerData.description,
          price_min: offerData.price_min,
          price_max: offerData.price_max,
          coverage_amount: offerData.coverage_amount,
          deductible: offerData.deductible,
          is_active: offerData.is_active,
          features: offerData.features,
          contract_type: offerData.contract_type,
          insurer_name: mockInsurers.find(i => i.id === offerData.insurer_id)?.name,
          category_name: mockCategories.find(c => c.id === offerData.category_id)?.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockOffers.unshift(newOffer);
        return newOffer;
      },
      apiCall: () => supabaseOfferService.createOffer(offerData),
      errorMessage: 'Service de création d\'offre indisponible',
    }),

  updateInsurerOffer: (offerId: string, input: Partial<InsurerOfferInput>) =>
    FallbackService.withFallback({
      mockData: () => {
        const index = mockOffers.findIndex(o => o.id === offerId);
        if (index === -1) throw new Error('Offre non trouvée');

        mockOffers[index] = {
          ...mockOffers[index],
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.price && { price_min: input.price, price_max: input.price }),
          ...(input.maxCoverage && { coverage_amount: input.maxCoverage }),
          ...(input.deductible && { deductible: input.deductible }),
          ...(input.isActive !== undefined && { is_active: input.isActive }),
          ...(input.features && { features: input.features }),
          ...(input.type && { contract_type: typeToContract[input.type] || 'basic' }),
          updated_at: new Date().toISOString(),
        };

        return mockOffers[index];
      },
      apiCall: () => supabaseOfferService.updateInsurerOffer(offerId, input),
      errorMessage: 'Service de mise à jour d\'offre indisponible',
    }),

  updateOffer: (offerId: string, updates: Partial<OfferFormData>) =>
    FallbackService.withFallback({
      mockData: () => {
        const index = mockOffers.findIndex(o => o.id === offerId);
        if (index === -1) throw new Error('Offre non trouvée');

        mockOffers[index] = {
          ...mockOffers[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };

        return mockOffers[index];
      },
      apiCall: () => supabaseOfferService.updateOffer(offerId, updates),
      errorMessage: 'Service de mise à jour d\'offre indisponible',
    }),

  deleteOffer: (offerId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const index = mockOffers.findIndex(o => o.id === offerId);
        if (index === -1) throw new Error('Offre non trouvée');
        mockOffers.splice(index, 1);
      },
      apiCall: () => supabaseOfferService.deleteOffer(offerId),
      errorMessage: 'Service de suppression d\'offre indisponible',
    }),

  updateOfferStatus: (offerId: string, status: boolean) =>
    FallbackService.withFallback({
      mockData: () => {
        const index = mockOffers.findIndex(o => o.id === offerId);
        if (index === -1) throw new Error('Offre non trouvée');
        mockOffers[index].is_active = status;
        mockOffers[index].updated_at = new Date().toISOString();
        return mockOffers[index];
      },
      apiCall: () => supabaseOfferService.updateOfferStatus(offerId, status),
      errorMessage: 'Service de mise à jour du statut d\'offre indisponible',
    }),

  getInsurers: () =>
    FallbackService.withFallback({
      mockData: () => mockInsurers.filter(insurer => insurer.is_active),
      apiCall: () => supabaseOfferService.getInsurers(),
      errorMessage: 'Service de récupération des assureurs indisponible',
    }),

  getCategories: () =>
    FallbackService.withFallback({
      mockData: () => mockCategories,
      apiCall: () => supabaseOfferService.getCategories(),
      errorMessage: 'Service de récupération des catégories indisponible',
    }),

  duplicateOffer: (offerId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const original = mockOffers.find(o => o.id === offerId);
        if (!original) throw new Error('Offre non trouvée');

        const duplicated: Offer = {
          ...original,
          id: `mock-offer-${Date.now()}`,
          name: `${original.name} (Copie)`,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockOffers.unshift(duplicated);
        return duplicated;
      },
      apiCall: () => supabaseOfferService.duplicateOffer(offerId),
      errorMessage: 'Service de duplication d\'offre indisponible',
    }),

  exportOffers: (format: 'csv' | 'excel' = 'csv') =>
    FallbackService.withFallback({
      mockData: async () => {
        const headers = ['ID', 'Nom', 'Assureur', 'Prix min', 'Prix max', 'Statut'];
        const rows = mockOffers.map(offer => [
          offer.id,
          offer.name,
          offer.insurer_name || '',
          (offer.price_min || 0).toString(),
          (offer.price_max || 0).toString(),
          offer.is_active ? 'Actif' : 'Inactif'
        ]);

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        return new Blob([csvContent], { type: 'text/csv' });
      },
      apiCall: () => supabaseOfferService.exportOffers(format),
      errorMessage: 'Service d\'export des offres indisponible',
    }),

  getOfferStats: () =>
    FallbackService.withFallback({
      mockData: () => ({
        total: mockOffers.length,
        active: mockOffers.filter(o => o.is_active).length,
        pending: 0,
        draft: 0,
        inactive: mockOffers.filter(o => !o.is_active).length,
        total_clicks: 1250,
        total_conversions: 85,
        avg_conversion_rate: 6.8,
        total_revenue: 2500000,
        top_performing: mockOffers.filter(o => o.is_active).slice(0, 3),
      }),
      apiCall: () => supabaseOfferService.getOfferStats(),
      errorMessage: 'Service de statistiques des offres indisponible',
    }),
};

export default offerService;