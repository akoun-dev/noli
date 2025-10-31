import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { guaranteeService } from '@/features/tarification/services/guaranteeService';
import {
  Guarantee,
  GuaranteeCategory,
  InsurancePackage,
  GuaranteeFormData,
  PackageFormData,
  CalculationMethodType
} from '@/types/tarification';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Package,
  Calculator,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Copy,
  FileText,
  Grid3X3,
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AdminTarificationPage: React.FC = () => {
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [statistics, setStatistics] = useState<{
    totalGuarantees: number;
    activeGuarantees: number;
    totalPackages: number;
    activePackages: number;
    averagePackagePrice: number;
    priceRange: { min: number; max: number };
    mostUsedGuarantees: Array<{
      guaranteeId: string;
      guaranteeName: string;
      usageCount: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateGuaranteeDialogOpen, setIsCreateGuaranteeDialogOpen] = useState(false);
  const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);
  const [isEditGuaranteeDialogOpen, setIsEditGuaranteeDialogOpen] = useState(false);
  const [isEditPackageDialogOpen, setIsEditPackageDialogOpen] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<Guarantee | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<InsurancePackage | null>(null);

  const [newGuarantee, setNewGuarantee] = useState<GuaranteeFormData>({
    name: '',
    code: '',
    category: 'RESPONSABILITE_CIVILE',
    description: '',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true
  });

  const [newPackage, setNewPackage] = useState<PackageFormData>({
    name: '',
    code: '',
    description: '',
    guaranteeIds: [],
    basePrice: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [guaranteesData, packagesData, statsData] = await Promise.all([
        guaranteeService.getGuarantees(),
        guaranteeService.getPackages(),
        guaranteeService.getTarificationStats()
      ]);

      setGuarantees(guaranteesData);
      setPackages(packagesData);
      setStatistics(statsData);
    } catch (error) {
      logger.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données de tarification');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuarantee = async () => {
    try {
      if (!newGuarantee.name || !newGuarantee.code || !newGuarantee.description) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      await guaranteeService.createGuarantee(newGuarantee);
      setIsCreateGuaranteeDialogOpen(false);
      setNewGuarantee({
        name: '',
        code: '',
        category: 'RESPONSABILITE_CIVILE',
        description: '',
        calculationMethod: 'FIXED_AMOUNT',
        isOptional: true
      });
      toast.success('Garantie créée avec succès');
      loadData();
    } catch (error) {
      logger.error('Error creating guarantee:', error);
      toast.error('Erreur lors de la création de la garantie');
    }
  };

  const handleCreatePackage = async () => {
    try {
      if (!newPackage.name || !newPackage.code || !newPackage.description || newPackage.guaranteeIds.length === 0) {
        return;
      }

      await guaranteeService.createPackage(newPackage);
      setIsCreatePackageDialogOpen(false);
      setNewPackage({
        name: '',
        code: '',
        description: '',
        guaranteeIds: [],
        basePrice: 0
      });
      loadData();
    } catch (error) {
      logger.error('Error creating package:', error);
    }
  };

  const handleUpdateGuarantee = async () => {
    try {
      if (!selectedGuarantee || !newGuarantee.name || !newGuarantee.code || !newGuarantee.description) {
        return;
      }

      await guaranteeService.updateGuarantee(selectedGuarantee.id, newGuarantee);
      setIsEditGuaranteeDialogOpen(false);
      setSelectedGuarantee(null);
      setNewGuarantee({
        name: '',
        code: '',
        category: 'RESPONSABILITE_CIVILE',
        description: '',
        calculationMethod: 'FIXED_AMOUNT',
        isOptional: true
      });
      loadData();
    } catch (error) {
      logger.error('Error updating guarantee:', error);
    }
  };

  const handleUpdatePackage = async () => {
    try {
      if (!selectedPackage || !newPackage.name || !newPackage.code || !newPackage.description || newPackage.guaranteeIds.length === 0) {
        return;
      }

      await guaranteeService.updatePackage(selectedPackage.id, newPackage);
      setIsEditPackageDialogOpen(false);
      setSelectedPackage(null);
      setNewPackage({
        name: '',
        code: '',
        description: '',
        guaranteeIds: [],
        basePrice: 0
      });
      loadData();
    } catch (error) {
      logger.error('Error updating package:', error);
    }
  };

  const handleDeleteGuarantee = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette garantie ?')) {
      return;
    }

    try {
      await guaranteeService.deleteGuarantee(id);
      loadData();
    } catch (error) {
      logger.error('Error deleting guarantee:', error);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce package ?')) {
      return;
    }

    try {
      await guaranteeService.deletePackage(id);
      loadData();
    } catch (error) {
      logger.error('Error deleting package:', error);
    }
  };

  const handleToggleGuarantee = async (id: string) => {
    try {
      await guaranteeService.toggleGuarantee(id);
      loadData();
    } catch (error) {
      logger.error('Error toggling guarantee:', error);
    }
  };

  const handleTogglePackage = async (id: string) => {
    try {
      await guaranteeService.togglePackage(id);
      loadData();
    } catch (error) {
      logger.error('Error toggling package:', error);
    }
  };

  const openEditGuaranteeDialog = (guarantee: Guarantee) => {
    setSelectedGuarantee(guarantee);
    setNewGuarantee({
      name: guarantee.name,
      code: guarantee.code,
      category: guarantee.category,
      description: guarantee.description,
      calculationMethod: guarantee.calculationMethod,
      isOptional: guarantee.isOptional,
      conditions: guarantee.conditions,
      minValue: guarantee.minValue,
      maxValue: guarantee.maxValue,
      rate: guarantee.rate,
      franchiseOptions: guarantee.franchiseOptions,
      parameters: guarantee.parameters
    });
    setIsEditGuaranteeDialogOpen(true);
  };

  const openEditPackageDialog = (pkg: InsurancePackage) => {
    setSelectedPackage(pkg);
    setNewPackage({
      name: pkg.name,
      code: pkg.code,
      description: pkg.description,
      guaranteeIds: pkg.guarantees,
      basePrice: pkg.basePrice
    });
    setIsEditPackageDialogOpen(true);
  };

  const filteredGuarantees = guarantees.filter(guarantee => {
    const matchesSearch = `${guarantee.name} ${guarantee.code} ${guarantee.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || guarantee.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredPackages = packages.filter(pkg =>
    `${pkg.name} ${pkg.code} ${pkg.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const calculationMethods = guaranteeService.getCalculationMethods();
  const categories = guaranteeService.getGuaranteeCategories();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Tarification & Garanties</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gérez les garanties, packages et grilles de tarification
          </p>
        </div>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Garanties</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalGuarantees}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeGuarantees} actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Packages</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPackages}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activePackages} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.averagePackagePrice).toLocaleString()} FCFA
              </div>
              <p className="text-xs text-muted-foreground">
                Par package
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gamme de Prix</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.priceRange.min).toLocaleString()} - {Math.round(statistics.priceRange.max).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                FCFA
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="guarantees" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="guarantees" className="text-xs sm:text-sm">Garanties</TabsTrigger>
          <TabsTrigger value="packages" className="text-xs sm:text-sm">Packages</TabsTrigger>
          <TabsTrigger value="grids" className="text-xs sm:text-sm">Grilles</TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs sm:text-sm">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="guarantees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Gestion des Garanties</span>
                <Dialog open={isCreateGuaranteeDialogOpen} onOpenChange={setIsCreateGuaranteeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Garantie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle garantie</DialogTitle>
                      <DialogDescription>
                        Définissez une nouvelle garantie avec sa méthode de calcul
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="guarantee-name">Nom de la garantie</Label>
                          <Input
                            id="guarantee-name"
                            value={newGuarantee.name}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Responsabilité Civile"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guarantee-code">Code</Label>
                          <Input
                            id="guarantee-code"
                            value={newGuarantee.code}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            placeholder="Ex: RC"
                            maxLength={10}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="guarantee-description">Description</Label>
                        <Textarea
                          id="guarantee-description"
                          value={newGuarantee.description}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description détaillée de la garantie"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Catégorie</Label>
                          <Select
                            value={newGuarantee.category}
                            onValueChange={(value: GuaranteeCategory) =>
                              setNewGuarantee(prev => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Méthode de calcul</Label>
                          <Select
                            value={newGuarantee.calculationMethod}
                            onValueChange={(value: CalculationMethodType) =>
                              setNewGuarantee(prev => ({ ...prev, calculationMethod: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {calculationMethods.map(method => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Taux (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={newGuarantee.rate || ''}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                            placeholder="Ex: 1.5"
                          />
                        </div>
                        <div>
                          <Label>Montant fixe (FCFA)</Label>
                          <Input
                            type="number"
                            value={newGuarantee.rate || ''}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, rate: parseFloat(e.target.value) || undefined }))}
                            placeholder="Ex: 15000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Montant minimum (FCFA)</Label>
                          <Input
                            type="number"
                            value={newGuarantee.minValue || ''}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, minValue: parseFloat(e.target.value) || undefined }))}
                            placeholder="Ex: 50000"
                          />
                        </div>
                        <div>
                          <Label>Montant maximum (FCFA)</Label>
                          <Input
                            type="number"
                            value={newGuarantee.maxValue || ''}
                            onChange={(e) => setNewGuarantee(prev => ({ ...prev, maxValue: parseFloat(e.target.value) || undefined }))}
                            placeholder="Ex: 500000"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="guarantee-conditions">Conditions</Label>
                        <Textarea
                          id="guarantee-conditions"
                          value={newGuarantee.conditions || ''}
                          onChange={(e) => setNewGuarantee(prev => ({ ...prev, conditions: e.target.value }))}
                          placeholder="Conditions d'application (optionnel)"
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="guarantee-optional"
                          checked={newGuarantee.isOptional}
                          onCheckedChange={(checked) =>
                            setNewGuarantee(prev => ({ ...prev, isOptional: checked as boolean }))
                          }
                        />
                        <Label htmlFor="guarantee-optional">Garantie optionnelle</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateGuaranteeDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreateGuarantee}>
                        Créer la garantie
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une garantie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:max-w-sm"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrer par catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-2">Garantie</TableHead>
                      <TableHead className="p-2 hidden sm:table-cell">Catégorie</TableHead>
                      <TableHead className="p-2 hidden md:table-cell">Méthode de calcul</TableHead>
                      <TableHead className="p-2">Taux/Montant</TableHead>
                      <TableHead className="p-2">Statut</TableHead>
                      <TableHead className="p-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredGuarantees.map((guarantee) => (
                    <TableRow key={guarantee.id}>
                      <TableCell className="p-2">
                        <div>
                          <div className="font-medium text-sm">{guarantee.name}</div>
                          <div className="text-xs text-muted-foreground">Code: {guarantee.code}</div>
                          {guarantee.description && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {guarantee.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.value === guarantee.category)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 hidden md:table-cell">
                        <div className="text-xs">
                          {calculationMethods.find(m => m.value === guarantee.calculationMethod)?.label}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="text-xs">
                          {guarantee.rate ? (
                            guarantee.calculationMethod === 'FIXED_AMOUNT' ? (
                              `${guarantee.rate.toLocaleString()} FCFA`
                            ) : (
                              `${guarantee.rate}%`
                            )
                          ) : (
                            '-'
                          )}
                        </div>
                        {guarantee.minValue && guarantee.maxValue && (
                          <div className="text-xs text-muted-foreground">
                            Min: {guarantee.minValue.toLocaleString()} - Max: {guarantee.maxValue.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex flex-col gap-1">
                          <Badge className={guarantee.isActive ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'} style={{ fontSize: '0.7rem' }}>
                            {guarantee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {!guarantee.isOptional && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400" style={{ fontSize: '0.7rem' }}>
                              Obligatoire
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditGuaranteeDialog(guarantee)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleGuarantee(guarantee.id)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            {guarantee.isActive ? <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGuarantee(guarantee.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Gestion des Packages</span>
                <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau package</DialogTitle>
                      <DialogDescription>
                        Définissez un package d'assurances avec des garanties pré-sélectionnées
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="package-name">Nom du package</Label>
                          <Input
                            id="package-name"
                            value={newPackage.name}
                            onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Plan Essentiel"
                          />
                        </div>
                        <div>
                          <Label htmlFor="package-code">Code</Label>
                          <Input
                            id="package-code"
                            value={newPackage.code}
                            onChange={(e) => setNewPackage(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            placeholder="Ex: ESSENTIEL"
                            maxLength={20}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="package-description">Description</Label>
                        <Textarea
                          id="package-description"
                          value={newPackage.description}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description détaillée du package"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Prix de base (FCFA)</Label>
                        <Input
                          type="number"
                          value={newPackage.basePrice}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                          placeholder="Ex: 150000"
                        />
                      </div>

                      <div>
                        <Label>Garanties incluses</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                          {guarantees.filter(g => g.isActive).map(guarantee => (
                            <div key={guarantee.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`package-${guarantee.id}`}
                                checked={newPackage.guaranteeIds.includes(guarantee.id)}
                                onCheckedChange={(checked) =>
                                  setNewPackage(prev => ({
                                    ...prev,
                                    guaranteeIds: checked
                                      ? [...prev.guaranteeIds, guarantee.id]
                                      : prev.guaranteeIds.filter(id => id !== guarantee.id)
                                  }))
                                }
                              />
                              <Label
                                htmlFor={`package-${guarantee.id}`}
                                className="text-sm cursor-pointer"
                                title={guarantee.description}
                              >
                                {guarantee.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {newPackage.guaranteeIds.length} garantie(s) sélectionnée(s)
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreatePackageDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleCreatePackage}>
                        Créer le package
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un package..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:max-w-sm"
                  />
                </div>
              </div>

              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-2">Package</TableHead>
                      <TableHead className="p-2 hidden sm:table-cell">Prix de base</TableHead>
                      <TableHead className="p-2">Prix total</TableHead>
                      <TableHead className="p-2 hidden md:table-cell">Garanties</TableHead>
                      <TableHead className="p-2">Statut</TableHead>
                      <TableHead className="p-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="p-2">
                        <div>
                          <div className="font-medium flex items-center gap-2 text-sm">
                            {pkg.name}
                            {pkg.isPopular && (
                              <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-800" style={{ fontSize: '0.7rem' }}>
                                Populaire
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">Code: {pkg.code}</div>
                          {pkg.description && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {pkg.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 hidden sm:table-cell">
                        <div className="text-xs">
                          {pkg.basePrice.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="font-medium text-sm">
                          {pkg.totalPrice.toLocaleString()} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="p-2 hidden md:table-cell">
                        <div className="text-xs">
                          {pkg.guarantees.length} garantie(s)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pkg.guarantees.slice(0, 2).map(gId => {
                            const guarantee = guarantees.find(g => g.id === gId);
                            return guarantee?.name;
                          }).filter(Boolean).join(', ')}
                          {pkg.guarantees.length > 2 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Badge variant="outline" className={pkg.isActive ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'} style={{ fontSize: '0.7rem' }}>
                          {pkg.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditPackageDialog(pkg)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePackage(pkg.id)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            {pkg.isActive ? <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grids" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Les grilles de tarification sont basées sur le document de tarification fourni.
              Elles incluent les grilles RC, IC/IPT, TCM/TCL et les tarifs fixes.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Grille Responsabilité Civile
                </CardTitle>
                <CardDescription>
                  Tarifs RC par catégorie, énergie et puissance fiscale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Catégorie 401 - Essence (1-2 CV): 68,675 FCFA<br />
                  Catégorie 401 - Diesel (2-4 CV): 87,885 FCFA<br />
                  Catégorie 401 - Essence (3-6 CV): 87,885 FCFA<br />
                  Catégorie 401 - Diesel (5-6 CV): 102,345 FCFA<br />
                  Catégorie 401 - Essence (7-9 CV): 102,345 FCFA<br />
                  Catégorie 402 - Essence (1-2 CV): 58,900 FCFA<br />
                  Catégorie 402 - Diesel (2-4 CV): 78,500 FCFA
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir la grille complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Grille TCM/TCL (Tierce)
                </CardTitle>
                <CardDescription>
                  Taux applicables selon valeur neuve et franchise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Tierce Complète (401):<br />
                  • Valeur ≤ 12M, Franchise 0%: 4.40%<br />
                  • Valeur ≤ 12M, Franchise 250K: 3.52%<br />
                  • Valeur 12M-25M, Franchise 250K: 3.828%<br />
                  <br />
                  Tierce Collision (401):<br />
                  • Valeur ≤ 40M, Franchise 50K: 4.311%
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir la grille complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Grille IC/IPT
                </CardTitle>
                <CardDescription>
                  Tarifs Individuelle Conducteur/Passagers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Individuelle Conducteur:<br />
                  • Formule 1: 5,500 FCFA<br />
                  • Formule 2: 8,400 FCFA<br />
                  • Formule 3: 15,900 FCFA<br />
                  <br />
                  Individuelle Passagers:<br />
                  • Formule 1 (3 places): 8,400 FCFA<br />
                  • Formule 1 (4 places): 10,200 FCFA<br />
                  • Formule 2 (3 places): 10,000 FCFA<br />
                  • Formule 2 (4 places): 12,000 FCFA
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir la grille complète
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Tarifs Fixes
                </CardTitle>
                <CardDescription>
                  Garanties à montant fixe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  • Défense et Recours: 7,950 FCFA<br />
                  • Avance sur recours: 15,000 FCFA<br />
                  • Vol des accessoires: 15,000 FCFA<br />
                  • Assistance Bronze: 48,000 FCFA<br />
                  • Assistance Silver: 65,000 FCFA<br />
                  • (Prix réduits pour packages disponibles)
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Voir tous les tarifs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Garanties les plus utilisées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics?.mostUsedGuarantees?.map((item: {
                    guaranteeId: string;
                    guaranteeName: string;
                    usageCount: number;
                  }, index: number) => (
                    <div key={item.guaranteeId} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span>{item.guaranteeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(item.usageCount / 100) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground min-w-[3rem]">
                          {item.usageCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map(category => {
                    const count = guarantees.filter(g => g.category === category.value && g.isActive).length;
                    const percentage = (count / guarantees.length) * 100;

                    return (
                      <div key={category.value} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span>{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground min-w-[3rem]">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration des méthodes de calcul</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {calculationMethods.map(method => (
                  <div key={method.value} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{method.label}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {method.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {guarantees.filter(g => g.calculationMethod === method.value).length} garantie(s) utilisent cette méthode
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour modifier une garantie */}
      <Dialog open={isEditGuaranteeDialogOpen} onOpenChange={setIsEditGuaranteeDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la garantie</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de la garantie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-guarantee-name">Nom de la garantie</Label>
                <Input
                  id="edit-guarantee-name"
                  value={newGuarantee.name}
                  onChange={(e) => setNewGuarantee(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-guarantee-code">Code</Label>
                <Input
                  id="edit-guarantee-code"
                  value={newGuarantee.code}
                  onChange={(e) => setNewGuarantee(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-guarantee-description">Description</Label>
              <Textarea
                id="edit-guarantee-description"
                value={newGuarantee.description}
                onChange={(e) => setNewGuarantee(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={newGuarantee.category}
                  onValueChange={(value: GuaranteeCategory) =>
                    setNewGuarantee(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Méthode de calcul</Label>
                <Select
                  value={newGuarantee.calculationMethod}
                  onValueChange={(value: CalculationMethodType) =>
                    setNewGuarantee(prev => ({ ...prev, calculationMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-guarantee-optional"
                checked={newGuarantee.isOptional}
                onCheckedChange={(checked) =>
                  setNewGuarantee(prev => ({ ...prev, isOptional: checked as boolean }))
                }
              />
              <Label htmlFor="edit-guarantee-optional">Garantie optionnelle</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGuaranteeDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateGuarantee}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un package */}
      <Dialog open={isEditPackageDialogOpen} onOpenChange={setIsEditPackageDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le package</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du package
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-package-name">Nom du package</Label>
                <Input
                  id="edit-package-name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-package-code">Code</Label>
                <Input
                  id="edit-package-code"
                  value={newPackage.code}
                  onChange={(e) => setNewPackage(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-package-description">Description</Label>
              <Textarea
                id="edit-package-description"
                value={newPackage.description}
                onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label>Prix de base (FCFA)</Label>
              <Input
                type="number"
                value={newPackage.basePrice}
                onChange={(e) => setNewPackage(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>Garanties incluses</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {guarantees.filter(g => g.isActive).map(guarantee => (
                  <div key={guarantee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-package-${guarantee.id}`}
                      checked={newPackage.guaranteeIds.includes(guarantee.id)}
                      onCheckedChange={(checked) =>
                        setNewPackage(prev => ({
                          ...prev,
                          guaranteeIds: checked
                            ? [...prev.guaranteeIds, guarantee.id]
                            : prev.guaranteeIds.filter(id => id !== guarantee.id)
                        }))
                      }
                    />
                    <Label
                      htmlFor={`edit-package-${guarantee.id}`}
                      className="text-sm cursor-pointer"
                      title={guarantee.description}
                    >
                      {guarantee.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPackageDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdatePackage}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTarificationPage;
