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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Copy,
  MoreHorizontal,
  User,
  Car,
  Shield,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface Quote {
  id: string;
  quote_number: string;
  user_id: string;
  user_profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    avatar_url?: string;
  };
  vehicle_info: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
  coverage_info: {
    type: string;
    guarantees: string[];
    franchise: number;
  };
  premium_info: {
    base_premium: number;
    total_premium: number;
    currency: string;
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
  insurer?: {
    id: string;
    name: string;
  };
  comparison?: {
    total_quotes: number;
    position: number;
  };
}

interface QuoteStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  totalRevenue: number;
  averagePremium: number;
}

export const AdminDevisPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insurerFilter, setInsurerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Data states
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [insurers, setInsurers] = useState<Array<{ id: string; name: string }>>([]);
  const [quoteStats, setQuoteStats] = useState<QuoteStats | null>(null);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create quote form state
  const [newQuote, setNewQuote] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear().toString(),
    vehicleRegistration: '',
    contractType: 'Standard',
    estimatedPrice: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [isCreating, setIsCreating] = useState(false);

  // Charger les vraies données depuis la base de données
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer tous les devis depuis la table quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          created_at,
          updated_at,
          status,
          personal_data,
          vehicle_data,
          coverage_requirements,
          estimated_price,
          valid_until,
          user_id,
          category_id
        `)
        .order('created_at', { ascending: false });

      if (quotesError) {
        logger.error('Error fetching quotes:', quotesError);
        throw quotesError;
      }

      // Récupérer les profils utilisateurs pour chaque devis
      const quotesList = quotesData || [];
      const userIds = [...new Set(quotesList.map(q => q.user_id).filter(Boolean))];

      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesResult } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url');
        profilesData = profilesResult || [];
      }

      const profileMap = new Map(
        profilesData.map(p => [p.id, p])
      );

      // Récupérer les assureurs actifs
      const { data: insurersData } = await supabase
        .from('insurers')
        .select('id, name')
        .eq('is_active', true);

      setInsurers(insurersData || []);

      // Récupérer les offres (quote_offers) pour chaque devis afin d'obtenir les informations d'assureur
      const quoteIds = quotesList.map(q => q.id);
      let quoteOffersData: any[] = [];
      if (quoteIds.length > 0) {
        const { data: offersResult } = await supabase
          .from('quote_offers')
          .select('quote_id, insurer_id, price, status')
          .in('quote_id', quoteIds);
        quoteOffersData = offersResult || [];
      }

      // Créer un map des offres par quote_id (un devis peut avoir plusieurs offres)
      const offersByQuoteId = new Map<string, any[]>();
      quoteOffersData.forEach(offer => {
        const existing = offersByQuoteId.get(offer.quote_id) || [];
        existing.push(offer);
        offersByQuoteId.set(offer.quote_id, existing);
      });

      // Créer un map des assureurs
      const insurerMap = new Map(
        (insurersData || []).map(insurer => [insurer.id, insurer])
      );

      // Transformer les données en format Quote
      const transformedQuotes: Quote[] = quotesList.map((quote, index) => {
        const profile = profileMap.get(quote.user_id);
        const personal = quote.personal_data as any;
        const vehicle = quote.vehicle_data as any;
        const coverage = quote.coverage_requirements as any;
        const offers = offersByQuoteId.get(quote.id) || [];
        const firstOffer = offers[0];

        // Normaliser le statut en minuscule pour l'interface
        const statusMap: Record<string, 'draft' | 'pending' | 'approved' | 'rejected' | 'expired'> = {
          'DRAFT': 'draft',
          'PENDING': 'pending',
          'APPROVED': 'approved',
          'REJECTED': 'rejected',
          'EXPIRED': 'expired'
        };
        const normalizedStatus = statusMap[quote.status] || 'draft';

        return {
          id: quote.id,
          quote_number: `DEV-${new Date(quote.created_at).getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          user_id: quote.user_id,
          user_profile: {
            first_name: personal?.firstName || profile?.first_name || '',
            last_name: personal?.lastName || profile?.last_name || '',
            email: personal?.email || profile?.email || '',
            phone: personal?.phone || profile?.phone || '',
            avatar_url: profile?.avatar_url
          },
          vehicle_info: {
            brand: vehicle?.brand || '',
            model: vehicle?.model || '',
            year: vehicle?.year || new Date().getFullYear(),
            registration: vehicle?.licensePlate || ''
          },
          coverage_info: {
            type: coverage?.contractType || 'Standard',
            guarantees: Array.isArray(coverage?.specificCoverages) ? coverage?.specificCoverages : [],
            franchise: coverage?.deductible || 0
          },
          premium_info: {
            base_premium: quote.estimated_price || 0,
            total_premium: quote.estimated_price || 0,
            currency: 'XOF'
          },
          status: normalizedStatus,
          created_at: quote.created_at,
          updated_at: quote.updated_at,
          expires_at: quote.valid_until || quote.created_at,
          insurer: firstOffer?.insurer_id ? {
            id: firstOffer.insurer_id,
            name: insurerMap.get(firstOffer.insurer_id)?.name || 'Non spécifié'
          } : undefined,
          comparison: undefined
        };
      });

      setQuotes(transformedQuotes);

      // Calculer les statistiques
      const stats: QuoteStats = {
        total: transformedQuotes.length,
        draft: transformedQuotes.filter(q => q.status === 'draft').length,
        pending: transformedQuotes.filter(q => q.status === 'pending').length,
        approved: transformedQuotes.filter(q => q.status === 'approved').length,
        rejected: transformedQuotes.filter(q => q.status === 'rejected').length,
        expired: transformedQuotes.filter(q => q.status === 'expired').length,
        totalRevenue: transformedQuotes.reduce((sum, q) => sum + q.premium_info.total_premium, 0),
        averagePremium: transformedQuotes.length > 0
          ? transformedQuotes.reduce((sum, q) => sum + q.premium_info.total_premium, 0) / transformedQuotes.length
          : 0
      };
      setQuoteStats(stats);

    } catch (err) {
      logger.error('Error loading quotes data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.user_profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.user_profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.user_profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.vehicle_info.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.vehicle_info.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesInsurer = insurerFilter === 'all' || quote.insurer?.id === insurerFilter;
    const matchesDate = dateFilter === 'all' || filterByDate(quote, dateFilter);
    return matchesSearch && matchesStatus && matchesInsurer && matchesDate;
  });

  const filterByDate = (quote: Quote, filter: string): boolean => {
    const now = new Date();
    const quoteDate = new Date(quote.created_at);

    switch (filter) {
      case 'today':
        return quoteDate.toDateString() === now.toDateString();
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return quoteDate >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return quoteDate >= monthAgo;
      }
      case 'year':
        return quoteDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Approuvé</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Rejeté</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Expiré</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleQuoteAction = async (action: string, quoteId: string) => {
    try {
      // Mapping des statuts (minuscule -> MAJUSCULE pour la BDD)
      const statusToDb: Record<string, 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'> = {
        'draft': 'DRAFT',
        'pending': 'PENDING',
        'approved': 'APPROVED',
        'rejected': 'REJECTED',
        'expired': 'EXPIRED'
      };

      switch (action) {
        case 'delete': {
          // Supprimer le devis dans la base de données
          const { error: deleteError } = await supabase
            .from('quotes')
            .delete()
            .eq('id', quoteId);

          if (deleteError) {
            logger.error('Error deleting quote:', deleteError);
            toast.error(`Erreur lors de la suppression du devis: ${deleteError.message}`);
            return;
          }

          // Recharger les données
          await loadData();
          toast.success('Devis supprimé avec succès');
          break;
        }

        case 'duplicate': {
          // Dupliquer le devis en créant un nouveau
          const quoteToDuplicate = quotes.find(q => q.id === quoteId);
          if (quoteToDuplicate) {
            // Récupérer l'original depuis la BD pour avoir les bonnes données
            const { data: originalQuote, error: fetchError } = await supabase
              .from('quotes')
              .select('*')
              .eq('id', quoteId)
              .single();

            if (fetchError) {
              logger.error('Error fetching original quote for duplication:', fetchError);
              toast.error('Erreur lors de la récupération du devis original');
              return;
            }

            const { error: duplicateError } = await supabase
              .from('quotes')
              .insert({
                user_id: originalQuote.user_id,
                category_id: originalQuote.category_id,
                status: 'DRAFT',
                personal_data: originalQuote.personal_data,
                vehicle_data: originalQuote.vehicle_data,
                coverage_requirements: originalQuote.coverage_requirements,
                estimated_price: originalQuote.estimated_price,
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .select()
              .single();

            if (duplicateError) {
              logger.error('Error duplicating quote:', duplicateError);
              toast.error(`Erreur lors de la duplication du devis: ${duplicateError.message}`);
              return;
            }

            // Recharger les données
            await loadData();
            toast.success('Devis dupliqué avec succès');
          }
          break;
        }

        case 'approve': {
          // Approuver le devis
          const { error: approveError } = await supabase
            .from('quotes')
            .update({ status: statusToDb['approved'] })
            .eq('id', quoteId);

          if (approveError) {
            logger.error('Error approving quote:', approveError);
            toast.error(`Erreur lors de l'approbation du devis: ${approveError.message}`);
            return;
          }

          // Recharger les données
          await loadData();
          toast.success('Devis approuvé avec succès');
          break;
        }

        case 'reject': {
          // Rejeter le devis
          const { error: rejectError } = await supabase
            .from('quotes')
            .update({ status: statusToDb['rejected'] })
            .eq('id', quoteId);

          if (rejectError) {
            logger.error('Error rejecting quote:', rejectError);
            toast.error(`Erreur lors du rejet du devis: ${rejectError.message}`);
            return;
          }

          // Recharger les données
          await loadData();
          toast.success('Devis rejeté');
          break;
        }

        default:
          logger.info(`Unknown action: ${action} for quote ${quoteId}`);
      }
      setShowDeleteDialog(false);
      setShowDuplicateDialog(false);
    } catch (err) {
      logger.error(`Error ${action} quote:`, err);
      toast.error(`Erreur lors de l'action: ${action}`);
    }
  };

  const exportQuotes = async () => {
    try {
      if (filteredQuotes.length === 0) {
        toast.warning('Aucun devis à exporter');
        return;
      }

      // Exporter les devis en CSV
      const csvContent = [
        ['Numéro', 'Client', 'Email', 'Véhicule', 'Statut', 'Prime', 'Date création'].join(','),
        ...filteredQuotes.map(q => [
          q.quote_number,
          `"${q.user_profile.first_name} ${q.user_profile.last_name}"`,
          q.user_profile.email,
          `"${q.vehicle_info.brand} ${q.vehicle_info.model}"`,
          q.status,
          q.premium_info.total_premium,
          new Date(q.created_at).toLocaleDateString('fr-FR')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Devis exportés avec succès');
    } catch (err) {
      logger.error('Error exporting quotes:', err);
      toast.error('Erreur lors de l\'exportation des devis');
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);

      // Validation basique
      if (!newQuote.firstName || !newQuote.lastName || !newQuote.email || !newQuote.phone) {
        toast.error('Veuillez remplir les informations du client');
        return;
      }
      if (!newQuote.vehicleBrand || !newQuote.vehicleModel || !newQuote.vehicleRegistration) {
        toast.error('Veuillez remplir les informations du véhicule');
        return;
      }
      if (!newQuote.estimatedPrice || parseFloat(newQuote.estimatedPrice) <= 0) {
        toast.error('Veuillez saisir un prix estimé valide');
        return;
      }

      // Récupérer la catégorie auto
      const { data: categoryData } = await supabase
        .from('insurance_categories')
        .select('id')
        .eq('name', 'Auto')
        .single();

      const categoryId = categoryData?.id || null;

      // Créer le devis
      const { error: createError } = await supabase
        .from('quotes')
        .insert({
          category_id: categoryId,
          status: 'DRAFT',
          personal_data: {
            firstName: newQuote.firstName,
            lastName: newQuote.lastName,
            email: newQuote.email,
            phone: newQuote.phone
          },
          vehicle_data: {
            brand: newQuote.vehicleBrand,
            model: newQuote.vehicleModel,
            year: parseInt(newQuote.vehicleYear),
            licensePlate: newQuote.vehicleRegistration
          },
          coverage_requirements: {
            contractType: newQuote.contractType,
            specificCoverages: []
          },
          estimated_price: parseFloat(newQuote.estimatedPrice),
          valid_until: new Date(newQuote.validUntil).toISOString(),
          submission_channel: 'AGENT',
          requested_by_role: 'ADMIN'
        });

      if (createError) {
        logger.error('Error creating quote:', createError);
        toast.error(`Erreur lors de la création du devis: ${createError.message}`);
        return;
      }

      // Recharger les données
      await loadData();
      setShowCreateDialog(false);
      toast.success('Devis créé avec succès');

      // Réinitialiser le formulaire
      setNewQuote({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehicleYear: new Date().getFullYear().toString(),
        vehicleRegistration: '',
        contractType: 'Standard',
        estimatedPrice: '',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } catch (err) {
      logger.error('Error creating quote:', err);
      toast.error('Erreur lors de la création du devis');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Devis</h1>
          <p className="text-muted-foreground">Gérez tous les devis d'assurance de la plateforme</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportQuotes} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
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
                    <p className="text-sm font-medium text-muted-foreground">Total Devis</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quoteStats?.total || 0}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">+15%</span>
                    </div>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En Attente</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{quoteStats?.pending || 0}</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs text-muted-foreground">À traiter</span>
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approuvés</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{quoteStats?.approved || 0}</p>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">Validés</span>
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
                    <p className="text-sm font-medium text-muted-foreground">Revenus Totaux</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {quoteStats ? `${(quoteStats.totalRevenue / 1000000).toFixed(1)}M` : '0M'} FCFA
                    </p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">+8%</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="quotes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="quotes" className="text-xs sm:text-sm">Devis</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <span className="text-lg">Liste des Devis</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher un devis..."
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
                      <SelectItem value="draft">Brouillons</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvés</SelectItem>
                      <SelectItem value="rejected">Rejetés</SelectItem>
                      <SelectItem value="expired">Expirés</SelectItem>
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
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes dates</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
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
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-4">Devis</th>
                      <th className="text-left p-2 sm:p-4">Client</th>
                      <th className="text-left p-2 sm:p-4">Véhicule</th>
                      <th className="text-left p-2 sm:p-4">Assureur</th>
                      <th className="text-left p-2 sm:p-4">Prime</th>
                      <th className="text-left p-2 sm:p-4">Statut</th>
                      <th className="text-left p-2 sm:p-4 hidden md:table-cell">Date</th>
                      <th className="text-left p-2 sm:p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 sm:p-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="p-2 sm:p-4">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </td>
                          <td className="p-2 sm:p-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-2 sm:p-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="p-2 sm:p-4"><Skeleton className="h-6 w-16 rounded" /></td>
                          <td className="p-2 sm:p-4 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-2 sm:p-4">
                            <div className="flex space-x-1">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredQuotes.map((quote) => (
                        <tr key={quote.id} className="border-b hover:bg-accent">
                          <td className="p-2 sm:p-4">
                            <div>
                              <div className="font-medium text-sm">{quote.quote_number}</div>
                              <div className="text-xs text-muted-foreground">Position: {quote.comparison?.position}/{quote.comparison?.total_quotes}</div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={quote.user_profile.avatar_url} alt={`${quote.user_profile.first_name} ${quote.user_profile.last_name}`} />
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                                  {quote.user_profile.first_name[0]}{quote.user_profile.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{quote.user_profile.first_name} {quote.user_profile.last_name}</div>
                                <div className="text-xs text-muted-foreground">{quote.user_profile.email}</div>
                                <div className="text-xs text-muted-foreground sm:hidden">{quote.vehicle_info.brand} {quote.vehicle_info.model}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div>
                              <div className="font-medium text-sm">{quote.vehicle_info.brand} {quote.vehicle_info.model}</div>
                              <div className="text-xs text-muted-foreground">{quote.vehicle_info.year} • {quote.vehicle_info.registration}</div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div className="font-medium text-sm">{quote.insurer?.name || 'Non spécifié'}</div>
                          </td>
                          <td className="p-2 sm:p-4">
                            <div>
                              <div className="font-medium text-sm">{quote.premium_info.total_premium.toLocaleString()} {quote.premium_info.currency}</div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                {getStatusBadge(quote.status)}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4">
                            {getStatusBadge(quote.status)}
                          </td>
                          <td className="p-2 sm:p-4 hidden md:table-cell">
                            <div className="text-sm">
                              {new Date(quote.created_at).toLocaleDateString()}
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
                                    <DialogTitle>Détails du devis</DialogTitle>
                                  </DialogHeader>
                                  <QuoteDetails quote={quote} />
                                </DialogContent>
                              </Dialog>
                              {quote.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuoteAction('approve', quote.id)}
                                    className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuoteAction('reject', quote.id)}
                                    className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuote(quote);
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
                                  setSelectedQuote(quote);
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
                <CardTitle>Statistiques des devis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quoteStats?.averagePremium ? (quoteStats.averagePremium / 1000).toFixed(0) : '0'}K</div>
                      <div className="text-sm text-muted-foreground">Prime moyenne</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {quoteStats ? ((quoteStats.approved / quoteStats.total) * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taux d'approbation</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quoteStats && [
                    { status: 'Brouillons', count: quoteStats.draft, color: 'bg-blue-500' },
                    { status: 'En attente', count: quoteStats.pending, color: 'bg-yellow-500' },
                    { status: 'Approuvés', count: quoteStats.approved, color: 'bg-green-500' },
                    { status: 'Rejetés', count: quoteStats.rejected, color: 'bg-red-500' },
                    { status: 'Expirés', count: quoteStats.expired, color: 'bg-gray-500' }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="font-medium">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {((item.count / quoteStats.total) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
            <p>Êtes-vous sûr de vouloir supprimer le devis "{selectedQuote?.quote_number}"?</p>
            <p className="text-sm text-red-600">Cette action est irréversible.</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedQuote) {
                    handleQuoteAction('delete', selectedQuote.id);
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
            <DialogTitle>Dupliquer le devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Voulez-vous créer une copie du devis "{selectedQuote?.quote_number}"?</p>
            <p className="text-sm text-muted-foreground">Un nouveau devis sera créé avec les mêmes caractéristiques mais avec le statut "brouillon".</p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (selectedQuote) {
                    handleQuoteAction('duplicate', selectedQuote.id);
                  }
                }}
              >
                Dupliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau devis</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateQuote} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={newQuote.firstName}
                  onChange={(e) => setNewQuote({ ...newQuote, firstName: e.target.value })}
                  placeholder="Jean"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={newQuote.lastName}
                  onChange={(e) => setNewQuote({ ...newQuote, lastName: e.target.value })}
                  placeholder="Dupont"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newQuote.email}
                  onChange={(e) => setNewQuote({ ...newQuote, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={newQuote.phone}
                  onChange={(e) => setNewQuote({ ...newQuote, phone: e.target.value })}
                  placeholder="+225 07 00 00 00 00"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Car className="h-4 w-4 mr-2" />
                Informations du véhicule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleBrand">Marque *</Label>
                  <Input
                    id="vehicleBrand"
                    value={newQuote.vehicleBrand}
                    onChange={(e) => setNewQuote({ ...newQuote, vehicleBrand: e.target.value })}
                    placeholder="Toyota"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Modèle *</Label>
                  <Input
                    id="vehicleModel"
                    value={newQuote.vehicleModel}
                    onChange={(e) => setNewQuote({ ...newQuote, vehicleModel: e.target.value })}
                    placeholder="Corolla"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">Année *</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={newQuote.vehicleYear}
                    onChange={(e) => setNewQuote({ ...newQuote, vehicleYear: e.target.value })}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleRegistration">Immatriculation *</Label>
                  <Input
                    id="vehicleRegistration"
                    value={newQuote.vehicleRegistration}
                    onChange={(e) => setNewQuote({ ...newQuote, vehicleRegistration: e.target.value })}
                    placeholder="AB-123-CD-25"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Couverture et prix
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractType">Type de contrat</Label>
                  <Select
                    value={newQuote.contractType}
                    onValueChange={(value) => setNewQuote({ ...newQuote, contractType: value })}
                  >
                    <SelectTrigger id="contractType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Tiers Simple">Tiers Simple</SelectItem>
                      <SelectItem value="Tiers+">Tiers+</SelectItem>
                      <SelectItem value="Tous Risques">Tous Risques</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedPrice">Prime estimée (XOF) *</Label>
                  <Input
                    id="estimatedPrice"
                    type="number"
                    step="1000"
                    value={newQuote.estimatedPrice}
                    onChange={(e) => setNewQuote({ ...newQuote, estimatedPrice: e.target.value })}
                    placeholder="500000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Date de validité</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={newQuote.validUntil}
                    onChange={(e) => setNewQuote({ ...newQuote, validUntil: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le devis
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Quote Details Component
const QuoteDetails: React.FC<{ quote: Quote }> = ({ quote }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{quote.quote_number}</h3>
          <div className="flex items-center space-x-2 mt-2">
            {quote.status === 'approved' && <Badge className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Approuvé</Badge>}
            {quote.status === 'pending' && <Badge className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>}
            {quote.status === 'rejected' && <Badge className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Rejeté</Badge>}
            {quote.status === 'expired' && <Badge className="border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Expiré</Badge>}
            {quote.status === 'draft' && <Badge className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Brouillon</Badge>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {quote.premium_info.total_premium.toLocaleString()} {quote.premium_info.currency}
          </div>
          <div className="text-sm text-muted-foreground">
            Prime totale
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Informations client
          </h4>
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={quote.user_profile.avatar_url} alt={`${quote.user_profile.first_name} ${quote.user_profile.last_name}`} />
              <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                {quote.user_profile.first_name[0]}{quote.user_profile.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{quote.user_profile.first_name} {quote.user_profile.last_name}</div>
              <div className="text-sm text-muted-foreground">{quote.user_profile.email}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{quote.user_profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Téléphone:</span>
              <span className="font-medium">{quote.user_profile.phone}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <Car className="h-4 w-4 mr-2" />
            Informations véhicule
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Marque/Modèle:</span>
              <span className="font-medium">{quote.vehicle_info.brand} {quote.vehicle_info.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Année:</span>
              <span className="font-medium">{quote.vehicle_info.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Immatriculation:</span>
              <span className="font-medium">{quote.vehicle_info.registration}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Couverture
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{quote.coverage_info.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Franchise:</span>
              <span className="font-medium">{quote.coverage_info.franchise.toLocaleString()} {quote.premium_info.currency}</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-medium">Garanties incluses:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
              {quote.coverage_info.guarantees.map((guarantee, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950/30 rounded">
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs">{guarantee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Dates et délais
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créé le:</span>
              <span className="font-medium">{new Date(quote.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modifié le:</span>
              <span className="font-medium">{new Date(quote.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expire le:</span>
              <span className="font-medium">{new Date(quote.expires_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Détails de la prime</h4>
        <div className="border rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Prime de base:</span>
              <span>{quote.premium_info.base_premium.toLocaleString()} {quote.premium_info.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Frais et taxes:</span>
              <span>{(quote.premium_info.total_premium - quote.premium_info.base_premium).toLocaleString()} {quote.premium_info.currency}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Prime totale:</span>
              <span>{quote.premium_info.total_premium.toLocaleString()} {quote.premium_info.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {quote.comparison && (
        <div>
          <h4 className="font-semibold mb-2">Performance dans la comparaison</h4>
          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quote.comparison.position}</div>
                <div className="text-sm text-muted-foreground">Position</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{quote.comparison.total_quotes}</div>
                <div className="text-sm text-muted-foreground">Total comparés</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDevisPage;
