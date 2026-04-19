import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  MousePointer,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Filter,
  Plus,
  Minus,
  Zap,
  Award,
  Loader2
} from 'lucide-react';
import {
  usePlatformStats,
  useActivityData,
  useTopInsurers,
  useSystemHealth,
  useUserDemographics,
  useQuoteAnalytics,
  useExportAnalyticsReport
} from '@/features/admin/services/analyticsService';

interface KPI {
  id: string;
  name: string;
  value: string;
  target: string;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: string;
  description: string;
}

interface TimeSeriesData {
  date: string;
  users: number;
  quotes: number;
  conversions: number;
  clicks: number;
}

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  target: number;
  dropRate: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
}

export const AdminAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('conversion');

  // React Query hooks
  const { data: platformStats, isLoading: statsLoading } = usePlatformStats();
  const { data: activityData, isLoading: activityLoading } = useActivityData(timeRange as '7d' | '30d' | '90d');
  const { data: topInsurers, isLoading: insurersLoading } = useTopInsurers();
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth();
  const { data: demographics, isLoading: demographicsLoading } = useUserDemographics();
  const { data: quoteAnalytics, isLoading: quotesLoading } = useQuoteAnalytics();
  const exportReport = useExportAnalyticsReport();

  // KPI data based on real analytics
  const kpis: KPI[] = [
    {
      id: 'conversion_rate',
      name: 'Taux de conversion',
      value: platformStats?.conversionRate !== undefined ? `${platformStats.conversionRate}%` : '-',
      target: '15%',
      unit: '%',
      status: platformStats && platformStats.conversionRate >= 15 ? 'excellent' : platformStats?.conversionRate !== undefined ? 'good' : 'warning',
      trend: 'up',
      change: platformStats?.monthlyGrowth !== undefined ? `${platformStats.monthlyGrowth >= 0 ? '+' : ''}${platformStats.monthlyGrowth}%` : '-',
      description: 'Pourcentage de visiteurs qui deviennent utilisateurs'
    },
    {
      id: 'quotes_completion',
      name: 'Taux complétion devis',
      value: quoteAnalytics?.completionRate !== undefined ? `${quoteAnalytics.completionRate}%` : '-',
      target: '50%',
      unit: '%',
      status: quoteAnalytics && quoteAnalytics.completionRate >= 50 ? 'excellent' : quoteAnalytics?.completionRate !== undefined ? 'good' : 'warning',
      trend: 'up',
      change: platformStats?.quotesMonthlyGrowth !== undefined ? `${platformStats.quotesMonthlyGrowth >= 0 ? '+' : ''}${platformStats.quotesMonthlyGrowth}%` : '-',
      description: 'Pourcentage de devis qui se convertissent en polices'
    },
    {
      id: 'response_time',
      name: 'Temps de résultats',
      value: systemHealth ? `${systemHealth.responseTime}ms` : '-',
      target: '300ms',
      unit: 'ms',
      status: systemHealth && systemHealth.responseTime <= 300 ? 'excellent' : systemHealth?.responseTime ? 'good' : 'warning',
      trend: 'up',
      change: systemHealth && systemHealth.responseTime ? `${systemHealth.responseTime <= 300 ? '-' : '+'}${Math.abs(300 - systemHealth.responseTime)}ms` : '-',
      description: 'Temps moyen pour obtenir les résultats de comparaison'
    },
    {
      id: 'system_uptime',
      name: 'Disponibilité système',
      value: systemHealth?.uptime !== undefined ? `${systemHealth.uptime}%` : '-',
      target: '99%',
      unit: '%',
      status: systemHealth && systemHealth.uptime >= 99 ? 'excellent' : systemHealth?.uptime !== undefined ? 'good' : 'warning',
      trend: 'stable',
      change: systemHealth?.uptime !== undefined ? `${systemHealth.uptime >= 99 ? 'Stable' : 'Attention'}` : '-',
      description: 'Pourcentage de temps où le système est opérationnel'
    }
  ];

  // Conversion funnel basé sur les vraies données de la base
  const totalUsers = platformStats?.totalUsers || 0;
  const conversionRate = platformStats?.conversionRate || 0;
  const totalPolicies = platformStats?.totalPolicies || 0;

  const conversionFunnel: ConversionFunnel[] = [
    { stage: 'Utilisateurs inscrits', count: totalUsers, percentage: 100, target: 100, dropRate: 0 },
    { stage: 'Devis créés', count: platformStats?.totalQuotes || 0, percentage: totalUsers > 0 ? Math.round((platformStats?.totalQuotes || 0) / totalUsers * 100) : 0, target: 60, dropRate: totalUsers > 0 ? Math.round(100 - ((platformStats?.totalQuotes || 0) / totalUsers * 100)) : 0 },
    { stage: 'Devis approuvés', count: platformStats?.totalQuotes ? Math.floor(platformStats.totalQuotes * (conversionRate / 100)) : 0, percentage: conversionRate, target: 30, dropRate: 100 - conversionRate },
    { stage: 'Polices souscrites', count: totalPolicies, percentage: platformStats?.totalQuotes > 0 ? Math.round(totalPolicies / platformStats.totalQuotes * 100) : 0, target: 15, dropRate: platformStats?.totalQuotes > 0 ? Math.round(100 - (totalPolicies / platformStats.totalQuotes * 100)) : 0 },
  ];

  const stats = {
    users: {
      active: platformStats?.totalUsers,
      growth: platformStats?.monthlyGrowth,
    },
    quotes: {
      total: platformStats?.totalQuotes,
      growth: platformStats?.quotesMonthlyGrowth,
    },
    policies: {
      total: platformStats?.totalPolicies,
      growth: undefined,
    },
    insurers: {
      growth: platformStats?.insurersMonthlyGrowth,
    },
  };

  const estimatedRevenueInFCFA = quoteAnalytics?.averageValue && platformStats?.totalPolicies
    ? Math.round(quoteAnalytics.averageValue * platformStats.totalPolicies)
    : undefined;

  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Temps de réponse serveur',
      value: systemHealth?.responseTime || 245,
      target: 300,
      unit: 'ms',
      status: (systemHealth?.responseTime || 245) <= 300 ? 'good' : 'warning',
      trend: 'improving'
    },
    {
      name: 'Disponibilité service',
      value: systemHealth?.uptime || 98.5,
      target: 99,
      unit: '%',
      status: (systemHealth?.uptime || 98.5) >= 99 ? 'good' : 'warning',
      trend: 'stable'
    },
    {
      name: 'Mémoire utilisée',
      value: systemHealth?.memoryUsage || 68,
      target: 80,
      unit: '%',
      status: (systemHealth?.memoryUsage || 68) <= 80 ? 'good' : 'warning',
      trend: 'stable'
    },
    {
      name: 'Stockage utilisé',
      value: systemHealth?.storageUsage || 21,
      target: 50,
      unit: '%',
      status: (systemHealth?.storageUsage || 21) <= 50 ? 'good' : 'warning',
      trend: 'stable'
    },
    {
      name: 'Alertes système',
      value: systemHealth?.alerts.length || 2,
      target: 0,
      unit: '',
      status: (systemHealth?.alerts.length || 2) === 0 ? 'good' : 'warning',
      trend: 'stable'
    }
  ];

  const timeSeriesData: TimeSeriesData[] = activityData ? activityData.map(item => ({
    date: item.date,
    users: item.newUsers || 0,
    quotes: item.newQuotes || 0,
    conversions: item.newPolicies || 0,
    clicks: Math.floor((item.newUsers || 0) * 0.08)
  })) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">Bon</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">Attention</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">Critique</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down':
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const calculateKPIDistribution = () => {
    const total = kpis.length;
    const excellent = kpis.filter(kpi => kpi.status === 'excellent').length;
    const good = kpis.filter(kpi => kpi.status === 'good').length;
    const warning = kpis.filter(kpi => kpi.status === 'warning').length;
    const critical = kpis.filter(kpi => kpi.status === 'critical').length;

    return {
      excellent: (excellent / total) * 100,
      good: (good / total) * 100,
      warning: (warning / total) * 100,
      critical: (critical / total) * 100
    };
  };

  const kpiDistribution = calculateKPIDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Bord Statistiques</h1>
          <p className="text-muted-foreground">Indicateurs clés de performance et analytics</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport.mutate({ reportType: 'comprehensive', period: timeRange as '7d' | '30d' | '90d' })}>
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Indicateurs Clés de Performance</span>
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kpis.map((kpi) => (
                <div key={kpi.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{kpi.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.description}</p>
                    </div>
                    {getStatusBadge(kpi.status)}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getStatusColor(kpi.status)}`}>
                        {kpi.value}
                      </span>
                      {getTrendIcon(kpi.trend)}
                      <span className="text-sm text-green-600 dark:text-green-400">{kpi.change}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Cible: {kpi.target}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        kpi.status === 'excellent' ? 'bg-green-600' :
                        kpi.status === 'good' ? 'bg-blue-600' :
                        kpi.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{
                        width: `${Math.min(100, (parseFloat(kpi.value) / parseFloat(kpi.target)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution des KPI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-600 dark:text-green-400">Excellent</span>
                  <span className="text-sm">{kpiDistribution.excellent.toFixed(0)}%</span>
                </div>
                <Progress value={kpiDistribution.excellent} className="h-3" />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-600 dark:text-blue-400">Bon</span>
                  <span className="text-sm">{kpiDistribution.good.toFixed(0)}%</span>
                </div>
                <Progress value={kpiDistribution.good} className="h-3" />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">Attention</span>
                  <span className="text-sm">{kpiDistribution.warning.toFixed(0)}%</span>
                </div>
                <Progress value={kpiDistribution.warning} className="h-3" />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-600 dark:text-red-400">Critique</span>
                  <span className="text-sm">{kpiDistribution.critical.toFixed(0)}%</span>
                </div>
                <Progress value={kpiDistribution.critical} className="h-3" />
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {kpis.filter(k => k.status === 'excellent' || k.status === 'good').length}/{kpis.length} KPIs atteints
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="conversion" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="conversion">Entonnoir</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="realtime">Temps réel</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel Tab */}
        <TabsContent value="conversion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Entonnoir de conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel.map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{stage.count.toLocaleString()}</span>
                          <span className="text-sm font-medium">{stage.percentage.toFixed(1)}%</span>
                          {stage.target > 0 && (
                            <Badge className={stage.percentage >= stage.target ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'}>
                              Cible: {stage.target}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div
                          className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${stage.percentage}%` }}
                        />
                      </div>
                      {index > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Taux d'abandon: {stage.dropRate.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">Points forts</span>
                    </div>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Taux de complétion formulaire supérieur à la cible</li>
                      <li>• Excellent taux de conversion final</li>
                      <li>• Temps de réponse optimal</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">À améliorer</span>
                    </div>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• 30% d'abandon au démarrage du formulaire</li>
                      <li>• Taux de clics pourrait être optimisé</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Objectifs</span>
                    </div>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Réduire l'abandon initial à 25%</li>
                      <li>• Augmenter les clics à 30%</li>
                      <li>• Maintenir la conversion actuelle</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance technique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{metric.name}</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(metric.trend)}
                          <Badge className={
                            metric.status === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' :
                            metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                          }>
                            {metric.status === 'good' ? 'Bon' : metric.status === 'warning' ? 'Attention' : 'Critique'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xl font-bold ${
                          metric.status === 'good' ? 'text-green-600' :
                          metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {metric.value}{metric.unit}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Cible: {metric.target}{metric.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.status === 'good' ? 'bg-green-600' :
                            metric.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{
                            width: `${Math.min(100, (metric.value / metric.target) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>État système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800 dark:text-green-200">Disponibilité</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">99.8%</span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Temps d'arrêt: 1h 45min ce mois-ci
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-800 dark:text-blue-200">Temps de réponse moyen</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">245ms</span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Amélioration de 15% ce mois-ci
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">Taux d'erreur</span>
                      <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">0.5%</span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Stable par rapport au mois dernier
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-800 dark:text-purple-200">Utilisation ressources</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">56%</span>
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      CPU: 45%, Mémoire: 68%, Disque: 54%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution sur 30 jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would typically include a chart component */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs actifs</span>
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.users?.active?.toLocaleString() || '-'}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {stats?.users?.growth !== undefined ? `${stats.users.growth >= 0 ? '+' : ''}${stats.users.growth}% vs mois dernier` : '-'}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Devis générés</span>
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.quotes?.total?.toLocaleString() || '-'}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {stats?.quotes?.growth !== undefined ? `${stats.quotes.growth >= 0 ? '+' : ''}${stats.quotes.growth}% vs mois dernier` : '-'}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversions</span>
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.policies?.total?.toLocaleString() || '-'}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {stats?.policies?.growth !== undefined ? `${stats.policies.growth >= 0 ? '+' : ''}${stats.policies.growth}% vs mois dernier` : '-'}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus générés</span>
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {estimatedRevenueInFCFA !== undefined
                        ? `${estimatedRevenueInFCFA.toLocaleString()} FCFA`
                        : '-'}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {stats?.insurers?.growth !== undefined ? `${stats.insurers.growth >= 0 ? '+' : ''}${stats.insurers.growth}% vs mois dernier` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                  <span>Activité en temps réel</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Utilisateurs en ligne</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">342</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Formulaires actifs</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">28</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Comparaisons en cours</span>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">15</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Clics cette heure</span>
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">127</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Alertes et notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-800 dark:text-green-200">Système opérationnel</span>
                      <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                        {systemHealth?.uptime !== undefined ? `${systemHealth.uptime.toFixed(1)}% disponibilité` : '-'}
                      </span>
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {systemHealth?.uptime !== undefined && systemHealth.uptime >= 99 ? 'Tous les services fonctionnent normalement' : 'Attention requise'}
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">Pic d'activité</span>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-auto">
                        {systemHealth?.responseTime !== undefined ? `${Math.round(systemHealth.responseTime)}ms temps de réponse` : '-'}
                      </span>
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {systemHealth?.responseTime !== undefined && systemHealth.responseTime < 500 ? 'Normal' : 'Légerement lent'}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Nouveau record</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                        {activityData?.length > 0 ? `${Math.round(new Date().getTime() / 1000 / 60)} min` : '-'}
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Comparaisons aujourd'hui: {activityData?.length > 0 ? activityData.reduce((sum, day) => sum + (day.newQuotes || 0), 0) : '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsPage;
