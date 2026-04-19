import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Database } from '@/types/database';

type PaymentRow = Database['public']['Tables']['payments']['Row'];
type PaymentMethodRow = Database['public']['Tables']['payment_methods']['Row'];

type DbPaymentMethodType = 'MOBILE_MONEY' | 'CREDIT_CARD' | 'BANK_TRANSFER';

type DbProvider = 'MTN' | 'ORANGE' | 'MOOV' | 'VISA' | 'MASTERCARD' | 'ECOBANK' | 'NSIA';

const METHOD_TYPE_MAP: Record<string, PaymentMethod['type']> = {
  MOBILE_MONEY: 'mobile_money',
  CREDIT_CARD: 'credit_card',
  BANK_TRANSFER: 'bank_transfer'
};

const METHOD_TYPE_TO_DB: Record<PaymentMethod['type'], DbPaymentMethodType> = {
  mobile_money: 'MOBILE_MONEY',
  credit_card: 'CREDIT_CARD',
  bank_transfer: 'BANK_TRANSFER'
};

const PROVIDER_MAP: Record<string, PaymentMethod['provider']> = {
  MTN: 'mtn',
  ORANGE: 'orange',
  MOOV: 'moov',
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  ECOBANK: 'ecobank',
  NSIA: 'nsia'
};

const PROVIDER_TO_DB: Record<PaymentMethod['provider'], DbProvider> = {
  mtn: 'MTN',
  orange: 'ORANGE',
  moov: 'MOOV',
  visa: 'VISA',
  mastercard: 'MASTERCARD',
  ecobank: 'ECOBANK',
  nsia: 'NSIA'
};

const DEFAULT_PROVIDER_BY_METHOD: Record<PaymentMethod['type'], PaymentMethod['provider']> = {
  mobile_money: 'mtn',
  credit_card: 'visa',
  bank_transfer: 'ecobank'
};

const PAYMENT_STATUS_MAP: Record<string, PaymentTransaction['status']> = {
  PENDING: 'pending',
  COMPLETED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const STATUS_TO_DB: Record<PaymentTransaction['status'], PaymentRow['status']> = {
  pending: 'PENDING',
  succeeded: 'COMPLETED',
  failed: 'FAILED',
  refunded: 'REFUNDED',
  processing: 'PENDING',
  cancelled: 'FAILED'
};

const createEmptyStats = (): PaymentStats => ({
  totalRevenue: 0,
  monthlyRevenue: 0,
  averageTransactionValue: 0,
  successRate: 0,
  byMethod: {
    mobile_money: { count: 0, amount: 0 },
    credit_card: { count: 0, amount: 0 },
    bank_transfer: { count: 0, amount: 0 }
  },
  byProvider: {},
  refunds: {
    count: 0,
    amount: 0,
    rate: 0
  }
});

const EMPTY_STATS = createEmptyStats();

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

const mapDbMethodType = (value?: string): PaymentMethod['type'] => {
  if (!value) return 'mobile_money';
  return METHOD_TYPE_MAP[value.toUpperCase()] ?? 'mobile_money';
};

const mapMethodToDb = (type: PaymentMethod['type']): DbPaymentMethodType => METHOD_TYPE_TO_DB[type];

const mapDbProvider = (value?: string): PaymentMethod['provider'] => {
  if (!value) return 'visa';
  return PROVIDER_MAP[value.toUpperCase()] ?? 'visa';
};

const mapProviderToDb = (provider: PaymentMethod['provider']): DbProvider => PROVIDER_TO_DB[provider];

const mapPaymentMethodRow = (row: PaymentMethodRow): PaymentMethod => ({
  id: row.id,
  type: mapDbMethodType(row.type),
  provider: mapDbProvider(row.provider),
  last4: row.last4 ?? undefined,
  expiryMonth: row.expiry_month ?? undefined,
  expiryYear: row.expiry_year ?? undefined,
  isDefault: row.is_default,
  isActive: row.is_active,
  createdAt: row.created_at
});

const buildMethodPayload = (userId: string, methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'>) => ({
  user_id: userId,
  type: mapMethodToDb(methodData.type),
  provider: mapProviderToDb(methodData.provider),
  last4: methodData.last4 ?? null,
  expiry_month: methodData.expiryMonth ?? null,
  expiry_year: methodData.expiryYear ?? null,
  is_default: methodData.isDefault
});

const mapStatusToClient = (status?: string): PaymentTransaction['status'] => {
  if (!status) return 'pending';
  return PAYMENT_STATUS_MAP[status.toUpperCase()] ?? 'pending';
};

const mapStatusToDb = (status?: PaymentTransaction['status']): PaymentRow['status'] | null => {
  if (!status) return null;
  return STATUS_TO_DB[status];
};

const mapPaymentRowToTransaction = (row: PaymentRow): PaymentTransaction => {
  const method = mapDbMethodType(row.payment_method ?? undefined);
  const provider = DEFAULT_PROVIDER_BY_METHOD[method];
  const status = mapStatusToClient(row.status);
  const policyStatus = (row as any).policies?.status;
  const policyNumber = (row as any).policies?.policy_number;

  return {
    id: row.id,
    userId: row.user_id,
    policyId: row.policy_id,
    amount: Number(row.amount) || 0,
    currency: 'XOF',
    method,
    provider,
    status,
    reference: row.transaction_id || row.id,
    description: `Paiement police ${policyNumber ?? row.policy_id ?? ''}`,
    metadata: {
      policyNumber,
      policyStatus
    },
    createdAt: row.payment_date,
    processedAt: row.updated_at,
    failureReason: status === 'failed' ? 'Échec du paiement' : undefined
  };
};

const computeStatsFromRows = (rows: PaymentRow[]): PaymentStats => {
  if (!rows?.length) return EMPTY_STATS;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let totalRevenue = 0;
  let monthlyRevenue = 0;
  let totalAmount = 0;
  let completedCount = 0;
  let refundCount = 0;
  let refundAmount = 0;
  const byMethod = {
    mobile_money: { count: 0, amount: 0 },
    credit_card: { count: 0, amount: 0 },
    bank_transfer: { count: 0, amount: 0 }
  };
  const byProvider: Record<string, { count: number; amount: number }> = {};

  rows.forEach((row) => {
    const status = row.status;
    const amount = Number(row.amount) || 0;
    const method = mapDbMethodType(row.payment_method ?? undefined);
    const provider = DEFAULT_PROVIDER_BY_METHOD[method];

    totalAmount += amount;
    byMethod[method].count += 1;
    byMethod[method].amount += amount;

    if (!byProvider[provider]) {
      byProvider[provider] = { count: 0, amount: 0 };
    }

    byProvider[provider].count += 1;
    byProvider[provider].amount += amount;

    if (status === 'COMPLETED') {
      totalRevenue += amount;
      completedCount += 1;
      const paymentDate = new Date(row.payment_date);
      if (paymentDate >= startOfMonth) {
        monthlyRevenue += amount;
      }
    }

    if (status === 'REFUNDED') {
      refundCount += 1;
      refundAmount += amount;
    }
  });

  const successRate = rows.length ? Math.round((completedCount / rows.length) * 10000) / 100 : 0;
  const averageTransactionValue = rows.length ? Math.round(totalAmount / rows.length) : 0;
  const refundRate = rows.length ? Math.round((refundCount / rows.length) * 10000) / 100 : 0;

  return {
    totalRevenue,
    monthlyRevenue,
    averageTransactionValue,
    successRate,
    byMethod,
    byProvider,
    refunds: {
      count: refundCount,
      amount: refundAmount,
      rate: refundRate
    }
  };
};

// API Functions
export const fetchPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('payment_methods')
    .select(
      'id, type, provider, last4, expiry_month, expiry_year, is_default, is_active, created_at'
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('fetchPaymentMethods failed', { error, userId });
    return [];
  }

  return (data ?? []).map(mapPaymentMethodRow);
};

export const createPaymentMethod = async (userId: string, methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'>): Promise<PaymentMethod> => {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert(buildMethodPayload(userId, methodData))
    .select('*')
    .single();

  if (error || !data) {
    logger.error('createPaymentMethod failed', { error, userId, methodData });
    throw error ?? new Error('Impossible de créer la méthode de paiement');
  }

  return mapPaymentMethodRow(data);
};

export const updatePaymentMethod = async (methodId: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  const payload: Record<string, any> = {};
  if (updates.type) payload.type = mapMethodToDb(updates.type);
  if (updates.provider) payload.provider = mapProviderToDb(updates.provider);
  if (updates.last4 !== undefined) payload.last4 = updates.last4;
  if (updates.expiryMonth !== undefined) payload.expiry_month = updates.expiryMonth;
  if (updates.expiryYear !== undefined) payload.expiry_year = updates.expiryYear;
  if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

  const { data, error } = await supabase
    .from('payment_methods')
    .update(payload)
    .eq('id', methodId)
    .select('*')
    .single();

  if (error || !data) {
    logger.error('updatePaymentMethod failed', { error, methodId, updates });
    throw error ?? new Error('Impossible de mettre à jour la méthode de paiement');
  }

  return mapPaymentMethodRow(data);
};

export const deletePaymentMethod = async (methodId: string): Promise<void> => {
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_active: false, is_default: false })
    .eq('id', methodId);

  if (error) {
    logger.error('deletePaymentMethod failed', { error, methodId });
    throw error;
  }
};

export const setDefaultPaymentMethod = async (userId: string, methodId: string): Promise<void> => {
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', methodId)
    .eq('user_id', userId);

  if (error) {
    logger.error('setDefaultPaymentMethod failed', { error, userId, methodId });
    throw error;
  }
};

export const fetchTransactions = async (filters?: {
  userId?: string;
  status?: PaymentTransaction['status'];
  method?: PaymentTransaction['method'];
  startDate?: string;
  endDate?: string;
}): Promise<PaymentTransaction[]> => {
  const query = supabase
    .from('payments')
    .select(`
      id,
      amount,
      status,
      payment_date,
      payment_method,
      transaction_id,
      policy_id,
      user_id,
      policies:policy_id (
        policy_number,
        status
      )
    `)
    .order('payment_date', { ascending: false })
    .limit(200);

  if (filters?.userId) query.eq('user_id', filters.userId);
  if (filters?.status) {
    const statusFilter = mapStatusToDb(filters.status);
    if (statusFilter) query.eq('status', statusFilter);
  }

  if (filters?.method) {
    query.eq('payment_method', mapMethodToDb(filters.method));
  }

  if (filters?.startDate) query.gte('payment_date', filters.startDate);
  if (filters?.endDate) query.lte('payment_date', filters.endDate);

  const { data, error } = await query;
  if (error) {
    logger.error('fetchTransactions failed', { error, filters });
    return [];
  }

  return (data ?? []).map(mapPaymentRowToTransaction);
};

export const createPaymentIntent = async (intentData: Omit<PaymentIntent, 'id' | 'status' | 'expiresAt' | 'clientSecret'>): Promise<PaymentIntent> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const intent: PaymentIntent = {
    ...intentData,
    id: `pi_${Date.now()}`,
    status: 'created',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).slice(2, 10)}`
  };

  return intent;
};

export const processPayment = async (paymentData: {
  intentId: string;
  methodId: string;
  saveMethod?: boolean;
}): Promise<PaymentTransaction> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const transaction: PaymentTransaction = {
    id: `txn_${Date.now()}`,
    userId: 'current_user',
    amount: 125000,
    currency: 'XOF',
    method: 'mobile_money',
    provider: 'mtn',
    status: Math.random() > 0.1 ? 'succeeded' : 'failed',
    reference: `TXN${Date.now()}`,
    description: 'Paiement assurance automobile',
    metadata: { intentId: paymentData.intentId },
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    failureReason: Math.random() > 0.1 ? undefined : 'Transaction échouée - Veuillez réessayer'
  };

  return transaction;
};

export const fetchPaymentStats = async (userId?: string): Promise<PaymentStats> => {
  try {
    const query = supabase
      .from('payments')
      .select('id, amount, status, payment_date, payment_method')
      .order('payment_date', { ascending: false });

    if (userId) query.eq('user_id', userId);

    const { data, error } = await query;

    if (error) {
      logger.error('fetchPaymentStats failed', { error, userId });
      return EMPTY_STATS;
    }

    return computeStatsFromRows(data ?? []);
  } catch (error) {
    logger.error('fetchPaymentStats exception', error);
    return EMPTY_STATS;
  }
};

// React Query Hooks
export const usePaymentMethods = (userId: string) => {
  return useQuery({
    queryKey: ['payment-methods', userId],
    queryFn: () => fetchPaymentMethods(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, methodData }: { userId: string; methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'> }) =>
      createPaymentMethod(userId, methodData),
    onSuccess: (_data, variables) => {
      toast.success('Méthode de paiement ajoutée avec succès');
      queryClient.invalidateQueries(['payment-methods', variables?.userId]);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout de la méthode de paiement');
    }
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
    }
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
    }
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, methodId }: { userId: string; methodId: string }) =>
      setDefaultPaymentMethod(userId, methodId),
    onSuccess: (_data, variables) => {
      toast.success('Méthode de paiement définie par défaut avec succès');
      queryClient.invalidateQueries(['payment-methods', variables?.userId]);
    },
    onError: (error) => {
      toast.error('Erreur lors de la définition de la méthode de paiement par défaut');
    }
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: createPaymentIntent,
    onError: (error) => {
      toast.error('Erreur lors de la création de l\'intention de paiement');
    }
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
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
    },
    onError: (error) => {
      toast.error('Erreur lors du traitement du paiement');
    }
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
    enabled: !!filters?.userId,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

export const usePaymentStats = (userId?: string) => {
  return useQuery({
    queryKey: ['payment-stats', userId],
    queryFn: () => fetchPaymentStats(userId),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
