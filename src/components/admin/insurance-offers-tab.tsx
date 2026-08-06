"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, Eye, FileText, Shield, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";


const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const ctLabels: Record<string, string> = { basic: "Tiers Simple", third_party_plus: "Tiers+", all_risks: "Tous Risques" };
const ctColors: Record<string, string> = { basic: "bg-slate-100 text-slate-800", third_party_plus: "bg-amber-100 text-amber-800", all_risks: "bg-emerald-100 text-emerald-800" };
const calcBadge: Record<string, string> = { FREE: "bg-emerald-100 text-emerald-800", FIXED_AMOUNT: "bg-blue-100 text-blue-800", VARIABLE_BASED: "bg-orange-100 text-orange-800", MATRIX_BASED: "bg-purple-100 text-purple-800" };
const calcLabel: Record<string, string> = { FREE: "Gratuit", FIXED_AMOUNT: "Fixe", VARIABLE_BASED: "Variable", MATRIX_BASED: "Matrice" };

const FUEL_OPTIONS = ["Essence", "Diesel", "Hybride", "Électrique"];
const USAGE_OPTIONS = ["Personnel", "Professionnel", "Taxi/VTC", "Autre"];

const safeJsonParse = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

interface InsurerMini { id: string; name: string; code: string }
interface Offer {
  id: string; insurerId: string; name: string; contractType: string;
  description: string | null; priceMin: number | null; priceMax: number | null;
  coverageAmount: number | null; deductible: number; features: string[];
  isActive: boolean; createdAt: string;
  insurer: { id: string; name: string; code: string; logoUrl: string | null };
  category?: { id: string; name: string } | null;
  _count?: { quotes: number };
  // Vehicle eligibility fields (optional, from DB)
  fiscalPowerMin?: number | null;
  fiscalPowerMax?: number | null;
  fuelTypes?: string;
  newValueMin?: number | null;
  newValueMax?: number | null;
  venalValueMin?: number | null;
  venalValueMax?: number | null;
  vehicleUsage?: string;
}
interface CoverageMini {
  id: string; code: string; name: string; type: string;
  calculationType: string; isMandatory: boolean; isActive: boolean;
  category: { id: string; name: string; code: string } | null;
}

const empty = {
  insurerId: "", name: "", description: "",
  deductible: 0, contractType: "", priceMin: "", priceMax: "", coverageAmount: "",
  features: "[]" as string, isActive: true,
  // Vehicle eligibility
  fiscalPowerMin: "", fiscalPowerMax: "",
  fuelTypes: [] as string[],
  newValueMin: "", newValueMax: "",
  venalValueMin: "", venalValueMax: "",
  vehicleUsage: [] as string[],
};

export function InsuranceOffersTab() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [insurers, setInsurers] = useState<InsurerMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Detail state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCoverages, setDetailCoverages] = useState<CoverageMini[]>([]);
  const [detailQuotesCount, setDetailQuotesCount] = useState(0);

  // Form: coverages for selected insurer (guarantee checkboxes)
  const [formCoverages, setFormCoverages] = useState<CoverageMini[]>([]);
  const [formCoveragesLoading, setFormCoveragesLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterInsurer) params.set("insurerId", filterInsurer);
      if (filterType) params.set("contractType", filterType);
      const res = await fetch(`/api/admin/insurance-offers?${params}`);
      if (res.ok) setOffers(await res.json());
    } finally { setLoading(false); }
  }, [search, filterInsurer, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetch("/api/admin/insurers?active=true").then((r) => { if (r.ok) r.json().then(setInsurers); }); }, []);

  // Fetch coverages for the selected insurer in the form (for guarantee checkboxes)
  useEffect(() => {
    if (!form.insurerId) {
      setFormCoverages([]);
      return;
    }
    setFormCoveragesLoading(true);
    fetch(`/api/admin/coverages?insurerId=${form.insurerId}`)
      .then((r) => { if (r.ok) return r.json(); return []; })
      .then((data) => setFormCoverages(data))
      .catch(() => setFormCoverages([]))
      .finally(() => setFormCoveragesLoading(false));
  }, [form.insurerId]);

  const openCreate = () => { setEditing(null); setForm(empty); setFormOpen(true); };
  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({
      insurerId: o.insurerId, name: o.name,
      description: o.description || "", deductible: o.deductible,
      contractType: o.contractType || "",
      priceMin: o.priceMin != null ? String(o.priceMin) : "",
      priceMax: o.priceMax != null ? String(o.priceMax) : "",
      coverageAmount: o.coverageAmount != null ? String(o.coverageAmount) : "",
      features: JSON.stringify(o.features), isActive: o.isActive,
      // Vehicle eligibility
      fiscalPowerMin: o.fiscalPowerMin != null ? String(o.fiscalPowerMin) : "",
      fiscalPowerMax: o.fiscalPowerMax != null ? String(o.fiscalPowerMax) : "",
      fuelTypes: safeJsonParse(o.fuelTypes),
      newValueMin: o.newValueMin != null ? String(o.newValueMin) : "",
      newValueMax: o.newValueMax != null ? String(o.newValueMax) : "",
      venalValueMin: o.venalValueMin != null ? String(o.venalValueMin) : "",
      venalValueMax: o.venalValueMax != null ? String(o.venalValueMax) : "",
      vehicleUsage: safeJsonParse(o.vehicleUsage),
    });
    setFormOpen(true);
  };

  const openDetail = async (o: Offer) => {
    setSelected(o);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailCoverages([]);
    setDetailQuotesCount(0);
    try {
      const [covRes, quotesRes] = await Promise.all([
        fetch(`/api/admin/coverages?insurerId=${o.insurerId}`),
        fetch(`/api/admin/quotes?offerId=${o.id}`),
      ]);
      if (covRes.ok) setDetailCoverages(await covRes.json());
      if (quotesRes.ok) {
        const quotes = await quotesRes.json();
        setDetailQuotesCount(Array.isArray(quotes) ? quotes.length : 0);
      }
    } catch {
      /* silent */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.insurerId || !form.name.trim()) {
      toast({ title: "Champs obligatoires: assureur, nom", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        insurerId: form.insurerId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        deductible: Number(form.deductible) || 0,
        contractType: form.contractType || null,
        priceMin: form.priceMin ? Number(form.priceMin) : null,
        priceMax: form.priceMax ? Number(form.priceMax) : null,
        coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : null,
        features: JSON.parse(form.features),
        isActive: form.isActive,
        // Vehicle eligibility
        fiscalPowerMin: form.fiscalPowerMin ? Number(form.fiscalPowerMin) : null,
        fiscalPowerMax: form.fiscalPowerMax ? Number(form.fiscalPowerMax) : null,
        fuelTypes: JSON.stringify(form.fuelTypes),
        newValueMin: form.newValueMin ? Number(form.newValueMin) : null,
        newValueMax: form.newValueMax ? Number(form.newValueMax) : null,
        venalValueMin: form.venalValueMin ? Number(form.venalValueMin) : null,
        venalValueMax: form.venalValueMax ? Number(form.venalValueMax) : null,
        vehicleUsage: JSON.stringify(form.vehicleUsage),
      };
      const url = editing ? `/api/admin/insurance-offers/${editing.id}` : "/api/admin/insurance-offers";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Offre modifiée" : "Offre créée" });
      setFormOpen(false); fetchData();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/insurance-offers/${deleteId}`, { method: "DELETE" });
      toast({ title: "Offre supprimée" }); setDeleteId(null); fetchData();
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleToggle = async (o: Offer) => {
    try {
      await fetch(`/api/admin/insurance-offers/${o.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !o.isActive }),
      });
      fetchData();
    } catch { /* silent */ }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  // Group coverages by category for detail view
  const groupedCoverages = detailCoverages.reduce<Record<string, CoverageMini[]>>((acc, c) => {
    const key = c.category?.name || "Autre";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  const detailStatCards = [
    { label: "Garanties", value: detailCoverages.length, icon: Shield, color: "text-orange-600 bg-orange-50" },
    { label: "Devis", value: detailQuotesCount, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Assureur", value: selected?.insurer?.code || "—", icon: Building2, color: "text-purple-600 bg-purple-50" },
  ];

  // Helpers for checkbox toggles in form
  const toggleFuelType = (fuel: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    setForm((f) => ({
      ...f,
      fuelTypes: checked
        ? [...f.fuelTypes, fuel]
        : f.fuelTypes.filter((t) => t !== fuel),
    }));
  };

  const toggleVehicleUsage = (usage: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    setForm((f) => ({
      ...f,
      vehicleUsage: checked
        ? [...f.vehicleUsage, usage]
        : f.vehicleUsage.filter((u) => u !== usage),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Offres</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterInsurer || "all"} onValueChange={(v) => setFilterInsurer(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Assureur" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tous</SelectItem>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="basic">Tiers Simple</SelectItem><SelectItem value="third_party_plus">Tiers+</SelectItem><SelectItem value="all_risks">Tous Risques</SelectItem></SelectContent>
          </Select>
          <Button onClick={openCreate} className="bg-brand text-black hover:bg-brand-hover"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead><TableHead>Assureur</TableHead>
              <TableHead className="text-right">Prix min</TableHead><TableHead className="text-right">Prix max</TableHead>
              <TableHead className="text-center">Franchise</TableHead><TableHead>Catégorie</TableHead>
              <TableHead className="text-center">Statut</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(o)}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {o.insurer?.logoUrl ? (
                      <img src={o.insurer.logoUrl} alt="" className="h-6 w-6 rounded object-contain bg-white dark:bg-muted p-0.5 border" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-muted flex items-center justify-center"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /></div>
                    )}
                    <span className="text-sm">{o.insurer?.name || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{o.priceMin ? fmtPrice(o.priceMin) : "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{o.priceMax ? fmtPrice(o.priceMax) : "—"}</TableCell>
                <TableCell className="text-center font-mono text-sm">{o.deductible ? fmtPrice(o.deductible) : "—"}</TableCell>
                <TableCell className="text-sm">{o.category?.name || "—"}</TableCell>
                <TableCell className="text-center"><Switch checked={o.isActive} onCheckedChange={() => handleToggle(o)} onClick={(e) => e.stopPropagation()} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(o)} title="Voir">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)} title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(o.id)} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {offers.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune offre.</p>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">{offers.map((o) => (
        <Card key={o.id} className="p-4 cursor-pointer" onClick={() => openDetail(o)}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-start gap-2">
              {o.insurer?.logoUrl ? (
                <img src={o.insurer.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain bg-white dark:bg-muted p-1 border shrink-0 mt-0.5" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
              )}
              <div>
                <p className="font-semibold">{o.name}</p>
                <p className="text-sm text-muted-foreground">{o.insurer?.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
            {o.priceMin && <span className="font-mono">à partir de {fmtPrice(o.priceMin)}</span>}
            <Switch checked={o.isActive} onCheckedChange={() => handleToggle(o)} onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); openDetail(o); }}><Eye className="h-3.5 w-3.5 mr-1" /> Détails</Button>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(o); }}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(o.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </Card>
      ))}</div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle>
            <DialogDescription>Configurez les détails de l'offre.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="w-full grid gap-2">
              <Label>Assureur *</Label>
              <Select value={form.insurerId} onValueChange={(v) => setForm({ ...form, insurerId: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="w-full grid gap-2">
              <Label>Nom *</Label>
              <Input className="w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Économique" />
            </div>
            <div className="w-full grid gap-2">
              <Label>Description</Label>
              <Textarea className="w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            {/* Contract Type */}
            <div className="w-full grid gap-2">
              <Label>Type de contrat</Label>
              <Select value={form.contractType} onValueChange={(v) => setForm({ ...form, contractType: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Tiers Simple</SelectItem>
                  <SelectItem value="third_party_plus">Tiers+</SelectItem>
                  <SelectItem value="all_risks">Tous Risques</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price min/max */}
            <div className="w-full grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Prix min (FCFA)</Label>
                <Input className="w-full" type="number" placeholder="0" value={form.priceMin} onChange={(e) => setForm({ ...form, priceMin: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Prix max (FCFA)</Label>
                <Input className="w-full" type="number" placeholder="0" value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: e.target.value })} />
              </div>
            </div>

            {/* Franchise & Capital garanti */}
            <div className="w-full grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Franchise (FCFA)</Label>
                <Input className="w-full" type="number" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Capital garanti (FCFA)</Label>
                <Input className="w-full" type="number" placeholder="0" value={form.coverageAmount} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })} />
              </div>
            </div>

            <Separator />

            {/* Guarantee checkboxes */}
            <div className="w-full grid gap-2">
              <Label>Garanties</Label>
              {formCoveragesLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!formCoveragesLoading && form.insurerId && formCoverages.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune garantie configurée pour cet assureur.</p>
              )}
              {!formCoveragesLoading && formCoverages.length > 0 && (() => {
                const grouped = formCoverages.reduce<Record<string, CoverageMini[]>>((acc, c) => {
                  const key = c.category?.name || "Autre";
                  (acc[key] ??= []).push(c);
                  return acc;
                }, {});
                const selectedFeatures: string[] = (() => { try { return JSON.parse(form.features); } catch { return []; } })();
                return (
                  <div className="border rounded-lg max-h-64 overflow-y-auto p-3 space-y-3">
                    {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, covs]) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat}</p>
                        <div className="space-y-1.5">
                          {covs.map((c) => (
                            <div key={c.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`cov-${c.id}`}
                                checked={selectedFeatures.includes(c.name)}
                                onCheckedChange={(checked) => {
                                  const current: string[] = (() => { try { return JSON.parse(form.features); } catch { return []; } })();
                                  const updated = checked
                                    ? [...current, c.name]
                                    : current.filter((n: string) => n !== c.name);
                                  setForm({ ...form, features: JSON.stringify(updated) });
                                }}
                              />
                              <Label htmlFor={`cov-${c.id}`} className="text-sm font-normal cursor-pointer">{c.name}</Label>
                              {c.isMandatory && <Badge variant="default" className="text-[10px] px-1.5 py-0">Obligatoire</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {!form.insurerId && (
                <p className="text-sm text-muted-foreground">Sélectionnez d&apos;abord un assureur.</p>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand text-black hover:bg-brand-hover">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Modifier" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              {detailLoading ? <Skeleton className="h-6 w-48" /> : selected?.name}
            </DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-40" /></div>
          ) : selected ? (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                  {detailStatCards.map((s) => {
                    const Icon = s.icon;
                    return (
                      <Card key={s.label} className="rounded-xl border-0 shadow-sm">
                        <CardContent className={`p-4 text-center rounded-xl ${s.color}`}>
                          <Icon className="h-5 w-5 mx-auto mb-1" />
                          <p className="text-xl font-bold">{s.value}</p>
                          <p className="text-xs opacity-80">{s.label}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Info grid */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Informations</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs mb-1">Assureur</p>
                      <p className="font-semibold">{selected.insurer?.name}</p>
                      <p className="text-xs text-muted-foreground">{selected.insurer?.code}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs mb-1">Type de contrat</p>
                      <Badge className={ctColors[selected.contractType] || ""}>{ctLabels[selected.contractType] || selected.contractType}</Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs mb-1">Prix min</p>
                      <p className="font-mono font-semibold">{selected.priceMin ? fmtPrice(selected.priceMin) : "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs mb-1">Prix max</p>
                      <p className="font-mono font-semibold">{selected.priceMax ? fmtPrice(selected.priceMax) : "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs mb-1">Franchise</p>
                      <p className="font-mono font-semibold">{selected.deductible ? fmtPrice(selected.deductible) : "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs mb-1">Capital garanti</p>
                      <p className="font-mono font-semibold">{selected.coverageAmount ? fmtPrice(selected.coverageAmount) : "—"}</p>
                    </div>
                    {selected.category && (
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs mb-1">Catégorie</p>
                        <p className="font-medium">{selected.category.name}</p>
                      </div>
                    )}
                    {selected.createdAt && (
                      <div className="rounded-lg border p-3">
                        <p className="text-muted-foreground text-xs mb-1">Créée le</p>
                        <p className="font-medium">{fmtDate(selected.createdAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border p-3">{selected.description}</p>
                  </div>
                )}

                {/* Features */}
                {selected.features?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Caractéristiques</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.features.map((f: string) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Coverages */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Garanties de l&apos;assureur ({detailCoverages.length})</h3>
                  {detailCoverages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune garantie configurée pour cet assureur.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupedCoverages).sort(([a], [b]) => a.localeCompare(b)).map(([cat, covs]) => (
                        <div key={cat}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat} ({covs.length})</p>
                          <div className="space-y-1">
                            {covs.map((c) => (
                              <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">{c.name}</span>
                                  {c.isMandatory && <Badge variant="default" className="text-[10px] px-1.5 py-0">Obligatoire</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${calcBadge[c.calculationType] || ""}`}>{calcLabel[c.calculationType] || c.calculationType}</span>
                                  {!c.isActive && <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>Les devis associés seront perdus.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}