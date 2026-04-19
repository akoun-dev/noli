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
import { usePaymentMethods } from '../services/paymentService'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

interface PaymentRecord {
  id: string
  amount: number
  status: string
  paymentDate: Date
  paymentMethod: string
  policyId: string
  policyNumber: string
  policyStatus: string
  transactionId?: string
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('methods')

  // Fetch quotes with pending payments from database
  const paymentMethodsQuery = usePaymentMethods(user?.id || '')

  const {
    data: payments = [],
    isLoading,
    error,
  } = useQuery<PaymentRecord[]>({
    queryKey: ['user-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        const { data: paymentsData, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            payment_date,
            payment_method,
            transaction_id,
            policy_id,
            policies:policy_id (
              id,
              policy_number,
              status
            )
          `)
          .eq('user_id', user.id)
          .order('payment_date', { ascending: false })
          .limit(20)

        if (error) {
          logger.error('Error loading payments:', error)
          return []
        }

        return (
          (paymentsData || []).map((payment: any) => ({
            id: payment.id,
            amount: Number(payment.amount) || 0,
            status: (payment.status || 'pending').toLowerCase(),
            paymentDate: payment.payment_date ? new Date(payment.payment_date) : new Date(),
            paymentMethod: payment.payment_method || 'N/A',
            policyId: payment.policy_id,
            policyNumber: payment.policies?.policy_number || '—',
            policyStatus: (payment.policies?.status || 'unknown').toLowerCase(),
            transactionId: payment.transaction_id || '',
          })) as PaymentRecord[]
        )
      } catch (err) {
        logger.error('Error loading payments for user:', err)
        return []
      }
    },
    enabled: !!user?.id,
  })

  const paymentMethods = paymentMethodsQuery.data || []
  const pendingPayments = payments.filter((payment) => payment.status === 'pending')
  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const queryClient = useQueryClient()

  const handlePaymentSuccess = (transaction: any) => {
    logger.info('Payment successful:', transaction)
    queryClient.invalidateQueries(['user-payments', user?.id])
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
                  {pendingPayments.length}
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
                  {totalPendingAmount.toLocaleString()} FCFA
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
                <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>{paymentMethods.length}</p>
              </div>
              <Wallet className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='pending' className='flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Paiements en attente
            {pendingPayments.length > 0 && (
              <Badge variant='destructive' className='ml-2'>
                {pendingPayments.length}
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

        {/* Pending Payments Tab */}
        <TabsContent value='pending' className='space-y-6'>
          {pendingPayments.length === 0 ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <Shield className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  Aucun paiement en attente
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Tous vos paiements sont à jour pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {pendingPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between gap-4 flex-wrap'>
                      <div className='flex-1 min-w-[220px]'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                          Paiement pour {payment.policyNumber}
                        </h3>
                        <p className='text-gray-600 dark:text-gray-400'>
                          {payment.paymentMethod} • Échéance le{' '}
                          {payment.paymentDate.toLocaleDateString('fr-FR')}
                        </p>
                        <div className='mt-2'>
                          <Badge variant='outline' className='uppercase'>
                            Statut: {payment.status}
                          </Badge>
                        </div>
                      </div>
                      <div className='text-right min-w-[200px]'>
                        <p className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                          {payment.amount.toLocaleString()} FCFA
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          Remboursement prévu pour la police {payment.policyStatus}
                        </p>
                      </div>
                      <div className='w-full sm:w-auto'>
                        <PaymentProcessor
                          userId={user.id}
                          amount={payment.amount}
                          currency='XOF'
                          description={`Paiement policier ${payment.policyNumber}`}
                          policyId={payment.policyId}
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
          <PaymentMethodsManager userId={user.id} />
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
