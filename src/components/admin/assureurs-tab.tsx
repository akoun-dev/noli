"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Search, Loader2, ShieldCheck, Star, MoreHorizontal, Eye, Phone, Mail, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ────────────────────────────────────────────────────────
interface Insurer {
  id: string; name: string; logo: string | null; description: string | null;
  phone: string | null; email: string | null; website: string | null;
  rating: number; isVerified: boolean; isActive: boolean;
  createdAt: string; _count: { offers: number; guaranteeLinks: number };
}

interface InsurerFull extends Omit<Insurer, "_count"> {
  guaranteeLinks: { id: string; insurerId: string; guaranteeId: string; isEnabled: boolean; customRate: number | null; customPrice: number | null; guarantee: GuaranteeMini }[];
  offers: { id: string; name: string; coverageType: string; basePrice: number; isActive: boolean }[];
}

interface GuaranteeMini {
  id: string; name: string; calcMethod: string; fixedPrice: number | null; rate: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

const emptyInsurer = {
  name: "", logo: "", description: "", phone: "", email: "", website: "",
  rating: 0, isVerified: false, isActive: true,
};

const coverageLabels: Record<string, string> = { tiers: "Tiers", tiers_plus: "Tiers+", tous_risques: "Tous Risques" };

// ── Calc method badge ────────────────────────────────────────────
function CalcBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    FREE: "bg-emerald-100 text-emerald-800",
    FIXED_AMOUNT: "bg-blue-100 text-blue-800",
    VARIABLE_BASED: "bg-orange-100 text-orange-800",
    MATRIX_BASED: "bg-purple-100 text-purple-800",
  };
  const labels: Record<string, string> = {
    FREE: "Gratuit", FIXED_AMOUNT: "Montant fixe", VARIABLE_BASED: "Taux variable", MATRIX_BASED: "Matrice",
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[method] || "bg-gray-100"}`}>{labels[method] || method}</span>;
}

// ── Main component ───────────────────────────────────────────────
export function AssureursTab() {
  const { toast } = useToast();
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [form, setForm] = useState(emptyInsurer);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Guarantee management
  const [guaranteeDialogOpen, setGuaranteeDialogOpen] = useState(false);
  const [selectedInsurer, setSelectedInsurer] = useState<InsurerFull | null>(null);
  const [allGuarantees, setAllGuarantees] = useState<GuaranteeMini[]>([]);
  const [guaranteeLinks, setGuaranteeLinks] = useState<{ guaranteeId: string; isEnabled: boolean; customRate: string; customPrice: string }[]>([]);
  const [savingGuarantees, setSavingGuarantees] = useState(false);

  // Detail view
  const [detailInsurer, setDetailInsurer] = useState<InsurerFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchInsurers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insurers");
      if (res.ok) setInsurers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInsurers(); }, [fetchInsurers]);

  const filtered = insurers.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditing(null); setForm(emptyInsurer); setFormOpen(true); };
  const openEdit = (i: Insurer) => { setEditing(i); setForm({ name: i.name, logo: i.logo || "", description: i.description || "", phone: i.phone || "", email: i.email || "", website: i.website || "", rating: i.rating, isVerified: i.isVerified, isActive: i.isActive }); setFormOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Le nom est obligatoire", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/insurers/${editing.id}` : "/api/admin/insurers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erreur"); }
      toast({ title: editing ? "Assureur modifié" : "Assureur créé" });
      setFormOpen(false);
      fetchInsurers();
    } catch (err) { toast({ title: (err as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/insurers/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Assureur supprimé" });
      setDeleteId(null);
      fetchInsurers();
    } catch { toast({ title: "Erreur lors de la suppression", variant: "destructive" }); }
    finally { setDeleting(false); }
  };

  const handleToggleActive = async (i: Insurer) => {
    try {
      const res = await fetch(`/api/admin/insurers/${i.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...i, isActive: !i.isActive }) });
      if (res.ok) fetchInsurers();
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  // ── Detail view ────────────────────────────────────────────────
  const openDetail = async (i: Insurer) => {
    setDetailLoading(true);
    setDetailInsurer(null);
    try {
      const res = await fetch(`/api/admin/insurers/${i.id}`);
      if (res.ok) {
        setDetailInsurer(await res.json());
      } else throw new Error();
    } catch { toast({ title: "Erreur de chargement", variant: "destructive" }); }
    finally { setDetailLoading(false); }
  };

  // ── Guarantee management ───────────────────────────────────────
  const openGuaranteeDialog = async (insurer: Insurer) => {
    try {
      const [insurerRes, guaranteesRes] = await Promise.all([
        fetch(`/api/admin/insurers/${insurer.id}`),
        fetch("/api/admin/guarantees"),
      ]);
      if (!insurerRes.ok || !guaranteesRes.ok) throw new Error();
      const insurerFull: InsurerFull = await insurerRes.json();
      const guarantees: GuaranteeMini[] = await guaranteesRes.json();
      setSelectedInsurer(insurerFull);
      setAllGuarantees(guarantees);

      const linkMap = new Map(insurerFull.guaranteeLinks.map((l) => [l.guaranteeId, l]));
      const links = guarantees.map((g) => {
        const existing = linkMap.get(g.id);
        return {
          guaranteeId: g.id,
          isEnabled: existing?.isEnabled ?? false,
          customRate: existing?.customRate?.toString() ?? "",
          customPrice: existing?.customPrice?.toString() ?? "",
        };
      });
      setGuaranteeLinks(links);
      setGuaranteeDialogOpen(true);
    } catch { toast({ title: "Erreur de chargement", variant: "destructive" }); }
  };

  const toggleGuarantee = (idx: number) => {
    setGuaranteeLinks((prev) => prev.map((l, i) => i === idx ? { ...l, isEnabled: !l.isEnabled } : l));
  };

  const updateLink = (idx: number, field: "customRate" | "customPrice", value: string) => {
    setGuaranteeLinks((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const saveGuarantees = async () => {
    if (!selectedInsurer) return;
    setSavingGuarantees(true);
    try {
      const payload = guaranteeLinks.map((l) => ({
        guaranteeId: l.guaranteeId,
        isEnabled: l.isEnabled,
        customRate: l.customRate ? parseFloat(l.customRate) : null,
        customPrice: l.customPrice ? parseFloat(l.customPrice) : null,
      }));
      const res = await fetch(`/api/admin/insurers/${selectedInsurer.id}/guarantees`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guarantees: payload }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Garanties mises à jour" });
      setGuaranteeDialogOpen(false);
      fetchInsurers();
    } catch { toast({ title: "Erreur de sauvegarde", variant: "destructive" }); }
    finally { setSavingGuarantees(false); }
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Assureurs</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Note</TableHead>
              <TableHead className="text-center">Vérifié</TableHead>
              <TableHead className="text-center">Offres</TableHead>
              <TableHead className="text-center">Garanties</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.phone || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{i.email || "—"}</TableCell>
                <TableCell className="text-center"><div className="flex items-center justify-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-sm">{i.rating}</span></div></TableCell>
                <TableCell className="text-center">{i.isVerified ? <Badge className="bg-emerald-100 text-emerald-800">Oui</Badge> : <Badge variant="secondary">Non</Badge>}</TableCell>
                <TableCell className="text-center">{i._count.offers}</TableCell>
                <TableCell className="text-center">{i._count.guaranteeLinks}</TableCell>
                <TableCell className="text-center"><Switch checked={i.isActive} onCheckedChange={() => handleToggleActive(i)} /></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(i)}><Eye className="h-4 w-4 mr-2" /> Voir</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openGuaranteeDialog(i)}><ShieldCheck className="h-4 w-4 mr-2" /> Gérer les garanties</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(i)}><Pencil className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(i.id)}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Aucun assureur trouvé.</p>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((i) => (
          <Card key={i.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.phone || "—"}</p>
              </div>
              <Switch checked={i.isActive} onCheckedChange={() => handleToggleActive(i)} />
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-3">
              <Badge variant="outline">{i._count.offers} offres</Badge>
              <Badge variant="outline">{i._count.guaranteeLinks} garanties</Badge>
              {i.isVerified && <Badge className="bg-emerald-100 text-emerald-800">Vérifié</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(i)}><Eye className="h-3.5 w-3.5 mr-1" /> Voir</Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!detailInsurer || detailLoading} onOpenChange={() => setDetailInsurer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : detailInsurer ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl">{detailInsurer.name}</DialogTitle>
                  {detailInsurer.isVerified && (
                    <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Vérifié
                    </Badge>
                  )}
                  <div className="flex items-center gap-0.5 ml-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-sm">{detailInsurer.rating}</span>
                  </div>
                </div>
                <DialogDescription>{detailInsurer.description || "Aucune description"}</DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[65vh] pr-2">
                <div className="space-y-6 pb-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{detailInsurer.offers.length}</p><p className="text-xs text-muted-foreground">Offres</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{detailInsurer.guaranteeLinks.length}</p><p className="text-xs text-muted-foreground">Garanties liées</p></CardContent></Card>
                    <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{detailInsurer.offers.reduce((acc, o) => acc + 1, 0)}</p><p className="text-xs text-muted-foreground">Devis reçus</p></CardContent></Card>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{detailInsurer.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{detailInsurer.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{detailInsurer.website || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Offers */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Offres ({detailInsurer.offers.length})</h3>
                    {detailInsurer.offers.length > 0 ? (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Nom</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Prix</TableHead>
                              <TableHead className="text-center">Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailInsurer.offers.map((o) => (
                              <TableRow key={o.id}>
                                <TableCell className="font-medium text-sm">{o.name}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{coverageLabels[o.coverageType] || o.coverageType}</Badge></TableCell>
                                <TableCell className="text-sm font-mono">{fmtPrice(o.basePrice)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={o.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
                                    {o.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune offre.</p>
                    )}
                  </div>

                  <Separator />

                  {/* Guarantee links */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Garanties ({detailInsurer.guaranteeLinks.length})</h3>
                    {detailInsurer.guaranteeLinks.length > 0 ? (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Garantie</TableHead>
                              <TableHead>Méthode</TableHead>
                              <TableHead className="text-center">Activée</TableHead>
                              <TableHead className="text-right">Surcharge</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailInsurer.guaranteeLinks.map((gl) => (
                              <TableRow key={gl.id}>
                                <TableCell className="font-medium text-sm">{gl.guarantee.name}</TableCell>
                                <TableCell><CalcBadge method={gl.guarantee.calcMethod} /></TableCell>
                                <TableCell className="text-center">
                                  <Badge className={gl.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
                                    {gl.isEnabled ? "Oui" : "Non"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {gl.customPrice ? fmtPrice(gl.customPrice) : gl.customRate ? `${gl.customRate}%` : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune garantie liée.</p>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <Separator />
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDetailInsurer(null); const ins = insurers.find((x) => x.id === detailInsurer.id); if (ins) openEdit(ins); }}>
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
          <DialogHeader><DialogTitle>{editing ? "Modifier l'assureur" : "Nouvel assureur"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Logo (URL)</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Site web</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>Note : {form.rating}</Label>
              <Slider value={[form.rating]} min={0} max={5} step={0.1} onValueChange={([v]) => setForm({ ...form, rating: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Assureur vérifié</Label>
              <Switch checked={form.isVerified} onCheckedChange={(v) => setForm({ ...form, isVerified: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
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
          <AlertDialogHeader><AlertDialogTitle>Supprimer cet assureur ?</AlertDialogTitle><AlertDialogDescription>Cette action supprimera également toutes les offres, devis et liaisons associés.</AlertDialogDescription></AlertDialogHeader>
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
            <DialogTitle>Garanties de {selectedInsurer?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-2">
              {guaranteeLinks.map((link, idx) => {
                const g = allGuarantees.find((x) => x.id === link.guaranteeId);
                if (!g) return null;
                return (
                  <div key={g.id} className={`rounded-lg border p-3 transition-colors ${link.isEnabled ? "bg-card" : "bg-muted/30 opacity-60"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={link.isEnabled} onCheckedChange={() => toggleGuarantee(idx)} />
                        <span className="text-sm font-medium">{g.name}</span>
                      </div>
                      <CalcBadge method={g.calcMethod} />
                    </div>
                    {link.isEnabled && (g.calcMethod === "FIXED_AMOUNT" || g.calcMethod === "VARIABLE_BASED") && (
                      <div className="grid grid-cols-2 gap-2 ml-6 mt-1">
                        {g.calcMethod === "FIXED_AMOUNT" && (
                          <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Prix personnalisé (FCFA)</Label>
                            <Input type="number" placeholder={g.fixedPrice?.toString()} value={link.customPrice} onChange={(e) => updateLink(idx, "customPrice", e.target.value)} className="h-8 text-xs" />
                          </div>
                        )}
                        {g.calcMethod === "VARIABLE_BASED" && (
                          <div className="grid gap-1">
                            <Label className="text-xs text-muted-foreground">Taux personnalisé (%)</Label>
                            <Input type="number" step="0.01" placeholder={g.rate?.toString()} value={link.customRate} onChange={(e) => updateLink(idx, "customRate", e.target.value)} className="h-8 text-xs" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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