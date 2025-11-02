import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Phone, MapPin, Calendar, Building, Shield, Car, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { insurerService, type Insurer, type InsurerFormData } from "@/features/admin/services/insurerService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from '@/lib/logger';


const AdminInsurersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [viewingInsurer, setViewingInsurer] = useState<Insurer | null>(null);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load insurers data
  const loadInsurers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await insurerService.getInsurers();
      setInsurers(data);
    } catch (err) {
      logger.error('Error loading insurers:', err);
      setError('Erreur lors du chargement des assureurs. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des assureurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsurers();
  }, []);

  const filteredInsurers = insurers.filter(insurer => {
    const matchesSearch = insurer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insurer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || insurer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400">Actif</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Inactif</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-400">Suspendu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = async (insurerId: string, newStatus: Insurer['status']) => {
    try {
      await insurerService.updateInsurerStatus(insurerId, newStatus);
      toast.success('Statut mis à jour avec succès');
      loadInsurers(); // Refresh data
    } catch (err) {
      logger.error('Error updating insurer status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteInsurer = async (insurerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet assureur ?')) {
      return;
    }

    try {
      await insurerService.deleteInsurer(insurerId);
      toast.success('Assureur supprimé avec succès');
      loadInsurers(); // Refresh data
    } catch (err) {
      logger.error('Error deleting insurer:', err);
      toast.error('Erreur lors de la suppression de l\'assureur');
    }
  };

  const handleApproveInsurer = async (insurerId: string) => {
    try {
      await insurerService.approveInsurer(insurerId);
      toast.success('Assureur approuvé avec succès');
      loadInsurers(); // Refresh data
    } catch (err) {
      logger.error('Error approving insurer:', err);
      toast.error('Erreur lors de l\'approbation de l\'assureur');
    }
  };

  // Insurer Form Component
  const InsurerForm: React.FC<{ insurer?: Insurer }> = ({ insurer }) => {
    const [formData, setFormData] = useState<InsurerFormData>({
      companyName: insurer?.companyName || '',
      email: insurer?.email || '',
      phone: insurer?.phone || '',
      address: insurer?.address || '',
      description: insurer?.description || '',
      website: insurer?.website || '',
      licenseNumber: insurer?.licenseNumber || '',
      status: insurer?.status || 'pending'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
        if (insurer) {
          await insurerService.updateInsurer(insurer.id, formData);
          toast.success('Assureur mis à jour avec succès');
        } else {
          await insurerService.createInsurer(formData);
          toast.success('Assureur créé avec succès');
        }
        
        setIsCreateDialogOpen(false);
        setEditingInsurer(null);
        loadInsurers(); // Refresh data
      } catch (err) {
        logger.error('Error saving insurer:', err);
        toast.error(insurer ? 'Erreur lors de la mise à jour de l\'assureur' : 'Erreur lors de la création de l\'assureur');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="companyName">Nom de l'entreprise</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="licenseNumber">Numéro de licence</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'pending' | 'suspended' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {insurer ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              <>
                {insurer ? 'Mettre à jour' : 'Créer'}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  // Insurer Details Component
  const InsurerDetails: React.FC<{ insurer: Insurer }> = ({ insurer }) => {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xl">
            {insurer.companyName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{insurer.companyName}</h3>
            <p className="text-muted-foreground">{insurer.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Statut</Label>
            <div className="mt-1">{getStatusBadge(insurer.status)}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Date de création</Label>
            <div className="mt-1">{insurer.createdAt}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Dernière connexion</Label>
            <div className="mt-1">{insurer.lastLogin}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Taux de conversion</Label>
            <div className="mt-1">{insurer.conversionRate}%</div>
          </div>
        </div>

        {insurer.phone && (
          <div>
            <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
            <div className="mt-1 flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{insurer.phone}</span>
            </div>
          </div>
        )}

        {insurer.address && (
          <div>
            <Label className="text-sm font-medium text-gray-600">Adresse</Label>
            <div className="mt-1 flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{insurer.address}</span>
            </div>
          </div>
        )}

        {insurer.website && (
          <div>
            <Label className="text-sm font-medium text-gray-600">Site web</Label>
            <div className="mt-1">
              <a href={insurer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {insurer.website}
              </a>
            </div>
          </div>
        )}

        {insurer.licenseNumber && (
          <div>
            <Label className="text-sm font-medium text-gray-600">Numéro de licence</Label>
            <div className="mt-1 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span>{insurer.licenseNumber}</span>
            </div>
          </div>
        )}

        {insurer.description && (
          <div>
            <Label className="text-sm font-medium text-gray-600">Description</Label>
            <div className="mt-1">{insurer.description}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{insurer.quotesCount}</div>
            <div className="text-sm text-gray-600">Devis reçus</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${insurer.profileCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
              {insurer.profileCompleted ? 'Complet' : 'Incomplet'}
            </div>
            <div className="text-sm text-gray-600">Profil</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Assureurs</h1>
          <p className="text-muted-foreground">Gérez les compagnies d'assurance partenaires</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un assureur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un assureur</DialogTitle>
              <DialogDescription>
                Créez un nouveau compte pour une compagnie d'assurance
              </DialogDescription>
            </DialogHeader>
            <InsurerForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeletons for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Building className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assureurs</p>
                    <p className="text-2xl font-bold">{insurers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold">{insurers.filter(i => i.status === 'active').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">En attente</p>
                    <p className="text-2xl font-bold">{insurers.filter(i => i.status === 'pending').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Devis</p>
                    <p className="text-2xl font-bold">{insurers.reduce((sum, i) => sum + i.quotesCount, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Car className="h-8 w-8 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Offres</p>
                    <p className="text-2xl font-bold">{insurers.reduce((sum, i) => sum + i.offersCount, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <CardTitle className="text-lg">Liste des Assureurs</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher un assureur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="suspended">Suspendus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 p-2">
                    <Checkbox
                      checked={selectedInsurers.length === filteredInsurers.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInsurers(filteredInsurers.map(i => i.id));
                        } else {
                          setSelectedInsurers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="p-2">Assureur</TableHead>
                  <TableHead className="p-2 hidden sm:table-cell">Contact</TableHead>
                  <TableHead className="p-2">Statut</TableHead>
                  <TableHead className="p-2 hidden md:table-cell">Devis reçus</TableHead>
                  <TableHead className="p-2 hidden lg:table-cell">Offres</TableHead>
                  <TableHead className="p-2 hidden xl:table-cell">Taux conversion</TableHead>
                  <TableHead className="p-2 hidden xl:table-cell">Date création</TableHead>
                  <TableHead className="p-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons for table rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="p-2">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 hidden sm:table-cell">
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Skeleton className="h-6 w-16 rounded" />
                      </TableCell>
                      <TableCell className="p-2 hidden md:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="p-2 hidden lg:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="p-2 hidden xl:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="p-2 hidden xl:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <Skeleton className="h-8 w-8 sm:h-auto sm:w-auto sm:p-2 rounded" />
                          <Skeleton className="h-8 w-8 sm:h-auto sm:w-auto sm:p-2 rounded" />
                          <Skeleton className="h-8 w-8 sm:h-auto sm:w-auto sm:p-2 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredInsurers.map((insurer) => (
                  <TableRow key={insurer.id}>
                    <TableCell className="p-2">
                      <Checkbox
                        checked={selectedInsurers.includes(insurer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInsurers([...selectedInsurers, insurer.id]);
                          } else {
                            setSelectedInsurers(selectedInsurers.filter(id => id !== insurer.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                          {insurer.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{insurer.companyName}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{insurer.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 hidden sm:table-cell">
                      <div className="space-y-1">
                        {insurer.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{insurer.phone}</span>
                          </div>
                        )}
                        {insurer.address && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{insurer.address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        {getStatusBadge(insurer.status)}
                        {insurer.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveInsurer(insurer.id)}
                            className="h-8 px-2 text-xs"
                          >
                            Approuver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 hidden md:table-cell">
                      <div className="text-center">
                        <div className="font-medium">{insurer.quotesCount}</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 hidden lg:table-cell">
                      <div className="text-center">
                        <div className="font-medium">{insurer.offersCount}</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 hidden xl:table-cell">
                      <div className="text-center">
                        <div className="font-medium">{insurer.conversionRate}%</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 hidden xl:table-cell">
                      <div className="text-sm text-gray-500">{insurer.createdAt}</div>
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex justify-end space-x-1 sm:space-x-2">
                        <Dialog open={!!viewingInsurer} onOpenChange={(open) => !open && setViewingInsurer(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingInsurer(insurer)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Détails de l'assureur</DialogTitle>
                            </DialogHeader>
                            {viewingInsurer && <InsurerDetails insurer={viewingInsurer} />}
                          </DialogContent>
                        </Dialog>

                        <Dialog open={!!editingInsurer} onOpenChange={(open) => !open && setEditingInsurer(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingInsurer(insurer)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Modifier l'assureur</DialogTitle>
                            </DialogHeader>
                            {editingInsurer && <InsurerForm insurer={editingInsurer} />}
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteInsurer(insurer.id)}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsurersPage;
