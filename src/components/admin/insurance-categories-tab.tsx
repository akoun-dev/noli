"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Loader2, MoreHorizontal } from "lucide-react";
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

interface Cat { id: string; name: string; description: string | null; icon: string | null; isActive: boolean; _count: { offers: number; quotes: number }; }

const empty = { name: "", description: "", icon: "", isActive: true };

export function InsuranceCategoriesTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try { const res = await fetch(`/api/admin/insurance-categories${search ? `?search=${search}` : ""}`); if (res.ok) setItems(await res.json()); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditing(null); setForm(empty); setFormOpen(true); };
  const openEdit = (i: Cat) => { setEditing(i); setForm({ name: i.name, description: i.description || "", icon: i.icon || "", isActive: i.isActive }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Le nom est obligatoire", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/insurance-categories/${editing.id}` : "/api/admin/insurance-categories";
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Catégorie modifiée" : "Catégorie créée" });
      setFormOpen(false); fetchItems();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { const res = await fetch(`/api/admin/insurance-categories/${deleteId}`, { method: "DELETE" }); if (!res.ok) throw new Error(); toast({ title: "Supprimée" }); setDeleteId(null); fetchItems(); }
    catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Catégories Produits</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Description</TableHead><TableHead>Icône</TableHead><TableHead className="text-center">Offres</TableHead><TableHead className="text-center">Devis</TableHead><TableHead className="text-center">Statut</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
        <TableBody>{items.map((i) => (
          <TableRow key={i.id}><TableCell className="font-medium">{i.name}</TableCell><TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{i.description || "—"}</TableCell><TableCell className="text-sm">{i.icon || "—"}</TableCell><TableCell className="text-center">{i._count.offers}</TableCell><TableCell className="text-center">{i._count.quotes}</TableCell><TableCell className="text-center"><Switch checked={i.isActive} onCheckedChange={async () => { await fetch(`/api/admin/insurance-categories/${i.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !i.isActive }) }); fetchItems(); }} /></TableCell>
          <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(i)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(i.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>
        ))}</TableBody></Table>
        {items.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune catégorie.</p>}
      </div>
      <div className="md:hidden space-y-3">{items.map((i) => <Card key={i.id} className="p-4"><div className="flex items-start justify-between mb-2"><p className="font-semibold">{i.name}</p><Switch checked={i.isActive} onCheckedChange={async () => { await fetch(`/api/admin/insurance-categories/${i.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !i.isActive }) }); fetchItems(); }} /></div><p className="text-xs text-muted-foreground">{i._count.offers} offres</p><div className="flex gap-2 mt-3"><Button variant="outline" size="sm" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></Card>)}</div>
      <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouvelle"} catégorie</DialogTitle><DialogDescription>Catégorie de produit d'assurance.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div><div className="grid gap-2"><Label>Icône</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Car" /></div><div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div></div>
        <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Modifier" : "Créer"}</Button></DialogFooter>
      </DialogContent></Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}