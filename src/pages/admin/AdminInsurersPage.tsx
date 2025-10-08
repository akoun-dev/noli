import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Phone, MapPin, Calendar, Building, Shield } from "lucide-react";
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

interface Insurer {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'INSURER';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: string;
  lastLogin: string;
  profileCompleted: boolean;
  quotesCount: number;
  conversionRate: number;
  description?: string;
  website?: string;
  licenseNumber?: string;
}

const AdminInsurersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [viewingInsurer, setViewingInsurer] = useState<Insurer | null>(null);

  // Mock insurer data
  const insurers: Insurer[] = [
    {
      id: '3',
      companyName: 'NSIA Assurance',
      email: 'contact@nsia.ci',
      phone: '+225 21 25 40 00',
      address: 'Abidjan, Cocody',
      role: 'INSURER',
      status: 'pending',
      createdAt: '2024-01-18',
      lastLogin: '2024-01-18',
      profileCompleted: true,
      quotesCount: 0,
      conversionRate: 0,
      description: 'Compagnie d\'assurance ivoirienne leader',
      website: 'https://www.nsia-assurance.com',
      licenseNumber: 'LIC-2024-001'
    },
    {
      id: '6',
      companyName: 'AXA Côte d\'Ivoire',
      email: 'contact@axa.ci',
      phone: '+225 21 25 50 00',
      address: 'Abidjan, Plateau',
      role: 'INSURER',
      status: 'active',
      createdAt: '2024-01-15',
      lastLogin: '2024-01-19',
      profileCompleted: true,
      quotesCount: 12,
      conversionRate: 25,
      description: 'Filiale ivoirienne du groupe AXA',
      website: 'https://www.axa.ci',
      licenseNumber: 'LIC-2024-002'
    },
    {
      id: '7',
      companyName: 'SUNU Assurances',
      email: 'contact@sunu.ci',
      phone: '+225 21 25 60 00',
      address: 'Abidjan, Marcory',
      role: 'INSURER',
      status: 'active',
      createdAt: '2024-01-12',
      lastLogin: '2024-01-18',
      profileCompleted: true,
      quotesCount: 8,
      conversionRate: 20,
      description: 'Compagnie d\'assurance panafricaine',
      website: 'https://www.sunu.com',
      licenseNumber: 'LIC-2024-003'
    }
  ];

  const filteredInsurers = insurers.filter(insurer => {
    const matchesSearch = insurer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         insurer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || insurer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleStatusChange = (insurerId: string, newStatus: string) => {
    console.log(`Changing status for insurer ${insurerId} to ${newStatus}`);
    toast.success('Statut mis à jour avec succès');
  };

  const handleDeleteInsurer = (insurerId: string) => {
    console.log(`Deleting insurer ${insurerId}`);
    toast.success('Assureur supprimé avec succès');
  };

  const handleApproveInsurer = (insurerId: string) => {
    handleStatusChange(insurerId, 'active');
  };

  // Insurer Form Component
  const InsurerForm: React.FC<{ insurer?: Insurer }> = ({ insurer }) => {
    const [formData, setFormData] = useState({
      companyName: insurer?.companyName || '',
      email: insurer?.email || '',
      phone: insurer?.phone || '',
      address: insurer?.address || '',
      description: insurer?.description || '',
      website: insurer?.website || '',
      licenseNumber: insurer?.licenseNumber || '',
      status: insurer?.status || 'pending' as 'active' | 'inactive' | 'pending' | 'suspended'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
      toast.success(insurer ? 'Assureur mis à jour' : 'Assureur créé');
      setIsCreateDialogOpen(false);
      setEditingInsurer(null);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
          <Button type="submit">
            {insurer ? 'Mettre à jour' : 'Créer'}
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
            <p className="text-gray-600">{insurer.email}</p>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Assureurs</h1>
          <p className="text-gray-600">Gérez les compagnies d'assurance partenaires</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Assureurs</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher un assureur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
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
                  <TableHead>Assureur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Devis reçus</TableHead>
                  <TableHead>Taux conversion</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsurers.map((insurer) => (
                  <TableRow key={insurer.id}>
                    <TableCell>
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
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {insurer.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{insurer.companyName}</div>
                          <div className="text-sm text-gray-500">{insurer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>
                      {getStatusBadge(insurer.status)}
                      {insurer.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={() => handleApproveInsurer(insurer.id)}
                        >
                          Approuver
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{insurer.quotesCount}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{insurer.conversionRate}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">{insurer.createdAt}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Dialog open={!!viewingInsurer} onOpenChange={(open) => !open && setViewingInsurer(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingInsurer(insurer)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
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
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
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
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
};

export default AdminInsurersPage;