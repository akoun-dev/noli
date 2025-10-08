import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalInfoSchema, PersonalInfoFormData } from "@/lib/zod-schemas";
import { useCompare } from "@/features/comparison/services/ComparisonContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step1PersonalProps {
  onNext: () => void;
}

const Step1Personal = ({ onNext }: Step1PersonalProps) => {
  const { formData, updatePersonalInfo } = useCompare();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      ...formData.personalInfo,
      isWhatsapp: formData.personalInfo.isWhatsapp ?? false,
    },
  });

  const onSubmit = (data: PersonalInfoFormData) => {
    updatePersonalInfo(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">Profil de l'assuré</h2>
        <p className="text-muted-foreground">
          Ces informations nous permettent de vous identifier et d’éditer votre police d’assurance
        </p>
      </div>

      {/* Name Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            {...register("lastName")}
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
            {...register("firstName")}
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
            {...register("email")}
            placeholder="exemple@email.com"
            className={cn(errors.email && "border-destructive")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone *</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="07 00 00 00 00"
            className={cn(errors.phone && "border-destructive")}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
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
    </form>
  );
};

export default Step1Personal;
