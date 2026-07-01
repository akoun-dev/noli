"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, MoreHorizontal, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const ctLabels: Record<string, string> = { basic: "Tiers Simple", third_party_plus: "Tiers+", all_risks: "Tous Risques" };
const ctColors: Record<string, string> = { basic: "bg-slate-100 text-slate-800", third_party_plus: "bg-amber-100 text-amber-800", all_risks: "bg-emerald-100 text-emerald-800" };

interface Insurer { id: string; code: string; name: string; logoUrl: string | null; contactEmail: string | null; phone: string | null; website: string | null; isActive: boolean; createdAt: string; _count: { offers: number; coverages: number; accounts: number } }
interface InsurerFull extends Insurer { offers: { id: string; name: string; contractType: string; basePrice: number }[]; coverages: { id: string; name: string; type: string; calculationType: string; category?: { id: string; name: string; code: string } }[]; accounts: { id: string; profile?: { firstName: string; lastName: string; email: string } }[] }
interface Offer { id: string; insurerId: string; name: string; contractType: string; description: string | null; priceMin: number | null; priceMax: number | null; coverageAmount: number | null; deductible: number; features: string[]; isActive: boolean; createdAt: string; insurer: { id: string; name: string; code: string }; category?: { id: string; name: string } }
interface InsurerMini { id: string; name: string; code: string }

const empty = { insurerId: "", name: "", contractType: "basic" as string, description: "", priceMin: null as number | null, priceMax: null as number | null, coverageAmount: null as number | null, deductible: 0, features: "[]" as string, isActive: true };

export function InsuranceOffersTab() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [insurers, setInsurers] = useState<InsurerMini[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);

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

  const openCreate = () => { setEditing(null); setForm(empty); setFormOpen(true); };
  const openEdit = (o: Offer) => { setEditing(o); setForm({ insurerId: o.insurerId, name: o.name, contractType: o.contractType, description: o.description || "", priceMin: o.priceMin, priceMax: o.priceMax, coverageAmount: o.coverageAmount, deductible: o.deductible, features: JSON.stringify(o.features), isActive: o.isActive }); setFormOpen(true); };
  const openDetail = (o: Offer) => { setSelected(o); setDetailOpen(true); };

  const handleSave = async () => {
    if (!form.insurerId || !form.name.trim() || !form.contractType) { toast({ title: "Champs obligatoires: assureur, nom, type de contrat", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/insurance-offers/${editing.id}` : "/api/admin/insurance-offers";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, features: JSON.parse(form.features) }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Offre modifiée" : "Offre créée" }); setFormOpen(false); fetchData();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fetch(`/api/admin/insurance-offers/${deleteId}`, { method: "DELETE" }); toast({ title: "Offre supprimée" }); setDeleteId(null); fetchData(); }
    catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleToggle = async (o: Offer) => { try { await fetch(`/api/admin/insurance-offers/${o.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !o.isActive }) }); fetchData(); } catch {} };

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  const filtered = offers;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Offres</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Select value={filterInsurer} onValueChange={(v) => setFilterInsurer(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Assureur" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select>
          </Select>
          <Select value={filterType} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="basic">Tiers Simple</SelectItem><SelectItem value="third_party_plus">Tiers+</SelectItem><SelectItem value="all_risks">Tous Risques</SelectItem></SelectContent></Select>
          </Select>
          <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Assureur</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Prix min</TableHead><TableHead className="text-right">Prix max</TableHead><TableHead className="text-center">Franchise</TableHead><TableHead>Catégorie</TableHead><TableHead className="text-center">Statut</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
        <TableBody>{filtered.map((o) => (
          <TableRow key={o.id}><TableCell className="font-medium">{o.name}</TableCell><TableCell className="text-sm">{o.insurer?.name || "—"}</TableCell><TableCell><Badge className={ctColors[o.contractType] || ""}>{ctLabels[o.contractType] || o.contractType}</Badge><TableCell className="text-right font-mono text-sm">{o.priceMin ? fmtPrice(o.priceMin) : "—"}</TableCell><TableCell className="text-right font-mono text-sm">{o.priceMax ? fmtPrice(o.priceMax) : "—"}</TableCell><TableCell className="text-center font-mono">{o.deductible ? fmtPrice(o.deductible) : "—"}</TableCell><TableCell className="text-sm">{o.category?.name || "—"}</TableCell><TableCell className="text-center"><Switch checked={o.isActive} onCheckedChange={() => handleToggle(o)} /></TableCell>
            <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openDetail(o)}><Eye className="h-4 w-4 mr-2" /> Voir</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(o)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
        ))}</TableBody></Table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune offre.</p>}
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-3">{filtered.map((o) => (
        <Card key={o.id} className="p-4"><div className="flex items-start justify-between mb-1"><p className="font-semibold">{o.name}</p><Badge className={ctColors[o.contractType] || ""}>{ctLabels[o.contractType]}</Badge><Switch checked={o.isActive} onCheckedChange={() => handleToggle(o)} /></div><p className="text-sm text-muted-foreground">{o.insurer?.name}</p><p className="font-mono text-sm mt-1">{o.priceMin ? fmtPrice(o.priceMin) : "—"}</p><div className="flex gap-2 mt-3"><Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(o)}><Eye className="h-3.5 w-3.5 mr-1" /> Détails</Button><Button variant="outline" size="sm" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></Card>
      ))}</div>
      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle><DialogDescription>Configurez les détails de l'offre.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Assureur *</Label><Select value={form.insurerId} onValueChange={(v) => setForm({ ...form, insurerId: v })}><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Économique" /></div>
            <div className="grid gap-2"><Label>Type de contrat *</Label><Select value={form.contractType} onValueChange={(v) => setForm({ ...form, contractType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="basic">Tiers Simple</SelectItem><SelectItem value="third_party_plus">Tiers+</SelectItem><SelectItem value="all_risks">Tous Risques</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Prix min (FCFA/an)</Label><Input type="number" value={form.priceMin ?? ""} onChange={(e) => setForm({ ...form, priceMin: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div className="grid gap-2"><Label>Prix max (FCFA/an)</Label><Input type="number" value={form.priceMax ?? ""} onChange={(e) => setForm({ ...form, priceMax: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div className="grid gap-2"><Label>Franchise (FCFA)</Label><Input type="number" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="grid gap-2"><Label>Capital garanti (FCFA)</Label><Input type="number" value={form.coverageAmount ?? ""} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value ? parseFloat(e.target.value) : null })} /></div>
          <div className="grid gap-2"><Label>Caractéristiques (JSON)</Label><Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={3} className="font-mono text-xs" placeholder='["RC", "Incendie", "Vol"]' /></div>
          <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Modifier" : "Créer"}</Button></DialogFooter>
      </DialogContent></Dialog>
      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.description}</DialogDescription></DialogHeader>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Assureur</span><p className="font-semibold">{selected.insurer?.name} ({selected.insurer?.code})</p></div>
              <div><span className="text-muted-foreground">Type de contrat</span><p><Badge className={ctColors[selected.contractType] || ""}>{ctLabels[selected.contractType] || selected.contractType}</Badge></p></div>
              <div><span className="text-muted-foreground">Catégorie</span><p className="font-medium">{selected.category?.name || "—"}</p></div>
              <div><span className="text-muted-foreground">Prix min</span><p className="font-mono">{selected.priceMin ? fmtPrice(selected.priceMin) : "—"}</p></div>
              <div><span className="text-muted-foreground">Prix max</span><p className="font-mono">{selected.priceMax ? fmtPrice(selected.priceMax) : "—"}</p></div>
              <div><span className="text-muted-foreground">Franchise</span><p className="font-mono">{selected.deductible ? fmtPrice(selected.deductible) : "—"}</p></div>
            </div>
            <Separator />
            <div><p className="text-sm font-medium">Description</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.description || "Aucune description."}</p></div>
            <Separator />
            <div><p className="text-sm font-medium">Caractéristiques</p>
            <div className="flex flex-wrap gap-1">{selected.features?.map((f: string) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}</div></div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle><AlertDialogDescription>Les devis associés seront perdus.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}