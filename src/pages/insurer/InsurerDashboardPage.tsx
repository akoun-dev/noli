import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Car,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Bell,
  MessageCircle,
  BarChart3,
  Target,
  Phone,
  Mail,
  UserPlus,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InsurerAlertPanel } from '@/features/insurers/components/InsurerAlertPanel';
import { ClientContactPanel } from '@/features/insurers/components/ClientContactPanel';
import { insurerAlertService } from '@/features/insurers/services/insurerAlertService';
import { useClientCommunication } from '@/features/insurers/hooks/useClientCommunication';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export const InsurerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [topOffers, setTopOffers] = useState<any[]>([]);
  const [insurerId, setInsurerId] = useState<string | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [quickStats, setQuickStats] = useState({
    pendingQuotes: 0,
    approvedQuotes: 0,
    newOffers: 0,
  });

  // Only call the hook when insurerId is available
  const { clients, totalRevenue, averageConversionRate } = useClientCommunication(
    insurerId || '' // Use empty string instead of placeholder to avoid UUID error
  );

  // Check if insurer has a company setup and get insurer ID
  useEffect(() => {
    checkInsurerSetup();
  }, []);

  const checkInsurerSetup = async () => {
    try {
      const { data: insurerData, error } = await supabase.rpc('get_current_insurer_id');

      if (error || !insurerData || insurerData.length === 0) {
        // No insurer account found, redirect to setup
        logger.info('No insurer account found, redirecting to setup');
        navigate('/assureur/configuration', { replace: true });
        return;
      }

      // Insurer has a company, set insurer ID and load dashboard
      setInsurerId(insurerData[0].insurer_id);
      setIsLoadingSetup(false);
      logger.info('Insurer account found', { insurerId: insurerData[0].insurer_id });
    } catch (error) {
      logger.error('Error checking insurer setup:', error);
      // On error, still redirect to setup to be safe
      navigate('/assureur/configuration', { replace: true });
    }
  };

  // Update active clients when clients list changes
  useEffect(() => {
    setActiveClients(clients.filter(c => c.status === 'active').length);
  }, [clients]);

  // Load dashboard data when insurer is ready
  useEffect(() => {
    if (isLoadingSetup || !insurerId) return; // Don't load data until setup is confirmed

    // S'abonner aux alertes
    const unsubscribe = insurerAlertService.subscribe((alerts) => {
      setUnreadAlerts(alerts.filter(a => !a.isRead && !a.resolvedAt).length);
    });

    // Charger les données réelles
    loadDashboardData();

    return () => {
      unsubscribe();
    };
  }, [isLoadingSetup, insurerId]);

  const loadDashboardData = async () => {
    if (!insurerId) return;

    try {
      // Charger les offres récentes de l'assureur avec les informations des devis
      const { data: offersData, error: offersError } = await supabase
        .from('quote_offers')
        .select(`
          id,
          created_at,
          status,
          price,
          quotes:quote_id (
            id,
            created_at,
            status,
            personal_data,
            vehicle_data
          )
        `)
        .eq('insurer_id', insurerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (offersError) {
        logger.error('Erreur lors du chargement des offres:', offersError);
      } else if (offersData) {
        // Transform offers data into quotes display format
        const transformedQuotes = offersData
          .filter(offer => offer.quotes) // Filter out offers without quote data
          .map(offer => {
            const quote = offer.quotes!;
            const personalData = quote.personal_data as any || {};
            const vehicleData = quote.vehicle_data as any || {};

            // Extract customer name from personal_data
            const firstName = personalData.firstName || personalData.first_name || '';
            const lastName = personalData.lastName || personalData.last_name || '';
            const customerName = `${firstName} ${lastName}`.trim() || 'Client inconnu';

            // Extract vehicle info from vehicle_data
            const brand = vehicleData.brand || '';
            const model = vehicleData.model || '';
            const vehicleName = `${brand} ${model}`.trim() || 'Véhicule inconnu';

            return {
              id: quote.id,
              customer: customerName,
              vehicle: vehicleName,
              date: new Date(quote.created_at).toLocaleDateString('fr-FR'),
              amount: offer.price ? `${offer.price.toLocaleString('fr-FR')} FCFA` : 'N/A',
              status: offer.status || 'pending'
            };
          });
        setRecentQuotes(transformedQuotes);
      }

      // Charger les meilleures performances par offre d'assurance
      const { data: allOffersData, error: allOffersError } = await supabase
        .from('quote_offers')
        .select(`
          status,
          price,
          insurance_offers!inner (
            id,
            name
          )
        `)
        .eq('insurer_id', insurerId);

      if (allOffersError) {
        logger.error('Erreur lors du chargement des performances des offres:', allOffersError);
      } else if (allOffersData && allOffersData.length > 0) {
        // Grouper les données par offre
        const offerStats = new Map<string, {
          name: string;
          customers: number;
          approved: number;
          totalRevenue: number;
        }>();

        allOffersData.forEach(item => {
          const offerId = item.insurance_offers.id;
          const offerName = item.insurance_offers.name;

          if (!offerStats.has(offerId)) {
            offerStats.set(offerId, {
              name: offerName,
              customers: 0,
              approved: 0,
              totalRevenue: 0
            });
          }

          const stats = offerStats.get(offerId)!;
          stats.customers++;
          if (item.status === 'APPROVED') {
            stats.approved++;
            stats.totalRevenue += item.price || 0;
          }
        });

        // Convertir en tableau et calculer les taux de conversion
        const topOffersArray = Array.from(offerStats.values())
          .map(stats => ({
            name: stats.name,
            customers: stats.customers,
            conversion: stats.customers > 0 ? Math.round((stats.approved / stats.customers) * 100) : 0,
            revenue: stats.totalRevenue > 0
              ? stats.totalRevenue >= 1000000
                ? `${(stats.totalRevenue / 1000000).toFixed(1)}M FCFA`
                : `${(stats.totalRevenue / 1000).toFixed(0)}K FCFA`
              : '0 FCFA'
          }))
          .sort((a, b) => b.customers - a.customers) // Trier par nombre de clients
          .slice(0, 5); // Top 5

        setTopOffers(topOffersArray);

        // Calculer les statistiques rapides depuis les données réelles
        const pendingQuotes = allOffersData.filter(item => item.status === 'PENDING').length;
        const approvedQuotes = allOffersData.filter(item => item.status === 'APPROVED').length;

        // Compter les nouvelles offres (créées dans les 7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Récupérer les offres d'assurance créées récemment
        const { data: recentInsuranceOffers, error: insuranceOffersError } = await supabase
          .from('insurance_offers')
          .select('id')
          .eq('insurer_id', insurerId)
          .gte('created_at', sevenDaysAgo.toISOString());

        const newOffers = recentInsuranceOffers?.length || 0;

        setQuickStats({
          pendingQuotes,
          approvedQuotes,
          newOffers,
        });
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des données du tableau de bord:', error);
    }
  };

  const stats = [
    {
      label: 'Devis reçus',
      value: recentQuotes.length.toString(),
      change: '+23%',
      icon: FileText,
      color: 'text-blue-600',
      action: { text: 'Voir les devis', url: '/assureur/devis' }
    },
    {
      label: 'Taux conversion',
      value: `${Math.round(averageConversionRate * 100)}%`,
      change: '+5%',
      icon: TrendingUp,
      color: 'text-green-600',
      action: { text: 'Analytics', url: '/assureur/analytics' }
    },
    {
      label: 'CA mensuel',
      value: `${(totalRevenue / 1000000).toFixed(1)}M`,
      change: '+12%',
      icon: DollarSign,
      color: 'text-purple-600',
      action: { text: 'Voir les revenus', url: '/assureur/analytics' }
    },
    {
      label: 'Clients actifs',
      value: activeClients.toString(),
      change: '+45',
      icon: Users,
      color: 'text-orange-600',
      action: { text: 'Voir les clients', url: '/assureur/clients' }
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuvé
        </span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        {/* Tabs Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="flex-shrink-0 text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="clients" className="flex-shrink-0 text-xs sm:text-sm">Clients</TabsTrigger>
            <TabsTrigger value="alerts" className="flex-shrink-0 text-xs sm:text-sm relative">
              Alertes
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs absolute -top-1 -right-1 sm:static">
                  {unreadAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-shrink-0 text-xs sm:text-sm">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs" onClick={() => navigate('/assureur/analytics')}>
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analytics détaillés</span>
              <span className="sm:hidden">Analytics</span>
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Performance Overview - Mobile Optimized */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden group">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 ${stat.color} flex-shrink-0 ml-1 sm:ml-2`} />
                  </div>
                  {stat.action && (
                    <div className="mt-2 sm:mt-3 md:mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-[10px] sm:text-xs"
                        onClick={() => navigate(stat.action.url)}
                      >
                        {stat.action.text}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-base sm:text-lg">
              <span className="text-sm sm:text-base">Devis récents</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                  logger.info('Export quotes clicked');
                }}>
                  <Download className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Exporter</span>
                  <span className="sm:hidden">Exp</span>
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/assureur/devis')}>
                  Voir tout
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-accent gap-2">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{quote.customer}</p>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{quote.vehicle}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70">{quote.date}</p>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto sm:text-right sm:ml-4 gap-2">
                    <p className="font-medium text-sm">{quote.amount}</p>
                    <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Offers */}
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Offres les plus performantes</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {topOffers.map((offer, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{offer.name}</p>
                    <div className="flex space-x-2 sm:space-x-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1">
                      <span>{offer.customers} cl.</span>
                      <span>{offer.conversion}%</span>
                    </div>
                  </div>
                  <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                    <p className="font-medium text-xs sm:text-sm">{offer.revenue}</p>
                    <div className="text-[10px] sm:text-xs text-green-600">Top {index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm">Devis en attente</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{quickStats.pendingQuotes}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs flex-shrink-0" onClick={() => navigate('/assureur/devis?status=pending')}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm">Devis approuvés</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{quickStats.approvedQuotes}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs flex-shrink-0" onClick={() => navigate('/assureur/devis?status=approved')}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm">Nouvelles offres</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{quickStats.newOffers}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs flex-shrink-0" onClick={() => navigate('/assureur/offers/create')}>
                Créer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Alert for Low Performance */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-800">
                    Attention: Taux de conversion en baisse
                  </p>
                  <p className="text-[10px] sm:text-xs text-orange-600">
                    Votre taux de conversion a baissé de 5% cette semaine. Considérez revoir vos offres.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs flex-shrink-0" onClick={() => navigate('/assureur/analytics')}>
                  Analyser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Client Stats */}
            <Card className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-sm sm:text-base">Vue d'ensemble</h3>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total clients</span>
                  <span className="font-medium text-sm">{clients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Actifs</span>
                  <span className="font-medium text-green-600 text-sm">{activeClients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Prospects</span>
                  <span className="font-medium text-orange-600 text-sm">{clients.filter(c => c.status === 'prospect').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Conversion moyenne</span>
                  <span className="font-medium text-sm">{Math.round(averageConversionRate * 100)}%</span>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-3 p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Activité récente des clients</h3>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/assureur/clients')}>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Voir tout
                </Button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {clients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-accent gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{client.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {client.totalQuotes} devis • {client.convertedQuotes} convertis
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                        {client.status === 'active' ? 'Actif' : 'Prospect'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex-shrink-0"
                        onClick={() => setSelectedClient(client)}
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Contacter</span>
                        <span className="sm:hidden">Contact</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {selectedClient && (
            <Card className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-sm sm:text-base">Communication avec {selectedClient.name}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedClient(null)}
                >
                  Fermer
                </Button>
              </div>
              <ClientContactPanel client={selectedClient} insurerId="insurer-1" />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 sm:space-y-6">
          <InsurerAlertPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Stats */}
            <Card className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-sm sm:text-base">Performance rapide</h3>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Taux conversion</span>
                  <span className="font-medium text-green-600 text-sm">{Math.round(averageConversionRate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Revenu moyen/client</span>
                  <span className="font-medium text-xs sm:text-sm text-right">
                    {clients.length > 0 ? Math.round(totalRevenue / clients.length).toLocaleString('fr-FR') : 0} F
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Devis/client</span>
                  <span className="font-medium text-sm">
                    {clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.totalQuotes, 0) / clients.length) : 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Performance Insights */}
            <Card className="lg:col-span-2 p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="font-semibold text-sm sm:text-base">Insights performance</h3>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/assureur/analytics')}>
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analytics détaillés</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Conversion en hausse</span>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    Taux de conversion +5% cette semaine grâce aux nouvelles campagnes de relance.
                  </p>
                </div>
                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Nouveaux prospects</span>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    15 nouveaux prospects cette semaine, principalement via recommandations.
                  </p>
                </div>
                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Revenu record</span>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    CA mensuel record de {totalRevenue.toLocaleString('fr-FR')} FCFA.
                  </p>
                </div>
                <div className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">Engagement client</span>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                    Temps de réponse moyen de 2.5h, en dessous de la moyenne du secteur.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Items */}
          <Card className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-sm sm:text-base">Actions recommandées</h3>
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-800 text-xs sm:text-sm">Relance automatique</span>
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm text-blue-700 mb-2 sm:mb-3">
                  Configurez la relance automatique pour les devis expirants
                </p>
                <Button variant="outline" size="sm" className="w-full text-[10px] sm:text-xs" onClick={() => navigate('/assureur/parametres?tab=automation')}>
                  Configurer
                </Button>
              </div>
              <div className="p-3 sm:p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-800 text-xs sm:text-sm">Appels stratégiques</span>
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm text-green-700 mb-2 sm:mb-3">
                  5 prospects à contacter par téléphone cette semaine
                </p>
                <Button variant="outline" size="sm" className="w-full text-[10px] sm:text-xs" onClick={() => navigate('/assureur/clients?filter=prospects')}>
                  Voir la liste
                </Button>
              </div>
              <div className="p-3 sm:p-4 border border-purple-200 bg-purple-50 rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                  <span className="font-medium text-purple-800 text-xs sm:text-sm">Optimisation offres</span>
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm text-purple-700 mb-2 sm:mb-3">
                  2 offres sous-performantes à revoir
                </p>
                <Button variant="outline" size="sm" className="w-full text-[10px] sm:text-xs" onClick={() => navigate('/assureur/analytics')}>
                  Analyser
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsurerDashboardPage;
