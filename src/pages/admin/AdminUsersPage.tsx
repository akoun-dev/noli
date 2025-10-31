import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminBreadcrumb } from '@/components/common/BreadcrumbRenderer';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  User as UserIcon,
  MoreHorizontal,
  Download,
  Upload,
  Eye,
  Loader2
} from 'lucide-react';
import {
  useUsers,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useBulkUpdateUsers,
  useExportUsers,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest
} from '@/features/admin/services/userService';

export const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // React Query hooks
  const { data: users = [], isLoading: usersLoading } = useUsers({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter
  });

  const { data: stats } = useUserStats();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkUpdateUsers = useBulkUpdateUsers();
  const exportUsers = useExportUsers();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">En attente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">Suspendu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">Admin</Badge>;
      case 'INSURER':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">Assureur</Badge>;
      case 'USER':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">Utilisateur</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    switch (action) {
      case 'activate':
      case 'suspend':
        bulkUpdateUsers.mutate({ userIds: [userId], action: action as 'activate' | 'suspend' });
        break;
      case 'delete':
        deleteUser.mutate(userId);
        break;
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) return;
    bulkUpdateUsers.mutate({ userIds: selectedUsers, action: action as 'activate' | 'suspend' | 'delete' });
  };

  const handleExportUsers = () => {
    exportUsers.mutate({
      search: searchTerm === '' ? undefined : searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      role: roleFilter === 'all' ? undefined : roleFilter
    });
  };

  const importUsers = () => {
    logger.info('Import users dialog');
    // Import functionality would be implemented here
  };

  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb */}
      <AdminBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez tous les utilisateurs de la plateforme</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={importUsers}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="responsive-modal-lg">
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <UserForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                  </div>
                  <Shield className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Suspendus</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.suspended}</p>
                  </div>
                  <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Liste des Utilisateurs</CardTitle>
            {selectedUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedUsers.length} sélectionnés</span>
                <Select onValueChange={(value) => handleBulkAction(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Actions groupées" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Activer</SelectItem>
                    <SelectItem value="suspend">Suspendre</SelectItem>
                    <SelectItem value="delete">Supprimer</SelectItem>
                    <SelectItem value="export">Exporter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email..."
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
                <SelectItem value="suspended">Suspendus</SelectItem>
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
          {usersLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-2">Chargement des utilisateurs...</span>
            </div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-4">Utilisateur</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Rôle</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-left p-4">Activité</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.role === 'INSURER'
                            ? (user.companyName?.substring(0, 2).toUpperCase() || 'EN')
                            : `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
                          }
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.role === 'INSURER'
                              ? user.companyName || 'Entreprise non spécifiée'
                              : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nom non spécifié'
                            }
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                            <span>{user.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4">{getStatusBadge(user.status)}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{user.quotesCount}</span> devis
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.conversionRate}% conversion
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Dernière connexion: {user.lastLogin}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="responsive-modal-lg">
                            <DialogHeader>
                              <DialogTitle>Détails de l'utilisateur</DialogTitle>
                            </DialogHeader>
                            <UserDetails user={user} />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="responsive-modal-lg">
                            <DialogHeader>
                              <DialogTitle>Modifier l'utilisateur</DialogTitle>
                            </DialogHeader>
                            <UserForm user={selectedUser} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id)}
                          disabled={bulkUpdateUsers.isPending}
                        >
                          {bulkUpdateUsers.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : user.status === 'active' ? (
                            <Ban className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer l'utilisateur {selectedUser?.firstName} {selectedUser?.lastName}?</p>
            <p className="text-sm text-red-600 dark:text-red-400">Cette action est irréversible.</p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedUser) {
                    deleteUser.mutate(selectedUser.id);
                    setShowDeleteDialog(false);
                  }
                }}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// User Form Component
const UserForm: React.FC<{ user?: User }> = ({ user }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    companyName: user?.companyName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || 'USER' as 'USER' | 'INSURER' | 'ADMIN',
    status: user?.status || 'active' as 'active' | 'inactive' | 'pending' | 'suspended'
  });

  // Get the hooks from parent component scope
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      const updateData: UpdateUserRequest = {
        ...formData,
        id: user.id
      };
      updateUser.mutate(updateData);
    } else {
      const createData: CreateUserRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        status: formData.status
      };
      createUser.mutate(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dynamic Name Fields based on Role */}
      {formData.role === 'INSURER' ? (
        <div>
          <Label htmlFor="companyName">Nom de l'entreprise</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>
      )}
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
      <div>
        <Label htmlFor="address">Adresse</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Rôle</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'USER' | 'INSURER' | 'ADMIN' })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">Utilisateur</SelectItem>
              <SelectItem value="INSURER">Assureur</SelectItem>
              <SelectItem value="ADMIN">Administrateur</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
          {createUser.isPending || updateUser.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {user ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            user ? 'Mettre à jour' : 'Créer'
          )}
        </Button>
      </div>
    </form>
  );
};

// User Details Component
const UserDetails: React.FC<{ user: User }> = ({ user }) => {
  const getDisplayName = () => {
    if (user.role === 'INSURER') {
      return user.companyName || 'Entreprise non spécifiée';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nom non spécifié';
  };

  const getInitials = () => {
    if (user.role === 'INSURER' && user.companyName) {
      return user.companyName.substring(0, 2).toUpperCase();
    }
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xl">
          {getInitials()}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{getDisplayName()}</h3>
          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Rôle</Label>
          <div className="mt-1">{user.role}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</Label>
          <div className="mt-1">{user.status}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de création</Label>
          <div className="mt-1">{user.createdAt}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière connexion</Label>
          <div className="mt-1">{user.lastLogin}</div>
        </div>
      </div>

      {user.phone && (
        <div>
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Téléphone</Label>
          <div className="mt-1">{user.phone}</div>
        </div>
      )}

      {user.address && (
        <div>
          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Adresse</Label>
          <div className="mt-1">{user.address}</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.quotesCount}</div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Devis créés</div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{user.conversionRate}%</div>
          <div className="text-sm text-green-600 dark:text-green-400">Taux de conversion</div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
