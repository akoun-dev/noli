import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Wallet,
  History,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Smartphone,
  Building2,
  Loader2,
} from 'lucide-react'
import { PaymentMethodsManager } from '../components/PaymentMethodsManager'
import { PaymentProcessor, PaymentHistory } from '../components/PaymentProcessor'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

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
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('methods')

  // Fetch quotes with pending payments from database
  const {
    data: quotes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-quotes-for-payment', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        // Simplified query to avoid infinite loading
        const { data: quotes, error } = await supabase
          .from('quotes')
          .select('id, estimated_price, valid_until, created_at, status')
          .eq('user_id', user.id)
          .in('status', ['PENDING', 'APPROVED'])
          .gte('valid_until', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (error) {
          logger.error('Error loading quotes for payment:', error)
          return [] // Return empty array instead of throwing
        }

        // Transform data to match expected Quote interface
        return (
          quotes?.map((quote) => ({
            id: quote.id,
            insurerName: 'Assureur Test', // Simplified for now
            offerName: 'Offre standard', // Simplified for now
            status: quote.status?.toLowerCase() || 'pending',
            price: {
              monthly: (quote.estimated_price || 0) / 12,
              annual: quote.estimated_price || 0,
            },
            createdAt: new Date(quote.created_at),
            validUntil: new Date(quote.valid_until || quote.created_at),
          })) || []
        )
      } catch (err) {
        logger.error('Error loading quotes for payment:', err)
        return [] // Return empty array instead of throwing to prevent infinite loading
      }
    },
    enabled: !!user?.id,
  })

  // Get pending quotes for payment
  const pendingQuotes = quotes.filter((q) => q.status === 'pending' || q.status === 'approved')

  const handlePaymentSuccess = (transaction: any) => {
    logger.info('Payment successful:', transaction)
    // TODO: Update quote status to PAID in database
    // For now, just show success message
    toast.success('Paiement effectué avec succès')
  }

  const handlePaymentError = (error: Error) => {
    logger.error('Payment failed:', error)
    toast.error('Erreur lors du paiement. Veuillez réessayer.')
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Card className='p-8 max-w-md'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold mb-4'>Connexion requise</h2>
            <p className='text-muted-foreground'>
              Veuillez vous connecter pour accéder à cette page
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Chargement des données de paiement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <AlertTriangle className='w-8 h-8 mx-auto mb-4 text-red-500' />
          <p className='text-red-600'>Erreur lors du chargement des données de paiement</p>
          <p className='text-sm text-muted-foreground mt-2'>Veuillez réessayer plus tard</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>Paiements</h1>
        <p className='text-gray-600 dark:text-gray-400'>
          Gérez vos méthodes de paiement et effectuez vos transactions
        </p>
      </div>

      {/* Payment Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Paiements en attente
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                  {pendingQuotes.length}
                </p>
              </div>
              <Clock className='h-8 w-8 text-yellow-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Total à payer
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                  €{pendingQuotes.reduce((sum, q) => sum + q.price.annual, 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                  Méthodes enregistrées
                </p>
                <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>3</p>
              </div>
              <Wallet className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='quotes' className='flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Devis à payer
            {pendingQuotes.length > 0 && (
              <Badge variant='destructive' className='ml-2'>
                {pendingQuotes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='methods' className='flex items-center gap-2'>
            <CreditCard className='h-4 w-4' />
            Méthodes
          </TabsTrigger>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <History className='h-4 w-4' />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Pending Quotes Tab */}
        <TabsContent value='quotes' className='space-y-6'>
          {pendingQuotes.length === 0 ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <Shield className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  Aucun paiement en attente
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Tous vos devis sont payés ou en attente d'approbation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {pendingQuotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                          {quote.offerName}
                        </h3>
                        <p className='text-gray-600 dark:text-gray-400'>
                          {quote.insurerName} • Créé le{' '}
                          {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        <div className='mt-2'>
                          <Badge variant='outline'>
                            Expire le {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                          </Badge>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                          €{quote.price.annual.toLocaleString()}
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          €{(quote.price.annual / 12).toLocaleString()}/mois
                        </p>
                        <PaymentProcessor
                          amount={quote.price.annual}
                          currency='EUR'
                          description={`Paiement police assurance: ${quote.offerName}`}
                          quoteId={quote.id}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value='methods' className='space-y-6'>
          <PaymentMethodsManager />
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value='history' className='space-y-6'>
          <PaymentHistory userId={user.id} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <Plus className='h-6 w-6' />
              <span>Ajouter une méthode</span>
            </Button>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <Smartphone className='h-6 w-6' />
              <span>Mobile</span>
            </Button>
            <Button className='h-auto p-4 flex flex-col gap-2' variant='outline'>
              <Building2 className='h-6 w-6' />
              <span>Virement</span>
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

export default PaymentsPage
