import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CONTRACT_TYPES } from '@/lib/zod-schemas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calculator, Shield } from 'lucide-react';
import { guaranteeService } from '@/features/tarification/services/guaranteeService';
import { pricingService } from '@/features/tarification/services/pricingService';
import type { Guarantee, InsurancePackage } from '@/types/tarification';

const offerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  contract_type: z.enum([CONTRACT_TYPES.TIERS_SIMPLE, CONTRACT_TYPES.TIERS_PLUS, CONTRACT_TYPES.TOUS_RISQUES]).default(CONTRACT_TYPES.TIERS_SIMPLE),
  price: z.number().min(0, 'Le prix doit être positif'),
  coverage: z.string().min(1, 'La description de la couverture est requise'),
  description: z.string().min(1, 'La description est requise'),
  deductible: z.number().min(0),
  maxCoverage: z.number().min(0),
  duration: z.number().min(1),
  conditions: z.string(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface OfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OfferFormData) => Promise<void>;
  initialData?: Partial<OfferFormData>;
  isSubmitting?: boolean;
}

export const OfferFormModal: React.FC<OfferFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [selectedGuaranteeIds, setSelectedGuaranteeIds] = useState<string[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [offerType, setOfferType] = useState<'TAILOR_MADE' | 'PACK'>('TAILOR_MADE');
  const [loadingGuarantees, setLoadingGuarantees] = useState(true);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: initialData?.name || '',
      contract_type: CONTRACT_TYPES.TIERS_SIMPLE,
      price: initialData?.price || 0,
      coverage: initialData?.coverage || '',
      description: initialData?.description || '',
      deductible: initialData?.deductible || 0,
      maxCoverage: initialData?.maxCoverage || 0,
      duration: initialData?.duration || 12,
      conditions: initialData?.conditions || '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingGuarantees(true);
        const [loadedGuarantees, loadedPackages] = await Promise.all([
          guaranteeService.getGuarantees(),
          guaranteeService.getPackages()
        ]);
        setGuarantees(loadedGuarantees);
        setPackages(loadedPackages);
      } catch (error) {
        console.error('Error loading guarantees:', error);
      } finally {
        setLoadingGuarantees(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (offerType === 'PACK' && selectedPackageId) {
      const pkg = packages.find(p => p.id === selectedPackageId);
      if (pkg) {
        setSelectedGuaranteeIds(pkg.guarantees);
        setFormDataFromGuarantees(pkg.guarantees);
      }
    }
  }, [selectedPackageId, offerType, packages, guarantees]);

  useEffect(() => {
    if (offerType === 'TAILOR_MADE') {
      const names = guarantees.filter(g => selectedGuaranteeIds.includes(g.id)).map(g => g.name);
      form.setValue('coverage', names.join(', '));
    }
  }, [selectedGuaranteeIds, guarantees, offerType, form]);

  useEffect(() => {
    if (offerType === 'TAILOR_MADE' && selectedGuaranteeIds.length > 0) {
      const totalPrice = guarantees
        .filter(g => selectedGuaranteeIds.includes(g.id))
        .reduce((sum, guarantee) => {
          const guaranteePrice = pricingService.getGuaranteePrice(guarantee);
          return sum + guaranteePrice;
        }, 0);

      form.setValue('price', totalPrice);
    } else if (offerType === 'TAILOR_MADE' && selectedGuaranteeIds.length === 0) {
      form.setValue('price', 0);
    }
  }, [selectedGuaranteeIds, guarantees, offerType, form]);

  const setFormDataFromGuarantees = (guaranteeIds: string[]) => {
    const names = guarantees.filter(g => guaranteeIds.includes(g.id)).map(g => g.name);
    form.setValue('coverage', names.join(', '));

    const pkg = packages.find(p => p.id === selectedPackageId);
    if (pkg) {
      form.setValue('price', pkg.basePrice || 0);
    }
  };

  const handlePackageChange = (packageId: string) => {
    setSelectedPackageId(packageId);
    if (packageId) {
      setOfferType('PACK');
    } else {
      setOfferType('TAILOR_MADE');
    }
  };

  const handleSubmit = async (data: OfferFormData) => {
    await onSubmit(data);
    onClose();
    form.reset();
    setSelectedGuaranteeIds([]);
    setSelectedPackageId('');
    setOfferType('TAILOR_MADE');
  };

  const filteredGuarantees = guarantees.filter(g => g.isActive);

  const pricing = React.useMemo(() => {
    if (offerType === 'PACK' && selectedPackageId) {
      const pkg = packages.find(p => p.id === selectedPackageId);
      return pkg ? pkg.totalPrice : 0;
    } else {
      return guarantees
        .filter(g => selectedGuaranteeIds.includes(g.id))
        .reduce((sum, guarantee) => {
          const guaranteePrice = pricingService.getGuaranteePrice(guarantee);
          return sum + guaranteePrice;
        }, 0);
    }
  }, [guarantees, selectedGuaranteeIds, offerType, selectedPackageId, packages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader className="sm:space-y-1 space-y-2 px-2 sm:px-0 pt-2 sm:pt-0">
          <DialogTitle className="text-xl sm:text-2xl">
            {initialData ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Définissez les détails de votre offre d'assurance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-6 px-2 sm:px-0 pb-2 sm:pb-0">

            {/* Basic Information */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 bg-gray-50/50">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Informations de base
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Informations générales sur l'offre
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-4 px-3 sm:px-6 space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Nom de l'offre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Assurance Tiers Simple" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description détaillée de l'offre..."
                          className="min-h-[70px] sm:min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Offer Type and Guarantees/Package Selection */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 bg-gray-50/50">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Type d'offre et Garanties
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Choisissez un package prédéfini ou créez une offre sur mesure
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-4 px-3 sm:px-6 space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm">Type d'offre</Label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="offerType"
                        value="TAILOR_MADE"
                        checked={offerType === 'TAILOR_MADE'}
                        onChange={() => {
                          setOfferType('TAILOR_MADE');
                          setSelectedPackageId('');
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Sur mesure</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="offerType"
                        value="PACK"
                        checked={offerType === 'PACK'}
                        onChange={() => setOfferType('PACK')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Package prédéfini</span>
                    </label>
                  </div>

                  {offerType === 'PACK' && (
                    <div>
                      <Label htmlFor="package" className="text-sm">Package *</Label>
                      <Select value={selectedPackageId} onValueChange={handlePackageChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un package" />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.filter(p => p.isActive).map(pkg => (
                            <SelectItem key={`package-${pkg.id}`} value={pkg.id}>
                              <div>
                                <div className="font-medium text-sm">{pkg.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {pkg.description} - {pkg.basePrice?.toLocaleString() || '0'} FCFA
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Garanties {offerType === 'PACK' ? '(incluses)' : '(à sélectionner)'}
                  </Label>
                  {loadingGuarantees ? (
                    <div className="text-sm text-muted-foreground py-2">Chargement...</div>
                  ) : (
                    <>
                      <div className="border rounded-lg p-2 sm:p-3 max-h-56 overflow-auto">
                        {filteredGuarantees.length === 0 && (
                          <div className="text-sm text-muted-foreground py-2">
                            Aucune garantie disponible.
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                          {filteredGuarantees.map(g => {
                            const checked = selectedGuaranteeIds.includes(g.id);
                            const disabled = offerType === 'PACK';
                            return (
                              <label
                                key={`guarantee-${g.id}`}
                                className={`flex items-center justify-between p-1.5 sm:p-2 rounded border cursor-pointer ${
                                  checked ? 'bg-blue-50 border-blue-200' :
                                  disabled ? 'bg-gray-50 border-gray-200' : 'bg-white hover:bg-gray-50'
                                } ${disabled ? 'opacity-60' : ''}`}
                              >
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={(e) => {
                                      if (!disabled) {
                                        setSelectedGuaranteeIds(prev =>
                                          e.target.checked
                                            ? [...prev, g.id]
                                            : prev.filter(id => id !== g.id)
                                        );
                                      }
                                    }}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs sm:text-sm font-medium truncate">{g.name}</div>
                                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{g.description}</div>
                                  </div>
                                </div>
                                <div className="text-[10px] sm:text-xs font-medium text-right shrink-0">
                                  {g.calculationMethod === 'FIXED_AMOUNT' && g.rate ?
                                    `+ ${g.rate.toLocaleString()} FCFA` :
                                    g.calculationMethod === 'RATE_ON_SI' || g.calculationMethod === 'RATE_ON_NEW_VALUE' ?
                                      `+ ${g.rate}%` :
                                      ''
                                  }
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground py-1">
                        {offerType === 'PACK' && selectedPackageId ? (
                          <>
                            <span>Prix: <span className="font-semibold text-blue-600">
                              {pricing.toLocaleString()} FCFA
                            </span></span>
                            <div className="text-[10px] sm:text-xs text-blue-600 mt-0.5">
                              {packages.find(p => p.id === selectedPackageId)?.guarantees.length} garanties
                            </div>
                          </>
                        ) : (
                          <span>Prix estimé: <span className="font-semibold text-blue-600">
                            {pricing.toLocaleString()} FCFA
                          </span></span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm">Prix (FCFA) *</FormLabel>
                          {offerType === 'TAILOR_MADE' && selectedGuaranteeIds.length > 0 && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              Auto
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className={offerType === 'TAILOR_MADE' && selectedGuaranteeIds.length > 0 ? 'pr-12 sm:pr-16' : ''}
                            />
                          </FormControl>
                          {offerType === 'TAILOR_MADE' && selectedGuaranteeIds.length > 0 && (
                            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1 text-muted-foreground">
                              <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                          )}
                        </div>
                        {offerType === 'TAILOR_MADE' && selectedGuaranteeIds.length > 0 && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            Basé sur {selectedGuaranteeIds.length} garantie{selectedGuaranteeIds.length > 1 ? 's' : ''}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Durée (mois) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="deductible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Franchise (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxCoverage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Plafond (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5000000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Détails couverture *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Résumé des garanties..."
                          className="min-h-[60px] sm:min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 bg-gray-50/50">
                <CardTitle className="text-sm sm:text-base">Conditions spéciales</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Conditions d'éligibilité et restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-4 px-3 sm:px-6">
                <FormField
                  control={form.control}
                  name="conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conditions d'éligibilité..."
                          className="min-h-[60px] sm:min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 px-2 sm:px-0 pb-2 sm:pb-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Créer l\'offre'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
