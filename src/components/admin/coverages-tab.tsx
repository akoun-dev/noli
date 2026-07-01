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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Check, Minus, X } from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */
interface InsurerOption { id: string; name: string; code: string; }
interface CatOption { id: string; name: string; code: string; }

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
  metadata: Record<string, unknown>;
  insurerId: string;
  categoryId: string | null;
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

interface Step1Data {
  name: string;
  type: string;
  description: string;
  insurerId: string;
  categoryId: string;
  isMandatory: boolean;
  displayOrder: string;
  isActive: boolean;
}

const emptyStep1: Step1Data = {
  name: "", type: "", description: "", insurerId: "", categoryId: "",
  isMandatory: false, displayOrder: "0", isActive: true,
};

const codeSuggestions: Record<string, string> = {
  RESPONSABILITE_CIVILE: "RC",
  INCENDIE: "INC",
  VOL: "VOL",
  BRIS_DE_GLACE: "BDG",
  ASSISTANCE: "AST",
  DEFENSE_ET_RECOURS: "DR",
  PERSONNES_TRANSPORTEES: "PTR",
  CATASTROPHES_NATURELLES: "CATNAT",
  DOMMAGES_COLLISION: "DCOL",
  PROTECTION_JURIDIQUE: "PJ",
};

const step2Cards: { type: CalculationType; label: string; color: string; emoji: string }[] = [
  { type: "FREE", label: "GRATUIT", color: "border-emerald-400 bg-emerald-50", emoji: "🟢" },
  { type: "FIXED_AMOUNT", label: "MONTANT FIXE", color: "border-blue-400 bg-blue-50", emoji: "🔵" },
  { type: "VARIABLE_BASED", label: "VARIABLE", color: "border-orange-400 bg-orange-50", emoji: "🟠" },
  { type: "MATRIX_BASED", label: "MATRICE", color: "border-purple-400 bg-purple-50", emoji: "🟣" },
];

/* ── Component ─────────────────────────────────────────────── */
export function CoveragesTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Coverage[]>([]);
  const [insurers, setInsurers] = useState<InsurerOption[]>([]);
  const [categories, setCategories] = useState<CatOption[]>([]);
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
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Tariff rules panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tariffRules, setTariffRules] = useState<TariffRule[]>([]);
  const [trLoading, setTrLoading] = useState(false);
  const [trDialogOpen, setTrDialogOpen] = useState(false);
  const [trEditing, setTrEditing] = useState<TariffRule | null>(null);
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
      const [insRes, catRes] = await Promise.all([
        fetch("/api/admin/insurers"),
        fetch("/api/admin/coverage-categories"),
      ]);
      if (insRes.ok) setInsurers(await insRes.json());
      if (catRes.ok) setCategories(await catRes.json());
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
    setMetadata({});
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = (item: Coverage) => {
    setEditing(item);
    setStep1({
      name: item.name,
      type: item.type,
      description: item.description ?? "",
      insurerId: item.insurerId,
      categoryId: item.categoryId ?? "",
      isMandatory: item.isMandatory,
      displayOrder: item.displayOrder.toString(),
      isActive: item.isActive,
    });
    setCalcType(item.calculationType as CalculationType);
    setMetadata(item.metadata);
    setStep(1);
    setDialogOpen(true);
  };

  const buildMetadataFromStep3 = (): Record<string, unknown> => {
    if (calcType === "FREE") return {};
    if (calcType === "FIXED_AMOUNT") {
      return { fixedAmount: (metadata.fixedAmount as number) || 0 };
    }
    if (calcType === "VARIABLE_BASED") {
      const m: Record<string, unknown> = { variable: (metadata.variable as string) || "VN" };
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
      return { matrixType: (metadata.matrixType as string) || "FISCAL_POWER" };
    }
    return {};
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
      const body = {
        ...step1,
        displayOrder: parseInt(step1.displayOrder, 10) || 0,
        calculationType: calcType,
        metadata: buildMetadataFromStep3(),
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

  /* ── Render Step 3 ──────────────────────────────────────── */
  const renderStep3 = () => {
    if (calcType === "FREE") {
      return (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6 text-center">
          <p className="text-emerald-700 font-medium text-lg">🟢 Gratuit</p>
          <p className="text-emerald-600 text-sm mt-1">Aucune configuration supplémentaire requise.</p>
        </div>
      );
    }
    if (calcType === "FIXED_AMOUNT") {
      return (
        <div className="space-y-4">
          <Label>Montant fixe (FCFA) *</Label>
          <Input type="number" value={(metadata.fixedAmount as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, fixedAmount: parseFloat(e.target.value) || 0 })} placeholder="Ex: 50000" />
        </div>
      );
    }
    if (calcType === "VARIABLE_BASED") {
      return (
        <div className="space-y-4">
          <div>
            <Label>Variable</Label>
            <Select value={(metadata.variable as string) || "VN"} onValueChange={(v) => setMetadata({ ...metadata, variable: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VN">Valeur Neuve (VN)</SelectItem>
                <SelectItem value="VN_REPLACEMENT_VALUE">VN / Valeur de remplacement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="conditional" checked={!!metadata.hasConditional} onCheckedChange={(v) => setMetadata({ ...metadata, hasConditional: !!v })} />
            <Label htmlFor="conditional">Taux conditionné par seuil</Label>
          </div>
          {metadata.hasConditional ? (
            <div className="grid grid-cols-3 gap-3 rounded-lg border p-4 bg-muted/50">
              <div><Label className="text-xs">Seuil (FCFA)</Label><Input type="number" value={(metadata.threshold as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, threshold: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label className="text-xs">Taux sous (%)</Label><Input type="number" step="0.01" value={(metadata.rateBelow as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, rateBelow: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label className="text-xs">Taux au-dessus (%)</Label><Input type="number" step="0.01" value={(metadata.rateAbove as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, rateAbove: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          ) : (
            <div><Label>Taux (%)</Label><Input type="number" step="0.01" value={(metadata.rate as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, rate: parseFloat(e.target.value) || 0 })} /></div>
          )}
          <Separator />
          <div className="flex items-center gap-2">
            <Checkbox id="franchise" checked={!!metadata.franchiseEnabled} onCheckedChange={(v) => setMetadata({ ...metadata, franchiseEnabled: !!v })} />
            <Label htmlFor="franchise">Appliquer une franchise</Label>
          </div>
          {metadata.franchiseEnabled && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 bg-muted/50">
              <div><Label className="text-xs">Franchise (%)</Label><Input type="number" step="0.01" value={(metadata.franchisePercent as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, franchisePercent: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label className="text-xs">Montant min (FCFA)</Label><Input type="number" value={(metadata.franchiseMin as number) ?? ""} onChange={(e) => setMetadata({ ...metadata, franchiseMin: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          )}
        </div>
      );
    }
    if (calcType === "MATRIX_BASED") {
      return (
        <div className="space-y-4">
          <div>
            <Label>Type de matrice</Label>
            <Select value={(metadata.matrixType as string) || "FISCAL_POWER"} onValueChange={(v) => setMetadata({ ...metadata, matrixType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FISCAL_POWER">Puissance fiscale</SelectItem>
                <SelectItem value="FORMULA">Formule (IC/IPT)</SelectItem>
                <SelectItem value="TIERCE_COMPLETE">Tierce complète</SelectItem>
                <SelectItem value="TIERCE_COLLISION">Tierce collision</SelectItem>
                <SelectItem value="FUEL_TYPE">Type carburant</SelectItem>
                <SelectItem value="SEATS">Nombre de places</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Les règles tarifaires associées définissent les valeurs de la matrice. Utilisez la section ci-dessous pour les gérer.
          </p>
        </div>
      );
    }
    return null;
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
                  <TableHead>Type</TableHead>
                  <TableHead>Assureur</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead className="text-center">Obligatoire</TableHead>
                  <TableHead className="text-center">Ordre</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">{item.type}</TableCell>
                    <TableCell className="text-sm">{item.insurer.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${calcBadge[item.calculationType] ?? ""}`}>
                        {calcLabel[item.calculationType] ?? item.calculationType}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{item.isMandatory ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}</TableCell>
                    <TableCell className="text-center">{item.displayOrder}</TableCell>
                    <TableCell><Switch checked={item.isActive} onCheckedChange={async (v) => {
                      try { await fetch(`/api/admin/coverages/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: v }) }); fetchItems(); }
                      catch { toast({ title: "Erreur", variant: "destructive" }); }
                    }} onClick={(e) => e.stopPropagation()} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(item); }}><Pencil className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="h-4 w-4 mr-2" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.insurer.name}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${calcBadge[item.calculationType] ?? ""}`}>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openTrEdit(rule)}><Pencil className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
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

          <ScrollArea className="max-h-[60vh] pr-4">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                    <Select value={step1.type} onValueChange={(v) => setStep1({ ...step1, type: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(codeSuggestions).map((key) => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                <div><Label>Nom *</Label><Input value={step1.name} onChange={(e) => setStep1({ ...step1, name: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={step1.description} onChange={(e) => setStep1({ ...step1, description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assureur *</Label>
                    <Select value={step1.insurerId} onValueChange={(v) => setStep1({ ...step1, insurerId: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={step1.categoryId} onValueChange={(v) => setStep1({ ...step1, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune</SelectItem>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Ordre d'affichage</Label><Input type="number" value={step1.displayOrder} onChange={(e) => setStep1({ ...step1, displayOrder: e.target.value })} /></div>
                  <div className="flex items-center justify-between h-full pt-6">
                    <Label>Obligatoire</Label>
                    <Switch checked={step1.isMandatory} onCheckedChange={(v) => setStep1({ ...step1, isMandatory: v })} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-4 py-4">
                {step2Cards.map((c) => (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => setCalcType(c.type)}
                    className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:shadow-md ${calcType === c.type ? `${c.color} shadow-md ring-2 ring-offset-2 ring-[#B9E54D]` : "border-border hover:border-muted-foreground/30"}`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="font-semibold">{c.label}</span>
                  </button>
                ))}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{trEditing ? "Modifier la règle" : "Nouvelle règle tarifaire"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Carburant</Label><Input value={trForm.fuelType} onChange={(e) => setTrForm({ ...trForm, fuelType: e.target.value })} placeholder="ESSENCE, DIESEL" /></div>
              <div><Label>Formule</Label><Input value={trForm.formulaName} onChange={(e) => setTrForm({ ...trForm, formulaName: e.target.value })} placeholder="Formule 1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min CV</Label><Input type="number" value={trForm.minFiscalPower} onChange={(e) => setTrForm({ ...trForm, minFiscalPower: e.target.value })} /></div>
              <div><Label>Max CV</Label><Input type="number" value={trForm.maxFiscalPower} onChange={(e) => setTrForm({ ...trForm, maxFiscalPower: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Taux (%)</Label><Input type="number" step="0.01" value={trForm.baseRate} onChange={(e) => setTrForm({ ...trForm, baseRate: e.target.value })} /></div>
              <div><Label>Montant fixe (FCFA)</Label><Input type="number" value={trForm.fixedAmount} onChange={(e) => setTrForm({ ...trForm, fixedAmount: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Montant min (FCFA)</Label><Input type="number" value={trForm.minAmount} onChange={(e) => setTrForm({ ...trForm, minAmount: e.target.value })} /></div>
              <div><Label>Montant max (FCFA)</Label><Input type="number" value={trForm.maxAmount} onChange={(e) => setTrForm({ ...trForm, maxAmount: e.target.value })} /></div>
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
    </div>
  );
}