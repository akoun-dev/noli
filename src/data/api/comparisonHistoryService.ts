import { supabase } from '@/lib/supabase';
import { Database, DatabaseComparisonHistory } from '@/types/database';
import { FallbackService } from '@/lib/api/fallback';
import { features } from '@/lib/config/features';

// Types adaptés pour le service
export interface ComparisonHistoryFilters {
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  vehicleType?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  insurer?: string;
  status?: 'active' | 'archived' | 'deleted';
  hasFavorite?: boolean;
  limit?: number;
  offset?: number;
}

export interface ComparisonHistory {
  id: string;
  user_id: string;
  comparison_data: {
    title: string;
    description?: string;
    vehicleInfo: {
      make: string;
      model: string;
      year: number;
      category: string;
      value: number;
    };
    driverInfo: {
      age: number;
      licenseYears: number;
      accidentHistory: number;
    };
    preferences: {
      coverageType: string;
      budgetRange: {
        min: number;
        max: number;
      };
      deductible: number;
      additionalOptions: string[];
    };
    results: {
      totalOffers: number;
      bestOffer?: {
        insurer: string;
        price: number;
        coverage: string;
      };
      priceRange: {
        min: number;
        max: number;
      };
      averagePrice: number;
      comparisonDate: string;
    };
    savedOffers: Array<{
      id: string;
      offerId: string;
      insurer: string;
      price: number;
      coverage: string;
      deductible: number;
      additionalBenefits: string[];
      isFavorite: boolean;
      notes?: string;
      selected: boolean;
      savedAt: string;
    }>;
  };
  status: 'in_progress' | 'completed' | 'saved' | 'archived';
  comparison_date: string;
  expires_at?: string;
  is_shared: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface ComparisonStats {
  totalComparisons: number;
  averageOffersPerComparison: number;
  averageSavings: number;
  popularInsurers: { insurer: string; count: number }[];
  priceTrends: { date: string; averagePrice: number }[];
  completionRate: number;
  favoriteCoverageTypes: { type: string; count: number }[];
}

// Helper functions pour convertir les types
function mapDbToComparisonHistory(db: DatabaseComparisonHistory): ComparisonHistory {
  return {
    id: db.id,
    user_id: db.user_id,
    comparison_data: db.comparison_data as ComparisonHistory['comparison_data'],
    status: db.status,
    comparison_date: db.comparison_date,
    expires_at: db.expires_at,
    is_shared: db.comparison_data?.isShared || false,
    share_token: db.comparison_data?.shareToken,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

function mapComparisonHistoryToDb(history: Omit<ComparisonHistory, 'id' | 'created_at' | 'updated_at'>): Omit<DatabaseComparisonHistory, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: history.user_id,
    vehicle_id: null, // Peut être ajouté plus tard
    comparison_data: {
      ...history.comparison_data,
      isShared: history.is_shared,
      shareToken: history.share_token,
    },
    status: history.status,
    comparison_date: history.comparison_date,
    expires_at: history.expires_at,
  };
}

// Service Supabase
const supabaseComparisonHistoryService = {
  // Récupérer l'historique de comparaisons
  async fetchComparisonHistory(userId: string, filters?: ComparisonHistoryFilters): Promise<ComparisonHistory[]> {
    let query = supabase
      .from('comparison_history')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null) // Exclure les éléments supprimés
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      query = query.or(`comparison_data->>title.ilike.%${searchLower}%,comparison_data->>description.ilike.%${searchLower}%`);
    }

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'historique: ${error.message}`);
    }

    return (data || []).map(mapDbToComparisonHistory);
  },

  // Récupérer les détails d'une comparaison
  async fetchComparisonDetails(historyId: string): Promise<ComparisonHistory> {
    const { data, error } = await supabase
      .from('comparison_history')
      .select('*')
      .eq('id', historyId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Comparaison non trouvée');
      }
      throw new Error(`Erreur lors de la récupération des détails: ${error.message}`);
    }

    return mapDbToComparisonHistory(data);
  },

  // Sauvegarder une nouvelle comparaison
  async saveComparisonHistory(comparisonData: Omit<ComparisonHistory, 'id' | 'created_at' | 'updated_at'>): Promise<ComparisonHistory> {
    const dbData = mapComparisonHistoryToDb(comparisonData);

    const { data, error } = await supabase
      .from('comparison_history')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }

    return mapDbToComparisonHistory(data);
  },

  // Mettre à jour une comparaison
  async updateComparisonHistory(historyId: string, updates: Partial<ComparisonHistory>): Promise<ComparisonHistory> {
    const dbUpdates: Partial<DatabaseComparisonHistory> = {};

    if (updates.comparison_data) {
      dbUpdates.comparison_data = {
        ...updates.comparison_data,
        isShared: updates.is_shared,
        shareToken: updates.share_token,
      };
    }

    if (updates.status) {
      dbUpdates.status = updates.status;
    }

    if (updates.expires_at) {
      dbUpdates.expires_at = updates.expires_at;
    }

    const { data, error } = await supabase
      .from('comparison_history')
      .update(dbUpdates)
      .eq('id', historyId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Comparaison non trouvée');
      }
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    return mapDbToComparisonHistory(data);
  },

  // Supprimer (soft delete) une comparaison
  async deleteComparisonHistory(historyId: string): Promise<void> {
    const { error } = await supabase
      .from('comparison_history')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', historyId);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Comparaison non trouvée');
      }
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  },

  // Partager une comparaison
  async shareComparisonHistory(historyId: string): Promise<{ shareToken: string; shareUrl: string }> {
    const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shareUrl = `${window.location.origin}/shared/comparison/${shareToken}`;

    await this.updateComparisonHistory(historyId, {
      is_shared: true,
      share_token: shareToken,
    } as Partial<ComparisonHistory>);

    return { shareToken, shareUrl };
  },

  // Récupérer une comparaison partagée
  async fetchSharedComparison(shareToken: string): Promise<ComparisonHistory> {
    const { data, error } = await supabase
      .from('comparison_history')
      .select('*')
      .eq('comparison_data->>shareToken', shareToken)
      .eq('comparison_data->>isShared', 'true')
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Comparaison partagée non trouvée');
      }
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }

    return mapDbToComparisonHistory(data);
  },

  // Mettre à jour les offres sauvegardées dans une comparaison
  async updateSavedOffers(historyId: string, savedOffers: ComparisonHistory['comparison_data']['savedOffers']): Promise<void> {
    const { data: existing } = await supabase
      .from('comparison_history')
      .select('comparison_data')
      .eq('id', historyId)
      .single();

    if (existing?.comparison_data) {
      const updatedData = {
        ...existing.comparison_data,
        savedOffers,
      };

      const { error } = await supabase
        .from('comparison_history')
        .update({ comparison_data: updatedData })
        .eq('id', historyId);

      if (error) {
        throw new Error(`Erreur lors de la mise à jour des offres: ${error.message}`);
      }
    }
  },

  // Récupérer les statistiques de comparaison
  async fetchComparisonStats(userId: string): Promise<ComparisonStats> {
    // Calculer les statistiques depuis la base de données
    const { data: comparisons, error } = await supabase
      .from('comparison_history')
      .select('comparison_data, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }

    if (!comparisons || comparisons.length === 0) {
      return {
        totalComparisons: 0,
        averageOffersPerComparison: 0,
        averageSavings: 0,
        popularInsurers: [],
        priceTrends: [],
        completionRate: 0,
        favoriteCoverageTypes: [],
      };
    }

    // Calculer les statistiques
    const totalComparisons = comparisons.length;
    const completedComparisons = comparisons.filter(c =>
      c.comparison_data?.results?.totalOffers > 0
    );

    const totalOffers = completedComparisons.reduce((sum, c) =>
      sum + (c.comparison_data?.results?.totalOffers || 0), 0
    );

    const averageOffersPerComparison = totalOffers / Math.max(completedComparisons.length, 1);

    // Calculer les assureurs populaires
    const insurerCounts: Record<string, number> = {};
    completedComparisons.forEach(c => {
      if (c.comparison_data?.results?.bestOffer?.insurer) {
        const insurer = c.comparison_data.results.bestOffer.insurer;
        insurerCounts[insurer] = (insurerCounts[insurer] || 0) + 1;
      }
    });

    const popularInsurers = Object.entries(insurerCounts)
      .map(([insurer, count]) => ({ insurer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculer les tendances de prix (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentComparisons = completedComparisons.filter(c =>
      new Date(c.created_at) >= thirtyDaysAgo
    );

    const priceTrends = recentComparisons.map(c => ({
      date: new Date(c.created_at).toISOString().split('T')[0],
      averagePrice: c.comparison_data?.results?.averagePrice || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Types de couverture préférés
    const coverageTypeCounts: Record<string, number> = {};
    completedComparisons.forEach(c => {
      const coverageType = c.comparison_data?.preferences?.coverageType;
      if (coverageType) {
        coverageTypeCounts[coverageType] = (coverageTypeCounts[coverageType] || 0) + 1;
      }
    });

    const favoriteCoverageTypes = Object.entries(coverageTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Taux de complétion
    const completionRate = (completedComparisons.length / totalComparisons) * 100;

    // Économies moyennes (simulation basée sur les données)
    const averageSavings = 25000; // Peut être calculé plus précisément

    return {
      totalComparisons,
      averageOffersPerComparison,
      averageSavings,
      popularInsurers,
      priceTrends,
      completionRate,
      favoriteCoverageTypes,
    };
  },

  // Exporter l'historique
  async exportComparisonHistory(userId: string, filters?: ComparisonHistoryFilters): Promise<Blob> {
    const history = await this.fetchComparisonHistory(userId, filters);

    // Créer le contenu CSV
    const headers = [
      'Date',
      'Titre',
      'Véhicule',
      'Type de couverture',
      'Budget min',
      'Budget max',
      'Nombre d\'offres',
      'Prix moyen',
      'Meilleur prix',
      'Statut'
    ];

    const rows = history.map(comparison => [
      new Date(comparison.created_at).toLocaleDateString('fr-FR'),
      comparison.comparison_data?.title || '',
      `${comparison.comparison_data?.vehicleInfo?.make || ''} ${comparison.comparison_data?.vehicleInfo?.model || ''}`,
      comparison.comparison_data?.preferences?.coverageType || '',
      comparison.comparison_data?.preferences?.budgetRange?.min?.toString() || '',
      comparison.comparison_data?.preferences?.budgetRange?.max?.toString() || '',
      comparison.comparison_data?.results?.totalOffers?.toString() || '0',
      comparison.comparison_data?.results?.averagePrice?.toString() || '0',
      comparison.comparison_data?.results?.priceRange?.min?.toString() || '0',
      comparison.status
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  },
};

// Mock data pour le fallback
const mockComparisonHistory: ComparisonHistory[] = [
  {
    id: '1',
    user_id: 'mock-user-1',
    comparison_data: {
      title: 'Comparaison assurance Toyota Yaris',
      description: 'Recherche pour véhicule personnel',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Yaris',
        year: 2020,
        category: 'Voiture',
        value: 4500000
      },
      driverInfo: {
        age: 32,
        licenseYears: 8,
        accidentHistory: 0
      },
      preferences: {
        coverageType: 'Tous risques',
        budgetRange: { min: 80000, max: 150000 },
        deductible: 50000,
        additionalOptions: ['Assistance 24/7', 'Véhicule de remplacement']
      },
      results: {
        totalOffers: 12,
        bestOffer: {
          insurer: 'NSIA Assurance',
          price: 95000,
          coverage: 'Tous risques'
        },
        priceRange: { min: 85000, max: 145000 },
        averagePrice: 115000,
        comparisonDate: '2024-01-20T10:30:00Z'
      },
      savedOffers: [
        {
          id: '1',
          offerId: 'offer_123',
          insurer: 'NSIA Assurance',
          price: 95000,
          coverage: 'Tous risques',
          deductible: 50000,
          additionalBenefits: ['Assistance 24/7', 'Protection juridique'],
          isFavorite: true,
          selected: true,
          savedAt: '2024-01-20T10:35:00Z'
        }
      ]
    },
    status: 'completed',
    comparison_date: '2024-01-20T10:30:00Z',
    is_shared: false,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:35:00Z'
  }
];

const mockStats: ComparisonStats = {
  totalComparisons: 15,
  averageOffersPerComparison: 10.5,
  averageSavings: 25000,
  popularInsurers: [
    { insurer: 'NSIA Assurance', count: 8 },
    { insurer: 'SUNU Assurances', count: 6 }
  ],
  priceTrends: [
    { date: '2024-01-01', averagePrice: 120000 },
    { date: '2024-01-08', averagePrice: 125000 }
  ],
  completionRate: 85,
  favoriteCoverageTypes: [
    { type: 'Tous risques', count: 8 },
    { type: 'Tiers +', count: 5 }
  ]
};

// Service avec fallback
export const comparisonHistoryService = {
  fetchComparisonHistory: (userId: string, filters?: ComparisonHistoryFilters) =>
    FallbackService.withFallback({
      mockData: () => mockComparisonHistory.filter(h => h.user_id === userId),
      apiCall: () => supabaseComparisonHistoryService.fetchComparisonHistory(userId, filters),
      errorMessage: 'Service d\'historique de comparaison indisponible',
    }),

  fetchComparisonDetails: (historyId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const comparison = mockComparisonHistory.find(c => c.id === historyId);
        if (!comparison) throw new Error('Comparaison non trouvée');
        return comparison;
      },
      apiCall: () => supabaseComparisonHistoryService.fetchComparisonDetails(historyId),
      errorMessage: 'Service de détails de comparaison indisponible',
    }),

  saveComparisonHistory: (comparisonData: Omit<ComparisonHistory, 'id' | 'created_at' | 'updated_at'>) =>
    FallbackService.withFallback({
      mockData: () => {
        const newComparison: ComparisonHistory = {
          ...comparisonData,
          id: `mock_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockComparisonHistory.unshift(newComparison);
        return newComparison;
      },
      apiCall: () => supabaseComparisonHistoryService.saveComparisonHistory(comparisonData),
      errorMessage: 'Service de sauvegarde de comparaison indisponible',
    }),

  updateComparisonHistory: (historyId: string, updates: Partial<ComparisonHistory>) =>
    FallbackService.withFallback({
      mockData: () => {
        const index = mockComparisonHistory.findIndex(c => c.id === historyId);
        if (index === -1) throw new Error('Comparaison non trouvée');

        mockComparisonHistory[index] = {
          ...mockComparisonHistory[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return mockComparisonHistory[index];
      },
      apiCall: () => supabaseComparisonHistoryService.updateComparisonHistory(historyId, updates),
      errorMessage: 'Service de mise à jour de comparaison indisponible',
    }),

  deleteComparisonHistory: (historyId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const index = mockComparisonHistory.findIndex(c => c.id === historyId);
        if (index === -1) throw new Error('Comparaison non trouvée');

        mockComparisonHistory[index].status = 'archived';
        mockComparisonHistory[index].updated_at = new Date().toISOString();
      },
      apiCall: () => supabaseComparisonHistoryService.deleteComparisonHistory(historyId),
      errorMessage: 'Service de suppression de comparaison indisponible',
    }),

  shareComparisonHistory: (historyId: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const comparison = mockComparisonHistory.find(c => c.id === historyId);
        if (!comparison) throw new Error('Comparaison non trouvée');

        const shareToken = `share_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const shareUrl = `${window.location.origin}/shared/comparison/${shareToken}`;

        comparison.is_shared = true;
        comparison.share_token = shareToken;
        comparison.updated_at = new Date().toISOString();

        return { shareToken, shareUrl };
      },
      apiCall: () => supabaseComparisonHistoryService.shareComparisonHistory(historyId),
      errorMessage: 'Service de partage de comparaison indisponible',
    }),

  fetchSharedComparison: (shareToken: string) =>
    FallbackService.withFallback({
      mockData: () => {
        const comparison = mockComparisonHistory.find(c => c.share_token === shareToken && c.is_shared);
        if (!comparison) throw new Error('Comparaison partagée non trouvée');
        return comparison;
      },
      apiCall: () => supabaseComparisonHistoryService.fetchSharedComparison(shareToken),
      errorMessage: 'Service de comparaison partagée indisponible',
    }),

  updateSavedOffers: (historyId: string, savedOffers: ComparisonHistory['comparison_data']['savedOffers']) =>
    FallbackService.withFallback({
      mockData: () => {
        const comparison = mockComparisonHistory.find(c => c.id === historyId);
        if (comparison) {
          comparison.comparison_data.savedOffers = savedOffers;
          comparison.updated_at = new Date().toISOString();
        }
      },
      apiCall: () => supabaseComparisonHistoryService.updateSavedOffers(historyId, savedOffers),
      errorMessage: 'Service de mise à jour des offres sauvegardées indisponible',
    }),

  fetchComparisonStats: (userId: string) =>
    FallbackService.withFallback({
      mockData: () => mockStats,
      apiCall: () => supabaseComparisonHistoryService.fetchComparisonStats(userId),
      errorMessage: 'Service de statistiques de comparaison indisponible',
    }),

  exportComparisonHistory: (userId: string, filters?: ComparisonHistoryFilters) =>
    FallbackService.withFallback({
      mockData: async () => {
        const history = mockComparisonHistory.filter(h => h.user_id === userId);

        // Créer le contenu CSV
        const headers = ['Date', 'Titre', 'Véhicule', 'Type de couverture', 'Statut'];
        const rows = history.map(comparison => [
          new Date(comparison.created_at).toLocaleDateString('fr-FR'),
          comparison.comparison_data?.title || '',
          `${comparison.comparison_data?.vehicleInfo?.make || ''} ${comparison.comparison_data?.vehicleInfo?.model || ''}`,
          comparison.comparison_data?.preferences?.coverageType || '',
          comparison.status
        ]);

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        return new Blob([csvContent], { type: 'text/csv' });
      },
      apiCall: () => supabaseComparisonHistoryService.exportComparisonHistory(userId, filters),
      errorMessage: 'Service d\'export d\'historique indisponible',
    }),
};

export default comparisonHistoryService;