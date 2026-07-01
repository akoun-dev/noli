"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, MoreHorizontal, Eye, FileText, Shield, Building2, Calendar } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const ctLabels: Record<string, string> = { basic: "Tiers Simple", third_party_plus: "Tiers+", all_risks: "Tous Risques" };
const ctColors: Record<string, string> = { basic: "bg-slate-100 text-slate-800", third_party_plus: "bg-amber-100 text-amber-800", all_risks: "bg-emerald-100 text-emerald-800" };
const calcBadge: Record<string, string> = { FREE: "bg-emerald-100 text-emerald-800", FIXED_AMOUNT: "bg-blue-100 text-blue-800", VARIABLE_BASED: "bg-orange-100 text-orange-800", MATRIX_BASED: "bg-purple-100 text-purple-800" };
const calcLabel: Record<string, string> = { FREE: "Gratuit", FIXED_AMOUNT: "Fixe", VARIABLE_BASED: "Variable", MATRIX_BASED: "Matrice" };

interface InsurerMini { id: string; name: string; code: string }
interface Offer {
  id: string; insurerId: string; name: string; contractType: string;
  description: string | null; priceMin: number | null; priceMax: number | null;
  coverageAmount: number | null; deductible: number; features: string[];
  isActive: boolean; createdAt: string;
  insurer: { id: string; name: string; code: string };
  category?: { id: string; name: string } | null;
  _count?: { quotes: number };
}
interface CoverageMini {
  id: string; code: string; name: string; type: string;
  calculationType: string; isMandatory: boolean; isActive: boolean;
  category: { id: string; name: string; code: string } | null;
}

const empty = {
  insurerId: "", name: "", contractType: "basic" as string, description: "",
  priceMin: null as number | null, priceMax: null as number | null,
  coverageAmount: null as number | null, deductible: 0,
  features: "[]" as string, isActive: true,
};

interface InsurerOfferPreview {
  id: string; name: string; contractType: string;
  priceMin: number | null; priceMax: number | null;
  isActive: boolean; createdAt: string;
}

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

  // Form: existing offers for selected insurer
  const [insurerOffers, setInsurerOffers] = useState<InsurerOfferPreview[]>([]);
  const [insurerOffersLoading, setInsurerOffersLoading] = useState(false);

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

  // Fetch offers linked to the selected insurer in the form
  useEffect(() => {
    if (!form.insurerId) {
      setInsurerOffers([]);
      return;
    }
    setInsurerOffersLoading(true);
    fetch(`/api/admin/insurance-offers?insurerId=${form.insurerId}`)
      .then((r) => { if (r.ok) return r.json(); return []; })
      .then((data) => setInsurerOffers(data))
      .catch(() => setInsurerOffers([]))
      .finally(() => setInsurerOffersLoading(false));
  }, [form.insurerId]);

  const openCreate = () => { setEditing(null); setForm(empty); setFormOpen(true); };
  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({
      insurerId: o.insurerId, name: o.name, contractType: o.contractType,
      description: o.description || "", priceMin: o.priceMin, priceMax: o.priceMax,
      coverageAmount: o.coverageAmount, deductible: o.deductible,
      features: JSON.stringify(o.features), isActive: o.isActive,
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
    if (!form.insurerId || !form.name.trim() || !form.contractType) {
      toast({ title: "Champs obligatoires: assureur, nom, type de contrat", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/insurance-offers/${editing.id}` : "/api/admin/insurance-offers";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, features: JSON.parse(form.features) }),
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
          <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead><TableHead>Assureur</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Prix min</TableHead><TableHead className="text-right">Prix max</TableHead>
              <TableHead className="text-center">Franchise</TableHead><TableHead>Catégorie</TableHead>
              <TableHead className="text-center">Statut</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((o) => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(o)}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-sm">{o.insurer?.name || "—"}</TableCell>
                <TableCell><Badge className={ctColors[o.contractType] || ""}>{ctLabels[o.contractType] || o.contractType}</Badge></TableCell>
                <TableCell className="text-right font-mono text-sm">{o.priceMin ? fmtPrice(o.priceMin) : "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{o.priceMax ? fmtPrice(o.priceMax) : "—"}</TableCell>
                <TableCell className="text-center font-mono text-sm">{o.deductible ? fmtPrice(o.deductible) : "—"}</TableCell>
                <TableCell className="text-sm">{o.category?.name || "—"}</TableCell>
                <TableCell className="text-center"><Switch checked={o.isActive} onCheckedChange={(e) => { e.stopPropagation(); handleToggle(o); }} onClick={(e) => e.stopPropagation()} /></TableCell>
                <TableCell>
                  <DropdownMenu><DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(o)}><Eye className="h-4 w-4 mr-2" /> Voir</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(o)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            <div><p className="font-semibold">{o.name}</p><p className="text-sm text-muted-foreground">{o.insurer?.name}</p></div>
            <Badge className={ctColors[o.contractType] || ""}>{ctLabels[o.contractType]}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
            {o.priceMin && <span className="font-mono">à partir de {fmtPrice(o.priceMin)}</span>}
            <Switch checked={o.isActive} onCheckedChange={(e) => { e.stopPropagation(); handleToggle(o); }} onClick={(e) => e.stopPropagation()} />
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
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

            {/* Linked offers for selected insurer */}
            {form.insurerId && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm text-muted-foreground">
                    Offres de cet assureur ({insurerOffers.length})
                  </Label>
                  {insurerOffersLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border space-y-0">
                  {insurerOffers.length === 0 && !insurerOffersLoading && (
                    <p className="text-sm text-muted-foreground text-center py-3">Aucune offre existante pour cet assureur.</p>
                  )}
                  {insurerOffers.map((o) => (
                    <div
                      key={o.id}
                      className={`flex items-center justify-between px-3 py-2 border-b last:border-b-0 ${editing?.id === o.id ? "bg-[#B9E54D]/10" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{o.name}</span>
                        <Badge className={`text-[10px] shrink-0 ${ctColors[o.contractType] || ""}`}>{ctLabels[o.contractType] || o.contractType}</Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {o.priceMin != null && (
                          <span className="text-xs text-muted-foreground font-mono">{fmtPrice(o.priceMin)}</span>
                        )}
                        {!o.isActive && (
                          <Badge variant="secondary" className="text-[10px]">Inactif</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full grid gap-2">
              <Label>Nom *</Label>
              <Input className="w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Économique" />
            </div>
            <div className="w-full grid gap-2">
              <Label>Type de contrat *</Label>
              <Select value={form.contractType} onValueChange={(v) => setForm({ ...form, contractType: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="basic">Tiers Simple</SelectItem><SelectItem value="third_party_plus">Tiers+</SelectItem><SelectItem value="all_risks">Tous Risques</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="w-full grid gap-2">
              <Label>Description</Label>
              <Textarea className="w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="w-full grid gap-2">
              <Label>Prix min (FCFA)</Label>
              <Input className="w-full" type="number" value={form.priceMin ?? ""} onChange={(e) => setForm({ ...form, priceMin: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div className="w-full grid gap-2">
              <Label>Prix max (FCFA)</Label>
              <Input className="w-full" type="number" value={form.priceMax ?? ""} onChange={(e) => setForm({ ...form, priceMax: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div className="w-full grid gap-2">
              <Label>Franchise (FCFA)</Label>
              <Input className="w-full" type="number" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="w-full grid gap-2">
              <Label>Capital garanti (FCFA)</Label>
              <Input className="w-full" type="number" value={form.coverageAmount ?? ""} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value ? parseFloat(e.target.value) : null })} />
            </div>
            <div className="w-full grid gap-2">
              <Label>Caractéristiques (JSON)</Label>
              <Textarea className="w-full font-mono text-xs" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={3} placeholder='["RC", "Incendie", "Vol"]' />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Modifier" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#B9E54D]" />
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