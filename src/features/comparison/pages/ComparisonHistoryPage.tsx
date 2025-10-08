import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Car,
  Filter,
  Search,
  Share2,
  Star,
  Download,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  DollarSign,
  Shield,
  Clock,
  Users,
  Heart,
  MoreHorizontal
} from 'lucide-react';
import {
  ComparisonHistory,
  useComparisonHistory,
  useDeleteComparisonHistory,
  useShareComparisonHistory,
  useExportComparisonHistory,
  useComparisonStats,
  ComparisonFilters
} from '../services/comparisonHistoryService';
import { useAuth } from '@/contexts/AuthContext';

export const ComparisonHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ComparisonFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComparison, setSelectedComparison] = useState<ComparisonHistory | null>(null);

  const { data: history, isLoading } = useComparisonHistory(user?.id || '', filters);
  const { data: stats } = useComparisonStats(user?.id || '');
  const deleteComparison = useDeleteComparisonHistory();
  const shareComparison = useShareComparisonHistory();
  const exportHistory = useExportComparisonHistory();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDelete = async (historyId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette comparaison ?')) {
      await deleteComparison.mutateAsync(historyId);
    }
  };

  const handleShare = async (historyId: string) => {
    await shareComparison.mutateAsync(historyId);
  };

  const handleExport = async () => {
    await exportHistory.mutateAsync(filters);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connexion requise
          </h3>
          <p className="text-gray-600">
            Vous devez être connecté pour accéder à l'historique des comparaisons
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des comparaisons</h1>
        <p className="text-gray-600">
          Consultez et gérez toutes vos comparaisons d'assurance
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total comparaisons</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalComparisons}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Offres moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageOffersPerComparison}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Économie moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.averageSavings)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de complétion</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher une comparaison..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as 'active' | 'archived' }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="archived">Archivées</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.vehicleType || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, vehicleType: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="voiture">Voiture</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : history?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune comparaison trouvée
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par comparer des offres d'assurance
              </p>
              <Button>
                <Car className="h-4 w-4 mr-2" />
                Nouvelle comparaison
              </Button>
            </CardContent>
          </Card>
        ) : (
          history?.map((comparison) => (
            <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {comparison.title}
                      </h3>
                      {comparison.isShared && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Share2 className="h-3 w-3 mr-1" />
                          Partagée
                        </Badge>
                      )}
                      {comparison.savedOffers.some(offer => offer.isFavorite) && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <Heart className="h-3 w-3 mr-1" />
                          Favoris
                        </Badge>
                      )}
                    </div>

                    {comparison.description && (
                      <p className="text-gray-600 mb-3">{comparison.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {comparison.vehicleInfo.make} {comparison.vehicleInfo.model}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(comparison.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {comparison.results.totalOffers} offres
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatPrice(comparison.results.averagePrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {comparison.preferences.coverageType}
                      </Badge>
                      <Badge variant="outline">
                        Budget: {formatPrice(comparison.preferences.budgetRange.min)} - {formatPrice(comparison.preferences.budgetRange.max)}
                      </Badge>
                      {comparison.results.bestOffer && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Meilleur: {comparison.results.bestOffer.insurer} - {formatPrice(comparison.results.bestOffer.price)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedComparison(comparison)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{comparison.title}</DialogTitle>
                        </DialogHeader>
                        <ComparisonDetailView comparison={comparison} />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(comparison.id)}
                      disabled={shareComparison.isPending}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Partager
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(comparison.id)}
                      disabled={deleteComparison.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

// Comparison Detail View Component
interface ComparisonDetailViewProps {
  comparison: ComparisonHistory;
}

const ComparisonDetailView: React.FC<ComparisonDetailViewProps> = ({ comparison }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations sur le véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Marque et modèle</label>
              <p className="text-lg font-semibold">
                {comparison.vehicleInfo.make} {comparison.vehicleInfo.model}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Année</label>
              <p className="text-lg font-semibold">{comparison.vehicleInfo.year}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Catégorie</label>
              <p className="text-lg font-semibold">{comparison.vehicleInfo.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Valeur estimée</label>
              <p className="text-lg font-semibold">{formatPrice(comparison.vehicleInfo.value)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations sur le conducteur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Âge</label>
              <p className="text-lg font-semibold">{comparison.driverInfo.age} ans</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Années de permis</label>
              <p className="text-lg font-semibold">{comparison.driverInfo.licenseYears} ans</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Historique d'accidents</label>
              <p className="text-lg font-semibold">{comparison.driverInfo.accidentHistory}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences de couverture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Type de couverture</label>
              <p className="text-lg font-semibold">{comparison.preferences.coverageType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Budget</label>
              <p className="text-lg font-semibold">
                {formatPrice(comparison.preferences.budgetRange.min)} - {formatPrice(comparison.preferences.budgetRange.max)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Franchise</label>
              <p className="text-lg font-semibold">{formatPrice(comparison.preferences.deductible)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Options supplémentaires</label>
              <p className="text-lg font-semibold">
                {comparison.preferences.additionalOptions.join(', ') || 'Aucune'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des résultats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{comparison.results.totalOffers}</p>
              <p className="text-sm text-gray-600">Offres reçues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatPrice(comparison.results.priceRange.min)}</p>
              <p className="text-sm text-gray-600">Prix minimum</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatPrice(comparison.results.priceRange.max)}</p>
              <p className="text-sm text-gray-600">Prix maximum</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{formatPrice(comparison.results.averagePrice)}</p>
              <p className="text-sm text-gray-600">Prix moyen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Offers */}
      {comparison.savedOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Offres sauvegardées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparison.savedOffers.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">{offer.insurer}</h4>
                    <div className="flex items-center space-x-2">
                      {offer.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      {offer.selected && <Badge variant="default">Sélectionnée</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Prix</label>
                      <p className="font-semibold">{formatPrice(offer.price)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Couverture</label>
                      <p className="font-semibold">{offer.coverage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Franchise</label>
                      <p className="font-semibold">{formatPrice(offer.deductible)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sauvegardé le</label>
                      <p className="font-semibold">{formatDate(offer.savedAt)}</p>
                    </div>
                  </div>
                  {offer.additionalBenefits.length > 0 && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-600">Avantages inclus</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {offer.additionalBenefits.map((benefit, index) => (
                          <Badge key={index} variant="outline">{benefit}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {offer.notes && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-sm text-gray-700 mt-1">{offer.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Details */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <label className="font-medium">Date de création</label>
          <p>{formatDate(comparison.createdAt)}</p>
        </div>
        <div>
          <label className="font-medium">Dernière mise à jour</label>
          <p>{formatDate(comparison.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonHistoryPage;
