import { useState, useEffect } from 'react'
import {
  Shield,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  CreditCard,
  Car,
  MoreHorizontal,
  Search,
  Filter,
  Plus,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Policy, PolicyDocument, Payment, Claim } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface PolicyWithDetails extends Policy {
  insurerName: string
  daysUntilExpiry: number
  daysUntilRenewal: number
  isExpiringSoon: boolean
  isOverdue: boolean
  nextPayment?: Payment
}

const UserPoliciesPage = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyWithDetails | null>(null)
  const [activeTab, setActiveTab] = useState('active')

  // Fetch policies from database
  const {
    data: policies = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-policies', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        // Simplified query without complex joins to avoid infinite loading
        const { data: policies, error } = await supabase
          .from('policies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          logger.error('Error fetching policies:', error)
          return [] // Return empty array instead of throwing
        }

        // Transform data to match expected format
        return (
          policies?.map((policy) => {
            const today = new Date()
            const endDate = new Date(policy.end_date)
            const renewalDate = new Date(policy.end_date)
            renewalDate.setDate(renewalDate.getDate() - 15) // 15 days before expiry

            const daysUntilExpiry = Math.ceil(
              (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
            const daysUntilRenewal = Math.ceil(
              (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            return {
              id: policy.id,
              userId: policy.user_id,
              insurerId: policy.insurer_id,
              quoteId: policy.quote_id,
              policyNumber: policy.policy_number,
              contractType: 'basic', // Simplified
              status: policy.status?.toLowerCase() || 'active',
              startDate: new Date(policy.start_date),
              endDate: endDate,
              renewalDate: renewalDate,
              premium: policy.premium_amount,
              paymentFrequency: policy.payment_frequency?.toLowerCase() || 'monthly',
              insurerName: 'Assureur Test', // Simplified for now
              daysUntilExpiry,
              daysUntilRenewal,
              isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
              isOverdue: daysUntilExpiry < 0,
              vehicle: policy.coverage_details?.vehicle || {
                id: 'unknown',
                type: 'voiture',
                brand: 'Non spécifié',
                model: '',
                year: new Date().getFullYear(),
                fiscalPower: 0,
                registration: 'Non spécifié',
                value: 0,
              },
              coverage: {
                id: policy.offer_id,
                name: 'Couverture standard',
                description: 'Description non disponible',
                level: 'basic',
              },
              guarantees: [], // Simplified for now
              franchise: policy.coverage_details?.deductible || 0,
              documents: [], // TODO: Fetch from documents table when created
              paymentHistory: [], // Simplified for now
              claims: [], // TODO: Fetch from claims table when created
              createdAt: new Date(policy.created_at),
              updatedAt: new Date(policy.updated_at),
            } as PolicyWithDetails
          }) || []
        )
      } catch (err) {
        logger.error('Error fetching policies:', err)
        return [] // Return empty array instead of throwing to prevent infinite loading
      }
    },
    enabled: !!user?.id,
  })

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.insurerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && policy.status === 'active') ||
      (activeTab === 'expired' && policy.status === 'expired')
    return matchesSearch && matchesStatus && matchesTab
  })

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Chargement de vos contrats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <AlertTriangle className='w-8 h-8 mx-auto mb-4 text-red-500' />
          <p className='text-red-600'>Erreur lors du chargement de vos contrats</p>
          <p className='text-sm text-muted-foreground mt-2'>Veuillez réessayer plus tard</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
            Actif
          </Badge>
        )
      case 'expired':
        return (
          <Badge className='bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'>
            Expiré
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className='bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
            Annulé
          </Badge>
        )
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
            En attente
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'tiers':
        return 'Au tiers'
      case 'tiers_plus':
        return 'Tiers Plus'
      case 'tous_risques':
        return 'Tous Risques'
      default:
        return type
    }
  }

  const getPaymentFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Mensuel'
      case 'quarterly':
        return 'Trimestriel'
      case 'annually':
        return 'Annuel'
      default:
        return frequency
    }
  }

  const handleDownloadDocument = (document: PolicyDocument) => {
    toast.success(`Téléchargement de ${document.name}`)
  }

  const handleViewPolicy = (policy: PolicyWithDetails) => {
    setSelectedPolicy(policy)
  }

  const handleMakePayment = (policyId: string) => {
    toast.success('Redirection vers le paiement...')
  }

  const handleFileClaim = (policyId: string) => {
    toast.success('Redirection vers la déclaration de sinistre...')
  }

  const PolicyCard = ({ policy }: { policy: PolicyWithDetails }) => (
    <Card
      className={`transition-all hover:shadow-md ${policy.isExpiringSoon ? 'border-orange-200' : ''}`}
    >
      <CardHeader className='pb-2 sm:pb-4'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2'>
          <div className='space-y-1 sm:space-y-2'>
            <CardTitle className='text-base sm:text-lg'>{policy.policyNumber}</CardTitle>
            <CardDescription className='flex items-center gap-2 text-xs sm:text-sm'>
              <Shield className='h-3 w-3 sm:h-4 sm:w-4' />
              {policy.insurerName}
            </CardDescription>
          </div>
          <div className='text-right sm:text-left'>{getStatusBadge(policy.status)}</div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3 sm:space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Car className='h-4 w-4 text-gray-500' />
            <span className='font-medium text-sm sm:text-base'>
              {policy.vehicle.brand} {policy.vehicle.model}
            </span>
          </div>
          <span className='text-xs sm:text-sm text-gray-500'>{policy.vehicle.registration}</span>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm'>
          <div>
            <span className='text-gray-500'>Type:</span>
            <span className='ml-2 font-medium block sm:inline'>
              {getContractTypeLabel(policy.contractType)}
            </span>
          </div>
          <div>
            <span className='text-gray-500'>Prime:</span>
            <span className='ml-2 font-medium block sm:inline'>
              {policy.premium.toLocaleString()} FCFA
            </span>
          </div>
          <div>
            <span className='text-gray-500'>Fréquence:</span>
            <span className='ml-2 font-medium block sm:inline'>
              {getPaymentFrequencyLabel(policy.paymentFrequency)}
            </span>
          </div>
          <div>
            <span className='text-gray-500'>Franchise:</span>
            <span className='ml-2 font-medium block sm:inline'>
              {policy.franchise.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <div className='flex items-center gap-2 text-xs sm:text-sm'>
            <Calendar className='h-4 w-4 text-gray-500' />
            <span>Expire le {policy.endDate.toLocaleDateString('fr-FR')}</span>
          </div>
          {policy.isExpiringSoon && (
            <Badge className='bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs'>
              Expire bientôt
            </Badge>
          )}
        </div>

        <div className='flex flex-col sm:flex-row gap-2'>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleViewPolicy(policy)}
                className='flex-1 sm:flex-initial'
              >
                <Eye className='h-4 w-4 mr-1' />
                <span className='hidden sm:inline'>Détails</span>
                <span className='sm:hidden'>Voir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
              <PolicyDetails policy={policy} />
            </DialogContent>
          </Dialog>
          <Button
            size='sm'
            variant='outline'
            onClick={() => handleMakePayment(policy.id)}
            className='flex-1 sm:flex-initial'
          >
            <CreditCard className='h-4 w-4 mr-1' />
            <span className='hidden sm:inline'>Payer</span>
            <span className='sm:hidden'>Paiement</span>
          </Button>
          <Button
            size='sm'
            onClick={() => handleFileClaim(policy.id)}
            className='flex-1 sm:flex-initial'
          >
            <AlertTriangle className='h-4 w-4 mr-1' />
            <span className='hidden sm:inline'>Sinistre</span>
            <span className='sm:hidden'>Déclarer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const PolicyDetails = ({ policy }: { policy: PolicyWithDetails }) => (
    <div className='space-y-6'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2'>
          <Shield className='h-5 w-5' />
          Détails du contrat {policy.policyNumber}
        </DialogTitle>
        <DialogDescription>Contrat d'assurance avec {policy.insurerName}</DialogDescription>
      </DialogHeader>

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div>
            <h4 className='font-semibold mb-2'>Informations du contrat</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Statut:</span>
                {getStatusBadge(policy.status)}
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Type de contrat:</span>
                <span>{getContractTypeLabel(policy.contractType)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Prime annuelle:</span>
                <span>{policy.premium.toLocaleString()} FCFA</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Fréquence de paiement:</span>
                <span>{getPaymentFrequencyLabel(policy.paymentFrequency)}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Franchise:</span>
                <span>{policy.franchise.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className='font-semibold mb-2'>Dates importantes</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Début:</span>
                <span>{policy.startDate.toLocaleDateString('fr-FR')}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Fin:</span>
                <span>{policy.endDate.toLocaleDateString('fr-FR')}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Renouvellement:</span>
                <span>{policy.renewalDate.toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div>
            <h4 className='font-semibold mb-2'>Véhicule assuré</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Marque/Modèle:</span>
                <span>
                  {policy.vehicle.brand} {policy.vehicle.model}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Immatriculation:</span>
                <span>{policy.vehicle.registration}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Année:</span>
                <span>{policy.vehicle.year}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Puissance fiscale:</span>
                <span>{policy.vehicle.fiscalPower} CV</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Valeur:</span>
                <span>{policy.vehicle.value.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className='font-semibold mb-2'>Couverture et garanties</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Niveau de couverture:</span>
                <span>{policy.coverage.name}</span>
              </div>
              <div className='mt-2'>
                <span className='text-gray-500'>Garanties incluses:</span>
                <div className='mt-1 flex flex-wrap gap-1'>
                  {policy.guarantees.map((guarantee, index) => (
                    <Badge key={index} variant='outline' className='text-xs'>
                      {guarantee}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className='font-semibold mb-2'>Documents</h4>
        <div className='space-y-2'>
          {policy.documents.map((doc) => (
            <div key={doc.id} className='flex items-center justify-between p-2 border rounded'>
              <div className='flex items-center gap-2'>
                <FileText className='h-4 w-4 text-gray-500' />
                <span className='text-sm'>{doc.name}</span>
                <Badge variant='outline' className='text-xs'>
                  {doc.type}
                </Badge>
              </div>
              <Button size='sm' variant='outline' onClick={() => handleDownloadDocument(doc)}>
                <Download className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className='font-semibold mb-2'>Historique des paiements</h4>
        <div className='space-y-2'>
          {policy.paymentHistory.map((payment) => (
            <div key={payment.id} className='flex items-center justify-between p-2 border rounded'>
              <div className='flex items-center gap-2'>
                {payment.status === 'paid' ? (
                  <CheckCircle className='h-4 w-4 text-green-500' />
                ) : (
                  <Clock className='h-4 w-4 text-yellow-500' />
                )}
                <span className='text-sm'>
                  {payment.amount.toLocaleString()} FCFA -{' '}
                  {payment.dueDate.toLocaleDateString('fr-FR')}
                </span>
              </div>
              <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                {payment.status === 'paid'
                  ? 'Payé'
                  : payment.status === 'overdue'
                    ? 'En retard'
                    : 'En attente'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {policy.claims.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className='font-semibold mb-2'>Sinistres déclarés</h4>
            <div className='space-y-2'>
              {policy.claims.map((claim) => (
                <div
                  key={claim.id}
                  className='flex items-center justify-between p-2 border rounded'
                >
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='h-4 w-4 text-orange-500' />
                    <span className='text-sm'>
                      {claim.claimNumber} - {claim.type}
                    </span>
                  </div>
                  <Badge variant='outline'>{claim.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <DialogFooter>
        <Button onClick={() => handleMakePayment(policy.id)}>
          <CreditCard className='h-4 w-4 mr-2' />
          Effectuer un paiement
        </Button>
        <Button variant='outline' onClick={() => handleFileClaim(policy.id)}>
          <AlertTriangle className='h-4 w-4 mr-2' />
          Déclarer un sinistre
        </Button>
      </DialogFooter>
    </div>
  )

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold'>Mes Contrats</h1>
          <p className='text-muted-foreground text-sm sm:text-base'>
            Gérez vos contrats d'assurance
          </p>
        </div>
        <Button className='w-full sm:w-auto'>
          <Plus className='w-4 h-4 mr-2' />
          <span className='hidden sm:inline'>Nouveau contrat</span>
          <span className='sm:hidden'>Ajouter</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
        <Card>
          <CardContent className='p-3 sm:p-4 lg:p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-center sm:text-left'>
              <Shield className='h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 mx-auto sm:mx-0' />
              <div>
                <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                  Total Contrats
                </p>
                <p className='text-lg sm:text-xl lg:text-2xl font-bold'>{policies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-3 sm:p-4 lg:p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-center sm:text-left'>
              <CheckCircle className='h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0 mx-auto sm:mx-0' />
              <div>
                <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                  Contrats Actifs
                </p>
                <p className='text-lg sm:text-xl lg:text-2xl font-bold'>
                  {policies.filter((p) => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-3 sm:p-4 lg:p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-center sm:text-left'>
              <Clock className='h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0 mx-auto sm:mx-0' />
              <div>
                <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                  Expirant bientôt
                </p>
                <p className='text-lg sm:text-xl lg:text-2xl font-bold'>
                  {policies.filter((p) => p.isExpiringSoon).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-3 sm:p-4 lg:p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-center sm:text-left'>
              <CreditCard className='h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0 mx-auto sm:mx-0' />
              <div>
                <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                  Prime mensuelle
                </p>
                <p className='text-lg sm:text-xl lg:text-2xl font-bold'>
                  {policies
                    .filter((p) => p.status === 'active')
                    .reduce((sum, p) => sum + p.premium / 12, 0)
                    .toLocaleString()}{' '}
                  FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className='pb-3 sm:pb-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
            <CardTitle className='text-lg sm:text-xl'>Liste des contrats</CardTitle>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <Input
                  placeholder='Rechercher un contrat...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10 w-full sm:w-64'
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-32'>
                  <SelectValue placeholder='Statut' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tous</SelectItem>
                  <SelectItem value='active'>Actifs</SelectItem>
                  <SelectItem value='expired'>Expirés</SelectItem>
                  <SelectItem value='cancelled'>Annulés</SelectItem>
                  <SelectItem value='pending'>En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='all' className='text-xs sm:text-sm'>
                Tous
              </TabsTrigger>
              <TabsTrigger value='active' className='text-xs sm:text-sm'>
                Actifs
              </TabsTrigger>
              <TabsTrigger value='expired' className='text-xs sm:text-sm'>
                Expirés
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className='mt-4 sm:mt-6'>
              <div className='grid gap-3 sm:gap-4'>
                {filteredPolicies.length > 0 ? (
                  filteredPolicies.map((policy) => <PolicyCard key={policy.id} policy={policy} />)
                ) : (
                  <div className='text-center py-6 sm:py-8'>
                    <Shield className='h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4' />
                    <p className='text-gray-500 text-sm sm:text-base'>Aucun contrat trouvé</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserPoliciesPage
