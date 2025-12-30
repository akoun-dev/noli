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
        <h2 className="text-2xl md:text-3xl font-bold">Profil assuré</h2>
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
            {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground group"
      >
        Étape suivante
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Info text en bas */}
      <div className="space-y-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5 text-sm leading-relaxed">
        <p className="font-semibold text-blue-900 dark:text-blue-100">Faire un devis d'assurance auto en ligne avec NOLI</p>
        <p className="text-blue-800 dark:text-blue-200">
          Faire un devis d'assurance auto en ligne avec NOLI, c'est un peu comme choisir le bon trajet pour éviter les embouteillages : simple, rapide, efficace… et ça vous fait gagner du temps et de l'argent.
        </p>
        <p className="text-blue-800 dark:text-blue-200">
          Chez NOLI, on vous aide à comparer les assurances auto disponibles en Côte d'Ivoire pour trouver la formule qui protège vraiment votre véhicule, sans exploser votre budget. Que vous rouliez dans une petite citadine, un SUV familial, un taxi ou un véhicule de société, vous pouvez enfin voir clair dans les offres du marché.
        </p>
        <p className="font-medium text-blue-900 dark:text-blue-100">Et comme NOLI fonctionne en toute transparence :</p>
        <ul className="list-disc space-y-1 pl-5 marker:text-blue-600 dark:marker:text-blue-400">
          <li className="text-blue-800 dark:text-blue-200">➡️ NOLI est gratuit pour ses utilisateurs il n'y a aucun coup cachés.</li>
          <li className="text-blue-800 dark:text-blue-200">➡️ Si vous sélectionnez un devis, c'est l'assureur qui vous rappellera directement pour finaliser le contrat.</li>
        </ul>
        <p className="font-semibold text-blue-900 dark:text-blue-100">NOLI simplifie, vous décidez.</p>

        <div className="border-t border-blue-200 dark:border-blue-800 pt-3 mt-3">
          <p className="font-semibold text-blue-900 dark:text-blue-100">🚗 Pourquoi faire un devis d'assurance auto avec NOLI ?</p>
          <p className="text-blue-800 dark:text-blue-200 mt-1">Parce qu'avant de signer, mieux vaut comparer. Un devis permet de voir :</p>
          <ul className="list-disc space-y-1 pl-5 mt-2 marker:text-blue-600 dark:marker:text-blue-400">
            <li className="text-blue-800 dark:text-blue-200">Les garanties incluses</li>
            <li className="text-blue-800 dark:text-blue-200">Le prix et le niveau de franchise</li>
            <li className="text-blue-800 dark:text-blue-200">Les options (assistance, remorquage, bris de glace…)</li>
            <li className="text-blue-800 dark:text-blue-200">Le type de couverture : Tiers, Tiers + ou Tous Risques</li>
          </ul>
          <p className="text-blue-800 dark:text-blue-200 mt-2">
            En quelques clics, vous évaluez ce qui correspond vraiment à votre usage : trajets quotidiens, longues distances, transport professionnel, ou simple véhicule secondaire.
          </p>
          <p className="text-blue-800 dark:text-blue-200 mt-1">
            Un devis NOLI vous aide à éviter le classique piège : une formule pas chère mais qui ne couvre rien en cas de pépin. Vous comparez, vous choisissez, vous gardez le contrôle.
          </p>
        </div>

        <div className="border-t border-blue-200 dark:border-blue-800 pt-3 mt-3">
          <p className="font-semibold text-blue-900 dark:text-blue-100">🎯 Les avantages de faire un devis auto en ligne avec NOLI</p>
          <ul className="list-disc space-y-1 pl-5 mt-2 marker:text-blue-600 dark:marker:text-blue-400">
            <li className="text-blue-800 dark:text-blue-200">Plus besoin de faire le tour des agences</li>
            <li className="text-blue-800 dark:text-blue-200">Comparaison transparente et simple</li>
            <li className="text-blue-800 dark:text-blue-200">Classement clair des garanties et options</li>
            <li className="text-blue-800 dark:text-blue-200">Aucun engagement : vous comparez librement</li>
            <li className="text-blue-800 dark:text-blue-200">L'assureur vous rappelle directement si vous choisissez une offre</li>
            <li className="text-blue-800 dark:text-blue-200">Gain de temps + économies potentielles importantes</li>
          </ul>
          <p className="text-blue-800 dark:text-blue-200 mt-2">NOLI vous aide à mieux comprendre ce que vous payez… et ce que vous obtenez.</p>
        </div>

        <div className="border-t border-blue-200 dark:border-blue-800 pt-3 mt-3">
          <p className="font-semibold text-blue-900 dark:text-blue-100">📞 Après le devis, comment souscrire ?</p>
          <p className="text-blue-800 dark:text-blue-200 mt-1">Chez NOLI, c'est très simple :</p>
          <ol className="list-decimal space-y-1 pl-5 mt-2 marker:text-blue-600 dark:marker:text-blue-400">
            <li className="text-blue-800 dark:text-blue-200">Vous choisissez un devis sur la plateforme</li>
            <li className="text-blue-800 dark:text-blue-200">Vous laissez vos coordonnées</li>
            <li className="text-blue-800 dark:text-blue-200">La compagnie d'assurance vous rappelle directement</li>
            <li className="text-blue-800 dark:text-blue-200">Elle confirme vos informations</li>
            <li className="text-blue-800 dark:text-blue-200">Vous signez votre contrat avec elle</li>
            <li className="text-blue-800 dark:text-blue-200">Vous recevez votre attestation</li>
          </ol>
          <p className="text-blue-800 dark:text-blue-200 mt-2">Pas d'intermédiaire opaque. Pas de coûts cachés. Pas de stress.</p>
        </div>

        <p className="font-semibold text-blue-900 dark:text-blue-100 pt-2 border-t border-blue-200 dark:border-blue-800">
          🚘 Le devis auto NOLI : votre meilleur copilote
        </p>
        <p className="text-blue-800 dark:text-blue-200">
          Faire un devis auto avec NOLI, ce n'est pas juste comparer des prix : c'est comprendre, choisir et sécuriser votre mobilité en Côte d'Ivoire.
        </p>
        <p className="text-blue-800 dark:text-blue-200">
          Parce qu'une bonne assurance ne doit pas être la plus chère, mais la plus adaptée.
        </p>
        <p className="font-semibold text-blue-900 dark:text-blue-100">Avec NOLI, roulez assuré.</p>
        <p className="text-blue-800 dark:text-blue-200">Tranquille, simple, connecté… mais toujours dans votre intérêt.</p>
      </div>


    </form>
  );
};

export default Step1Personal;
