import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Building2
} from 'lucide-react';
import { PaymentMethodsManager } from '../components/PaymentMethodsManager';
import { PaymentProcessor, PaymentHistory } from '../components/PaymentProcessor';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('methods');

  const mockQuote = {
    id: 'quote-123',
    amount: 125000,
    currency: 'XOF' as const,
    description: 'Paiement police assurance automobile',
    insurer: 'NSIA Assurance',
    coverage: 'Tous risques',
    validity: '1 an'
  };

  const handlePaymentSuccess = (transaction: any) => {
    console.log('Payment successful:', transaction);
    // In real implementation, this would update the quote/policy status
    // and redirect to confirmation page
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
    // In real implementation, this would show error message
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Connexion requise
          </h3>
          <p className="text-muted-foreground">
            Vous devez être connecté pour accéder à la page de paiement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Paiements</h1>
        <p className="text-muted-foreground">
          Gérez vos méthodes de paiement et suivez vos transactions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Méthodes actives</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions ce mois</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold text-foreground">92%</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dépenses ce mois</p>
                <p className="text-2xl font-bold text-foreground">1.5M FCFA</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="methods" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Méthodes</span>
          </TabsTrigger>
          <TabsTrigger value="pay" className="flex items-center space-x-2">
            <Wallet className="h-4 w-4" />
            <span>Payer</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Historique</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-6">
          <PaymentMethodsManager userId={user.id} />
        </TabsContent>

        <TabsContent value="pay" className="space-y-6">
          <PaymentProcessor
            userId={user.id}
            amount={mockQuote.amount}
            currency={mockQuote.currency}
            description={mockQuote.description}
            quoteId={mockQuote.id}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PaymentHistory userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsPage;
