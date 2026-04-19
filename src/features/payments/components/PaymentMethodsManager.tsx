import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CreditCard,
  Smartphone,
  Building2,
  Plus,
  Trash2,
  Star,
  Edit,
  Check,
  X,
  AlertCircle,
  Shield
} from 'lucide-react';
import {
  PaymentMethod,
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod
} from '../services/paymentService';

interface PaymentMethodsManagerProps {
  userId: string;
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

const getMethodName = (type: string) => {
  switch (type) {
    case 'mobile_money': return 'Mobile Money';
    case 'credit_card': return 'Carte Bancaire';
    case 'bank_transfer': return 'Virement Bancaire';
    default: return type;
  }
};

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({ userId }) => {
  const { data: paymentMethods, isLoading } = usePaymentMethods(userId);
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const setDefaultMethod = useSetDefaultPaymentMethod();

  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const handleAddMethod = async (methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'>) => {
    await createMethod.mutateAsync({ userId, methodData });
    setIsAddingMethod(false);
  };

  const handleUpdateMethod = async (methodId: string, updates: Partial<PaymentMethod>) => {
    await updateMethod.mutateAsync({ methodId, updates });
    setEditingMethod(null);
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      await deleteMethod.mutateAsync(methodId);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    await setDefaultMethod.mutateAsync({ userId, methodId });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Méthodes de paiement</h3>
          <p className="text-sm text-muted-foreground">Gérez vos méthodes de paiement enregistrées</p>
        </div>
        <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une méthode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une méthode de paiement</DialogTitle>
            </DialogHeader>
            <PaymentMethodForm
              onSubmit={handleAddMethod}
              onCancel={() => setIsAddingMethod(false)}
              isLoading={createMethod.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {paymentMethods?.map((method) => (
          <Card key={method.id} className={method.isDefault ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {getProviderIcon(method.provider)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-foreground">{getProviderName(method.provider)}</h4>
                      {method.isDefault && (
                        <Badge variant="default" className="bg-blue-600 dark:bg-blue-700">
                          <Star className="h-3 w-3 mr-1" />
                          Défaut
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{getMethodName(method.type)}</p>
                    {method.last4 && (
                      <p className="text-xs text-muted-foreground">
                        {method.type === 'credit_card' ? `**** **** **** ${method.last4}` : `**** ${method.last4}`}
                      </p>
                    )}
                    {method.type === 'credit_card' && method.expiryMonth && method.expiryYear && (
                      <p className="text-xs text-muted-foreground">
                        Expire: {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear.toString().slice(-2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={setDefaultMethod.isPending}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Définir par défaut
                    </Button>
                  )}

                  <Dialog open={editingMethod?.id === method.id} onOpenChange={(open) => !open && setEditingMethod(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMethod(method)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier la méthode de paiement</DialogTitle>
                      </DialogHeader>
                      <PaymentMethodForm
                        method={method}
                        onSubmit={(updates) => handleUpdateMethod(method.id, updates)}
                        onCancel={() => setEditingMethod(null)}
                        isLoading={updateMethod.isPending}
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMethod(method.id)}
                    disabled={deleteMethod.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentMethods?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune méthode de paiement
            </h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez une méthode de paiement pour faciliter vos transactions futures
            </p>
            <Button onClick={() => setIsAddingMethod(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une méthode
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface PaymentMethodFormProps {
  method?: PaymentMethod;
  onSubmit: (data: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ method, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    type: method?.type || 'mobile_money',
    provider: method?.provider || 'mtn',
    last4: method?.last4 || '',
    expiryMonth: method?.expiryMonth || '',
    expiryYear: method?.expiryYear || '',
    isDefault: method?.isDefault || false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: Omit<PaymentMethod, 'id' | 'createdAt' | 'isActive'> = {
      type: formData.type as PaymentMethod['type'],
      provider: formData.provider as PaymentMethod['provider'],
      isDefault: formData.isDefault
    };

    if (formData.type === 'credit_card') {
      submitData.last4 = formData.last4;
      submitData.expiryMonth = parseInt(formData.expiryMonth);
      submitData.expiryYear = parseInt(formData.expiryYear);
    } else {
      submitData.last4 = formData.last4;
    }

    await onSubmit(submitData);
  };

  const mobileMoneyProviders = [
    { value: 'mtn', label: 'MTN Mobile Money' },
    { value: 'orange', label: 'Orange Money' },
    { value: 'moov', label: 'Moov Money' }
  ];

  const creditCardProviders = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' }
  ];

  const bankProviders = [
    { value: 'ecobank', label: 'Ecobank' },
    { value: 'nsia', label: 'NSIA Banque' }
  ];

  const getProviders = (type: string) => {
    switch (type) {
      case 'mobile_money': return mobileMoneyProviders;
      case 'credit_card': return creditCardProviders;
      case 'bank_transfer': return bankProviders;
      default: return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Type de paiement
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            type: e.target.value as PaymentMethod['type'],
            provider: getProviders(e.target.value)[0]?.value || ''
          }))}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        >
          <option value="mobile_money">Mobile Money</option>
          <option value="credit_card">Carte Bancaire</option>
          <option value="bank_transfer">Virement Bancaire</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Fournisseur
        </label>
        <select
          value={formData.provider}
          onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        >
          {getProviders(formData.type).map(provider => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {formData.type === 'credit_card' ? 'Numéro de carte' : 'Numéro de téléphone'}
        </label>
        <input
          type="text"
          value={formData.last4}
          onChange={(e) => setFormData(prev => ({ ...prev, last4: e.target.value }))}
          placeholder={formData.type === 'credit_card' ? '**** **** **** 4242' : '07 12 34 56 78'}
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        />
      </div>

      {formData.type === 'credit_card' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mois d'expiration
            </label>
            <select
              value={formData.expiryMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryMonth: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            >
              <option value="">Mois</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Année d'expiration
            </label>
            <select
              value={formData.expiryYear}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryYear: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            >
              <option value="">Année</option>
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
          className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
          disabled={isLoading}
        />
        <label htmlFor="isDefault" className="text-sm text-foreground">
          Définir comme méthode de paiement par défaut
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
};