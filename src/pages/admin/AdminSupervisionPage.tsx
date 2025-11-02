import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  Users,
  Shield,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  BarChart3,
  Activity,
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Ban,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { adminSupervisionApi } from '@/api/services/adminSupervisionApi';
import type {
  User,
  Insurer,
  Offer,
  SupervisionStats,
  KPI,
  UserFilters,
  InsurerFilters,
  OfferFilters
} from '@/api/services/adminSupervisionApi';

export const AdminSupervisionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // États pour les données API
  const [users, setUsers] = useState<User[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<SupervisionStats | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);

  // États de chargement
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, insurersResponse, offersResponse, statsResponse, kpisResponse] = await Promise.all([
        adminSupervisionApi.getUsers(),
        adminSupervisionApi.getInsurers(),
        adminSupervisionApi.getOffers(),
        adminSupervisionApi.getSupervisionStats(),
        adminSupervisionApi.getKPIs()
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data?.data || []);
      }
      if (insurersResponse.success) {
        setInsurers(insurersResponse.data?.data || []);
      }
      if (offersResponse.success) {
        setOffers(offersResponse.data?.data || []);
      }
      if (statsResponse.success) {
        setStats(statsResponse.data || null);
      }
      if (kpisResponse.success) {
        setKpis(kpisResponse.data || []);
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400">Admin</Badge>;
      case 'INSURER':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Assureur</Badge>;
      case 'USER':
        return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Utilisateur</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Fonctions pour les actions
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await adminSupervisionApi.exportData({
        entityType: 'users',
        format: 'csv',
        filters: { 
          search: searchTerm, 
          status: statusFilter === 'all' ? undefined : statusFilter as 'active' | 'inactive' | 'pending', 
          role: roleFilter === 'all' ? undefined : roleFilter as 'USER' | 'INSURER' | 'ADMIN' 
        }
      });
      
      if (response.success && response.data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = 'users_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Export réussi');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExportLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const response = await adminSupervisionApi.toggleUserStatus(userId);
      if (response.success) {
        toast.success('Statut de l\'utilisateur mis à jour');
        loadData();
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleApproveInsurer = async (insurerId: string) => {
    try {
      const response = await adminSupervisionApi.approveInsurer(insurerId);
      if (response.success) {
        toast.success('Assureur approuvé avec succès');
        loadData();
      }
    } catch (error) {
      logger.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleToggleOfferStatus = async (offerId: string) => {
    try {
      const response = await adminSupervisionApi.toggleOfferStatus(offerId);
      if (response.success) {
        toast.success('Statut de l\'offre mis à jour');
        loadData();
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Indicateurs Clés de Performance</span>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
              <Download className="h-3 w-3 mr-1" />
              {exportLoading ? 'Export en cours...' : 'Exporter'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
                  {kpi.status === 'excellent' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {kpi.status === 'good' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground">Cible: {kpi.target}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.users?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600">+{stats?.users?.new || 0} ce mois</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assureurs</p>
                <p className="text-2xl font-bold text-green-600">{stats?.insurers?.total || 0}</p>
                <p className="text-xs text-yellow-600">{stats?.insurers?.pending || 0} en attente</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offres</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.offers?.total || 0}</p>
                <p className="text-xs text-green-600">{stats?.offers?.active || 0} actives</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.quotes?.conversionRate || 0}%</p>
                <p className="text-xs text-green-600">{stats?.quotes?.converted || 0} conversions</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="insurers">Assureurs</TabsTrigger>
          <TabsTrigger value="offers">Offres</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestion des Utilisateurs</span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un utilisateur
                </Button>
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="USER">Utilisateurs</SelectItem>
                      <SelectItem value="INSURER">Assureurs</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-4">Utilisateur</th>
                      <th className="text-left p-2 sm:p-4 hidden sm:table-cell">Email</th>
                      <th className="text-left p-2 sm:p-4">Rôle</th>
                      <th className="text-left p-2 sm:p-4">Statut</th>
                      <th className="text-left p-2 sm:p-4 hidden md:table-cell">Créé le</th>
                      <th className="text-left p-2 sm:p-4 hidden lg:table-cell">Dernière connexion</th>
                      <th className="text-left p-2 sm:p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                              <div className="text-xs text-gray-500 sm:hidden">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden sm:table-cell">{user.email}</td>
                        <td className="p-2 sm:p-4">{getRoleBadge(user.role)}</td>
                        <td className="p-2 sm:p-4">{getStatusBadge(user.status)}</td>
                        <td className="p-2 sm:p-4 hidden md:table-cell">{user.createdAt}</td>
                        <td className="p-2 sm:p-4 hidden lg:table-cell">{user.lastLogin}</td>
                        <td className="p-2 sm:p-4">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2" onClick={() => handleToggleUserStatus(user.id)}>
                              {user.status === 'active' ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <MoreHorizontal className="h-3 w-3" />
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

        {/* Insurers Tab */}
        <TabsContent value="insurers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestion des Assureurs</span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un assureur
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-4">Assureur</th>
                      <th className="text-left p-2 sm:p-4 hidden sm:table-cell">Email</th>
                      <th className="text-left p-2 sm:p-4">Statut</th>
                      <th className="text-left p-2 sm:p-4">Offres</th>
                      <th className="text-left p-2 sm:p-4 hidden md:table-cell">Taux conversion</th>
                      <th className="text-left p-2 sm:p-4 hidden lg:table-cell">Créé le</th>
                      <th className="text-left p-2 sm:p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insurers.map((insurer) => (
                      <tr key={insurer.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{insurer.name}</div>
                              <div className="text-xs text-gray-500 sm:hidden">{insurer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden sm:table-cell">{insurer.email}</td>
                        <td className="p-2 sm:p-4">{getStatusBadge(insurer.status)}</td>
                        <td className="p-2 sm:p-4">{insurer.offersCount}</td>
                        <td className="p-2 sm:p-4 hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{insurer.conversionRate}%</span>
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden lg:table-cell">{insurer.createdAt}</td>
                        <td className="p-2 sm:p-4">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {insurer.status === 'pending' && (
                              <Button size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2" onClick={() => handleApproveInsurer(insurer.id)}>
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
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

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestion des Offres</span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une offre
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="responsive-table-wrapper">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 sm:p-4">Offre</th>
                      <th className="text-left p-2 sm:p-4">Assureur</th>
                      <th className="text-left p-2 sm:p-4">Prix</th>
                      <th className="text-left p-2 sm:p-4">Statut</th>
                      <th className="text-left p-2 sm:p-4 hidden sm:table-cell">Clics</th>
                      <th className="text-left p-2 sm:p-4 hidden md:table-cell">Conversions</th>
                      <th className="text-left p-2 sm:p-4 hidden lg:table-cell">Créé le</th>
                      <th className="text-left p-2 sm:p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 sm:p-4 font-medium text-sm">{offer.title}</td>
                        <td className="p-2 sm:p-4 text-sm">{offer.insurer}</td>
                        <td className="p-2 sm:p-4 text-sm">{offer.price.toLocaleString()} FCFA</td>
                        <td className="p-2 sm:p-4">{getStatusBadge(offer.status)}</td>
                        <td className="p-2 sm:p-4 hidden sm:table-cell">
                          <div className="flex items-center space-x-2">
                            <span>{offer.clicks}</span>
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            <span>{offer.conversions}</span>
                            <DollarSign className="h-3 w-3 text-green-600" />
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 hidden lg:table-cell">{offer.createdAt}</td>
                        <td className="p-2 sm:p-4">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2" onClick={() => handleToggleOfferStatus(offer.id)}>
                              {offer.status === 'active' ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
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
      </Tabs>
    </div>
  );
};

export default AdminSupervisionPage;
