"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  DollarSign,
  Percent,
  LayoutGrid,
  CircleDot,
  Info,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface CoverageCategory {
  id: string;
  name: string;
  code: string;
}

interface InsCatOption {
  id: string;
  name: string;
}

interface Coverage {
  id: string;
  code: string;
  type: string;
  name: string;
  description: string | null;
  calculationType: string;
  isMandatory: boolean;
  isOptional: boolean;
  conditions: string;
  isActive: boolean;
  displayOrder: number;
  metadata: string;
  variableSource: string | null;
  ratePercent: number | null;
  conditionedByNewValue: boolean;
  newValueThreshold: number | null;
  rateBelowThreshold: number | null;
  rateAboveThreshold: number | null;
  fixedAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  capital: number | null;
  matrixDimension: string | null;
  requiresGuarantee: string | null;
  category: { id: string; name: string; code: string } | null;
}

type CalculationType =
  | "FREE"
  | "FIXED_AMOUNT"
  | "VARIABLE_BASED"
  | "MATRIX_BASED";

interface Step1Data {
  name: string;
  insuranceCategoryId: string;
  categoryId: string;
  description: string;
  isMandatory: boolean;
  isOptional: boolean;
  conditions: string;
  displayOrder: string;
}

/* Matrix sub-types (aligned with admin) */
interface MatrixTariff {
  key: string;
  fuelType: "Essence" | "Diesel";
  fiscalPowerMin: number;
  fiscalPowerMax: number;
  prime: number;
  vehicleCategory?: string;
}

interface PlacesTariff {
  places: number;
  prime: number;
  label: string;
}

interface FormulaConfig {
  formula: number;
  label: string;
  capitalDeces: number;
  capitalInvalidite: number;
  fraisMedicaux: number;
  prime: number;
  usePlaces: boolean;
  placesTariffs?: PlacesTariff[];
}

interface CategoryTariff {
  key: string;
  category: string;
  guaranteeType: "TIERCE_COMPLETE" | "TIERCE_COLLISION";
  valueMin: number;
  valueMax: number;
  valueLabel: string;
  franchise: number;
  franchiseLabel: string;
  prime: number;      // Taux en % (ex: 4.4 pour 4.4%)
  vehicleCategory?: string; // "401" | "402" | "412"
}

const VN_RANGES = [
  { label: "≤ 12M", min: 0, max: 12_000_000, key: "A" },
  { label: "12M – 25M", min: 12_000_001, max: 25_000_000, key: "B" },
  { label: "25M – 40M", min: 25_000_001, max: 40_000_000, key: "C" },
  { label: "40M – 90M", min: 40_000_001, max: 90_000_000, key: "D" },
  { label: "90M – 110M", min: 90_000_001, max: 110_000_000, key: "E" },
  { label: "> 110M", min: 110_000_001, max: 999_999_999, key: "F" },
] as const;

const FRANCHISE_LEVELS = [
  { label: "Sans franchise", value: 0 },
  { label: "250K", value: 250_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
  { label: "2.5M", value: 2_500_000 },
] as const;

/* Les catégories disponibles sont extraites dynamiquement de TIERCE_RATES */
function getDefaultVehicleCategories(): string[] {
  return Object.keys(TIERCE_RATES).sort();
}

function getDefaultFiscalPowerTariffs(): MatrixTariff[] {
  const now = Date.now();
  return [
    { key: `essence_1_4_${now}`, fuelType: "Essence", fiscalPowerMin: 1, fiscalPowerMax: 4, prime: 68675 },
    { key: `essence_5_7_${now}`, fuelType: "Essence", fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 85000 },
    { key: `essence_8_10_${now}`, fuelType: "Essence", fiscalPowerMin: 8, fiscalPowerMax: 10, prime: 95000 },
    { key: `essence_11_${now}`, fuelType: "Essence", fiscalPowerMin: 11, fiscalPowerMax: 99, prime: 110000 },
    { key: `diesel_1_4_${now}`, fuelType: "Diesel", fiscalPowerMin: 1, fiscalPowerMax: 4, prime: 68675 },
    { key: `diesel_5_7_${now}`, fuelType: "Diesel", fiscalPowerMin: 5, fiscalPowerMax: 7, prime: 85000 },
    { key: `diesel_8_10_${now}`, fuelType: "Diesel", fiscalPowerMin: 8, fiscalPowerMax: 10, prime: 95000 },
    { key: `diesel_11_${now}`, fuelType: "Diesel", fiscalPowerMin: 11, fiscalPowerMax: 99, prime: 110000 },
  ];
}

function getDefaultFormulas(): FormulaConfig[] {
  return [
    { formula: 1, label: "Formule 1", capitalDeces: 1_000_000, capitalInvalidite: 2_000_000, fraisMedicaux: 100_000, prime: 5_500, usePlaces: false },
    { formula: 2, label: "Formule 2", capitalDeces: 3_000_000, capitalInvalidite: 6_000_000, fraisMedicaux: 400_000, prime: 8_400, usePlaces: false },
    { formula: 3, label: "Formule 3", capitalDeces: 5_000_000, capitalInvalidite: 10_000_000, fraisMedicaux: 500_000, prime: 15_900, usePlaces: false },
  ];
}

/* ── Grilles tarifaires Tierce par catégorie de véhicule ── */
// Les valeurs sont des TAUX en % (ex: 4.4 = 4.4% de la VN)
// Formule : Prime = VN × (taux / 100)

const TIERCE_RATES: Record<string, Record<string, Record<string, number>>> = {
  "401": {
    TIERCE_COMPLETE: {
      // VN class A (≤12M)
      A_0: 4.4, A_250000: 3.52, A_500000: 2.992, A_1000000: 2.695, A_2500000: 2.695,
      // VN class B (12M-25M)
      B_0: 4.785, B_250000: 3.828, B_500000: 3.256, B_1000000: 2.926, B_2500000: 2.926,
      // VN class C (25M-40M)
      C_0: 5.17, C_250000: 4.136, C_500000: 3.52, C_1000000: 3.168, C_2500000: 3.168,
      // VN class D (50M-90M) — sparse
      D_500000: 3.52,
      // VN class E (90M-110M) — sparse
      E_1000000: 3.168,
      // VN class F (>110M) — sparse
      F_2500000: 3.168,
    },
    TIERCE_COLLISION: {
      // ≤40M combined
      C_0: 4.311, C_250000: 3.651, C_500000: 2.232, C_1000000: 2.105, C_2500000: 1.035,
      D_500000: 2.232,
      E_1000000: 2.035,
      F_2500000: 1.035,
    },
  },
  "402": {
    TIERCE_COMPLETE: {
      A_0: 2.816, A_250000: 2.255, A_500000: 1.914, A_1000000: 1.727, A_2500000: 1.727,
      B_0: 3.069, B_250000: 2.453, B_500000: 2.09, B_1000000: 1.881, B_2500000: 1.881,
      C_0: 3.311, C_250000: 2.651, C_500000: 2.255, C_1000000: 2.035, C_2500000: 2.035,
      D_500000: 2.255,
      E_1000000: 2.035,
      F_2500000: 2.035,
    },
    TIERCE_COLLISION: {
      // Note: cat 402 DC a 50K au lieu de "Sans franchise" pour le 1er palier
      A_0: 2.716, A_50000: 2.716, A_250000: 2.235, A_500000: 1.914, A_1000000: 1.756, A_2500000: 1.72,
      B_0: 3.679, B_50000: 3.679, B_250000: 2.456, B_500000: 2.09, B_1000000: 1.881, B_2500000: 1.881,
      C_0: 3.911, C_50000: 3.911, C_250000: 2.7, C_500000: 2.35, C_1000000: 2.035, C_2500000: 2.1895,
      D_500000: 2.255,
      E_1000000: 2.035,
      F_2500000: 2.33,
    },
  },
};

// 412 shares the same rates as 401
TIERCE_RATES["412"] = {
  TIERCE_COMPLETE: { ...TIERCE_RATES["401"]["TIERCE_COMPLETE"] },
  TIERCE_COLLISION: { ...TIERCE_RATES["401"]["TIERCE_COLLISION"] },
};

function getDefaultCategoryTariffs(
  type: "TIERCE_COMPLETE" | "TIERCE_COLLISION",
  vehicleCategory?: string
): CategoryTariff[] {
  const now = Date.now();
  const tariffs: CategoryTariff[] = [];
  const cat = vehicleCategory || "401";
  const rates = TIERCE_RATES[cat]?.[type];
  if (!rates) return tariffs;

  for (const range of VN_RANGES) {
    for (const fl of FRANCHISE_LEVELS) {
      const key = `${range.key}_${fl.value}`;
      if (rates[key] != null) {
        tariffs.push({
          key: `${type.toLowerCase()}_${cat}_${range.key}_${fl.value}_${now}`,
          category: range.key,
          guaranteeType: type,
          valueMin: range.min,
          valueMax: range.max,
          valueLabel: range.label,
          franchise: fl.value,
          franchiseLabel: fl.label,
          prime: rates[key],
          vehicleCategory: cat,
        });
      }
    }
  }
  return tariffs;
}

/* ── Constants ── */
const emptyStep1: Step1Data = {
  name: "",
  insuranceCategoryId: "",
  categoryId: "",
  description: "",
  isMandatory: false,
  isOptional: false,
  conditions: "",
  displayOrder: "0",
};

const calcBadge: Record<string, string> = {
  FREE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  FIXED_AMOUNT: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  VARIABLE_BASED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MATRIX_BASED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
};

const calcLabel: Record<string, string> = {
  FREE: "Gratuit",
  FIXED_AMOUNT: "Montant fixe",
  VARIABLE_BASED: "Variable",
  MATRIX_BASED: "Matrice tarifaire",
};

const step2Options: {
  type: CalculationType;
  label: string;
  description: string;
  icon: typeof DollarSign;
  formula: string;
}[] = [
  {
    type: "FREE",
    label: "Gratuit",
    description:
      "Aucun frais additionnel. Prime = 0 FCFA. Idéal pour les garanties promotionnelles ou incluses.",
    icon: CircleDot,
    formula: "Prime = 0 FCFA",
  },
  {
    type: "FIXED_AMOUNT",
    label: "Montant fixe",
    description:
      "Un montant fixe est appliqué indépendamment des paramètres du véhicule. Ex: Assistance à 5 000 FCFA.",
    icon: DollarSign,
    formula: "Prime = Montant fixe (ou prix réduit en pack)",
  },
  {
    type: "VARIABLE_BASED",
    label: "Basé sur une variable du véhicule",
    description:
      "Le montant est calculé en pourcentage d'une variable (VN, VA, Puissance fiscale) avec option de seuil conditionnel.",
    icon: Percent,
    formula: "Prime = Variable × (Taux / 100)",
  },
  {
    type: "MATRIX_BASED",
    label: "Matrice tarifaire",
    description:
      "Le montant est déterminé par lookup dans une grille multi-dimensionnelle (PF, carburant, catégorie, formule).",
    icon: LayoutGrid,
    formula: "Prime = lookup dans la grille",
  },
];

const matrixDimensions = [
  { value: "FISCAL_POWER", label: "Puissance fiscale (CV)" },
  { value: "VEHICLE_CATEGORY", label: "Catégorie de véhicule" },
  { value: "FORMULA", label: "Formule (IC/IPT)" },
  { value: "TIERCE_COMPLETE", label: "Tierce complète" },
  { value: "TIERCE_COLLISION", label: "Tierce collision" },
];

const variableSources = [
  { value: "NEW_VALUE", label: "Valeur Neuve (VN)" },
  { value: "VENAL_VALUE", label: "Valeur Vénale (VA)" },
  { value: "FISCAL_POWER", label: "Puissance Fiscale (PF)"},];

/* ── Price display helpers ── */
const fmtPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

function displayCoveragePrice(cov: Coverage): string {
  if (cov.calculationType === "FREE") return "Gratuit";
  if (cov.calculationType === "FIXED_AMOUNT") {
    if (cov.fixedAmount != null) return fmtPrice(cov.fixedAmount);
    try {
      const meta = typeof cov.metadata === "string" ? JSON.parse(cov.metadata) : (cov.metadata || {});
      if ((meta as Record<string, unknown>).fixedAmount) return fmtPrice(Number((meta as Record<string, unknown>).fixedAmount));
    } catch { /* ignore */ }
    return "—";
  }
  if (cov.calculationType === "VARIABLE_BASED") {
    if (cov.conditionedByNewValue && cov.rateBelowThreshold != null && cov.rateAboveThreshold != null)
      return `${cov.rateBelowThreshold}% / ${cov.rateAboveThreshold}%`;
    if (cov.ratePercent != null) return `${cov.ratePercent} %`;
    try {
      const meta = typeof cov.metadata === "string" ? JSON.parse(cov.metadata) : (cov.metadata || {});
      const m = meta as Record<string, unknown>;
      if (m.conditionedByNewValue && m.rateBelowThresholdPercent && m.rateAboveThresholdPercent)
        return `${m.rateBelowThresholdPercent}% / ${m.rateAboveThresholdPercent}%`;
      if (m.ratePercent) return `${m.ratePercent} %`;
    } catch { /* ignore */ }
    return "—";
  }
  if (cov.calculationType === "MATRIX_BASED") {
    const dim = cov.matrixDimension || "";
    const labels: Record<string, string> = {
      FISCAL_POWER: "Grille PF",
      FORMULA: "Grille formules",
      VEHICLE_CATEGORY: "Grille catégories",
      TIERCE_COMPLETE: "Grille TC",
      TIERCE_COLLISION: "Grille TCol",
    };
    return labels[dim] || "Matrice";
  }
  return "—";
}

/* ── Component ── */
export function InsurerGuaranteesTab() {
  const { user } = useAppStore();
  const { toast } = useToast();

  const [insurerId, setInsurerId] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [categories, setCategories] = useState<CoverageCategory[]>([]);
  const [insuranceCategories, setInsuranceCategories] = useState<InsCatOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coverage | null>(null);
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>(emptyStep1);
  const [calcType, setCalcType] = useState<CalculationType | "">("");
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  // Matrix states (aligned with admin)
  const [matrixTariffs, setMatrixTariffs] = useState<MatrixTariff[]>([]);
  const [matrixFormulas, setMatrixFormulas] = useState<FormulaConfig[]>([]);
  const [matrixDefaultPrime, setMatrixDefaultPrime] = useState<number>(0);
  const [matrixDimension, setMatrixDimension] = useState<string>("FISCAL_POWER");
  const [categoryTariffs, setCategoryTariffs] = useState<CategoryTariff[]>([]);
  const [tierceVehicleCategory, setTierceVehicleCategory] = useState<string>("401");
  const [tierceCategories, setTierceCategories] = useState<string[]>(getDefaultVehicleCategories());
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Search / filter
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCoverages = coverages.filter((cov) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cov.name.toLowerCase().includes(q) ||
      cov.code?.toLowerCase().includes(q) ||
      (cov.category?.name || "").toLowerCase().includes(q) ||
      (calcLabel[cov.calculationType] || "").toLowerCase().includes(q) ||
      (cov.isMandatory ? "oui" : "non").includes(q) ||
      (cov.isActive ? "active" : "inactive").includes(q)
    );
  });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Coverage | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch helpers ── */
  const fetchInsurer = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurer/account`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInsurerId(data.id);
      return data.id;
    } catch {
      setError("Impossible de charger votre compte assureur");
      return null;
    }
  }, []);

  const fetchCoverages = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurer/coverages`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoverages(data.coverages || []);
    } catch {
      setError("Erreur lors du chargement des garanties");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/insurer/coverage-categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchInsuranceCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/insurer/insurance-categories");
      if (!res.ok) return;
      const data = await res.json();
      setInsuranceCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!insurerId) return;
    await fetchCoverages();
  }, [insurerId, fetchCoverages]);

  /* ── Init ── */
  useEffect(() => {
    if (!user.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const iid = await fetchInsurer();
      if (iid) await fetchCoverages();
      await Promise.all([fetchCategories(), fetchInsuranceCategories()]);
      setLoading(false);
    })();
  }, [user.id]);

  /* ── Wizard ── */
  const resetWizard = () => {
    setStep1(emptyStep1);
    setCalcType("");
    setMetadata({});
    setMatrixTariffs([]);
    setMatrixFormulas([]);
    setMatrixDefaultPrime(0);
    setMatrixDimension("FISCAL_POWER");
    setCategoryTariffs([]);
    setTierceVehicleCategory("401");
    setTierceCategories(getDefaultVehicleCategories());
    setNewCategoryInput("");
    setStep(1);
  };

  const openCreate = () => {
    setEditingItem(null);
    resetWizard();
    setDialogOpen(true);
  };

  const openEdit = (item: Coverage) => {
    setEditingItem(item);
    const insCat = insuranceCategories.find((c) => c.name === item.type);
    setStep1({
      name: item.name,
      insuranceCategoryId: insCat?.id || "",
      categoryId: item.category?.id || "",
      description: item.description || "",
      isMandatory: item.isMandatory,
      isOptional: item.isOptional || false,
      conditions: item.conditions || "",
      displayOrder: String(item.displayOrder ?? 0),
    });
    setCalcType(item.calculationType as CalculationType);

    let parsed: Record<string, unknown> = {};
    try {
      parsed =
        typeof item.metadata === "string"
          ? JSON.parse(item.metadata)
          : (item as unknown as Record<string, unknown>) || {};
    } catch {
      parsed = {};
    }

    setMetadata(parsed);

    // Restore matrix state
    const toNum = (v: unknown, fallback: number): number => {
      if (typeof v === "number" && !isNaN(v)) return v;
      if (typeof v === "string") { const n = Number(v); return isNaN(n) ? fallback : n; }
      return fallback;
    };
    setMatrixDimension((parsed.dimension as string) || "FISCAL_POWER");
    setMatrixDefaultPrime(toNum(parsed.defaultPrime, 0));
    setMatrixTariffs(Array.isArray(parsed.tariffs) ? (parsed.tariffs as MatrixTariff[]) : []);
    setMatrixFormulas(Array.isArray(parsed.formulas) ? (parsed.formulas as FormulaConfig[]) : []);
    setCategoryTariffs(Array.isArray(parsed.categoryTariffs) ? (parsed.categoryTariffs as CategoryTariff[]) : []);

    // Restore vehicle category from data
    const firstCat = (parsed.categoryTariffs as CategoryTariff[])?.[0];
    setTierceVehicleCategory(firstCat?.vehicleCategory || "401");
    // Reconstruit la liste des catégories depuis les données existantes + défauts
    const existingCats = new Set<string>();
    (parsed.categoryTariffs as CategoryTariff[])?.forEach(ct => { if (ct.vehicleCategory) existingCats.add(ct.vehicleCategory); });
    const allCats = [...new Set([...getDefaultVehicleCategories(), ...existingCats])].sort();
    setTierceCategories(allCats);

    setStep(1);
    setDialogOpen(true);
  };

  /* ── Metadata builder ── */
  const buildMetadata = (): Record<string, unknown> => {
    if (calcType === "FREE") {
      return { method: "FREE" };
    }

    if (calcType === "FIXED_AMOUNT") {
      const m: Record<string, unknown> = {
        method: "FIXED_AMOUNT",
        fixedAmount: Number(metadata.fixedAmount) || 0,
      };
      if (metadata.packPriceReduced !== undefined && metadata.packPriceReduced !== "")
        m.packPriceReduced = Number(metadata.packPriceReduced);
      if (metadata.capital !== undefined && metadata.capital !== "")
        m.capital = Number(metadata.capital);
      if (metadata.minAmount !== undefined && metadata.minAmount !== "")
        m.minAmount = Number(metadata.minAmount);
      if (metadata.maxAmount !== undefined && metadata.maxAmount !== "")
        m.maxAmount = Number(metadata.maxAmount);
      if (metadata.franchiseEnabled) {
        m.franchise = {
          type: metadata.franchiseType || "PERCENT",
          value: Number(metadata.franchiseValue) || 0,
          minAmount: Number(metadata.franchiseMin) || 0,
          maxAmount: Number(metadata.franchiseMax) || 0,
        };
      }
      if (metadata.requiresGuarantee) m.requiresGuarantee = metadata.requiresGuarantee;
      return m;
    }

    if (calcType === "VARIABLE_BASED") {
      const m: Record<string, unknown> = {
        method: "VARIABLE_BASED",
        variableSource: metadata.variableSource || "NEW_VALUE",
        ratePercent: Number(metadata.ratePercent) || 0,
      };
      if (metadata.conditionedByNewValue) {
        m.conditionedByNewValue = true;
        m.newValueThreshold = Number(metadata.newValueThreshold) || 0;
        m.rateBelowThresholdPercent = Number(metadata.rateBelowThresholdPercent) || 0;
        m.rateAboveThresholdPercent = Number(metadata.rateAboveThresholdPercent) || 0;
      }
      if (metadata.minAmount !== undefined && metadata.minAmount !== "")
        m.minAmount = Number(metadata.minAmount);
      if (metadata.maxAmount !== undefined && metadata.maxAmount !== "")
        m.maxAmount = Number(metadata.maxAmount);
      if (metadata.franchiseEnabled) {
        m.franchise = {
          type: metadata.franchiseType || "PERCENT",
          value: Number(metadata.franchiseValue) || 0,
          minAmount: Number(metadata.franchiseMin) || 0,
          maxAmount: Number(metadata.franchiseMax) || 0,
        };
      }
      if (metadata.requiresGuarantee) m.requiresGuarantee = metadata.requiresGuarantee;
      return m;
    }

    if (calcType === "MATRIX_BASED") {
      const m: Record<string, unknown> = {
        method: "MATRIX_BASED",
        dimension: matrixDimension,
        defaultPrime: matrixDefaultPrime || 0,
      };
      if (matrixTariffs.length > 0) m.tariffs = matrixTariffs;
      if (matrixFormulas.length > 0) m.formulas = matrixFormulas;
      if (categoryTariffs.length > 0)
        m.categoryTariffs = categoryTariffs.map(ct => ({
          category: ct.category,
          valueMin: ct.valueMin,
          valueMax: ct.valueMax,
          franchise: ct.franchise,
          prime: ct.prime,
          vehicleCategory: ct.vehicleCategory,
        }));
      return m;
    }

    return {};
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!step1.name.trim()) {
      toast({ title: "Erreur", description: "Le nom de la garantie est requis", variant: "destructive" });
      return;
    }
    if (!insurerId) {
      toast({ title: "Erreur", description: "Compte assureur non trouvé. Impossible de créer la garantie.", variant: "destructive" });
      return;
    }
    if (!calcType) {
      toast({ title: "Erreur", description: "Le mode de calcul est requis (étape 2)", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      insurerId,
      categoryId: step1.categoryId || null,
      type: insuranceCategories.find((c) => c.id === step1.insuranceCategoryId)?.name || "",
      name: step1.name.trim(),
      description: step1.description.trim() || null,
      calculationType: calcType,
      isMandatory: step1.isMandatory,
      isOptional: step1.isOptional,
      conditions: step1.conditions || "{}",
      displayOrder: parseInt(step1.displayOrder, 10) || 0,
      metadata: buildMetadata(),
      // Structured columns for direct querying
      variableSource: calcType === "VARIABLE_BASED" ? (metadata.variableSource as string) || "NEW_VALUE" : null,
      ratePercent: calcType === "VARIABLE_BASED" ? Number(metadata.ratePercent) || null : null,
      conditionedByNewValue: calcType === "VARIABLE_BASED" ? Boolean(metadata.conditionedByNewValue) : false,
      newValueThreshold: calcType === "VARIABLE_BASED" && metadata.conditionedByNewValue ? Number(metadata.newValueThreshold) || null : null,
      rateBelowThreshold: calcType === "VARIABLE_BASED" && metadata.conditionedByNewValue ? Number(metadata.rateBelowThresholdPercent) || null : null,
      rateAboveThreshold: calcType === "VARIABLE_BASED" && metadata.conditionedByNewValue ? Number(metadata.rateAboveThresholdPercent) || null : null,
      fixedAmount: calcType === "FIXED_AMOUNT" ? Number(metadata.fixedAmount) || null : null,
      matrixDimension: calcType === "MATRIX_BASED" ? matrixDimension : null,
      minAmount: metadata.minAmount !== undefined && metadata.minAmount !== "" ? Number(metadata.minAmount) : null,
      maxAmount: metadata.maxAmount !== undefined && metadata.maxAmount !== "" ? Number(metadata.maxAmount) : null,
      capital: metadata.capital !== undefined && metadata.capital !== "" ? Number(metadata.capital) : null,
      requiresGuarantee: (metadata.requiresGuarantee as string)?.trim() || null,
    };

    try {
      const url = editingItem
        ? `/api/insurer/coverages/${editingItem.id}`
        : "/api/insurer/coverages";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      toast({
        title: editingItem ? "Garantie mise à jour" : "Garantie créée",
        description: editingItem
          ? `"${step1.name}" a été modifiée.`
          : `"${step1.name}" a été ajoutée à vos garanties.`,
      });

      setDialogOpen(false);
      await refreshData();
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/insurer/coverages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({
        title: "Garantie supprimée",
        description: `"${deleteTarget.name}" a été désactivée.`,
      });
      setDeleteTarget(null);
      await refreshData();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la garantie",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  /* ── Franchise sub-form (shared by FIXED_AMOUNT & VARIABLE_BASED) ── */
  const renderFranchiseSection = () => (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex items-center gap-2 font-medium text-sm">
        <Info className="h-4 w-4 text-muted-foreground" />
        Configuration de la franchise
      </div>

      <div className="w-full">
        <Label className="text-xs">Type de franchise</Label>
        <RadioGroup
          className="flex gap-6 mt-1"
          value={(metadata.franchiseType as string) || "PERCENT"}
          onValueChange={(v) => setMetadata({ ...metadata, franchiseType: v })}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="PERCENT" id="frac-pct" />
            <Label htmlFor="frac-pct" className="text-sm font-normal">
              Pourcentage (%)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="AMOUNT" id="frac-amt" />
            <Label htmlFor="frac-amt" className="text-sm font-normal">
              Montant fixe (FCFA)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="w-full">
          <Label className="text-xs">
            {metadata.franchiseType === "AMOUNT" ? "Valeur (FCFA)" : "Taux (%)"}
          </Label>
          <Input
            className="w-full"
            type="number"
            step="0.01"
            placeholder="0"
            value={(metadata.franchiseValue as number) ?? ""}
            onChange={(e) =>
              setMetadata({
                ...metadata,
                franchiseValue: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="w-full">
          <Label className="text-xs">Montant min (FCFA)</Label>
          <Input
            className="w-full"
            type="number"
            placeholder="0"
            value={(metadata.franchiseMin as number) ?? ""}
            onChange={(e) =>
              setMetadata({
                ...metadata,
                franchiseMin: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="w-full">
          <Label className="text-xs">Montant max (FCFA)</Label>
          <Input
            className="w-full"
            type="number"
            placeholder="0"
            value={(metadata.franchiseMax as number) ?? ""}
            onChange={(e) =>
              setMetadata({
                ...metadata,
                franchiseMax: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>
    </div>
  );

  /* ── Common params (admin-aligned) ── */
  const renderCommonParams = () => (
    <>
      <Separator />
      <div className="rounded-lg border border-dashed p-4 space-y-4">
        <Label className="text-base font-semibold">Paramètres communs</Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Montant minimum (FCFA)</Label>
            <Input
              type="number"
              value={(metadata.minAmount as number) ?? ""}
              onChange={(e) =>
                setMetadata({ ...metadata, minAmount: e.target.value ? Number(e.target.value) : "" })
              }
              placeholder="Aucun minimum"
            />
          </div>
          <div>
            <Label>Montant maximum (FCFA)</Label>
            <Input
              type="number"
              value={(metadata.maxAmount as number) ?? ""}
              onChange={(e) =>
                setMetadata({ ...metadata, maxAmount: e.target.value ? Number(e.target.value) : "" })
              }
              placeholder="Aucun maximum"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Capital (FCFA)</Label>
            <Input
              type="number"
              value={(metadata.capital as number) ?? ""}
              onChange={(e) =>
                setMetadata({ ...metadata, capital: e.target.value ? Number(e.target.value) : "" })
              }
              placeholder="Ex: 3000000 (Avance sur recours)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Capitale de garantie si applicable
            </p>
          </div>
          <div>
            <Label>Garantie requise (code)</Label>
            <Select
              value={(metadata.requiresGuarantee as string) || ""}
              onValueChange={(v) =>
                setMetadata({ ...metadata, requiresGuarantee: v })
              }
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {coverages
                  .filter((c) => c.isActive)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Code de la garantie nécessaire pour activer celle-ci
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="font-medium">Franchise</Label>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-xs">Type de franchise</Label>
              <Select
                value={(metadata.franchiseType as string) || "__none__"}
                onValueChange={(v) =>
                  setMetadata({
                    ...metadata,
                    franchiseType: v === "__none__" ? "" : v,
                    franchiseEnabled: v !== "__none__",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucune franchise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune franchise</SelectItem>
                  <SelectItem value="PERCENT">Pourcentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Montant fixe (FCFA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(metadata.franchiseType as string) && (metadata.franchiseType as string) !== "__none__" && (
              <>
                <div>
                  <Label className="text-xs">
                    {metadata.franchiseType === "AMOUNT" ? "Montant (FCFA)" : "Taux (%)"}
                  </Label>
                  <Input
                    type="number"
                    step={(metadata.franchiseType as string) === "PERCENT" ? "0.01" : "1"}
                    value={(metadata.franchiseValue as number) ?? ""}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        franchiseValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min (FCFA)</Label>
                    <Input
                      type="number"
                      value={(metadata.franchiseMin as number) ?? ""}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          franchiseMin: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max (FCFA)</Label>
                    <Input
                      type="number"
                      value={(metadata.franchiseMax as number) ?? ""}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          franchiseMax: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  /* ── Render Step 3 ── */
  const renderStep3 = () => {
    /* ─── FREE ─── */
    if (calcType === "FREE") {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-8 text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4">
              <CircleDot className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-emerald-800 dark:text-emerald-300 font-semibold text-lg">
              Prime = 0 FCFA
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 max-w-md mx-auto">
              Aucune configuration supplémentaire requise. Cette garantie est
              incluse sans frais additionnels.
            </p>
          </div>
        </div>
      );
    }

    /* ─── FIXED_AMOUNT ─── */
    if (calcType === "FIXED_AMOUNT") {
      return (
        <div className="space-y-5">
          {/* Formula display */}
          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
            <p className="font-mono text-sm font-semibold text-sky-800 dark:text-sky-300">
              Prime = fixedAmount{" "}
              {(metadata.packPriceReduced as number)
                ? "(ou packPriceReduced si inclus dans un pack)"
                : ""}
            </p>
          </div>

          {/* Main fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <Label>Montant fixe (FCFA) *</Label>
              <Input
                className="w-full mt-1"
                type="number"
                placeholder="Ex: 5 000"
                value={(metadata.fixedAmount as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    fixedAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Montant de la prime pour cette garantie.
              </p>
            </div>
            <div className="w-full">
              <Label>Prix réduit en pack (FCFA)</Label>
              <Input
                className="w-full mt-1"
                type="number"
                placeholder="Ex: 3 000"
                value={(metadata.packPriceReduced as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    packPriceReduced: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Prix appliqué si la garantie est incluse dans un pack.
              </p>
            </div>
          </div>
        </div>
      );
    }

    /* ─── VARIABLE_BASED ─── */
    if (calcType === "VARIABLE_BASED") {
      return (
        <div className="space-y-5">
          {/* Formula display */}
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
            <p className="font-mono text-sm font-semibold text-orange-800 dark:text-orange-300">
              {metadata.conditionedByNewValue
                ? "Si variable ≤ seuil : variable × taux_sous / 100, sinon : variable × taux_au-dessus / 100"
                : "Prime = variableValue × (ratePercent / 100)"}
            </p>
          </div>

          {/* Variable source */}
          <div className="w-full">
            <Label>Variable source *</Label>
            <Select
              value={(metadata.variableSource as string) || "NEW_VALUE"}
              onValueChange={(v) =>
                setMetadata({ ...metadata, variableSource: v })
              }
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variableSources.map((vs) => (
                  <SelectItem key={vs.value} value={vs.value}>
                    {vs.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              La valeur du véhicule utilisée pour le calcul.
            </p>
          </div>

          {/* Base rate (always visible) */}
          <div className="w-full">
            <Label>Taux de base (%) *</Label>
            <Input
              className="w-full mt-1"
              type="number"
              step="0.01"
              placeholder="Ex: 0.8"
              value={(metadata.ratePercent as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  ratePercent: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: 0.8 pour Incendie, 1.2 pour Vol, 0.35 pour Bris de Glaces.
            </p>
          </div>

          {/* Example calculation */}
          {metadata.variableSource && metadata.ratePercent ? (
            <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground">Exemples de calcul :</p>
              <p className="font-mono">
                VN 18 000 000 × {metadata.ratePercent}% ={" "}
                <span className="font-bold text-foreground">
                  {(
                    18000000 *
                    ((metadata.ratePercent as number) || 0) /
                    100
                  ).toLocaleString("fr-FR")}{" "}
                  FCFA
                </span>
              </p>
              <p className="font-mono">
                VN 10 000 000 × {metadata.ratePercent}% ={" "}
                <span className="font-bold text-foreground">
                  {(
                    10000000 *
                    ((metadata.ratePercent as number) || 0) /
                    100
                  ).toLocaleString("fr-FR")}{" "}
                  FCFA
                </span>
              </p>
            </div>
          ) : null}

          <Separator />

          {/* Conditional toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="cond-toggle"
              checked={!!metadata.conditionedByNewValue}
              onCheckedChange={(v) =>
                setMetadata({ ...metadata, conditionedByNewValue: !!v })
              }
            />
            <Label htmlFor="cond-toggle">
              Taux conditionné par seuil de valeur neuve
            </Label>
          </div>
          {metadata.conditionedByNewValue && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="w-full">
                <Label className="text-xs">
                  Seuil VN (FCFA)
                </Label>
                <Input
                  className="w-full mt-1"
                  type="number"
                  placeholder="Ex: 25 000 000"
                  value={(metadata.newValueThreshold as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      newValueThreshold: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si VN ≤ seuil
                </p>
              </div>
              <div className="w-full">
                <Label className="text-xs">Taux sous seuil (%)</Label>
                <Input
                  className="w-full mt-1"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1.2"
                  value={(metadata.rateBelowThresholdPercent as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      rateBelowThresholdPercent:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="w-full">
                <Label className="text-xs">Taux au-dessus (%)</Label>
                <Input
                  className="w-full mt-1"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 2.0"
                  value={(metadata.rateAboveThresholdPercent as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      rateAboveThresholdPercent:
                        parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Conditional example */}
          {metadata.conditionedByNewValue && metadata.newValueThreshold ? (
            <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground">Exemples conditionnels :</p>
              <p className="font-mono">
                VN 18M ≤ {Number(metadata.newValueThreshold).toLocaleString("fr-FR")} → VN × {metadata.rateBelowThresholdPercent}% ={" "}
                <span className="font-bold text-foreground">
                  {(18000000 * ((metadata.rateBelowThresholdPercent as number) || 0) / 100).toLocaleString("fr-FR")} FCFA
                </span>
              </p>
              <p className="font-mono">
                VN 35M &gt; {Number(metadata.newValueThreshold).toLocaleString("fr-FR")} → VN × {metadata.rateAboveThresholdPercent}% ={" "}
                <span className="font-bold text-foreground">
                  {(35000000 * ((metadata.rateAboveThresholdPercent as number) || 0) / 100).toLocaleString("fr-FR")} FCFA
                </span>
              </p>
            </div>
          ) : null}
        </div>
      );
    }

    /* ─── MATRIX_BASED ─── */
    if (calcType === "MATRIX_BASED") {
      return (
        <div className="space-y-5">
          <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
            <p className="font-mono text-sm font-semibold text-violet-800 dark:text-violet-300">
              Prime = lookup dans la grille selon la dimension choisie
            </p>
          </div>

          <div className="w-full">
            <Label>Dimension de la matrice</Label>
            <Select
              value={matrixDimension}
              onValueChange={(v) => {
                setMatrixDimension(v);
                setMatrixTariffs([]);
                setMatrixFormulas([]);
                setCategoryTariffs([]);
              }}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {matrixDimensions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* ── Fiscal power matrix ── */}
          {matrixDimension === "FISCAL_POWER" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Définissez les tarifs selon le type de carburant et la puissance fiscale (CV).
              </p>
              {(!matrixTariffs || matrixTariffs.length === 0) ? (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">Aucun tarif configuré</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setMatrixTariffs(getDefaultFiscalPowerTariffs())}>
                    <Plus className="h-4 w-4 mr-2" />Initialiser avec tarifs par défaut
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["Essence", "Diesel"] as const).map((fuelType) => (
                    <div key={fuelType} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">{fuelType}</h4>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setMatrixTariffs([...matrixTariffs, { key: `${fuelType.toLowerCase()}_${Date.now()}`, fuelType, fiscalPowerMin: 1, fiscalPowerMax: 99, prime: 0 }]);
                        }}>
                          <Plus className="h-3 w-3 mr-1" />Ajouter
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {matrixTariffs.filter((t) => t.fuelType === fuelType).map((tariff) => (
                          <div key={tariff.key} className="flex items-center gap-2">
                            <Input type="number" className="h-8 w-16 text-sm" placeholder="Min" value={tariff.fiscalPowerMin || ""} onChange={(e) => {
                              setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, fiscalPowerMin: parseInt(e.target.value) || 1 } : t));
                            }} />
                            <span className="text-xs text-muted-foreground">-</span>
                            <Input type="number" className="h-8 w-16 text-sm" placeholder="Max" value={tariff.fiscalPowerMax === 99 ? "" : tariff.fiscalPowerMax} onChange={(e) => {
                              setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, fiscalPowerMax: parseInt(e.target.value) || 99 } : t));
                            }} />
                            <span className="text-xs bg-muted px-2 py-1 rounded">CV</span>
                            <Input type="number" className="h-8 w-24 text-sm" placeholder="Tarif" value={tariff.prime || ""} onChange={(e) => {
                              setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, prime: parseInt(e.target.value) || 0 } : t));
                            }} />
                            <span className="text-xs text-muted-foreground">FCFA</span>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setMatrixTariffs(matrixTariffs.filter(t => t.key !== tariff.key))}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label>Prime par défaut (FCFA) — optionnel</Label>
                <Input type="number" value={matrixDefaultPrime || ""} onChange={(e) => setMatrixDefaultPrime(parseInt(e.target.value) || 0)} placeholder="0" />
                <p className="text-xs text-muted-foreground mt-1">Utilisée si aucune correspondance n&apos;est trouvée dans la matrice</p>
              </div>
            </div>
          )}

          {/* ── Formula matrix (IC/IPT) ── */}
          {matrixDimension === "FORMULA" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Définissez les formules avec leurs plafonds de garanties et primes.
              </p>
              {matrixFormulas.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">Aucune formule configurée</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setMatrixFormulas(getDefaultFormulas())}>
                    <Plus className="h-4 w-4 mr-2" />Initialiser avec formules par défaut
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {matrixFormulas.map((formula) => (
                    <div key={formula.formula} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Formule {formula.formula}</span>
                          <Input type="text" value={formula.label} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, label: e.target.value } : f))} className="h-8 w-40 text-sm" placeholder="Libellé" />
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setMatrixFormulas(matrixFormulas.filter(f => f.formula !== formula.formula))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Capital Décès (FCFA)</Label>
                            <Input type="number" className="h-8 text-sm" value={formula.capitalDeces || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, capitalDeces: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                          </div>
                          <div>
                            <Label className="text-xs">Capital Invalidité (FCFA)</Label>
                            <Input type="number" className="h-8 text-sm" value={formula.capitalInvalidite || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, capitalInvalidite: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                          </div>
                          <div>
                            <Label className="text-xs">Frais Médicaux (FCFA)</Label>
                            <Input type="number" className="h-8 text-sm" value={formula.fraisMedicaux || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, fraisMedicaux: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                          </div>
                          {!formula.usePlaces && (
                            <div>
                              <Label className="text-xs">Prime fixe (FCFA)</Label>
                              <Input type="number" className="h-8 text-sm" value={formula.prime || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, prime: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border p-2">
                          <Checkbox
                            checked={formula.usePlaces}
                            onCheckedChange={(v) => {
                              const checked = !!v;
                              setMatrixFormulas(matrixFormulas.map(f =>
                                f.formula === formula.formula
                                  ? {
                                      ...f,
                                      usePlaces: checked,
                                      placesTariffs: checked
                                        ? (f.placesTariffs && f.placesTariffs.length > 0)
                                          ? f.placesTariffs
                                          : [{ places: 2, prime: 0, label: "2 places" }]
                                        : undefined,
                                    }
                                  : f
                              ));
                            }}
                            id={`use-places-${formula.formula}`}
                          />
                          <label htmlFor={`use-places-${formula.formula}`} className="text-xs cursor-pointer">
                            Basée sur le nombre de places
                          </label>
                        </div>
                        {formula.usePlaces && formula.placesTariffs && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Tarif par nombre de places (FCFA)</Label>
                            {formula.placesTariffs.map((pt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-24">
                                  <Label className="text-[10px] text-muted-foreground">Places</Label>
                                  <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={pt.places || ""}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      const newTariffs = (formula.placesTariffs || []).map((t, i) =>
                                        i === idx ? { ...t, places: val, label: `${val} place${val > 1 ? "s" : ""}` } : t
                                      );
                                      setMatrixFormulas(matrixFormulas.map(f =>
                                        f.formula === formula.formula ? { ...f, placesTariffs: newTariffs } : f
                                      ));
                                    }}
                                    min={1}
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-[10px] text-muted-foreground">Prime (FCFA)</Label>
                                  <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={pt.prime || ""}
                                    onChange={(e) => {
                                      const newTariffs = (formula.placesTariffs || []).map((t, i) =>
                                        i === idx ? { ...t, prime: parseInt(e.target.value) || 0 } : t
                                      );
                                      setMatrixFormulas(matrixFormulas.map(f =>
                                        f.formula === formula.formula ? { ...f, placesTariffs: newTariffs } : f
                                      ));
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive mt-4"
                                  onClick={() => {
                                    const newTariffs = (formula.placesTariffs || []).filter((_, i) => i !== idx);
                                    setMatrixFormulas(matrixFormulas.map(f =>
                                      f.formula === formula.formula ? { ...f, placesTariffs: newTariffs } : f
                                    ));
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const existing = formula.placesTariffs || [];
                                const maxPlaces = existing.length > 0 ? Math.max(...existing.map(p => p.places)) : 1;
                                const nextPlaces = maxPlaces + 1;
                                setMatrixFormulas(matrixFormulas.map(f =>
                                  f.formula === formula.formula
                                    ? { ...f, placesTariffs: [...existing, { places: nextPlaces, prime: 0, label: `${nextPlaces} place${nextPlaces > 1 ? "s" : ""}` }] }
                                    : f
                                ));
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />Ajouter une tranche
                            </Button>
                          </div>
                        )}
                      </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const nextNum = matrixFormulas.length > 0 ? Math.max(...matrixFormulas.map(f => f.formula)) + 1 : 1;
                    setMatrixFormulas([...matrixFormulas, { formula: nextNum, label: `Formule ${nextNum}`, capitalDeces: 0, capitalInvalidite: 0, fraisMedicaux: 0, prime: 0, usePlaces: false }]);
                  }}>
                    <Plus className="h-3 w-3 mr-1" />Ajouter une formule
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── VEHICLE_CATEGORY: category → prime mapping ── */}
          {matrixDimension === "VEHICLE_CATEGORY" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Définissez les primes par catégorie de véhicule (401, 402, etc.).
              </p>
              {(!matrixTariffs || matrixTariffs.length === 0) ? (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">Aucun tarif configuré</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setMatrixTariffs([
                    { key: `vc_401_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "401" },
                    { key: `vc_402_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "402" },
                    { key: `vc_412_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "412" },
                  ])}>
                    <Plus className="h-4 w-4 mr-2" />Initialiser avec catégories par défaut
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {matrixTariffs.map((tariff) => (
                    <div key={tariff.key} className="flex items-center gap-2">
                      <Input type="text" className="h-8 w-20 text-sm shrink-0" placeholder="Code" value={tariff.vehicleCategory || ""} onChange={(e) => {
                        setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, vehicleCategory: e.target.value } : t));
                      }} />
                      <Input type="number" className="h-8 flex-1 text-sm" placeholder="Prime FCFA" value={tariff.prime || ""} onChange={(e) => {
                        setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, prime: parseInt(e.target.value) || 0 } : t));
                      }} />
                      <span className="text-xs text-muted-foreground shrink-0">FCFA</span>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0 text-destructive" onClick={() => setMatrixTariffs(matrixTariffs.filter(t => t.key !== tariff.key))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setMatrixTariffs([...matrixTariffs, { key: `vc_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "" }]);
                  }}>
                    <Plus className="h-3 w-3 mr-1" />Ajouter une catégorie
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── TIERCE_COMPLETE / TIERCE_COLLISION: VN ranges × franchises grid ── */}
          {(matrixDimension === "TIERCE_COMPLETE" || matrixDimension === "TIERCE_COLLISION") && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {matrixDimension === "TIERCE_COMPLETE" ? "Tierce Complète (DTA)" : "Tierce Collision (DC)"} — Taux en % de la VN selon tranche et franchise.
              </p>

              {/* Vehicle category selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="text-sm shrink-0">Catégorie véhicule</Label>
                <div className="flex gap-1 flex-wrap">
                  {tierceCategories.map((cat) => (
                    <div key={cat} className="flex items-center gap-0">
                      <Button
                        type="button"
                        variant={tierceVehicleCategory === cat ? "default" : "outline"}
                        size="sm"
                        className={`rounded-r-none ${tierceVehicleCategory === cat ? "bg-[#B9E54D] text-black hover:bg-[#a5d044]" : ""}`}
                        onClick={() => {
                          setTierceVehicleCategory(cat);
                          setCategoryTariffs(getDefaultCategoryTariffs(
                            matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                            cat
                          ));
                        }}
                      >
                        {cat}
                      </Button>
                      <Button
                        type="button"
                        variant={tierceVehicleCategory === cat ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-6 p-0 rounded-l-none border-l-0 ${tierceVehicleCategory === cat ? "bg-[#B9E54D] text-black hover:bg-[#a5d044]" : "text-muted-foreground hover:text-destructive"}`}
                        onClick={() => {
                          const filtered = categoryTariffs.filter(ct => ct.vehicleCategory !== cat);
                          const remaining = tierceCategories.filter(c => c !== cat);
                          setTierceCategories(remaining);
                          setCategoryTariffs(filtered);
                          if (tierceVehicleCategory === cat && remaining.length > 0) {
                            const nextCat = remaining[0];
                            setTierceVehicleCategory(nextCat);
                            const defaults = getDefaultCategoryTariffs(
                              matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                              nextCat
                            );
                            setCategoryTariffs(defaults.length > 0 ? defaults : filtered);
                          }
                        }}
                        title="Supprimer la catégorie"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {/* Add category button */}
                  <div className="flex items-center gap-1 ml-2">
                    <Input
                      className="h-7 w-20 text-xs"
                      placeholder="Nouveau"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value.replace(/[^\w]/g, "").toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCategoryInput.trim()) {
                          if (!tierceCategories.includes(newCategoryInput.trim())) {
                            setTierceCategories([...tierceCategories, newCategoryInput.trim()].sort());
                            setTierceVehicleCategory(newCategoryInput.trim());
                            setCategoryTariffs([]);
                          }
                          setNewCategoryInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!newCategoryInput.trim() || tierceCategories.includes(newCategoryInput.trim())}
                      onClick={() => {
                        const cat = newCategoryInput.trim();
                        if (cat && !tierceCategories.includes(cat)) {
                          setTierceCategories([...tierceCategories, cat].sort());
                          setTierceVehicleCategory(cat);
                          setCategoryTariffs([]);
                        }
                        setNewCategoryInput("");
                      }}
                      title="Ajouter la catégorie"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {categoryTariffs.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">Aucune tarification configurée</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCategoryTariffs(getDefaultCategoryTariffs(matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION", tierceVehicleCategory))}>
                    <Plus className="h-4 w-4 mr-2" />Initialiser avec tarifs par défaut
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border bg-muted/50 text-xs font-medium">Tranche VN</th>
                        {FRANCHISE_LEVELS.map(fl => (
                          <th key={fl.value} className="text-center p-2 border bg-muted/50 text-xs font-medium">{fl.label}</th>
                        ))}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {VN_RANGES.map(range => {
                        const rowEntries = categoryTariffs.filter(ct => ct.valueMin === range.min && ct.guaranteeType === matrixDimension && ct.vehicleCategory === tierceVehicleCategory);
                        return (
                          <tr key={range.key}>
                            <td className="p-2 border font-medium text-xs whitespace-nowrap">{range.label}</td>
                            {FRANCHISE_LEVELS.map(fl => {
                              const entry = rowEntries.find(r => r.franchise === fl.value);
                              return (
                                <td key={fl.value} className="p-1 border text-center">
                                  {entry ? (
                                    <Input
                                      type="number"
                                      step="0.001"
                                      className="h-7 w-20 text-xs text-center mx-auto"
                                      value={entry.prime || ""}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setCategoryTariffs(categoryTariffs.map(ct => ct.key === entry.key ? { ...ct, prime: val } : ct));
                                      }}
                                    />
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                      onClick={() => {
                                        const now = Date.now();
                                        setCategoryTariffs([...categoryTariffs, {
                                          key: `${matrixDimension.toLowerCase()}_${tierceVehicleCategory}_${range.key}_${fl.value}_${now}`,
                                          category: range.key,
                                          guaranteeType: matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                                          valueMin: range.min,
                                          valueMax: range.max,
                                          valueLabel: range.label,
                                          franchise: fl.value,
                                          franchiseLabel: fl.label,
                                          prime: 0,
                                          vehicleCategory: tierceVehicleCategory,
                                        }]);
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  )}
                                </td>
                              );
                            })}
                            <td></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-2">
                    Les valeurs sont des <strong>taux en %</strong> de la VN. Ex: 4.4 = 4.4% × VN. Cliquez <span className="inline-flex align-middle"><Plus className="h-3 w-3" /></span> pour ajouter une cellule.
                  </p>
                </div>
              )}
              <div>
                <Label>Prime par défaut (FCFA) — optionnel</Label>
                <Input type="number" value={matrixDefaultPrime || ""} onChange={(e) => setMatrixDefaultPrime(parseInt(e.target.value) || 0)} placeholder="0" />
                <p className="text-xs text-muted-foreground mt-1">Utilisée si aucune correspondance n&apos;est trouvée dans la grille</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes Garanties</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les garanties et couvertures proposées dans vos offres.
          </p>
        </div>
        <Button
          className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
          onClick={openCreate}
          disabled={!insurerId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une garantie
        </Button>
      </div>

      {/* Guarantees table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Search bar */}
        <div className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher par nom, code, catégorie, type…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-muted/30 border-muted focus-visible:bg-background transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `${filteredCoverages.length} résultat${filteredCoverages.length > 1 ? "s" : ""} sur ${coverages.length} garantie${coverages.length > 1 ? "s" : ""}`
                : `${coverages.length} garantie${coverages.length > 1 ? "s" : ""} configurée${coverages.length > 1 ? "s" : ""}`
              }
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <ShieldCheck className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : coverages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                Aucune garantie configurée
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Cliquez sur &quot;Ajouter une garantie&quot; pour créer votre
                première garantie.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[160px]">Nom</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[130px]">
                    Catégorie
                  </TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">
                    Type de calcul
                  </TableHead>
                  <TableHead className="text-center w-[100px]">Obligatoire</TableHead>
                  <TableHead className="min-w-[120px]">Prix</TableHead>
                  <TableHead className="w-[90px]">Statut</TableHead>
                  <TableHead className="text-right w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoverages.length === 0 && searchQuery.trim() ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Aucune garantie ne correspond à &quot;{searchQuery}&quot;
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                          Effacer la recherche
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoverages.map((cov) => (
                  <TableRow key={cov.id}>
                    <TableCell className="font-medium">{cov.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cov.category?.name || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${calcBadge[cov.calculationType] ?? ""}`}
                      >
                        {calcLabel[cov.calculationType] || cov.calculationType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {cov.isMandatory ? (
                        <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Oui
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Non
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm max-w-[160px] truncate" title={displayCoveragePrice(cov)}>
                      {displayCoveragePrice(cov)}
                    </TableCell>
                    <TableCell>
                      {cov.isActive ? (
                        <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(cov)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cov)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Wizard Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier la garantie" : "Nouvelle garantie"}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step > s
                      ? "bg-emerald-500 text-white"
                      : step === s
                        ? "bg-[#B9E54D] text-black"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-12 ${
                      step > s ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <ScrollArea className="max-h-[70vh] pr-4">
            {/* Step 1: Basic info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="w-full">
                  <Label>Catégorie Produit</Label>
                  <Select value={step1.insuranceCategoryId} onValueChange={(v) => setStep1({ ...step1, insuranceCategoryId: v })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {insuranceCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full"><Label>Nom *</Label><Input className="w-full" value={step1.name} onChange={(e) => setStep1({ ...step1, name: e.target.value })} /></div>
                <div className="w-full"><Label>Description</Label><Textarea className="w-full" value={step1.description} onChange={(e) => setStep1({ ...step1, description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full">
                    <Label>Cat. Garantie</Label>
                    <Select value={step1.categoryId} onValueChange={(v) => setStep1({ ...step1, categoryId: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full"><Label>Ordre d&apos;affichage</Label><Input className="w-full" type="number" value={step1.displayOrder} onChange={(e) => setStep1({ ...step1, displayOrder: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between h-full pt-6">
                    <Label>Obligatoire</Label>
                    <Switch checked={step1.isMandatory} onCheckedChange={(v) => setStep1({ ...step1, isMandatory: v })} />
                  </div>
                  <div className="flex items-center justify-between h-full pt-6">
                    <Label>Optionnelle</Label>
                    <Switch checked={step1.isOptional} onCheckedChange={(v) => setStep1({ ...step1, isOptional: v })} />
                  </div>
                </div>
                <div className="w-full">
                  <Label>Conditions d&apos;application</Label>
                  <Textarea className="w-full" placeholder="Conditions d'application (optionnel)" rows={2} value={step1.conditions} onChange={(e) => setStep1({ ...step1, conditions: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 2: Calculation type selection */}
            {step === 2 && (
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez le mode de calcul de la prime pour cette garantie.
                </p>
                <div className="space-y-3">
                  {step2Options.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = calcType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setCalcType(opt.type);
                          // Reset metadata when switching type
                          setMetadata({});
                          setMatrixTariffs([]);
                          setMatrixFormulas([]);
                          setCategoryTariffs([]);
                        }}
                        className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-[#B9E54D] bg-[#B9E54D]/5 shadow-sm"
                            : "border-border hover:border-muted-foreground/30 bg-card"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isSelected
                              ? "bg-[#B9E54D] text-black"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {opt.label}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[#B9E54D]" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {opt.description}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground/70 mt-1">
                            {opt.formula}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Calculation config */}
            {step === 3 && (
              <div className="py-2 space-y-6">
                <div className="mb-4 flex items-center gap-2">
                  <Badge className={calcBadge[calcType] ?? ""}>
                    {calcLabel[calcType] ?? calcType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    — Configuration
                  </span>
                </div>
                {renderStep3()}
                {calcType && renderCommonParams()}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
            )}
            {step < 3 && (
              <Button
                className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !step1.name.trim()) || (step === 2 && !calcType)}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button
                className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingItem ? "Enregistrer" : "Créer la garantie"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette garantie ?</AlertDialogTitle>
            <AlertDialogDescription>
              La garantie &quot;{deleteTarget?.name}&quot; ({deleteTarget?.code})
              sera désactivée. Elle ne sera plus disponible dans vos offres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}