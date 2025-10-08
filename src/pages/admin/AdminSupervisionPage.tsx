import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  MoreHorizontal
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin: string;
}

interface Insurer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  offersCount: number;
  conversionRate: number;
}

interface Offer {
  id: string;
  title: string;
  insurer: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  clicks: number;
  conversions: number;
}

export const AdminSupervisionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data
  const users: User[] = [
    { id: '1', firstName: 'Jean', lastName: 'Kouadio', email: 'jean.kouadio@email.com', role: 'USER', status: 'active', createdAt: '2024-01-15', lastLogin: '2024-01-20' },
    { id: '2', firstName: 'Marie', lastName: 'Amani', email: 'marie.amani@email.com', role: 'USER', status: 'active', createdAt: '2024-01-10', lastLogin: '2024-01-19' },
    { id: '3', firstName: 'NSIA', lastName: 'Assurance', email: 'contact@nsia.ci', role: 'INSURER', status: 'pending', createdAt: '2024-01-18', lastLogin: '2024-01-18' },
    { id: '4', firstName: 'AXA', lastName: 'Côte d\'Ivoire', email: 'contact@axa.ci', role: 'INSURER', status: 'active', createdAt: '2024-01-12', lastLogin: '2024-01-20' },
  ];

  const insurers: Insurer[] = [
    { id: '1', name: 'NSIA Assurance', email: 'contact@nsia.ci', status: 'pending', createdAt: '2024-01-18', offersCount: 12, conversionRate: 15.5 },
    { id: '2', name: 'AXA Côte d\'Ivoire', email: 'contact@axa.ci', status: 'active', createdAt: '2024-01-12', offersCount: 25, conversionRate: 18.2 },
    { id: '3', name: 'SUNU Assurances', email: 'contact@sunu.ci', status: 'active', createdAt: '2024-01-08', offersCount: 18, conversionRate: 12.8 },
  ];

  const offers: Offer[] = [
    { id: '1', title: 'Assurance Auto Standard', insurer: 'NSIA Assurance', price: 150000, status: 'active', createdAt: '2024-01-15', clicks: 234, conversions: 45 },
    { id: '2', title: 'Assurance Tous Risques', insurer: 'AXA Côte d\'Ivoire', price: 250000, status: 'active', createdAt: '2024-01-12', clicks: 189, conversions: 38 },
    { id: '3', title: 'Assurance Éco', insurer: 'SUNU Assurances', price: 120000, status: 'pending', createdAt: '2024-01-18', clicks: 0, conversions: 0 },
  ];

  const getStatusBadge = (status: string) => {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'INSURER':
        return <Badge className="bg-blue-100 text-blue-800">Assureur</Badge>;
      case 'USER':
        return <Badge className="bg-gray-100 text-gray-800">Utilisateur</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const stats = {
    users: { total: 12543, active: 11234, new: 234 },
    insurers: { total: 28, active: 25, pending: 3 },
    offers: { total: 456, active: 389, pending: 12 },
    quotes: { total: 45678, converted: 8456, conversionRate: 18.5 }
  };

  const kpis = [
    { label: 'Taux complétion formulaire', value: '78%', target: '70%', status: 'good' },
    { label: 'Clic vers assureurs', value: '28%', target: '25%', status: 'good' },
    { label: 'Conversion devis → souscription', value: '18.5%', target: '10%', status: 'excellent' },
    { label: 'Temps de résultats', value: '2.3s', target: '3s', status: 'excellent' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Indicateurs Clés de Performance</span>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{kpi.label}</span>
                  {kpi.status === 'excellent' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {kpi.status === 'good' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="text-xs text-gray-500">Cible: {kpi.target}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.users.total.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{stats.users.new} ce mois</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assureurs</p>
                <p className="text-2xl font-bold text-green-600">{stats.insurers.total}</p>
                <p className="text-xs text-yellow-600">{stats.insurers.pending} en attente</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offres</p>
                <p className="text-2xl font-bold text-purple-600">{stats.offers.total}</p>
                <p className="text-xs text-green-600">{stats.offers.active} actives</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-orange-600">{stats.quotes.conversionRate}%</p>
                <p className="text-xs text-green-600">{stats.quotes.converted} conversions</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
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
              <div className="flex space-x-4">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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
                  <SelectTrigger className="w-40">
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
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Utilisateur</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Rôle</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Créé le</th>
                      <th className="text-left p-4">Dernière connexion</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">{getRoleBadge(user.role)}</td>
                        <td className="p-4">{getStatusBadge(user.status)}</td>
                        <td className="p-4">{user.createdAt}</td>
                        <td className="p-4">{user.lastLogin}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              {user.status === 'active' ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            </Button>
                            <Button variant="outline" size="sm">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Assureur</th>
                      <th className="text-left p-4">Email</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Offres</th>
                      <th className="text-left p-4">Taux conversion</th>
                      <th className="text-left p-4">Créé le</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insurers.map((insurer) => (
                      <tr key={insurer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="font-medium">{insurer.name}</div>
                          </div>
                        </td>
                        <td className="p-4">{insurer.email}</td>
                        <td className="p-4">{getStatusBadge(insurer.status)}</td>
                        <td className="p-4">{insurer.offersCount}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{insurer.conversionRate}%</span>
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          </div>
                        </td>
                        <td className="p-4">{insurer.createdAt}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            {insurer.status === 'pending' && (
                              <Button size="sm">
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Offre</th>
                      <th className="text-left p-4">Assureur</th>
                      <th className="text-left p-4">Prix</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Clics</th>
                      <th className="text-left p-4">Conversions</th>
                      <th className="text-left p-4">Créé le</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => (
                      <tr key={offer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{offer.title}</td>
                        <td className="p-4">{offer.insurer}</td>
                        <td className="p-4">{offer.price.toLocaleString()} FCFA</td>
                        <td className="p-4">{getStatusBadge(offer.status)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span>{offer.clicks}</span>
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span>{offer.conversions}</span>
                            <DollarSign className="h-3 w-3 text-green-600" />
                          </div>
                        </td>
                        <td className="p-4">{offer.createdAt}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
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
      </Tabs>
    </div>
  );
};

export default AdminSupervisionPage;