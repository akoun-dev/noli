import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface ConversionMetrics {
  totalQuotes: number;
  convertedQuotes: number;
  conversionRate: number;
  conversionRateByPeriod: {
    period: string;
    rate: number;
    quotes: number;
    converted: number;
  }[];
  conversionFunnel: {
    stage: string;
    count: number;
    rate: number;
  }[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  averagePolicyValue: number;
  revenueByPeriod: {
    period: string;
    revenue: number;
    policies: number;
  }[];
  revenueByProduct: {
    product: string;
    revenue: number;
    percentage: number;
    policies: number;
  }[];
  revenueTrend: {
    period: string;
    revenue: number;
    growth: number;
  }[];
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  customerSatisfactionScore: number;
  retentionRate: number;
  churnRate: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  performanceByAgent: {
    agentId: string;
    agentName: string;
    quotesHandled: number;
    conversionRate: number;
    averageResponseTime: number;
    revenue: number;
  }[];
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  newClients: number;
  clientSegments: {
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
  }[];
  clientDemographics: {
    age: string;
    count: number;
    percentage: number;
  }[];
  clientGeography: {
    region: string;
    count: number;
    percentage: number;
    revenue: number;
  }[];
}

export interface ProductMetrics {
  productPerformance: {
    productId: string;
    productName: string;
    totalQuotes: number;
    conversionRate: number;
    revenue: number;
    averagePremium: number;
    marketShare: number;
  }[];
  productComparison: {
    metric: string;
    products: {
      name: string;
      value: number;
      rank: number;
    }[];
  }[];
}

export interface DetailedAnalytics {
  period: AnalyticsPeriod;
  conversion: ConversionMetrics;
  revenue: RevenueMetrics;
  performance: PerformanceMetrics;
  clients: ClientMetrics;
  products: ProductMetrics;
  benchmark: {
    industryAverage: {
      conversionRate: number;
      customerSatisfaction: number;
      retentionRate: number;
    };
    topPerformer: {
      conversionRate: number;
      customerSatisfaction: number;
      retentionRate: number;
    };
  };
}

export class InsurerAnalyticsService {
  private static instance: InsurerAnalyticsService;

  static getInstance(): InsurerAnalyticsService {
    if (!InsurerAnalyticsService.instance) {
      InsurerAnalyticsService.instance = new InsurerAnalyticsService();
    }
    return InsurerAnalyticsService.instance;
  }

  // Obtenir les périodes d'analyse disponibles
  getAvailablePeriods(): AnalyticsPeriod[] {
    const now = new Date();

    return [
      {
        start: startOfDay(subDays(now, 7)),
        end: endOfDay(now),
        label: '7 derniers jours',
      },
      {
        start: startOfDay(subDays(now, 30)),
        end: endOfDay(now),
        label: '30 derniers jours',
      },
      {
        start: startOfDay(subDays(now, 90)),
        end: endOfDay(now),
        label: '3 derniers mois',
      },
      {
        start: startOfDay(subDays(now, 365)),
        end: endOfDay(now),
        label: '12 derniers mois',
      },
    ];
  }

  // Obtenir les analytics détaillés pour une période
  async getDetailedAnalytics(
    insurerId: string,
    period: AnalyticsPeriod
  ): Promise<DetailedAnalytics> {
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      period,
      conversion: this.generateConversionMetrics(period),
      revenue: this.generateRevenueMetrics(period),
      performance: this.generatePerformanceMetrics(period),
      clients: this.generateClientMetrics(period),
      products: this.generateProductMetrics(period),
      benchmark: this.generateBenchmarkData(),
    };
  }

  // Obtenir les analytics en temps réel
  async getRealTimeAnalytics(insurerId: string): Promise<{
    activeUsers: number;
    pendingQuotes: number;
    todayRevenue: number;
    todayQuotes: number;
    conversionRateToday: number;
    averageResponseTime: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      pendingQuotes: Math.floor(Math.random() * 20) + 5,
      todayRevenue: Math.floor(Math.random() * 500000) + 100000,
      todayQuotes: Math.floor(Math.random() * 30) + 10,
      conversionRateToday: Math.random() * 0.3 + 0.1,
      averageResponseTime: Math.random() * 10 + 2,
    };
  }

  // Exporter les analytics
  async exportAnalytics(
    insurerId: string,
    period: AnalyticsPeriod,
    format: 'excel' | 'pdf' | 'csv'
  ): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simuler la génération de fichier
    const data = `Analytics Export\n\nPeriod: ${period.label}\nGenerated: ${new Date().toISOString()}\n\nThis is a simulated export file.`;
    return new Blob([data], { type: 'text/plain' });
  }

  private generateConversionMetrics(period: AnalyticsPeriod): ConversionMetrics {
    const totalQuotes = Math.floor(Math.random() * 500) + 200;
    const convertedQuotes = Math.floor(totalQuotes * (Math.random() * 0.3 + 0.1));

    return {
      totalQuotes,
      convertedQuotes,
      conversionRate: convertedQuotes / totalQuotes,
      conversionRateByPeriod: this.generatePeriodicData('conversion', period),
      conversionFunnel: [
        { stage: 'Devis demandés', count: totalQuotes, rate: 1 },
        { stage: 'Devis envoyés', count: Math.floor(totalQuotes * 0.95), rate: 0.95 },
        { stage: 'Devis consultés', count: Math.floor(totalQuotes * 0.8), rate: 0.8 },
        { stage: 'Contact établi', count: Math.floor(totalQuotes * 0.5), rate: 0.5 },
        { stage: 'Convertis', count: convertedQuotes, rate: convertedQuotes / totalQuotes },
      ],
    };
  }

  private generateRevenueMetrics(period: AnalyticsPeriod): RevenueMetrics {
    const totalRevenue = Math.floor(Math.random() * 10000000) + 5000000;
    const monthlyRevenue = totalRevenue / 12;

    return {
      totalRevenue,
      monthlyRevenue,
      averagePolicyValue: Math.floor(Math.random() * 300000) + 150000,
      revenueByPeriod: this.generatePeriodicData('revenue', period),
      revenueByProduct: [
        {
          product: 'Tiers Simple',
          revenue: totalRevenue * 0.3,
          percentage: 30,
          policies: Math.floor(Math.random() * 100) + 50,
        },
        {
          product: 'Tiers Étendu',
          revenue: totalRevenue * 0.45,
          percentage: 45,
          policies: Math.floor(Math.random() * 150) + 80,
        },
        {
          product: 'Tous Risques',
          revenue: totalRevenue * 0.25,
          percentage: 25,
          policies: Math.floor(Math.random() * 80) + 40,
        },
      ],
      revenueTrend: this.generateRevenueTrend(period),
    };
  }

  private generatePerformanceMetrics(period: AnalyticsPeriod): PerformanceMetrics {
    return {
      averageResponseTime: Math.random() * 8 + 2,
      customerSatisfactionScore: Math.random() * 2 + 3,
      retentionRate: Math.random() * 0.3 + 0.7,
      churnRate: Math.random() * 0.1 + 0.05,
      customerAcquisitionCost: Math.floor(Math.random() * 50000) + 20000,
      customerLifetimeValue: Math.floor(Math.random() * 500000) + 300000,
      performanceByAgent: [
        {
          agentId: 'agent-1',
          agentName: 'Marie Konaté',
          quotesHandled: Math.floor(Math.random() * 100) + 50,
          conversionRate: Math.random() * 0.3 + 0.15,
          averageResponseTime: Math.random() * 5 + 2,
          revenue: Math.floor(Math.random() * 2000000) + 1000000,
        },
        {
          agentId: 'agent-2',
          agentName: 'Yao Bamba',
          quotesHandled: Math.floor(Math.random() * 80) + 40,
          conversionRate: Math.random() * 0.25 + 0.12,
          averageResponseTime: Math.random() * 6 + 3,
          revenue: Math.floor(Math.random() * 1500000) + 800000,
        },
        {
          agentId: 'agent-3',
          agentName: 'Aminata Touré',
          quotesHandled: Math.floor(Math.random() * 120) + 60,
          conversionRate: Math.random() * 0.35 + 0.18,
          averageResponseTime: Math.random() * 4 + 1,
          revenue: Math.floor(Math.random() * 2500000) + 1200000,
        },
      ],
    };
  }

  private generateClientMetrics(period: AnalyticsPeriod): ClientMetrics {
    const totalClients = Math.floor(Math.random() * 1000) + 500;
    const activeClients = Math.floor(totalClients * 0.8);
    const newClients = Math.floor(Math.random() * 100) + 30;

    return {
      totalClients,
      activeClients,
      newClients,
      clientSegments: [
        {
          segment: 'Jeunes conducteurs',
          count: Math.floor(totalClients * 0.25),
          percentage: 25,
          averageValue: Math.floor(Math.random() * 200000) + 100000,
        },
        {
          segment: 'Professionnels',
          count: Math.floor(totalClients * 0.35),
          percentage: 35,
          averageValue: Math.floor(Math.random() * 400000) + 250000,
        },
        {
          segment: 'Familles',
          count: Math.floor(totalClients * 0.40),
          percentage: 40,
          averageValue: Math.floor(Math.random() * 300000) + 180000,
        },
      ],
      clientDemographics: [
        { age: '18-25', count: Math.floor(totalClients * 0.15), percentage: 15 },
        { age: '26-35', count: Math.floor(totalClients * 0.30), percentage: 30 },
        { age: '36-50', count: Math.floor(totalClients * 0.35), percentage: 35 },
        { age: '50+', count: Math.floor(totalClients * 0.20), percentage: 20 },
      ],
      clientGeography: [
        {
          region: 'Abidjan - Cocody',
          count: Math.floor(totalClients * 0.30),
          percentage: 30,
          revenue: Math.floor(Math.random() * 3000000) + 2000000,
        },
        {
          region: 'Abidjan - Plateau',
          count: Math.floor(totalClients * 0.25),
          percentage: 25,
          revenue: Math.floor(Math.random() * 2500000) + 1500000,
        },
        {
          region: 'Abidjan - Yopougon',
          count: Math.floor(totalClients * 0.20),
          percentage: 20,
          revenue: Math.floor(Math.random() * 2000000) + 1000000,
        },
        {
          region: 'Autres',
          count: Math.floor(totalClients * 0.25),
          percentage: 25,
          revenue: Math.floor(Math.random() * 1500000) + 800000,
        },
      ],
    };
  }

  private generateProductMetrics(period: AnalyticsPeriod): ProductMetrics {
    return {
      productPerformance: [
        {
          productId: 'product-1',
          productName: 'Tiers Simple',
          totalQuotes: Math.floor(Math.random() * 200) + 100,
          conversionRate: Math.random() * 0.2 + 0.1,
          revenue: Math.floor(Math.random() * 3000000) + 1500000,
          averagePremium: Math.floor(Math.random() * 100000) + 80000,
          marketShare: Math.random() * 0.3 + 0.2,
        },
        {
          productId: 'product-2',
          productName: 'Tiers Étendu',
          totalQuotes: Math.floor(Math.random() * 300) + 150,
          conversionRate: Math.random() * 0.25 + 0.15,
          revenue: Math.floor(Math.random() * 5000000) + 2500000,
          averagePremium: Math.floor(Math.random() * 150000) + 120000,
          marketShare: Math.random() * 0.4 + 0.3,
        },
        {
          productId: 'product-3',
          productName: 'Tous Risques',
          totalQuotes: Math.floor(Math.random() * 150) + 80,
          conversionRate: Math.random() * 0.3 + 0.2,
          revenue: Math.floor(Math.random() * 4000000) + 2000000,
          averagePremium: Math.floor(Math.random() * 250000) + 200000,
          marketShare: Math.random() * 0.3 + 0.25,
        },
      ],
      productComparison: [
        {
          metric: 'Taux conversion',
          products: [
            { name: 'Tiers Simple', value: 0.15, rank: 3 },
            { name: 'Tiers Étendu', value: 0.22, rank: 2 },
            { name: 'Tous Risques', value: 0.28, rank: 1 },
          ],
        },
        {
          metric: 'Prime moyenne',
          products: [
            { name: 'Tiers Simple', value: 95000, rank: 3 },
            { name: 'Tiers Étendu', value: 145000, rank: 2 },
            { name: 'Tous Risques', value: 235000, rank: 1 },
          ],
        },
        {
          metric: 'Part de marché',
          products: [
            { name: 'Tiers Simple', value: 0.25, rank: 2 },
            { name: 'Tiers Étendu', value: 0.45, rank: 1 },
            { name: 'Tous Risques', value: 0.30, rank: 3 },
          ],
        },
      ],
    };
  }

  private generateBenchmarkData() {
    return {
      industryAverage: {
        conversionRate: 0.18,
        customerSatisfaction: 4.2,
        retentionRate: 0.75,
      },
      topPerformer: {
        conversionRate: 0.32,
        customerSatisfaction: 4.7,
        retentionRate: 0.85,
      },
    };
  }

  private generatePeriodicData(type: 'conversion' | 'revenue', period: AnalyticsPeriod) {
    const daysDiff = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
    const periods = daysDiff <= 7 ? 7 : daysDiff <= 30 ? 30 : 90;

    return Array.from({ length: Math.min(periods, 12) }, (_, i) => {
      const date = new Date(period.start.getTime() + (i * (daysDiff / Math.min(periods, 12)) * 24 * 60 * 60 * 1000));

      return {
        period: format(date, 'dd MMM', { locale: fr }),
        rate: type === 'conversion' ? Math.random() * 0.3 + 0.1 : undefined,
        revenue: type === 'revenue' ? Math.floor(Math.random() * 1000000) + 500000 : undefined,
        quotes: type === 'conversion' ? Math.floor(Math.random() * 50) + 10 : undefined,
        converted: type === 'conversion' ? Math.floor(Math.random() * 15) + 2 : undefined,
        policies: type === 'revenue' ? Math.floor(Math.random() * 20) + 5 : undefined,
      };
    });
  }

  private generateRevenueTrend(period: AnalyticsPeriod) {
    const daysDiff = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
    const periods = Math.min(daysDiff <= 7 ? 7 : daysDiff <= 30 ? 30 : 90, 12);

    let previousRevenue = Math.floor(Math.random() * 1000000) + 500000;

    return Array.from({ length: periods }, (_, i) => {
      const date = new Date(period.start.getTime() + (i * (daysDiff / periods) * 24 * 60 * 60 * 1000));
      const currentRevenue = previousRevenue * (1 + (Math.random() - 0.5) * 0.2);
      const growth = previousRevenue > 0 ? (currentRevenue - previousRevenue) / previousRevenue : 0;

      previousRevenue = currentRevenue;

      return {
        period: format(date, 'dd MMM', { locale: fr }),
        revenue: Math.floor(currentRevenue),
        growth: Math.round(growth * 100),
      };
    });
  }
}

export const insurerAnalyticsService = InsurerAnalyticsService.getInstance();