import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QuoteWithDetails, QuoteHistoryFilters, QuoteHistoryStats, ComparisonRequest } from '../types/quote';
import { PDFService } from '../../../services/pdfService';
import { NotificationService } from '../../../services/notificationService';

// Mock data for development
const mockComparisonData: ComparisonRequest = {
  personalInfo: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '+2250712345678',
    birthDate: new Date('1990-01-01'),
    licenseDate: new Date('2015-01-01'),
    hasAccidents: false,
    accidentCount: 0,
    usage: 'personal' as const,
    annualKm: 15000,
  },
  vehicleInfo: {
    vehicleType: 'voiture',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    fiscalPower: 7,
    registration: 'AB1234CD',
    value: 8000000,
  },
  insuranceNeeds: {
    coverageType: 'tous_risques',
    options: [],
    monthlyBudget: 125000,
    franchise: 50000,
  },
};

const mockQuotes: QuoteWithDetails[] = [
  {
    id: '1',
    userId: 'user1',
    offerId: 'offer1',
    comparisonData: mockComparisonData,
    price: 125000,
    status: 'approved',
    createdAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-02-15T10:30:00Z',
    insurerName: 'NSIA Assurance',
    insurerLogo: '/logos/nsia.png',
    vehicleInfo: {
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      registration: 'AB1234CD',
    },
    coverageName: 'Tous Risques',
    updatedAt: '2024-01-16T14:20:00Z',
  },
  {
    id: '2',
    userId: 'user1',
    offerId: 'offer2',
    comparisonData: { ...mockComparisonData, vehicleInfo: { ...mockComparisonData.vehicleInfo, brand: 'Honda', model: 'Civic', registration: 'AB5678EF' } },
    price: 98000,
    status: 'pending',
    createdAt: '2024-01-18T09:15:00Z',
    expiresAt: '2024-02-18T09:15:00Z',
    insurerName: 'SUNU Assurances',
    insurerLogo: '/logos/sunu.png',
    vehicleInfo: {
      brand: 'Honda',
      model: 'Civic',
      year: 2019,
      registration: 'AB5678EF',
    },
    coverageName: 'Tiers Plus',
    updatedAt: '2024-01-18T09:15:00Z',
  },
  {
    id: '3',
    userId: 'user1',
    offerId: 'offer3',
    comparisonData: { ...mockComparisonData, vehicleInfo: { ...mockComparisonData.vehicleInfo, brand: 'Peugeot', model: '308', registration: 'AB9012GH' } },
    price: 110000,
    status: 'rejected',
    createdAt: '2024-01-10T14:45:00Z',
    expiresAt: '2024-02-10T14:45:00Z',
    insurerName: 'AXA Côte d\'Ivoire',
    insurerLogo: '/logos/axa.png',
    vehicleInfo: {
      brand: 'Peugeot',
      model: '308',
      year: 2021,
      registration: 'AB9012GH',
    },
    coverageName: 'Tiers',
    updatedAt: '2024-01-12T11:30:00Z',
  },
];

const mockStats: QuoteHistoryStats = {
  totalQuotes: 3,
  pendingQuotes: 1,
  approvedQuotes: 1,
  rejectedQuotes: 1,
  expiredQuotes: 0,
  averageProcessingTime: 2.5,
};

// API functions
export const fetchUserQuotes = async (filters?: QuoteHistoryFilters): Promise<QuoteWithDetails[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  let filteredQuotes = [...mockQuotes];

  if (filters?.status) {
    filteredQuotes = filteredQuotes.filter(quote => quote.status === filters.status);
  }

  if (filters?.dateRange) {
    filteredQuotes = filteredQuotes.filter(quote => {
      const quoteDate = new Date(quote.createdAt);
      return quoteDate >= filters.dateRange!.start && quoteDate <= filters.dateRange!.end;
    });
  }

  if (filters?.insurer) {
    filteredQuotes = filteredQuotes.filter(quote =>
      quote.insurerName.toLowerCase().includes(filters.insurer!.toLowerCase())
    );
  }

  return filteredQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const fetchQuoteStats = async (): Promise<QuoteHistoryStats> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockStats;
};

export const downloadQuotePdf = async (quoteId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Get the quote from mock data
  const quote = mockQuotes.find(q => q.id === quoteId);
  if (!quote) {
    throw new Error('Devis non trouvé');
  }

  // Generate and download PDF
  PDFService.downloadPDF(quote);
};

export const sendQuoteNotifications = async (quoteId: string, channels: ('email' | 'whatsapp' | 'sms')[] = ['email', 'whatsapp']): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get the quote from mock data
  const quote = mockQuotes.find(q => q.id === quoteId);
  if (!quote) {
    throw new Error('Devis non trouvé');
  }

  // Send notifications
  await NotificationService.sendNotification(
    channels,
    {
      email: quote.comparisonData.personalInfo.email,
      phone: quote.comparisonData.personalInfo.phone
    },
    'quoteGenerated',
    {
      firstName: quote.comparisonData.personalInfo.firstName,
      quoteId: quote.id,
      price: quote.price,
      insurerName: quote.insurerName,
      downloadUrl: `${window.location.origin}/devis/${quote.id}`
    }
  );
};

export const updateQuoteStatus = async (quoteId: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Update quote status in mock data
  const quote = mockQuotes.find(q => q.id === quoteId);
  if (!quote) {
    throw new Error('Devis non trouvé');
  }

  quote.status = status;

  // Send notification if approved
  if (status === 'approved') {
    await NotificationService.sendNotification(
      ['email', 'whatsapp'],
      {
        email: quote.comparisonData.personalInfo.email,
        phone: quote.comparisonData.personalInfo.phone
      },
      'quoteApproved',
      {
        firstName: quote.comparisonData.personalInfo.firstName,
        quoteId: quote.id,
        insurerName: quote.insurerName,
        nextSteps: 'Veuillez préparer votre pièce d\'identité, permis de conduire et carte grise pour la finalisation du contrat.'
      }
    );
  }
};

// React Query hooks
export const useUserQuotes = (filters?: QuoteHistoryFilters) => {
  return useQuery({
    queryKey: ['user-quotes', filters],
    queryFn: () => fetchUserQuotes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useQuoteStats = () => {
  return useQuery({
    queryKey: ['quote-stats'],
    queryFn: fetchQuoteStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDownloadQuotePdf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: downloadQuotePdf,
    onSuccess: (_, quoteId) => {
      toast.success('PDF téléchargé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors du téléchargement du PDF');
    },
  });
};

export const useSendQuoteNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, channels }: { quoteId: string; channels: ('email' | 'whatsapp' | 'sms')[] }) => 
      sendQuoteNotifications(quoteId, channels),
    onSuccess: (_, { quoteId, channels }) => {
      toast.success(`Notifications envoyées avec succès via ${channels.join(', ')}`);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'envoi des notifications');
    },
  });
};

export const useUpdateQuoteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quoteId, status }: { quoteId: string; status: 'approved' | 'rejected' | 'pending' }) => 
      updateQuoteStatus(quoteId, status),
    onSuccess: (_, { quoteId, status }) => {
      toast.success(`Statut du devis mis à jour : ${status === 'approved' ? 'Approuvé' : status === 'rejected' ? 'Rejeté' : 'En attente'}`);
      // Invalidate quotes query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['user-quotes'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });
};
