import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insuranceNeedsSchema, InsuranceNeedsFormData } from "@/lib/zod-schemas";
import { useCompare } from "@/features/comparison/services/ComparisonContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Shield, CircleDollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Step3NeedsProps {
  onBack: () => void;
}

const Step3Needs = ({ onBack }: Step3NeedsProps) => {
  const { formData, updateInsuranceNeeds } = useCompare();
  const navigate = useNavigate();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InsuranceNeedsFormData>({
    resolver: zodResolver(insuranceNeedsSchema),
    defaultValues: {
      ...formData.insuranceNeeds,
      options: formData.insuranceNeeds.options || [],
    },
  });

  const coverageType = watch("coverageType");
  const selectedOptions = watch("options") || [];

  const onSubmit = (data: InsuranceNeedsFormData) => {
    updateInsuranceNeeds(data);
    navigate("/offres");
  };

  const coverageOptions = [
    {
      value: "tiers",
      title: "Responsabilité Civile (Tiers)",
      description: "Couverture minimale obligatoire. Garantit les dommages causés aux tiers.",
      icon: Shield,
      badge: "Économique",
    },
    {
      value: "vol_incendie",
      title: "Vol & Incendie",
      description: "Tiers + protection contre le vol et l'incendie.",
      icon: CircleDollarSign,
      badge: "Populaire",
    },
    {
      value: "tous_risques",
      title: "Tous Risques",
      description: "Protection maximale incluant les dommages de votre véhicule.",
      icon: Star,
      badge: "Recommandé",
    },
  ];

  const insuranceOptions = [
    { id: "conducteur_add", label: "Conducteur additionnel" },
    { id: "assistance_etendue", label: "Assistance étendue" },
    { id: "juridique_plus", label: "Protection juridique renforcée" },
    { id: "bris_glaces", label: "Bris de glaces" },
    { id: "catastrophes", label: "Catastrophes naturelles" },
  ];

  const toggleOption = (optionId: string) => {
    const currentOptions = selectedOptions || [];
    const newOptions = currentOptions.includes(optionId)
      ? currentOptions.filter((id) => id !== optionId)
      : [...currentOptions, optionId];
    setValue("options", newOptions);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Votre assurance</h2>
        <p className="text-muted-foreground">Choisissez votre formule d’assurance et les options qui vous conviennent</p>
      </div>
      {/* Coverage Type */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Type de couverture *</Label>
        <RadioGroup
          value={coverageType}
          onValueChange={(value) => setValue("coverageType", value as any)}
          className="grid md:grid-cols-3 gap-4 items-stretch"
        >
          {coverageOptions.map((option) => (
            <div key={option.value} className="relative h-full">
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={option.value}
                className={cn(
                  "flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg h-full md:min-h-[200px] min-h-[180px]",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                  errors.coverageType && "border-destructive"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <option.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-accent/20 text-accent rounded-full">
                    {option.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-foreground mb-2">{option.title}</h4>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.coverageType && (
          <p className="text-sm text-destructive">{errors.coverageType.message}</p>
        )}
      </div>

      {/* Effective Date & Duration */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="effectiveDate">Date d'effet *</Label>
          <input
            id="effectiveDate"
            type="date"
            value={watch("effectiveDate") || ""}
            onChange={(e) => setValue("effectiveDate", e.target.value)}
            className={cn("w-full border rounded-md h-10 px-3 bg-background", errors.effectiveDate && "border-destructive")}
          />
          {errors.effectiveDate && <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractDuration">Durée du contrat *</Label>
          <Select value={watch("contractDuration")} onValueChange={(v) => setValue("contractDuration", v)}>
            <SelectTrigger className={cn(errors.contractDuration && "border-destructive")}> 
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1_an">1 an</SelectItem>
              <SelectItem value="6_mois">6 mois</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractDuration && <p className="text-sm text-destructive">{errors.contractDuration.message}</p>}
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Options complémentaires (facultatif)</Label>
        <Card className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {insuranceOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={option.id}
                  checked={selectedOptions?.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer text-sm font-medium"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Précédent
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground group"
        >
          Voir les offres
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </form>
  );
};

export default Step3Needs;
