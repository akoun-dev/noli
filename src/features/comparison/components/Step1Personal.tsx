import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompare } from "@/features/comparison/services/ComparisonContext";

interface Step1PersonalProps {
  onNext: () => void;
}

interface PersonalInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isWhatsapp: boolean;
}

const Step1Personal: React.FC<Step1PersonalProps> = ({ onNext }: Step1PersonalProps) => {
  console.log('Step1Personal rendering...');
  const { formData, updatePersonalInfo } = useCompare();

  const defaultValues = useMemo(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      isWhatsapp: false,
      ...formData.personalInfo,
    }),
    [formData.personalInfo]
  );

  // Initialize form without zodResolver to isolate the issue
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, control, trigger } = useForm<PersonalInfoFormData>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  console.log('useForm initialized successfully');

  const onSubmit = (data: PersonalInfoFormData) => {
    console.log('Form submitted:', data);
    updatePersonalInfo(data);
    onNext();
  };

  console.log('Rendering form...');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Profil de l'assuré</h2>
        <p className="text-muted-foreground">
          Ces informations nous permettent de vous identifier et d'éditer votre police d'assurance
        </p>
      </div>

      {/* Name Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            {...register("lastName", { required: "Le nom est requis" })}
            placeholder="Votre nom"
            className={cn(errors.lastName && "border-destructive")}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            {...register("firstName", { required: "Le prénom est requis" })}
            placeholder="Votre prénom"
            className={cn(errors.firstName && "border-destructive")}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "L'email est requis",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email invalide"
              }
            })}
            placeholder="exemple@email.com"
            className={cn(errors.email && "border-destructive")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone *</Label>
          <Controller
            name="phone"
            control={control}
            rules={{
              required: "Le numéro de téléphone est requis",
              validate: (value) => {
                const cleaned = (value || "").replace(/\s+/g, "");
                if (!cleaned.startsWith("+")) {
                  return "Incluez l'indicatif (ex : +225...)";
                }
                const digits = cleaned.replace(/\D/g, "");
                if (digits.length < 11 || digits.length > 15) {
                  return "Numéro invalide (format : +225 XX XX XX XX XX)";
                }
                return true;
              }
            }}
            render={({ field: { value, onChange } }) => (
              <PhoneInput
                value={value || ""}
                onChange={(newValue) => {
                  onChange(newValue);
                  trigger("phone");
                }}
                placeholder="XX XX XX XX XX"
                defaultCountry="CI"
                className={cn(errors.phone && "border-destructive")}
                error={errors.phone?.message}
              />
            )}
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div className="p-4 bg-muted/30 rounded-lg flex items-center gap-3">
        <Checkbox
          id="isWhatsapp"
          checked={watch("isWhatsapp") || false}
          onCheckedChange={(v) => setValue("isWhatsapp", Boolean(v))}
        />
        <Label htmlFor="isWhatsapp">Numéro WhatsApp</Label>
      </div>

      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed">
        <p>Faire un devis d’assurance auto en ligne avec NOLI, c’est un peu comme choisir le bon trajet pour éviter les embouteillages : simple, rapide, efficace… et ça vous fait gagner du temps et de l’argent.</p>
        <p>Chez NOLI, on vous aide à comparer les assurances auto disponibles en Côte d’Ivoire pour trouver la formule qui protège vraiment votre véhicule, sans exploser votre budget. Que vous rouliez dans une petite citadine, un SUV familial, un taxi ou un véhicule de société, vous pouvez enfin voir clair dans les offres du marché.</p>
        <p>Et comme NOLI fonctionne en toute transparence :</p>
        <ul className="list-disc space-y-1 pl-5 marker:text-primary">
          <li>➡️ NOLI est gratuit pour ses utilisateurs il n’y a aucun coup cachés.</li>
          <li>➡️ Si vous sélectionnez un devis, c’est l’assureur qui vous rappellera directement pour finaliser le contrat.</li>
        </ul>
        <p className="font-semibold">NOLI simplifie, vous décidez.</p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground group"
      >
        Étape suivante
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  );
};

export default Step1Personal;
