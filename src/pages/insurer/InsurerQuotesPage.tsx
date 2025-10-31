import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  X,
  FileText,
  TrendingUp,
} from 'lucide-react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { quoteService } from '@/data/api/quoteService'
import { toast } from 'sonner'

interface Quote {
  id: string
  customer: {
    name: string
    email: string
    phone: string
    avatar?: string
  }
  vehicle: {
    make: string
    model: string
    year: number
    licensePlate: string
  }
  offer: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  submittedAt: string
  expiresAt: string
  priority: 'low' | 'medium' | 'high'
  lastContact?: string
  notes?: string
}

export const InsurerQuotesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoading(true)
        const quotesData = await quoteService.getAllQuotes()
        setQuotes(quotesData)
      } catch (error) {
        console.error('Error loading quotes:', error)
        toast.error('Erreur lors du chargement des devis')
      } finally {
        setIsLoading(false)
      }
    }

    loadQuotes()
  }, [])

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || quote.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Approuvé
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            <Clock className='h-3 w-3 mr-1' />
            En attente
          </Badge>
        )
      case 'rejected':
        return <Badge variant='destructive'>Rejeté</Badge>
      case 'expired':
        return (
          <Badge variant='outline' className='bg-gray-100 text-gray-800'>
            Expiré
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant='destructive'>Haute</Badge>
      case 'medium':
        return <Badge variant='secondary'>Moyenne</Badge>
      case 'low':
        return <Badge variant='outline'>Basse</Badge>
      default:
        return <Badge variant='outline'>{priority}</Badge>
    }
  }

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffHours = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours <= 48
  }

  const approveQuote = async (quoteId: string) => {
    try {
      await quoteService.updateQuoteStatus(quoteId, 'APPROVED')
      setQuotes(
        quotes.map((quote) =>
          quote.id === quoteId ? { ...quote, status: 'approved' as const } : quote
        )
      )
      toast.success('Devis approuvé avec succès')
    } catch (error) {
      console.error('Error approving quote:', error)
      toast.error("Erreur lors de l'approbation du devis")
    }
  }

  const rejectQuote = async (quoteId: string) => {
    try {
      await quoteService.updateQuoteStatus(quoteId, 'REJECTED')
      setQuotes(
        quotes.map((quote) =>
          quote.id === quoteId ? { ...quote, status: 'rejected' as const } : quote
        )
      )
      toast.success('Devis rejeté avec succès')
    } catch (error) {
      console.error('Error rejecting quote:', error)
      toast.error('Erreur lors du rejet du devis')
    }
  }

  const exportQuotes = () => {
    try {
      const csvContent = [
        [
          'Client',
          'Email',
          'Téléphone',
          'Véhicule',
          'Offre',
          'Montant',
          'Statut',
          'Priorité',
          'Date soumission',
          'Date expiration',
        ],
        ...filteredQuotes.map((quote) => [
          quote.customer.name,
          quote.customer.email,
          quote.customer.phone,
          `${quote.vehicle.make} ${quote.vehicle.model} (${quote.vehicle.year})`,
          quote.offer,
          quote.amount.toString(),
          quote.status,
          quote.priority,
          new Date(quote.submittedAt).toLocaleDateString('fr-FR'),
          new Date(quote.expiresAt).toLocaleDateString('fr-FR'),
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `devis_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Devis exportés avec succès')
    } catch (error) {
      console.error('Error exporting quotes:', error)
      toast.error("Erreur lors de l'exportation des devis")
    }
  }

  const pendingQuotes = quotes.filter((q) => q.status === 'pending')
  const urgentQuotes = pendingQuotes.filter(
    (q) => q.priority === 'high' || isExpiringSoon(q.expiresAt)
  )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Devis Reçus</h1>
          <p className='text-gray-600'>Gérez les demandes de devis des clients</p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Button variant='outline' onClick={exportQuotes}>
            <Download className='h-4 w-4 mr-2' />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total devis</p>
                <p className='text-2xl font-bold'>{quotes.length}</p>
              </div>
              <div className='bg-blue-100 p-2 rounded-lg'>
                <FileText className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>En attente</p>
                <p className='text-2xl font-bold text-yellow-600'>{pendingQuotes.length}</p>
              </div>
              <div className='bg-yellow-100 p-2 rounded-lg'>
                <Clock className='h-6 w-6 text-yellow-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Urgents</p>
                <p className='text-2xl font-bold text-red-600'>{urgentQuotes.length}</p>
              </div>
              <div className='bg-red-100 p-2 rounded-lg'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Taux conversion</p>
                <p className='text-2xl font-bold text-green-600'>
                  {Math.round(
                    (quotes.filter((q) => q.status === 'approved').length / quotes.length) * 100
                  )}
                  %
                </p>
              </div>
              <div className='bg-green-100 p-2 rounded-lg'>
                <TrendingUp className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Alert */}
      {urgentQuotes.length > 0 && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <AlertTriangle className='h-5 w-5 text-red-600 mr-2' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-red-800'>
                  {urgentQuotes.length} devis urgent(s) à traiter
                </p>
                <p className='text-xs text-red-600'>
                  Certains devis expirent bientôt ou sont marqués comme prioritaires
                </p>
              </div>
              <Button variant='outline' size='sm' className='text-red-600 border-red-200'>
                Voir les urgents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Rechercher un client, véhicule ou plaque...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='pending'>En attente</SelectItem>
                <SelectItem value='approved'>Approuvés</SelectItem>
                <SelectItem value='rejected'>Rejetés</SelectItem>
                <SelectItem value='expired'>Expirés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className='w-full sm:w-[180px]'>
                <SelectValue placeholder='Priorité' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Toutes les priorités</SelectItem>
                <SelectItem value='high'>Haute</SelectItem>
                <SelectItem value='medium'>Moyenne</SelectItem>
                <SelectItem value='low'>Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des devis ({filteredQuotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Offre</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Date expiration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className={
                    isExpiringSoon(quote.expiresAt) && quote.status === 'pending' ? 'bg-red-50' : ''
                  }
                >
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8'>
                        <AvatarFallback>
                          {quote.customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium'>{quote.customer.name}</div>
                        <div className='text-sm text-gray-500'>{quote.customer.email}</div>
                        <div className='text-xs text-gray-400'>{quote.customer.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>
                        {quote.vehicle.make} {quote.vehicle.model}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {quote.vehicle.year} - {quote.vehicle.licensePlate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{quote.offer}</TableCell>
                  <TableCell className='font-medium'>
                    {quote.amount.toLocaleString('fr-FR')} FCFA
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell>{getPriorityBadge(quote.priority)}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3 text-gray-400' />
                      <span
                        className={
                          isExpiringSoon(quote.expiresAt) && quote.status === 'pending'
                            ? 'text-red-600 font-medium'
                            : ''
                        }
                      >
                        {new Date(quote.expiresAt).toLocaleDateString('fr-FR')}
                      </span>
                      {isExpiringSoon(quote.expiresAt) && quote.status === 'pending' && (
                        <AlertTriangle className='h-3 w-3 text-red-600' />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button variant='ghost' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Phone className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Mail className='h-4 w-4' />
                      </Button>
                      {quote.status === 'pending' && (
                        <>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-green-600'
                            onClick={() => approveQuote(quote.id)}
                          >
                            <CheckCircle className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-red-600'
                            onClick={() => rejectQuote(quote.id)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default InsurerQuotesPage
