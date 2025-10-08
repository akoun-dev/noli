import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface ComparisonHistory {
  id: string;
  userId: string;
  sessionId: string;
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
  savedOffers: SavedComparisonOffer[];
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
  shareToken?: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface SavedComparisonOffer {
  id: string;
  comparisonHistoryId: string;
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

export interface ComparisonFilters {
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
  status?: 'active' | 'archived';
  hasFavorite?: boolean;
}

// Mock data
const mockComparisonHistory: ComparisonHistory[] = [
  {
    id: '1',
    userId: '1',
    sessionId: 'session_123',
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
        comparisonHistoryId: '1',
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
    ],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:35:00Z',
    isShared: false,
    status: 'active'
  },
  {
    id: '2',
    userId: '1',
    sessionId: 'session_456',
    title: 'Assurance Honda CR-V',
    description: 'Comparaison pour SUV familial',
    vehicleInfo: {
      make: 'Honda',
      model: 'CR-V',
      year: 2019,
      category: 'SUV',
      value: 7500000
    },
    driverInfo: {
      age: 28,
      licenseYears: 5,
      accidentHistory: 1
    },
    preferences: {
      coverageType: 'Tiers +',
      budgetRange: { min: 120000, max: 200000 },
      deductible: 75000,
      additionalOptions: ['Bris de glace', 'Vol']
    },
    results: {
      totalOffers: 8,
      bestOffer: {
        insurer: 'SUNU Assurances',
        price: 135000,
        coverage: 'Tiers +'
      },
      priceRange: { min: 125000, max: 195000 },
      averagePrice: 160000,
      comparisonDate: '2024-01-15T14:20:00Z'
    },
    savedOffers: [
      {
        id: '2',
        comparisonHistoryId: '2',
        offerId: 'offer_456',
        insurer: 'SUNU Assurances',
        price: 135000,
        coverage: 'Tiers +',
        deductible: 75000,
        additionalBenefits: ['Assistance 24/7'],
        isFavorite: false,
        selected: false,
        savedAt: '2024-01-15T14:25:00Z'
      }
    ],
    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-15T14:25:00Z',
    isShared: true,
    shareToken: 'share_abc123',
    status: 'active'
  }
];

const mockStats: ComparisonStats = {
  totalComparisons: 15,
  averageOffersPerComparison: 10.5,
  averageSavings: 25000,
  popularInsurers: [
    { insurer: 'NSIA Assurance', count: 8 },
    { insurer: 'SUNU Assurances', count: 6 },
    { insurer: 'AXA Côte d\'Ivoire', count: 5 },
    { insurer: 'Allianz CI', count: 4 }
  ],
  priceTrends: [
    { date: '2024-01-01', averagePrice: 120000 },
    { date: '2024-01-08', averagePrice: 125000 },
    { date: '2024-01-15', averagePrice: 118000 },
    { date: '2024-01-22', averagePrice: 122000 }
  ],
  completionRate: 85,
  favoriteCoverageTypes: [
    { type: 'Tous risques', count: 8 },
    { type: 'Tiers +', count: 5 },
    { type: 'Tiers', count: 2 }
  ]
};

// API Functions
export const fetchComparisonHistory = async (userId: string, filters?: ComparisonFilters): Promise<ComparisonHistory[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  let filtered = [...mockComparisonHistory];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(comparison =>
      comparison.title.toLowerCase().includes(searchLower) ||
      comparison.description?.toLowerCase().includes(searchLower) ||
      comparison.vehicleInfo.make.toLowerCase().includes(searchLower) ||
      comparison.vehicleInfo.model.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.dateRange) {
    filtered = filtered.filter(comparison => {
      const comparisonDate = new Date(comparison.createdAt);
      return comparisonDate >= new Date(filters.dateRange!.start) &&
             comparisonDate <= new Date(filters.dateRange!.end);
    });
  }

  if (filters?.vehicleType) {
    filtered = filtered.filter(comparison =>
      comparison.vehicleInfo.category.toLowerCase() === filters.vehicleType!.toLowerCase()
    );
  }

  if (filters?.priceRange) {
    filtered = filtered.filter(comparison =>
      comparison.results.averagePrice >= filters.priceRange!.min &&
      comparison.results.averagePrice <= filters.priceRange!.max
    );
  }

  if (filters?.insurer) {
    filtered = filtered.filter(comparison =>
      comparison.savedOffers.some(offer =>
        offer.insurer.toLowerCase().includes(filters.insurer!.toLowerCase())
      )
    );
  }

  if (filters?.status) {
    filtered = filtered.filter(comparison => comparison.status === filters.status);
  }

  if (filters?.hasFavorite) {
    filtered = filtered.filter(comparison =>
      comparison.savedOffers.some(offer => offer.isFavorite)
    );
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchComparisonDetails = async (historyId: string): Promise<ComparisonHistory> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const comparison = mockComparisonHistory.find(c => c.id === historyId);
  if (!comparison) {
    throw new Error('Comparaison non trouvée');
  }

  return comparison;
};

export const saveComparisonHistory = async (comparisonData: Omit<ComparisonHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComparisonHistory> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const newComparison: ComparisonHistory = {
    ...comparisonData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockComparisonHistory.unshift(newComparison);
  return newComparison;
};

export const updateComparisonHistory = async (historyId: string, updates: Partial<ComparisonHistory>): Promise<ComparisonHistory> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const index = mockComparisonHistory.findIndex(c => c.id === historyId);
  if (index === -1) {
    throw new Error('Comparaison non trouvée');
  }

  mockComparisonHistory[index] = {
    ...mockComparisonHistory[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  return mockComparisonHistory[index];
};

export const deleteComparisonHistory = async (historyId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const index = mockComparisonHistory.findIndex(c => c.id === historyId);
  if (index === -1) {
    throw new Error('Comparaison non trouvée');
  }

  mockComparisonHistory[index].status = 'deleted';
};

export const shareComparisonHistory = async (historyId: string): Promise<{ shareToken: string; shareUrl: string }> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  const comparison = mockComparisonHistory.find(c => c.id === historyId);
  if (!comparison) {
    throw new Error('Comparaison non trouvée');
  }

  const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const shareUrl = `${window.location.origin}/shared/comparison/${shareToken}`;

  comparison.isShared = true;
  comparison.shareToken = shareToken;

  return { shareToken, shareUrl };
};

export const fetchSharedComparison = async (shareToken: string): Promise<ComparisonHistory> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const comparison = mockComparisonHistory.find(c => c.shareToken === shareToken && c.isShared);
  if (!comparison) {
    throw new Error('Comparaison partagée non trouvée');
  }

  return comparison;
};

export const saveComparisonOffer = async (offerData: Omit<SavedComparisonOffer, 'id' | 'savedAt'>): Promise<SavedComparisonOffer> => {
  await new Promise(resolve => setTimeout(resolve, 700));

  const newOffer: SavedComparisonOffer = {
    ...offerData,
    id: Date.now().toString(),
    savedAt: new Date().toISOString()
  };

  const comparison = mockComparisonHistory.find(c => c.id === offerData.comparisonHistoryId);
  if (comparison) {
    comparison.savedOffers.push(newOffer);
    comparison.updatedAt = new Date().toISOString();
  }

  return newOffer;
};

export const updateSavedOffer = async (offerId: string, updates: Partial<SavedComparisonOffer>): Promise<SavedComparisonOffer> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  for (const comparison of mockComparisonHistory) {
    const offerIndex = comparison.savedOffers.findIndex(o => o.id === offerId);
    if (offerIndex !== -1) {
      comparison.savedOffers[offerIndex] = {
        ...comparison.savedOffers[offerIndex],
        ...updates
      };
      comparison.updatedAt = new Date().toISOString();
      return comparison.savedOffers[offerIndex];
    }
  }

  throw new Error('Offre sauvegardée non trouvée');
};

export const deleteSavedOffer = async (offerId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  for (const comparison of mockComparisonHistory) {
    const offerIndex = comparison.savedOffers.findIndex(o => o.id === offerId);
    if (offerIndex !== -1) {
      comparison.savedOffers.splice(offerIndex, 1);
      comparison.updatedAt = new Date().toISOString();
      return;
    }
  }

  throw new Error('Offre sauvegardée non trouvée');
};

export const fetchComparisonStats = async (userId: string): Promise<ComparisonStats> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return mockStats;
};

export const exportComparisonHistory = async (filters?: ComparisonFilters): Promise<Blob> => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const history = await fetchComparisonHistory('current_user', filters);

  // Create CSV content
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
    new Date(comparison.createdAt).toLocaleDateString('fr-FR'),
    comparison.title,
    `${comparison.vehicleInfo.make} ${comparison.vehicleInfo.model}`,
    comparison.preferences.coverageType,
    comparison.preferences.budgetRange.min.toString(),
    comparison.preferences.budgetRange.max.toString(),
    comparison.results.totalOffers.toString(),
    comparison.results.averagePrice.toString(),
    comparison.results.priceRange.min.toString(),
    comparison.status
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
};

// React Query Hooks
export const useComparisonHistory = (userId: string, filters?: ComparisonFilters) => {
  return useQuery({
    queryKey: ['comparison-history', userId, filters],
    queryFn: () => fetchComparisonHistory(userId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useComparisonDetails = (historyId: string) => {
  return useQuery({
    queryKey: ['comparison-details', historyId],
    queryFn: () => fetchComparisonDetails(historyId),
    staleTime: 5 * 60 * 1000,
    enabled: !!historyId
  });
};

export const useSaveComparisonHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveComparisonHistory,
    onSuccess: () => {
      toast.success('Comparaison sauvegardée avec succès');
      queryClient.invalidateQueries(['comparison-history']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la sauvegarde de la comparaison');
    },
  });
};

export const useUpdateComparisonHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ historyId, updates }: { historyId: string; updates: Partial<ComparisonHistory> }) =>
      updateComparisonHistory(historyId, updates),
    onSuccess: () => {
      toast.success('Comparaison mise à jour avec succès');
      queryClient.invalidateQueries(['comparison-history']);
      queryClient.invalidateQueries(['comparison-details']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour de la comparaison');
    },
  });
};

export const useDeleteComparisonHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComparisonHistory,
    onSuccess: () => {
      toast.success('Comparaison supprimée avec succès');
      queryClient.invalidateQueries(['comparison-history']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la comparaison');
    },
  });
};

export const useShareComparisonHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareComparisonHistory,
    onSuccess: (data) => {
      toast.success('Comparaison partagée avec succès');
      navigator.clipboard.writeText(data.shareUrl);
      queryClient.invalidateQueries(['comparison-history']);
      queryClient.invalidateQueries(['comparison-details']);
    },
    onError: (error) => {
      toast.error('Erreur lors du partage de la comparaison');
    },
  });
};

export const useSharedComparison = (shareToken: string) => {
  return useQuery({
    queryKey: ['shared-comparison', shareToken],
    queryFn: () => fetchSharedComparison(shareToken),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!shareToken
  });
};

export const useSaveComparisonOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveComparisonOffer,
    onSuccess: () => {
      toast.success('Offre sauvegardée avec succès');
      queryClient.invalidateQueries(['comparison-details']);
      queryClient.invalidateQueries(['comparison-history']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la sauvegarde de l\'offre');
    },
  });
};

export const useUpdateSavedOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, updates }: { offerId: string; updates: Partial<SavedComparisonOffer> }) =>
      updateSavedOffer(offerId, updates),
    onSuccess: () => {
      toast.success('Offre mise à jour avec succès');
      queryClient.invalidateQueries(['comparison-details']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour de l\'offre');
    },
  });
};

export const useDeleteSavedOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSavedOffer,
    onSuccess: () => {
      toast.success('Offre supprimée avec succès');
      queryClient.invalidateQueries(['comparison-details']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de l\'offre');
    },
  });
};

export const useComparisonStats = (userId: string) => {
  return useQuery({
    queryKey: ['comparison-stats', userId],
    queryFn: () => fetchComparisonStats(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useExportComparisonHistory = () => {
  return useMutation({
    mutationFn: exportComparisonHistory,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historique_comparaisons_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Historique exporté avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'export de l\'historique');
    },
  });
};