"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {

} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Check, Minus, X, DollarSign, Percent, LayoutGrid, CircleDot, Building2 } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
interface InsurerOption { id: string; name: string; code: string; logoUrl: string | null; }
interface CatOption { id: string; name: string; code: string; }
interface InsCatOption { id: string; name: string; }

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
  metadata: Record<string, unknown>;
  insurerId: string;
  categoryId: string | null;
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
  insurer: InsurerOption;
  category: CatOption | null;
  _count: { tariffRules: number };
}

interface TariffRule {
  id: string;
  coverageId: string;
  fuelType: string | null;
  minFiscalPower: number | null;
  maxFiscalPower: number | null;
  baseRate: number | null;
  fixedAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  formulaName: string | null;
}

/* ── Constants ─────────────────────────────────────────────── */
const calcBadge: Record<string, string> = {
  FREE: "bg-emerald-100 text-emerald-800",
  FIXED_AMOUNT: "bg-blue-100 text-blue-800",
  VARIABLE_BASED: "bg-orange-100 text-orange-800",
  MATRIX_BASED: "bg-purple-100 text-purple-800",
};
const calcLabel: Record<string, string> = {
  FREE: "Gratuit",
  FIXED_AMOUNT: "Montant fixe",
  VARIABLE_BASED: "Variable",
  MATRIX_BASED: "Matrice",
};

type CalculationType = "FREE" | "FIXED_AMOUNT" | "VARIABLE_BASED" | "MATRIX_BASED";
type VariableSourceType = "VENAL_VALUE" | "NEW_VALUE" | "FISCAL_POWER";
type FranchiseType = "PERCENT" | "AMOUNT";

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
  prime: number;
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
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
  { label: "2M", value: 2_000_000 },
  { label: "2.5M", value: 2_500_000 },
] as const;

interface Step1Data {
  name: string;
  insuranceCategoryId: string;
  description: string;
  insurerId: string;
  categoryId: string;
  isMandatory: boolean;
  displayOrder: string;
  isActive: boolean;
}

const emptyStep1: Step1Data = {
  name: "", insuranceCategoryId: "", description: "", insurerId: "", categoryId: "",
  isMandatory: false, displayOrder: "0", isActive: true,
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
    description: "Aucun frais additionnel. Prime = 0 FCFA. Idéal pour les garanties promotionnelles ou incluses.",
    icon: CircleDot,
    formula: "Prime = 0 FCFA",
  },
  {
    type: "FIXED_AMOUNT",
    label: "Montant fixe",
    description: "Un montant fixe est appliqué indépendamment des paramètres du véhicule. Ex: Assistance à 5 000 FCFA.",
    icon: DollarSign,
    formula: "Prime = Montant fixe (ou prix réduit en pack)",
  },
  {
    type: "VARIABLE_BASED",
    label: "Basé sur une variable du véhicule",
    description: "Le montant est calculé en pourcentage d'une variable (VN, VA, Puissance fiscale) avec option de seuil conditionnel.",
    icon: Percent,
    formula: "Prime = Variable × (Taux / 100)",
  },
  {
    type: "MATRIX_BASED",
    label: "Matrice tarifaire",
    description: "Le montant est déterminé par lookup dans une grille multi-dimensionnelle (PF, carburant, catégorie, formule).",
    icon: LayoutGrid,
    formula: "Prime = lookup dans la grille",
  },
];

/* ── Default tariff helpers ───────────────────────────────── */
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

function getDefaultCategoryTariffs(type: "TIERCE_COMPLETE" | "TIERCE_COLLISION"): CategoryTariff[] {
  const now = Date.now();
  const tariffs: CategoryTariff[] = [];
  const defaults: Record<string, Record<number, number>> = type === "TIERCE_COMPLETE"
    ? {
        A: { 0: 4_680 },
        B: { 500_000: 3_256, 1_000_000: 2_968, 2_000_000: 2_744, 2_500_000: 2_628 },
        C: { 1_000_000: 2_128, 2_000_000: 1_956 },
        D: { 2_500_000: 1_648 },
        F: { 2_500_000: 1_248 },
      }
    : {
        A: { 500_000: 2_232, 1_000_000: 2_052, 2_000_000: 1_912, 2_500_000: 1_836 },
        D: { 500_000: 1_764, 1_000_000: 1_628, 2_000_000: 1_516, 2_500_000: 1_456 },
      };
  for (const range of VN_RANGES) {
    const franchiseDefaults = defaults[range.key];
    if (!franchiseDefaults) continue;
    for (const [franchiseStr, prime] of Object.entries(franchiseDefaults)) {
      const franchise = Number(franchiseStr);
      const fl = FRANCHISE_LEVELS.find(f => f.value === franchise);
      tariffs.push({
        key: `${type.toLowerCase()}_${range.key}_${franchise}_${now}`,
        category: range.key,
        guaranteeType: type,
        valueMin: range.min,
        valueMax: range.max,
        valueLabel: range.label,
        franchise,
        franchiseLabel: fl?.label || `${franchise}`,
        prime,
      });
    }
  }
  return tariffs;
}

/* ── Component ─────────────────────────────────────────────── */
export function CoveragesTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Coverage[]>([]);
  const [insurers, setInsurers] = useState<InsurerOption[]>([]);
  const [categories, setCategories] = useState<CatOption[]>([]);
  const [insuranceCategories, setInsuranceCategories] = useState<InsCatOption[]>([]);
  const [search, setSearch] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCalcType, setFilterCalcType] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coverage | null>(null);
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>(emptyStep1);
  const [calcType, setCalcType] = useState<CalculationType | "">("");
  const [conditions, setConditions] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Step 3 structured config state ──────────────────────────
  const [varSource, setVarSource] = useState<VariableSourceType>("VENAL_VALUE");
  const [ratePercent, setRatePercent] = useState<number>(0);
  const [conditionedByNewValue, setConditionedByNewValue] = useState(false);
  const [newValueThreshold, setNewValueThreshold] = useState(25_000_000);
  const [rateBelowThreshold, setRateBelowThreshold] = useState(1.1);
  const [rateAboveThreshold, setRateAboveThreshold] = useState(2.1);
  const [fixedAmountVal, setFixedAmountVal] = useState<number>(0);
  const [matrixDimension, setMatrixDimension] = useState<string>("FISCAL_POWER");
  const [matrixTariffs, setMatrixTariffs] = useState<MatrixTariff[]>([]);
  const [matrixFormulas, setMatrixFormulas] = useState<FormulaConfig[]>([]);
  const [matrixDefaultPrime, setMatrixDefaultPrime] = useState<number>(0);
  const [categoryTariffs, setCategoryTariffs] = useState<CategoryTariff[]>([]);
  const [franchiseType, setFranchiseType] = useState<FranchiseType | "">("");
  const [franchiseValue, setFranchiseValue] = useState<number>(0);
  const [franchiseMin, setFranchiseMin] = useState<number>(0);
  const [franchiseMax, setFranchiseMax] = useState<number>(0);
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");
  const [capital, setCapital] = useState<number | "">("");
  const [requiresGuarantee, setRequiresGuarantee] = useState("");

  // Tariff rules panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tariffRules, setTariffRules] = useState<TariffRule[]>([]);
  const [trLoading, setTrLoading] = useState(false);
  const [trDialogOpen, setTrDialogOpen] = useState(false);
  const [trEditing, setTrEditing] = useState<TariffRule | null>(null);
  const [trDeleteId, setTrDeleteId] = useState<string | null>(null);
  const [trForm, setTrForm] = useState({
    fuelType: "", minFiscalPower: "", maxFiscalPower: "", baseRate: "", fixedAmount: "", minAmount: "", maxAmount: "", formulaName: "",
  });
  const [trSaving, setTrSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterInsurer) params.set("insurerId", filterInsurer);
      if (filterCategory) params.set("categoryId", filterCategory);
      if (filterCalcType) params.set("calculationType", filterCalcType);
      const res = await fetch(`/api/admin/coverages?${params}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les garanties", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, filterInsurer, filterCategory, filterCalcType, toast]);

  const fetchLookups = useCallback(async () => {
    try {
      const [insRes, catRes, insCatRes] = await Promise.all([
        fetch("/api/admin/insurers"),
        fetch("/api/admin/coverage-categories"),
        fetch("/api/admin/insurance-categories"),
      ]);
      if (insRes.ok) setInsurers(await insRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (insCatRes.ok) setInsuranceCategories(await insCatRes.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchLookups(); }, [fetchLookups]);
  useEffect(() => { setLoading(true); fetchItems(); }, [fetchItems]);

  const fetchTariffRules = useCallback(async (coverageId: string) => {
    setTrLoading(true);
    try {
      const res = await fetch(`/api/admin/coverages/${coverageId}/tariff-rules`);
      if (!res.ok) throw new Error();
      setTariffRules(await res.json());
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les règles", variant: "destructive" });
    } finally {
      setTrLoading(false);
    }
  }, [toast]);

  const handleRowClick = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    fetchTariffRules(id);
  };

  /* ── Wizard ─────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setStep1(emptyStep1);
    setCalcType("");
    setConditions("");
    setIsOptional(false);
    // Reset step 3 structured config
    setVarSource("VENAL_VALUE");
    setRatePercent(0);
    setConditionedByNewValue(false);
    setNewValueThreshold(25_000_000);
    setRateBelowThreshold(1.1);
    setRateAboveThreshold(2.1);
    setFixedAmountVal(0);
    setMatrixDimension("FISCAL_POWER");
    setMatrixTariffs([]);
    setMatrixFormulas([]);
    setMatrixDefaultPrime(0);
    setCategoryTariffs([]);
    setFranchiseType("");
    setFranchiseValue(0);
    setFranchiseMin(0);
    setFranchiseMax(0);
    setMinAmount("");
    setMaxAmount("");
    setCapital("");
    setRequiresGuarantee("");
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = (item: Coverage) => {
    setEditing(item);
    const insCat = insuranceCategories.find((c) => c.name === item.type);
    setStep1({
      name: item.name,
      insuranceCategoryId: insCat?.id || "",
      description: item.description ?? "",
      insurerId: item.insurerId,
      categoryId: item.categoryId || "__none__",
      isMandatory: item.isMandatory,
      displayOrder: String(item.displayOrder ?? 0),
      isActive: item.isActive,
    });
    setCalcType(item.calculationType as CalculationType);
    setConditions(item.conditions || "");
    setIsOptional(item.isOptional || false);

    // Load structured config from flat metadata format (matching pricing-service)
    const meta = (item.metadata && typeof item.metadata === "object") ? item.metadata : {};
    const p = meta as Record<string, unknown>;
    const franchise = (p.franchise && typeof p.franchise === "object" && p.franchise !== null) ? p.franchise as Record<string, unknown> : null;

    const toNum = (v: unknown, fallback: number): number => {
      if (typeof v === "number" && !isNaN(v)) return v;
      if (typeof v === "string") { const n = Number(v); return isNaN(n) ? fallback : n; }
      return fallback;
    };
    const toStr = (v: unknown, fallback: string): string => (typeof v === "string" ? v : fallback);

    if (item.calculationType === "VARIABLE_BASED") {
      setVarSource((toStr(p.variableSource, "VENAL_VALUE")) as VariableSourceType);
      setRatePercent(toNum(p.ratePercent, 0));
      setConditionedByNewValue(!!p.conditionedByNewValue);
      setNewValueThreshold(toNum(p.newValueThreshold, 25_000_000));
      setRateBelowThreshold(toNum(p.rateBelowThresholdPercent, 1.1));
      setRateAboveThreshold(toNum(p.rateAboveThresholdPercent, 2.1));
    } else {
      setVarSource("VENAL_VALUE");
      setRatePercent(0);
      setConditionedByNewValue(false);
      setNewValueThreshold(25_000_000);
      setRateBelowThreshold(1.1);
      setRateAboveThreshold(2.1);
    }

    if (item.calculationType === "FIXED_AMOUNT") {
      setFixedAmountVal(toNum(p.fixedAmount, 0));
    } else {
      setFixedAmountVal(0);
    }

    if (item.calculationType === "MATRIX_BASED") {
      setMatrixDimension(toStr(p.dimension, "FISCAL_POWER"));
      setMatrixTariffs(Array.isArray(p.tariffs) ? (p.tariffs as MatrixTariff[]) : []);
      setMatrixFormulas(Array.isArray(p.formulas) ? (p.formulas as FormulaConfig[]) : []);
      setMatrixDefaultPrime(toNum(p.defaultPrime, 0));
      setCategoryTariffs(Array.isArray(p.categoryTariffs) ? (p.categoryTariffs as CategoryTariff[]) : []);
    } else {
      setMatrixDimension("FISCAL_POWER");
      setMatrixTariffs([]);
      setMatrixFormulas([]);
      setMatrixDefaultPrime(0);
      setCategoryTariffs([]);
    }

    if (franchise) {
      const fType = toStr(franchise.type, "");
      setFranchiseType(fType === "PERCENT" || fType === "PERCENT_OF_CLAIM" ? "PERCENT" : fType === "FIXED" || fType === "AMOUNT" ? "AMOUNT" : "");
      setFranchiseValue(toNum(franchise.value, 0));
      setFranchiseMin(toNum(franchise.minAmount, 0));
      setFranchiseMax(toNum(franchise.maxAmount, 0));
    } else {
      setFranchiseType("");
      setFranchiseValue(0);
      setFranchiseMin(0);
      setFranchiseMax(0);
    }

    // Prefer direct DB columns over metadata for primitives
    setMinAmount(toNum(item.minAmount ?? p.minAmount, 0) || "");
    setMaxAmount(toNum(item.maxAmount ?? p.maxAmount, 0) || "");
    setCapital(toNum(item.capital ?? p.capital, 0) || "");
    setRequiresGuarantee(toStr(item.requiresGuarantee ?? p.requiresGuarantee, ""));

    setStep(1);
    setDialogOpen(true);
  };

  const buildMetadataFromStep3 = (): Record<string, unknown> => {
    const meta: Record<string, unknown> = {};

    if (calcType === "FREE") return { method: "FREE" };

    if (calcType === "FIXED_AMOUNT") {
      meta.method = "FIXED_AMOUNT";
      meta.fixedAmount = fixedAmountVal || 0;
    }

    if (calcType === "VARIABLE_BASED") {
      meta.method = "VARIABLE_BASED";
      meta.variableSource = varSource;
      meta.ratePercent = ratePercent || 0;
      meta.conditionedByNewValue = conditionedByNewValue;
      if (conditionedByNewValue) {
        meta.newValueThreshold = newValueThreshold || 25_000_000;
        meta.rateBelowThresholdPercent = rateBelowThreshold || 1.1;
        meta.rateAboveThresholdPercent = rateAboveThreshold || 2.1;
      }
    }

    if (calcType === "MATRIX_BASED") {
      meta.method = "MATRIX_BASED";
      meta.dimension = matrixDimension;
      meta.tariffs = matrixTariffs;
      meta.defaultPrime = matrixDefaultPrime || 0;
      if (matrixFormulas.length > 0) {
        meta.formulas = matrixFormulas;
      }
      if (categoryTariffs.length > 0) {
        meta.categoryTariffs = categoryTariffs.map(ct => ({
          category: ct.category,
          valueMin: ct.valueMin,
          valueMax: ct.valueMax,
          franchise: ct.franchise,
          prime: ct.prime,
        }));
      }
    }

    // Common fields
    if (franchiseType) {
      meta.franchise = {
        type: franchiseType === "PERCENT" ? "PERCENT_OF_CLAIM" : "FIXED",
        value: franchiseValue || 0,
        ...(franchiseMin && { minAmount: franchiseMin }),
        ...(franchiseMax && { maxAmount: franchiseMax }),
      };
    }
    if (minAmount !== "") meta.minAmount = Number(minAmount) || 0;
    if (maxAmount !== "") meta.maxAmount = Number(maxAmount) || 0;
    if (capital !== "") meta.capital = Number(capital) || 0;
    if (requiresGuarantee.trim()) meta.requiresGuarantee = requiresGuarantee.trim();

    return meta;
  };

  const handleSave = async () => {
    if (!step1.name.trim() || !step1.insurerId || !calcType) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/coverages/${editing.id}` : "/api/admin/coverages";
      const method = editing ? "PUT" : "POST";
      // Resolve insurance category name for the `type` field
      const insCat = insuranceCategories.find((c) => c.id === step1.insuranceCategoryId);
      const body = {
        name: step1.name,
        type: insCat?.name || "",
        description: step1.description,
        insurerId: step1.insurerId,
        categoryId: step1.categoryId && step1.categoryId !== "__none__" ? step1.categoryId : null,
        isMandatory: step1.isMandatory,
        isOptional,
        conditions: conditions || "{}",
        displayOrder: parseInt(step1.displayOrder, 10) || 0,
        isActive: step1.isActive,
        calculationType: calcType,
        metadata: buildMetadataFromStep3(),
        // Structured columns for direct querying
        variableSource: calcType === "VARIABLE_BASED" ? varSource : null,
        ratePercent: calcType === "VARIABLE_BASED" ? ratePercent : null,
        conditionedByNewValue: calcType === "VARIABLE_BASED" ? conditionedByNewValue : false,
        newValueThreshold: calcType === "VARIABLE_BASED" && conditionedByNewValue ? newValueThreshold : null,
        rateBelowThreshold: calcType === "VARIABLE_BASED" && conditionedByNewValue ? rateBelowThreshold : null,
        rateAboveThreshold: calcType === "VARIABLE_BASED" && conditionedByNewValue ? rateAboveThreshold : null,
        fixedAmount: calcType === "FIXED_AMOUNT" ? fixedAmountVal : null,
        matrixDimension: calcType === "MATRIX_BASED" ? matrixDimension : null,
        minAmount: minAmount !== "" ? Number(minAmount) : null,
        maxAmount: maxAmount !== "" ? Number(maxAmount) : null,
        capital: capital !== "" ? Number(capital) : null,
        requiresGuarantee: requiresGuarantee.trim() || null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      toast({ title: editing ? "Garantie modifiée" : "Garantie créée" });
      setDialogOpen(false);
      fetchItems();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/coverages/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Garantie supprimée" });
      setDeleteId(null);
      if (selectedId === deleteId) setSelectedId(null);
      fetchItems();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  /* ── Tariff Rule CRUD ────────────────────────────────────── */
  const openTrCreate = () => {
    setTrEditing(null);
    setTrForm({ fuelType: "", minFiscalPower: "", maxFiscalPower: "", baseRate: "", fixedAmount: "", minAmount: "", maxAmount: "", formulaName: "" });
    setTrDialogOpen(true);
  };

  const openTrEdit = (rule: TariffRule) => {
    setTrEditing(rule);
    setTrForm({
      fuelType: rule.fuelType ?? "", minFiscalPower: rule.minFiscalPower?.toString() ?? "", maxFiscalPower: rule.maxFiscalPower?.toString() ?? "",
      baseRate: rule.baseRate?.toString() ?? "", fixedAmount: rule.fixedAmount?.toString() ?? "", minAmount: rule.minAmount?.toString() ?? "",
      maxAmount: rule.maxAmount?.toString() ?? "", formulaName: rule.formulaName ?? "",
    });
    setTrDialogOpen(true);
  };

  const saveTr = async () => {
    if (!selectedId) return;
    setTrSaving(true);
    try {
      const body = {
        fuelType: trForm.fuelType || null,
        minFiscalPower: trForm.minFiscalPower ? parseInt(trForm.minFiscalPower, 10) : null,
        maxFiscalPower: trForm.maxFiscalPower ? parseInt(trForm.maxFiscalPower, 10) : null,
        baseRate: trForm.baseRate ? parseFloat(trForm.baseRate) : null,
        fixedAmount: trForm.fixedAmount ? parseFloat(trForm.fixedAmount) : null,
        minAmount: trForm.minAmount ? parseFloat(trForm.minAmount) : null,
        maxAmount: trForm.maxAmount ? parseFloat(trForm.maxAmount) : null,
        formulaName: trForm.formulaName || null,
      };
      const res = await fetch(`/api/admin/coverages/${selectedId}/tariff-rules`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Règle ajoutée" });
      setTrDialogOpen(false);
      fetchTariffRules(selectedId);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setTrSaving(false);
    }
  };

  const handleTrDelete = async () => {
    if (!trDeleteId || !selectedId) return;
    try {
      const res = await fetch(`/api/admin/tariff-rules/${trDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Règle tarifaire supprimée" });
      setTrDeleteId(null);
      fetchTariffRules(selectedId);
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  /* ── Render Step 3 ──────────────────────────────────────── */
  const renderStep3 = () => {
    if (calcType === "FREE") {
      return (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 text-center">
          <p className="text-emerald-700 font-medium text-lg">Gratuit</p>
          <p className="text-emerald-600 text-sm mt-1">Aucune configuration supplémentaire requise.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* ── FIXED_AMOUNT ──────────────────────────────────── */}
        {calcType === "FIXED_AMOUNT" && (
          <div className="rounded-lg border border-dashed p-4 space-y-4">
            <div>
              <Label className="text-base font-semibold">Montant fixe</Label>
              <p className="text-xs text-muted-foreground">Un montant fixe est appliqué indépendamment des paramètres du véhicule.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Prime fixe (FCFA) *</Label>
                <Input type="number" value={fixedAmountVal || ""} onChange={(e) => setFixedAmountVal(parseFloat(e.target.value) || 0)} placeholder="Ex: 50000" />
              </div>
            </div>
          </div>
        )}

        {/* ── VARIABLE_BASED ───────────────────────────────── */}
        {calcType === "VARIABLE_BASED" && (
          <div className="rounded-lg border border-dashed p-4 space-y-4">
            <div>
              <Label className="text-base font-semibold">Configuration Basée sur une Variable</Label>
              <p className="text-xs text-muted-foreground">Définissez la variable du véhicule et les tarifs appliqués</p>
            </div>
            <div>
              <Label>Variable source</Label>
              <Select value={varSource} onValueChange={(v) => setVarSource(v as VariableSourceType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENAL_VALUE">Valeur vénale (taux %)</SelectItem>
                  <SelectItem value="NEW_VALUE">Valeur neuve (taux %)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {varSource && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Checkbox
                  id="conditioned-by-new-value"
                  checked={conditionedByNewValue}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    setConditionedByNewValue(isChecked);
                    if (!isChecked) {
                      setNewValueThreshold(25_000_000);
                      setRateBelowThreshold(1.1);
                      setRateAboveThreshold(2.1);
                    }
                  }}
                />
                <div>
                  <Label htmlFor="conditioned-by-new-value" className="cursor-pointer text-sm font-medium">
                    Conditionné par la valeur neuve
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Applique un taux différent selon le seuil VN configuré ci-dessous
                  </p>
                </div>
              </div>
            )}

            {!conditionedByNewValue ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Taux (%) *</Label>
                  <Input type="number" step="0.01" value={ratePercent || ""} onChange={(e) => setRatePercent(parseFloat(e.target.value) || 0)} placeholder="Ex: 0.42" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <Label>Seuil valeur neuve (FCFA)</Label>
                  <Input type="number" value={newValueThreshold} onChange={(e) => setNewValueThreshold(parseInt(e.target.value, 10) || 25_000_000)} placeholder="25000000" />
                  <p className="text-xs text-muted-foreground">Seuil par défaut: 25 000 000 FCFA</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Taux si VN ≤ seuil (%)</Label>
                    <Input type="number" step="0.01" value={rateBelowThreshold} onChange={(e) => setRateBelowThreshold(parseFloat(e.target.value) || 1.1)} placeholder="1.1" />
                  </div>
                  <div>
                    <Label>Taux si VN &gt; seuil (%)</Label>
                    <Input type="number" step="0.01" value={rateAboveThreshold} onChange={(e) => setRateAboveThreshold(parseFloat(e.target.value) || 2.1)} placeholder="2.1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MATRIX_BASED ─────────────────────────────────── */}
        {calcType === "MATRIX_BASED" && (
          <div className="rounded-lg border border-dashed p-4 space-y-4">
            <div>
              <Label className="text-base font-semibold">Configuration Basée sur une Matrice</Label>
              <p className="text-xs text-muted-foreground">Définissez la dimension et les tarifs de la grille</p>
            </div>
            <div>
              <Label>Dimension de la matrice</Label>
              <Select value={matrixDimension} onValueChange={(v) => { setMatrixDimension(v); setMatrixTariffs([]); setMatrixFormulas([]); setCategoryTariffs([]); }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FISCAL_POWER">Puissance fiscale (CV)</SelectItem>
                  <SelectItem value="VEHICLE_CATEGORY">Catégorie de véhicule</SelectItem>
                  <SelectItem value="FORMULA">Formule (IC/IPT)</SelectItem>
                  <SelectItem value="TIERCE_COMPLETE">Tierce complète</SelectItem>
                  <SelectItem value="TIERCE_COLLISION">Tierce collision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fiscal power matrix */}
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

            {/* Formula matrix (IC/IPT) */}
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
                          <div>
                            <Label className="text-xs">Prime fixe (FCFA)</Label>
                            <Input type="number" className="h-8 text-sm" value={formula.prime || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, prime: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                          </div>
                        </div>
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

            {/* VEHICLE_CATEGORY: simple category → prime mapping */}
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
                        <Input type="text" className="h-8 w-20 text-sm" placeholder="Code" value={tariff.vehicleCategory || ""} onChange={(e) => {
                          setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, vehicleCategory: e.target.value } : t));
                        }} />
                        <Input type="number" className="h-8 w-32 text-sm" placeholder="Prime FCFA" value={tariff.prime || ""} onChange={(e) => {
                          setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, prime: parseInt(e.target.value) || 0 } : t));
                        }} />
                        <span className="text-xs text-muted-foreground">FCFA</span>
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setMatrixTariffs(matrixTariffs.filter(t => t.key !== tariff.key))}>
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

            {/* TIERCE_COMPLETE / TIERCE_COLLISION: VN ranges × franchises grid */}
            {(matrixDimension === "TIERCE_COMPLETE" || matrixDimension === "TIERCE_COLLISION") && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {matrixDimension === "TIERCE_COMPLETE" ? "Tierce Complète (DTA)" : "Tierce Collision (DC)"} — Définissez les primes par tranche VN et franchise.
                </p>
                {categoryTariffs.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">Aucune tarification configurée</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCategoryTariffs(getDefaultCategoryTariffs(matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION"))}>
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
                          const rowEntries = categoryTariffs.filter(ct => ct.valueMin === range.min && ct.guaranteeType === matrixDimension);
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
                                        className="h-7 w-20 text-xs text-center mx-auto"
                                        value={entry.prime || ""}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
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
                                            key: `${matrixDimension.toLowerCase()}_${range.key}_${fl.value}_${now}`,
                                            category: range.key,
                                            guaranteeType: matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                                            valueMin: range.min,
                                            valueMax: range.max,
                                            valueLabel: range.label,
                                            franchise: fl.value,
                                            franchiseLabel: fl.label,
                                            prime: 0,
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
                      Cliquez <span className="inline-flex align-middle"><Plus className="h-3 w-3" /></span> pour ajouter une cellule. Les primes sont en FCFA.
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
        )}

        {/* ── COMMON: Limits, Franchise, Capital ────────────── */}
        <Separator />
        <div className="rounded-lg border border-dashed p-4 space-y-4">
          <Label className="text-base font-semibold">Paramètres communs</Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Montant minimum (FCFA)</Label>
              <Input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : "")} placeholder="Aucun minimum" />
            </div>
            <div>
              <Label>Montant maximum (FCFA)</Label>
              <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : "")} placeholder="Aucun maximum" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Capital (FCFA)</Label>
              <Input type="number" value={capital} onChange={(e) => setCapital(e.target.value ? Number(e.target.value) : "")} placeholder="Ex: 3000000 (Avance sur recours)" />
              <p className="text-xs text-muted-foreground mt-1">Capitale de garantie si applicable</p>
            </div>
            <div>
              <Label>Garantie requise (code)</Label>
              <Input type="text" value={requiresGuarantee} onChange={(e) => setRequiresGuarantee(e.target.value)} placeholder="Ex: BDG (pour Toits Ouvrants)" />
              <p className="text-xs text-muted-foreground mt-1">Code de la garantie nécessaire pour activer celle-ci</p>
            </div>
          </div>

          {/* Franchise */}
          <div className="space-y-3">
            <Label className="font-medium">Franchise</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Type de franchise</Label>
                <Select value={franchiseType || "__none__"} onValueChange={(v) => setFranchiseType(v === "__none__" ? "" : v as FranchiseType)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Aucune franchise" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune franchise</SelectItem>
                    <SelectItem value="PERCENT">Pourcentage (%)</SelectItem>
                    <SelectItem value="AMOUNT">Montant fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {franchiseType && (
                <>
                  <div>
                    <Label className="text-xs">{franchiseType === "PERCENT" ? "Taux (%)" : "Montant (FCFA)"}</Label>
                    <Input type="number" step={franchiseType === "PERCENT" ? "0.01" : "1"} value={franchiseValue || ""} onChange={(e) => setFranchiseValue(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Min (FCFA)</Label>
                      <Input type="number" value={franchiseMin || ""} onChange={(e) => setFranchiseMin(parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-xs">Max (FCFA)</Label>
                      <Input type="number" value={franchiseMax || ""} onChange={(e) => setFranchiseMax(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Conditions & optional */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="coverage-conditions">Conditions d&apos;application</Label>
              <Textarea
                id="coverage-conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Conditions d'application (optionnel)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg border">
              <Checkbox
                id="coverage-optional"
                checked={isOptional}
                onCheckedChange={(v) => setIsOptional(!!v)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="coverage-optional" className="cursor-pointer font-medium text-sm">
                  Garantie optionnelle
                </Label>
                <p className="text-xs text-muted-foreground">
                  Cochez si cette garantie n&apos;est pas obligatoire dans le contrat
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const selectedCoverage = items.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Garanties</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setLoading(true); }} className="pl-9 w-44" />
          </div>
          <Select value={filterInsurer} onValueChange={(v) => { setFilterInsurer(v === "__all__" ? "" : v); setLoading(true); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Assureur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous</SelectItem>
              {insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v === "__all__" ? "" : v); setLoading(true); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCalcType} onValueChange={(v) => { setFilterCalcType(v === "__all__" ? "" : v); setLoading(true); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Méthode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes</SelectItem>
              <SelectItem value="FREE">Gratuit</SelectItem>
              <SelectItem value="FIXED_AMOUNT">Montant fixe</SelectItem>
              <SelectItem value="VARIABLE_BASED">Variable</SelectItem>
              <SelectItem value="MATRIX_BASED">Matrice</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Ajouter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl border-0 shadow-sm"><CardContent className="p-8 text-center text-muted-foreground">Aucune garantie trouvée</CardContent></Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Assureur</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead className="text-center">Obligatoire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer ${selectedId === item.id ? "bg-muted/60" : ""}`}
                    onClick={() => handleRowClick(item.id)}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm">{item.category?.name || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {item.insurer.logoUrl ? (
                        <img src={item.insurer.logoUrl} alt="" className="h-6 w-6 rounded object-contain bg-white dark:bg-muted p-0.5 border" />
                      ) : (
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /></div>
                      )}
                      {item.insurer.name}
                    </div>
                  </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${calcBadge[item.calculationType] ?? ""}`}>
                        {calcLabel[item.calculationType] ?? item.calculationType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{item.isMandatory ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                    <TableCell><Switch checked={item.isActive} onCheckedChange={async (v) => {
                      try { await fetch(`/api/admin/coverages/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: v }) }); fetchItems(); }
                      catch { toast({ title: "Erreur", variant: "destructive" }); }
                    }} onClick={(e) => e.stopPropagation()} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); openEdit(item); }} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }} title="Supprimer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <Card key={item.id} className={`rounded-xl border shadow-sm cursor-pointer transition-colors ${selectedId === item.id ? "ring-2 ring-[#B9E54D]" : ""}`} onClick={() => handleRowClick(item.id)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.insurer.logoUrl ? (
                          <img src={item.insurer.logoUrl} alt="" className="h-5 w-5 rounded object-contain bg-white dark:bg-muted p-0.5 border shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded bg-muted flex items-center justify-center shrink-0"><Building2 className="h-3 w-3 text-muted-foreground" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.insurer.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.type && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.type}</Badge>}
                        {item.category?.name && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.category.name}</Badge>}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${calcBadge[item.calculationType] ?? ""}`}>
                      {calcLabel[item.calculationType] ?? item.calculationType}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-3 w-3 mr-1" />Modifier</Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Tariff Rules Panel */}
      {selectedId && selectedCoverage && (
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Règles tarifaires</h2>
                <p className="text-sm text-muted-foreground">{selectedCoverage.code} — {selectedCoverage.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}><X className="h-4 w-4 mr-1" />Fermer</Button>
                <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" size="sm" onClick={openTrCreate}>
                  <Plus className="h-4 w-4 mr-1" />Ajouter
                </Button>
              </div>
            </div>
            {trLoading ? (
              <Skeleton className="h-24 rounded-lg" />
            ) : tariffRules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune règle tarifaire</p>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Carburant</TableHead>
                      <TableHead className="text-center">Min CV</TableHead>
                      <TableHead className="text-center">Max CV</TableHead>
                      <TableHead className="text-right">Taux (%)</TableHead>
                      <TableHead className="text-right">Montant fixe</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tariffRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-sm">{rule.fuelType ?? "—"}</TableCell>
                        <TableCell className="text-center text-sm">{rule.minFiscalPower ?? "—"}</TableCell>
                        <TableCell className="text-center text-sm">{rule.maxFiscalPower ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm">{rule.baseRate != null ? `${rule.baseRate}%` : "—"}</TableCell>
                        <TableCell className="text-right text-sm">{rule.fixedAmount != null ? new Intl.NumberFormat("fr-FR").format(rule.fixedAmount) + " FCFA" : "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTrEdit(rule)} title="Modifier">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setTrDeleteId(rule.id)} title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Wizard Dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh]">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la garantie" : "Nouvelle garantie"}</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step > s ? "bg-emerald-500 text-white" : step === s ? "bg-[#B9E54D] text-black" : "bg-muted text-muted-foreground"}`}>
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-emerald-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <ScrollArea className="max-h-[70vh] pr-4">
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
                    <Label>Assureur *</Label>
                    <Select value={step1.insurerId} onValueChange={(v) => setStep1({ ...step1, insurerId: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="w-full">
                    <Label>Cat. Garantie</Label>
                    <Select value={step1.categoryId} onValueChange={(v) => setStep1({ ...step1, categoryId: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="w-full"><Label>Ordre d'affichage</Label><Input className="w-full" type="number" value={step1.displayOrder} onChange={(e) => setStep1({ ...step1, displayOrder: e.target.value })} /></div>
                  <div className="flex items-center justify-between h-full pt-6">
                    <Label>Obligatoire</Label>
                    <Switch checked={step1.isMandatory} onCheckedChange={(v) => setStep1({ ...step1, isMandatory: v })} />
                  </div>
                </div>
              </div>
            )}

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

            {step === 3 && (
              <div className="py-2">
                <div className="mb-4 flex items-center gap-2">
                  <Badge className={calcBadge[calcType] ?? ""}>{calcLabel[calcType] ?? calcType}</Badge>
                  <span className="text-sm text-muted-foreground">— Configuration</span>
                </div>
                {renderStep3()}
              </div>
            )}

          </ScrollArea>

          <DialogFooter className="gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" />Précédent</Button>
            )}
            {step < 3 && (
              <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" onClick={() => setStep(step + 1)} disabled={step === 1 && (!step1.name.trim() || !step1.insurerId)}>
                Suivant<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tariff Rule Dialog */}
      <Dialog open={trDialogOpen} onOpenChange={setTrDialogOpen}>
        <DialogContent className="sm:max-w-lg max-w-[95vw]">
          <DialogHeader><DialogTitle>{trEditing ? "Modifier la règle" : "Nouvelle règle tarifaire"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Carburant</Label><Input className="w-full" value={trForm.fuelType} onChange={(e) => setTrForm({ ...trForm, fuelType: e.target.value })} placeholder="ESSENCE, DIESEL" /></div>
              <div><Label>Formule</Label><Input className="w-full" value={trForm.formulaName} onChange={(e) => setTrForm({ ...trForm, formulaName: e.target.value })} placeholder="Formule 1" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Min CV</Label><Input className="w-full" type="number" value={trForm.minFiscalPower} onChange={(e) => setTrForm({ ...trForm, minFiscalPower: e.target.value })} /></div>
              <div><Label>Max CV</Label><Input className="w-full" type="number" value={trForm.maxFiscalPower} onChange={(e) => setTrForm({ ...trForm, maxFiscalPower: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Taux (%)</Label><Input className="w-full" type="number" step="0.01" value={trForm.baseRate} onChange={(e) => setTrForm({ ...trForm, baseRate: e.target.value })} /></div>
              <div><Label>Montant fixe (FCFA)</Label><Input className="w-full" type="number" value={trForm.fixedAmount} onChange={(e) => setTrForm({ ...trForm, fixedAmount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Montant min (FCFA)</Label><Input className="w-full" type="number" value={trForm.minAmount} onChange={(e) => setTrForm({ ...trForm, minAmount: e.target.value })} /></div>
              <div><Label>Montant max (FCFA)</Label><Input className="w-full" type="number" value={trForm.maxAmount} onChange={(e) => setTrForm({ ...trForm, maxAmount: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrDialogOpen(false)}>Annuler</Button>
            <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" onClick={saveTr} disabled={trSaving}>{trSaving ? "..." : trEditing ? "Modifier" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer la garantie ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Les règles tarifaires associées seront également supprimées.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Tariff Rule Delete Dialog ──────────────────────── */}
      <AlertDialog open={!!trDeleteId} onOpenChange={() => setTrDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer la règle tarifaire ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleTrDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}