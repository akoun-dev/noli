"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Car,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Star,
  ArrowLeftRight,
  Zap,
} from "lucide-react";

import { useAppStore } from "@/store/app-store";
import type { PersonalInfo, VehicleInfo, CoverageNeeds } from "@/types";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// ─── Step definitions ───────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Vous", icon: User },
  { id: 2, label: "Véhicule", icon: Car },
  { id: 3, label: "Couverture", icon: Shield },
];

const USAGE_OPTIONS = [
  { value: "personnel", label: "Personnel" },
  { value: "professionnel", label: "Professionnel" },
];

const MILEAGE_OPTIONS = [
  { value: "less_10000", label: "Moins de 10 000 km" },
  { value: "10000_15000", label: "10 000 - 15 000 km" },
  { value: "15000_25000", label: "15 000 - 25 000 km" },
  { value: "more_25000", label: "Plus de 25 000 km" },
];

const VEHICLE_TYPES = [
  "Berline",
  "SUV / 4x4",
  "Break",
  "Coupé",
  "Utilitaire",
  "Pick-up",
];

const BRANDS = [
  "Toyota",
  "Nissan",
  "Hyundai",
  "Kia",
  "Honda",
  "Mitsubishi",
  "Mercedes",
  "BMW",
  "Peugeot",
  "Renault",
  "Volkswagen",
  "Suzuki",
  "Ford",
  "Autre",
];

const YEARS = Array.from({ length: 25 }, (_, i) => String(2024 - i));

const FISCAL_POWER_OPTIONS = [
  { value: "4_or_less", label: "4 CV ou moins" },
  { value: "5_6", label: "5-6 CV" },
  { value: "7_8", label: "7-8 CV" },
  { value: "9_11", label: "9-11 CV" },
  { value: "12_plus", label: "12 CV et plus" },
];

const COVERAGE_OPTIONS = [
  {
    value: "assistance",
    label: "Assistance étendue (pannage, remorquage)",
  },
  { value: "courtesy_vehicle", label: "Véhicule de courtoisie" },
  { value: "driver_protection", label: "Protection du conducteur" },
  { value: "new_value", label: "Indemnisation valeur à neuf" },
  { value: "natural_disaster", label: "Couverture catastrophes naturelles" },
  { value: "legal_protection", label: "Protection juridique étendue" },
];

const BUDGET_OPTIONS = [
  { value: "less_20000", label: "Moins de 20 000 FCFA" },
  { value: "20000_50000", label: "20 000 - 50 000 FCFA" },
  { value: "50000_100000", label: "50 000 - 100 000 FCFA" },
  { value: "more_100000", label: "Plus de 100 000 FCFA" },
];

const DEDUCTIBLE_OPTIONS = [
  {
    value: "high",
    label: "Élevée (prime réduite)",
    desc: "Franchise plus élevée, cotisation plus basse",
  },
  {
    value: "medium",
    label: "Moyenne (équilibre)",
    desc: "Bon compromis entre prime et couverture",
  },
  {
    value: "low",
    label: "Faible (couverture maximale)",
    desc: "Franchise minimale, cotisation plus élevée",
  },
];

// ─── Animation variants ─────────────────────────────────────────────
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ─── Format number with spaces ──────────────────────────────────────
function formatNumberWithSpaces(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ─── Main Component ─────────────────────────────────────────────────
export function ComparisonForm() {
  const {
    comparisonStep,
    setComparisonStep,
    personalInfo,
    setPersonalInfo,
    vehicleInfo,
    setVehicleInfo,
    coverageNeeds,
    setCoverageNeeds,
    setView,
    setIsComparing,
    setComparisonResults,
    isComparing,
    user,
  } = useAppStore();

  const { toast } = useToast();
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Navigation ──────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (comparisonStep < 3) {
      setDirection(1);
      setComparisonStep(comparisonStep + 1);
      setErrors({});
    }
  }, [comparisonStep, setComparisonStep]);

  const goBack = useCallback(() => {
    if (comparisonStep === 1) {
      setView("landing");
      return;
    }
    setDirection(-1);
    setComparisonStep(comparisonStep - 1);
    setErrors({});
  }, [comparisonStep, setComparisonStep, setView]);

  // ─── Validation ──────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!personalInfo.firstName.trim()) e.firstName = "Le prénom est requis";
    if (!personalInfo.lastName.trim()) e.lastName = "Le nom est requis";
    if (!personalInfo.email.trim()) e.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email))
      e.email = "Email invalide";
    if (!personalInfo.phone.trim()) e.phone = "Le téléphone est requis";
    if (!personalInfo.dateOfBirth) e.dateOfBirth = "La date de naissance est requise";
    if (!personalInfo.licenseDate)
      e.licenseDate = "La date du permis est requise";
    if (personalInfo.hasClaims && personalInfo.claimsCount < 1)
      e.claimsCount = "Indiquez au moins 1 sinistre";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!vehicleInfo.vehicleType)
      e.vehicleType = "Le type de véhicule est requis";
    if (!vehicleInfo.brand) e.brand = "La marque est requise";
    if (!vehicleInfo.model.trim()) e.model = "Le modèle est requis";
    if (!vehicleInfo.year) e.year = "L'année est requise";
    if (!vehicleInfo.fiscalPower)
      e.fiscalPower = "La puissance fiscale est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {};
    if (!coverageNeeds.coverageType)
      e.coverageType = "Choisissez un type de couverture";
    if (!coverageNeeds.monthlyBudget)
      e.monthlyBudget = "Indiquez votre budget mensuel";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────
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
          personalInfo,
          vehicleInfo,
          coverageNeeds,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la comparaison");
      }

      const data = await res.json();
      setComparisonResults(data.results ?? []);
      setView("results");
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  // ─── Progress ────────────────────────────────────────────────────
  const progressValue = (comparisonStep / 3) * 100;

  // ─── Render helpers ──────────────────────────────────────────────
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-destructive">{errors[field]}</p>
    ) : null;

  // ─── Step 1: Personal Info ───────────────────────────────────────
  const renderStep1 = () => (
    <motion.div
      key="step1"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Informations personnelles
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Renseignez vos informations pour personnaliser votre comparaison.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Prénom */}
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            placeholder="Votre prénom"
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo({ firstName: e.target.value })}
            aria-invalid={!!errors.firstName}
            className={errors.firstName ? "border-destructive" : ""}
          />
          <FieldError field="firstName" />
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            placeholder="Votre nom"
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo({ lastName: e.target.value })}
            aria-invalid={!!errors.lastName}
            className={errors.lastName ? "border-destructive" : ""}
          />
          <FieldError field="lastName" />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({ email: e.target.value })}
            aria-invalid={!!errors.email}
            className={errors.email ? "border-destructive" : ""}
          />
          <FieldError field="email" />
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+225 07 XX XX XX"
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({ phone: e.target.value })}
            aria-invalid={!!errors.phone}
            className={errors.phone ? "border-destructive" : ""}
          />
          <FieldError field="phone" />
        </div>

        {/* Date de naissance */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date de naissance</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={(e) => setPersonalInfo({ dateOfBirth: e.target.value })}
            aria-invalid={!!errors.dateOfBirth}
            className={errors.dateOfBirth ? "border-destructive" : ""}
          />
          <FieldError field="dateOfBirth" />
        </div>

        {/* Date du permis */}
        <div className="space-y-2">
          <Label htmlFor="licenseDate">
            Date d'obtention du permis
          </Label>
          <Input
            id="licenseDate"
            type="date"
            value={personalInfo.licenseDate}
            onChange={(e) => setPersonalInfo({ licenseDate: e.target.value })}
            aria-invalid={!!errors.licenseDate}
            className={errors.licenseDate ? "border-destructive" : ""}
          />
          <FieldError field="licenseDate" />
        </div>

        {/* Usage du véhicule */}
        <div className="space-y-2">
          <Label>Usage du véhicule</Label>
          <Select
            value={personalInfo.usage}
            onValueChange={(v) =>
              setPersonalInfo({
                usage: v as PersonalInfo["usage"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {USAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kilométrage annuel */}
        <div className="space-y-2">
          <Label>Kilométrage annuel</Label>
          <Select
            value={personalInfo.annualMileage}
            onValueChange={(v) => setPersonalInfo({ annualMileage: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {MILEAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Antécédents de sinistres */}
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hasClaims" className="cursor-pointer">
              Antécédents de sinistres
            </Label>
            <p className="text-xs text-muted-foreground">
              Avez-vous eu des sinistres ces dernières années ?
            </p>
          </div>
          <Switch
            id="hasClaims"
            checked={personalInfo.hasClaims}
            onCheckedChange={(checked) =>
              setPersonalInfo({ hasClaims: checked, claimsCount: checked ? 1 : 0 })
            }
          />
        </div>

        <AnimatePresence>
          {personalInfo.hasClaims && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-2">
                <Label htmlFor="claimsCount">Nombre de sinistres</Label>
                <Input
                  id="claimsCount"
                  type="number"
                  min={1}
                  max={10}
                  value={personalInfo.claimsCount || ""}
                  onChange={(e) =>
                    setPersonalInfo({
                      claimsCount: Math.min(
                        10,
                        Math.max(0, Number(e.target.value))
                      ),
                    })
                  }
                  placeholder="1"
                  aria-invalid={!!errors.claimsCount}
                  className={errors.claimsCount ? "border-destructive" : ""}
                />
                <FieldError field="claimsCount" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // ─── Step 2: Vehicle Info ────────────────────────────────────────
  const renderStep2 = () => (
    <motion.div
      key="step2"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Informations véhicule
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Décrivez votre véhicule pour obtenir des offres précises.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Type de véhicule */}
        <div className="space-y-2">
          <Label>Type de véhicule</Label>
          <Select
            value={vehicleInfo.vehicleType}
            onValueChange={(v) => setVehicleInfo({ vehicleType: v })}
          >
            <SelectTrigger
              className={`w-full ${errors.vehicleType ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError field="vehicleType" />
        </div>

        {/* Marque */}
        <div className="space-y-2">
          <Label>Marque</Label>
          <Select
            value={vehicleInfo.brand}
            onValueChange={(v) => setVehicleInfo({ brand: v })}
          >
            <SelectTrigger
              className={`w-full ${errors.brand ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError field="brand" />
        </div>

        {/* Modèle */}
        <div className="space-y-2">
          <Label htmlFor="model">Modèle</Label>
          <Input
            id="model"
            placeholder="Ex: RAV4, Hilux, Tucson..."
            value={vehicleInfo.model}
            onChange={(e) => setVehicleInfo({ model: e.target.value })}
            aria-invalid={!!errors.model}
            className={errors.model ? "border-destructive" : ""}
          />
          <FieldError field="model" />
        </div>

        {/* Année */}
        <div className="space-y-2">
          <Label>Année de mise en circulation</Label>
          <Select
            value={vehicleInfo.year}
            onValueChange={(v) => setVehicleInfo({ year: v })}
          >
            <SelectTrigger
              className={`w-full ${errors.year ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError field="year" />
        </div>

        {/* Puissance fiscale */}
        <div className="space-y-2">
          <Label>Puissance fiscale (CV)</Label>
          <Select
            value={vehicleInfo.fiscalPower}
            onValueChange={(v) => setVehicleInfo({ fiscalPower: v })}
          >
            <SelectTrigger
              className={`w-full ${errors.fiscalPower ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Sélectionnez" />
            </SelectTrigger>
            <SelectContent>
              {FISCAL_POWER_OPTIONS.map((fp) => (
                <SelectItem key={fp.value} value={fp.value}>
                  {fp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError field="fiscalPower" />
        </div>

        {/* Numéro d'immatriculation */}
        <div className="space-y-2">
          <Label htmlFor="registration">Numéro d'immatriculation</Label>
          <Input
            id="registration"
            placeholder="AB 1234 CD"
            value={vehicleInfo.registration}
            onChange={(e) =>
              setVehicleInfo({ registration: e.target.value.toUpperCase() })
            }
          />
        </div>

        {/* Valeur à neuf */}
        <div className="space-y-2">
          <Label htmlFor="newValue">Valeur à neuf (FCFA)</Label>
          <Input
            id="newValue"
            type="text"
            inputMode="numeric"
            placeholder="Ex: 15 000 000"
            value={formatNumberWithSpaces(vehicleInfo.newValue)}
            onChange={(e) =>
              setVehicleInfo({
                newValue: e.target.value.replace(/\D/g, ""),
              })
            }
          />
        </div>

        {/* Valeur vénale */}
        <div className="space-y-2">
          <Label htmlFor="currentValue">Valeur vénale actuelle (FCFA)</Label>
          <Input
            id="currentValue"
            type="number"
            placeholder="Ex: 10 000 000"
            value={vehicleInfo.currentValue}
            onChange={(e) => setVehicleInfo({ currentValue: e.target.value })}
          />
        </div>
      </div>

      {/* Véhicule importé */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="isImported" className="cursor-pointer">
            Véhicule importé
          </Label>
          <p className="text-xs text-muted-foreground">
            Votre véhicule a-t-il été importé ?
          </p>
        </div>
        <Switch
          id="isImported"
          checked={vehicleInfo.isImported}
          onCheckedChange={(checked) =>
            setVehicleInfo({ isImported: checked })
          }
        />
      </div>
    </motion.div>
  );

  // ─── Step 3: Coverage Needs ──────────────────────────────────────
  const coverageCards = [
    {
      value: "tiers" as const,
      title: "Tiers Simple",
      description:
        "Couverture de base pour les dommages causés aux tiers. Protection minimale obligatoire.",
      price: "à partir de 10 000 FCFA/mois",
      icon: Shield,
      color: "text-muted-foreground",
    },
    {
      value: "tiers_plus" as const,
      title: "Tiers Étendu (Tiers+)",
      description:
        "Couverture tierce élargie incluant vol, incendie et bris de glace. Bon rapport qualité-prix.",
      price: "à partir de 25 000 FCFA/mois",
      icon: Zap,
      recommended: true,
      color: "text-brand",
    },
    {
      value: "tous_risques" as const,
      title: "Tous Risques",
      description:
        "Protection complète couvrant tous les sinistres y compris les dommages à votre véhicule.",
      price: "à partir de 55 000 FCFA/mois",
      icon: Star,
      color: "text-foreground",
    },
  ];

  const renderStep3 = () => (
    <motion.div
      key="step3"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Besoins en assurance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez votre couverture et vos options préférées.
        </p>
      </div>

      {/* Coverage type cards */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Type de couverture</Label>
        <RadioGroup
          value={coverageNeeds.coverageType}
          onValueChange={(v) =>
            setCoverageNeeds({
              coverageType: v as CoverageNeeds["coverageType"],
            })
          }
          className="grid gap-3 sm:grid-cols-3"
        >
          {coverageCards.map((card) => {
            const Icon = card.icon;
            const isSelected = coverageNeeds.coverageType === card.value;
            return (
              <motion.label
                key={card.value}
                htmlFor={`coverage-${card.value}`}
                className="cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  className={`relative overflow-hidden py-0 gap-0 transition-all duration-200 ${
                    isSelected
                      ? "border-2 border-brand shadow-md shadow-brand/10 bg-brand-light/30"
                      : "border hover:border-muted-foreground/30"
                  } ${card.recommended && !isSelected ? "border-brand/40" : ""}`}
                >
                  {card.recommended && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-brand text-brand-foreground border-0 text-[10px] px-1.5">
                        <Sparkles className="size-3 mr-0.5" />
                        Recommandé
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={card.value}
                        id={`coverage-${card.value}`}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`size-4 ${isSelected ? "text-brand" : card.color}`}
                          />
                          <span
                            className={`font-semibold text-sm ${isSelected ? "text-brand" : "text-foreground"}`}
                          >
                            {card.title}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                          {card.description}
                        </p>
                        <p
                          className={`mt-2 text-xs font-bold ${isSelected ? "text-brand" : "text-muted-foreground"}`}
                        >
                          {card.price}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.label>
            );
          })}
        </RadioGroup>
        <FieldError field="coverageType" />
      </div>

      {/* Options supplémentaires */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Options supplémentaires</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {COVERAGE_OPTIONS.map((opt) => {
            const isChecked = coverageNeeds.options.includes(opt.value);
            return (
              <label
                key={opt.value}
                htmlFor={`opt-${opt.value}`}
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50"
              >
                <Checkbox
                  id={`opt-${opt.value}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const current = coverageNeeds.options;
                    if (checked) {
                      setCoverageNeeds({
                        options: [...current, opt.value],
                      });
                    } else {
                      setCoverageNeeds({
                        options: current.filter((o) => o !== opt.value),
                      });
                    }
                  }}
                  className="mt-0.5 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Budget mensuel */}
      <div className="space-y-2">
        <Label>Budget mensuel souhaité</Label>
        <Select
          value={coverageNeeds.monthlyBudget}
          onValueChange={(v) => setCoverageNeeds({ monthlyBudget: v })}
        >
          <SelectTrigger
            className={`w-full ${errors.monthlyBudget ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder="Sélectionnez" />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError field="monthlyBudget" />
      </div>

      {/* Niveau de franchise */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Niveau de franchise</Label>
        <RadioGroup
          value={coverageNeeds.deductibleLevel}
          onValueChange={(v) =>
            setCoverageNeeds({
              deductibleLevel: v as CoverageNeeds["deductibleLevel"],
            })
          }
          className="grid gap-3 sm:grid-cols-3"
        >
          {DEDUCTIBLE_OPTIONS.map((opt) => {
            const isSelected = coverageNeeds.deductibleLevel === opt.value;
            return (
              <label
                key={opt.value}
                htmlFor={`deductible-${opt.value}`}
                className="cursor-pointer"
              >
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Card
                    className={`py-0 gap-0 transition-all duration-200 ${
                      isSelected
                        ? "border-2 border-brand shadow-md shadow-brand/10 bg-brand-light/30"
                        : "border hover:border-muted-foreground/30"
                    }`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={opt.value}
                          id={`deductible-${opt.value}`}
                        />
                        <span
                          className={`text-sm font-medium ${isSelected ? "text-brand" : "text-foreground"}`}
                        >
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        {opt.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    </motion.div>
  );

  // ─── Main render ─────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = comparisonStep === step.id;
            const isCompleted = comparisonStep > step.id;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isActive
                        ? "var(--color-brand)"
                        : isCompleted
                          ? "var(--color-brand)"
                          : "var(--color-muted)",
                      color: isActive
                        ? "var(--color-brand-foreground)"
                        : isCompleted
                          ? "var(--color-brand-foreground)"
                          : "var(--color-muted-foreground)",
                    }}
                    className="flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors"
                  >
                    {isCompleted ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </motion.div>
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      isActive
                        ? "text-brand"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {idx + 1}. {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 sm:w-12 transition-colors ${
                      comparisonStep > step.id ? "bg-brand" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <Progress
          value={progressValue}
          className="h-1.5 [&>[data-slot=progress-indicator]]:bg-brand"
        />
      </div>

      {/* Step content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          {comparisonStep === 1 && renderStep1()}
          {comparisonStep === 2 && renderStep2()}
          {comparisonStep === 3 && renderStep3()}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goBack}
          className="gap-2"
          disabled={isComparing}
        >
          <ChevronLeft className="size-4" />
          {comparisonStep === 1 ? "Retour" : "Retour"}
        </Button>

        {comparisonStep < 3 ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => {
                if (comparisonStep === 1) {
                  if (validateStep1()) goNext();
                } else if (comparisonStep === 2) {
                  if (validateStep2()) goNext();
                }
              }}
              className="gap-2 bg-brand text-brand-foreground hover:bg-brand-dark"
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={isComparing}
              className="gap-2 bg-brand text-brand-foreground hover:bg-brand-dark min-w-[160px]"
              size="lg"
            >
              {isComparing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Comparaison...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="size-4" />
                  Comparer
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}