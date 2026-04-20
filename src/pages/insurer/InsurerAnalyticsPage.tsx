import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Car,
  FileText,
  Target,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface AnalyticsData {
  period: string;
  quotes: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    previousTotal: number;
  };
  offers: {
    top: Array<{
      name: string;
      customers: number;
      revenue: number;
      conversion: number;
    }>;
    performance: Array<{
      name: string;
      views: number;
      quotes: number;
      conversion: number;
    }>;
  };
  customers: {
    total: number;
    new: number;
    retention: number;
    demographics: Array<{
      age: string;
      count: number;
      percentage: number;
    }>;
  };
}

export const InsurerAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [insurerId, setInsurerId] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get insurer ID first
      let currentInsurerId = insurerId;

      if (!currentInsurerId) {
        const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id');

        if (insurerError || !insurerData || insurerData.length === 0) {
          setError('Unable to load insurer information');
          setIsLoading(false);
          return;
        }

        currentInsurerId = insurerData[0].insurer_id;
        setInsurerId(currentInsurerId);
      }

      // Calculate date range based on selected period
      const now = new Date();
      const startDate = new Date();

      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Load quote_offers data for the period (this links insurers to quotes)
      const { data: quoteOffers, error: quotesError } = await supabase
        .from('quote_offers')
        .select('*, quotes!inner(created_at, status)')
        .eq('insurer_id', currentInsurerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (quotesError) throw quotesError;

      // Calculate quotes stats
      const quotesStats = {
        total: quoteOffers?.length || 0,
        approved: quoteOffers?.filter(qo => qo.status === 'APPROVED').length || 0,
        rejected: quoteOffers?.filter(qo => qo.status === 'REJECTED').length || 0,
        pending: quoteOffers?.filter(qo => qo.status === 'PENDING').length || 0,
        conversionRate: 0,
      };

      if (quotesStats.total > 0) {
        quotesStats.conversionRate = Math.round((quotesStats.approved / quotesStats.total) * 100 * 10) / 10;
      }

      // Load policies for revenue calculation
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('premium_amount, created_at')
        .eq('insurer_id', currentInsurerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (policiesError) throw policiesError;

      // Calculate revenue stats
      const totalRevenue = policies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0;
      const monthlyRevenue = totalRevenue / (selectedPeriod === '1y' ? 12 : 1);

      // Get previous period data for growth calculation
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(startDate);

      const { data: previousPolicies } = await supabase
        .from('policies')
        .select('premium_amount')
        .eq('insurer_id', currentInsurerId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      const previousRevenue = previousPolicies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0;
      const growth = previousRevenue > 0 ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 1000) / 10 : 0;

      // Load offers performance
      const { data: offers, error: offersError } = await supabase
        .from('insurance_offers')
        .select('*')
        .eq('insurer_id', currentInsurerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (offersError) throw offersError;

      // Calculate offers stats
      const offerStats = offers?.reduce((acc: any, offer) => {
        const name = offer.name || offer.contract_type || 'Offre';
        if (!acc[name]) {
          acc[name] = { name, customers: 0, revenue: 0, views: 0, quotes: 0, conversions: 0 };
        }
        if (offer.is_active) {
          acc[name].customers += 1;
          acc[name].revenue += offer.price_max || offer.price_min || 0;
          acc[name].conversions += 1;
        }
        acc[name].quotes += 1;
        return acc;
      }, {}) || {};

      const topOffers = Object.values(offerStats)
        .map((offer: any) => ({
          name: offer.name,
          customers: offer.customers,
          revenue: offer.revenue,
          conversion: offer.quotes > 0 ? Math.round((offer.conversions / offer.quotes) * 100) : 0,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      const performanceOffers = Object.values(offerStats)
        .map((offer: any) => ({
          name: offer.name,
          views: offer.views || 0,
          quotes: offer.quotes || 0,
          conversion: offer.quotes > 0 ? Math.round((offer.conversions / offer.quotes) * 100) : 0,
        }))
        .sort((a: any, b: any) => b.conversion - a.conversion)
        .slice(0, 5);

      // Load customers data - users who have policies with this insurer
      const { data: customers, error: customersError } = await supabase
        .from('policies')
        .select('user_id, created_at')
        .eq('insurer_id', currentInsurerId)
        .gte('created_at', startDate.toISOString());

      if (customersError) throw customersError;

      // Get unique customer IDs with their profile data
      const uniqueCustomerIds = [...new Set(customers?.map(c => c.user_id) || [])];

      // Load profile data for these customers (for demographics)
      const { data: customerProfiles } = await supabase
        .from('profiles')
        .select('id, created_at, date_of_birth')
        .in('id', uniqueCustomerIds);

      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newCustomers = customers?.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length || 0;

      // Calculate demographics
      const demographics = customerProfiles?.reduce((acc: any, customer) => {
        if (!customer.date_of_birth) return acc;

        const birthDate = new Date(customer.date_of_birth);
        const age = now.getFullYear() - birthDate.getFullYear();

        let ageGroup: string;
        if (age < 26) ageGroup = '18-25';
        else if (age < 36) ageGroup = '26-35';
        else if (age < 46) ageGroup = '36-45';
        else if (age < 56) ageGroup = '46-55';
        else ageGroup = '56+';

        if (!acc[ageGroup]) acc[ageGroup] = { age: ageGroup, count: 0, percentage: 0 };
        acc[ageGroup].count += 1;
        return acc;
      }, {}) || {};

      const totalCustomers = Object.values(demographics).reduce((sum: number, demo: any) => sum + demo.count, 0) || 1;

      Object.values(demographics).forEach((demo: any) => {
        demo.percentage = Math.round((demo.count / totalCustomers) * 100);
      });

      const demographicsArray = Object.values(demographics)
        .sort((a: any, b: any) => {
          const order = ['18-25', '26-35', '36-45', '46-55', '56+'];
          return order.indexOf(a.age) - order.indexOf(b.age);
        });

      setAnalyticsData({
        period: selectedPeriod,
        quotes: quotesStats,
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          growth: growth,
          previousTotal: previousRevenue,
        },
        offers: {
          top: topOffers,
          performance: performanceOffers,
        },
        customers: {
          total: uniqueCustomerIds.length || 0,
          new: newCustomers,
          retention: 0, // Would need more complex calculation
          demographics: demographicsArray,
        },
      });

      logger.info('Analytics data loaded successfully', {
        insurerId: currentInsurerId,
        quotesCount: quotesStats.total,
        revenue: totalRevenue
      });

    } catch (err) {
      logger.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadAnalyticsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Analysez vos performances et tendances</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Derniers 7 jours</SelectItem>
              <SelectItem value="30d">Derniers 30 jours</SelectItem>
              <SelectItem value="90d">Derniers 90 jours</SelectItem>
              <SelectItem value="1y">Dernière année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.total)}</p>
                <div className={`flex items-center text-sm ${getGrowthColor(analyticsData.revenue.growth)}`}>
                  {getGrowthIcon(analyticsData.revenue.growth)}
                  <span className="ml-1">{Math.abs(analyticsData.revenue.growth)}%</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux conversion</p>
                <p className="text-2xl font-bold">{analyticsData.quotes.conversionRate}%</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="ml-1">Devis approuvés</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Devis traités</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.quotes.total)}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {analyticsData.quotes.approved} approuvés
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {analyticsData.quotes.pending} en attente
                  </Badge>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients actifs</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.customers.total)}</p>
                <div className="flex items-center text-sm text-green-600">
                  <Users className="h-4 w-4" />
                  <span className="ml-1">{analyticsData.customers.new} nouveaux</span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Offers */}
        <Card>
          <CardHeader>
            <CardTitle>Offres les plus performantes</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.offers.top.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData.offers.top.map((offer, index) => (
                  <div key={offer.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{offer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {offer.customers} clients • {offer.conversion}% conversion
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(offer.revenue)}</p>
                      <div className="text-xs text-green-600">
                        {analyticsData.revenue.total > 0 ? Math.round(offer.revenue / analyticsData.revenue.total * 100) : 0}% du CA
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Démographie clients</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.customers.demographics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune donnée démographique disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData.customers.demographics.map((demo) => (
                  <div key={demo.age} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{demo.age} ans</span>
                      <span className="text-sm text-muted-foreground">
                        {demo.count} clients ({demo.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${demo.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.offers.performance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune donnée de conversion disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData.offers.performance.map((offer) => (
                  <div key={offer.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{offer.name}</span>
                      <Badge variant="outline">{offer.conversion}% conversion</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatNumber(offer.views)} vues</span>
                      <span>→</span>
                      <span>{formatNumber(offer.quotes)} devis</span>
                      <span>→</span>
                      <span>{Math.round(offer.quotes * offer.conversion / 100)} ventes</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(offer.conversion * 2, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendance des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">CA Mensuel</p>
                  <p className="font-bold text-lg">{formatCurrency(analyticsData.revenue.monthly)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Croissance</p>
                  <p className={`font-bold text-lg ${getGrowthColor(analyticsData.revenue.growth)}`}>
                    {analyticsData.revenue.growth > 0 ? '+' : ''}{analyticsData.revenue.growth}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Moyenne/offre</p>
                  <p className="font-bold text-lg">
                    {analyticsData.quotes.approved > 0
                      ? formatCurrency(analyticsData.revenue.total / analyticsData.quotes.approved)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Prévisions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CA prévisionnel (prochain mois)</span>
                    <span className="font-medium">
                      {formatCurrency(analyticsData.revenue.monthly * (1 + analyticsData.revenue.growth / 100))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Devis attendus</span>
                    <span className="font-medium">
                      {Math.round(analyticsData.quotes.total * 1.1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nouveaux clients estimés</span>
                    <span className="font-medium">
                      {Math.round(analyticsData.customers.new * 1.2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsurerAnalyticsPage;
