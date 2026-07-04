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
  Minus,
  Info,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface CoverageCategory {
  id: string;
  name: string;
  code: string;
}

interface Coverage {
  id: string;
  code: string;
  type: string;
  name: string;
  description: string | null;
  calculationType: string;
  isMandatory: boolean;
  isActive: boolean;
  displayOrder: number;
  metadata: string;
  category: { id: string; name: string; code: string } | null;
}

type CalculationType =
  | "FREE"
  | "FIXED_AMOUNT"
  | "VARIABLE_BASED"
  | "MATRIX_BASED";

interface Step1Data {
  name: string;
  categoryId: string;
  description: string;
  isMandatory: boolean;
}

/* Matrix sub-types */
interface MatrixTariff {
  id: string;
  fiscalPowerMin: number;
  fiscalPowerMax: number;
  fuelType: string;
  vehicleCategory: string;
  prime: number;
}

interface MatrixFormula {
  id: string;
  name: string;
  baseRate: number;
  ceiling: number;
}

interface CategoryTariff {
  id: string;
  category: string;
  valueMin: number;
  valueMax: number;
  franchise: number;
  prime: number;
}

/* ── Constants ── */
const emptyStep1: Step1Data = {
  name: "",
  categoryId: "",
  description: "",
  isMandatory: false,
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

const variableSources = [
  { value: "NEW_VALUE", label: "Valeur Neuve (VN)" },
  { value: "VENAL_VALUE", label: "Valeur Vénale (VA)" },
  { value: "FISCAL_POWER", label: "Puissance Fiscale (PF)" },
];

const matrixDimensions = [
  { value: "FISCAL_POWER", label: "Puissance fiscale" },
  { value: "FUEL_TYPE", label: "Type de carburant" },
  { value: "VEHICLE_CATEGORY", label: "Catégorie véhicule" },
  { value: "SEATS", label: "Nombre de places" },
  { value: "FORMULA", label: "Formule (IC/IPT)" },
  { value: "TIERCE_COMPLETE", label: "Tierce complète" },
  { value: "TIERCE_COLLISION", label: "Tierce collision" },
];

const fuelTypes = [
  { value: "ESSENCE", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRIDE", label: "Hybride" },
  { value: "ELECTRIQUE", label: "Électrique" },
  { value: "GPL", label: "GPL" },
];

const vehicleCategories = [
  { value: "VP", label: "VP - Véhicule Particulier" },
  { value: "VT", label: "VT - Véhicule de Tourisme" },
  { value: "VUL", label: "VUL - Véhicule Utilitaire Léger" },
  { value: "PL", label: "PL - Poids Lourd" },
  { value: "MOTO", label: "Moto" },
  { value: "CAMION", label: "Camion" },
  { value: "ENGIN", label: "Engin" },
  { value: "AUTRE", label: "Autre" },
];

const emptyTariff: MatrixTariff = {
  id: crypto.randomUUID(),
  fiscalPowerMin: 0,
  fiscalPowerMax: 0,
  fuelType: "",
  vehicleCategory: "",
  prime: 0,
};

const emptyFormula: MatrixFormula = {
  id: crypto.randomUUID(),
  name: "",
  baseRate: 0,
  ceiling: 0,
};

const emptyCategoryTariff: CategoryTariff = {
  id: crypto.randomUUID(),
  category: "VP",
  valueMin: 0,
  valueMax: 0,
  franchise: 0,
  prime: 0,
};

/* ── Component ── */
export function InsurerGuaranteesTab() {
  const { user } = useAppStore();
  const { toast } = useToast();

  const [insurerId, setInsurerId] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [categories, setCategories] = useState<CoverageCategory[]>([]);
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

  // Matrix array states
  const [tariffs, setTariffs] = useState<MatrixTariff[]>([]);
  const [formulas, setFormulas] = useState<MatrixFormula[]>([]);
  const [categoryTariffs, setCategoryTariffs] = useState<CategoryTariff[]>([]);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Coverage | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch helpers ── */
  const fetchInsurer = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/insurer/account?userId=${userId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInsurerId(data.id);
      return data.id;
    } catch {
      setError("Impossible de charger votre compte assureur");
      return null;
    }
  }, []);

  const fetchCoverages = useCallback(async (iid: string) => {
    try {
      const res = await fetch(`/api/insurer/coverages?insurerId=${iid}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoverages(data.coverages || []);
    } catch {
      setError("Erreur lors du chargement des garanties");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coverage-categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!insurerId) return;
    await fetchCoverages(insurerId);
  }, [insurerId, fetchCoverages]);

  /* ── Init ── */
  useEffect(() => {
    if (!user.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const iid = await fetchInsurer(user.id!);
      if (iid) await fetchCoverages(iid);
      await fetchCategories();
      setLoading(false);
    })();
  }, [user.id]);

  /* ── Wizard ── */
  const resetWizard = () => {
    setStep1(emptyStep1);
    setCalcType("");
    setMetadata({});
    setTariffs([]);
    setFormulas([]);
    setCategoryTariffs([]);
    setStep(1);
  };

  const openCreate = () => {
    setEditingItem(null);
    resetWizard();
    setDialogOpen(true);
  };

  const openEdit = (item: Coverage) => {
    setEditingItem(item);
    setStep1({
      name: item.name,
      categoryId: item.category?.id || "",
      description: item.description || "",
      isMandatory: item.isMandatory,
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

    // Restore matrix arrays
    setTariffs((parsed.tariffs as MatrixTariff[])?.map((t) => ({ ...t, id: t.id || crypto.randomUUID() })) || []);
    setFormulas((parsed.formulas as MatrixFormula[])?.map((f) => ({ ...f, id: f.id || crypto.randomUUID() })) || []);
    setCategoryTariffs(
      (parsed.categoryTariffs as CategoryTariff[])?.map((c) => ({ ...c, id: c.id || crypto.randomUUID() })) || []
    );

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
        dimension: metadata.dimension || "FISCAL_POWER",
      };
      if (tariffs.length > 0) m.tariffs = tariffs.map(({ id: _id, ...rest }) => rest);
      if (formulas.length > 0) m.formulas = formulas.map(({ id: _id, ...rest }) => rest);
      if (categoryTariffs.length > 0)
        m.categoryTariffs = categoryTariffs.map(({ id: _id, ...rest }) => rest);
      return m;
    }

    return {};
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!step1.name.trim() || !insurerId || !calcType) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);

    const payload = {
      insurerId,
      categoryId: step1.categoryId || null,
      name: step1.name.trim(),
      description: step1.description.trim() || null,
      calculationType: calcType,
      isMandatory: step1.isMandatory,
      metadata: buildMetadata(),
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

  /* ── Matrix helpers ── */
  const updateTariff = (id: string, field: keyof MatrixTariff, value: string | number) => {
    setTariffs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };
  const updateFormula = (id: string, field: keyof MatrixFormula, value: string | number) => {
    setFormulas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };
  const updateCategoryTariff = (id: string, field: keyof CategoryTariff, value: string | number) => {
    setCategoryTariffs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          {/* Optional: capital & requiresGuarantee */}
          <div className="w-full">
            <Label>Capital (FCFA) — optionnel</Label>
            <Input
              className="w-full mt-1"
              type="number"
              placeholder="Ex: 3 000 000"
              value={(metadata.capital as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  capital: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Montant du capital couvert, le cas échéant.
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

          <div className="w-full">
            <Label>Capital (FCFA)</Label>
            <Input
              className="w-full mt-1"
              type="number"
              placeholder="Ex: 3 000 000"
              value={(metadata.capital as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  capital: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: Avance sur recours 3 000 000 FCFA.
            </p>
          </div>

          <Separator />

          {/* Min / Max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <Label>Plancher minimum (FCFA)</Label>
              <Input
                className="w-full mt-1"
                type="number"
                placeholder="0"
                value={(metadata.minAmount as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    minAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="w-full">
              <Label>Plafond maximum (FCFA)</Label>
              <Input
                className="w-full mt-1"
                type="number"
                placeholder="0"
                value={(metadata.maxAmount as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    maxAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Franchise toggle + form */}
          <div className="flex items-center gap-2">
            <Switch
              id="frac-toggle-fixed"
              checked={!!metadata.franchiseEnabled}
              onCheckedChange={(v) =>
                setMetadata({ ...metadata, franchiseEnabled: !!v })
              }
            />
            <Label htmlFor="frac-toggle-fixed">Appliquer une franchise</Label>
          </div>
          {metadata.franchiseEnabled && renderFranchiseSection()}

          <Separator />

          {/* Requires guarantee */}
          <div className="w-full">
            <Label>Garantie prérequise — optionnel</Label>
            <Select
              value={(metadata.requiresGuarantee as string) || ""}
              onValueChange={(v) =>
                setMetadata({ ...metadata, requiresGuarantee: v })
              }
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Aucune prérequis" />
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
              Ex: BDG pour Toits Ouvrants.
            </p>
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

          <Separator />

          {/* Min / Max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full">
              <Label>Plancher minimum (FCFA)</Label>
              <Input
                className="w-full mt-1"
                type="number"
                placeholder="0"
                value={(metadata.minAmount as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    minAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="w-full">
              <Label>Plafond maximum (FCFA)</Label>
              <Input
                className="w-full mt-1"
                type="number"
                placeholder="0"
                value={(metadata.maxAmount as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    maxAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Franchise */}
          <div className="flex items-center gap-2">
            <Switch
              id="frac-toggle-var"
              checked={!!metadata.franchiseEnabled}
              onCheckedChange={(v) =>
                setMetadata({ ...metadata, franchiseEnabled: !!v })
              }
            />
            <Label htmlFor="frac-toggle-var">Appliquer une franchise</Label>
          </div>
          {metadata.franchiseEnabled && renderFranchiseSection()}

          <Separator />

          {/* Requires guarantee */}
          <div className="w-full">
            <Label>Garantie prérequise — optionnel</Label>
            <Select
              value={(metadata.requiresGuarantee as string) || ""}
              onValueChange={(v) =>
                setMetadata({ ...metadata, requiresGuarantee: v })
              }
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Aucune prérequis" />
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
              Ex: BDG pour Toits Ouvrants.
            </p>
          </div>
        </div>
      );
    }

    /* ─── MATRIX_BASED ─── */
    if (calcType === "MATRIX_BASED") {
      return (
        <div className="space-y-5">
          {/* Formula display */}
          <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
            <p className="font-mono text-sm font-semibold text-violet-800 dark:text-violet-300">
              Prime = lookup dans la grille selon la dimension choisie
            </p>
          </div>

          {/* Dimension selector */}
          <div className="w-full">
            <Label>Dimension de recherche *</Label>
            <Select
              value={(metadata.dimension as string) || "FISCAL_POWER"}
              onValueChange={(v) =>
                setMetadata({ ...metadata, dimension: v })
              }
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
            <p className="text-xs text-muted-foreground mt-1">
              La dimension utilisée pour chercher la prime dans la grille.
            </p>
          </div>

          <Separator />

          {/* Accordion sections */}
          <Accordion type="multiple" className="w-full">
            {/* ─ Tarifs par puissance ─ */}
            <AccordionItem value="tariffs">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Grille tarifaire (Puissance fiscale)
                {tariffs.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {tariffs.length} ligne(s)
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Définissez les tranches de puissance fiscale avec la prime
                    associée. Utilisé pour la RC et garanties indexées par PF.
                  </p>

                  {tariffs.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">PF Min</TableHead>
                            <TableHead className="text-xs">PF Max</TableHead>
                            <TableHead className="text-xs">Carburant</TableHead>
                            <TableHead className="text-xs">Catégorie</TableHead>
                            <TableHead className="text-xs">Prime (FCFA)</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tariffs.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell>
                                <Input
                                  className="w-20 h-8 text-xs"
                                  type="number"
                                  value={t.fiscalPowerMin || ""}
                                  onChange={(e) =>
                                    updateTariff(
                                      t.id,
                                      "fiscalPowerMin",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-20 h-8 text-xs"
                                  type="number"
                                  value={t.fiscalPowerMax || ""}
                                  onChange={(e) =>
                                    updateTariff(
                                      t.id,
                                      "fiscalPowerMax",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={t.fuelType}
                                  onValueChange={(v) =>
                                    updateTariff(t.id, "fuelType", v)
                                  }
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fuelTypes.map((f) => (
                                      <SelectItem
                                        key={f.value}
                                        value={f.value}
                                      >
                                        {f.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={t.vehicleCategory}
                                  onValueChange={(v) =>
                                    updateTariff(t.id, "vehicleCategory", v)
                                  }
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleCategories.map((vc) => (
                                      <SelectItem
                                        key={vc.value}
                                        value={vc.value}
                                      >
                                        {vc.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-28 h-8 text-xs"
                                  type="number"
                                  value={t.prime || ""}
                                  onChange={(e) =>
                                    updateTariff(
                                      t.id,
                                      "prime",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setTariffs((prev) =>
                                      prev.filter((x) => x.id !== t.id)
                                    )
                                  }
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() =>
                      setTariffs((prev) => [
                        ...prev,
                        { ...emptyTariff, id: crypto.randomUUID() },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter une ligne tarifaire
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ─ Formules IC/IPT ─ */}
            <AccordionItem value="formulas">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Formules (IC/IPT)
                {formulas.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {formulas.length} formule(s)
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Configurez les formules IC (Incendie Complet) / IPT avec
                    taux de base et plafonds.
                  </p>

                  {formulas.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Nom</TableHead>
                            <TableHead className="text-xs">
                              Taux de base (%)
                            </TableHead>
                            <TableHead className="text-xs">
                              Plafond (FCFA)
                            </TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formulas.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell>
                                <Input
                                  className="w-32 h-8 text-xs"
                                  placeholder="Formule 1"
                                  value={f.name}
                                  onChange={(e) =>
                                    updateFormula(f.id, "name", e.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-24 h-8 text-xs"
                                  type="number"
                                  step="0.01"
                                  value={f.baseRate || ""}
                                  onChange={(e) =>
                                    updateFormula(
                                      f.id,
                                      "baseRate",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-28 h-8 text-xs"
                                  type="number"
                                  value={f.ceiling || ""}
                                  onChange={(e) =>
                                    updateFormula(
                                      f.id,
                                      "ceiling",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setFormulas((prev) =>
                                      prev.filter((x) => x.id !== f.id)
                                    )
                                  }
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() =>
                      setFormulas((prev) => [
                        ...prev,
                        { ...emptyFormula, id: crypto.randomUUID() },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter une formule
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ─ Tarifs par catégorie (TCM/TCL) ─ */}
            <AccordionItem value="categoryTariffs">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Tarifs par catégorie (TCM/TCL)
                {categoryTariffs.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {categoryTariffs.length} ligne(s)
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Matrices 3D : Catégorie véhicule × Tranche de valeur
                    neuve × Franchise. Utilisé pour TCM (Tous Corps
                    Matériels) / TCL (Tous Corps).
                  </p>

                  {categoryTariffs.length > 0 && (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Catégorie</TableHead>
                            <TableHead className="text-xs">
                              VN Min (FCFA)
                            </TableHead>
                            <TableHead className="text-xs">
                              VN Max (FCFA)
                            </TableHead>
                            <TableHead className="text-xs">
                              Franchise (FCFA)
                            </TableHead>
                            <TableHead className="text-xs">
                              Prime (FCFA)
                            </TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryTariffs.map((ct) => (
                            <TableRow key={ct.id}>
                              <TableCell>
                                <Select
                                  value={ct.category}
                                  onValueChange={(v) =>
                                    updateCategoryTariff(
                                      ct.id,
                                      "category",
                                      v
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vehicleCategories.map((vc) => (
                                      <SelectItem
                                        key={vc.value}
                                        value={vc.value}
                                      >
                                        {vc.value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-28 h-8 text-xs"
                                  type="number"
                                  value={ct.valueMin || ""}
                                  onChange={(e) =>
                                    updateCategoryTariff(
                                      ct.id,
                                      "valueMin",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-28 h-8 text-xs"
                                  type="number"
                                  value={ct.valueMax || ""}
                                  onChange={(e) =>
                                    updateCategoryTariff(
                                      ct.id,
                                      "valueMax",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-28 h-8 text-xs"
                                  type="number"
                                  value={ct.franchise || ""}
                                  onChange={(e) =>
                                    updateCategoryTariff(
                                      ct.id,
                                      "franchise",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-28 h-8 text-xs"
                                  type="number"
                                  value={ct.prime || ""}
                                  onChange={(e) =>
                                    updateCategoryTariff(
                                      ct.id,
                                      "prime",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setCategoryTariffs((prev) =>
                                      prev.filter((x) => x.id !== ct.id)
                                    )
                                  }
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() =>
                      setCategoryTariffs((prev) => [
                        ...prev,
                        {
                          ...emptyCategoryTariff,
                          id: crypto.randomUUID(),
                        },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter une ligne catégorie
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une garantie
        </Button>
      </div>

      {/* Guarantees table */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold">Liste des garanties</h3>
          <p className="text-sm text-muted-foreground">
            Toutes vos garanties configurées
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
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
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Catégorie
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Type de calcul
                  </TableHead>
                  <TableHead className="text-center">Obligatoire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverages.map((cov) => (
                  <TableRow key={cov.id}>
                    <TableCell className="font-mono text-xs">
                      {cov.code}
                    </TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Wizard Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier la garantie" : "Nouvelle garantie"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifiez les informations de la garantie."
                : "Configurez votre nouvelle garantie en 3 étapes."}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
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
                    className={`h-0.5 w-12 transition-colors ${
                      step > s ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <ScrollArea className="max-h-[55vh] pr-4">
            {/* Step 1: Basic info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="w-full">
                  <Label htmlFor="cov-name">Nom *</Label>
                  <Input
                    className="w-full mt-1"
                    id="cov-name"
                    placeholder="Ex: Responsabilité Civile Automobile"
                    value={step1.name}
                    onChange={(e) =>
                      setStep1({ ...step1, name: e.target.value })
                    }
                  />
                </div>
                <div className="w-full">
                  <Label>Description</Label>
                  <Textarea
                    className="w-full mt-1"
                    placeholder="Description de la garantie..."
                    rows={3}
                    value={step1.description}
                    onChange={(e) =>
                      setStep1({ ...step1, description: e.target.value })
                    }
                  />
                </div>
                <div className="w-full">
                  <Label>Catégorie de garantie</Label>
                  <Select
                    value={step1.categoryId}
                    onValueChange={(v) =>
                      setStep1({ ...step1, categoryId: v })
                    }
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label htmlFor="cov-mandatory" className="cursor-pointer">
                    Garantie obligatoire
                  </Label>
                  <Switch
                    id="cov-mandatory"
                    checked={step1.isMandatory}
                    onCheckedChange={(v) =>
                      setStep1({ ...step1, isMandatory: v })
                    }
                  />
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
                          setTariffs([]);
                          setFormulas([]);
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
              <div className="py-2">
                <div className="mb-4 flex items-center gap-2">
                  <Badge className={calcBadge[calcType] ?? ""}>
                    {calcLabel[calcType] ?? calcType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    — Configuration
                  </span>
                </div>
                {renderStep3()}
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
                disabled={step === 1 && !step1.name.trim()}
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