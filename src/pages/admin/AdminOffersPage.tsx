import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MousePointer,
  Users,
  Star,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Calendar,
  Copy,
  MoreHorizontal,
  Activity,
  Target,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { guaranteeService } from '@/features/tarification/services/guaranteeService';
import { pricingService } from '@/features/tarification/services/pricingService';
import { offerService, type Offer, type Insurer, type OfferAnalytics, type OfferFormData, type OfferStats } from '@/features/admin/services/offerService';
import type { Guarantee, InsurancePackage } from '@/types/tarification';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';


export const AdminOffersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insurerFilter, setInsurerFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  // Data states
  const [offers, setOffers] = useState<Offer[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [offerAnalytics, setOfferAnalytics] = useState<OfferAnalytics[]>([]);
  const [offerStats, setOfferStats] = useState<OfferStats | null>(null);
  const [apiCategories, setApiCategories] = useState<Array<{ value: string; label: string }>>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [offersData, insurersData, statsData, categoriesData] = await Promise.all([
        offerService.getOffers(),
        offerService.getInsurers(),
        offerService.getOfferStats(),
        offerService.getCategories()
      ]);
      
      setOffers(offersData);
      setInsurers(insurersData);
      setOfferStats(statsData);
      setApiCategories(categoriesData);
    } catch (err) {
      logger.error('Error loading offers data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const analyticsData = await offerService.getAllOffersAnalytics();
      setOfferAnalytics(analyticsData);
    } catch (err) {
      logger.error('Error loading analytics:', err);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (offers.length > 0) {
      loadAnalytics();
    }
  }, [offers.length]);

  // Use API categories if available, otherwise use fallback categories
  const categories = apiCategories.length > 0 ? apiCategories : [
    { value: 'auto', label: 'Auto' },
    { value: 'moto', label: 'Moto' },
    { value: 'habitation', label: 'Habitation' },
    { value: 'sante', label: 'Santé' },
    { value: 'voyage', label: 'Voyage' }
  ];

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    const matchesInsurer = insurerFilter === 'all' || offer.insurerId === insurerFilter;
    const matchesCategory = categoryFilter === 'all' || offer.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesInsurer && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Actif</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Inactif</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Haute</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">Moyenne</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Basse</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getInsurerStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Actif</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Inactif</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOfferAction = async (action: string, offerId: string) => {
    try {
      switch (action) {
        case 'delete':
          await offerService.deleteOffer(offerId);
          toast.success('Offre supprimée avec succès');
          break;
        case 'duplicate':
          await offerService.duplicateOffer(offerId);
          toast.success('Offre dupliquée avec succès');
          break;
        default:
          logger.info(`Unknown action: ${action} for offer ${offerId}`);
      }
      loadData(); // Refresh data
    } catch (err) {
      logger.error(`Error ${action} offer:`, err);
      toast.error(`Erreur lors de l'action: ${action}`);
    }
  };

  const duplicateOffer = async (offerId: string) => {
    try {
      await offerService.duplicateOffer(offerId);
      toast.success('Offre dupliquée avec succès');
      setShowDuplicateDialog(false);
      loadData(); // Refresh data
    } catch (err) {
      logger.error('Error duplicating offer:', err);
      toast.error('Erreur lors de la duplication de l\'offre');
    }
  };

  const exportOffers = async () => {
    try {
      const blob = await offerService.exportOffers('csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'offers.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Offres exportées avec succès');
    } catch (err) {
      logger.error('Error exporting offers:', err);
      toast.error('Erreur lors de l\'exportation des offres');
    }
  };

  const importOffers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await offerService.importOffers(file);
      if (result.success > 0) {
        toast.success(`${result.success} offres importées avec succès`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erreurs lors de l'importation`);
      }
      loadData(); // Refresh data
    } catch (err) {
      logger.error('Error importing offers:', err);
      toast.error('Erreur lors de l\'importation des offres');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const totalOffers = offerStats?.total || 0;
  const activeOffers = offerStats?.active || 0;
  const totalClicks = offerStats?.totalClicks || 0;
  const totalConversions = offerStats?.totalConversions || 0;
  const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Offres</h1>
          <p className="text-muted-foreground">Gérez toutes les offres d'assurance de la plateforme</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportOffers} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <label>
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </span>
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={importOffers}
              className="hidden"
            />
          </label>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle offre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle offre</DialogTitle>
              </DialogHeader>
              <OfferForm insurers={insurers} categories={categories} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Offres</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalOffers}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">+12%</span>
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Offres Actives</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeOffers}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">+3</span>
                    </div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clics Totaux</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalClicks.toLocaleString()}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400">+23%</span>
                    </div>
                  </div>
                  <MousePointer className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux Conversion</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{overallConversionRate}%</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">+2.3%</span>
                    </div>
                  </div>
                  <Target className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="offers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="offers" className="text-xs sm:text-sm">Offres</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <span className="text-lg">Liste des Offres</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher une offre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="draft">Brouillons</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={insurerFilter} onValueChange={setInsurerFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous assureurs</SelectItem>
                      {insurers.map(insurer => (
                        <SelectItem key={insurer.id} value={insurer.id}>
                          {insurer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="responsive-table-wrapper">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-4">Offre</th>
                      <th className="text-left p-2 sm:p-4">Assureur</th>
                      <th className="text-left p-2 sm:p-4">Prix</th>
                      <th className="text-left p-2 sm:p-4">Statut</th>
                      <th className="text-left p-2 sm:p-4 hidden md:table-cell">Performance</th>
                      <th className="text-left p-2 sm:p-4 hidden lg:table-cell">Notes</th>
                      <th className="text-left p-2 sm:p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      // Loading skeletons for table rows
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 sm:p-4">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="flex items-center space-x-2">
                              <Skeleton className="h-3 w-3" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="p-2 sm:p-4">
                            <Skeleton className="h-6 w-16 rounded" />
                          </td>
                          <td className="p-2 sm:p-4 hidden md:table-cell">
                            <div className="space-y-1">
                              <Skeleton className="h-3 w-8" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 hidden lg:table-cell">
                            <div className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-3 w-8" />
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="flex space-x-1 sm:space-x-2">
                              <Skeleton className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2 rounded" />
                              <Skeleton className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2 rounded" />
                              <Skeleton className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2 rounded" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredOffers.map((offer) => (
                      <tr key={offer.id} className="border-b hover:bg-accent">
                        <td className="p-2 sm:p-4">
                          <div>
                            <div className="font-medium text-sm">{offer.title}</div>
                            <div className="text-xs text-muted-foreground">{offer.category}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {offer.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" style={{ fontSize: '0.65rem' }}>
                                  {tag}
                                </Badge>
                              ))}
                              {offer.tags.length > 2 && (
                                <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400" style={{ fontSize: '0.65rem' }}>
                                  +{offer.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm">{offer.insurer}</div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {offer.price.toLocaleString()} {offer.currency}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="font-medium text-sm">{offer.price.toLocaleString()} {offer.currency}</div>
                          <div className="text-xs text-muted-foreground hidden sm:block">
                            {offer.validUntil ? `Valide jusqu'au ${offer.validUntil}` : 'Sans limite'}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(offer.status)}
                            {getPriorityBadge(offer.priority)}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{offer.clicks}</span> clics
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">{offer.conversions}</span> conversions
                            </div>
                            <div className="text-xs text-green-600">
                              {offer.conversionRate.toFixed(1)}% conversion
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {renderStars(offer.averageRating)}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ({offer.reviewCount})
                            </span>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex space-x-1 sm:space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails de l'offre</DialogTitle>
                                </DialogHeader>
                                <OfferDetails offer={offer} />
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedOffer(offer)} className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Modifier l'offre</DialogTitle>
                                </DialogHeader>
                                <OfferForm offer={selectedOffer} insurers={insurers} categories={categories} />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setShowDuplicateDialog(true);
                              }}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOffer(offer);
                                setShowDeleteDialog(true);
                              }}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des offres</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-16 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-3 w-16 mb-1" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offerAnalytics.map((analytics) => {
                      const offer = offers.find(o => o.id === analytics.offerId);
                      return (
                        <div key={analytics.offerId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{offer?.title}</h4>
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                              {analytics.period}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Vues</div>
                              <div className="text-lg font-bold">{analytics.views.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Clics</div>
                              <div className="text-lg font-bold">{analytics.clicks.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Conversions</div>
                              <div className="text-lg font-bold">{analytics.conversions}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Revenus</div>
                              <div className="text-lg font-bold">{(analytics.revenue / 1000000).toFixed(1)}M FCFA</div>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">CTR</div>
                              <div className="font-medium">{analytics.ctr.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Taux conversion</div>
                              <div className="font-medium">{analytics.conversionRate.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top des offres performantes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers
                      .filter(o => o.status === 'active')
                      .sort((a, b) => b.conversionRate - a.conversionRate)
                      .slice(0, 5)
                      .map((offer, index) => (
                        <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{offer.title}</div>
                              <div className="text-sm text-muted-foreground">{offer.insurer}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 dark:text-green-400">{offer.conversionRate.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">{offer.conversions} conversions</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer l'offre "{selectedOffer?.title}"?</p>
            <p className="text-sm text-red-600">Cette action est irréversible et supprimera toutes les données associées.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedOffer) {
                    handleOfferAction('delete', selectedOffer.id);
                    setShowDeleteDialog(false);
                  }
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Confirmation Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dupliquer l'offre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Voulez-vous créer une copie de l'offre "{selectedOffer?.title}"?</p>
            <p className="text-sm text-muted-foreground">Une nouvelle offre sera créée avec les mêmes caractéristiques mais avec le statut "brouillon".</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (selectedOffer) {
                    duplicateOffer(selectedOffer.id);
                  }
                }}
              >
                Dupliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Offer Form Component
const OfferForm: React.FC<{ offer?: any; insurers: any[]; categories: any[] }> = ({ offer, insurers, categories }) => {
  const [formData, setFormData] = useState({
    title: offer?.title || '',
    description: offer?.description || '',
    insurerId: offer?.insurerId || '',
    price: offer?.price || '',
    currency: offer?.currency || 'FCFA',
    category: offer?.category || '',
    status: offer?.status || 'draft',
    visibility: offer?.visibility || 'public',
    priority: offer?.priority || 'medium',
    validUntil: offer?.validUntil || '',
    coverage: offer?.coverage || [],
    features: offer?.features || [],
    tags: offer?.tags || []
  });

  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [selectedGuaranteeIds, setSelectedGuaranteeIds] = useState<string[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [offerType, setOfferType] = useState<'TAILOR_MADE' | 'PACK'>('TAILOR_MADE');

  React.useEffect(() => {
    const loadData = async () => {
      const [loadedGuarantees, loadedPackages] = await Promise.all([
        guaranteeService.getGuarantees(),
        guaranteeService.getPackages()
      ]);
      setGuarantees(loadedGuarantees);
      setPackages(loadedPackages);
    };
    loadData();
  }, []);

  // Sync package selection with guarantees
  React.useEffect(() => {
    if (offerType === 'PACK' && selectedPackageId) {
      const pkg = packages.find(p => p.id === selectedPackageId);
      if (pkg) {
        setSelectedGuaranteeIds(pkg.guarantees);
        setFormData(prev => ({
          ...prev,
          coverage: guarantees.filter(g => pkg.guarantees.includes(g.id)).map(g => g.name),
          price: pkg.basePrice.toString()
        }));
      }
    }
  }, [selectedPackageId, offerType, packages, guarantees]);

  // Keep coverage names in sync with selected guarantees
  React.useEffect(() => {
    if (offerType === 'TAILOR_MADE') {
      const names = guarantees.filter(g => selectedGuaranteeIds.includes(g.id)).map(g => g.name);
      setFormData(prev => ({ ...prev, coverage: names }));
    }
  }, [selectedGuaranteeIds, guarantees, offerType]);

  // Handle package selection
  const handlePackageChange = (packageId: string) => {
    setSelectedPackageId(packageId);
    if (packageId) {
      setOfferType('PACK');
    } else {
      setOfferType('TAILOR_MADE');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (offer) {
        await offerService.updateOffer(offer.id, formData);
        toast.success('Offre mise à jour avec succès');
      } else {
        await offerService.createOffer(formData);
        toast.success('Offre créée avec succès');
      }
      
      setIsCreateDialogOpen(false);
      setSelectedOffer(null);
      // The parent component will handle data refresh
    } catch (err) {
      logger.error('Error saving offer:', err);
      toast.error(offer ? 'Erreur lors de la mise à jour de l\'offre' : 'Erreur lors de la création de l\'offre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGuarantees = React.useMemo(() => {
    return guarantees.filter(g => g.isActive);
  }, [guarantees]);

  const pricing = React.useMemo(() => {
    if (offerType === 'PACK' && selectedPackageId) {
      const pkg = packages.find(p => p.id === selectedPackageId);
      return pkg ? pkg.totalPrice : Number(formData.price) || 0;
    } else {
      const base = Number(formData.price) || 0;
      return pricingService.quickCalculate(base, selectedGuaranteeIds.map(id => ({ id, selected: true })));
    }
  }, [formData.price, selectedGuaranteeIds, offerType, selectedPackageId, packages]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Titre de l'offre *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Catégorie *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="insurerId">Assureur *</Label>
          <Select value={formData.insurerId} onValueChange={(value) => setFormData({ ...formData, insurerId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un assureur" />
            </SelectTrigger>
            <SelectContent>
              {insurers.map(insurer => (
                <SelectItem key={insurer.id} value={insurer.id}>
                  {insurer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price">Prix *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Devise</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FCFA">FCFA</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="visibility">Visibilité</Label>
          <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Privé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priorité</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="validUntil">Valide jusqu'au (optionnel)</Label>
        <Input
          id="validUntil"
          type="date"
          value={formData.validUntil}
          onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <Label>Type d'offre</Label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="TAILOR_MADE"
              checked={offerType === 'TAILOR_MADE'}
              onChange={() => {
                setOfferType('TAILOR_MADE');
                setSelectedPackageId('');
              }}
            />
            <span>Sur mesure</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="PACK"
              checked={offerType === 'PACK'}
              onChange={() => setOfferType('PACK')}
            />
            <span>Package prédéfini</span>
          </label>
        </div>

        {offerType === 'PACK' && (
          <div>
            <Label htmlFor="package">Package *</Label>
            <Select value={selectedPackageId} onValueChange={handlePackageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un package" />
              </SelectTrigger>
              <SelectContent>
                {packages.filter(p => p.isActive).map(pkg => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    <div>
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-xs text-muted-foreground">{pkg.description} - {pkg.basePrice.toLocaleString()} FCFA</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Garanties {offerType === 'PACK' ? '(incluses dans le package)' : '(sélectionnez celles à inclure)'}</Label>
        <div className="border rounded-lg p-3 max-h-56 overflow-auto">
          {filteredGuarantees.length === 0 && (
            <div className="text-sm text-muted-foreground">Aucune garantie disponible pour la catégorie sélectionnée.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredGuarantees.map(g => {
              const checked = selectedGuaranteeIds.includes(g.id);
              const disabled = offerType === 'PACK';
              return (
                <label key={g.id} className={`flex items-center justify-between p-2 rounded border ${
                  checked ? 'bg-blue-50 border-blue-200' :
                  disabled ? 'bg-gray-50 border-gray-200' : 'bg-white'
                } ${disabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => {
                        if (!disabled) {
                          setSelectedGuaranteeIds(prev => e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id));
                        }
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.description}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-right">
                    {g.calculationMethod === 'FIXED_AMOUNT' && g.rate ?
                      `+ ${g.rate.toLocaleString()} FCFA` :
                      g.calculationMethod === 'RATE_ON_SI' || g.calculationMethod === 'RATE_ON_NEW_VALUE' ?
                        `+ ${g.rate}%` :
                        'Variable'
                    }
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {offerType === 'PACK' && selectedPackageId ? (
            <span>Prix du package: <span className="font-semibold">{pricing.toLocaleString()} {formData.currency}</span></span>
          ) : (
            <span>Prix estimé avec garanties: <span className="font-semibold">{pricing.toLocaleString()} {formData.currency}</span></span>
          )}
          {offerType === 'PACK' && selectedPackageId && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {packages.find(p => p.id === selectedPackageId)?.guarantees.length} garanties incluses
            </div>
          )}
        </div>
      </div>

      <div>
        <Label>Fonctionnalités</Label>
        <Textarea
          placeholder="Entrez les fonctionnalités, une par ligne"
          value={formData.features.join('\n')}
          onChange={(e) => setFormData({ ...formData, features: e.target.value.split('\n').filter(item => item.trim()) })}
          rows={4}
        />
      </div>

      <div>
        <Label>Tags</Label>
        <Input
          placeholder="Entrez les tags séparés par des virgules"
          value={formData.tags.join(', ')}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {offer ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            <>
              {offer ? 'Mettre à jour' : 'Créer'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Offer Details Component
const OfferDetails: React.FC<{ offer: any }> = ({ offer }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{offer.title}</h3>
          <p className="text-muted-foreground mt-1">{offer.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className="capitalize">{offer.category}</Badge>
            <Badge variant="outline" className={
              offer.status === 'active' ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400' :
              offer.status === 'pending' ? 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400' :
              offer.status === 'draft' ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400' : 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400'
            }>
              {offer.status}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{offer.price.toLocaleString()} {offer.currency}</div>
          <div className="text-sm text-muted-foreground">
            {offer.validUntil ? `Valide jusqu'au ${offer.validUntil}` : 'Sans limite de temps'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h4 className="font-semibold mb-2">Informations générales</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assureur:</span>
              <span className="font-medium">{offer.insurer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visibilité:</span>
              <span className="font-medium capitalize">{offer.visibility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priorité:</span>
              <span className="font-medium capitalize">{offer.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créé le:</span>
              <span className="font-medium">{offer.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modifié le:</span>
              <span className="font-medium">{offer.updatedAt}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clics:</span>
              <span className="font-medium">{offer.clicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversions:</span>
              <span className="font-medium">{offer.conversions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taux conversion:</span>
              <span className="font-medium text-green-600 dark:text-green-400">{offer.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Note moyenne:</span>
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(offer.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="font-medium">{offer.averageRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avis:</span>
              <span className="font-medium">{offer.reviewCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Couvertures</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {offer.coverage.map((coverage: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm">{coverage}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Fonctionnalités</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {offer.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {offer.tags.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {offer.tags.map((tag: string, index: number) => (
              <Badge key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOffersPage;
