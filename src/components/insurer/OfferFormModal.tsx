import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { X } from 'lucide-react';

const offerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['Tiers Simple', 'Tiers +', 'Tous Risques']),
  price: z.number().min(0, 'Le prix doit être positif'),
  coverage: z.string().min(1, 'La description de la couverture est requise'),
  description: z.string().min(1, 'La description est requise'),
  deductible: z.number().min(0),
  maxCoverage: z.number().min(0),
  duration: z.number().min(1),
  features: z.array(z.string()),
  conditions: z.string(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface OfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OfferFormData) => void;
  initialData?: Partial<OfferFormData>;
}

const INSURANCE_TYPES = [
  { value: 'Tiers Simple', label: 'Tiers Simple', description: 'Responsabilité civile de base' },
  { value: 'Tiers +', label: 'Tiers +', description: 'RC + Vol + Incendie + Bris de glace' },
  { value: 'Tous Risques', label: 'Tous Risques', description: 'Protection complète tous risques' },
];

const COMMON_FEATURES = [
  'Assistance 24/7',
  'Véhicule de remplacement',
  'Protection juridique',
  'Défense pénale',
  'Recours suite à accident',
  'Conducteur étendu',
  'Marchandises transportées',
  'Équipements spéciaux',
  'Accidents corporels',
  'Capital décès',
];

export const OfferFormModal: React.FC<OfferFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [newFeature, setNewFeature] = useState('');
  const [features, setFeatures] = useState<string[]>(initialData?.features || []);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'Tiers Simple',
      price: initialData?.price || 0,
      coverage: initialData?.coverage || '',
      description: initialData?.description || '',
      deductible: initialData?.deductible || 0,
      maxCoverage: initialData?.maxCoverage || 0,
      duration: initialData?.duration || 12,
      features: features,
      conditions: initialData?.conditions || '',
    },
  });

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      const updatedFeatures = [...features, newFeature.trim()];
      setFeatures(updatedFeatures);
      form.setValue('features', updatedFeatures);
      setNewFeature('');
    }
  };

  const removeFeature = (featureToRemove: string) => {
    const updatedFeatures = features.filter(f => f !== featureToRemove);
    setFeatures(updatedFeatures);
    form.setValue('features', updatedFeatures);
  };

  const handleSubmit = (data: OfferFormData) => {
    onSubmit({ ...data, features });
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations de base</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'offre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Assurance Tiers Simple" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'assurance</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSURANCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description détaillée de l'offre..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing and Coverage */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tarification et Couverture</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (FCFA)</FormLabel>
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
                  name="deductible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Franchise (FCFA)</FormLabel>
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (mois)</FormLabel>
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

              <FormField
                control={form.control}
                name="maxCoverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plafond de couverture (FCFA)</FormLabel>
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

              <FormField
                control={form.control}
                name="coverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détails de la couverture</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez en détail ce qui est couvert..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Options et garanties</h3>

              <div className="space-y-3">
                <FormLabel>Ajouter des fonctionnalités</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter une fonctionnalité..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>
                    Ajouter
                  </Button>
                </div>

                {/* Quick add common features */}
                <div className="flex flex-wrap gap-2">
                  {COMMON_FEATURES.map((feature) => (
                    <Button
                      key={feature}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!features.includes(feature)) {
                          const updatedFeatures = [...features, feature];
                          setFeatures(updatedFeatures);
                          form.setValue('features', updatedFeatures);
                        }
                      }}
                      disabled={features.includes(feature)}
                    >
                      {feature}
                    </Button>
                  ))}
                </div>

                {/* Selected features */}
                {features.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>Fonctionnalités sélectionnées</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeFeature(feature)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Conditions spéciales</h3>

              <FormField
                control={form.control}
                name="conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions et restrictions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conditions d'éligibilité, restrictions, etc..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">
                {initialData ? 'Mettre à jour' : 'Créer l\'offre'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};