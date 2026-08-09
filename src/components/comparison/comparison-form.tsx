"use client";

import { useState, useCallback } from "react";
import {
  User,
  Car,
  Shield,
  ShieldCheck,
  Check,
  ChevronLeft,
  Loader2,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { USAGE_OPTIONS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// ─── Contract type configuration ───────────────────────────────────
const CONTRACT_TYPES: {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  colorBg: string;
  features: string[];
}[] = [
  {
    value: "basic",
    label: "Tiers",
    description: "Couverture de base obligatoire : Responsabilité Civile et Défense & Recours. Idéal pour un budget maîtrisé.",
    icon: Shield,
    color: "#6b7280",
    colorBg: "rgba(107,114,128,0.12)",
    features: ["RC", "DR"],
  },
  {
    value: "third_party_plus",
    label: "Tiers+",
    description: "Garanties renforcées : Incendie, Vol, Bris de Glaces, Individuelle Conducteur & Passagers. Le meilleur rapport qualité-prix.",
    icon: ShieldCheck,
    color: "#23847E",
    colorBg: "rgba(35,132,126,0.12)",
    features: ["RC", "DR", "IC", "IPT", "INCENDIE", "VOL", "BDG"],
  },
  {
    value: "all_risks",
    label: "Tous Risques",
    description: "Protection maximale incluant la Tierce Complète, Collision et Assistance. Une tranquillité d'esprit totale.",
    icon: Sparkles,
    color: "#B9E54D",
    colorBg: "rgba(185,229,77,0.15)",
    features: ["RC", "DR", "IC", "IPT", "INCENDIE", "VOL", "BDG", "TCM", "TCL", "ASSISTANCE"],
  },
];

// ─── Constants ─────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Profil de l'assuré", icon: User },
  { id: 2, label: "Informations véhicule", icon: Car },
  { id: 3, label: "Options", icon: Shield },
];

const FUEL_OPTIONS = [
  { value: "essence", label: "Essence" },
  { value: "diesel", label: "Diesel" },
];

const CV_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: i < 11 ? `${i + 1} CV` : "12 CV et plus",
}));

const SEAT_OPTIONS = [
  "2", "3", "4", "5", "6", "7", "8", "9+",
].map((v) => ({ value: v, label: v }));

const CONTRACT_DURATION_OPTIONS = [
  { value: "1", label: "1 mois" },
  { value: "3", label: "3 mois" },
  { value: "6", label: "6 mois" },
  { value: "9", label: "9 mois" },
  { value: "12", label: "12 mois" },
];

const TRUST_INDICATORS = [
  { icon: Shield, text: "Données protégées" },
  { icon: ShieldCheck, text: "Devis gratuit" },
  { icon: Check, text: "Sans engagement" },
];

// ─── Types ────────────────────────────────────────────────────────
export function ComparisonForm() {
  const {
    comparisonStep, setComparisonStep,
    personalInfo, setPersonalInfo,
    vehicleInfo, setVehicleInfo,
    coverageNeeds, setCoverageNeeds,
    setView, setIsComparing, setComparisonResults,
    isComparing, user,
  } = useAppStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goNext = useCallback(() => {
    if (comparisonStep < 3) {
      setComparisonStep(comparisonStep + 1);
      setErrors({});
    }
  }, [comparisonStep, setComparisonStep]);

  const goBack = useCallback(() => {
    if (comparisonStep === 1) { setView("landing"); return; }
    setComparisonStep(comparisonStep - 1);
    setErrors({});
  }, [comparisonStep, setComparisonStep, setView]);

  // ─── Validation ─────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!personalInfo.lastName.trim()) e.lastName = "Le nom est requis";
    if (!personalInfo.firstName.trim()) e.firstName = "Le prénom est requis";
    if (!personalInfo.email.trim()) e.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email))
      e.email = "Email invalide";
    if (!personalInfo.phone.trim()) e.phone = "Le téléphone est requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!vehicleInfo.fuelType) e.fuelType = "Requis";
    if (!vehicleInfo.fiscalPower) e.fiscalPower = "Requis";
    if (!vehicleInfo.seats) e.seats = "Requis";
    if (!vehicleInfo.year) e.year = "Requis";
    if (!vehicleInfo.newValue.trim()) e.newValue = "Requis";
    if (!vehicleInfo.currentValue.trim()) e.currentValue = "Requis";
    if (!vehicleInfo.usage) e.usage = "Requis";
    if (!vehicleInfo.effectiveDate?.trim()) e.effectiveDate = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};
    if (!coverageNeeds.contractType)
      e.contractType = "Sélectionnez un type de contrat";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const step1Ok = validateStep1();
    const step2Ok = step1Ok && validateStep2();
    const step3Ok = step2Ok && validateStep3();
    if (!step1Ok) { setComparisonStep(1); return; }
    if (!step2Ok) { setComparisonStep(2); return; }
    if (!step3Ok) { setComparisonStep(3); return; }
    setIsComparing(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo, vehicleInfo, coverageNeeds,
          userId: user.id,
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error("[compare-form] Error body:", errBody);
        throw new Error("Erreur lors de la comparaison");
      }
      const data = await res.json();
      setComparisonResults(data.results ?? []);
      setView("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Veuillez réessayer.");
    } finally {
      setIsComparing(false);
    }
  };

  const progressValue = (comparisonStep / 3) * 100;

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-destructive">{errors[field]}</p>
    ) : null;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <Progress value={progressValue} className="h-1.5" />
          <div className="flex justify-between mt-3">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id < comparisonStep) {
                    setComparisonStep(step.id);
                    setErrors({});
                  }
                }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  step.id === comparisonStep
                    ? "text-primary"
                    : step.id < comparisonStep
                    ? "text-muted-foreground hover:text-foreground cursor-pointer"
                    : "text-muted-foreground/50"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step.id < comparisonStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === comparisonStep
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < comparisonStep ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    step.id
                  )}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Steps content */}
        <div key={comparisonStep} className="animate-fade-in">
            {comparisonStep === 1 && (
              <Step1
                personalInfo={personalInfo}
                setPersonalInfo={setPersonalInfo}
                errors={errors}
                FieldError={FieldError}
              />
            )}
            {comparisonStep === 2 && (
              <Step2
                vehicleInfo={vehicleInfo}
                setVehicleInfo={setVehicleInfo}
                coverageNeeds={coverageNeeds}
                setCoverageNeeds={setCoverageNeeds}
                errors={errors}
                FieldError={FieldError}
              />
            )}
            {comparisonStep === 3 && (
              <Step3
                selected={coverageNeeds.contractType}
                onSelect={(type) => setCoverageNeeds({ contractType: type })}
                error={errors.contractType}
              />
            )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={goBack}
            className="rounded-full px-4 sm:px-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Retour</span>
          </Button>

          {comparisonStep < 3 ? (
            <Button
              onClick={() => {
                if (comparisonStep === 1 && !validateStep1()) return;
                if (comparisonStep === 2 && !validateStep2()) return;
                goNext();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 sm:px-6"
            >
              Étape suivante
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isComparing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 sm:px-6"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Comparaison...</span>
                </>
              ) : (
                "Comparer mes offres"
              )}
            </Button>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
          {TRUST_INDICATORS.map((indicator, i) => {
            const Icon = indicator.icon;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-primary/70" />
                <span>{indicator.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1 ────────────────────────────────────────────────────── */
function Step1({
  personalInfo,
  setPersonalInfo,
  errors,
  FieldError,
}: {
  personalInfo: { lastName: string; firstName: string; email: string; phone: string; whatsappOptIn?: boolean };
  setPersonalInfo: (info: Record<string, unknown>) => void;
  errors: Record<string, string>;
  FieldError: ({ field }: { field: string }) => React.ReactNode | null;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
          Profil de l&apos;assuré
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ces informations nous permettent de vous identifier et d&apos;éditer votre police d&apos;assurance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            placeholder="Nom"
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo({ lastName: e.target.value })}
            aria-invalid={!!errors.lastName}
            className={`w-full ${errors.lastName ? "border-destructive" : ""}`}
          />
          <FieldError field="lastName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            placeholder="Prénoms"
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo({ firstName: e.target.value })}
            aria-invalid={!!errors.firstName}
            className={`w-full ${errors.firstName ? "border-destructive" : ""}`}
          />
          <FieldError field="firstName" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Email"
            className="w-full pl-10"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({ email: e.target.value })}
            aria-invalid={!!errors.email}
          />
        </div>
        <FieldError field="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone *</Label>
        <div className="flex w-full">
          <div className="flex items-center bg-primary text-primary-foreground px-3 sm:px-4 rounded-l-lg text-sm font-semibold shrink-0 border border-input border-r-0">
            🇨🇮 +225
          </div>
          <Input
            id="phone"
            placeholder="0123456789"
            className="w-full rounded-l-none"
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({ phone: e.target.value })}
            aria-invalid={!!errors.phone}
          />
        </div>
        <FieldError field="phone" />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="whatsapp"
          checked={personalInfo.whatsappOptIn}
          onCheckedChange={(checked) =>
            setPersonalInfo({ whatsappOptIn: !!checked })
          }
        />
        <Label htmlFor="whatsapp" className="text-sm font-normal cursor-pointer">
          Recevoir les résultats par WhatsApp
        </Label>
      </div>
    </div>
  );
}

/* ─── Step 2 ────────────────────────────────────────────────────── */
function Step2({
  vehicleInfo,
  setVehicleInfo,
  coverageNeeds,
  setCoverageNeeds,
  errors,
  FieldError,
}: {
  vehicleInfo: import("@/types").VehicleInfo;
  setVehicleInfo: (info: Partial<import("@/types").VehicleInfo>) => void;
  coverageNeeds: { contractType: string; contractDuration: number };
  setCoverageNeeds: (info: Record<string, unknown>) => void;
  errors: Record<string, string>;
  FieldError: ({ field }: { field: string }) => React.ReactNode | null;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
          Informations véhicule
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez les caractéristiques de votre véhicule pour obtenir un devis personnalisé
        </p>
      </div>

      {/* Carburant */}
      <div className="space-y-2">
        <Label>Carburant *</Label>
        <Select
          value={vehicleInfo.fuelType}
          onValueChange={(v) => setVehicleInfo({ fuelType: v })}
        >
          <SelectTrigger className={`w-full ${errors.fuelType ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Sélectionnez le type de carburant" />
          </SelectTrigger>
          <SelectContent>
            {FUEL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError field="fuelType" />
      </div>

      {/* Puissance fiscale */}
      <div className="space-y-2">
        <Label>Puissance fiscale *</Label>
        <Select
          value={vehicleInfo.fiscalPower}
          onValueChange={(v) => setVehicleInfo({ fiscalPower: v })}
        >
          <SelectTrigger className={`w-full ${errors.fiscalPower ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Sélectionnez la puissance fiscale" />
          </SelectTrigger>
          <SelectContent>
            {CV_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError field="fiscalPower" />
      </div>

      {/* Nombre de places */}
      <div className="space-y-2">
        <Label>Nombre de places *</Label>
        <Select
          value={vehicleInfo.seats}
          onValueChange={(v) => setVehicleInfo({ seats: v })}
        >
          <SelectTrigger className={`w-full ${errors.seats ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Sélectionnez le nombre de places" />
          </SelectTrigger>
          <SelectContent>
            {SEAT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError field="seats" />
      </div>

      {/* Année de mise en circulation */}
      <div className="space-y-2">
        <Label htmlFor="circulationDate">Année de mise en circulation *</Label>
        <Input
          id="circulationDate"
          type="month"
          className={`w-full ${errors.year ? "border-destructive" : ""}`}
          value={vehicleInfo.year}
          onChange={(e) => setVehicleInfo({ year: e.target.value })}
          aria-invalid={!!errors.year}
          max={new Date().toISOString().slice(0, 7)}
        />
        <FieldError field="year" />
      </div>

      {/* Valeur neuve & actuelle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="newValue">Valeur neuve (FCFA) *</Label>
          <div className="relative">
            <Input
              id="newValue"
              type="number"
              placeholder="15 000 000"
              value={vehicleInfo.newValue}
              onChange={(e) => setVehicleInfo({ newValue: e.target.value })}
              aria-invalid={!!errors.newValue}
              className="w-full pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              FCFA
            </span>
          </div>
          <FieldError field="newValue" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentValue">Valeur actuelle (FCFA) *</Label>
          <div className="relative">
            <Input
              id="currentValue"
              type="number"
              placeholder="10 000 000"
              value={vehicleInfo.currentValue}
              onChange={(e) => setVehicleInfo({ currentValue: e.target.value })}
              aria-invalid={!!errors.currentValue}
              className="w-full pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              FCFA
            </span>
          </div>
          <FieldError field="currentValue" />
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-2">
        <Label>Usage du véhicule *</Label>
        <Select
          value={vehicleInfo.usage}
          onValueChange={(v) => setVehicleInfo({ usage: v })}
        >
          <SelectTrigger className={`w-full ${errors.usage ? "border-destructive" : ""}`}>
            <SelectValue placeholder="Sélectionnez l'usage du véhicule" />
          </SelectTrigger>
          <SelectContent>
            {USAGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError field="usage" />
      </div>

      {/* Durée du contrat */}
      <div className="space-y-2">
        <Label>Durée du contrat *</Label>
        <Select
          value={String(coverageNeeds.contractDuration || 12)}
          onValueChange={(v) => setCoverageNeeds({ contractDuration: parseInt(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez la durée" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_DURATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date d'effet */}
      <div className="space-y-2">
        <Label htmlFor="effectiveDate">Date d&apos;effet souhaitée *</Label>
        <Input
          id="effectiveDate"
          type="date"
          className={`w-full ${errors.effectiveDate ? "border-destructive" : ""}`}
          value={vehicleInfo.effectiveDate || ""}
          onChange={(e) => setVehicleInfo({ effectiveDate: e.target.value })}
          min={new Date().toISOString().slice(0, 10)}
        />
        <p className="text-xs text-muted-foreground">
          À partir de cette date, votre couverture sera effective
        </p>
        <FieldError field="effectiveDate" />
      </div>
    </div>
  );
}

/* ─── Step 3 — Contract type selection ──────────────────────────── */
function Step3({
  selected,
  onSelect,
  error,
}: {
  selected: string;
  onSelect: (type: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
          Options
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Couverture et options
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {CONTRACT_TYPES.map((ct, i) => {
          const isSelected = selected === ct.value;
          const Icon = ct.icon;
          return (
            <button
              type="button"
              key={ct.value}
              onClick={() => onSelect(ct.value)}
              aria-pressed={isSelected}
              className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 hover:shadow-lg animate-fade-in-up ${
                isSelected
                  ? 'border-green-500/60 bg-green-50/80 dark:border-green-500/50 dark:bg-green-950/20 shadow-md'
                  : 'border-border/60 bg-card/50 hover:border-primary/40 dark:border-border/30 dark:hover:border-accent/40 hover:shadow-md'
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0"
                  style={{ backgroundColor: ct.colorBg, color: ct.color }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-base font-bold text-foreground">{ct.label}</h4>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-green-500 text-white scale-100' : 'border-2 border-muted-foreground/30 scale-90'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ct.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {ct.features.map((f) => (
                      <span
                        key={f}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          isSelected
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}