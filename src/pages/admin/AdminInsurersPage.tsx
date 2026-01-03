import React, { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { AdminBreadcrumb } from '@/components/common/BreadcrumbRenderer'
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

const AdminInsurersPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null)
  const [viewingInsurer, setViewingInsurer] = useState<Insurer | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  // React Query hooks
  const { data: insurers = [], isLoading, error, refetch } = useInsurers()
  const { data: stats } = useInsurerStats()
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

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Total Assureurs</p>
                  <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {stats.total}
                  </p>
                </div>
                <Building className='h-8 w-8 text-blue-600 dark:text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Actifs</p>
                  <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                    {stats.active}
                  </p>
                </div>
                <Shield className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>En attente</p>
                  <p className='text-2xl font-bold text-yellow-600 dark:text-yellow-400'>
                    {stats.pending}
                  </p>
                </div>
                <Clock className='h-8 w-8 text-yellow-600 dark:text-yellow-400' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>Taux Conversion</p>
                  <p className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                    {stats.avgConversionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className='h-8 w-8 text-purple-600 dark:text-purple-400' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <CardTitle>Liste des Assureurs</CardTitle>
            {selectedInsurers.length > 0 && (
              <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                <span className='text-sm text-muted-foreground'>
                  {selectedInsurers.length} sélectionnés
                </span>
                <Button variant='outline' size='sm' onClick={handleBulkApprove}>
                  <CheckCircle className='h-3 w-3 mr-2' />
                  Approuver
                </Button>
              </div>
            )}
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4' />
                <Input
                  placeholder='Rechercher par nom, email...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-40'>
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
            <Button variant='outline' onClick={handleSearch} disabled={searchInsurers.isPending}>
              {searchInsurers.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Filter className='h-4 w-4' />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600 dark:text-blue-400' />
              <span className='ml-2'>Chargement des assureurs...</span>
            </div>
          ) : (
            <div className='responsive-table-wrapper'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-12'>
                      <input
                        type='checkbox'
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInsurers(filteredInsurers.map((i) => i.id))
                          } else {
                            setSelectedInsurers([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Assureur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInsurers.map((insurer) => (
                    <TableRow
                      key={insurer.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    >
                      <TableCell>
                        <input
                          type='checkbox'
                          checked={selectedInsurers.includes(insurer.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInsurers([...selectedInsurers, insurer.id])
                            } else {
                              setSelectedInsurers(
                                selectedInsurers.filter((id) => id !== insurer.id)
                              )
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-3'>
                          <Avatar>
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${insurer.companyName}`}
                            />
                            <AvatarFallback>
                              {insurer.companyName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>{insurer.companyName}</div>
                            <div className='text-sm text-gray-500 dark:text-gray-400'>
                              {insurer.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          {insurer.phone && (
                            <div className='flex items-center space-x-2 text-sm'>
                              <Phone className='h-3 w-3 text-gray-400' />
                              <span>{insurer.phone}</span>
                            </div>
                          )}
                          {insurer.website && (
                            <div className='flex items-center space-x-2 text-sm'>
                              <Car className='h-3 w-3 text-gray-400' />
                              <span className='text-blue-600 dark:text-blue-400'>
                                {insurer.website}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(insurer.status)}</TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          <div className='font-medium'>{insurer.quotesCount} devis</div>
                          <div className='text-gray-500'>{insurer.offersCount} offres</div>
                          <div className='text-green-600'>
                            {insurer.conversionRate.toFixed(1)}% conversion
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {new Date(insurer.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col sm:flex-row gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setViewingInsurer(insurer)}
                          >
                            <Eye className='h-3 w-3' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setEditingInsurer(insurer)}
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          {insurer.status === 'pending' && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleApproveInsurer(insurer.id)}
                              disabled={approveInsurer.isPending}
                            >
                              {approveInsurer.isPending ? (
                                <Loader2 className='h-3 w-3 animate-spin' />
                              ) : (
                                <CheckCircle className='h-3 w-3' />
                              )}
                            </Button>
                          )}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setEditingInsurer(insurer)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${insurer.companyName}`}
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
