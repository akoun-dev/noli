"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Loader2 } from "lucide-react";
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
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = { DRAFT: { label: "Brouillon", variant: "secondary" }, PENDING: { label: "En attente", variant: "outline" }, APPROVED: { label: "Approuvé", variant: "default" }, REJECTED: { label: "Rejeté", variant: "destructive" } };

interface Quote {
  id: string; reference: string; status: string; estimatedPrice: number | null; vehicleData: string; personalData: string; coverageRequirements: string; createdAt: string;
  offer?: { name: string; contractType: string; insurer?: { name: string } }; category?: { name: string } };
const pd = (q: Quote) => { try { return JSON.parse(q.personalData); } catch { return {}; } };
const vd = (q: Quote) => { try { return JSON.parse(q.vehicleData); } catch { return {}; } };

export function DevisTab() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const fetchQuotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/quotes?${params}`);
      if (res.ok) setQuotes(await res.json());
    } finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const openDetail = (q: Quote) => { setSelected(q); setEditStatus(q.status); setDetailOpen(true); };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setEditStatus(newStatus);
    try {
      const res = await fetch("/api/admin/quotes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, status: newStatus }) });
      if (res.ok) { const updated = await res.json(); setSelected(updated); setQuotes((prev) => prev.map((q) => q.id === updated.id ? updated : q)); toast({ title: "Statut mis à jour" }); }
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  if (loading) {
    return <div className="space-y-4"><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" /></div></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Devis</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Référence..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="DRAFT">Brouillon</SelectItem><SelectItem value="PENDING">En attente</SelectItem><SelectItem value="APPROVED">Approuvé</SelectItem><SelectItem value="REJECTED">Rejeté</SelectItem></SelectContent></Select>
          </Select>
        </div>
      </div>
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Référence</TableHead>Client</TableHead>Assureur</TableHead>Offre</TableHead>
              <TableHead className="text-right">Prix estimé</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => {
              const s = statusMap[q.status] || statusMap.DRAFT;
              const personal = pd(q);
              const vehicle = vd(q);
              return (
                <TableRow key={q.id}>
                <TableCell className="font-mono text-xs">{q.reference}</TableCell>
                <TableCell>{`${personal.lastName || ""} ${personal.firstName || ""}`}</TableCell>
                <TableCell className="text-sm">{q.offer?.insurer?.name || "—"}</TableCell>
                <TableCell className="text-sm">{q.offer?.name || "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{q.estimatedPrice ? fmtPrice(q.estimatedPrice) : "—"}</TableCell>
                <TableCell>
                  <Select
                    value={q.status}
                    onValueChange={(v) => handleStatusChange(v)}
                    className={`h-7 w-32 text-xs ${s.variant === "destructive" ? "border-destructive text-destructive-foreground" : ""}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="APPROVED">Approuvé</SelectItem>
                    <SelectItem value="REJECTED">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(q.createdAt)}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(q)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )}
          </TableBody>
          {quotes.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucun devis.</p>}
      </div>
      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {quotes.map((q) => {
          const s = statusMap[q.status] || statusMap.DRAFT;
          return (
            <Card key={q.id} className="p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="font-mono text-xs">{q.reference}</p>
              <Badge variant={s.variant}>{s.label}</Badge>
            </div>
            <p className="text-sm">{q.offer?.insurer?.name} — {q.offer?.name}</p>
            <p className="font-mono text-sm font-medium mt-1">{q.estimatedPrice ? fmtPrice(q.estimatedPrice) : "—"}</p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(q)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Détails
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail du devis {selected?.reference}</DialogTitle>
            <DialogDescription>Consultez et modifiez le devis.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client</span><p className="font-medium">{pd.lastName || "—"}</p></div>
                <div><span className="text-muted-foreground">Email</span><p className="font-medium">{pd.email || "—"}</p></div>
                <div><span className="text-muted-foreground">Téléphone</span><p className="font-medium">{pd.phone || "—"}</p></div>
                <div><span className="text-muted-foreground">Assureur</span><p className="font-medium">{selected.offer?.insurer?.name || "—"}</p></div>
                <div><span className="text-muted-foreground">Offre</span><p className="font-medium">{selected.offer?.name || "—"}</p></div>
                <div><span className="text-muted-foreground">Catégorie</span><p className="font-medium">{selected.category?.name || "—"}</p></div>
                <div><span className="text-muted-foreground font-mono">Prix estimé : {selected.estimatedPrice ? fmtPrice(selected.estimatedPrice) : "—"}</p></div>
              </div>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Véhicule</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Type carburant</span><p className="font-medium">{vehicle.fuelType || "—"}</p></div>
                  <div><span className="text-muted-foreground">Puissance fiscale</span><p className="font-medium">{vehicle.fiscalPower || "—"}</p></div>
                  <div><span className="text-muted-foreground">Places</span><p className="font-medium">{vehicle.seats || "—"}</p></div>
                  <div><span className="text-muted-foreground font-mono">Valeur neuve</span><p className="font-mono">{vehicle.newValue ? fmtPrice(Number(vehicle.newValue)) : "—"}</p></div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Besoins en couverture</h4>
              <div className="flex flex-wrap gap-1">{(Array.isArray(cr(selected)) ? cr(selected) : []).map((need: string) => <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>)}</div>
              {(Array.isArray(cr(selected))?.length === 0 && <p className="text-xs text-muted-foreground">Aucun besoin spécifié.</p>}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
          <Button onClick={handleSaveNotes} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}