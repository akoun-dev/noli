"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────────
interface Quote {
  id: string; reference: string; status: string;
  personalInfo: { lastName?: string; firstName?: string; email?: string; phone?: string };
  vehicleInfo: { fuelType?: string; fiscalPower?: string; newValue?: string };
  proposedPrice: number | null; finalPrice: number | null;
  notes: string | null; createdAt: string;
  offer: { id: string; name: string; coverageType: string; insurer: { id: string; name: string; logo: string | null } } | null;
}

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_progress: { label: "En cours", variant: "default" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export function DevisTab() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editFinalPrice, setEditFinalPrice] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

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

  const openDetail = (q: Quote) => {
    setSelected(q);
    setEditNotes(q.notes || "");
    setEditFinalPrice(q.finalPrice?.toString() || "");
    setEditStatus(q.status);
    setDetailOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    setEditStatus(newStatus);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status: newStatus }),
      });
      if (res.ok) {
        const updated: Quote = await res.json();
        setSelected(updated);
        setQuotes((prev) => prev.map((q) => q.id === updated.id ? updated : q));
        toast({ title: "Statut mis à jour" });
      }
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleSaveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { id: selected.id, notes: editNotes || null };
      if (editFinalPrice) body.finalPrice = parseFloat(editFinalPrice);
      else body.finalPrice = null;
      const res = await fetch("/api/admin/quotes", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Devis mis à jour" });
        setDetailOpen(false);
        fetchQuotes();
      }
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Devis</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Référence..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="approved">Approuvé</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Assureur</TableHead>
              <TableHead>Offre</TableHead>
              <TableHead>Prix proposé</TableHead>
              <TableHead>Prix final</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => {
              const s = statusMap[q.status] || statusMap.pending;
              return (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.reference}</TableCell>
                  <TableCell>{q.personalInfo?.lastName || "—"}</TableCell>
                  <TableCell className="text-sm">{q.offer?.insurer?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{q.offer?.name || "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{q.proposedPrice ? fmtPrice(q.proposedPrice) : "—"}</TableCell>
                  <TableCell className="text-sm font-mono">{q.finalPrice ? fmtPrice(q.finalPrice) : "—"}</TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(v) => handleStatusChange(v)}>
                      <SelectTrigger className={`h-7 w-32 text-xs ${s.variant === "destructive" ? "border-destructive text-destructive" : ""}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(q.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(q)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {quotes.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucun devis trouvé.</p>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {quotes.map((q) => {
          const s = statusMap[q.status] || statusMap.pending;
          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono text-xs">{q.reference}</p>
                  <p className="font-semibold mt-1">{q.personalInfo?.lastName || "—"}</p>
                </div>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{q.offer?.insurer?.name} — {q.offer?.name}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Prix proposé</p>
                  <p className="font-mono font-medium">{q.proposedPrice ? fmtPrice(q.proposedPrice) : "—"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openDetail(q)}><Eye className="h-3.5 w-3.5 mr-1" /> Détails</Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail du devis {selected?.reference}</DialogTitle>
            <DialogDescription>Consultez et modifiez les informations du devis.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Client :</span><p className="font-medium">{selected.personalInfo?.lastName} {selected.personalInfo?.firstName}</p></div>
                <div><span className="text-muted-foreground">Email :</span><p className="font-medium">{selected.personalInfo?.email || "—"}</p></div>
                <div><span className="text-muted-foreground">Téléphone :</span><p className="font-medium">{selected.personalInfo?.phone || "—"}</p></div>
                <div><span className="text-muted-foreground">Assureur :</span><p className="font-medium">{selected.offer?.insurer?.name || "—"}</p></div>
                <div><span className="text-muted-foreground">Offre :</span><p className="font-medium">{selected.offer?.name || "—"}</p></div>
                <div><span className="text-muted-foreground">Date :</span><p className="font-medium">{fmtDate(selected.createdAt)}</p></div>
                <div><span className="text-muted-foreground">Prix proposé :</span><p className="font-mono font-medium">{selected.proposedPrice ? fmtPrice(selected.proposedPrice) : "—"}</p></div>
                <div><span className="text-muted-foreground">Véhicule :</span><p className="font-medium">{selected.vehicleInfo?.fuelType || "—"} / {selected.vehicleInfo?.fiscalPower || "—"} CV</p></div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <div className="grid gap-2">
                  <Label>Prix final (FCFA)</Label>
                  <Input type="number" value={editFinalPrice} onChange={(e) => setEditFinalPrice(e.target.value)} placeholder="Laisser vide si non défini" />
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Notes internes..." />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveDetail} disabled={saving} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}