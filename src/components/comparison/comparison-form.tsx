"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Car,
  Shield,
  Check,
  ChevronLeft,
  Loader2,
  Mail,
  UserCheck,
  Users,
  Banknote,
  Scale,
  Lock,
  FlameKindling,
  CheckCheck,
  Wrench,
  CarFront,
  HandHelping,
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

// ─── Icon mapping for DB coverage category codes ──────────────────
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  RESPONSABILITE_CIVILE: Shield,
  DEFENSE_RECOURS: Scale,
  INDIVIDUELLE_CONDUCTEUR: UserCheck,
  INDIVIDUELLE_PASSAGERS: Users,
  INCENDIE: FlameKindling,
  VOL: Lock,
  BRIS_GLACES: CarFront,
  TIERCE_COMPLETE: Car,
  TIERCE_COLLISION: CarFront,
  ASSISTANCE: HandHelping,
  AVANCE_RECOURS: Banknote,
  ACCESSOIRES: Wrench,
};

const DEFAULT_ICON = Shield;

const CATEGORY_COLOR_MAP: Record<string, string> = {
  RESPONSABILITE_CIVILE: "#0891b2",
  DEFENSE_RECOURS: "#7c3aed",
  INDIVIDUELLE_CONDUCTEUR: "#059669",
  INDIVIDUELLE_PASSAGERS: "#0284c7",
  INCENDIE: "#dc2626",
  VOL: "#ea580c",
  BRIS_GLACES: "#0ea5e9",
  TIERCE_COMPLETE: "#2563eb",
  TIERCE_COLLISION: "#4f46e5",
  ASSISTANCE: "#16a34a",
  AVANCE_RECOURS: "#ca8a04",
  ACCESSOIRES: "#6b7280",
};

// ─── Types ────────────────────────────────────────────────────────
interface DBCoverageCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  displayOrder: number;
}

// ─── Constants ─────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Profil assuré", icon: User },
  { id: 2, label: "Informations véhicule", icon: Car },
  { id: 3, label: "Catégories de garanties", icon: Shield },
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
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic coverage categories from DB
  const [dbCategories, setDbCategories] = useState<DBCoverageCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch coverage categories when component mounts (or step reaches 3)
  useEffect(() => {
    if (dbCategories.length > 0) return;
    setCategoriesLoading(true);
    fetch("/api/coverage-categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDbCategories(data);
      })
      .catch(() => {
        toast.error("Impossible de charger les catégories de garanties");
      })
      .finally(() => setCategoriesLoading(false));
  }, [dbCategories.length]);

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
    const step1Ok = validateStep1();
    const step2Ok = step1Ok && validateStep2();
    const step3Ok = step2Ok && validateStep3();
    if (!step1Ok) { setComparisonStep(1); setDirection(0); return; }
    if (!step2Ok) { setComparisonStep(2); setDirection(0); return; }
    if (!step3Ok) { setComparisonStep(3); setDirection(0); return; }
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
      toast.error(err instanceof Error ? err.message : "Veuillez réessayer.");
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

  const toggleAllCategories = () => {
    const allIds = dbCategories.map((c) => c.code);
    const current = coverageNeeds.guaranteeCategories || [];
    if (current.length === allIds.length && allIds.length > 0) {
      setCoverageNeeds({ guaranteeCategories: [] });
    } else {
      setCoverageNeeds({ guaranteeCategories: allIds });
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
                categories={dbCategories}
                loading={categoriesLoading}
                selected={coverageNeeds.guaranteeCategories || []}
                onToggle={toggleCategory}
                onToggleAll={toggleAllCategories}
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
    <div className="space-y-5 animate-fade-in">
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
  errors,
  FieldError,
}: {
  vehicleInfo: Record<string, string>;
  setVehicleInfo: (info: Record<string, unknown>) => void;
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
          Pour obtenir un devis personnalisé
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
    </div>
  );
}

/* ─── Step 3 — Dynamic categories from DB ──────────────────────── */
function Step3({
  categories,
  loading,
  selected,
  onToggle,
  onToggleAll,
  error,
}: {
  categories: DBCoverageCategory[];
  loading: boolean;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  error?: string;
}) {
  const allIds = categories.map((c) => c.code);
  const allSelected = allIds.length > 0 && selected.length === allIds.length;

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
            Catégories de garanties
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chargement des garanties disponibles...
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des catégories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
            Catégories de garanties
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aucune catégorie de garantie disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground">
            Catégories de garanties
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez les catégories de garanties qui vous intéressent.
          </p>
        </div>
        <span className="text-sm text-muted-foreground shrink-0 ml-4 whitespace-nowrap rounded-full border px-3 py-1">
          {selected.length}/{allIds.length} sélectionnée(s)
        </span>
      </div>

      {/* Toggle all */}
      <button
        type="button"
        onClick={onToggleAll}
        className={`flex items-center gap-2 w-full p-4 rounded-2xl border-2 transition-all text-sm font-medium shadow-sm ${
          allSelected
            ? "border-green-500/60 bg-green-50/80 dark:border-green-500/50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
            : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-md"
        }`}
      >
        <CheckCheck className={`w-4 h-4 ${allSelected ? "text-green-600" : ""}`} />
        {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
      </button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {categories.map((cat, i) => {
          const isSelected = selected.includes(cat.code);
          const Icon = CATEGORY_ICON_MAP[cat.code] || DEFAULT_ICON;
          const catColor = cat.color || CATEGORY_COLOR_MAP[cat.code] || '#0891b2';
          return (
            <motion.button
              type="button"
              key={cat.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onToggle(cat.code)}
              aria-pressed={isSelected}
              className={`w-full rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:shadow-lg ${
                isSelected
                  ? 'border-green-500/60 bg-green-50/80 dark:border-green-500/50 dark:bg-green-950/20'
                  : 'border-border/60 bg-card/50 hover:border-primary/40 dark:border-border/30 dark:hover:border-accent/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                  style={{ backgroundColor: `${catColor}18`, color: catColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{cat.name}</h4>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
                  )}
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? 'bg-green-500 text-white scale-100' : 'border-2 border-muted-foreground/30 scale-90'
                }`}>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}