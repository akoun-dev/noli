import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Shield,
  Car,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2,
  FolderOpen,
  MessageCircle,
  BarChart3,
  ArrowRight,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUser } from '@/contexts/UserContext'
import quoteService from '@/data/api/offerService'
import { logger } from '@/lib/logger'

interface Quote {
  id: string
  insurerName: string
  offerName: string
  status: string
  price: {
    monthly: number
    annual: number
  }
  createdAt: Date
  validUntil: Date
  vehicleInfo?: string
}

interface Policy {
  id: string
  insurerName: string
  offerName: string
  price: number
  startDate: Date
  endDate: Date
  status: string
}

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { currentUser } = useUser()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      if (!user?.id) {
        logger.warn('User ID not found, skipping data loading')
        setLoading(false)
        return
      }

      logger.info('Loading dashboard data for user:', user.id)

      // Load user quotes
      const userQuotes = await quoteService.getUserQuotes(user.id)
      logger.info(`Loaded ${userQuotes.length} quotes for user:`, user.id)
      setQuotes(userQuotes)

      // Load user policies (simulated - would need a real policy service)
      // For now, convert approved quotes to policies
      const approvedPolicies: Policy[] = userQuotes
        .filter((q) => q.status === 'approved')
        .map((q) => ({
          id: q.id,
          insurerName: q.insurerName,
          offerName: q.offerName,
          price: q.price.annual,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'active',
        }))
      setPolicies(approvedPolicies)
    } catch (err) {
      logger.error('Error loading dashboard data:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  const quickStats = [
    {
      label: 'Devis',
      value: quotes.length,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Contrats',
      value: policies.length,
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'En attente',
      value: quotes.filter(q => q.status === 'pending').length,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: 'Économies',
      value: `${Math.round(quotes.reduce((sum, q) => sum + q.price.annual, 0) * 0.1 / 1000)}k FCFA`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  const quickActions = [
    {
      label: 'Nouveau devis',
      icon: Plus,
      description: 'Comparateur',
      onClick: () => navigate('/comparer'),
      color: 'bg-[#1B464D] hover:bg-[#164047]',
    },
    {
      label: 'Mes documents',
      icon: FolderOpen,
      description: 'Contrats & factures',
      onClick: () => navigate('/documents'),
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      label: 'Assistance',
      icon: MessageCircle,
      description: 'Chat en direct',
      onClick: () => {/* Chat widget is always visible */},
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'Mes statistiques',
      icon: BarChart3,
      description: 'Analytiques',
      onClick: () => navigate('/tableau-de-bord'),
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return (
          <Badge variant='default' className='bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-200'>
            <CheckCircle className='h-3 w-3 mr-1' />
            {status === 'approved' ? 'Approuvé' : 'Actif'}
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200'>
            <Clock className='h-3 w-3 mr-1' />
            En attente
          </Badge>
        )
      case 'rejected':
      case 'expired':
        return (
          <Badge variant='destructive'>
            <AlertCircle className='h-3 w-3 mr-1' />
            {status === 'rejected' ? 'Rejeté' : 'Expiré'}
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 animate-spin mx-auto mb-4 text-[#1B464D]' />
          <p className='text-muted-foreground'>Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Card className='p-8 max-w-md'>
          <div className='text-center'>
            <AlertCircle className='w-12 h-12 text-destructive mx-auto mb-4' />
            <h2 className='text-2xl font-bold mb-4'>Erreur</h2>
            <p className='text-muted-foreground mb-6'>{error}</p>
            <Button onClick={loadData} className='bg-[#1B464D] hover:bg-[#164047]'>
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Welcome Banner */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B464D] via-[#164047] to-[#0F2E33] text-white p-6 sm:p-8 shadow-xl'>
        <div className='absolute top-0 right-0 w-64 h-64 bg-[#DEEF4A]/10 rounded-full -translate-y-1/2 translate-x-1/2' />
        <div className='absolute bottom-0 left-0 w-48 h-48 bg-[#DEEF4A]/5 rounded-full translate-y-1/2 -translate-x-1/2' />

        <div className='relative z-10'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold mb-2'>
                Bonjour{currentUser?.firstName ? `, ${currentUser.firstName}` : ''} 👋
              </h1>
              <p className='text-blue-100 text-sm sm:text-base'>
                Bienvenue sur votre espace Noli Assurance
              </p>
            </div>
            <Button
              onClick={() => navigate('/comparer')}
              className='bg-[#DEEF4A] text-[#1B464D] hover:bg-[#D4E53F] font-semibold shadow-lg self-start sm:self-auto'
            >
              <Plus className='h-4 w-4 mr-2' />
              Nouvelle comparaison
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {quickStats.map((stat, index) => (
          <Card key={index} className='overflow-hidden hover:shadow-md transition-shadow'>
            <CardContent className='p-4'>
              <div className={`${stat.bgColor} rounded-lg p-3 mb-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className='text-2xl font-bold text-foreground'>{stat.value}</p>
              <p className='text-sm text-muted-foreground'>{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className='flex flex-col items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left'
              >
                <div className={`${action.color} p-3 rounded-full text-white`}>
                  <action.icon className='h-5 w-5' />
                </div>
                <div className='flex-1 text-center w-full'>
                  <p className='font-semibold text-sm'>{action.label}</p>
                  <p className='text-xs text-muted-foreground'>{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        {/* Recent Quotes */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-4'>
            <CardTitle className='text-lg'>Devis récents</CardTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/mes-devis')}
              className='text-[#1B464D] hover:text-[#164047]'
            >
              Voir tout
              <ArrowRight className='h-4 w-4 ml-1' />
            </Button>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className='text-center py-8'>
                <div className='bg-muted rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                  <FileText className='h-8 w-8 text-muted-foreground' />
                </div>
                <p className='text-muted-foreground mb-2'>Aucun devis pour le moment</p>
                <p className='text-sm text-muted-foreground mb-4'>
                  Commencez par comparer les offres
                </p>
                <Button
                  onClick={() => navigate('/comparer')}
                  className='bg-[#1B464D] hover:bg-[#164047]'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Créer un devis
                </Button>
              </div>
            ) : (
              <div className='space-y-3'>
                {quotes.slice(0, 3).map((quote) => (
                  <div
                    key={quote.id}
                    className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer'
                    onClick={() => navigate(`/mes-devis`)}
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{quote.offerName}</p>
                      <p className='text-xs text-muted-foreground'>
                        {quote.insurerName} • {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold'>
                        {quote.price.annual.toLocaleString()} FCFA
                      </span>
                      {getStatusBadge(quote.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Policies */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-4'>
            <CardTitle className='text-lg'>Contrats actifs</CardTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/mes-contrats')}
              className='text-[#1B464D] hover:text-[#164047]'
            >
              Voir tout
              <ArrowRight className='h-4 w-4 ml-1' />
            </Button>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <div className='text-center py-8'>
                <div className='bg-muted rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
                  <Shield className='h-8 w-8 text-muted-foreground' />
                </div>
                <p className='text-muted-foreground mb-2'>Aucun contrat actif</p>
                <p className='text-xs text-muted-foreground'>
                  Acceptez un devis pour activer votre couverture
                </p>
              </div>
            ) : (
              <div className='space-y-3'>
                {policies.slice(0, 3).map((policy) => (
                  <div
                    key={policy.id}
                    className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer'
                    onClick={() => navigate(`/mes-contrats`)}
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{policy.offerName}</p>
                      <p className='text-xs text-muted-foreground flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {policy.insurerName} • Expire le {new Date(policy.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold'>
                        {policy.price.toLocaleString()} FCFA/an
                      </span>
                      {getStatusBadge(policy.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State Promo */}
      {quotes.length === 0 && policies.length === 0 && (
        <Card className='bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950 dark:to-emerald-950 border-blue-200 dark:border-blue-800'>
          <CardContent className='p-6'>
            <div className='flex flex-col sm:flex-row items-center gap-6'>
              <div className='flex-shrink-0'>
                <div className='bg-[#1B464D] rounded-full p-4'>
                  <Car className='h-8 w-8 text-[#DEEF4A]' />
                </div>
              </div>
              <div className='flex-1 text-center sm:text-left'>
                <h3 className='text-lg font-semibold mb-2'>Comparez et économisez</h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Obtenez les meilleures offres d'assurance auto en quelques minutes.
                  Comparez gratuitement les assureurs et trouvez l'offre qui vous convient.
                </p>
                <Button
                  onClick={() => navigate('/comparer')}
                  className='bg-[#1B464D] hover:bg-[#164047]'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Commencer ma comparaison
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UserDashboardPage
