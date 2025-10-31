import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { roleService } from '../services/roleService';
import { Role, Permission, PermissionCategory, UserPermission } from '@/types/admin';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  UserPlus,
  AlertCircle
} from 'lucide-react';

export function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[]
  });

  const [editRole, setEditRole] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, categoriesData, stats] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions(),
        roleService.getPermissionCategories(),
        roleService.getRoleStatistics()
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);
      setPermissionCategories(categoriesData);
      setStatistics(stats);
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!newRole.name || !newRole.description) {
        return;
      }

      const selectedPermissions = permissions.filter(p => newRole.permissionIds.includes(p.id));

      await roleService.createRole({
        name: newRole.name,
        description: newRole.description,
        permissions: selectedPermissions,
        isActive: true,
        createdBy: 'current-user'
      });

      setIsCreateDialogOpen(false);
      setNewRole({ name: '', description: '', permissionIds: [] });
      loadData();
    } catch (error) {
      logger.error('Error creating role:', error);
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!selectedRole || !editRole.name || !editRole.description) {
        return;
      }

      const selectedPermissions = permissions.filter(p => editRole.permissionIds.includes(p.id));

      await roleService.updateRole(selectedRole.id, {
        name: editRole.name,
        description: editRole.description,
        permissions: selectedPermissions
      });

      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setEditRole({ name: '', description: '', permissionIds: [] });
      loadData();
    } catch (error) {
      logger.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.')) {
      return;
    }

    try {
      await roleService.deleteRole(roleId);
      loadData();
    } catch (error) {
      logger.error('Error deleting role:', error);
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name,
      description: role.description,
      permissionIds: role.permissions.map(p => p.id)
    });
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permissionId: string, isInEdit = false) => {
    if (isInEdit) {
      setEditRole(prev => ({
        ...prev,
        permissionIds: prev.permissionIds.includes(permissionId)
          ? prev.permissionIds.filter(id => id !== permissionId)
          : [...prev.permissionIds, permissionId]
      }));
    } else {
      setNewRole(prev => ({
        ...prev,
        permissionIds: prev.permissionIds.includes(permissionId)
          ? prev.permissionIds.filter(id => id !== permissionId)
          : [...prev.permissionIds, permissionId]
      }));
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = filterCategory === 'all'
    ? permissions
    : permissions.filter(p => p.category === filterCategory);

  const groupedPermissions = permissionCategories.map(category => ({
    category: category.category,
    label: category.label,
    permissions: filteredPermissions.filter(p => p.category === category.category)
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Rôles</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Administration des rôles et permissions du système
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Rôle
            </Button>
          </DialogTrigger>
          <DialogContent className="responsive-modal-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau rôle</DialogTitle>
              <DialogDescription>
                Définissez un nouveau rôle avec ses permissions associées
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role-name">Nom du rôle</Label>
                  <Input
                    id="role-name"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Administrateur"
                  />
                </div>
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Input
                    id="role-description"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du rôle"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Permissions</Label>
                  <Select value="all" onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {permissionCategories.map(cat => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {groupedPermissions.map(group => (
                    <div key={group.category}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {group.label}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {group.permissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`new-${permission.id}`}
                              checked={newRole.permissionIds.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <Label
                              htmlFor={`new-${permission.id}`}
                              className="text-sm cursor-pointer"
                              title={permission.description}
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateRole}>
                Créer le rôle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des rôles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalRoles}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeRoles} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total permissions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPermissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catégories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissionCategories.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs avec rôles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.usersByRole.reduce((sum: number, item: any) => sum + item.userCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="statistics">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des rôles</CardTitle>
              <CardDescription>
                Gérez les rôles et leurs permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un rôle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="responsive-table-wrapper">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Nom</TableHead>
                      <TableHead className="whitespace-nowrap">Description</TableHead>
                      <TableHead className="whitespace-nowrap">Permissions</TableHead>
                      <TableHead className="whitespace-nowrap">Statut</TableHead>
                      <TableHead className="whitespace-nowrap">Utilisateurs</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => {
                    const userCount = statistics?.usersByRole.find((item: any) => item.roleId === role.id)?.userCount || 0;

                    return (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{role.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {role.permissions.length} permissions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={role.isActive ? 'bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'}>
                            {role.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell>{userCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(role)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={userCount > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des permissions</CardTitle>
              <CardDescription>
                Vue d'ensemble de toutes les permissions disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupedPermissions.map(group => (
                  <div key={group.category}>
                    <h3 className="text-lg font-semibold mb-3">{group.label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {group.permissions.map(permission => (
                        <div key={permission.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{permission.name}</h4>
                            <Badge variant="outline">{permission.resource}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs par rôle</CardTitle>
              <CardDescription>
                Distribution des utilisateurs selon leurs rôles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics?.usersByRole.map((item: any) => (
                  <div key={item.roleId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{item.roleName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.userCount} utilisateur{item.userCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-2">
                        {Array.from({ length: Math.min(item.userCount, 5) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center"
                          >
                            <span className="text-xs font-medium">
                              {String.fromCharCode(65 + i)}
                            </span>
                          </div>
                        ))}
                        {item.userCount > 5 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-medium">+{item.userCount - 5}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rôles les plus utilisés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics?.usersByRole
                    .sort((a: any, b: any) => b.userCount - a.userCount)
                    .map((item: any, index: number) => (
                      <div key={item.roleId} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span>{item.roleName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(item.userCount / statistics.usersByRole.reduce((sum: number, i: any) => sum + i.userCount, 0)) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground min-w-[3rem]">
                            {item.userCount} users
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution des permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permissionCategories.map(category => {
                    const permissionCount = permissions.filter(p => p.category === category.category).length;
                    const percentage = (permissionCount / permissions.length * 100).toFixed(1);

                    return (
                      <div key={category.category} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <span>{category.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground min-w-[3rem]">
                            {permissionCount} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="responsive-modal-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Mettez à jour le rôle et ses permissions
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role-name">Nom du rôle</Label>
                  <Input
                    id="edit-role-name"
                    value={editRole.name}
                    onChange={(e) => setEditRole(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role-description">Description</Label>
                  <Input
                    id="edit-role-description"
                    value={editRole.description}
                    onChange={(e) => setEditRole(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="space-y-4 max-h-64 overflow-y-auto mt-2">
                  {groupedPermissions.map(group => (
                    <div key={group.category}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {group.label}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {group.permissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={editRole.permissionIds.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id, true)}
                            />
                            <Label
                              htmlFor={`edit-${permission.id}`}
                              className="text-sm cursor-pointer"
                              title={permission.description}
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRole}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}