import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

// Types
export interface PlatformStats {
  totalUsers: number;
  totalInsurers: number;
  totalQuotes: number;
  totalPolicies: number;
  conversionRate: number;
  monthlyGrowth: number;
}

export interface ActivityData {
  date: string;
  newUsers: number;
  newQuotes: number;
  newPolicies: number;
}

export interface TopInsurer {
  id: string;
  name: string;
  quotes: number;
  policies: number;
  revenue: number;
  conversionRate: number;
}

export interface SystemHealth {
  uptime: number;
  responseTime: number;
  memoryUsage: number;
  storageUsage: number;
  alerts: string[];
}

export interface UserDemographics {
  byAge: { range: string; count: number }[];
  byLocation: { city: string; count: number }[];
  byDevice: { device: string; count: number }[];
}

export interface QuoteAnalytics {
  averageProcessingTime: number;
  completionRate: number;
  averageValue: number;
  byStatus: { status: string; count: number }[];
  byInsurer: { insurer: string; count: number }[];
}

// Mock data
const mockPlatformStats: PlatformStats = {
  totalUsers: 12543,
  totalInsurers: 28,
  totalQuotes: 45678,
  totalPolicies: 8456,
  conversionRate: 18.5,
  monthlyGrowth: 12.3
};

const mockActivityData: ActivityData[] = [
  { date: '2024-01-15', newUsers: 45, newQuotes: 234, newPolicies: 67 },
  { date: '2024-01-16', newUsers: 52, newQuotes: 189, newPolicies: 45 },
  { date: '2024-01-17', newUsers: 38, newQuotes: 267, newPolicies: 78 },
  { date: '2024-01-18', newUsers: 61, newQuotes: 198, newPolicies: 56 },
  { date: '2024-01-19', newUsers: 47, newQuotes: 223, newPolicies: 89 },
  { date: '2024-01-20', newUsers: 55, newQuotes: 178, newPolicies: 43 },
  { date: '2024-01-21', newUsers: 43, newQuotes: 245, newPolicies: 72 }
];

const mockTopInsurers: TopInsurer[] = [
  { id: '1', name: 'NSIA Assurance', quotes: 1234, policies: 567, revenue: 45600000, conversionRate: 46 },
  { id: '2', name: 'SUNU Assurances', quotes: 987, policies: 432, revenue: 38400000, conversionRate: 44 },
  { id: '3', name: 'AXA Côte d\'Ivoire', quotes: 876, policies: 345, revenue: 27600000, conversionRate: 39 },
  { id: '4', name: 'Allianz CI', quotes: 654, policies: 234, revenue: 18700000, conversionRate: 36 },
  { id: '5', name: 'CNPS Assurance', quotes: 543, policies: 189, revenue: 15100000, conversionRate: 35 }
];

const mockSystemHealth: SystemHealth = {
  uptime: 98.5,
  responseTime: 245,
  memoryUsage: 85,
  storageUsage: 21,
  alerts: ['Backup manquant depuis 3 jours', 'Mémoire serveur à 85%']
};

const mockUserDemographics: UserDemographics = {
  byAge: [
    { range: '18-25', count: 2345 },
    { range: '26-35', count: 4567 },
    { range: '36-45', count: 3456 },
    { range: '46-55', count: 1789 },
    { range: '56+', count: 386 }
  ],
  byLocation: [
    { city: 'Abidjan', count: 8234 },
    { city: 'Bouaké', count: 1234 },
    { city: 'San Pedro', count: 876 },
    { city: 'Yamoussoukro', count: 765 },
    { city: 'Daloa', count: 543 }
  ],
  byDevice: [
    { device: 'Mobile', count: 8765 },
    { device: 'Desktop', count: 3456 },
    { device: 'Tablet', count: 322 }
  ]
};

const mockQuoteAnalytics: QuoteAnalytics = {
  averageProcessingTime: 2.5,
  completionRate: 78.5,
  averageValue: 125000,
  byStatus: [
    { status: 'pending', count: 1234 },
    { status: 'approved', count: 4567 },
    { status: 'rejected', count: 890 },
    { status: 'expired', count: 445 }
  ],
  byInsurer: [
    { insurer: 'NSIA Assurance', count: 2345 },
    { insurer: 'SUNU Assurances', count: 1987 },
    { insurer: 'AXA Côte d\'Ivoire', count: 1654 },
    { insurer: 'Allianz CI', count: 1234 },
    { insurer: 'CNPS Assurance', count: 987 }
  ]
};

// API Functions
export const fetchPlatformStats = async (): Promise<PlatformStats> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return mockPlatformStats;
};

export const fetchActivityData = async (period: '7d' | '30d' | '90d' = '7d'): Promise<ActivityData[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  // Return data based on period
  if (period === '7d') {
    return mockActivityData.slice(-7);
  } else if (period === '30d') {
    // Generate 30 days of mock data
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      newUsers: Math.floor(Math.random() * 100) + 20,
      newQuotes: Math.floor(Math.random() * 300) + 100,
      newPolicies: Math.floor(Math.random() * 100) + 20
    }));
  } else {
    // Generate 90 days of mock data
    return Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      newUsers: Math.floor(Math.random() * 120) + 30,
      newQuotes: Math.floor(Math.random() * 400) + 150,
      newPolicies: Math.floor(Math.random() * 120) + 30
    }));
  }
};

export const fetchTopInsurers = async (): Promise<TopInsurer[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockTopInsurers;
};

export const fetchSystemHealth = async (): Promise<SystemHealth> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockSystemHealth;
};

export const fetchUserDemographics = async (): Promise<UserDemographics> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return mockUserDemographics;
};

export const fetchQuoteAnalytics = async (): Promise<QuoteAnalytics> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return mockQuoteAnalytics;
};

export const exportAnalyticsReport = async (
  reportType: 'users' | 'quotes' | 'insurers' | 'comprehensive',
  period: '7d' | '30d' | '90d' = '30d'
): Promise<Blob> => {
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate different reports based on type
  let csvContent = '';
  let filename = '';

  switch (reportType) {
    case 'users':
      csvContent = generateUserReport();
      filename = `rapport_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'quotes':
      csvContent = generateQuoteReport();
      filename = `rapport_devis_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'insurers':
      csvContent = generateInsurerReport();
      filename = `rapport_assureurs_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'comprehensive':
      csvContent = generateComprehensiveReport();
      filename = `rapport_complet_${new Date().toISOString().split('T')[0]}.csv`;
      break;
  }

  return new Blob([csvContent], { type: 'text/csv' });
};

// Helper functions for report generation
const generateUserReport = (): string => {
  const headers = ['Statistique', 'Valeur'];
  const rows = [
    ['Total Utilisateurs', mockPlatformStats.totalUsers.toString()],
    ['Taux de Conversion', `${mockPlatformStats.conversionRate}%`],
    ['Croissance Mensuelle', `${mockPlatformStats.monthlyGrowth}%`],
    ['Temps de traitement moyen devis', `${mockQuoteAnalytics.averageProcessingTime} jours`],
    ['Taux de complétion devis', `${mockQuoteAnalytics.completionRate}%`]
  ];

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

const generateQuoteReport = (): string => {
  const headers = ['Statut', 'Nombre de devis', 'Pourcentage'];
  const total = mockQuoteAnalytics.byStatus.reduce((sum, item) => sum + item.count, 0);

  const rows = mockQuoteAnalytics.byStatus.map(item => [
    item.status,
    item.count.toString(),
    `${((item.count / total) * 100).toFixed(1)}%`
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

const generateInsurerReport = (): string => {
  const headers = ['Assureur', 'Devis', 'Contrats', 'Taux de conversion', 'Revenu (FCFA)'];

  const rows = mockTopInsurers.map(insurer => [
    insurer.name,
    insurer.quotes.toString(),
    insurer.policies.toString(),
    `${insurer.conversionRate}%`,
    insurer.revenue.toLocaleString()
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

const generateComprehensiveReport = (): string => {
  let content = 'RAPPORT COMPLET - NOLI ASSURANCE\n\n';
  content += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  content += 'STATISTIQUES DE LA PLATEFORME\n';
  content += `Total Utilisateurs: ${mockPlatformStats.totalUsers}\n`;
  content += `Total Assureurs: ${mockPlatformStats.totalInsurers}\n`;
  content += `Total Devis: ${mockPlatformStats.totalQuotes}\n`;
  content += `Total Contrats: ${mockPlatformStats.totalPolicies}\n`;
  content += `Taux de Conversion: ${mockPlatformStats.conversionRate}%\n`;
  content += `Croissance Mensuelle: ${mockPlatformStats.monthlyGrowth}%\n\n`;

  content += 'SANTÉ SYSTÈME\n';
  content += `Uptime: ${mockSystemHealth.uptime}%\n`;
  content += `Temps de réponse: ${mockSystemHealth.responseTime}ms\n`;
  content += `Usage mémoire: ${mockSystemHealth.memoryUsage}%\n`;
  content += `Usage stockage: ${mockSystemHealth.storageUsage}%\n\n`;

  content += 'TOP ASSUREURS\n';
  mockTopInsurers.slice(0, 3).forEach(insurer => {
    content += `${insurer.name}: ${insurer.policies} contrats, ${insurer.conversionRate}% conversion\n`;
  });

  return content;
};

// React Query Hooks
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useActivityData = (period: '7d' | '30d' | '90d' = '7d') => {
  return useQuery({
    queryKey: ['admin-activity-data', period],
    queryFn: () => fetchActivityData(period),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTopInsurers = () => {
  return useQuery({
    queryKey: ['admin-top-insurers'],
    queryFn: fetchTopInsurers,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['admin-system-health'],
    queryFn: fetchSystemHealth,
    staleTime: 1 * 60 * 1000, // 1 minute for real-time data
    refetchInterval: 1 * 60 * 1000, // Refetch every minute
  });
};

export const useUserDemographics = () => {
  return useQuery({
    queryKey: ['admin-user-demographics'],
    queryFn: fetchUserDemographics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useQuoteAnalytics = () => {
  return useQuery({
    queryKey: ['admin-quote-analytics'],
    queryFn: fetchQuoteAnalytics,
    staleTime: 5 * 60 * 1000,
  });
};

export const useExportAnalyticsReport = () => {
  return useMutation({
    mutationFn: ({ reportType, period }: { reportType: 'users' | 'quotes' | 'insurers' | 'comprehensive'; period?: '7d' | '30d' | '90d' }) =>
      exportAnalyticsReport(reportType, period),
    onSuccess: (blob, variables) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport_${variables.reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
};
