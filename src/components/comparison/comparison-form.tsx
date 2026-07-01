"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Car,
  Shield,
  Check,
  ChevronLeft,
  Loader2,
  Phone,
  Mail,
  UserCheck,
  Users,
  Banknote,
  Flame,
  Scale,
  Lock,
  FlameKindling,
  ShieldCheck,
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ─────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Profil assuré", icon: User },
  { id: 2, label: "Informations véhicule", icon: Car },
  { id: 3, label: "Catégories de garanties", icon: Shield },
];

const FUEL_OPTIONS = [
  { value: "essence", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "hybride", label: "Hybride" },
  { value: "electrique", label: "Électrique" },
  { value: "gpl", label: "GPL" },
];

const CV_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: i < 11 ? `${i + 1} CV` : "12 CV et plus",
}));

const SEAT_OPTIONS = [
  "2", "3", "4", "5", "6", "7", "8", "9+",
].map((v) => ({ value: v, label: v }));

const YEARS = Array.from({ length: 26 }, (_, i) => String(2025 - i));

const USAGE_OPTIONS = [
  { value: "personnel", label: "Personnel" },
  { value: "professionnel", label: "Professionnel" },
  { value: "taxi_vtc", label: "Taxi / VTC" },
  { value: "autre", label: "Autre" },
];

const GUARANTEE_CATEGORIES = [
  { id: "responsabilite_civile", label: "Responsabilité Civile", icon: Shield },
  { id: "recours_tiers", label: "Recours des Tiers Incendie", icon: Flame },
  { id: "defense_recours", label: "Défense / Recours", icon: Scale },
  { id: "individuelle_conducteur", label: "Individuelle Conducteur", icon: UserCheck },
  { id: "individuelle_personne", label: "Individuelle Personne Transportée", icon: Users },
  { id: "avance_recours", label: "Avance sur Recours", icon: Banknote },
  { id: "incendie", label: "Incendie", icon: FlameKindling },
  { id: "vol", label: "Vol", icon: Lock },
];

// ─── Animation ──────────────────────────────────────────────────────
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 200 : -200, opacity: 0 }),
};

// ─── Component ──────────────────────────────────────────────────────
export function ComparisonForm() {
  const {
    comparisonStep, setComparisonStep,
    personalInfo, setPersonalInfo,
    vehicleInfo, setVehicleInfo,
    coverageNeeds, setCoverageNeeds,
    setView, setIsComparing, setComparisonResults,
    isComparing, user,
  } = useAppStore();
  const { toast } = useToast();
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goNext = useCallback(() => {
    if (comparisonStep < 3) {
      setDirection(1);
      setComparisonStep(comparisonStep + 1);
      setErrors({});
    }
  }, [comparisonStep, setComparisonStep]);

  const goBack = useCallback(() => {
    if (comparisonStep === 1) { setView("landing"); return; }
    setDirection(-1);
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};
    if (!coverageNeeds.guaranteeCategories?.length)
      e.categories = "Sélectionnez au moins une catégorie";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      setComparisonStep(1);
      setDirection(0);
      return;
    }
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
      if (!res.ok) throw new Error("Erreur lors de la comparaison");
      const data = await res.json();
      setComparisonResults(data.results ?? []);
      setView("results");
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  const toggleCategory = (id: string) => {
    const cats = coverageNeeds.guaranteeCategories || [];
    setCoverageNeeds({
      guaranteeCategories: cats.includes(id)
        ? cats.filter((c) => c !== id)
        : [...cats, id],
    });
  };

  const progressValue = (comparisonStep / 3) * 100;

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-destructive">{errors[field]}</p>
    ) : null;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <Progress value={progressValue} className="h-1.5" />
          <div className="flex justify-between mt-3">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id < comparisonStep) {
                    setDirection(-1);
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
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={comparisonStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
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
                errors={errors}
                FieldError={FieldError}
              />
            )}
            {comparisonStep === 3 && (
              <Step3
                selected={coverageNeeds.guaranteeCategories || []}
                onToggle={toggleCategory}
                error={errors.categories}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={goBack}
            className="rounded-full px-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>

          {comparisonStep < 3 ? (
            <Button
              onClick={() => {
                if (comparisonStep === 1 && !validateStep1()) return;
                if (comparisonStep === 2 && !validateStep2()) return;
                goNext();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
            >
              Étape suivante
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isComparing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Comparaison...
                </>
              ) : (
                "Comparer mes offres"
              )}
            </Button>
          )}
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
  personalInfo: { lastName: string; firstName: string; email: string; phone: string; whatsappOptIn: boolean };
  setPersonalInfo: (info: Record<string, unknown>) => void;
  errors: Record<string, string>;
  FieldError: ({ field }: { field: string }) => React.ReactNode | null;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
          Profil assuré
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pour identifier et éditer votre contrat d&apos;assurance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            placeholder="Aboa"
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo({ lastName: e.target.value })}
            aria-invalid={!!errors.lastName}
            className={errors.lastName ? "border-destructive" : ""}
          />
          <FieldError field="lastName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            placeholder="Akoun Bernard"
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo({ firstName: e.target.value })}
            aria-invalid={!!errors.firstName}
            className={errors.firstName ? "border-destructive" : ""}
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
            placeholder="aboa.akoun40@gmail.com"
            className="pl-10"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({ email: e.target.value })}
            aria-invalid={!!errors.email}
          />
        </div>
        <FieldError field="email" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone *</Label>
        <div className="flex">
          <div className="flex items-center bg-primary text-primary-foreground px-4 rounded-l-lg text-sm font-semibold shrink-0 border border-input border-r-0">
            🇨🇮 +225
          </div>
          <Input
            id="phone"
            placeholder="01 40 98 49 43"
            className="rounded-l-none"
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
  errors,
  FieldError,
}: {
  vehicleInfo: Record<string, string>;
  setVehicleInfo: (info: Record<string, unknown>) => void;
  errors: Record<string, string>;
  FieldError: ({ field }: { field: string }) => React.ReactNode | null;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
          Informations véhicule
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pour obtenir un devis personnalisé
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Carburant *</Label>
          <Select
            value={vehicleInfo.fuelType}
            onValueChange={(v) => setVehicleInfo({ fuelType: v })}
          >
            <SelectTrigger className={errors.fuelType ? "border-destructive" : ""}>
              <SelectValue placeholder="Sélectionnez" />
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

        <div className="space-y-2">
          <Label>Puissance fiscale *</Label>
          <Select
            value={vehicleInfo.fiscalPower}
            onValueChange={(v) => setVehicleInfo({ fiscalPower: v })}
          >
            <SelectTrigger className={errors.fiscalPower ? "border-destructive" : ""}>
              <SelectValue placeholder="Sélectionnez" />
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

        <div className="space-y-2">
          <Label>Nombre de places *</Label>
          <Select
            value={vehicleInfo.seats}
            onValueChange={(v) => setVehicleInfo({ seats: v })}
          >
            <SelectTrigger className={errors.seats ? "border-destructive" : ""}>
              <SelectValue placeholder="Sélectionnez" />
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
      </div>

      <div className="space-y-2">
        <Label>Année de mise en circulation *</Label>
        <Select
          value={vehicleInfo.year}
          onValueChange={(v) => setVehicleInfo({ year: v })}
        >
          <SelectTrigger className={errors.year ? "border-destructive" : ""}>
            <SelectValue placeholder="Sélectionnez" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                <span className="flex items-center gap-2">
                  {y}
                  {parseInt(y) === currentYear && (
                    <span className="text-primary text-xs font-medium">
                      (cette année)
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError field="year" />
      </div>

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
              className="pr-16"
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
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              FCFA
            </span>
          </div>
          <FieldError field="currentValue" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Usage du véhicule *</Label>
        <Select
          value={vehicleInfo.usage}
          onValueChange={(v) => setVehicleInfo({ usage: v })}
        >
          <SelectTrigger className={errors.usage ? "border-destructive" : ""}>
            <SelectValue placeholder="Sélectionnez" />
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
    </div>
  );
}

/* ─── Step 3 ────────────────────────────────────────────────────── */
function Step3({
  selected,
  onToggle,
  error,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
            Catégories de garanties
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez les catégories de garanties qui vous intéressent.
          </p>
        </div>
        <span className="text-sm text-muted-foreground shrink-0 mt-1">
          {selected.length} sélectionnée{selected.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GUARANTEE_CATEGORIES.map((cat, i) => {
          const isSelected = selected.includes(cat.id);
          const Icon = cat.icon;
          return (
            <motion.button
              type="button"
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onToggle(cat.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left cursor-pointer bg-white ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-border"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "bg-primary/15"
                    : "bg-muted"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}
              >
                {cat.label}
              </span>
              {isSelected && (
                <ShieldCheck className="w-4 h-4 text-primary ml-auto shrink-0" />
              )}
              <Checkbox
                checked={isSelected}
                className="sr-only"
                tabIndex={-1}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}