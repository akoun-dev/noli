import { supabase } from '@/lib/supabase';
import { Database, DatabaseQuote, DatabaseQuoteOffer } from '@/types/database';
import { FallbackService } from '@/lib/api/fallback';
import { features } from '@/lib/config/features';

// Types pour les devis
export interface QuoteRequest {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    licenseNumber: string;
    licenseDate: string;
  };
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    registrationNumber: string;
    vehicleType: string;
    fuelType: string;
    value: number;
  };
  insuranceNeeds: {
    coverageType: string;
    usage: string;
    annualKilometers: number;
    parkingType: string;
    historyClaims: string;
  };
}

export interface QuoteResponse {
  id: string;
  quoteId: string;
  offerId: string;
  insurerId: string;
  insurerName: string;
  insurerLogo?: string;
  offerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  price: {
    monthly: number;
    annual: number;
  };
  franchise: number;
  features: string[];
  guarantees: { [key: string]: boolean };
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  vehicleInfo?: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
  coverageType?: string;
}

export interface QuoteWithDetails extends QuoteResponse {
  userId: string;
  comparisonData?: {
    personalInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      birthDate: Date;
      licenseDate: Date;
      hasAccidents: boolean;
      accidentCount: number;
      usage: string;
      annualKm: number;
    };
    vehicleInfo: {
      vehicleType: string;
      brand: string;
      model: string;
      year: number;
      fiscalPower: number;
      registration: string;
      value: number;
    };
    insuranceNeeds: {
      coverageType: string;
      options: string[];
      monthlyBudget: number;
      franchise: number;
    };
  };
  price: number; // Prix annuel pour compatibilité
  expiresAt: string;
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
  coverageName: string;
}

export interface QuoteHistoryFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  dateRange?: {
    start: Date;
    end: Date;
  };
  insurer?: string;
  limit?: number;
  offset?: number;
}

export interface QuoteHistoryStats {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  averageProcessingTime: number;
}

export interface QuoteData {
  id: string;
  createdAt: Date;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: Date;
    licenseNumber: string;
    licenseDate: Date;
  };
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    registrationNumber: string;
    vehicleType: string;
    fuelType: string;
    value: number;
  };
  insuranceInfo: {
    insurer: string;
    offerName: string;
    coverageType: string;
    price: {
      monthly: number;
      annual: number;
    };
    franchise: number;
    features: string[];
    guarantees: { [key: string]: boolean };
  };
  personalInfo: {
    usage: string;
    annualKilometers: number;
    parkingType: string;
    historyClaims: string;
  };
}

export interface QuoteFormData {
  user_id: string;
  category_id: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  personal_data: any;
  vehicle_data: any;
  property_data?: any;
  coverage_requirements: any;
  estimated_price?: number;
  valid_until?: string;
}

// Helper functions
function mapDbToQuoteResponse(quoteOffer: DatabaseQuoteOffer, quote?: DatabaseQuote): QuoteResponse {
  const coverageMap: Record<string, string> = {
    all_risks: 'Tous Risques',
    third_party_plus: 'Tiers +',
    basic: 'Tiers',
    comprehensive: 'Complet',
  };

  return {
    id: quoteOffer.id,
    quoteId: quoteOffer.quote_id,
    offerId: quoteOffer.offer_id,
    insurerId: quoteOffer.insurer_id,
    insurerName: '', // Sera rempli avec la jointure
    offerName: '', // Sera rempli avec la jointure
    status: (quoteOffer.status || 'PENDING').toLowerCase() as any,
    price: {
      monthly: quoteOffer.price || 0,
      annual: (quoteOffer.price || 0) * 12,
    },
    franchise: 0, // À calculer depuis l'offre
    features: [],
    guarantees: {},
    createdAt: quoteOffer.created_at,
    updatedAt: quoteOffer.updated_at || quoteOffer.created_at,
    validUntil: quote?.valid_until || quoteOffer.created_at,
    coverageType: coverageMap[quote?.coverage_requirements?.coverage_type] || quote?.coverage_requirements?.coverage_type,
  };
}

// Service Supabase
const supabaseQuoteService = {
  // Générer des devis depuis plusieurs assureurs
  async generateQuotes(request: QuoteRequest): Promise<QuoteResponse[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non authentifié');

    const categoryId = 'auto';

    const personal_data = {
      full_name: request.customerInfo.fullName,
      email: request.customerInfo.email,
      phone: request.customerInfo.phone,
      birth_date: request.customerInfo.birthDate,
      license_number: request.customerInfo.licenseNumber,
      license_date: request.customerInfo.licenseDate,
      address: request.customerInfo.address,
    };

    const vehicle_data = {
      brand: request.vehicleInfo.brand,
      model: request.vehicleInfo.model,
      year: request.vehicleInfo.year,
      registration: request.vehicleInfo.registrationNumber,
      vehicle_type: request.vehicleInfo.vehicleType,
      fuel_type: request.vehicleInfo.fuelType,
      value: request.vehicleInfo.value,
    };

    const coverage_requirements = {
      coverage_type: request.insuranceNeeds.coverageType,
      usage: request.insuranceNeeds.usage,
      annual_km: request.insuranceNeeds.annualKilometers,
      parking_type: request.insuranceNeeds.parkingType,
      history_claims: request.insuranceNeeds.historyClaims,
    };

    // Créer le devis principal
    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        status: 'PENDING',
        personal_data,
        vehicle_data,
        coverage_requirements,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('*')
      .single();

    if (quoteErr || !quote) {
      throw quoteErr || new Error('Erreur lors de la création du devis');
    }

    // Récupérer les offres actives pour cette catégorie
    const { data: offers, error: offersErr } = await supabase
      .from('insurance_offers')
      .select(`
        id,
        name,
        insurer_id,
        price_min,
        price_max,
        deductible,
        contract_type,
        insurers!inner(name, logo_url)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .eq('insurers.is_active', true)
      .limit(5);

    if (offersErr) throw offersErr;

    // Créer les offres de devis
    const quoteOfferInserts: Database['public']['Tables']['quote_offers']['Insert'][] = (offers || []).map(offer => {
      const min = offer.price_min || 50000;
      const max = offer.price_max || Math.max(min + 30000, min);
      const base = Math.min(Math.max(min, (vehicle_data.value || 1000000) * 0.02), max);
      const price = Math.round(base / 1000) * 1000;

      return {
        quote_id: quote.id,
        offer_id: offer.id,
        insurer_id: offer.insurer_id,
        price,
        status: 'PENDING',
        notes: null,
      };
    });

    if (quoteOfferInserts.length) {
      const { error: insertErr } = await supabase.from('quote_offers').insert(quoteOfferInserts);
      if (insertErr) throw insertErr;
    }

    // Récupérer les offres de devis créées avec les détails
    const { data: result, error: fetchErr } = await supabase
      .from('quote_offers')
      .select(`
        id,
        price,
        status,
        created_at,
        updated_at,
        offer:offer_id (
          name,
          deductible,
          contract_type,
          insurer:insurer_id ( name, logo_url )
        ),
        quote:quote_id ( valid_until )
      `)
      .eq('quote_id', quote.id);

    if (fetchErr) throw fetchErr;

    return (result || []).map(q => {
      const coverageMap: Record<string, string> = {
        all_risks: 'Tous Risques',
        third_party_plus: 'Tiers +',
        basic: 'Tiers',
        comprehensive: 'Complet',
      };

      return {
        id: q.id,
        quoteId: q.quote_id,
        offerId: q.offer_id,
        insurerId: q.offer?.insurer?.id || '',
        insurerName: q.offer?.insurer?.name || 'Assureur',
        insurerLogo: q.offer?.insurer?.logo_url,
        offerName: q.offer?.name || 'Offre',
        status: (q.status || 'PENDING').toLowerCase() as any,
        price: { monthly: q.price || 0, annual: (q.price || 0) * 12 },
        franchise: q.offer?.deductible || 0,
        features: [],
        guarantees: {},
        createdAt: q.created_at,
        updatedAt: q.updated_at || q.created_at,
        validUntil: q.quote?.valid_until || q.created_at,
        vehicleInfo: {
          brand: vehicle_data.brand,
          model: vehicle_data.model,
          year: vehicle_data.year,
          registration: vehicle_data.registration,
        },
        coverageType: coverageMap[q.offer?.contract_type || ''] || q.offer?.contract_type,
      };
    });
  },

  // Accepter un devis
  async acceptQuote(quoteOfferId: string): Promise<boolean> {
    const { error } = await supabase
      .from('quote_offers')
      .update({ status: 'APPROVED' })
      .eq('id', quoteOfferId);

    if (error) throw error;

    // Notifier l'approbation
    const quote = await this.getQuoteById(quoteOfferId);
    if (quote) {
      // Ici on pourrait envoyer une notification
      console.log(`Quote ${quoteOfferId} approved for insurer ${quote.insurerName}`);
    }

    return true;
  },

  // Obtenir un devis par ID
  async getQuoteById(quoteOfferId: string): Promise<QuoteResponse | null> {
    const { data, error } = await supabase
      .from('quote_offers')
      .select(`
        id,
        price,
        status,
        created_at,
        updated_at,
        offer:offer_id (
          name,
          deductible,
          contract_type,
          insurer:insurer_id ( name, logo_url )
        ),
        quote:quote_id (
          valid_until,
          vehicle_data,
          coverage_requirements
        )
      `)
      .eq('id', quoteOfferId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    const coverageMap: Record<string, string> = {
      all_risks: 'Tous Risques',
      third_party_plus: 'Tiers +',
      basic: 'Tiers',
      comprehensive: 'Complet',
    };

    const vehicle = data.quote?.vehicle_data || {};

    return {
      id: data.id,
      quoteId: data.quote_id,
      offerId: data.offer_id,
      insurerId: data.offer?.insurer?.id || '',
      insurerName: data.offer?.insurer?.name || 'Assureur',
      insurerLogo: data.offer?.insurer?.logo_url,
      offerName: data.offer?.name || 'Offre',
      status: (data.status || 'PENDING').toLowerCase() as any,
      price: { monthly: data.price || 0, annual: (data.price || 0) * 12 },
      franchise: data.offer?.deductible || 0,
      features: [],
      guarantees: {},
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
      validUntil: data.quote?.valid_until || data.created_at,
      vehicleInfo: {
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || 0,
        registration: vehicle.registration || '',
      },
      coverageType: coverageMap[data.offer?.contract_type || ''] || data.offer?.contract_type,
    };
  },

  // Obtenir tous les devis d'un utilisateur
  async getUserQuotes(userId: string, filters?: QuoteHistoryFilters): Promise<QuoteWithDetails[]> {
    let query = supabase
      .from('quote_offers')
      .select(`
        id,
        price,
        status,
        created_at,
        updated_at,
        offer_id,
        offer:offer_id (
          name,
          contract_type,
          insurer:insurer_id ( name, logo_url )
        ),
        quote:quote_id (
          user_id,
          vehicle_data,
          coverage_requirements,
          valid_until
        )
      `)
      .eq('quote.user_id', userId)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.status) {
      const statusMap: Record<string, string> = {
        pending: 'PENDING',
        approved: 'APPROVED',
        rejected: 'REJECTED',
        expired: 'EXPIRED',
      };
      query = query.eq('status', statusMap[filters.status]);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    let results: QuoteWithDetails[] = (data || []).map((q: any) => {
      const vehicle = q.quote?.vehicle_data || {};
      const needs = q.quote?.coverage_requirements || {};
      const coverageMap: Record<string, string> = {
        all_risks: 'Tous Risques',
        third_party_plus: 'Tiers +',
        basic: 'Tiers',
        comprehensive: 'Complet',
      };

      return {
        id: q.id,
        quoteId: q.quote_id,
        offerId: q.offer_id,
        insurerId: '', // À récupérer depuis la jointure
        insurerName: q.offer?.insurer?.name || 'Assureur',
        insurerLogo: q.offer?.insurer?.logo_url || '',
        offerName: q.offer?.name || 'Offre',
        status: String(q.status || 'PENDING').toLowerCase() as any,
        price: { monthly: q.price || 0, annual: (q.price || 0) * 12 },
        franchise: 0,
        features: [],
        guarantees: {},
        createdAt: q.created_at,
        updatedAt: q.updated_at || q.created_at,
        validUntil: q.quote?.valid_until || q.created_at,
        userId: q.quote?.user_id,
        // Minimal comparisonData for compatibility
        comparisonData: {
          personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            birthDate: new Date(),
            licenseDate: new Date(),
            hasAccidents: false,
            accidentCount: 0,
            usage: (needs.usage || 'personal') as any,
            annualKm: needs.annual_km || 0,
          },
          vehicleInfo: {
            vehicleType: vehicle.vehicle_type || 'voiture',
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || 0,
            fiscalPower: 0,
            registration: vehicle.registration || '',
            value: vehicle.value || 0,
          },
          insuranceNeeds: {
            coverageType: (needs.coverage_type || 'tiers') as any,
            options: [],
            monthlyBudget: 0,
            franchise: 0,
          }
        },
        price: (q.price || 0) * 12, // afficher prix annuel
        expiresAt: q.quote?.valid_until || q.created_at,
        vehicleInfo: {
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || 0,
          registration: vehicle.registration || '',
        },
        coverageName: coverageMap[String(q.offer?.contract_type || '').toLowerCase()] || (q.offer?.contract_type || ''),
      } as QuoteWithDetails;
    });

    // Filtres supplémentaires
    if (filters?.dateRange) {
      results = results.filter(r => {
        const d = new Date(r.createdAt);
        return d >= filters.dateRange!.start && d <= filters.dateRange!.end;
      });
    }

    if (filters?.insurer) {
      const s = filters.insurer.toLowerCase();
      results = results.filter(r => r.insurerName.toLowerCase().includes(s));
    }

    return results;
  },

  // Obtenir les devis pour les assureurs
  async getInsurerQuotes(insurerId: string, filters?: QuoteHistoryFilters): Promise<QuoteWithDetails[]> {
    let query = supabase
      .from('quote_offers')
      .select(`
        id,
        price,
        status,
        created_at,
        updated_at,
        offer_id,
        offer:offer_id (
          name,
          contract_type,
          insurer:insurer_id ( name, logo_url )
        ),
        quote:quote_id (
          user_id,
          vehicle_data,
          coverage_requirements,
          valid_until
        )
      `)
      .eq('insurer_id', insurerId)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.status) {
      const statusMap: Record<string, string> = {
        pending: 'PENDING',
        approved: 'APPROVED',
        rejected: 'REJECTED',
        expired: 'EXPIRED',
      };
      query = query.eq('status', statusMap[filters.status]);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((q: any) => {
      const vehicle = q.quote?.vehicle_data || {};
      const needs = q.quote?.coverage_requirements || {};
      const coverageMap: Record<string, string> = {
        all_risks: 'Tous Risques',
        third_party_plus: 'Tiers +',
        basic: 'Tiers',
        comprehensive: 'Complet',
      };

      return {
        id: q.id,
        quoteId: q.quote_id,
        offerId: q.offer_id,
        insurerId: q.insurer_id,
        insurerName: q.offer?.insurer?.name || 'Assureur',
        insurerLogo: q.offer?.insurer?.logo_url || '',
        offerName: q.offer?.name || 'Offre',
        status: String(q.status || 'PENDING').toLowerCase() as any,
        price: { monthly: q.price || 0, annual: (q.price || 0) * 12 },
        franchise: 0,
        features: [],
        guarantees: {},
        createdAt: q.created_at,
        updatedAt: q.updated_at || q.created_at,
        validUntil: q.quote?.valid_until || q.created_at,
        userId: q.quote?.user_id,
        comparisonData: {
          personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            birthDate: new Date(),
            licenseDate: new Date(),
            hasAccidents: false,
            accidentCount: 0,
            usage: (needs.usage || 'personal') as any,
            annualKm: needs.annual_km || 0,
          },
          vehicleInfo: {
            vehicleType: vehicle.vehicle_type || 'voiture',
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || 0,
            fiscalPower: 0,
            registration: vehicle.registration || '',
            value: vehicle.value || 0,
          },
          insuranceNeeds: {
            coverageType: (needs.coverage_type || 'tiers') as any,
            options: [],
            monthlyBudget: 0,
            franchise: 0,
          }
        },
        price: (q.price || 0) * 12,
        expiresAt: q.quote?.valid_until || q.created_at,
        vehicleInfo: {
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || 0,
          registration: vehicle.registration || '',
        },
        coverageName: coverageMap[String(q.offer?.contract_type || '').toLowerCase()] || (q.offer?.contract_type || ''),
      } as QuoteWithDetails;
    });
  },

  // Obtenir tous les devis (admin)
  async getAllQuotes(filters?: QuoteHistoryFilters): Promise<QuoteWithDetails[]> {
    let query = supabase
      .from('quote_offers')
      .select(`
        id,
        price,
        status,
        created_at,
        updated_at,
        offer_id,
        offer:offer_id (
          name,
          contract_type,
          insurer:insurer_id ( name, logo_url )
        ),
        quote:quote_id (
          user_id,
          vehicle_data,
          coverage_requirements,
          valid_until
        )
      `)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.status) {
      const statusMap: Record<string, string> = {
        pending: 'PENDING',
        approved: 'APPROVED',
        rejected: 'REJECTED',
        expired: 'EXPIRED',
      };
      query = query.eq('status', statusMap[filters.status]);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((q: any) => {
      const vehicle = q.quote?.vehicle_data || {};
      const needs = q.quote?.coverage_requirements || {};
      const coverageMap: Record<string, string> = {
        all_risks: 'Tous Risques',
        third_party_plus: 'Tiers +',
        basic: 'Tiers',
        comprehensive: 'Complet',
      };

      return {
        id: q.id,
        quoteId: q.quote_id,
        offerId: q.offer_id,
        insurerId: q.insurer_id,
        insurerName: q.offer?.insurer?.name || 'Assureur',
        insurerLogo: q.offer?.insurer?.logo_url || '',
        offerName: q.offer?.name || 'Offre',
        status: String(q.status || 'PENDING').toLowerCase() as any,
        price: { monthly: q.price || 0, annual: (q.price || 0) * 12 },
        franchise: 0,
        features: [],
        guarantees: {},
        createdAt: q.created_at,
        updatedAt: q.updated_at || q.created_at,
        validUntil: q.quote?.valid_until || q.created_at,
        userId: q.quote?.user_id,
        comparisonData: {
          personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            birthDate: new Date(),
            licenseDate: new Date(),
            hasAccidents: false,
            accidentCount: 0,
            usage: (needs.usage || 'personal') as any,
            annualKm: needs.annual_km || 0,
          },
          vehicleInfo: {
            vehicleType: vehicle.vehicle_type || 'voiture',
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || 0,
            fiscalPower: 0,
            registration: vehicle.registration || '',
            value: vehicle.value || 0,
          },
          insuranceNeeds: {
            coverageType: (needs.coverage_type || 'tiers') as any,
            options: [],
            monthlyBudget: 0,
            franchise: 0,
          }
        },
        price: (q.price || 0) * 12,
        expiresAt: q.quote?.valid_until || q.created_at,
        vehicleInfo: {
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || 0,
          registration: vehicle.registration || '',
        },
        coverageName: coverageMap[String(q.offer?.contract_type || '').toLowerCase()] || (q.offer?.contract_type || ''),
      } as QuoteWithDetails;
    });
  },

  // Mettre à jour le statut d'un devis
  async updateQuoteStatus(quoteId: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
    const statusMap: Record<string, string> = {
      approved: 'APPROVED',
      rejected: 'REJECTED',
      pending: 'PENDING',
    };

    const { error } = await supabase
      .from('quote_offers')
      .update({ status: statusMap[status] })
      .eq('id', quoteId);

    if (error) throw error;
  },

  // Obtenir les statistiques des devis
  async getQuoteStats(userId?: string): Promise<QuoteHistoryStats> {
    let query = supabase
      .from('quote_offers')
      .select('status, created_at, updated_at, quote:quote_id ( user_id )');

    if (userId) {
      query = query.eq('quote.user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const byStatus = (data || []).reduce((acc: any, q: any) => {
      const s = String(q.status || 'PENDING').toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Temps de traitement moyen (approuvés et rejetés)
    const durations: number[] = (data || [])
      .filter((q: any) => ['APPROVED', 'REJECTED'].includes(String(q.status).toUpperCase()) && q.updated_at)
      .map((q: any) => (new Date(q.updated_at).getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24));

    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      totalQuotes: total,
      pendingQuotes: byStatus['pending'] || 0,
      approvedQuotes: byStatus['approved'] || 0,
      rejectedQuotes: byStatus['rejected'] || 0,
      expiredQuotes: byStatus['expired'] || 0,
      averageProcessingTime: Math.round(avg * 10) / 10,
    };
  },

  // Convertir en données PDF
  convertToPDFData(quoteResponse: QuoteResponse, request: QuoteRequest): QuoteData {
    return {
      id: quoteResponse.id,
      createdAt: new Date(quoteResponse.createdAt),
      customerInfo: {
        fullName: request.customerInfo.fullName,
        email: request.customerInfo.email,
        phone: request.customerInfo.phone,
        address: request.customerInfo.address,
        birthDate: new Date(request.customerInfo.birthDate),
        licenseNumber: request.customerInfo.licenseNumber,
        licenseDate: new Date(request.customerInfo.licenseDate),
      },
      vehicleInfo: {
        brand: request.vehicleInfo.brand,
        model: request.vehicleInfo.model,
        year: request.vehicleInfo.year,
        registrationNumber: request.vehicleInfo.registrationNumber,
        vehicleType: request.vehicleInfo.vehicleType,
        fuelType: request.vehicleInfo.fuelType,
        value: request.vehicleInfo.value,
      },
      insuranceInfo: {
        insurer: quoteResponse.insurerName,
        offerName: quoteResponse.offerName,
        coverageType: request.insuranceNeeds.coverageType,
        price: quoteResponse.price,
        franchise: quoteResponse.franchise,
        features: quoteResponse.features,
        guarantees: quoteResponse.guarantees,
      },
      personalInfo: {
        usage: request.insuranceNeeds.usage,
        annualKilometers: request.insuranceNeeds.annualKilometers,
        parkingType: request.insuranceNeeds.parkingType,
        historyClaims: request.insuranceNeeds.historyClaims,
      },
    };
  },
};

// Mock data pour le fallback
const mockQuotes: QuoteResponse[] = [
  {
    id: 'mock-quote-1',
    quoteId: 'mock-quote-main-1',
    offerId: 'mock-offer-1',
    insurerId: 'mock-insurer-1',
    insurerName: 'NSIA Assurance',
    insurerLogo: null,
    offerName: 'Assurance Auto Tous Risques',
    status: 'pending',
    price: { monthly: 8500, annual: 102000 },
    franchise: 50000,
    features: ['Assistance 24/7', 'Véhicule de remplacement'],
    guarantees: { 'Responsabilité Civile': true, 'Dommages tous accidents': true },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    validUntil: '2024-02-14T10:00:00Z',
    vehicleInfo: {
      brand: 'Toyota',
      model: 'Yaris',
      year: 2020,
      registration: 'AB1234CD',
    },
    coverageType: 'Tous Risques',
  },
  {
    id: 'mock-quote-2',
    quoteId: 'mock-quote-main-1',
    offerId: 'mock-offer-2',
    insurerId: 'mock-insurer-2',
    insurerName: 'SUNU Assurances',
    insurerLogo: null,
    offerName: 'Assurance Auto Tiers+',
    status: 'pending',
    price: { monthly: 6200, annual: 74400 },
    franchise: 75000,
    features: ['Assistance 24/7', 'Bris de glace'],
    guarantees: { 'Responsabilité Civile': true, 'Dommages collision': true },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    validUntil: '2024-02-14T10:00:00Z',
    vehicleInfo: {
      brand: 'Toyota',
      model: 'Yaris',
      year: 2020,
      registration: 'AB1234CD',
    },
    coverageType: 'Tiers +',
  }
];

// Service avec fallback
export const quoteService = {
  generateQuotes: (request: QuoteRequest) =>
    FallbackService.withFallback({
      mockData: () => mockQuotes,
      apiCall: () => supabaseQuoteService.generateQuotes(request),
      errorMessage: 'Service de génération de devis indisponible',
    }),

  acceptQuote: (quoteOfferId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const quote = mockQuotes.find(q => q.id === quoteOfferId);
        if (quote) {
          quote.status = 'approved';
          quote.updatedAt = new Date().toISOString();
        }
        return true;
      },
      apiCall: () => supabaseQuoteService.acceptQuote(quoteOfferId),
      errorMessage: 'Service d\'acceptation de devis indisponible',
    }),

  getQuoteById: (quoteOfferId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const quote = mockQuotes.find(q => q.id === quoteOfferId);
        return quote || null;
      },
      apiCall: () => supabaseQuoteService.getQuoteById(quoteOfferId),
      errorMessage: 'Service de récupération de devis indisponible',
    }),

  getUserQuotes: (userId: string, filters?: QuoteHistoryFilters) =>
    FallbackService.withFallback({
      mockData: () => mockQuotes.map(q => ({
        ...q,
        userId,
        comparisonData: {
          personalInfo: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+2250102030405',
            birthDate: new Date('1990-01-01'),
            licenseDate: new Date('2015-01-01'),
            hasAccidents: false,
            accidentCount: 0,
            usage: 'personal',
            annualKm: 15000,
          },
          vehicleInfo: {
            vehicleType: 'voiture',
            brand: 'Toyota',
            model: 'Yaris',
            year: 2020,
            fiscalPower: 6,
            registration: 'AB1234CD',
            value: 4500000,
          },
          insuranceNeeds: {
            coverageType: 'all_risks',
            options: ['Assistance 24/7'],
            monthlyBudget: 10000,
            franchise: 50000,
          }
        },
        price: q.price.annual,
        expiresAt: q.validUntil,
        vehicleInfo: q.vehicleInfo || {
          brand: 'Toyota',
          model: 'Yaris',
          year: 2020,
          registration: 'AB1234CD',
        },
        coverageName: q.coverageType || 'Tous Risques',
      } as QuoteWithDetails)),
      apiCall: () => supabaseQuoteService.getUserQuotes(userId, filters),
      errorMessage: 'Service de récupération des devis utilisateur indisponible',
    }),

  getInsurerQuotes: (insurerId: string, filters?: QuoteHistoryFilters) =>
    FallbackService.withFallback({
      mockData: () => mockQuotes.filter(q => q.insurerId === insurerId).map(q => ({
        ...q,
        userId: 'mock-user-1',
        comparisonData: {
          personalInfo: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+2250102030405',
            birthDate: new Date('1990-01-01'),
            licenseDate: new Date('2015-01-01'),
            hasAccidents: false,
            accidentCount: 0,
            usage: 'personal',
            annualKm: 15000,
          },
          vehicleInfo: {
            vehicleType: 'voiture',
            brand: 'Toyota',
            model: 'Yaris',
            year: 2020,
            fiscalPower: 6,
            registration: 'AB1234CD',
            value: 4500000,
          },
          insuranceNeeds: {
            coverageType: 'all_risks',
            options: ['Assistance 24/7'],
            monthlyBudget: 10000,
            franchise: 50000,
          }
        },
        price: q.price.annual,
        expiresAt: q.validUntil,
        vehicleInfo: q.vehicleInfo || {
          brand: 'Toyota',
          model: 'Yaris',
          year: 2020,
          registration: 'AB1234CD',
        },
        coverageName: q.coverageType || 'Tous Risques',
      } as QuoteWithDetails)),
      apiCall: () => supabaseQuoteService.getInsurerQuotes(insurerId, filters),
      errorMessage: 'Service de récupération des devis assureur indisponible',
    }),

  getAllQuotes: (filters?: QuoteHistoryFilters) =>
    FallbackService.withFallback({
      mockData: () => mockQuotes.map(q => ({
        ...q,
        userId: 'mock-user-1',
        comparisonData: {
          personalInfo: {
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            phone: '+2250102030405',
            birthDate: new Date('1990-01-01'),
            licenseDate: new Date('2015-01-01'),
            hasAccidents: false,
            accidentCount: 0,
            usage: 'personal',
            annualKm: 15000,
          },
          vehicleInfo: {
            vehicleType: 'voiture',
            brand: 'Toyota',
            model: 'Yaris',
            year: 2020,
            fiscalPower: 6,
            registration: 'AB1234CD',
            value: 4500000,
          },
          insuranceNeeds: {
            coverageType: 'all_risks',
            options: ['Assistance 24/7'],
            monthlyBudget: 10000,
            franchise: 50000,
          }
        },
        price: q.price.annual,
        expiresAt: q.validUntil,
        vehicleInfo: q.vehicleInfo || {
          brand: 'Toyota',
          model: 'Yaris',
          year: 2020,
          registration: 'AB1234CD',
        },
        coverageName: q.coverageType || 'Tous Risques',
      } as QuoteWithDetails)),
      apiCall: () => supabaseQuoteService.getAllQuotes(filters),
      errorMessage: 'Service de récupération de tous les devis indisponible',
    }),

  updateQuoteStatus: (quoteId: string, status: 'approved' | 'rejected' | 'pending') =>
    FallbackService.withFallback({
      mockData: () => {
        const quote = mockQuotes.find(q => q.id === quoteId);
        if (quote) {
          quote.status = status;
          quote.updatedAt = new Date().toISOString();
        }
      },
      apiCall: () => supabaseQuoteService.updateQuoteStatus(quoteId, status),
      errorMessage: 'Service de mise à jour du statut de devis indisponible',
    }),

  getQuoteStats: (userId?: string) =>
    FallbackService.withFallback({
      mockData: () => ({
        totalQuotes: mockQuotes.length,
        pendingQuotes: mockQuotes.filter(q => q.status === 'pending').length,
        approvedQuotes: mockQuotes.filter(q => q.status === 'approved').length,
        rejectedQuotes: mockQuotes.filter(q => q.status === 'rejected').length,
        expiredQuotes: 0,
        averageProcessingTime: 2.5,
      }),
      apiCall: () => supabaseQuoteService.getQuoteStats(userId),
      errorMessage: 'Service de statistiques des devis indisponible',
    }),

  convertToPDFData: (quoteResponse: QuoteResponse, request: QuoteRequest) => {
    // Cette fonction ne nécessite pas d'appel API
    return supabaseQuoteService.convertToPDFData(quoteResponse, request);
  },
};

export default quoteService;