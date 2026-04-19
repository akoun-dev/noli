import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Phone,
  MapPin,
  Calendar,
  Building,
  Shield,
  Car,
  AlertCircle,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  TrendingUp,
  Grid3X3,
  List,
  Globe,
  Mail,
  Users,
  FileText,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminBreadcrumb } from '@/components/common/BreadcrumbRenderer'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import {
  useInsurers,
  useInsurerStats,
  useCreateInsurer,
  useUpdateInsurer,
  useDeleteInsurer,
  useApproveInsurer,
  useExportInsurers,
  useSearchInsurers,
  type Insurer,
  type InsurerFormData,
} from '@/features/admin/services/insurerService'
import { insurerLogoService } from '@/features/admin/services/insurerLogoService'
import { LogoUploader } from '@/features/admin/components/LogoUploader'

type ViewMode = 'grid' | 'list'

const AdminInsurersPage = () => {
  // Récupérer l'état d'authentification pour conditionner les requêtes
  const { isLoading: authLoading, isAuthenticated, user } = useAuth()

  // Condition pour activer les requêtes : auth terminé + utilisateur authentifié + rôle ADMIN
  const shouldFetch = !authLoading && isAuthenticated && user?.role === 'ADMIN'

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null)
  const [viewingInsurer, setViewingInsurer] = useState<Insurer | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // React Query hooks
  const { data: insurers = [], isLoading, error, refetch } = useInsurers(shouldFetch)
  const { data: stats, isLoading: statsLoading } = useInsurerStats(shouldFetch)
  const createInsurer = useCreateInsurer()
  const updateInsurer = useUpdateInsurer()
  const deleteInsurer = useDeleteInsurer()
  const approveInsurer = useApproveInsurer()
  const exportInsurers = useExportInsurers()
  const searchInsurers = useSearchInsurers()

  // Filter insurers based on search and status
  const filteredInsurers = insurers.filter((insurer) => {
    const matchesSearch =
      searchTerm === '' ||
      insurer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insurer.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || insurer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Select/Deselect individual insurer
  const handleSelectInsurer = (insurerId: string) => {
    setSelectedInsurers((prev) =>
      prev.includes(insurerId) ? prev.filter((id) => id !== insurerId) : [...prev, insurerId]
    )
  }

  // Select/Deselect all
  const handleSelectAll = () => {
    if (selectedInsurers.length === filteredInsurers.length) {
      setSelectedInsurers([])
    } else {
      setSelectedInsurers(filteredInsurers.map((i) => i.id))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className='bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'>
            Actif
          </Badge>
        )
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'>
            En attente
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className='bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'>
            Inactif
          </Badge>
        )
      case 'suspended':
        return (
          <Badge className='bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'>
            Suspendu
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleCreateInsurer = (data: InsurerFormData) => {
    setMutationError(null)
    createInsurer.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false)
        setMutationError(null)
      },
      onError: (error) => {
        setMutationError(error?.message || 'Erreur lors de la création de l\'assureur')
      },
    })
  }

  const handleUpdateInsurer = (data: InsurerFormData) => {
    if (editingInsurer) {
      setMutationError(null)
      updateInsurer.mutate(
        { id: editingInsurer.id, data },
        {
          onSuccess: () => {
            setEditingInsurer(null)
            setMutationError(null)
          },
          onError: (error) => {
            setMutationError(error?.message || 'Erreur lors de la mise à jour de l\'assureur')
          },
        }
      )
    }
  }

  const handleDeleteInsurer = () => {
    if (editingInsurer) {
      deleteInsurer.mutate(editingInsurer.id, {
        onSuccess: () => {
          setShowDeleteDialog(false)
          setEditingInsurer(null)
        },
      })
    }
  }

  const handleApproveInsurer = (id: string) => {
    approveInsurer.mutate(id)
  }

  const handleBulkApprove = () => {
    selectedInsurers.forEach((id) => {
      approveInsurer.mutate(id)
    })
    setSelectedInsurers([])
  }

  const handleExport = () => {
    exportInsurers.mutate()
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchInsurers.mutate(searchTerm, {
        onSuccess: (results) => {
          // Update local state with search results
          console.log('Search results:', results)
        },
      })
    }
  }

  if (error) {
    return (
      <div className='space-y-6 w-full'>
        <AdminBreadcrumb />
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Erreur lors du chargement des assureurs. Veuillez réessayer.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className='flex items-center gap-2'>
          <RefreshCw className='h-4 w-4' />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-6 w-full'>
      {/* Breadcrumb */}
      <AdminBreadcrumb />

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Gestion des Assureurs</h1>
          <p className='text-muted-foreground'>Gérez tous les assureurs de la plateforme</p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Button variant='outline' onClick={handleExport} disabled={exportInsurers.isPending}>
            {exportInsurers.isPending ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4 mr-2' />
            )}
            Exporter
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) setMutationError(null)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Ajouter un assureur
              </Button>
            </DialogTrigger>
            <DialogContent className='responsive-modal-lg'>
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel assureur</DialogTitle>
              </DialogHeader>
              <InsurerForm
                onSubmit={handleCreateInsurer}
                isLoading={createInsurer.isPending}
                error={mutationError}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <Skeleton className='h-12 w-12 mb-2' />
                  <Skeleton className='h-8 w-24 mb-2' />
                  <Skeleton className='h-4 w-32' />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title='Total Assureurs'
              value={stats?.total ?? 0}
              icon={Building}
              color='text-blue-600 dark:text-blue-400'
            />
            <StatCard
              title='Actifs'
              value={stats?.active ?? 0}
              icon={Shield}
              color='text-green-600 dark:text-green-400'
            />
            <StatCard
              title='En attente'
              value={stats?.pending ?? 0}
              icon={Clock}
              color='text-yellow-600 dark:text-yellow-400'
              highlight={stats && stats.pending > 0}
            />
            <StatCard
              title='Taux Conversion'
              value={`${stats?.avgConversionRate.toFixed(1) ?? 0}%`}
              icon={TrendingUp}
              color='text-purple-600 dark:text-purple-400'
            />
          </>
        )}
      </div>

      {/* Alert Banner - Pending Insurers */}
      {stats && stats.pending > 0 && (
        <Card className='border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950/20 dark:to-card'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center'>
                  <Clock className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                </div>
                <div>
                  <p className='font-semibold text-yellow-900 dark:text-yellow-100'>
                    {stats.pending} assureur{stats.pending > 1 ? 's' : ''} en attente de validation
                  </p>
                  <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                    Approuvez les demandes pour activer les comptes
                  </p>
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setStatusFilter('pending')}
                className='border-yellow-300 dark:border-yellow-700'
              >
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Section */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Rechercher par nom, email...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='active'>Actifs</SelectItem>
                <SelectItem value='pending'>En attente</SelectItem>
                <SelectItem value='inactive'>Inactifs</SelectItem>
                <SelectItem value='suspended'>Suspendus</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedInsurers.length > 0 && (
              <Button
                variant='default'
                size='sm'
                onClick={handleBulkApprove}
                className='bg-green-600 hover:bg-green-700'
              >
                <CheckCircle className='h-4 w-4 mr-2' />
                Approuver ({selectedInsurers.length})
              </Button>
            )}

            {/* View Toggle */}
            <div className='flex bg-muted rounded-lg p-1'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('list')}
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Selection Info */}
          {selectedInsurers.length > 0 && (
            <div className='mt-3 flex items-center gap-2 text-sm text-muted-foreground'>
              <Checkbox
                checked={selectedInsurers.length === filteredInsurers.length}
                onCheckedChange={handleSelectAll}
              />
              <span>
                {selectedInsurers.length} sur {filteredInsurers.length} sélectionné(s)
              </span>
              <Button
                variant='link'
                size='sm'
                className='h-auto p-0 ml-auto'
                onClick={() => setSelectedInsurers([])}
              >
                Désélectionner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurers Grid/List */}
      {isLoading ? (
        <div className={`grid gap-4 ${
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        }`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className='p-4'>
                <div className='flex items-start gap-4'>
                  <Skeleton className='h-16 w-16 rounded-lg' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-5 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='h-4 w-1/3' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInsurers.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <Building className='h-16 w-16 mx-auto text-muted-foreground/30 mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Aucun assureur trouvé</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              {searchTerm || statusFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter un nouvel assureur'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Ajouter un assureur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredInsurers.map((insurer) => (
            <InsurerGridCard
              key={insurer.id}
              insurer={insurer}
              isSelected={selectedInsurers.includes(insurer.id)}
              onSelect={handleSelectInsurer}
              onView={setViewingInsurer}
              onEdit={setEditingInsurer}
              onApprove={handleApproveInsurer}
              onDelete={(ins) => {
                setEditingInsurer(ins)
                setShowDeleteDialog(true)
              }}
              isApproving={approveInsurer.isPending}
            />
          ))}
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredInsurers.map((insurer) => (
            <InsurerListItem
              key={insurer.id}
              insurer={insurer}
              isSelected={selectedInsurers.includes(insurer.id)}
              onSelect={handleSelectInsurer}
              onView={setViewingInsurer}
              onEdit={setEditingInsurer}
              onApprove={handleApproveInsurer}
              onDelete={(ins) => {
                setEditingInsurer(ins)
                setShowDeleteDialog(true)
              }}
              isApproving={approveInsurer.isPending}
            />
          ))}
        </div>
      )}

      {/* View Insurer Dialog */}
      <Dialog open={!!viewingInsurer} onOpenChange={() => setViewingInsurer(null)}>
        <DialogContent className='responsive-modal-lg'>
          <DialogHeader>
            <DialogTitle>Détails de l'assureur</DialogTitle>
          </DialogHeader>
          {viewingInsurer && <InsurerDetails insurer={viewingInsurer} />}
        </DialogContent>
      </Dialog>

      {/* Edit Insurer Dialog */}
      <Dialog
        open={!!editingInsurer && !showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEditingInsurer(null)
            setMutationError(null)
          }
        }}
      >
        <DialogContent className='responsive-modal-lg'>
          <DialogHeader>
            <DialogTitle>Modifier l'assureur</DialogTitle>
          </DialogHeader>
          {editingInsurer && (
            <InsurerForm
              insurer={editingInsurer}
              onSubmit={handleUpdateInsurer}
              isLoading={updateInsurer.isPending}
              onCancel={() => setEditingInsurer(null)}
              error={mutationError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <p>
              Êtes-vous sûr de vouloir supprimer l'assureur{' '}
              <strong>{editingInsurer?.companyName}</strong> ?
            </p>
            <p className='text-sm text-red-600 dark:text-red-400'>Cette action est irréversible.</p>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button
                variant='destructive'
                onClick={handleDeleteInsurer}
                disabled={deleteInsurer.isPending}
              >
                {deleteInsurer.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// StatCard Component
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
  highlight?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, highlight }) => {
  return (
    <Card className={`overflow-hidden hover:shadow-md transition-all duration-200 ${
      highlight ? 'ring-2 ring-yellow-400' : ''
    }`}>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <p className='text-sm font-medium text-muted-foreground mb-1'>{title}</p>
            <p className='text-3xl font-bold tracking-tight'>{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-lg bg-opacity-10 flex items-center justify-center ${color.replace('text-', 'bg-').replace('dark:', 'dark:bg-')}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// InsurerGridCard Component
interface InsurerGridCardProps {
  insurer: Insurer
  isSelected: boolean
  onSelect: (id: string) => void
  onView: (insurer: Insurer) => void
  onEdit: (insurer: Insurer) => void
  onApprove: (id: string) => void
  onDelete: (insurer: Insurer) => void
  isApproving: boolean
}

const InsurerGridCard: React.FC<InsurerGridCardProps> = ({
  insurer,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onApprove,
  onDelete,
  isApproving,
}) => {
  const getInitials = () => {
    return insurer.companyName.substring(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'>Actif</Badge>
      case 'pending':
        return <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'>En attente</Badge>
      case 'inactive':
        return <Badge className='bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'>Inactif</Badge>
      case 'suspended':
        return <Badge className='bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'>Suspendu</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${insurer.status === 'pending' ? 'border-yellow-300 dark:border-yellow-700' : ''}`}
      onClick={() => onView(insurer)}
    >
      <CardContent className='p-4'>
        {/* Header with logo, checkbox, and menu */}
        <div className='flex items-start gap-3 mb-4'>
          {/* Logo/Avatar */}
          <Avatar className='h-14 w-14 flex-shrink-0'>
            <AvatarImage src={insurer.logoUrl || undefined} />
            <AvatarFallback className='bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'>
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-base truncate'>{insurer.companyName}</h3>
                <p className='text-sm text-muted-foreground truncate'>{insurer.email}</p>
              </div>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(insurer.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onView(insurer)}>
                <Eye className='h-4 w-4 mr-2' />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(insurer)}>
                <Edit className='h-4 w-4 mr-2' />
                Modifier
              </DropdownMenuItem>
              {insurer.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onApprove(insurer.id)}
                    disabled={isApproving}
                    className='text-green-600'
                  >
                    {isApproving ? (
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    ) : (
                      <CheckCircle className='h-4 w-4 mr-2' />
                    )}
                    Approuver
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(insurer)}
                className='text-red-600'
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className='mb-3'>{getStatusBadge(insurer.status)}</div>

        {/* Contact Info */}
        <div className='space-y-2 mb-3 text-sm'>
          {insurer.phone && (
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Phone className='h-3.5 w-3.5 flex-shrink-0' />
              <span className='truncate'>{insurer.phone}</span>
            </div>
          )}
          {insurer.website && (
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Globe className='h-3.5 w-3.5 flex-shrink-0' />
              <span className='truncate text-blue-600 dark:text-blue-400'>{insurer.website}</span>
            </div>
          )}
          {insurer.address && (
            <div className='flex items-center gap-2 text-muted-foreground'>
              <MapPin className='h-3.5 w-3.5 flex-shrink-0' />
              <span className='truncate'>{insurer.address}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className='grid grid-cols-3 gap-2 pt-3 border-t'>
          <div className='text-center'>
            <FileText className='h-4 w-4 mx-auto mb-1 text-blue-600' />
            <p className='text-lg font-semibold'>{insurer.quotesCount}</p>
            <p className='text-xs text-muted-foreground'>Devis</p>
          </div>
          <div className='text-center'>
            <Shield className='h-4 w-4 mx-auto mb-1 text-green-600' />
            <p className='text-lg font-semibold'>{insurer.offersCount}</p>
            <p className='text-xs text-muted-foreground'>Offres</p>
          </div>
          <div className='text-center'>
            <TrendingUp className='h-4 w-4 mx-auto mb-1 text-purple-600' />
            <p className='text-lg font-semibold'>{insurer.conversionRate.toFixed(1)}%</p>
            <p className='text-xs text-muted-foreground'>Conversion</p>
          </div>
        </div>

        {/* Created Date */}
        <div className='mt-3 pt-3 border-t text-xs text-muted-foreground'>
          <Calendar className='h-3 w-3 inline mr-1' />
          {new Date(insurer.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  )
}

// InsurerListItem Component (List View)
const InsurerListItem: React.FC<InsurerGridCardProps> = ({
  insurer,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onApprove,
  onDelete,
  isApproving,
}) => {
  const getInitials = () => {
    return insurer.companyName.substring(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'>Actif</Badge>
      case 'pending':
        return <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'>En attente</Badge>
      case 'inactive':
        return <Badge className='bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'>Inactif</Badge>
      case 'suspended':
        return <Badge className='bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'>Suspendu</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${insurer.status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}`}
    >
      <CardContent className='p-4'>
        <div className='flex items-center gap-4'>
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(insurer.id)}
          />

          {/* Logo/Avatar */}
          <Avatar className='h-12 w-12 flex-shrink-0'>
            <AvatarImage src={insurer.logoUrl || undefined} />
            <AvatarFallback className='bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'>
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {/* Company Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='font-semibold truncate'>{insurer.companyName}</h3>
              {getStatusBadge(insurer.status)}
            </div>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              {insurer.phone && (
                <div className='flex items-center gap-1'>
                  <Phone className='h-3.5 w-3.5' />
                  <span>{insurer.phone}</span>
                </div>
              )}
              <div className='flex items-center gap-1'>
                <Mail className='h-3.5 w-3.5' />
                <span className='truncate'>{insurer.email}</span>
              </div>
              {insurer.website && (
                <div className='flex items-center gap-1'>
                  <Globe className='h-3.5 w-3.5' />
                  <span className='truncate text-blue-600 dark:text-blue-400'>{insurer.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className='hidden md:flex items-center gap-6 text-sm'>
            <div className='text-center'>
              <p className='font-semibold'>{insurer.quotesCount}</p>
              <p className='text-xs text-muted-foreground'>Devis</p>
            </div>
            <div className='text-center'>
              <p className='font-semibold'>{insurer.offersCount}</p>
              <p className='text-xs text-muted-foreground'>Offres</p>
            </div>
            <div className='text-center'>
              <p className='font-semibold text-purple-600'>{insurer.conversionRate.toFixed(1)}%</p>
              <p className='text-xs text-muted-foreground'>Conversion</p>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            {insurer.status === 'pending' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onApprove(insurer.id)}
                disabled={isApproving}
                className='text-green-600 border-green-600 hover:bg-green-50'
              >
                {isApproving ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <CheckCircle className='h-4 w-4' />
                )}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onView(insurer)}>
                  <Eye className='h-4 w-4 mr-2' />
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(insurer)}>
                  <Edit className='h-4 w-4 mr-2' />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(insurer)}
                  className='text-red-600'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
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

// Insurer Form Component
const InsurerForm: React.FC<{
  insurer?: Insurer
  onSubmit: (data: InsurerFormData) => void
  isLoading?: boolean
  onCancel?: () => void
  error?: string | null
}> = ({ insurer, onSubmit, isLoading, onCancel, error }) => {
  const [formData, setFormData] = useState<InsurerFormData>({
    companyName: insurer?.companyName || '',
    email: insurer?.email || '',
    phone: insurer?.phone || '',
    address: insurer?.address || '',
    description: insurer?.description || '',
    website: insurer?.website || '',
    licenseNumber: insurer?.licenseNumber || '',
    status: insurer?.status || 'pending',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Logo Uploader - affiché seulement lors de l'édition */}
      {insurer && (
        <LogoUploader
          insurerId={insurer.id}
          currentLogo={insurer.logoUrl}
          insurerName={formData.companyName}
          onLogoUploaded={(url) => {
            // Le logo sera mis à jour via l'API
            // Rafraîchir les données après l'upload
            window.location.reload()
          }}
          onLogoDeleted={() => {
            // Le logo sera supprimé via l'API
            // Rafraîchir les données après la suppression
            window.location.reload()
          }}
        />
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='companyName'>Nom de l'entreprise *</Label>
          <Input
            id='companyName'
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor='email'>Email *</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='phone'>Téléphone</Label>
          <Input
            id='phone'
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor='website'>Site web</Label>
          <Input
            id='website'
            type='url'
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor='address'>Adresse</Label>
        <Textarea
          id='address'
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor='licenseNumber'>Numéro de licence</Label>
        <Input
          id='licenseNumber'
          value={formData.licenseNumber}
          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor='status'>Statut</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as InsurerFormData['status'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='pending'>En attente</SelectItem>
            <SelectItem value='active'>Actif</SelectItem>
            <SelectItem value='inactive'>Inactif</SelectItem>
            <SelectItem value='suspended'>Suspendu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col sm:flex-row sm:justify-end gap-2'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type='submit' disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              {insurer ? 'Mise à jour...' : 'Création...'}
            </>
          ) : insurer ? (
            'Mettre à jour'
          ) : (
            'Créer'
          )}
        </Button>
      </div>
    </form>
  )
}

// Insurer Details Component
const InsurerDetails: React.FC<{ insurer: Insurer }> = ({ insurer }) => {
  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4'>
        <Avatar className='w-16 h-16'>
          <AvatarImage
            src={insurer.logoUrl || undefined}
          />
          <AvatarFallback className='text-lg'>
            {insurer.companyName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className='text-lg font-semibold'>{insurer.companyName}</h3>
          <p className='text-gray-600 dark:text-gray-400'>{insurer.email}</p>
          {getStatusBadge(insurer.status)}
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            Date de création
          </Label>
          <div className='mt-1'>{new Date(insurer.createdAt).toLocaleDateString('fr-FR')}</div>
        </div>
        <div>
          <Label className='text-sm font-medium text-gray-600 dark:text-gray-400'>Téléphone</Label>
          <div className='mt-1'>{insurer.phone || 'Non renseigné'}</div>
        </div>
        <div>
          <Label className='text-sm font-medium text-gray-600 dark:text-gray-400'>Site web</Label>
          <div className='mt-1'>
            {insurer.website ? (
              <a
                href={insurer.website}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                {insurer.website}
              </a>
            ) : (
              'Non renseigné'
            )}
          </div>
        </div>
        <div>
          <Label className='text-sm font-medium text-gray-600 dark:text-gray-400'>Licence</Label>
          <div className='mt-1'>{insurer.licenseNumber || 'Non renseigné'}</div>
        </div>
      </div>

      {insurer.address && (
        <div>
          <Label className='text-sm font-medium text-gray-600 dark:text-gray-400'>Adresse</Label>
          <div className='mt-1'>{insurer.address}</div>
        </div>
      )}

      {insurer.description && (
        <div>
          <Label className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            Description
          </Label>
          <div className='mt-1'>{insurer.description}</div>
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
          <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
            {insurer.quotesCount}
          </div>
          <div className='text-sm text-blue-600 dark:text-blue-400'>Devis créés</div>
        </div>
        <div className='p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
          <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
            {insurer.offersCount}
          </div>
          <div className='text-sm text-green-600 dark:text-green-400'>Offres proposées</div>
        </div>
        <div className='p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
          <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
            {insurer.conversionRate.toFixed(1)}%
          </div>
          <div className='text-sm text-purple-600 dark:text-purple-400'>Taux de conversion</div>
        </div>
      </div>
    </div>
  )
}

// Helper function moved outside component
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <Badge className='bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'>
          Actif
        </Badge>
      )
    case 'pending':
      return (
        <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'>
          En attente
        </Badge>
      )
    case 'inactive':
      return (
        <Badge className='bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'>
          Inactif
        </Badge>
      )
    case 'suspended':
      return (
        <Badge className='bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'>
          Suspendu
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}

export default AdminInsurersPage
