import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Clock,
  Star,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { insurerAnalyticsService, DetailedAnalytics, AnalyticsPeriod } from '../services/insurerAnalyticsService';

export const DetailedAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [periods] = useState(insurerAnalyticsService.getAvailablePeriods());

  useEffect(() => {
    // Charger la période par défaut (30 derniers jours)
    const defaultPeriod = periods.find(p => p.label === '30 derniers jours') || periods[1];
    setSelectedPeriod(defaultPeriod);
  }, [periods]);

  useEffect(() => {
    if (selectedPeriod) {
      loadAnalytics(selectedPeriod);
      loadRealTimeData();
    }

    // Actualiser les données en temps réel toutes les 30 secondes
    const interval = setInterval(() => {
      if (selectedPeriod) {
        loadRealTimeData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadAnalytics = async (period: AnalyticsPeriod) => {
    setIsLoading(true);
    try {
      const data = await insurerAnalyticsService.getDetailedAnalytics('insurer-1', period);
      setAnalytics(data);
    } catch (error) {
      logger.error('Erreur chargement analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const data = await insurerAnalyticsService.getRealTimeAnalytics('insurer-1');
      setRealTimeData(data);
    } catch (error) {
      logger.error('Erreur chargement données temps réel:', error);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    if (!selectedPeriod) return;

    try {
      const blob = await insurerAnalyticsService.exportAnalytics('insurer-1', selectedPeriod, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${selectedPeriod.label}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Erreur export analytics:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!selectedPeriod) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Détaillés</h1>
          <p className="text-muted-foreground">
            {selectedPeriod.label} - {format(selectedPeriod.start, 'dd MMM yyyy', { locale: fr })} au {format(selectedPeriod.end, 'dd MMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPeriod.label} onValueChange={(value) => {
            const period = periods.find(p => p.label === value);
            if (period) setSelectedPeriod(period);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period.label} value={period.label}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Données en temps réel */}
      {realTimeData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                <p className="text-xl font-bold">{realTimeData.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Devis en attente</p>
                <p className="text-xl font-bold">{realTimeData.pendingQuotes}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu aujourd'hui</p>
                <p className="text-xl font-bold">{formatCurrency(realTimeData.todayRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Devis aujourd'hui</p>
                <p className="text-xl font-bold">{realTimeData.todayQuotes}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion aujourd'hui</p>
                <p className="text-xl font-bold">{formatPercentage(realTimeData.conversionRateToday)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-cyan-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Temps réponse moyen</p>
                <p className="text-xl font-bold">{realTimeData.averageResponseTime.toFixed(1)} min</p>
              </div>
              <Clock className="h-8 w-8 text-pink-600" />
            </div>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des analytics...</p>
        </div>
      ) : analytics ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPIs principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Taux de conversion</h3>
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{formatPercentage(analytics.conversion.conversionRate)}</div>
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(0.05)}
                    <span className={getTrendColor(0.05)}>+5% vs période précédente</span>
                  </div>
                  <Progress value={analytics.conversion.conversionRate * 100} className="h-2" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Revenu total</h3>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{formatCurrency(analytics.revenue.totalRevenue)}</div>
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(0.12)}
                    <span className={getTrendColor(0.12)}>+12% vs période précédente</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatCurrency(analytics.revenue.monthlyRevenue)}/mois</p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Satisfaction client</h3>
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{analytics.performance.customerSatisfactionScore.toFixed(1)}/5</div>
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(0.08)}
                    <span className={getTrendColor(0.08)}>+0.2 vs période précédente</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(analytics.performance.customerSatisfactionScore)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Taux de rétention</h3>
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{formatPercentage(analytics.performance.retentionRate)}</div>
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(0.03)}
                    <span className={getTrendColor(0.03)}>+3% vs période précédente</span>
                  </div>
                  <Progress value={analytics.performance.retentionRate * 100} className="h-2" />
                </div>
              </Card>
            </div>

            {/* Benchmark */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Benchmark du secteur</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Votre taux conversion</span>
                    <span className="font-medium">{formatPercentage(analytics.conversion.conversionRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moyenne secteur</span>
                    <span>{formatPercentage(analytics.benchmark.industryAverage.conversionRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meilleur performeur</span>
                    <span className="text-green-600">{formatPercentage(analytics.benchmark.topPerformer.conversionRate)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Votre satisfaction</span>
                    <span className="font-medium">{analytics.performance.customerSatisfactionScore.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moyenne secteur</span>
                    <span>{analytics.benchmark.industryAverage.customerSatisfaction.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meilleur performeur</span>
                    <span className="text-green-600">{analytics.benchmark.topPerformer.customerSatisfaction.toFixed(1)}/5</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Votre rétention</span>
                    <span className="font-medium">{formatPercentage(analytics.performance.retentionRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moyenne secteur</span>
                    <span>{formatPercentage(analytics.benchmark.industryAverage.retentionRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Meilleur performeur</span>
                    <span className="text-green-600">{formatPercentage(analytics.benchmark.topPerformer.retentionRate)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entonnoir de conversion */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Entonnoir de conversion</h3>
                <div className="space-y-4">
                  {analytics.conversion.conversionFunnel.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{stage.stage}</span>
                        <span className="font-medium">{stage.count} ({formatPercentage(stage.rate)})</span>
                      </div>
                      <Progress value={stage.rate * 100} className="h-3" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Performance par agent */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance par agent</h3>
                <div className="space-y-4">
                  {analytics.performance.performanceByAgent.map((agent) => (
                    <div key={agent.agentId} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{agent.agentName}</h4>
                          <p className="text-sm text-muted-foreground">{agent.quotesHandled} devis traités</p>
                        </div>
                        <Badge variant={agent.conversionRate > 0.2 ? 'default' : 'secondary'}>
                          {formatPercentage(agent.conversionRate)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Temps réponse: </span>
                          <span>{agent.averageResponseTime.toFixed(1)} min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenu: </span>
                          <span>{formatCurrency(agent.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenus par produit */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenus par produit</h3>
                <div className="space-y-4">
                  {analytics.revenue.revenueByProduct.map((product) => (
                    <div key={product.product} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{product.product}</span>
                        <span className="font-medium">{formatCurrency(product.revenue)} ({product.percentage}%)</span>
                      </div>
                      <Progress value={product.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">{product.policies} polices</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Performance des produits */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance des produits</h3>
                <div className="space-y-4">
                  {analytics.products.productPerformance.map((product) => (
                    <div key={product.productId} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{product.productName}</h4>
                        <Badge variant="outline">{formatPercentage(product.marketShare)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Conversion: </span>
                          <span>{formatPercentage(product.conversionRate)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prime moyenne: </span>
                          <span>{formatCurrency(product.averagePremium)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Segments clients */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Segments clients</h3>
                <div className="space-y-4">
                  {analytics.clients.clientSegments.map((segment) => (
                    <div key={segment.segment} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{segment.segment}</span>
                        <span className="font-medium">{segment.count} ({segment.percentage}%)</span>
                      </div>
                      <Progress value={segment.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">Valeur moyenne: {formatCurrency(segment.averageValue)}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Démographie */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Démographie</h3>
                <div className="space-y-4">
                  {analytics.clients.clientDemographics.map((demo) => (
                    <div key={demo.age} className="flex justify-between">
                      <span className="text-sm">{demo.age}</span>
                      <div className="text-right">
                        <div className="font-medium">{demo.count}</div>
                        <div className="text-xs text-muted-foreground">{demo.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Géographie */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Répartition géographique</h3>
                <div className="space-y-4">
                  {analytics.clients.clientGeography.map((region) => (
                    <div key={region.region} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{region.region}</span>
                        <span className="font-medium">{region.count} ({region.percentage}%)</span>
                      </div>
                      <Progress value={region.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">{formatCurrency(region.revenue)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comparaison des produits</h3>
              <div className="space-y-6">
                {analytics.products.productComparison.map((comparison) => (
                  <div key={comparison.metric}>
                    <h4 className="font-medium mb-3">{comparison.metric}</h4>
                    <div className="space-y-2">
                      {comparison.products.map((product) => (
                        <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={product.rank === 1 ? 'default' : 'secondary'}>
                              #{product.rank}
                            </Badge>
                            <span>{product.name}</span>
                          </div>
                          <span className="font-medium">
                            {comparison.metric === 'Prime moyenne' ? formatCurrency(product.value) :
                             comparison.metric === 'Taux conversion' ? formatPercentage(product.value) :
                             formatPercentage(product.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
};