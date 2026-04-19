import React, { useState, useEffect, useCallback } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'
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
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Ban,
  MoreHorizontal,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  FileCheck,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'
import { adminSupervisionApi } from '@/api/services/adminSupervisionApi'
import type {
  User,
  Insurer,
  Offer,
  SupervisionStats,
  KPI,
} from '@/api/services/adminSupervisionApi'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-xs mt-1">
                <TrendingUp className={`h-3 w-3 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserCardProps {
  user: User
  onToggleStatus: (userId: string) => void
}

const UserCard: React.FC<UserCardProps> = ({ user, onToggleStatus }) => {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
              {user.status === 'active' ? (
                <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
              ) : (
                <Ban className="h-3 w-3 text-red-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {user.role === 'ADMIN' ? 'Admin' : user.role === 'INSURER' ? 'Assureur' : 'Utilisateur'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {user.createdAt}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log('View user', user.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Edit user', user.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(user.id)}>
                {user.status === 'active' ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

interface InsurerCardProps {
  insurer: Insurer
  onApprove: (insurerId: string) => void
}

const InsurerCard: React.FC<InsurerCardProps> = ({ insurer, onApprove }) => {
  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${
      insurer.status === 'pending' ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">{insurer.name}</p>
              {insurer.status === 'pending' && (
                <AlertCircle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{insurer.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{insurer.offersCount}</span>
                <span className="text-muted-foreground">offres</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{insurer.conversionRate}%</span>
                <span className="text-muted-foreground">conv.</span>
              </div>
            </div>
            {insurer.status === 'pending' && (
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={() => onApprove(insurer.id)}
              >
                <ShieldCheck className="h-3 w-3 mr-1" />
                Approuver
              </Button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Voir offres
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

interface OfferCardProps {
  offer: Offer
  onToggleStatus: (offerId: string) => void
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onToggleStatus }) => {
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate mb-1">{offer.title}</p>
            <p className="text-xs text-muted-foreground truncate">{offer.insurer}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-xs">
                <span className="font-medium">{offer.price.toLocaleString()} FCFA</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {offer.status === 'active' ? 'Actif' : offer.status === 'inactive' ? 'Inactif' : 'En attente'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{offer.clicks} clics</span>
              <span>•</span>
              <span>{offer.conversions} conversions</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleStatus(offer.id)}>
                {offer.status === 'active' ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export const AdminSupervisionPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'insurers' | 'offers'>('overview')

  const [users, setUsers] = useState<User[]>([])
  const [insurers, setInsurers] = useState<Insurer[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [stats, setStats] = useState<SupervisionStats | null>(null)
  const [kpis, setKpis] = useState<KPI[]>([])

  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const { isLoading: authLoading, isAuthenticated, user } = useAuth()
  const canLoadData = !authLoading && isAuthenticated && user?.role === 'ADMIN'

  const loadData = useCallback(async () => {
    try {
      logger.debug('AdminSupervisionPage.loadData:start', {
        role: user?.role,
        canLoadData,
      })
      setLoading(true)
      const [usersResponse, insurersResponse, offersResponse, statsResponse, kpisResponse] =
        await Promise.all([
          adminSupervisionApi.getUsers(),
          adminSupervisionApi.getInsurers(),
          adminSupervisionApi.getOffers(),
          adminSupervisionApi.getSupervisionStats(),
          adminSupervisionApi.getKPIs(),
        ])

      if (usersResponse.success) {
        setUsers(usersResponse.data?.data || [])
      }
      if (insurersResponse.success) {
        setInsurers(insurersResponse.data?.data || [])
      }
      if (offersResponse.success) {
        setOffers(offersResponse.data?.data || [])
      }
      if (statsResponse.success) {
        setStats(statsResponse.data || null)
      }
      if (kpisResponse.success) {
        setKpis(kpisResponse.data || [])
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des données:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user?.role, canLoadData])

  useEffect(() => {
    if (canLoadData) {
      loadData()
    }
  }, [canLoadData, loadData])

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const response = await adminSupervisionApi.exportData({
        entityType: 'users',
        format: 'csv',
        filters: {
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : (statusFilter as 'active' | 'inactive' | 'pending'),
          role: roleFilter === 'all' ? undefined : (roleFilter as 'USER' | 'INSURER' | 'ADMIN'),
        },
      })

      if (response.success && response.data?.downloadUrl) {
        const link = document.createElement('a')
        link.href = response.data.downloadUrl
        link.download = 'supervision_export.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Export réussi')
      }
    } catch (error) {
      logger.error("Erreur lors de l'export:", error)
      toast.error("Erreur lors de l'export")
    } finally {
      setExportLoading(false)
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const response = await adminSupervisionApi.toggleUserStatus(userId)
      if (response.success) {
        toast.success("Statut de l'utilisateur mis à jour")
        loadData()
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const handleApproveInsurer = async (insurerId: string) => {
    try {
      const response = await adminSupervisionApi.approveInsurer(insurerId)
      if (response.success) {
        toast.success('Assureur approuvé avec succès')
        loadData()
      }
    } catch (error) {
      logger.error("Erreur lors de l'approbation:", error)
      toast.error("Erreur lors de l'approbation")
    }
  }

  const handleToggleOfferStatus = async (offerId: string) => {
    try {
      const response = await adminSupervisionApi.toggleOfferStatus(offerId)
      if (response.success) {
        toast.success("Statut de l'offre mis à jour")
        loadData()
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  // Filter data
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const filteredInsurers = insurers.filter(insurer => {
    const matchesSearch = `${insurer.name} ${insurer.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || insurer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = `${offer.title} ${offer.insurer}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Stats */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Supervision</h2>
            <p className="text-muted-foreground">Vue d'ensemble de la plateforme</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Export...' : 'Exporter'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Utilisateurs"
            value={stats?.users?.total?.toLocaleString() || 0}
            subtitle={`+${stats?.users?.new || 0} ce mois`}
            icon={Users}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Assureurs"
            value={stats?.insurers?.total || 0}
            subtitle={`${stats?.insurers?.pending || 0} en attente`}
            icon={Shield}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            title="Offres"
            value={stats?.offers?.total || 0}
            subtitle={`${stats?.offers?.active || 0} actives`}
            icon={FileText}
            color="text-purple-600 dark:text-purple-400"
          />
          <StatCard
            title="Conversion"
            value={`${stats?.quotes?.conversionRate || 0}%`}
            subtitle={`${stats?.quotes?.converted || 0} conversions`}
            icon={TrendingUp}
            color="text-orange-600 dark:text-orange-400"
          />
        </div>
      </section>

      {/* Alert Banner - Pending Insurers */}
      {stats?.insurers?.pending > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {stats.insurers.pending} assureur{stats.insurers.pending > 1 ? 's' : ''} en attente de validation
                </p>
                <p className="text-xs text-muted-foreground">
                  Approuvez les demandes pour activer les comptes
                </p>
              </div>
              <Button size="sm" onClick={() => setActiveTab('insurers')}>
                Voir
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="users">
            Utilisateurs
            <Badge variant="secondary" className="ml-2">{filteredUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="insurers">
            Assureurs
            {stats?.insurers?.pending > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.insurers.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="offers">Offres</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <Card>
            <CardHeader>
              <CardTitle>Indicateurs de Performance</CardTitle>
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
                    <div className="text-2xl font-bold">{kpi.value}</div>
                    <div className="text-xs text-muted-foreground">Cible: {kpi.target}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.role === 'ADMIN' ? 'Admin' : user.role === 'INSURER' ? 'Assureur' : 'User'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-xs">Utilisateurs</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs">Assureurs</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xs">Offres</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto flex-col py-3 gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Analytics</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher..."
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
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map(user => (
                    <UserCard key={user.id} user={user} onToggleStatus={handleToggleUserStatus} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurers Tab */}
        <TabsContent value="insurers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assureurs ({filteredInsurers.length})</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredInsurers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun assureur trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInsurers.map(insurer => (
                    <InsurerCard key={insurer.id} insurer={insurer} onApprove={handleApproveInsurer} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Offres ({filteredOffers.length})</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredOffers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune offre trouvée</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOffers.map(offer => (
                    <OfferCard key={offer.id} offer={offer} onToggleStatus={handleToggleOfferStatus} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSupervisionPage
