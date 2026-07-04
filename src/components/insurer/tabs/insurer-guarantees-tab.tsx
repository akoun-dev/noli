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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  category: { id: string; name: string; code: string } | null;
}

type CalculationType = "FREE" | "FIXED_AMOUNT" | "VARIABLE_BASED" | "MATRIX_BASED";

interface Step1Data {
  name: string;
  categoryId: string;
  description: string;
  isMandatory: boolean;
}

const emptyStep1: Step1Data = {
  name: "",
  categoryId: "",
  description: "",
  isMandatory: false,
};

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

const step2Options: {
  type: CalculationType;
  label: string;
  description: string;
  icon: typeof DollarSign;
}[] = [
  {
    type: "FREE",
    label: "Gratuit",
    description: "Aucun frais additionnel. La garantie est incluse sans calcul de prime supplémentaire.",
    icon: CircleDot,
  },
  {
    type: "FIXED_AMOUNT",
    label: "Montant fixe",
    description: "Un montant fixe est appliqué pour cette garantie, indépendamment des autres paramètres.",
    icon: DollarSign,
  },
  {
    type: "VARIABLE_BASED",
    label: "Variable",
    description: "Le montant est calculé en pourcentage ou selon une formule basée sur des variables dynamiques.",
    icon: Percent,
  },
  {
    type: "MATRIX_BASED",
    label: "Matrice tarifaire",
    description: "Le montant est déterminé par une matrice de tarification (puissance fiscale, carburant, etc.).",
    icon: LayoutGrid,
  },
];

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
  const openCreate = () => {
    setEditingItem(null);
    setStep1(emptyStep1);
    setCalcType("");
    setMetadata({});
    setStep(1);
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
    try {
      setMetadata(
        typeof item.metadata === "string"
          ? JSON.parse(item.metadata)
          : (item as unknown as { metadata: Record<string, unknown> }).metadata || {}
      );
    } catch {
      setMetadata({});
    }
    setStep(1);
    setDialogOpen(true);
  };

  const buildMetadataFromStep3 = (): Record<string, unknown> => {
    if (calcType === "FREE") return {};
    if (calcType === "FIXED_AMOUNT") {
      return { fixedAmount: (metadata.fixedAmount as number) || 0 };
    }
    if (calcType === "VARIABLE_BASED") {
      const m: Record<string, unknown> = {
        variable: (metadata.variable as string) || "VN",
      };
      if (metadata.hasConditional) {
        m.hasConditional = true;
        m.threshold = Number(metadata.threshold) || 0;
        m.rateBelow = Number(metadata.rateBelow) || 0;
        m.rateAbove = Number(metadata.rateAbove) || 0;
      } else {
        m.rate = Number(metadata.rate) || 0;
      }
      if (metadata.franchiseEnabled) {
        m.franchiseEnabled = true;
        m.franchisePercent = Number(metadata.franchisePercent) || 0;
        m.franchiseMin = Number(metadata.franchiseMin) || 0;
      }
      return m;
    }
    if (calcType === "MATRIX_BASED") {
      return {
        matrixType: (metadata.matrixType as string) || "FISCAL_POWER",
      };
    }
    return {};
  };

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
      metadata: buildMetadataFromStep3(),
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
        title: editingItem
          ? "Garantie mise à jour avec succès"
          : "Garantie créée avec succès",
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
      const res = await fetch(
        `/api/insurer/coverages/${deleteTarget.id}`,
        { method: "DELETE" }
      );
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

  /* ── Render Step 3 ── */
  const renderStep3 = () => {
    if (calcType === "FREE") {
      return (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 p-6 text-center">
          <p className="text-emerald-700 dark:text-emerald-400 font-medium text-lg">
            🟢 Gratuit
          </p>
          <p className="text-emerald-600 dark:text-emerald-500 text-sm mt-1">
            Aucune configuration supplémentaire requise.
          </p>
        </div>
      );
    }
    if (calcType === "FIXED_AMOUNT") {
      return (
        <div className="space-y-4">
          <div className="w-full">
            <Label>Montant fixe (FCFA) *</Label>
            <Input
              className="w-full"
              type="number"
              value={(metadata.fixedAmount as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  fixedAmount: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Ex: 50000"
            />
          </div>
        </div>
      );
    }
    if (calcType === "VARIABLE_BASED") {
      return (
        <div className="space-y-4">
          <div className="w-full">
            <Label>Variable</Label>
            <Select
              value={(metadata.variable as string) || "VN"}
              onValueChange={(v) =>
                setMetadata({ ...metadata, variable: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VN">Valeur Neuve (VN)</SelectItem>
                <SelectItem value="VN_REPLACEMENT_VALUE">
                  VN / Valeur de remplacement
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="conditional"
              checked={!!metadata.hasConditional}
              onCheckedChange={(v) =>
                setMetadata({ ...metadata, hasConditional: !!v })
              }
            />
            <Label htmlFor="conditional">Taux conditionné par seuil</Label>
          </div>
          {metadata.hasConditional ? (
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border p-4 bg-muted/50">
              <div>
                <Label className="text-xs">Seuil (FCFA)</Label>
                <Input
                  className="w-full"
                  type="number"
                  value={(metadata.threshold as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      threshold: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Taux sous (%)</Label>
                <Input
                  className="w-full"
                  type="number"
                  step="0.01"
                  value={(metadata.rateBelow as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      rateBelow: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Taux au-dessus (%)</Label>
                <Input
                  className="w-full"
                  type="number"
                  step="0.01"
                  value={(metadata.rateAbove as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      rateAbove: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="w-full">
              <Label>Taux (%)</Label>
              <Input
                className="w-full"
                type="number"
                step="0.01"
                value={(metadata.rate as number) ?? ""}
                onChange={(e) =>
                  setMetadata({
                    ...metadata,
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          )}
          <Separator />
          <div className="flex items-center gap-2">
            <Checkbox
              id="franchise"
              checked={!!metadata.franchiseEnabled}
              onCheckedChange={(v) =>
                setMetadata({ ...metadata, franchiseEnabled: !!v })
              }
            />
            <Label htmlFor="franchise">Appliquer une franchise</Label>
          </div>
          {metadata.franchiseEnabled && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-4 bg-muted/50">
              <div>
                <Label className="text-xs">Franchise (%)</Label>
                <Input
                  className="w-full"
                  type="number"
                  step="0.01"
                  value={(metadata.franchisePercent as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      franchisePercent: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Montant min (FCFA)</Label>
                <Input
                  className="w-full"
                  type="number"
                  value={(metadata.franchiseMin as number) ?? ""}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      franchiseMin: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      );
    }
    if (calcType === "MATRIX_BASED") {
      return (
        <div className="space-y-4">
          <div className="w-full">
            <Label>Type de matrice</Label>
            <Select
              value={(metadata.matrixType as string) || "FISCAL_POWER"}
              onValueChange={(v) =>
                setMetadata({ ...metadata, matrixType: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FISCAL_POWER">
                  Puissance fiscale
                </SelectItem>
                <SelectItem value="FORMULA">Formule (IC/IPT)</SelectItem>
                <SelectItem value="TIERCE_COMPLETE">
                  Tierce complète
                </SelectItem>
                <SelectItem value="TIERCE_COLLISION">
                  Tierce collision
                </SelectItem>
                <SelectItem value="FUEL_TYPE">Type carburant</SelectItem>
                <SelectItem value="SEATS">Nombre de places</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Les règles tarifaires associées définissent les valeurs de la
            matrice.
          </p>
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
                    className={`h-0.5 w-12 ${step > s ? "bg-emerald-500" : "bg-muted"}`}
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
                    className="w-full"
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
                    className="w-full"
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
                    <SelectTrigger className="w-full">
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
                        onClick={() => setCalcType(opt.type)}
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