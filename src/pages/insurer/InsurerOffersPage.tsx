import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  MoreHorizontal,
  LayoutGrid,
  List,
  X,
  Copy,
  TrendingUp,
  Users,
  Package,
  Activity,
  Calendar,
  Shield,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OfferFormModal } from '@/components/insurer/OfferFormModal';
import { CSVImportModal } from '@/components/insurer/CSVImportModal';
import { useInsurerOffers, useCreateInsurerOffer, useUpdateInsurerOffer, useDeleteInsurerOffer } from '@/features/insurer/services/offerService';
import { cn } from '@/lib/utils';

interface Offer {
  id: string;
  name: string;
  type: 'Tiers Simple' | 'Tiers +' | 'Tous Risques';
  price: number;
  coverage: string;
  status: 'active' | 'inactive';
  customers: number;
  conversion: number;
  lastUpdated: string;
  description: string;
  deductible?: number;
  maxCoverage?: number;
  duration?: number;
  features?: string[];
}

type ViewMode = 'grid' | 'list';

const CONTRACT_TYPE_COLORS = {
  'Tiers Simple': 'bg-blue-100 text-blue-700 border-blue-200',
  'Tiers +': 'bg-purple-100 text-purple-700 border-purple-200',
  'Tous Risques': 'bg-green-100 text-green-700 border-green-200',
};

export const InsurerOffersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<'all' | 'Tiers Simple' | 'Tiers +' | 'Tous Risques'>('all');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const { data: serverOffers = [], isLoading } = useInsurerOffers();
  const createMutation = useCreateInsurerOffer();
  const updateMutation = useUpdateInsurerOffer();
  const deleteMutation = useDeleteInsurerOffer();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const offers: Offer[] = serverOffers.map((o: any) => ({
    id: o.id,
    name: o.name,
    type: (o.contract_type === 'all_risks' ? 'Tous Risques' : o.contract_type === 'third_party_plus' ? 'Tiers +' : 'Tiers Simple') as Offer['type'],
    price: o.price_min || 0,
    coverage: o.description || '',
    status: o.is_active ? 'active' : 'inactive',
    customers: 0,
    conversion: 0,
    lastUpdated: new Date(o.updated_at).toISOString().split('T')[0],
    description: o.description || '',
    deductible: o.deductible,
    maxCoverage: o.coverage_amount,
    duration: 12,
    features: o.features || [],
  }));

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || offer.status === filterStatus;
    const matchesType = filterType === 'all' || offer.type === filterType;
    const matchesPrice = priceRange === 'all' ||
      (priceRange === 'low' && offer.price < 50000) ||
      (priceRange === 'medium' && offer.price >= 50000 && offer.price < 150000) ||
      (priceRange === 'high' && offer.price >= 150000);

    return matchesSearch && matchesStatus && matchesType && matchesPrice;
  });

  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    totalCustomers: offers.reduce((sum, o) => sum + o.customers, 0),
    avgConversion: offers.length > 0
      ? Math.round(offers.reduce((sum, o) => sum + o.conversion, 0) / offers.length)
      : 0,
  };

  const toggleOfferStatus = async (offerId: string) => {
    const current = serverOffers.find((o: any) => o.id === offerId);
    await updateMutation.mutateAsync({ id: offerId, input: { isActive: !current?.is_active } as any });
  };

  const deleteOffer = async (offerId: string) => {
    await deleteMutation.mutateAsync(offerId);
    setSelectedOffer(null);
  };

  const duplicateOffer = async (offer: Offer) => {
    await createMutation.mutateAsync({
      name: `${offer.name} (copie)`,
      type: offer.type === 'Tous Risques' ? 'tous_risques' : offer.type === 'Tiers +' ? 'tiers_plus' : 'tiers_simple',
      price: offer.price,
      coverage: offer.coverage,
      description: offer.description,
      deductible: offer.deductible || 0,
      maxCoverage: offer.maxCoverage || 0,
      duration: offer.duration || 12,
      features: offer.features || [],
      conditions: '',
      isActive: false,
    });
  };

  const handleCreateOffer = async (data: any) => {
    await createMutation.mutateAsync({
      name: data.name,
      type: data.contract_type,
      price: data.price,
      coverage: data.coverage,
      description: data.description,
      deductible: data.deductible,
      maxCoverage: data.maxCoverage,
      duration: data.duration,
      features: data.features || [],
      conditions: data.conditions || '',
      isActive: true,
    });
  };

  const handleEditOffer = async (data: any) => {
    if (!editingOffer) return;
    await updateMutation.mutateAsync({
      id: editingOffer.id,
      input: {
        name: data.name,
        type: data.contract_type,
        price: data.price,
        description: data.description,
        deductible: data.deductible,
        maxCoverage: data.maxCoverage,
        features: data.features || [],
      } as any,
    });
    setEditingOffer(null);
  };

  const exportOffers = () => {
    const csvContent = [
      ['Nom', 'Type', 'Prix (FCFA)', 'Couverture', 'Statut', 'Description'],
      ...filteredOffers.map(offer => [
        offer.name,
        offer.type,
        offer.price.toString(),
        offer.coverage,
        offer.status,
        offer.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `offres_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const OfferCard = ({ offer }: { offer: Offer }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={() => setSelectedOffer(offer)}>
            <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
              {offer.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">{offer.description}</CardDescription>
          </div>
          <Badge className={cn('shrink-0', CONTRACT_TYPE_COLORS[offer.type])}>
            {offer.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Prix</p>
            <p className="text-xl font-bold text-blue-600">
              {offer.price.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Statut</p>
            {offer.status === 'active' ? (
              <Badge variant="default" className="bg-green-100 text-green-700">
                Actif
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                Inactif
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{offer.customers} clients</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{offer.conversion}%</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); setEditingOffer(offer); }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedOffer(offer)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateOffer(offer)}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleOfferStatus(offer.id)}>
                {offer.status === 'active' ? (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => deleteOffer(offer.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Offres</h1>
          <p className="text-gray-600">Gérez vos offres d'assurance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={exportOffers}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle offre
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total offres</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offres actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients totaux</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux conversion moyen</p>
                <p className="text-2xl font-bold">{stats.avgConversion}%</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une offre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Tiers Simple">Tiers Simple</SelectItem>
                    <SelectItem value="Tiers +">Tiers +</SelectItem>
                    <SelectItem value="Tous Risques">Tous Risques</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priceRange} onValueChange={(v: any) => setPriceRange(v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Prix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les prix</SelectItem>
                    <SelectItem value="low">&lt; 50k FCFA</SelectItem>
                    <SelectItem value="medium">50k - 150k</SelectItem>
                    <SelectItem value="high">&gt; 150k</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                {filteredOffers.length} offre{filteredOffers.length > 1 ? 's' : ''} trouvée{filteredOffers.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className={cn('transition-all', selectedOffer ? 'lg:grid lg:grid-cols-3 lg:gap-6' : '')}>
        {/* Offers Grid/List */}
        <div className={cn(selectedOffer ? 'lg:col-span-2' : '')}>
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Chargement des offres...
              </CardContent>
            </Card>
          ) : filteredOffers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune offre trouvée</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' || priceRange !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre première offre'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterType === 'all' && priceRange === 'all' && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une offre
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Conversion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.map((offer) => (
                    <TableRow key={offer.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedOffer(offer)}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{offer.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">{offer.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CONTRACT_TYPE_COLORS[offer.type]}>{offer.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {offer.price.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
                        {offer.status === 'active' ? (
                          <Badge variant="default" className="bg-green-100 text-green-700">Actif</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell>{offer.customers}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{offer.conversion}%</span>
                          {offer.conversion > 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingOffer(offer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOffer(offer)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateOffer(offer)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleOfferStatus(offer.id)}>
                                {offer.status === 'active' ? (
                                  <>
                                    <ToggleLeft className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-4 w-4 mr-2" />
                                    Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteOffer(offer.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        {selectedOffer && (
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Détails de l'offre</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setSelectedOffer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge className={CONTRACT_TYPE_COLORS[selectedOffer.type]}>
                    {selectedOffer.type}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{selectedOffer.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedOffer.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-gray-500">Prix</p>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedOffer.price.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    {selectedOffer.status === 'active' ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">Actif</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inactif</Badge>
                    )}
                  </div>
                  {selectedOffer.maxCoverage && (
                    <div>
                      <p className="text-sm text-gray-500">Plafond</p>
                      <p className="font-medium">{selectedOffer.maxCoverage.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  )}
                  {selectedOffer.deductible !== undefined && selectedOffer.deductible > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Franchise</p>
                      <p className="font-medium">{selectedOffer.deductible.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Couverture</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedOffer.coverage}</p>
                </div>

                {selectedOffer.features && selectedOffer.features.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Fonctionnalités</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedOffer.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditingOffer(selectedOffer);
                      setSelectedOffer(null);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => duplicateOffer(selectedOffer)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Dupliquer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <OfferFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOffer}
        isSubmitting={isSubmitting}
      />

      <OfferFormModal
        isOpen={!!editingOffer}
        onClose={() => setEditingOffer(null)}
        onSubmit={handleEditOffer}
        isSubmitting={isSubmitting}
        initialData={editingOffer ? {
          name: editingOffer.name,
          contract_type: editingOffer.type === 'Tiers Simple' ? 'tiers_simple' : editingOffer.type === 'Tiers +' ? 'tiers_plus' : 'tous_risques',
          price: editingOffer.price,
          coverage: editingOffer.coverage,
          description: editingOffer.description,
          deductible: editingOffer.deductible || 0,
          maxCoverage: editingOffer.maxCoverage || 0,
          duration: editingOffer.duration || 12,
          features: editingOffer.features || [],
          conditions: '',
        } : undefined}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={() => {}}
      />
    </div>
  );
};

export default InsurerOffersPage;
