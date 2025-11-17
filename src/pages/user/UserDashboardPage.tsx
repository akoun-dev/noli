import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserBreadcrumb } from '@/components/common/BreadcrumbRenderer'
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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
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
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        logger.warn('User ID not found, skipping data loading')
        return
      }

      logger.info('Loading dashboard data for user:', user.id)

      // ⚡ SOLUTION: Timeout de 5 secondes maximum pour éviter le chargement infini
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Dashboard loading timeout')), 5000)
      )

      // Promise de chargement des données
      const dataPromise = quoteService.getUserQuotes(user.id)

      try {
        // Race entre le chargement et le timeout
        const userQuotes = await Promise.race([dataPromise, timeoutPromise]) as any[]
        logger.info(`Successfully loaded ${userQuotes.length} quotes for user:`, user.id)
        setQuotes(userQuotes)

        // Convertir les quotes approuvées en politiques
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
        if (err instanceof Error && err.message === 'Dashboard loading timeout') {
          logger.warn('Dashboard loading timeout - using fallback data')
          // En cas de timeout, utiliser des données de démonstration
          const fallbackQuotes = [
            {
              id: 'demo-1',
              insurerName: 'AXA Côte d\'Ivoire',
              offerName: 'Assurance Tous Risques',
              status: 'pending',
              price: { monthly: 85000, annual: 1020000 },
              createdAt: new Date(),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              vehicleInfo: 'Véhicule de démonstration'
            }
          ]
          setQuotes(fallbackQuotes)
          setPolicies([])
          setError('Chargement terminé avec données de démonstration')
        } else {
          throw err // Relancer les autres erreurs
        }
      }

    } catch (err) {
      logger.error('Error loading dashboard data:', err)
      setError('Erreur lors du chargement - Données non disponibles')

      // Garantir que l'interface reste utilisable même en cas d'erreur
      setQuotes([])
      setPolicies([])
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
      label: 'Devis générés',
      value: quotes.length.toString(),
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      label: 'Contrats actifs',
      value: policies.length.toString(),
      icon: Shield,
      color: 'text-green-600',
    },
    {
      label: 'Économies réalisées',
      value: `€${Math.round(quotes.reduce((sum, q) => sum + q.price.annual, 0) * 0.1).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      label: 'Comparaisons',
      value: quotes.length.toString(),
      icon: Car,
      color: 'text-orange-600',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
            <CheckCircle className='h-3 w-3 mr-1' />
            {status === 'approved' ? 'Approuvé' : 'Actif'}
          </span>
        )
      case 'pending':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
            <Clock className='h-3 w-3 mr-1' />
            En attente
          </span>
        )
      case 'rejected':
      case 'expired':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'>
            <AlertCircle className='h-3 w-3 mr-1' />
            {status === 'rejected' ? 'Rejeté' : 'Expiré'}
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Initialisation de votre espace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Card className='p-8 max-w-md'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold mb-4'>Erreur</h2>
            <p className='text-muted-foreground mb-6'>{error}</p>
            <Button onClick={loadData}>Réessayer</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Breadcrumb */}
      <UserBreadcrumb className='mb-4' />

      {/* Welcome Section */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 sm:p-6'>
        <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-2'>
          Bienvenue sur votre espace!
        </h1>
        <p className='text-blue-100 text-sm sm:text-base mb-4'>
          Gérez vos assurances et suivez vos demandes
        </p>
        <Button className='bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto'>
          <Plus className='h-4 w-4 mr-2' />
          <span className='hidden sm:inline'>Nouvelle comparaison</span>
          <span className='sm:hidden'>Comparer</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className='p-3 sm:p-4 lg:p-6'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='text-center sm:text-left'>
                  <p className='text-xs sm:text-sm font-medium text-muted-foreground'>
                    {stat.label}
                  </p>
                  <p className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground'>
                    {stat.value}
                  </p>
                </div>
                <stat.icon
                  className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} flex-shrink-0 mx-auto sm:mx-0`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6'>
        {/* Recent Quotes */}
        <Card>
          <CardHeader className='pb-3 sm:pb-4'>
            <CardTitle className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
              <span className='text-lg sm:text-xl'>Devis récents</span>
              <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className='text-center py-8'>
                <FileText className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>Aucun devis pour le moment</p>
                <Button className='mt-4'>
                  <Plus className='h-4 w-4 mr-2' />
                  Créer un devis
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                {quotes.slice(0, 3).map((quote) => (
                  <div
                    key={quote.id}
                    className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                        {quote.offerName}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {quote.insurerName} •{' '}
                        {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                        €{quote.price.annual.toLocaleString()}
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
          <CardHeader className='pb-3 sm:pb-4'>
            <CardTitle className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
              <span className='text-lg sm:text-xl'>Contrats actifs</span>
              <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <div className='text-center py-8'>
                <Shield className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>Aucun contrat actif</p>
                <p className='text-xs text-muted-foreground mt-2'>
                  Acceptez un devis pour activer votre couverture
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {policies.slice(0, 3).map((policy) => (
                  <div
                    key={policy.id}
                    className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                        {policy.offerName}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {policy.insurerName} • Expire le{' '}
                        {new Date(policy.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                        €{policy.price.toLocaleString()}/an
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <Plus className='h-6 w-6' />
              <span>Nouveau devis</span>
            </Button>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <FileText className='h-6 w-6' />
              <span>Mes documents</span>
            </Button>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <Shield className='h-6 w-6' />
              <span>Assistance</span>
            </Button>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <TrendingUp className='h-6 w-6' />
              <span>Statistiques</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserDashboardPage
