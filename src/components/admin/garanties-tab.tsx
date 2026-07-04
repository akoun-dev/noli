"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Search, Loader2, MoreHorizontal, Check, ChevronLeft, ChevronRight, X,
  DollarSign, Percent, LayoutGrid, CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ── Types ────────────────────────────────────────────────────────
interface RateCondition { condition: string; rate: number; }

interface GuaranteeCategory {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; sortOrder: number; isActive: boolean;
  _count: { guarantees: number };
}

interface Guarantee {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; categoryId: string | null; category: { id: string; name: string } | null;
  calcMethod: string;
  fixedPrice: number | null; rate: number | null;
  rateConditions: RateCondition[] | null;
  capital: Record<string, string> | null;
  franchise: Record<string, unknown> | null;
  matrixConfig: Record<string, unknown> | null;
  sortOrder: number; isActive: boolean; createdAt: string;
}

// Matrix row types
interface MatrixRow { tranche: string; tarif: string; }
interface FormulaRow { capitalDeces: string; capitalInvalidite: string; fraisMedicaux: string; primeFixe: string; }

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const calcColors: Record<string, string> = {
  FREE: "bg-emerald-100 text-emerald-800",
  FIXED_AMOUNT: "bg-blue-100 text-blue-800",
  VARIABLE_BASED: "bg-orange-100 text-orange-800",
  MATRIX_BASED: "bg-purple-100 text-purple-800",
};
const calcLabels: Record<string, string> = {
  FREE: "Gratuit", FIXED_AMOUNT: "Montant fixe", VARIABLE_BASED: "Taux variable", MATRIX_BASED: "Matrice",
};

// ── Calc method card data (matching insurer style) ───────────────
const step2Options: {
  type: string;
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

// ── Form state type ──────────────────────────────────────────────
interface WizardForm {
  name: string;
  description: string;
  icon: string;
  categoryId: string;
  sortOrder: number;
  isActive: boolean;
  calcMethod: string;
  fixedPrice: string;
  // VARIABLE_BASED
  variableSource: string;
  conditionedByVN: boolean;
  seuilVN: string;
  rateBelowThreshold: string;
  rateAboveThreshold: string;
  singleRate: string;
  // Capital & franchise
  capitalStr: string;
  franchiseStr: string;
  // MATRIX_BASED
  matrixDimension: string;
  essenceRows: MatrixRow[];
  dieselRows: MatrixRow[];
  formulaRows: FormulaRow[];
  usePlacesForPrime: boolean;
}

const emptyForm: WizardForm = {
  name: "", description: "", icon: "", categoryId: "", sortOrder: 0, isActive: true,
  calcMethod: "", fixedPrice: "",
  variableSource: "venale", conditionedByVN: false,
  seuilVN: "25000000", rateBelowThreshold: "", rateAboveThreshold: "", singleRate: "",
  capitalStr: "", franchiseStr: "",
  matrixDimension: "puissance_fiscale",
  essenceRows: [
    { tranche: "1-2 CV", tarif: "" }, { tranche: "3-4 CV", tarif: "" },
    { tranche: "5-7 CV", tarif: "" }, { tranche: "8-10 CV", tarif: "" }, { tranche: "11+ CV", tarif: "" },
  ],
  dieselRows: [
    { tranche: "1-2 CV", tarif: "" }, { tranche: "3-4 CV", tarif: "" },
    { tranche: "5-7 CV", tarif: "" }, { tranche: "8-10 CV", tarif: "" }, { tranche: "11+ CV", tarif: "" },
  ],
  formulaRows: [],
  usePlacesForPrime: false,
};

// ── Helpers ──────────────────────────────────────────────────────
function displayRateOrPrice(g: Guarantee): string {
  if (g.calcMethod === "FREE") return "Gratuit";
  if (g.calcMethod === "FIXED_AMOUNT") return g.fixedPrice ? fmtPrice(g.fixedPrice) : "—";
  if (g.rateConditions && g.rateConditions.length > 0) {
    return g.rateConditions.map((rc) => `${rc.condition}: ${rc.rate}%`).join(" / ");
  }
  if (g.rate != null) return `${g.rate} %`;
  return "—";
}

function displayCapital(g: Guarantee): string {
  if (!g.capital) return "—";
  return Object.entries(g.capital).map(([k, v]) => `${k}: ${v}`).join(", ");
}

function displayFranchise(g: Guarantee): string {
  if (!g.franchise) return "—";
  if (g.franchise.description) return g.franchise.description as string;
  const parts: string[] = [];
  if (g.franchise.percent) parts.push(`${g.franchise.percent}%`);
  if (g.franchise.min) parts.push(`min ${fmtPrice(g.franchise.min as number)}`);
  return parts.join(", ") || "—";
}

function parseJsonSafe(str: string): unknown {
  try { return JSON.parse(str); } catch { return null; }
}

// ── Step indicator ───────────────────────────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ["Informations générales", "Méthode de calcul", "Configuration avancée"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {labels.map((label, i) => {
        const num = i + 1;
        const isCompleted = num < step;
        const isCurrent = num === step;
        return (
          <div key={i} className="flex items-center">
            {i > 0 && <div className={`w-12 sm:w-20 h-0.5 ${i < step ? "bg-emerald-500" : "bg-muted"}`} />}
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                isCurrent ? "bg-[#B9E54D] border-[#B9E54D] text-black" :
                "bg-background border-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="h-4 w-4" /> : num}
              </div>
              <span className={`text-[10px] sm:text-xs mt-1 text-center max-w-[80px] sm:max-w-[120px] ${
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export function GarantiesTab() {
  const { toast } = useToast();
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [categories, setCategories] = useState<GuaranteeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Guarantee | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGuarantees = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guarantees");
      if (res.ok) setGuarantees(await res.json());
    } finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/guarantee-categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => { fetchGuarantees(); fetchCategories(); }, [fetchGuarantees, fetchCategories]);

  const filtered = guarantees.filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  // ── Wizard open/close ───────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, essenceRows: [...emptyForm.essenceRows.map(r => ({ ...r }))], dieselRows: [...emptyForm.dieselRows.map(r => ({ ...r }))], formulaRows: [] });
    setStep(1);
    setWizardOpen(true);
  };

  const openEdit = (g: Guarantee) => {
    setEditing(g);
    const mc = g.matrixConfig as Record<string, unknown> | null;
    const newForm: WizardForm = {
      name: g.name, description: g.description || "", icon: g.icon || "",
      categoryId: g.categoryId || "", sortOrder: g.sortOrder, isActive: g.isActive,
      calcMethod: g.calcMethod, fixedPrice: g.fixedPrice?.toString() || "",
      variableSource: "venale", conditionedByVN: !!(g.rateConditions && g.rateConditions.length > 0),
      seuilVN: "25000000",
      rateBelowThreshold: g.rateConditions?.[0]?.rate?.toString() || "",
      rateAboveThreshold: g.rateConditions?.[1]?.rate?.toString() || "",
      singleRate: g.rate?.toString() || "",
      capitalStr: g.capital ? JSON.stringify(g.capital, null, 2) : "",
      franchiseStr: g.franchise ? JSON.stringify(g.franchise, null, 2) : "",
      matrixDimension: (mc?.dimension as string) || "puissance_fiscale",
      essenceRows: (mc?.essence as MatrixRow[])?.map(r => ({ ...r })) || [...emptyForm.essenceRows.map(r => ({ ...r }))],
      dieselRows: (mc?.diesel as MatrixRow[])?.map(r => ({ ...r })) || [...emptyForm.dieselRows.map(r => ({ ...r }))],
      formulaRows: (mc?.formulas as FormulaRow[])?.map(r => ({ ...r })) || [],
      usePlacesForPrime: (mc?.usePlacesForPrime as boolean) || false,
    };
    // Try to parse seuil from rateConditions
    if (g.rateConditions && g.rateConditions.length >= 2) {
      const match = g.rateConditions[0].condition.match(/[\d,.]+/);
      if (match) newForm.seuilVN = match[0].replace(/\s/g, "").replace(",", ".");
    }
    setForm(newForm);
    setStep(1);
    setWizardOpen(true);
  };

  // ── Build payload & save ────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Le nom est obligatoire", variant: "destructive" }); return; }
    if (step < 3 && form.calcMethod !== "FREE") {
      // Allow going to save on step 2 for FREE
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        icon: form.icon || null,
        categoryId: form.categoryId || null,
        calcMethod: form.calcMethod || "FIXED_AMOUNT",
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };

      if (form.calcMethod === "FREE") {
        payload.fixedPrice = null; payload.rate = null; payload.rateConditions = null;
      } else if (form.calcMethod === "FIXED_AMOUNT") {
        payload.fixedPrice = form.fixedPrice ? parseFloat(form.fixedPrice) : null;
        payload.rate = null; payload.rateConditions = null;
      } else if (form.calcMethod === "VARIABLE_BASED") {
        payload.fixedPrice = null;
        if (form.conditionedByVN) {
          payload.rate = null;
          payload.rateConditions = [
            { condition: `SI ≤ ${form.seuilVN} FCFA`, rate: parseFloat(form.rateBelowThreshold) || 0 },
            { condition: `SI > ${form.seuilVN} FCFA`, rate: parseFloat(form.rateAboveThreshold) || 0 },
          ];
        } else {
          payload.rate = form.singleRate ? parseFloat(form.singleRate) : null;
          payload.rateConditions = null;
        }
      } else if (form.calcMethod === "MATRIX_BASED") {
        payload.fixedPrice = null; payload.rate = null; payload.rateConditions = null;
        if (form.matrixDimension === "puissance_fiscale") {
          payload.matrixConfig = { dimension: "puissance_fiscale", essence: form.essenceRows, diesel: form.dieselRows };
        } else {
          payload.matrixConfig = { dimension: "formule", formulas: form.formulaRows, usePlacesForPrime: form.usePlacesForPrime };
        }
      }

      // Capital & franchise
      payload.capital = parseJsonSafe(form.capitalStr);
      payload.franchise = parseJsonSafe(form.franchiseStr);

      // If not FREE and not MATRIX, and no capital/franchise entered, don't send empty
      if (form.calcMethod === "FIXED_AMOUNT" && !form.capitalStr && !form.franchiseStr) {
        // ok, they are optional
      }

      const url = editing ? `/api/admin/guarantees/${editing.id}` : "/api/admin/guarantees";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Garantie modifiée" : "Garantie créée" });
      setWizardOpen(false);
      fetchGuarantees();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/guarantees/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Garantie supprimée" });
      setDeleteId(null); fetchGuarantees();
    } catch { toast({ title: "Erreur de suppression", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  // ── Step 1: General info ────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Nom *</Label>
        <Input className="w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Responsabilité Civile" />
      </div>
      <div className="grid gap-2">
        <Label>Description</Label>
        <Textarea className="w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Icône</Label>
          <Input className="w-full" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Shield" />
        </div>
        <div className="grid gap-2">
          <Label>Catégorie</Label>
          <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Ordre d'affichage</Label>
          <Input className="w-full" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
      </div>
    </div>
  );

  // ── Step 2: Calc method (insurer-style cards) ──────────────────
  const renderStep2 = () => (
    <div className="space-y-3 py-2">
      <p className="text-sm text-muted-foreground mb-4">
        Sélectionnez le mode de calcul de la prime pour cette garantie.
      </p>
      <div className="space-y-3">
        {step2Options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = form.calcMethod === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => setForm({ ...form, calcMethod: opt.type })}
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
  );

  // ── Step 3: Advanced config ─────────────────────────────────────
  const renderStep3 = () => {
    if (form.calcMethod === "FREE") return null;

    if (form.calcMethod === "VARIABLE_BASED") return renderVariableConfig();
    if (form.calcMethod === "MATRIX_BASED") return renderMatrixConfig();
    if (form.calcMethod === "FIXED_AMOUNT") return renderCapitalFranchise();

    return null;
  };

  const renderVariableConfig = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid gap-2">
          <Label>Variable source</Label>
          <Select value={form.variableSource} onValueChange={(v) => setForm({ ...form, variableSource: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="venale">Valeur vénale (taux %)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Checkbox checked={form.conditionedByVN} onCheckedChange={(v) => setForm({ ...form, conditionedByVN: !!v })} id="cond-vn" />
          <label htmlFor="cond-vn" className="text-sm cursor-pointer flex-1">
            <span className="font-medium">Conditionné par la valeur neuve</span>
            <p className="text-xs text-muted-foreground mt-0.5">Applique un taux différent selon le seuil de 25 000 000 FCFA</p>
          </label>
        </div>

        {form.conditionedByVN ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-4 border-l-2 border-orange-300">
            <div className="grid gap-2">
              <Label className="text-xs">Seuil valeur vénale (FCFA)</Label>
              <Input className="w-full" type="number" value={form.seuilVN} onChange={(e) => setForm({ ...form, seuilVN: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Taux si SI ≤ seuil (%)</Label>
              <Input className="w-full" type="number" step="0.01" value={form.rateBelowThreshold} onChange={(e) => setForm({ ...form, rateBelowThreshold: e.target.value })} placeholder="Ex: 1.10" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Taux si SI &gt; seuil (%)</Label>
              <Input className="w-full" type="number" step="0.01" value={form.rateAboveThreshold} onChange={(e) => setForm({ ...form, rateAboveThreshold: e.target.value })} placeholder="Ex: 2.10" />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 pl-4">
            <Label>Taux (%)</Label>
            <Input type="number" step="0.01" value={form.singleRate} onChange={(e) => setForm({ ...form, singleRate: e.target.value })} placeholder="Ex: 0.42" className="w-full max-w-xs" />
            <p className="text-xs text-muted-foreground">Taux appliqué sur la Valeur Vénale (VV)</p>
          </div>
        )}
      </div>

      {renderCapitalFranchise()}
    </div>
  );

  const renderMatrixConfig = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid gap-2">
          <Label>Dimension de la matrice</Label>
          <Select value={form.matrixDimension} onValueChange={(v) => setForm({ ...form, matrixDimension: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="puissance_fiscale">Puissance fiscale (CV)</SelectItem>
              <SelectItem value="formule">Formule</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.matrixDimension === "puissance_fiscale" && renderPuissanceFiscaleTables()}
        {form.matrixDimension === "formule" && renderFormulaConfig()}
      </div>
    </div>
  );

  const renderPuissanceFiscaleTables = () => (
    <div className="space-y-6">
      {(["essence", "diesel"] as const).map((fuel) => {
        const rows = fuel === "essence" ? form.essenceRows : form.dieselRows;
        const setRows = (newRows: MatrixRow[]) =>
          setForm({ ...form, [fuel === "essence" ? "essenceRows" : "dieselRows"]: newRows });
        return (
          <div key={fuel}>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">{fuel === "essence" ? "Essence" : "Diesel"}</Label>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRows([...rows, { tranche: "", tarif: "" }])}>
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tranche</TableHead>
                    <TableHead>Tarif (FCFA)</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Input value={r.tranche} onChange={(e) => setRows(rows.map((row, i) => i === idx ? { ...row, tranche: e.target.value } : row))} className="w-full h-9" placeholder="Ex: 1-2 CV" /></TableCell>
                      <TableCell><Input type="number" value={r.tarif} onChange={(e) => setRows(rows.map((row, i) => i === idx ? { ...row, tarif: e.target.value } : row))} className="w-full h-9" placeholder="0" /></TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setRows(rows.filter((_, i) => i !== idx))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
      {renderCapitalFranchise()}
    </div>
  );

  const renderFormulaConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Formules de calcul</Label>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setForm({ ...form, formulaRows: [...form.formulaRows, { capitalDeces: "", capitalInvalidite: "", fraisMedicaux: "", primeFixe: "" }] })}>
            <Plus className="h-3 w-3 mr-1" /> Ajouter une formule
          </Button>
        </div>
        {form.formulaRows.map((row, idx) => (
          <div key={idx} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Formule {idx + 1}</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm({ ...form, formulaRows: form.formulaRows.filter((_, i) => i !== idx) })}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground">Capital Décès (FCFA)</Label>
                <Input type="number" value={row.capitalDeces} onChange={(e) => setForm({ ...form, formulaRows: form.formulaRows.map((r, i) => i === idx ? { ...r, capitalDeces: e.target.value } : r) })} className="w-full h-8 text-xs" />
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground">Capital Invalidité (FCFA)</Label>
                <Input type="number" value={row.capitalInvalidite} onChange={(e) => setForm({ ...form, formulaRows: form.formulaRows.map((r, i) => i === idx ? { ...r, capitalInvalidite: e.target.value } : r) })} className="w-full h-8 text-xs" />
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground">Frais Médicaux (FCFA)</Label>
                <Input type="number" value={row.fraisMedicaux} onChange={(e) => setForm({ ...form, formulaRows: form.formulaRows.map((r, i) => i === idx ? { ...r, fraisMedicaux: e.target.value } : r) })} className="w-full h-8 text-xs" />
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground">Prime fixe (FCFA)</Label>
                <Input type="number" value={row.primeFixe} onChange={(e) => setForm({ ...form, formulaRows: form.formulaRows.map((r, i) => i === idx ? { ...r, primeFixe: e.target.value } : r) })} className="w-full h-8 text-xs" />
              </div>
            </div>
          </div>
        ))}
        {form.formulaRows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune formule ajoutée</p>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Checkbox checked={form.usePlacesForPrime} onCheckedChange={(v) => setForm({ ...form, usePlacesForPrime: !!v })} id="use-places" />
        <label htmlFor="use-places" className="text-sm cursor-pointer">
          Utiliser le nombre de places pour déterminer la prime
        </label>
      </div>

      {renderCapitalFranchise()}
    </div>
  );

  const renderCapitalFranchise = () => (
    <div className="space-y-4 pt-2">
      <div className="border-t" />
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Capital couvert</h4>
        <div className="grid gap-2">
          <Textarea value={form.capitalStr} onChange={(e) => setForm({ ...form, capitalStr: e.target.value })} rows={2} className="w-full font-mono text-xs" placeholder='{"corporel": "7 000 000 000 FCFA"}' />
          {form.capitalStr && (() => {
            const parsed = parseJsonSafe(form.capitalStr);
            if (!parsed || typeof parsed !== "object") return <p className="text-xs text-destructive">JSON invalide</p>;
            return (
              <div className="rounded-lg bg-muted/50 p-2 space-y-0.5">
                {Object.entries(parsed as Record<string, string>).map(([k, v]) => (
                  <p key={k} className="text-xs"><span className="font-medium">{k} :</span> {v}</p>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Franchise</h4>
        <div className="grid gap-2">
          <Textarea value={form.franchiseStr} onChange={(e) => setForm({ ...form, franchiseStr: e.target.value })} rows={2} className="w-full font-mono text-xs" placeholder='{"percent": 10, "min": 255000}' />
          {form.franchiseStr && (() => {
            const parsed = parseJsonSafe(form.franchiseStr);
            if (!parsed || typeof parsed !== "object") return <p className="text-xs text-destructive">JSON invalide</p>;
            return (
              <div className="rounded-lg bg-muted/50 p-2 space-y-0.5">
                {Object.entries(parsed as Record<string, unknown>).map(([k, v]) => (
                  <p key={k} className="text-xs">
                    <span className="font-medium">{k} :</span>{" "}
                    {k === "min" ? fmtPrice(v as number) : String(v)}
                  </p>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  // ── Navigation ──────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return !!form.name.trim();
    if (step === 2) return !!form.calcMethod;
    return true;
  };

  const handleNext = () => {
    if (step === 2 && form.calcMethod === "FREE") {
      handleSave();
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <TooltipProvider>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Garanties</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Prix / Taux</TableHead>
                <TableHead>Capital</TableHead>
                <TableHead>Franchise</TableHead>
                <TableHead className="text-center">Ordre</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-sm">{g.category?.name || <Badge variant="outline">—</Badge>}</TableCell>
                  <TableCell><Badge className={calcColors[g.calcMethod] || ""}>{calcLabels[g.calcMethod] || g.calcMethod}</Badge></TableCell>
                  <TableCell className="text-sm font-mono max-w-[200px] truncate" title={displayRateOrPrice(g)}>{displayRateOrPrice(g)}</TableCell>
                  <TableCell className="text-sm max-w-[150px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block cursor-default">{displayCapital(g)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-pre-wrap">{displayCapital(g)}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate block cursor-default">{displayFranchise(g)}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">{displayFranchise(g)}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">{g.sortOrder}</TableCell>
                  <TableCell className="text-center"><Switch checked={g.isActive} onCheckedChange={async () => { try { await fetch(`/api/admin/guarantees/${g.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !g.isActive }) }); fetchGuarantees(); } catch {} }} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(g)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune garantie trouvée.</p>}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((g) => (
            <Card key={g.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{displayRateOrPrice(g)}</p>
                </div>
                <Badge className={calcColors[g.calcMethod] || ""}>{calcLabels[g.calcMethod]}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {g.category && <Badge variant="outline" className="text-xs">{g.category.name}</Badge>}
                <span className="text-xs text-muted-foreground">Ordre {g.sortOrder}</span>
              </div>
              {g.capital && <p className="text-xs text-muted-foreground mb-1 truncate">Capital : {displayCapital(g)}</p>}
              {g.franchise && <p className="text-xs text-muted-foreground mb-2 truncate">Franchise : {displayFranchise(g)}</p>}
              <div className="flex items-center justify-between">
                <Switch checked={g.isActive} onCheckedChange={async () => { try { await fetch(`/api/admin/guarantees/${g.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !g.isActive }) }); fetchGuarantees(); } catch {} }} />
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Wizard Dialog ──────────────────────────────────────── */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier la garantie" : "Nouvelle garantie"}</DialogTitle>
              <DialogDescription>{editing ? "Modifiez les paramètres de la garantie." : "Créez une nouvelle garantie en 3 étapes."}</DialogDescription>
            </DialogHeader>

            <StepIndicator step={step} total={3} />

            <ScrollArea className="flex-1 pr-2">
              <div className="pb-4">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Retour
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWizardOpen(false)}>Annuler</Button>
                {step < 3 ? (
                  <Button onClick={handleNext} disabled={!canGoNext()} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
                    Suivant <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editing ? "Modifier" : "Créer"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Dialog ────────────────────────────────────────── */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Supprimer cette garantie ?</AlertDialogTitle><AlertDialogDescription>Les liaisons avec les assureurs et offres seront également supprimées.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">{deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}