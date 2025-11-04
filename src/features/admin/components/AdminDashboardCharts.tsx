import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Shield,
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { usePlatformStats, useActivityData, useUserDemographics, useQuoteAnalytics } from '@/features/admin/services/analyticsService';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

interface AdminDashboardChartsProps {
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
  onRefresh: () => void;
}

export const AdminDashboardCharts: React.FC<AdminDashboardChartsProps> = ({
  timeRange,
  onTimeRangeChange,
  onRefresh
}) => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = usePlatformStats();
  const { data: activityData, isLoading: activityLoading } = useActivityData(timeRange);
  const { data: demographics, isLoading: demographicsLoading } = useUserDemographics();
  const { data: quoteAnalytics, isLoading: quotesLoading } = useQuoteAnalytics();

  const handleRefresh = () => {
    onRefresh();
    refetchStats();
  };

  // Préparer les données pour le graphique d'activité
  const activityChartData = activityData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: 'short', month: 'short' }),
    newUsers: item.newUsers,
    newQuotes: item.newQuotes,
    newPolicies: item.newPolicies
  })) || [];

  // Préparer les données pour le graphique démographique par âge
  const ageChartData = demographics?.byAge.map(item => ({
    name: item.range,
    value: item.count,
    percentage: Math.round((item.count / (demographics.byAge.reduce((sum, item) => sum + item.count, 0) || 1)) * 100)
  })) || [];

  // Préparer les données pour le graphique démographique par localisation
  const locationChartData = demographics?.byLocation.map(item => ({
    name: item.city,
    value: item.count
  })) || [];

  // Préparer les données pour le graphique des appareils
  const deviceChartData = demographics?.byDevice.map(item => ({
    name: item.device,
    value: item.count,
    percentage: Math.round((item.count / (demographics.byDevice.reduce((sum, item) => sum + item.count, 0) || 1)) * 100)
  })) || [];

  // Préparer les données pour le graphique des quotes par statut
  const quoteStatusData = quoteAnalytics?.byStatus.map(item => ({
    name: item.status,
    value: item.count
  })) || [];

  // Métriques principales
  const primaryMetrics = [
    {
      title: 'Utilisateurs Actifs',
      value: stats?.totalUsers.toLocaleString() || '0',
      change: stats?.monthlyGrowth || 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Devis Générés',
      value: stats?.totalQuotes.toLocaleString() || '0',
      change: 15.2, // Placeholder
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Taux Conversion',
      value: `${stats?.conversionRate || 0}%`,
      change: 2.3, // Placeholder
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Assureurs Actifs',
      value: stats?.totalInsurers.toLocaleString() || '0',
      change: 8.7, // Placeholder
      icon: Shield,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tableau de Bord Analytique</h2>
          <p className="text-muted-foreground">Vue d'ensemble en temps réel de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sélecteur de plage de temps */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTimeRangeChange(range)}
                className="text-xs"
              >
                {range === '7d' ? '7J' : range === '30d' ? '30J' : '90J'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <div className="flex items-center mt-1">
                      {metric.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${
                        metric.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique d'activité */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activité de la Plateforme</span>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {timeRange === '7d' ? '7 derniers jours' : timeRange === '30d' ? '30 derniers jours' : '90 derniers jours'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : activityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stackId="1"
                    stroke="#0088FE"
                    fill="#0088FE"
                    fillOpacity={0.6}
                    name="Nouveaux Utilisateurs"
                  />
                  <Area
                    type="monotone"
                    dataKey="newQuotes"
                    stackId="1"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                    name="Nouveaux Devis"
                  />
                  <Area
                    type="monotone"
                    dataKey="newPolicies"
                    stackId="1"
                    stroke="#FFBB28"
                    fill="#FFBB28"
                    fillOpacity={0.6}
                    name="Nouvelles Polices"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        {/* Démographie par âge */}
        <Card>
          <CardHeader>
            <CardTitle>Démographie par Tranche d'Âge</CardTitle>
          </CardHeader>
          <CardContent>
            {demographicsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : ageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ageChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Données démographiques non disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Démographie par localisation */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs par Localisation</CardTitle>
          </CardHeader>
          <CardContent>
            {demographicsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : locationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Données de localisation non disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par appareil */}
        <Card>
          <CardHeader>
            <CardTitle>Appareils Utilisés</CardTitle>
          </CardHeader>
          <CardContent>
            {demographicsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : deviceChartData.length > 0 ? (
              <div className="space-y-4">
                {deviceChartData.map((device, index) => (
                  <div key={device.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{device.value} utilisateurs</span>
                      <Badge variant="secondary">{device.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Données d'appareils non disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statuts des devis */}
        <Card>
          <CardHeader>
            <CardTitle>Devis par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : quoteStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quoteStatusData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Données de devis non disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardCharts;