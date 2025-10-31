import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  MoreHorizontal
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
} from '@/components/ui/dropdown-menu';
import { OfferFormModal } from '@/components/insurer/OfferFormModal';
import { CSVImportModal } from '@/components/insurer/CSVImportModal';
import { useInsurerOffers, useCreateInsurerOffer, useUpdateInsurerOffer, useDeleteInsurerOffer } from '@/features/insurer/services/offerService';

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
}

export const InsurerOffersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const { data: serverOffers = [], isLoading } = useInsurerOffers();
  const createMutation = useCreateInsurerOffer();
  const updateMutation = useUpdateInsurerOffer();
  const deleteMutation = useDeleteInsurerOffer();

  const filteredOffers = serverOffers.map((o: any) => ({
    id: o.id,
    name: o.name,
    type: (o.contract_type === 'all_risks' ? 'Tous Risques' : o.contract_type === 'third_party_plus' ? 'Tiers +' : 'Tiers') as Offer['type'],
    price: o.price_min || 0,
    coverage: o.description || '',
    status: o.is_active ? 'active' : 'inactive',
    customers: 0,
    conversion: 0,
    lastUpdated: new Date(o.updated_at).toISOString().split('T')[0],
    description: o.description || '',
  })).filter(offer =>
    offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOfferStatus = async (offerId: string) => {
    const current = serverOffers.find((o: any) => o.id === offerId);
    await updateMutation.mutateAsync({ id: offerId, input: { isActive: !current?.is_active } as any });
  };

  const deleteOffer = async (offerId: string) => {
    await deleteMutation.mutateAsync(offerId);
  };

  const handleCreateOffer = async (data: any) => {
    await createMutation.mutateAsync({
      name: data.name,
      type: data.type,
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
        type: data.type,
        price: data.price,
        description: data.description,
        deductible: data.deductible,
        maxCoverage: data.maxCoverage,
        features: data.features || [],
      } as any,
    });
    setEditingOffer(null);
  };

  const handleImportOffers = async (importedOffers: any[]) => {
    // Bulk create sequentially for simplicity
    for (const offer of importedOffers) {
      await createMutation.mutateAsync({
        name: offer.name,
        type: offer.type,
        price: offer.price,
        coverage: offer.coverage,
        description: offer.description,
        deductible: offer.deductible || 0,
        maxCoverage: offer.maxCoverage || 0,
        duration: offer.duration || 12,
        features: offer.features || [],
      });
    }
  };

  const exportOffers = () => {
    const csvContent = [
      ['Nom', 'Type', 'Prix (FCFA)', 'Couverture', 'Statut', 'Clients', 'Conversion', 'Description'],
      ...offers.map(offer => [
        offer.name,
        offer.type,
        offer.price.toString(),
        offer.coverage,
        offer.status,
        offer.customers.toString(),
        offer.conversion.toString(),
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

  const getStatusBadge = (status: 'active' | 'inactive') => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Actif
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        Inactif
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Offres</h1>
          <p className="text-gray-600">Gérez vos offres d'assurance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4" />
            Importer CSV
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total offres</p>
                <p className="text-2xl font-bold">{serverOffers.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offres actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredOffers.filter(o => o.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients totaux</p>
                <p className="text-2xl font-bold">
                  {offers.reduce((sum, offer) => sum + offer.customers, 0)}
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux conversion moyen</p>
                <p className="text-2xl font-bold">
                  {Math.round(offers.reduce((sum, offer) => sum + offer.conversion, 0) / offers.length)}%
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
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
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des offres</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de l'offre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Couverture</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Dernière mise à jour</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{offer.name}</div>
                      <div className="text-sm text-gray-500">{offer.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{offer.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {offer.price.toLocaleString('fr-FR')} FCFA
                  </TableCell>
                  <TableCell>{offer.coverage}</TableCell>
                  <TableCell>{getStatusBadge(offer.status)}</TableCell>
                  <TableCell>{offer.customers}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{offer.conversion}%</span>
                      <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(offer.lastUpdated).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => setEditingOffer(offer)}
                        >
                          <Edit className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => toggleOfferStatus(offer.id)}
                        >
                          {offer.status === 'active' ? (
                            <>
                              <ToggleLeft className="h-4 w-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600"
                          onClick={() => deleteOffer(offer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <OfferFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOffer}
      />

      <OfferFormModal
        isOpen={!!editingOffer}
        onClose={() => setEditingOffer(null)}
        onSubmit={handleEditOffer}
        initialData={editingOffer ? {
          name: editingOffer.name,
          type: editingOffer.type,
          price: editingOffer.price,
          coverage: editingOffer.coverage,
          description: editingOffer.description,
          deductible: 0,
          maxCoverage: 0,
          duration: 12,
          features: [],
          conditions: '',
        } : undefined}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportOffers}
      />
    </div>
  );
};

export default InsurerOffersPage;
