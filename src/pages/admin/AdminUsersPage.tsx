import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/contexts/AuthContext'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Search,
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
  Loader2,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  FileText,
  TrendingUp,
} from 'lucide-react'
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
  type UpdateUserRequest,
} from '@/features/admin/services/userService'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
  trend?: number
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserGridCardProps {
  user: User
  isSelected: boolean
  onSelect: (userId: string) => void
  onView: (user: User) => void
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  isPending?: boolean
}

const UserGridCard: React.FC<UserGridCardProps> = ({
  user,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  isPending = false,
}) => {
  const getInitials = () => {
    if (user.role === 'INSURER') {
      return user.companyName?.substring(0, 2).toUpperCase() || 'EN'
    }
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

  const getDisplayName = () => {
    if (user.role === 'INSURER') {
      return user.companyName || 'Entreprise non spécifiée'
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nom non spécifié'
  }

  const getRoleBadge = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
            Admin
          </Badge>
        )
      case 'INSURER':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
            Assureur
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
            User
          </Badge>
        )
    }
  }

  const getStatusBadge = () => {
    switch (user.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
            Actif
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
            Inactif
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">
            En attente
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">
            Suspendu
          </Badge>
        )
      default:
        return <Badge>{user.status}</Badge>
    }
  }

  const getStatusColor = () => {
    switch (user.status) {
      case 'active': return 'text-green-600 dark:text-green-400'
      case 'inactive': return 'text-gray-600 dark:text-gray-400'
      case 'pending': return 'text-yellow-600 dark:text-yellow-400'
      case 'suspended': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect(user.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(user.id)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarFallback className={`${
              user.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                : user.role === 'INSURER'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
            } font-semibold`}>
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className="font-medium text-sm truncate">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {getRoleBadge()}
                {user.status === 'active' ? (
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                ) : user.status === 'suspended' ? (
                  <Ban className="h-3 w-3 text-red-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{user.quotesCount} devis</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{user.conversionRate}% conv.</span>
              </div>
            </div>

            {/* Contact Info */}
            {(user.phone || user.address) && (
              <div className="space-y-1 mb-2">
                {user.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{user.address}</span>
                  </div>
                )}
              </div>
            )}

            {/* Activity */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Dernière connexion: {user.lastLogin}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(user)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onToggleStatus(user)}
                  className={user.status === 'active' ? 'text-red-600' : 'text-green-600'}
                >
                  {user.status === 'active' ? (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Suspendre
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserListItemProps {
  user: User
  isSelected: boolean
  onSelect: (userId: string) => void
  onView: (user: User) => void
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  isPending?: boolean
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  isPending = false,
}) => {
  const getInitials = () => {
    if (user.role === 'INSURER') {
      return user.companyName?.substring(0, 2).toUpperCase() || 'EN'
    }
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

  const getDisplayName = () => {
    if (user.role === 'INSURER') {
      return user.companyName || 'Entreprise non spécifiée'
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nom non spécifié'
  }

  const getRoleBadge = () => {
    switch (user.role) {
      case 'ADMIN':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
            Admin
          </Badge>
        )
      case 'INSURER':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
            Assureur
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
            User
          </Badge>
        )
    }
  }

  const getStatusBadge = () => {
    switch (user.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
            Actif
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400">
            Inactif
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">
            En attente
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400">
            Suspendu
          </Badge>
        )
      default:
        return <Badge>{user.status}</Badge>
    }
  }

  return (
    <div className={`border rounded-lg p-4 hover:bg-accent/50 transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user.id)}
          className="h-4 w-4 mt-1 rounded border-gray-300"
        />

        {/* Avatar */}
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarFallback className={`${
            user.role === 'ADMIN'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
              : user.role === 'INSURER'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
          } font-semibold`}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{getDisplayName()}</p>
                {getRoleBadge()}
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            {/* Actions for desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(user)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(user)}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user.status === 'active' ? (
                  <Ban className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{user.quotesCount} devis</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{user.conversionRate}% conversion</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{user.lastLogin}</span>
            </div>
          </div>

          {/* Contact info for desktop */}
          <div className="hidden lg:flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
            {user.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{user.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile actions */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(user)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                {user.status === 'active' ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Suspendre
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

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
    status: user?.status || 'active' as 'active' | 'inactive' | 'pending' | 'suspended',
  })

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (user) {
      const updateData: UpdateUserRequest = {
        ...formData,
        id: user.id,
      }
      updateUser.mutate(updateData)
    } else {
      const createData: CreateUserRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
        status: formData.status,
      }
      createUser.mutate(createData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as 'USER' | 'INSURER' | 'ADMIN' })}
          >
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
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'pending' | 'suspended' })}
          >
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
  )
}

// User Details Component
const UserDetails: React.FC<{ user: User }> = ({ user }) => {
  const getDisplayName = () => {
    if (user.role === 'INSURER') {
      return user.companyName || 'Entreprise non spécifiée'
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nom non spécifié'
  }

  const getInitials = () => {
    if (user.role === 'INSURER' && user.companyName) {
      return user.companyName.substring(0, 2).toUpperCase()
    }
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

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
  )
}

export const AdminUsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { isLoading: authLoading, isAuthenticated, user } = useAuth()
  const shouldFetch = !authLoading && isAuthenticated && user?.role === 'ADMIN'

  const { data: users = [], isLoading: usersLoading } = useUsers(
    {
      search: searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      role: roleFilter === 'all' ? undefined : roleFilter,
    },
    shouldFetch
  )

  const { data: stats, isLoading: statsLoading } = useUserStats(shouldFetch)
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const bulkUpdateUsers = useBulkUpdateUsers()
  const exportUsers = useExportUsers()

  const handleUserAction = (action: string, userId: string) => {
    switch (action) {
      case 'activate':
      case 'suspend':
        bulkUpdateUsers.mutate({ userIds: [userId], action: action as 'activate' | 'suspend' })
        break
      case 'delete':
        deleteUser.mutate(userId)
        break
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) return
    bulkUpdateUsers.mutate({ userIds: selectedUsers, action: action as 'activate' | 'suspend' | 'delete' })
  }

  const handleExportUsers = () => {
    exportUsers.mutate({
      search: searchTerm === '' ? undefined : searchTerm,
      status: statusFilter === 'all' ? undefined : statusFilter,
      role: roleFilter === 'all' ? undefined : roleFilter,
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u.id))
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === ''
      ? true
      : `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  return (
    <div className="space-y-6 w-full">


      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un utilisateur</DialogTitle>
              </DialogHeader>
              <UserForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats?.total?.toLocaleString() || 0}
          subtitle="Utilisateurs inscrits"
          icon={Users}
          color="text-blue-600 dark:text-blue-400"
          loading={statsLoading}
        />
        <StatCard
          title="Actifs"
          value={stats?.active?.toLocaleString() || 0}
          subtitle="Utilisateurs actifs"
          icon={CheckCircle}
          color="text-green-600 dark:text-green-400"
          loading={statsLoading}
        />
        <StatCard
          title="En attente"
          value={stats?.pending?.toLocaleString() || 0}
          subtitle="En attente de validation"
          icon={Shield}
          color="text-yellow-600 dark:text-yellow-400"
          loading={statsLoading}
        />
        <StatCard
          title="Suspendus"
          value={stats?.suspended?.toLocaleString() || 0}
          subtitle="Comptes suspendus"
          icon={Ban}
          color="text-red-600 dark:text-red-400"
          loading={statsLoading}
        />
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="suspended">Suspendus</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="USER">Utilisateurs</SelectItem>
                    <SelectItem value="INSURER">Assureurs</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                  </SelectContent>
                </Select>
                </div>

                {/* View Toggle & Bulk Actions */}
                <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setViewMode('grid')}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setViewMode('list')}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </Button>
                </div>

                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                    </span>
                    <Select onValueChange={(value) => handleBulkAction(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activate">Activer</SelectItem>
                        <SelectItem value="suspend">Suspendre</SelectItem>
                        <SelectItem value="delete">Supprimer</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
              </p>
              {selectedUsers.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                  Effacer la sélection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Display */}
      {usersLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
              <p className="text-sm text-muted-foreground mt-1">
                Essayez d'ajuster les filtres de recherche
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UserGridCard
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={(userId) => {
                    if (selectedUsers.includes(userId)) {
                      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
                    } else {
                      setSelectedUsers([...selectedUsers, userId])
                    }
                  }}
                  onView={(user) => {
                    setSelectedUser(user)
                    setShowViewDialog(true)
                  }}
                  onEdit={(user) => {
                    setSelectedUser(user)
                    setShowEditDialog(true)
                  }}
                  onToggleStatus={(user) => handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id)}
                  onDelete={(user) => {
                    setSelectedUser(user)
                    setShowDeleteDialog(true)
                  }}
                  isPending={bulkUpdateUsers.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-4 border-b">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && selectedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground">
                    Tout sélectionner
                  </span>
                </div>
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <UserListItem
                      key={user.id}
                      user={user}
                      isSelected={selectedUsers.includes(user.id)}
                      onSelect={(userId) => {
                        if (selectedUsers.includes(userId)) {
                          setSelectedUsers(selectedUsers.filter((id) => id !== userId))
                        } else {
                          setSelectedUsers([...selectedUsers, userId])
                        }
                      }}
                      onView={(user) => {
                        setSelectedUser(user)
                        setShowViewDialog(true)
                      }}
                      onEdit={(user) => {
                        setSelectedUser(user)
                        setShowEditDialog(true)
                      }}
                      onToggleStatus={(user) => handleUserAction(user.status === 'active' ? 'suspend' : 'activate', user.id)}
                      onDelete={(user) => {
                        setSelectedUser(user)
                        setShowDeleteDialog(true)
                      }}
                      isPending={bulkUpdateUsers.isPending}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && <UserDetails user={selectedUser} />}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && <UserForm user={selectedUser} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
              ?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">Cette action est irréversible.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedUser) {
                    deleteUser.mutate(selectedUser.id)
                    setShowDeleteDialog(false)
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
  )
}

export default AdminUsersPage
