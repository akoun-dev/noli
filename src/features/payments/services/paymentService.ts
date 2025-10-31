import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface PaymentMethod {
  id: string;
  type: 'mobile_money' | 'credit_card' | 'bank_transfer';
  provider: 'mtn' | 'orange' | 'moov' | 'visa' | 'mastercard' | 'ecobank' | 'nsia';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  quoteId?: string;
  policyId?: string;
  amount: number;
  currency: 'XOF' | 'USD' | 'EUR';
  method: PaymentMethod['type'];
  provider: PaymentMethod['provider'];
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: 'XOF' | 'USD' | 'EUR';
  description: string;
  customerEmail: string;
  paymentMethods: PaymentMethod['type'][];
  expiresAt: string;
  status: 'created' | 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'cancelled';
  clientSecret?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason: string;
  description?: string;
}

export interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageTransactionValue: number;
  successRate: number;
  byMethod: {
    mobile_money: { count: number; amount: number };
    credit_card: { count: number; amount: number };
    bank_transfer: { count: number; amount: number };
  };
  byProvider: Record<string, { count: number; amount: number }>;
  refunds: {
    count: number;
    amount: number;
    rate: number;
  };
}

// Mock data
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'mobile_money',
    provider: 'mtn',
    last4: '1234',
    isDefault: true,
    isActive: true,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    type: 'credit_card',
    provider: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 25,
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    type: 'mobile_money',
    provider: 'orange',
    last4: '5678',
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-08'
  }
];

const mockTransactions: PaymentTransaction[] = [
  {
    id: '1',
    userId: '1',
    quoteId: '1',
    amount: 125000,
    currency: 'XOF',
    method: 'mobile_money',
    provider: 'mtn',
    status: 'succeeded',
    reference: 'TXN123456789',
    description: 'Paiement police assurance',
    metadata: { policyNumber: 'POL-2024-001' },
    createdAt: '2024-01-20T10:30:00Z',
    processedAt: '2024-01-20T10:32:00Z'
  },
  {
    id: '2',
    userId: '2',
    policyId: '2',
    amount: 89000,
    currency: 'XOF',
    method: 'credit_card',
    provider: 'visa',
    status: 'succeeded',
    reference: 'TXN987654321',
    description: 'Renouvellement assurance',
    createdAt: '2024-01-19T14:15:00Z',
    processedAt: '2024-01-19T14:18:00Z'
  },
  {
    id: '3',
    userId: '3',
    quoteId: '3',
    amount: 156000,
    currency: 'XOF',
    method: 'mobile_money',
    provider: 'orange',
    status: 'failed',
    reference: 'TXN456789123',
    description: 'Paiement devis initial',
    createdAt: '2024-01-18T16:45:00Z',
    failureReason: 'Solde insuffisant'
  }
];

const mockStats: PaymentStats = {
  totalRevenue: 45600000,
  monthlyRevenue: 3800000,
  averageTransactionValue: 125000,
  successRate: 92.5,
  byMethod: {
    mobile_money: { count: 234, amount: 28500000 },
    credit_card: { count: 123, amount: 15600000 },
    bank_transfer: { count: 45, amount: 1500000 }
  },
  byProvider: {
    mtn: { count: 145, amount: 18200000 },
    orange: { count: 89, amount: 10300000 },
    visa: { count: 98, amount: 12500000 },
    mastercard: { count: 25, amount: 3100000 },
    ecobank: { count: 32, amount: 1200000 },
    nsia: { count: 13, amount: 300000 }
  },
  refunds: {
    count: 12,
    amount: 1250000,
    rate: 2.7
  }
};

// API Functions
export const fetchPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return mockPaymentMethods.filter(method => method.isActive);
};

export const createPaymentMethod = async (userId: string, methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'>): Promise<PaymentMethod> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const newMethod: PaymentMethod = {
    ...methodData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    isActive: true
  };

  mockPaymentMethods.push(newMethod);
  return newMethod;
};

export const updatePaymentMethod = async (methodId: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const methodIndex = mockPaymentMethods.findIndex(m => m.id === methodId);
  if (methodIndex === -1) {
    throw new Error('Méthode de paiement non trouvée');
  }

  mockPaymentMethods[methodIndex] = { ...mockPaymentMethods[methodIndex], ...updates };
  return mockPaymentMethods[methodIndex];
};

export const deletePaymentMethod = async (methodId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  const methodIndex = mockPaymentMethods.findIndex(m => m.id === methodId);
  if (methodIndex === -1) {
    throw new Error('Méthode de paiement non trouvée');
  }

  mockPaymentMethods[methodIndex].isActive = false;
};

export const setDefaultPaymentMethod = async (userId: string, methodId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  mockPaymentMethods.forEach(method => {
    method.isDefault = method.id === methodId;
  });
};

export const createPaymentIntent = async (intentData: Omit<PaymentIntent, 'id' | 'status' | 'expiresAt' | 'clientSecret'>): Promise<PaymentIntent> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const intent: PaymentIntent = {
    ...intentData,
    id: `pi_${Date.now()}`,
    status: 'created',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
  };

  return intent;
};

export const processPayment = async (paymentData: {
  intentId: string;
  methodId: string;
  saveMethod?: boolean;
}): Promise<PaymentTransaction> => {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const intent = mockPaymentMethods.find(m => m.id === paymentData.methodId);
  if (!intent) {
    throw new Error('Méthode de paiement non trouvée');
  }

  const transaction: PaymentTransaction = {
    id: `txn_${Date.now()}`,
    userId: 'current_user', // Would come from auth context
    amount: 125000, // Would come from intent
    currency: 'XOF',
    method: intent.type,
    provider: intent.provider,
    status: Math.random() > 0.1 ? 'succeeded' : 'failed', // 90% success rate
    reference: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
    description: 'Paiement assurance automobile',
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString()
  };

  if (transaction.status === 'failed') {
    transaction.failureReason = 'Transaction échouée - Veuillez réessayer';
  }

  mockTransactions.push(transaction);
  return transaction;
};

export const fetchTransactions = async (filters?: {
  userId?: string;
  status?: PaymentTransaction['status'];
  method?: PaymentTransaction['method'];
  startDate?: string;
  endDate?: string;
}): Promise<PaymentTransaction[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));

  let filtered = [...mockTransactions];

  if (filters?.userId) {
    filtered = filtered.filter(t => t.userId === filters.userId);
  }

  if (filters?.status) {
    filtered = filtered.filter(t => t.status === filters.status);
  }

  if (filters?.method) {
    filtered = filtered.filter(t => t.method === filters.method);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(filters.startDate!));
  }

  if (filters?.endDate) {
    filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(filters.endDate!));
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const refundTransaction = async (refundData: RefundRequest): Promise<PaymentTransaction> => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const transactionIndex = mockTransactions.findIndex(t => t.id === refundData.transactionId);
  if (transactionIndex === -1) {
    throw new Error('Transaction non trouvée');
  }

  const transaction = mockTransactions[transactionIndex];
  if (transaction.status !== 'succeeded') {
    throw new Error('Seules les transactions réussies peuvent être remboursées');
  }

  const refundAmount = refundData.amount || transaction.amount;

  // Create refund transaction
  const refundTransaction: PaymentTransaction = {
    ...transaction,
    id: `txn_refund_${Date.now()}`,
    status: 'refunded',
    description: `Remboursement: ${refundData.reason}`,
    refundAmount,
    refundReason: refundData.reason,
    createdAt: new Date().toISOString()
  };

  mockTransactions.push(refundTransaction);
  return refundTransaction;
};

export const fetchPaymentStats = async (): Promise<PaymentStats> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockStats;
};

export const validatePaymentMethod = async (methodData: {
  type: PaymentMethod['type'];
  provider: PaymentMethod['provider'];
  token: string;
}): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock validation - in real implementation, this would call the payment provider
  return Math.random() > 0.1; // 90% success rate
};

// React Query Hooks
export const usePaymentMethods = (userId: string) => {
  return useQuery({
    queryKey: ['payment-methods', userId],
    queryFn: () => fetchPaymentMethods(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, methodData }: { userId: string; methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'> }) =>
      createPaymentMethod(userId, methodData),
    onSuccess: () => {
      toast.success('Méthode de paiement ajoutée avec succès');
      queryClient.invalidateQueries(['payment-methods']);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout de la méthode de paiement');
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ methodId, updates }: { methodId: string; updates: Partial<PaymentMethod> }) =>
      updatePaymentMethod(methodId, updates),
    onSuccess: () => {
      toast.success('Méthode de paiement mise à jour avec succès');
      queryClient.invalidateQueries(['payment-methods']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour de la méthode de paiement');
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      toast.success('Méthode de paiement supprimée avec succès');
      queryClient.invalidateQueries(['payment-methods']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression de la méthode de paiement');
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, methodId }: { userId: string; methodId: string }) =>
      setDefaultPaymentMethod(userId, methodId),
    onSuccess: () => {
      toast.success('Méthode de paiement définie par défaut avec succès');
      queryClient.invalidateQueries(['payment-methods']);
    },
    onError: (error) => {
      toast.error('Erreur lors de la définition de la méthode de paiement par défaut');
    },
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: createPaymentIntent,
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'intention de paiement');
    },
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processPayment,
    onSuccess: (transaction) => {
      if (transaction.status === 'succeeded') {
        toast.success('Paiement effectué avec succès');
      } else {
        toast.error('Le paiement a échoué');
      }
      queryClient.invalidateQueries(['payment-transactions']);
      queryClient.invalidateQueries(['payment-stats']);
    },
    onError: (error) => {
      toast.error('Erreur lors du traitement du paiement');
    },
  });
};

export const useTransactions = (filters?: {
  userId?: string;
  status?: PaymentTransaction['status'];
  method?: PaymentTransaction['method'];
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['payment-transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRefundTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refundTransaction,
    onSuccess: () => {
      toast.success('Remboursement traité avec succès');
      queryClient.invalidateQueries(['payment-transactions']);
      queryClient.invalidateQueries(['payment-stats']);
    },
    onError: (error) => {
      toast.error('Erreur lors du traitement du remboursement');
    },
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: ['payment-stats'],
    queryFn: fetchPaymentStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useValidatePaymentMethod = () => {
  return useMutation({
    mutationFn: validatePaymentMethod,
    onError: (error) => {
      toast.error('Erreur lors de la validation de la méthode de paiement');
    },
  });
};