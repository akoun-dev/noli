import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  MessageCircle,
  Eye,
  Download,
  Users,
  Target,
  LayoutGrid,
  List,
  Package,
  Activity,
  X,
  User,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  status: 'active' | 'prospect' | 'inactive'
  totalQuotes: number
  convertedQuotes: number
  totalRevenue: number
  lastContact?: Date
  createdAt: Date
}

interface ClientStats {
  totalClients: number
  activeClients: number
  prospectClients: number
  inactiveClients: number
  conversionRate: number
  averageRevenue: number
}

const STATUS_COLORS = {
  'active': 'bg-green-100 text-green-700 border-green-200',
  'prospect': 'bg-blue-100 text-blue-700 border-blue-200',
  'inactive': 'bg-gray-100 text-gray-700 border-gray-200',
}

export const InsurerClientsPage: React.FC = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    prospectClients: 0,
    inactiveClients: 0,
    conversionRate: 0,
    averageRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'prospect' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'quotes' | 'date'>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    loadInsurerData()
  }, [])

  const loadInsurerData = async () => {
    try {
      const { data: insurerData, error } = await supabase.rpc('get_current_insurer_id')

      if (error || !insurerData || insurerData.length === 0) {
        logger.error('No insurer account found')
        navigate('/assureur/configuration', { replace: true })
        return
      }

      await loadClients(insurerData[0].insurer_id)
    } catch (error) {
      logger.error('Error loading insurer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async (id: string) => {
    try {
      const { data: offersData, error } = await supabase
        .from('quote_offers')
        .select(
          `
          id,
          status,
          price,
          created_at,
          quotes:quote_id (
            id,
            created_at,
            status,
            personal_data
          )
        `
        )
        .eq('insurer_id', id)

      if (error) {
        logger.error('Error loading clients:', error)
        return
      }

      const clientMap = new Map<string, Client>()

      offersData?.forEach((offer) => {
        if (!offer.quotes) return

        const personalData = (offer.quotes.personal_data as any) || {}
        const firstName = personalData.firstName || personalData.first_name || ''
        const lastName = personalData.lastName || personalData.last_name || ''
        const email = personalData.email || ''
        const phone =
          personalData.phone || personalData.phoneNumber || personalData.phone_number || ''

        const name = `${firstName} ${lastName}`.trim() || 'Client inconnu'
        const clientKey = email || name

        if (!clientMap.has(clientKey)) {
          clientMap.set(clientKey, {
            id: clientKey,
            name,
            email,
            phone,
            status: offer.status === 'APPROVED' ? 'active' : 'prospect',
            totalQuotes: 0,
            convertedQuotes: 0,
            totalRevenue: 0,
            createdAt: new Date(offer.created_at),
          })
        }

        const client = clientMap.get(clientKey)!
        client.totalQuotes++
        if (offer.status === 'APPROVED') {
          client.convertedQuotes++
          client.totalRevenue += offer.price || 0
          client.status = 'active'
        }
      })

      const clientsArray = Array.from(clientMap.values())

      const totalClients = clientsArray.length
      const activeClients = clientsArray.filter((c) => c.status === 'active').length
      const prospectClients = clientsArray.filter((c) => c.status === 'prospect').length
      const totalConverted = clientsArray.reduce((sum, c) => sum + c.convertedQuotes, 0)
      const totalQuotes = clientsArray.reduce((sum, c) => sum + c.totalQuotes, 0)
      const totalRevenue = clientsArray.reduce((sum, c) => sum + c.totalRevenue, 0)

      setStats({
        totalClients,
        activeClients,
        prospectClients,
        inactiveClients: 0,
        conversionRate: totalQuotes > 0 ? totalConverted / totalQuotes : 0,
        averageRevenue: totalClients > 0 ? totalRevenue / totalClients : 0,
      })

      setClients(clientsArray)
    } catch (error) {
      logger.error('Error loading clients:', error)
    }
  }

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'revenue':
          return b.totalRevenue - a.totalRevenue
        case 'quotes':
          return b.totalQuotes - a.totalQuotes
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

  const handleContactClient = (client: Client) => {
    logger.info('Contact client:', client)
  }

  const ClientCard = ({ client }: { client: Client }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={() => setSelectedClient(client)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-semibold text-lg">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                  {client.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {client.email && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Badge className={cn('shrink-0', STATUS_COLORS[client.status])}>
            {client.status === 'active' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Devis</p>
            <p className="font-semibold">{client.totalQuotes}</p>
            <p className="text-xs text-gray-400">({client.convertedQuotes} convertis)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Revenu</p>
            <p className="font-semibold text-blue-600">
              {client.totalRevenue > 0
                ? `${(client.totalRevenue / 1000).toFixed(0)}k FCFA`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); handleContactClient(client) }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Contacter
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-muted-foreground'>Chargement des clients...</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Gérez vos clients et prospects</p>
        </div>
        <Button onClick={() => navigate('/assureur/offers/create')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total clients</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prospects</p>
                <p className="text-2xl font-bold text-blue-600">{stats.prospectClients}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux conversion</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.conversionRate * 100)}%
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
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
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="prospect">Prospects</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Plus récents</SelectItem>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="revenue">Revenu</SelectItem>
                    <SelectItem value="quotes">Devis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
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
      <div className={cn('transition-all', selectedClient ? 'lg:grid lg:grid-cols-3 lg:gap-6' : '')}>
        {/* Clients Grid/List */}
        <div className={cn(selectedClient ? 'lg:col-span-2' : '')}>
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun client trouvé</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre premier client'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Devis</TableHead>
                    <TableHead>Revenu</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedClient(client)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {client.email && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{client.totalQuotes}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({client.convertedQuotes} convertis)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.totalRevenue > 0
                          ? `${client.totalRevenue.toLocaleString('fr-FR')} FCFA`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[client.status]}>
                          {client.status === 'active' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleContactClient(client)}>
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        {selectedClient && (
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Détails du client</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setSelectedClient(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-2xl">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
                    <Badge className={STATUS_COLORS[selectedClient.status]}>
                      {selectedClient.status === 'active' ? 'Actif' : selectedClient.status === 'prospect' ? 'Prospect' : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-sm text-gray-500">Devis totaux</p>
                    <p className="text-lg font-bold">{selectedClient.totalQuotes}</p>
                    <p className="text-xs text-gray-400">{selectedClient.convertedQuotes} convertis</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenu généré</p>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedClient.totalRevenue > 0
                        ? `${(selectedClient.totalRevenue / 1000).toFixed(0)}k FCFA`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedClient.email && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {selectedClient.email}
                    </div>
                  </div>
                )}

                {selectedClient.phone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                    <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {selectedClient.phone}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleContactClient(selectedClient)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Contacter
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

export default InsurerClientsPage
