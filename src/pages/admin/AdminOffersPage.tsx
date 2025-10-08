import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  insurer: string;
  insurerId: string;
  price: number;
  currency: string;
  category: string;
  coverage: string[];
  features: string[];
  status: 'active' | 'inactive' | 'pending' | 'draft';
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

interface Insurer {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'inactive' | 'pending';
}

interface OfferAnalytics {
  offerId: string;
  period: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  averagePosition: number;
}

export const AdminOffersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [insurerFilter, setInsurerFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Mock data
  const insurers: Insurer[] = [
    { id: '1', name: 'NSIA Assurance', status: 'active' },
    { id: '2', name: 'AXA Côte d\'Ivoire', status: 'active' },
    { id: '3', name: 'SUNU Assurances', status: 'active' },
    { id: '4', name: 'Allianz CI', status: 'pending' },
  ];

  const offers: Offer[] = [
    {
      id: '1',
      title: 'Assurance Auto Standard',
      description: 'Couverture complète pour votre véhicule avec assistance 24/7',
      insurer: 'NSIA Assurance',
      insurerId: '1',
      price: 150000,
      currency: 'FCFA',
      category: 'auto',
      coverage: ['Responsabilité civile', 'Dégâts matériels', 'Bris de glace', 'Vol', 'Incendie'],
      features: ['Assistance 24/7', 'Véhicule de remplacement', 'Protection juridique', 'Dépannage 0km'],
      status: 'active',
      visibility: 'public',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      clicks: 234,
      conversions: 45,
      conversionRate: 19.2,
      averageRating: 4.2,
      reviewCount: 28,
      tags: ['popular', 'best-value', 'premium'],
      priority: 'high'
    },
    {
      id: '2',
      title: 'Assurance Tous Risques',
      description: 'Protection maximale pour votre véhicule et ses occupants',
      insurer: 'AXA Côte d\'Ivoire',
      insurerId: '2',
      price: 250000,
      currency: 'FCFA',
      category: 'auto',
      coverage: ['Tous risques', 'Dommages corporels', 'Catastrophes naturelles', 'Actes de terrorisme'],
      features: ['Garantie valeur à neuf', 'Conducteur additionnel', 'Protection bagages', 'Assurance voyage'],
      status: 'active',
      visibility: 'public',
      createdAt: '2024-01-12',
      updatedAt: '2024-01-18',
      validUntil: '2024-12-31',
      clicks: 189,
      conversions: 38,
      conversionRate: 20.1,
      averageRating: 4.5,
      reviewCount: 15,
      tags: ['premium', 'comprehensive', 'luxury'],
      priority: 'high'
    },
    {
      id: '3',
      title: 'Assurance Éco',
      description: 'Solution économique avec couverture essentielle',
      insurer: 'SUNU Assurances',
      insurerId: '3',
      price: 120000,
      currency: 'FCFA',
      category: 'auto',
      coverage: ['Responsabilité civile', 'Dégâts matériels tiers'],
      features: ['Assistance basique', 'Dépannage limité'],
      status: 'pending',
      visibility: 'public',
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18',
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      averageRating: 0,
      reviewCount: 0,
      tags: ['economy', 'basic'],
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Assurance Moto Pro',
      description: 'Protection spécialisée pour les professionnels à deux roues',
      insurer: 'NSIA Assurance',
      insurerId: '1',
      price: 85000,
      currency: 'FCFA',
      category: 'moto',
      coverage: ['Responsabilité civile', 'Vol', 'Incendie', 'Dégâts matériels'],
      features: ['Équipements protégés', 'Assistance 24/7', 'Protection juridique'],
      status: 'draft',
      visibility: 'private',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15',
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      averageRating: 0,
      reviewCount: 0,
      tags: ['professional', 'moto'],
      priority: 'low'
    }
  ];

  const offerAnalytics: OfferAnalytics[] = [
    {
      offerId: '1',
      period: '30d',
      views: 1234,
      clicks: 234,
      conversions: 45,
      revenue: 6750000,
      ctr: 18.9,
      conversionRate: 19.2,
      averagePosition: 2.3
    },
    {
      offerId: '2',
      period: '30d',
      views: 987,
      clicks: 189,
      conversions: 38,
      revenue: 9500000,
      ctr: 19.1,
      conversionRate: 20.1,
      averagePosition: 1.8
    }
  ];

  const categories = [
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
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800">Brouillon</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Basse</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getInsurerStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleOfferAction = (action: string, offerId: string) => {
    console.log(`${action} offer ${offerId}`);
    // Implement action logic
  };

  const duplicateOffer = (offerId: string) => {
    console.log(`Duplicating offer ${offerId}`);
    setShowDuplicateDialog(false);
  };

  const exportOffers = () => {
    console.log('Exporting offers data');
    // Implement export logic
  };

  const importOffers = () => {
    console.log('Import offers dialog');
    // Implement import logic
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const totalOffers = offers.length;
  const activeOffers = offers.filter(o => o.status === 'active').length;
  const totalClicks = offers.reduce((sum, offer) => sum + offer.clicks, 0);
  const totalConversions = offers.reduce((sum, offer) => sum + offer.conversions, 0);
  const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Offres</h1>
          <p className="text-gray-600">Gérez toutes les offres d'assurance de la plateforme</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportOffers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={importOffers}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle offre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle offre</DialogTitle>
              </DialogHeader>
              <OfferForm insurers={insurers} categories={categories} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Offres</p>
                <p className="text-2xl font-bold text-blue-600">{totalOffers}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12%</span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offres Actives</p>
                <p className="text-2xl font-bold text-green-600">{activeOffers}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+3</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clics Totaux</p>
                <p className="text-2xl font-bold text-purple-600">{totalClicks.toLocaleString()}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600">+23%</span>
                </div>
              </div>
              <MousePointer className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux Conversion</p>
                <p className="text-2xl font-bold text-orange-600">{overallConversionRate}%</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+2.3%</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="offers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offers">Offres</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Liste des Offres</span>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher une offre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
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
                    <SelectTrigger className="w-40">
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
                    <SelectTrigger className="w-32">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Offre</th>
                      <th className="text-left p-4">Assureur</th>
                      <th className="text-left p-4">Prix</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Performance</th>
                      <th className="text-left p-4">Notes</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOffers.map((offer) => (
                      <tr key={offer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{offer.title}</div>
                            <div className="text-sm text-gray-500">{offer.category}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {offer.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} className="text-xs bg-blue-100 text-blue-800">
                                  {tag}
                                </Badge>
                              ))}
                              {offer.tags.length > 2 && (
                                <Badge className="text-xs bg-gray-100 text-gray-800">
                                  +{offer.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">{offer.insurer}</div>
                              <div className="text-xs text-gray-500">
                                {getInsurerStatusBadge(insurers.find(i => i.id === offer.insurerId)?.status || 'unknown')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{offer.price.toLocaleString()} {offer.currency}</div>
                          <div className="text-sm text-gray-500">
                            {offer.validUntil ? `Valide jusqu'au ${offer.validUntil}` : 'Sans limite'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(offer.status)}
                            {getPriorityBadge(offer.priority)}
                          </div>
                        </td>
                        <td className="p-4">
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
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {renderStars(offer.averageRating)}
                            </div>
                            <span className="text-sm text-gray-500">
                              ({offer.reviewCount})
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails de l'offre</DialogTitle>
                                </DialogHeader>
                                <OfferDetails offer={offer} />
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedOffer(offer)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance des offres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {offerAnalytics.map((analytics) => {
                    const offer = offers.find(o => o.id === analytics.offerId);
                    return (
                      <div key={analytics.offerId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{offer?.title}</h4>
                          <Badge className="bg-blue-100 text-blue-800">
                            {analytics.period}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">Vues</div>
                            <div className="text-lg font-bold">{analytics.views.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Clics</div>
                            <div className="text-lg font-bold">{analytics.clicks.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Conversions</div>
                            <div className="text-lg font-bold">{analytics.conversions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Revenus</div>
                            <div className="text-lg font-bold">{(analytics.revenue / 1000000).toFixed(1)}M FCFA</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">CTR</div>
                            <div className="font-medium">{analytics.ctr.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Taux conversion</div>
                            <div className="font-medium">{analytics.conversionRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top des offres performantes</CardTitle>
              </CardHeader>
              <CardContent>
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
                            <div className="text-sm text-gray-500">{offer.insurer}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{offer.conversionRate.toFixed(1)}%</div>
                          <div className="text-sm text-gray-500">{offer.conversions} conversions</div>
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
        <DialogContent>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer l'offre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Voulez-vous créer une copie de l'offre "{selectedOffer?.title}"?</p>
            <p className="text-sm text-gray-600">Une nouvelle offre sera créée avec les mêmes caractéristiques mais avec le statut "brouillon".</p>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Implement form submission logic
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-3 gap-4">
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

      <div>
        <Label>Couvertures</Label>
        <Textarea
          placeholder="Entrez les couvertures, une par ligne"
          value={formData.coverage.join('\n')}
          onChange={(e) => setFormData({ ...formData, coverage: e.target.value.split('\n').filter(item => item.trim()) })}
          rows={4}
        />
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
        <Button type="submit">
          {offer ? 'Mettre à jour' : 'Créer'}
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
          <p className="text-gray-600 mt-1">{offer.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className="capitalize">{offer.category}</Badge>
            <Badge className={
              offer.status === 'active' ? 'bg-green-100 text-green-800' :
              offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              offer.status === 'draft' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }>
              {offer.status}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{offer.price.toLocaleString()} {offer.currency}</div>
          <div className="text-sm text-gray-500">
            {offer.validUntil ? `Valide jusqu'au ${offer.validUntil}` : 'Sans limite de temps'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-2">Informations générales</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Assureur:</span>
              <span className="font-medium">{offer.insurer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Visibilité:</span>
              <span className="font-medium capitalize">{offer.visibility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Priorité:</span>
              <span className="font-medium capitalize">{offer.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Créé le:</span>
              <span className="font-medium">{offer.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modifié le:</span>
              <span className="font-medium">{offer.updatedAt}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Performance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Clics:</span>
              <span className="font-medium">{offer.clicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversions:</span>
              <span className="font-medium">{offer.conversions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taux conversion:</span>
              <span className="font-medium text-green-600">{offer.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Note moyenne:</span>
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
              <span className="text-gray-600">Avis:</span>
              <span className="font-medium">{offer.reviewCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Couvertures</h4>
        <div className="grid grid-cols-2 gap-2">
          {offer.coverage.map((coverage: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{coverage}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Fonctionnalités</h4>
        <div className="grid grid-cols-2 gap-2">
          {offer.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
              <Zap className="h-4 w-4 text-blue-600" />
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
              <Badge key={index} className="bg-blue-100 text-blue-800">
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