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
  FileText,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  Search,
  LayoutGrid,
  List,
  Package,
  Activity,
  TrendingUp,
  Shield,
  X,
  FileCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contractService } from '@/services/contractService'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

interface Contract {
  id: string
  policy_number: string
  user_id: string
  premium_amount: number
  end_date: string
  status: string
  start_date?: string
  vehicle_info?: any
}

const STATUS_COLORS = {
  'ACTIVE': 'bg-green-100 text-green-700 border-green-200',
  'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'EXPIRED': 'bg-red-100 text-red-700 border-red-200',
  'CANCELLED': 'bg-gray-100 text-gray-700 border-gray-200',
}

const STATUS_ICONS = {
  'ACTIVE': <FileCheck className="h-4 w-4" />,
  'PENDING': <Clock className="h-4 w-4" />,
  'EXPIRED': <AlertTriangle className="h-4 w-4" />,
  'CANCELLED': <X className="h-4 w-4" />,
}

export const InsurerContractsPage: React.FC = () => {
  const navigate = useNavigate()
  const [insurerId, setInsurerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'>('all')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

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

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['insurer-contracts', insurerId],
    queryFn: () => contractService.getMyContracts(insurerId || ''),
    enabled: !!insurerId,
  })

  const filteredContracts = contracts.filter((contract: Contract) => {
    const matchesSearch = contract.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: contracts.length,
    active: contracts.filter((c: Contract) => c.status === 'ACTIVE').length,
    pending: contracts.filter((c: Contract) => c.status === 'PENDING').length,
    expired: contracts.filter((c: Contract) => c.status === 'EXPIRED').length,
    totalRevenue: contracts.reduce((sum: number, c: Contract) => sum + (c.premium_amount || 0), 0),
  }

  const ContractCard = ({ contract }: { contract: Contract }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={() => setSelectedContract(contract)}>
            <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              {contract.policy_number}
            </CardTitle>
            <CardDescription className="line-clamp-1 mt-1">
              Client: {contract.user_id.substring(0, 8)}...
            </CardDescription>
          </div>
          <Badge className={cn('shrink-0', STATUS_COLORS[contract.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700')}>
            {STATUS_ICONS[contract.status as keyof typeof STATUS_ICONS]}
            <span className="ml-1">{contract.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Prime annuelle</p>
            <p className="text-xl font-bold text-blue-600">
              {(contract.premium_amount || 0).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Échéance</p>
            <p className="font-medium flex items-center gap-1 justify-end">
              <Calendar className="h-4 w-4 text-gray-400" />
              {new Date(contract.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); navigate(`/assureur/contrats/${contract.id}`) }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement des contrats...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Contrats</h1>
          <p className="text-gray-600">Suivez et gérez les polices d'assurance actives</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total contrats</p>
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
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
                <p className="text-sm font-medium text-gray-600">Revenu total</p>
                <p className="text-2xl font-bold">{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
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
                  placeholder="Rechercher un contrat..."
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
                    <SelectItem value="ACTIVE">Actifs</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="EXPIRED">Expirés</SelectItem>
                    <SelectItem value="CANCELLED">Annulés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                {filteredContracts.length} contrat{filteredContracts.length > 1 ? 's' : ''} trouvé{filteredContracts.length > 1 ? 's' : ''}
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
      <div className={cn('transition-all', selectedContract ? 'lg:grid lg:grid-cols-3 lg:gap-6' : '')}>
        {/* Contracts Grid/List */}
        <div className={cn(selectedContract ? 'lg:col-span-2' : '')}>
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun contrat trouvé</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Aucun contrat n\'a été créé pour le moment'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContracts.map((contract: Contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Police</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Prime</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract: Contract) => (
                    <TableRow key={contract.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedContract(contract)}>
                      <TableCell className="font-medium">{contract.policy_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>Client {contract.user_id.substring(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {(contract.premium_amount || 0).toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(contract.end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[contract.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700'}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/assureur/contrats/${contract.id}`)}
                        >
                          Détails <ArrowRight className="ml-2 h-3 w-3" />
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
        {selectedContract && (
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Détails du contrat</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setSelectedContract(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge className={STATUS_COLORS[selectedContract.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700'}>
                    {selectedContract.status}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    {selectedContract.policy_number}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Client: {selectedContract.user_id.substring(0, 8)}...
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-gray-500">Prime annuelle</p>
                    <p className="text-lg font-bold text-blue-600">
                      {(selectedContract.premium_amount || 0).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Échéance</p>
                    <p className="font-medium">
                      {new Date(selectedContract.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigate(`/assureur/contrats/${selectedContract.id}`)
                      setSelectedContract(null)
                    }}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Voir détails complets
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

export default InsurerContractsPage
