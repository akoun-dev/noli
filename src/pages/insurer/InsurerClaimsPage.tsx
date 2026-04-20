import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  Clock,
  CheckCircle,
  DollarSign,
  FileText,
  Calendar,
  Search,
  LayoutGrid,
  List,
  Package,
  Activity,
  TrendingUp,
  X,
  FileCheck,
  AlertTriangle,
  Shield,
} from 'lucide-react'
import { claimService } from '@/services/claimService'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

interface Claim {
  id: string
  claim_number: string
  title: string
  incident_date: string
  estimated_amount?: number
  status: string
  description?: string
}

const STATUS_COLORS = {
  'SUBMITTED': 'bg-blue-100 text-blue-700 border-blue-200',
  'UNDER_REVIEW': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'APPROVED': 'bg-green-100 text-green-700 border-green-200',
  'REJECTED': 'bg-red-100 text-red-700 border-red-200',
  'PAID': 'bg-purple-100 text-purple-700 border-purple-200',
}

const STATUS_ICONS = {
  'SUBMITTED': <FileText className="h-4 w-4" />,
  'UNDER_REVIEW': <Clock className="h-4 w-4" />,
  'APPROVED': <CheckCircle className="h-4 w-4" />,
  'REJECTED': <AlertTriangle className="h-4 w-4" />,
  'PAID': <DollarSign className="h-4 w-4" />,
}

const STATUS_LABELS = {
  'SUBMITTED': 'Soumis',
  'UNDER_REVIEW': 'En cours',
  'APPROVED': 'Approuvé',
  'REJECTED': 'Rejeté',
  'PAID': 'Payé',
}

export const InsurerClaimsPage: React.FC = () => {
  const navigate = useNavigate()
  const [insurerId, setInsurerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'>('all')
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)

  useEffect(() => {
    loadInsurerId()
  }, [])

  const loadInsurerId = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_insurer_id')
      if (error || !data || data.length === 0) {
        logger.error('No insurer account found')
        navigate('/assureur/configuration', { replace: true })
        return
      }
      setInsurerId(data[0].insurer_id)
    } catch (error) {
      logger.error('Error loading insurer ID:', error)
    } finally {
      setLoading(false)
    }
  }

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['insurer-claims', insurerId],
    queryFn: () => claimService.getMyClaims(insurerId || ''),
    enabled: !!insurerId,
  })

  const filteredClaims = claims.filter((claim: Claim) => {
    const matchesSearch = claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || claim.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: claims.length,
    submitted: claims.filter((c: Claim) => c.status === 'SUBMITTED').length,
    underReview: claims.filter((c: Claim) => c.status === 'UNDER_REVIEW').length,
    approved: claims.filter((c: Claim) => c.status === 'APPROVED').length,
    paid: claims.filter((c: Claim) => c.status === 'PAID').length,
    totalAmount: claims.reduce((sum: number, c: Claim) => sum + (c.estimated_amount || 0), 0),
  }

  const ClaimCard = ({ claim }: { claim: Claim }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={() => setSelectedClaim(claim)}>
            <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              {claim.claim_number}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">{claim.title}</CardDescription>
          </div>
          <Badge className={cn('shrink-0', STATUS_COLORS[claim.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700')}>
            {STATUS_ICONS[claim.status as keyof typeof STATUS_ICONS]}
            <span className="ml-1">{STATUS_LABELS[claim.status as keyof typeof STATUS_LABELS] || claim.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Montant estimé</p>
            <p className="text-xl font-bold text-blue-600">
              {claim.estimated_amount ? `${claim.estimated_amount.toLocaleString('fr-FR')} FCFA` : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Date incident</p>
            <p className="font-medium flex items-center gap-1 justify-end">
              <Calendar className="h-4 w-4 text-gray-400" />
              {new Date(claim.incident_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); logger.info('Manage claim:', claim.id) }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Gérer
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement des sinistres...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Sinistres</h1>
          <p className="text-gray-600">Traitez les déclarations de sinistres de vos clients</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total sinistres</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.underReview}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approuvés</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Montant total</p>
                <p className="text-2xl font-bold">{(stats.totalAmount / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un sinistre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="SUBMITTED">Soumis</SelectItem>
                    <SelectItem value="UNDER_REVIEW">En cours</SelectItem>
                    <SelectItem value="APPROVED">Approuvés</SelectItem>
                    <SelectItem value="REJECTED">Rejetés</SelectItem>
                    <SelectItem value="PAID">Payés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                {filteredClaims.length} sinistre{filteredClaims.length > 1 ? 's' : ''} trouvé{filteredClaims.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className={cn('transition-all', selectedClaim ? 'lg:grid lg:grid-cols-3 lg:gap-6' : '')}>
        {/* Claims Grid/List */}
        <div className={cn(selectedClaim ? 'lg:col-span-2' : '')}>
          {filteredClaims.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun sinistre trouvé</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Aucun sinistre n\'a été déclaré pour le moment'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClaims.map((claim: Claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Dossier</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Date Incident</TableHead>
                    <TableHead>Montant Est.</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim: Claim) => (
                    <TableRow key={claim.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedClaim(claim)}>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>{claim.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(claim.incident_date).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {claim.estimated_amount ? `${claim.estimated_amount.toLocaleString('fr-FR')} FCFA` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[claim.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700'}>
                          {STATUS_ICONS[claim.status as keyof typeof STATUS_ICONS]}
                          <span className="ml-1">{STATUS_LABELS[claim.status as keyof typeof STATUS_LABELS] || claim.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={() => logger.info('Manage claim:', claim.id)}>
                          Gérer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        {selectedClaim && (
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Détails du sinistre</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setSelectedClaim(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge className={STATUS_COLORS[selectedClaim.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700'}>
                    {STATUS_ICONS[selectedClaim.status as keyof typeof STATUS_ICONS]}
                    <span className="ml-1">{STATUS_LABELS[selectedClaim.status as keyof typeof STATUS_LABELS] || selectedClaim.status}</span>
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-400" />
                    {selectedClaim.claim_number}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedClaim.title}</p>
                </div>

                {selectedClaim.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedClaim.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-gray-500">Montant estimé</p>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedClaim.estimated_amount ? `${selectedClaim.estimated_amount.toLocaleString('fr-FR')} FCFA` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date incident</p>
                    <p className="font-medium">
                      {new Date(selectedClaim.incident_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      logger.info('Manage claim:', selectedClaim.id)
                      setSelectedClaim(null)
                    }}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Gérer le dossier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default InsurerClaimsPage
