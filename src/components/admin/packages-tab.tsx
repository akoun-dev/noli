"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, MoreHorizontal, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

interface Pkg { id: string; name: string; description: string | null; basePrice: number; isActive: boolean; _count: { coverageLinks: number }; }
interface CovMini { id: string; name: string; code: string; type: string; category?: { id: string; name: string; code: string } | null; }
interface PkgDetail extends Pkg { coverageLinks: { id: string; coverageId: string; isMandatory: boolean; coverage: CovMini }[] }

const calcColors: Record<string, string> = { FREE: "bg-emerald-100 text-emerald-800", FIXED_AMOUNT: "bg-blue-100 text-blue-800", VARIABLE_BASED: "bg-orange-100 text-orange-800", MATRIX_BASED: "bg-purple-100 text-purple-800" };

export function PackagesTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [form, setForm] = useState({ name: "", description: "", basePrice: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Manage coverages dialog
  const [covDialogOpen, setCovDialogOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<PkgDetail | null>(null);
  const [allCoverages, setAllCoverages] = useState<CovMini[]>([]);
  const [covLinks, setCovLinks] = useState<{ coverageId: string; isMandatory: boolean }[]>([]);
  const [savingCov, setSavingCov] = useState(false);

  const fetchItems = useCallback(async () => {
    try { const res = await fetch(`/api/admin/insurance-packages${search ? `?search=${search}` : ""}`); if (res.ok) setItems(await res.json()); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "", basePrice: 0, isActive: true }); setFormOpen(true); };
  const openEdit = (p: Pkg) => { setEditing(p); setForm({ name: p.name, description: p.description || "", basePrice: p.basePrice, isActive: p.isActive }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Nom obligatoire", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/insurance-packages/${editing.id}` : "/api/admin/insurance-packages";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Package modifié" : "Package créé" }); setFormOpen(false); fetchItems();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { const res = await fetch(`/api/admin/insurance-packages/${deleteId}`, { method: "DELETE" }); if (!res.ok) throw new Error(); toast({ title: "Supprimé" }); setDeleteId(null); fetchItems(); }
    catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const openCovDialog = async (pkg: Pkg) => {
    try {
      const [pkgRes, covRes] = await Promise.all([fetch(`/api/admin/insurance-packages/${pkg.id}`), fetch("/api/admin/coverages")]);
      if (!pkgRes.ok || !covRes.ok) throw new Error();
      setSelectedPkg(await pkgRes.json());
      const allCov: CovMini[] = await covRes.json();
      setAllCoverages(allCov);
      const linkMap = new Map((pkg as unknown as PkgDetail).coverageLinks.map((l) => [l.coverageId, l]));
      setCovLinks(allCov.map((c) => ({ coverageId: c.id, isMandatory: linkMap.get(c.id)?.isMandatory ?? false })));
      setCovDialogOpen(true);
    } catch { toast({ title: "Erreur de chargement", variant: "destructive" }); }
  };

  const saveCovLinks = async () => {
    if (!selectedPkg) return;
    setSavingCov(true);
    try {
      const res = await fetch(`/api/admin/insurance-packages/${selectedPkg.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coverageLinks: covLinks }) });
      if (!res.ok) throw new Error();
      toast({ title: "Garanties mises à jour" }); setCovDialogOpen(false); fetchItems();
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
    finally { setSavingCov(false); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  const grouped = allCoverages.reduce<Record<string, CovMini[]>>((acc, c) => { (acc[c.category?.name || "Autre"] ??= []).push(c); return acc; }, {});

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> Packages</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Prix base</TableHead><TableHead className="text-center">Garanties</TableHead><TableHead className="text-center">Statut</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
        <TableBody>{items.map((p) => (
          <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{p.description || "—"}</TableCell><TableCell className="text-right font-mono text-sm">{fmtPrice(p.basePrice)}</TableCell><TableCell className="text-center"><Button variant="ghost" size="sm" className="text-xs" onClick={() => openCovDialog(p)}><Package className="h-3.5 w-3.5 mr-1" />{p._count.coverageLinks}</Button></TableCell><TableCell className="text-center"><Switch checked={p.isActive} onCheckedChange={async () => { await fetch(`/api/admin/insurance-packages/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) }); fetchItems(); }} /></TableCell>
          <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openCovDialog(p)}><Package className="h-4 w-4 mr-2" /> Gérer garanties</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
        ))}</TableBody></Table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">{items.map((p) => <Card key={p.id} className="p-4"><div className="flex items-start justify-between mb-1"><p className="font-semibold">{p.name}</p><Switch checked={p.isActive} onCheckedChange={async () => { await fetch(`/api/admin/insurance-packages/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) }); fetchItems(); }} /></div><p className="text-sm font-mono">{fmtPrice(p.basePrice)}</p><p className="text-xs text-muted-foreground">{p._count.coverageLinks} garanties</p><div className="flex gap-2 mt-3"><Button variant="outline" size="sm" className="flex-1" onClick={() => openCovDialog(p)}><Package className="h-3.5 w-3.5 mr-1" /> Garanties</Button><Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></Card>)}</div>
      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} package</DialogTitle><DialogDescription>Ensemble pré-défini de garanties.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pack Pickup Bronze" /></div><div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div><div className="grid gap-2"><Label>Prix de base (FCFA)</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} /></div><div className="flex items-center justify-between"><Label>Actif</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Modifier" : "Créer"}</Button></DialogFooter>
      </DialogContent></Dialog>
      {/* Manage Coverages Dialog */}
      <Dialog open={covDialogOpen} onOpenChange={setCovDialogOpen}><DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader><DialogTitle>Garanties de « {selectedPkg?.name} »</DialogTitle><DialogDescription>Cochez les garanties incluses dans ce package.</DialogDescription></DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, covs]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat} ({covs.length})</p>
                <div className="space-y-1">{covs.map((c) => {
                  const idx = covLinks.findIndex((l) => l.coverageId === c.id);
                  const checked = idx >= 0 ? covLinks[idx].isMandatory : false;
                  return (
                    <label key={c.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "bg-card border-primary/30" : "bg-muted/30"}`}>
                      <Checkbox checked={checked} onCheckedChange={() => setCovLinks((prev) => prev.map((l, i) => i === idx ? { ...l, isMandatory: !l.isMandatory } : l))} />
                      <span className="text-sm flex-1">{c.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{c.code}</span>
                      {c.calculationType && <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${calcColors[c.calculationType] || ""}`}>{c.calculationType === "FREE" ? "Gratuit" : c.calculationType === "FIXED_AMOUNT" ? "Fixe" : c.calculationType === "VARIABLE_BASED" ? "Variable" : "Matrice"}</span>}
                    </label>
                  );
                })}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <DialogFooter><Button variant="outline" onClick={() => setCovDialogOpen(false)}>Annuler</Button><Button onClick={saveCovLinks} disabled={savingCov} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">{savingCov && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ce package ?</AlertDialogTitle><AlertDialogDescription>Les garanties liées seront dissociées.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}