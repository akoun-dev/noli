import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);

  const analyticsData: AnalyticsData = {
    period: selectedPeriod,
    quotes: {
      total: 1256,
      approved: 892,
      rejected: 234,
      pending: 130,
      conversionRate: 71.0,
    },
    revenue: {
      total: 45600000,
      monthly: 3800000,
      growth: 12.5,
    },
    offers: {
      top: [
        { name: 'Assurance Tiers Simple', customers: 456, revenue: 20520000, conversion: 92 },
        { name: 'Tiers + Premium', customers: 234, revenue: 19890000, conversion: 87 },
        { name: 'Tous Risques Premium', customers: 123, revenue: 18450000, conversion: 78 },
        { name: 'Jeune Conducteur', customers: 89, revenue: 5785000, conversion: 85 },
      ],
      performance: [
        { name: 'Assurance Tiers Simple', views: 2340, quotes: 456, conversion: 19.5 },
        { name: 'Tiers + Premium', views: 1890, quotes: 234, conversion: 12.4 },
        { name: 'Tous Risques Premium', views: 1450, quotes: 123, conversion: 8.5 },
        { name: 'Jeune Conducteur', views: 980, quotes: 89, conversion: 9.1 },
      ],
    },
    customers: {
      total: 2456,
      new: 234,
      retention: 94.5,
      demographics: [
        { age: '18-25', count: 234, percentage: 9.5 },
        { age: '26-35', count: 789, percentage: 32.1 },
        { age: '36-45', count: 856, percentage: 34.9 },
        { age: '46-55', count: 456, percentage: 18.6 },
        { age: '56+', count: 121, percentage: 4.9 },
      ],
    },
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Analysez vos performances et tendances</p>
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
                <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
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
                <p className="text-sm font-medium text-gray-600">Taux conversion</p>
                <p className="text-2xl font-bold">{analyticsData.quotes.conversionRate}%</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="ml-1">+5.2%</span>
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
                <p className="text-sm font-medium text-gray-600">Devis traités</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.quotes.total)}</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="ml-1">+23%</span>
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
                <p className="text-sm font-medium text-gray-600">Clients actifs</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.customers.total)}</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="ml-1">{analyticsData.customers.retention}% rétention</span>
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
                      <p className="text-sm text-gray-500">
                        {offer.customers} clients • {offer.conversion}% conversion
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(offer.revenue)}</p>
                    <div className="text-xs text-green-600">
                      +{Math.round(offer.revenue / analyticsData.revenue.total * 100)}% du CA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Démographie clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.customers.demographics.map((demo) => (
                <div key={demo.age} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{demo.age} ans</span>
                    <span className="text-sm text-gray-500">
                      {demo.count} clients ({demo.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${demo.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.offers.performance.map((offer) => (
                <div key={offer.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{offer.name}</span>
                    <Badge variant="outline">{offer.conversion}% conversion</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatNumber(offer.views)} vues</span>
                    <span>→</span>
                    <span>{formatNumber(offer.quotes)} devis</span>
                    <span>→</span>
                    <span>{Math.round(offer.quotes * offer.conversion / 100)} ventes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(offer.conversion * 2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
                  <p className="text-sm text-gray-600">CA Mensuel</p>
                  <p className="font-bold text-lg">{formatCurrency(analyticsData.revenue.monthly)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Croissance</p>
                  <p className={`font-bold text-lg ${getGrowthColor(analyticsData.revenue.growth)}`}>
                    {analyticsData.revenue.growth > 0 ? '+' : ''}{analyticsData.revenue.growth}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Moyenne/offre</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(analyticsData.revenue.total / analyticsData.quotes.approved)}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
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
                      {Math.round(analyticsData.quotes.total * 1.23)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nouveaux clients estimés</span>
                    <span className="font-medium">
                      {Math.round(analyticsData.customers.new * 1.15)}
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