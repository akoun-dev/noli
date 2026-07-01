"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Search, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Profile { id: string; email: string; firstName: string | null; lastName: string | null; phone: string | null; role: string; isActive: boolean; _count: { quotes: number }; createdAt: string; }

const roleColors: Record<string, string> = { ADMIN: "bg-red-100 text-red-800", INSURER: "bg-amber-100 text-amber-800", USER: "bg-slate-100 text-slate-800" };
const roleLabels: Record<string, string> = { ADMIN: "Admin", INSURER: "Assureur", USER: "Utilisateur" };

export function SettingsTab() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfiles = useCallback(async () => {
    try { const res = await fetch(`/api/admin/profiles${search ? `?search=${search}` : ""}`); if (res.ok) setProfiles(await res.json()); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const openEdit = (p: Profile) => { setEdit({ ...p }); setEditOpen(true); };

  const handleSave = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/profiles`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: edit.id, firstName: edit.firstName, lastName: edit.lastName, phone: edit.phone, role: edit.role, isActive: edit.isActive }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: "Profil mis à jour" });
      setEditOpen(false); fetchProfiles();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      <Tabs defaultValue="profils">
        <TabsList><TabsTrigger value="profils">Profils</TabsTrigger><TabsTrigger value="config">Configuration</TabsTrigger></TabsList>
        <TabsContent value="profils">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Utilisateurs</h2>
            <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          </div>
          <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
            <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Téléphone</TableHead><TableHead>Rôle</TableHead><TableHead className="text-center">Devis</TableHead><TableHead>Date</TableHead><TableHead className="text-center">Statut</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>{profiles.map((p) => (
              <TableRow key={p.id}><TableCell>{p.lastName || "—"} {p.firstName || ""}</TableCell><TableCell className="text-sm">{p.email}</TableCell><TableCell className="text-sm">{p.phone || "—"}</TableCell><TableCell><Badge className={roleColors[p.role] || ""}>{roleLabels[p.role] || p.role}</Badge></TableCell><TableCell className="text-center">{p._count.quotes}</TableCell><TableCell className="text-sm text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—"}</TableCell><TableCell className="text-center"><Switch checked={p.isActive} onCheckedChange={async () => { await fetch("/api/admin/profiles", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, isActive: !p.isActive }) }); fetchProfiles(); }} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button></TableCell></TableRow>
            ))}</TableBody></Table>
          </div>
        </TabsContent>
        <TabsContent value="config">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#B9E54D]" /> Configuration générale</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><p className="text-sm font-medium">Nom du site</p><p className="text-2xl font-bold">NOLI Assurance</p></div>
            <Separator />
            <div><p className="text-sm font-medium">Devise</p><p className="text-lg font-semibold">FCFA</p></div>
            <Separator />
            <div><p className="text-sm font-medium">Pays</p><p className="text-lg font-semibold">Côte d'Ivoire</p></div>
            <Separator />
            <div><p className="text-sm font-medium">Version</p><p className="text-sm text-muted-foreground">1.0.0</p></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Modifier le profil</DialogTitle><DialogDescription>Mise à jour les informations du profil.</DialogDescription></DialogHeader>
        {edit && (<div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Prénom</Label><Input value={edit.firstName || ""} onChange={(e) => setEdit({ ...edit, firstName: e.target.value })} /></div><div className="grid gap-2"><Label>Nom</Label><Input value={edit.lastName || ""} onChange={(e) => setEdit({ ...edit, lastName: e.target.value })} /></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Téléphone</Label><Input value={edit.phone || ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div><div className="grid gap-2"><Label>Rôle</Label><Select value={edit.role} onValueChange={(v) => setEdit({ ...edit, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USER">Utilisateur</SelectItem><SelectItem value="INSURER">Assureur</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent></Select></div></div>
          <div className="flex items-center justify-between"><Label>Actif</Label><Switch checked={edit.isActive} onCheckedChange={(v) => setEdit({ ...edit, isActive: v })} /></div>
        </div>)}
        <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button><Button onClick={handleSave} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}