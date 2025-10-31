import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import {
  PaymentMethod,
  PaymentTransaction,
  usePaymentMethods,
  useCreatePaymentIntent,
  useProcessPayment,
  useTransactions,
  usePaymentStats
} from '../services/paymentService';

interface PaymentProcessorProps {
  userId: string;
  amount: number;
  currency?: 'XOF' | 'USD' | 'EUR';
  description: string;
  quoteId?: string;
  policyId?: string;
  onSuccess?: (transaction: PaymentTransaction) => void;
  onError?: (error: Error) => void;
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'mtn':
    case 'orange':
    case 'moov':
      return <Smartphone className="h-5 w-5" />;
    case 'visa':
    case 'mastercard':
      return <CreditCard className="h-5 w-5" />;
    case 'ecobank':
    case 'nsia':
      return <Building2 className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

const getProviderName = (provider: string) => {
  switch (provider) {
    case 'mtn': return 'MTN Mobile Money';
    case 'orange': return 'Orange Money';
    case 'moov': return 'Moov Money';
    case 'visa': return 'Visa';
    case 'mastercard': return 'Mastercard';
    case 'ecobank': return 'Ecobank';
    case 'nsia': return 'NSIA Banque';
    default: return provider;
  }
};

const getStatusIcon = (status: PaymentTransaction['status']) => {
  switch (status) {
    case 'succeeded':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'processing':
      return <Clock className="h-5 w-5 text-blue-600" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-gray-600" />;
    case 'refunded':
      return <CheckCircle className="h-5 w-5 text-purple-600" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusColor = (status: PaymentTransaction['status']) => {
  switch (status) {
    case 'succeeded':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: PaymentTransaction['status']) => {
  switch (status) {
    case 'succeeded': return 'Réussi';
    case 'failed': return 'Échoué';
    case 'processing': return 'En cours';
    case 'pending': return 'En attente';
    case 'cancelled': return 'Annulé';
    case 'refunded': return 'Remboursé';
    default: return status;
  }
};

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  userId,
  amount,
  currency = 'XOF',
  description,
  quoteId,
  policyId,
  onSuccess,
  onError
}) => {
  const { data: paymentMethods } = usePaymentMethods(userId);
  const createIntent = useCreatePaymentIntent();
  const processPayment = useProcessPayment();

  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  const defaultMethod = paymentMethods?.find(m => m.isDefault);
  const hasMethods = paymentMethods && paymentMethods.length > 0;

  const handlePayment = async () => {
    if (!selectedMethodId && !defaultMethod) {
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment intent
      const intent = await createIntent.mutateAsync({
        amount,
        currency,
        description,
        customerEmail: 'user@example.com', // Would come from user context
        paymentMethods: ['mobile_money', 'credit_card', 'bank_transfer'],
        metadata: { quoteId, policyId }
      });

      setPaymentIntent(intent);

      // Process payment
      const transaction = await processPayment.mutateAsync({
        intentId: intent.id,
        methodId: selectedMethodId || defaultMethod?.id || '',
        saveMethod: false
      });

      setShowConfirmation(false);
      setIsProcessing(false);
      onSuccess?.(transaction);
    } catch (error) {
      setIsProcessing(false);
      onError?.(error as Error);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!hasMethods) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune méthode de paiement
          </h3>
          <p className="text-muted-foreground mb-4">
            Vous devez ajouter une méthode de paiement pour continuer
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Paiement</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {formatAmount(amount, currency)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-400 font-medium">{description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Méthode de paiement
            </label>
            <div className="space-y-3">
              {paymentMethods?.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethodId === method.id || (defaultMethod?.id === method.id && !selectedMethodId)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethodId(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getProviderIcon(method.provider)}
                    </div>
                    <div>
                      <p className="font-medium">{getProviderName(method.provider)}</p>
                      {method.last4 && (
                        <p className="text-sm text-muted-foreground">
                          {method.type === 'credit_card' ? `**** **** **** ${method.last4}` : `**** ${method.last4}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.isDefault && (
                      <Badge variant="default" className="bg-blue-600">
                        Défaut
                      </Badge>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethodId === method.id || (defaultMethod?.id === method.id && !selectedMethodId)
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethodId === method.id || (defaultMethod?.id === method.id && !selectedMethodId) && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-400">Paiement sécurisé</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vos informations de paiement sont cryptées et sécurisées. Nous ne stockons jamais vos données bancaires.
            </p>
          </div>

          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                disabled={isProcessing || (!selectedMethodId && !defaultMethod)}
              >
                {isProcessing ? 'Traitement en cours...' : `Payer ${formatAmount(amount, currency)}`}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer le paiement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Vous êtes sur le point de payer {formatAmount(amount, currency)} pour {description}.
                  </AlertDescription>
                </Alert>

                {selectedMethodId ? (
                  <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {getProviderIcon(paymentMethods?.find(m => m.id === selectedMethodId)?.provider || '')}
                    <div>
                      <p className="font-medium">
                        {getProviderName(paymentMethods?.find(m => m.id === selectedMethodId)?.provider || '')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {paymentMethods?.find(m => m.id === selectedMethodId)?.last4}
                      </p>
                    </div>
                  </div>
                ) : defaultMethod && (
                  <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {getProviderIcon(defaultMethod.provider)}
                    <div>
                      <p className="font-medium">{getProviderName(defaultMethod.provider)}</p>
                      <p className="text-sm text-muted-foreground">{defaultMethod.last4}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handlePayment} disabled={isProcessing}>
                    {isProcessing ? 'Traitement...' : 'Confirmer le paiement'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

// Payment History Component
interface PaymentHistoryProps {
  userId: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userId }) => {
  const { data: transactions, isLoading } = useTransactions({ userId });
  const { data: stats } = usePaymentStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenu total</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-CI', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenu mensuel</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-CI', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(stats.monthlyRevenue)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de succès</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Panier moyen</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-CI', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(stats.averageTransactionValue)}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historique des transactions</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions?.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {getProviderName(transaction.provider)} • {transaction.reference}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString('fr-FR')} • {new Date(transaction.createdAt).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('fr-CI', {
                      style: 'currency',
                      currency: transaction.currency,
                      minimumFractionDigits: 0
                    }).format(transaction.amount)}
                  </p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {transactions?.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune transaction trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for trending icon
const TrendingUp = () => (
  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);