"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  PENDING: { label: "En attente", variant: "outline" },
  APPROVED: { label: "Approuvé", variant: "default" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

interface Quote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  vehicleData: Record<string, unknown> | string;
  personalData: Record<string, unknown> | string;
  coverageRequirements: Record<string, unknown> | string;
  notes: string | null;
  finalPrice: number | null;
  createdAt: string;
  offer?: { name: string; contractType: string; insurer?: { name: string } };
  category?: { name: string };
  user?: { firstName: string | null; lastName: string | null; email: string; phone: string | null };
}

function parseJson<T>(value: string | Record<string, unknown>, fallback: T): T {
  if (typeof value === "object" && value !== null) return value as T;
  try { return JSON.parse(value || "null") ?? fallback; } catch { return fallback; }
}

export function DevisTab() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [detailNotes, setDetailNotes] = useState("");
  const [detailFinalPrice, setDetailFinalPrice] = useState("");
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
    setDetailNotes(q.notes || "");
    setDetailFinalPrice(q.finalPrice?.toString() || "");
    setDetailOpen(true);
  };

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quoteId, status: newStatus }),
      });
      if (res.ok) {
        toast({ title: "Statut mis à jour" });
        fetchQuotes();
      }
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleSaveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          notes: detailNotes || null,
          finalPrice: detailFinalPrice ? parseFloat(detailFinalPrice) : null,
        }),
      });
      if (res.ok) {
        toast({ title: "Devis mis à jour" });
        setDetailOpen(false);
        fetchQuotes();
      }
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = statusMap[status] || statusMap.DRAFT;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" /> Devis
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Référence..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="APPROVED">Approuvé</SelectItem>
              <SelectItem value="REJECTED">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              <TableHead className="text-right">Prix estimé</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => {
              const personal = parseJson(q.personalData, {} as Record<string, unknown>);
              const clientName = `${personal.lastName || ""} ${personal.firstName || ""}`.trim() || (q.user?.email || "—");
              return (
                <TableRow key={q.id}>
                  <TableCell className="font-mono text-xs">{q.reference}</TableCell>
                  <TableCell className="text-sm">{clientName}</TableCell>
                  <TableCell className="text-sm">{q.offer?.insurer?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{q.offer?.name || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {q.estimatedPrice ? fmtPrice(q.estimatedPrice) : "—"}
                  </TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(v) => handleStatusChange(q.id, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs">
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
              );
            })}
          </TableBody>
        </Table>
        {quotes.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">Aucun devis.</p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {quotes.map((q) => {
          const personal = parseJson(q.personalData, {} as Record<string, unknown>);
          return (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="font-mono text-xs">{q.reference}</p>
                {getStatusBadge(q.status)}
              </div>
              <p className="text-sm">{q.offer?.insurer?.name} — {q.offer?.name}</p>
              <p className="font-mono text-sm font-medium mt-1">
                {q.estimatedPrice ? fmtPrice(q.estimatedPrice) : "—"}
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(q)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Détails
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail du devis {selected?.reference}</DialogTitle>
            <DialogDescription>Consultez et modifiez le devis.</DialogDescription>
          </DialogHeader>
          {selected && (() => {
            const personal = parseJson(selected.personalData, {} as Record<string, unknown>);
            const vehicle = parseJson(selected.vehicleData, {} as Record<string, unknown>);
            const requirements = parseJson(selected.coverageRequirements, [] as string[]);
            const reqArray = Array.isArray(requirements) ? requirements : [];
            return (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Label>Statut</Label>
                  <Select value={selected.status} onValueChange={(v) => {
                    handleStatusChange(selected.id, v);
                    setSelected({ ...selected, status: v });
                  }}>
                    <SelectTrigger className="w-full w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Brouillon</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="APPROVED">Approuvé</SelectItem>
                      <SelectItem value="REJECTED">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Client info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs mb-1">Client</p>
                    <p className="font-medium">{(personal.lastName || "") + " " + (personal.firstName || "") || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs mb-1">Email</p>
                    <p className="font-medium text-sm">{(personal.email as string) || selected.user?.email || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs mb-1">Téléphone</p>
                    <p className="font-medium">{(personal.phone as string) || selected.user?.phone || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs mb-1">Assureur</p>
                    <p className="font-medium">{selected.offer?.insurer?.name || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs mb-1">Offre</p>
                    <p className="font-medium">{selected.offer?.name || "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs mb-1">Prix estimé</p>
                    <p className="font-mono font-semibold">{selected.estimatedPrice ? fmtPrice(selected.estimatedPrice) : "—"}</p>
                  </div>
                </div>

                <Separator />

                {/* Vehicle */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Véhicule</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Type carburant</span><p className="font-medium">{(vehicle.fuelType as string) || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Puissance fiscale</span><p className="font-medium">{(vehicle.fiscalPower as string) || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Places</span><p className="font-medium">{(vehicle.seats as string) || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Valeur neuve</span><p className="font-mono">{vehicle.newValue ? fmtPrice(Number(vehicle.newValue)) : "—"}</p></div>
                  </div>
                </div>

                {/* Coverage requirements */}
                {reqArray.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Besoins en couverture</h4>
                    <div className="flex flex-wrap gap-1">
                      {reqArray.map((need: string) => (
                        <Badge key={need} variant="secondary" className="text-xs">{need}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Admin fields */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Administration</h4>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>Prix final (FCFA)</Label>
                      <Input className="w-full" type="number" value={detailFinalPrice} onChange={(e) => setDetailFinalPrice(e.target.value)} placeholder="Ex: 85000" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Notes</Label>
                      <Textarea className="w-full" value={detailNotes} onChange={(e) => setDetailNotes(e.target.value)} rows={3} placeholder="Notes internes..." />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fermer</Button>
            <Button onClick={handleSaveDetail} disabled={saving} className="bg-brand text-black hover:bg-brand-hover">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}