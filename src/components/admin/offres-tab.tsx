"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Search, Loader2, ShieldCheck, MoreHorizontal, Eye, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ────────────────────────────────────────────────────────
interface Offer {
  id: string; insurerId: string; name: string; coverageType: string;
  description: string | null; basePrice: number; annualPrice: number | null;
  deductible: number | null; maxCoverage: number | null; features: string[];
  conditions: string | null; isActive: boolean; createdAt: string;
  insurer: { id: string; name: string; logo: string | null };
  guaranteeLinks: { id: string; guaranteeId: string; isIncluded: boolean; guarantee: { id: string; name: string; calcMethod: string } }[];
}

interface InsurerMini { id: string; name: string; }
interface GuaranteeMini { id: string; name: string; calcMethod: string; }

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

const coverageLabels: Record<string, string> = { tiers: "Tiers", tiers_plus: "Tiers+", tous_risques: "Tous Risques" };
const coverageColors: Record<string, string> = {
  tiers: "bg-slate-100 text-slate-800",
  tiers_plus: "bg-amber-100 text-amber-800",
  tous_risques: "bg-emerald-100 text-emerald-800",
};

const CalcBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = { FREE: "bg-emerald-100 text-emerald-800", FIXED_AMOUNT: "bg-blue-100 text-blue-800", VARIABLE_BASED: "bg-orange-100 text-orange-800", MATRIX_BASED: "bg-purple-100 text-purple-800" };
  const labels: Record<string, string> = { FREE: "Gratuit", FIXED_AMOUNT: "Fixe", VARIABLE_BASED: "Variable", MATRIX_BASED: "Matrice" };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[method] || "bg-gray-100"}`}>{labels[method] || method}</span>;
};

const emptyOffer = {
  insurerId: "", name: "", coverageType: "tiers" as string, description: "",
  basePrice: 0, annualPrice: null as number | null, deductible: null as number | null,
  maxCoverage: null as number | null, features: "[]" as string, conditions: "", isActive: true,
};

export function OffresTab() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [insurers, setInsurers] = useState<InsurerMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState(emptyOffer);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Guarantee dialog
  const [guaranteeDialogOpen, setGuaranteeDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [allGuarantees, setAllGuarantees] = useState<GuaranteeMini[]>([]);
  const [guaranteeChecks, setGuaranteeChecks] = useState<{ guaranteeId: string; isIncluded: boolean }[]>([]);
  const [savingGuarantees, setSavingGuarantees] = useState(false);

  // Detail view
  const [detailOffer, setDetailOffer] = useState<Offer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterInsurer) params.set("insurerId", filterInsurer);
      if (filterType) params.set("coverageType", filterType);
      const res = await fetch(`/api/admin/offers?${params}`);
      if (res.ok) setOffers(await res.json());
    } finally { setLoading(false); }
  }, [search, filterInsurer, filterType]);

  const fetchInsurers = useCallback(async () => {
    const res = await fetch("/api/admin/insurers?active=true");
    if (res.ok) setInsurers(await res.json());
  }, []);

  useEffect(() => { fetchOffers(); fetchInsurers(); }, [fetchOffers, fetchInsurers]);

  const filtered = offers;

  const openCreate = () => { setEditing(null); setForm(emptyOffer); setFormOpen(true); };
  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({
      insurerId: o.insurerId, name: o.name, coverageType: o.coverageType,
      description: o.description || "", basePrice: o.basePrice,
      annualPrice: o.annualPrice, deductible: o.deductible, maxCoverage: o.maxCoverage,
      features: JSON.stringify(o.features), conditions: o.conditions || "", isActive: o.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.insurerId || !form.name.trim()) { toast({ title: "Assureur et nom obligatoires", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/offers/${editing.id}` : "/api/admin/offers";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, features: JSON.parse(form.features || "[]") }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Offre modifiée" : "Offre créée" });
      setFormOpen(false);
      fetchOffers();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/offers/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Offre supprimée" });
      setDeleteId(null); fetchOffers();
    } catch { toast({ title: "Erreur de suppression", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const handleToggleActive = async (o: Offer) => {
    try {
      await fetch(`/api/admin/offers/${o.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !o.isActive }),
      });
      fetchOffers();
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  // ── Detail view ────────────────────────────────────────────────
  const openDetail = async (o: Offer) => {
    setDetailLoading(true);
    setDetailOffer(null);
    try {
      const res = await fetch(`/api/admin/offers/${o.id}`);
      if (res.ok) {
        setDetailOffer(await res.json());
      } else throw new Error();
    } catch { toast({ title: "Erreur de chargement", variant: "destructive" }); }
    finally { setDetailLoading(false); }
  };

  // ── Guarantee dialog ────────────────────────────────────────────
  const openGuaranteeDialog = async (offer: Offer) => {
    try {
      const [offerRes, guaranteesRes] = await Promise.all([
        fetch(`/api/admin/offers/${offer.id}`),
        fetch("/api/admin/guarantees"),
      ]);
      if (!offerRes.ok || !guaranteesRes.ok) throw new Error();
      const offerFull: Offer = await offerRes.json();
      const guarantees: GuaranteeMini[] = await guaranteesRes.json();
      setSelectedOffer(offerFull);
      setAllGuarantees(guarantees);
      const linkMap = new Map(offerFull.guaranteeLinks.map((l) => [l.guaranteeId, l]));
      setGuaranteeChecks(guarantees.map((g) => ({ guaranteeId: g.id, isIncluded: linkMap.get(g.id)?.isIncluded ?? false })));
      setGuaranteeDialogOpen(true);
    } catch { toast({ title: "Erreur de chargement", variant: "destructive" }); }
  };

  const toggleCheck = (idx: number) => {
    setGuaranteeChecks((prev) => prev.map((c, i) => i === idx ? { ...c, isIncluded: !c.isIncluded } : c));
  };

  const saveGuarantees = async () => {
    if (!selectedOffer) return;
    setSavingGuarantees(true);
    try {
      const res = await fetch(`/api/admin/offers/${selectedOffer.id}/guarantees`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guarantees: guaranteeChecks }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Garanties mises à jour" });
      setGuaranteeDialogOpen(false);
      fetchOffers();
    } catch { toast({ title: "Erreur de sauvegarde", variant: "destructive" }); }
    finally { setSavingGuarantees(false); }
  };

  // Group guarantees by calcMethod
  const groupedGuarantees = allGuarantees.reduce<Record<string, GuaranteeMini[]>>((acc, g) => {
    (acc[g.calcMethod] ??= []).push(g);
    return acc;
  }, {});

  const groupLabels: Record<string, string> = {
    FREE: "🟢 Gratuites", FIXED_AMOUNT: "🔵 Montant fixe",
    VARIABLE_BASED: "🟠 Taux variable", MATRIX_BASED: "🟣 Matrice",
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Offres</h1>
        <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterInsurer} onValueChange={(v) => setFilterInsurer(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Assureur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les assureurs</SelectItem>
            {insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="tiers">Tiers</SelectItem>
            <SelectItem value="tiers_plus">Tiers+</SelectItem>
            <SelectItem value="tous_risques">Tous Risques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead>
              <TableHead>Assureur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prix de base</TableHead>
              <TableHead>Franchise</TableHead>
              <TableHead className="text-center">Garanties</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-sm">{o.insurer.name}</TableCell>
                <TableCell><Badge className={coverageColors[o.coverageType] || ""}>{coverageLabels[o.coverageType] || o.coverageType}</Badge></TableCell>
                <TableCell className="text-sm font-mono">{fmtPrice(o.basePrice)}</TableCell>
                <TableCell className="text-sm">{o.deductible ? fmtPrice(o.deductible) : "—"}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => openGuaranteeDialog(o)}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />{o.guaranteeLinks.filter((l) => l.isIncluded).length}
                  </Button>
                </TableCell>
                <TableCell className="text-center"><Switch checked={o.isActive} onCheckedChange={() => handleToggleActive(o)} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(o)}><Eye className="h-4 w-4 mr-2" /> Voir</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openGuaranteeDialog(o)}><ShieldCheck className="h-4 w-4 mr-2" /> Gérer les garanties</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(o)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucune offre trouvée.</p>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{o.name}</p>
                <p className="text-xs text-muted-foreground">{o.insurer.name}</p>
              </div>
              <Switch checked={o.isActive} onCheckedChange={() => handleToggleActive(o)} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              <Badge className={coverageColors[o.coverageType] || ""}>{coverageLabels[o.coverageType]}</Badge>
              <Badge variant="outline">{o.guaranteeLinks.filter((l) => l.isIncluded).length} garanties</Badge>
            </div>
            <p className="text-sm font-mono font-medium mb-3">{fmtPrice(o.basePrice)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(o)}><Eye className="h-3.5 w-3.5 mr-1" /> Voir</Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!detailOffer || detailLoading} onOpenChange={() => setDetailOffer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : detailOffer ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <DialogTitle className="text-xl">{detailOffer.name}</DialogTitle>
                  <Badge className={coverageColors[detailOffer.coverageType] || ""}>
                    {coverageLabels[detailOffer.coverageType] || detailOffer.coverageType}
                  </Badge>
                  <Badge className="bg-[#B9E54D]/20 text-black">{detailOffer.insurer.name}</Badge>
                </div>
                {detailOffer.description && (
                  <DialogDescription>{detailOffer.description}</DialogDescription>
                )}
              </DialogHeader>

              <ScrollArea className="max-h-[65vh] pr-2">
                <div className="space-y-6 pb-4">
                  {/* Pricing */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tarification</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Card><CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Prix de base</p>
                        <p className="font-bold text-sm font-mono">{fmtPrice(detailOffer.basePrice)}</p>
                      </CardContent></Card>
                      <Card><CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Prix annuel</p>
                        <p className="font-bold text-sm font-mono">{detailOffer.annualPrice ? fmtPrice(detailOffer.annualPrice) : "—"}</p>
                      </CardContent></Card>
                      <Card><CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Franchise</p>
                        <p className="font-bold text-sm font-mono">{detailOffer.deductible ? fmtPrice(detailOffer.deductible) : "—"}</p>
                      </CardContent></Card>
                      <Card><CardContent className="p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Couverture max</p>
                        <p className="font-bold text-sm font-mono">{detailOffer.maxCoverage ? fmtPrice(detailOffer.maxCoverage) : "—"}</p>
                      </CardContent></Card>
                    </div>
                  </div>

                  {/* Features */}
                  {detailOffer.features.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Caractéristiques</h3>
                      <div className="space-y-1">
                        {detailOffer.features.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  {detailOffer.conditions && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Conditions</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailOffer.conditions}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Included guarantees */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Garanties incluses ({detailOffer.guaranteeLinks.filter((l) => l.isIncluded).length})
                    </h3>
                    {detailOffer.guaranteeLinks.filter((l) => l.isIncluded).length > 0 ? (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Garantie</TableHead>
                              <TableHead>Méthode</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailOffer.guaranteeLinks.filter((l) => l.isIncluded).map((gl) => (
                              <TableRow key={gl.id}>
                                <TableCell className="font-medium text-sm">{gl.guarantee.name}</TableCell>
                                <TableCell><CalcBadge method={gl.guarantee.calcMethod} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune garantie incluse.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <Separator />
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDetailOffer(null); openEdit(detailOffer); }}>
                  <Pencil className="h-4 w-4 mr-1" /> Modifier
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Form Dialog ──────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle><DialogDescription>Remplissez les informations de l'offre.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Assureur *</Label>
              <Select value={form.insurerId} onValueChange={(v) => setForm({ ...form, insurerId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{insurers.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid gap-2">
                <Label>Type de couverture *</Label>
                <Select value={form.coverageType} onValueChange={(v) => setForm({ ...form, coverageType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiers">Tiers</SelectItem>
                    <SelectItem value="tiers_plus">Tiers+</SelectItem>
                    <SelectItem value="tous_risques">Tous Risques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Prix de base (FCFA/mois) *</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} /></div>
              <div className="grid gap-2"><Label>Prix annuel (FCFA)</Label><Input type="number" value={form.annualPrice ?? ""} onChange={(e) => setForm({ ...form, annualPrice: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Franchise (FCFA)</Label><Input type="number" value={form.deductible ?? ""} onChange={(e) => setForm({ ...form, deductible: e.target.value ? parseFloat(e.target.value) : null })} /></div>
              <div className="grid gap-2"><Label>Couverture max (FCFA)</Label><Input type="number" value={form.maxCoverage ?? ""} onChange={(e) => setForm({ ...form, maxCoverage: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            </div>
            <div className="grid gap-2"><Label>Caractéristiques (JSON)</Label><Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={3} className="font-mono text-xs" /></div>
            <div className="grid gap-2"><Label>Conditions</Label><Textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} rows={2} /></div>
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

      {/* ── Delete Dialog ────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible et supprimera les devis associés.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground">{deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Guarantees Dialog ────────────────────────────────────── */}
      <Dialog open={guaranteeDialogOpen} onOpenChange={setGuaranteeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Garanties de « {selectedOffer?.name} »</DialogTitle>
            <DialogDescription>{selectedOffer?.insurer.name} — {coverageLabels[selectedOffer?.coverageType || ""]}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {Object.entries(groupedGuarantees)
                .sort(([a], [b]) => (a === "FREE" ? -1 : b === "FREE" ? 1 : 0))
                .map(([method, guarantees]) => (
                  <div key={method}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{groupLabels[method] || method} ({guarantees.length})</p>
                    <div className="space-y-1">
                      {guarantees.map((g) => {
                        const idx = guaranteeChecks.findIndex((c) => c.guaranteeId === g.id);
                        const checked = idx >= 0 ? guaranteeChecks[idx].isIncluded : false;
                        return (
                          <label key={g.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "bg-card border-primary/30" : "bg-muted/30"}`}>
                            <Checkbox checked={checked} onCheckedChange={() => idx >= 0 && toggleCheck(idx)} />
                            <span className="text-sm flex-1">{g.name}</span>
                            <CalcBadge method={g.calcMethod} />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setGuaranteeDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveGuarantees} disabled={savingGuarantees} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
              {savingGuarantees && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}