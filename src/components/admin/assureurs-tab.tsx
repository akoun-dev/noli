"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, MoreHorizontal, Eye, Pencil, Trash2, Building2, FileText, Shield, Users, Mail, Phone, Globe, Upload, X, Loader2 } from "lucide-react";

interface Insurer {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
  _count: { offers: number; coverages: number; accounts: number };
}

interface InsurerDetail extends Omit<Insurer, "_count"> {
  offers: { id: string; name: string; contractType: string | null; isActive: boolean }[];
  coverages: { id: string; code: string; name: string; type: string; calculationType: string; isActive: boolean; category: { id: string; name: string; code: string } | null }[];
  accounts: { id: string; profile: { id: string; firstName: string | null; lastName: string | null; email: string } }[];
}

type FormData = {
  name: string;
  logoUrl: string;
  contactEmail: string;
  phone: string;
  website: string;
  isActive: boolean;
};

const emptyForm: FormData = { name: "", logoUrl: "", contactEmail: "", phone: "", website: "", isActive: true };

export function AssureursTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Insurer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<InsurerDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/insurers?${params}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les assureurs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "logos");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm((f) => ({ ...f, logoUrl: data.url }));
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger le logo", variant: "destructive" });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const openEdit = (item: Insurer) => {
    setEditing(item);
    setForm({ name: item.name, logoUrl: item.logoUrl ?? "", contactEmail: item.contactEmail ?? "", phone: item.phone ?? "", website: item.website ?? "", isActive: item.isActive });
    setDialogOpen(true);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/insurers/${id}`);
      if (!res.ok) throw new Error();
      setDetailItem(await res.json());
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les détails", variant: "destructive" });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Erreur", description: "Le nom est requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/insurers/${editing.id}` : "/api/admin/insurers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      toast({ title: editing ? "Assureur modifié" : "Assureur créé", description: editing ? "Les modifications ont été enregistrées" : "L'assureur a été ajouté avec succès" });
      setDialogOpen(false);
      fetchItems();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur lors de l'enregistrement", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/insurers/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Assureur supprimé", description: "L'assureur a été supprimé avec succès" });
      setDeleteId(null);
      fetchItems();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer l'assureur", variant: "destructive" });
    }
  };

  const toggleActive = async (item: Insurer) => {
    try {
      const res = await fetch(`/api/admin/insurers/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) });
      if (!res.ok) throw new Error();
      fetchItems();
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier le statut", variant: "destructive" });
    }
  };

  const detailStatCards = [
    { label: "Offres", value: detailItem?.offers.length ?? 0, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Garanties", value: detailItem?.coverages.length ?? 0, icon: Shield, color: "text-orange-600 bg-orange-50" },
    { label: "Comptes", value: detailItem?.accounts.length ?? 0, icon: Users, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Assureurs</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setLoading(true); }} className="pl-9 w-56" />
          </div>
          <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Ajouter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">Aucun assureur trouvé</CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-center">Offres</TableHead>
                  <TableHead className="text-center">Garanties</TableHead>
                  <TableHead className="text-center">Comptes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.logoUrl ? (
                          <img src={item.logoUrl} alt="" className="h-7 w-7 rounded object-contain bg-muted p-0.5" />
                        ) : (
                          <div className="h-7 w-7 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.contactEmail ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.phone ?? "—"}</TableCell>
                    <TableCell className="text-center">{item._count.offers}</TableCell>
                    <TableCell className="text-center">{item._count.coverages}</TableCell>
                    <TableCell className="text-center">{item._count.accounts}</TableCell>
                    <TableCell><Switch checked={item.isActive} onCheckedChange={() => toggleActive(item)} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(item.id)}><Eye className="h-4 w-4 mr-2" />Voir</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 mr-2" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="rounded-xl border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.logoUrl ? (
                        <img src={item.logoUrl} alt="" className="h-8 w-8 rounded object-contain bg-muted p-0.5" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-semibold">{item.name}</p>
                    </div>
                    <Switch checked={item.isActive} onCheckedChange={() => toggleActive(item)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-muted rounded-lg p-2"><p className="font-semibold">{item._count.offers}</p><p className="text-muted-foreground">Offres</p></div>
                    <div className="bg-muted rounded-lg p-2"><p className="font-semibold">{item._count.coverages}</p><p className="text-muted-foreground">Garanties</p></div>
                    <div className="bg-muted rounded-lg p-2"><p className="font-semibold">{item._count.accounts}</p><p className="text-muted-foreground">Comptes</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(item.id)}><Eye className="h-3 w-3 mr-1" />Voir</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}><Pencil className="h-3 w-3 mr-1" />Modifier</Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteId(item.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'assureur" : "Nouvel assureur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo de l'assureur</Label>
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <div className="relative group">
                    <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                      <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploadingLogo ? "Téléchargement..." : form.logoUrl ? "Changer le logo" : "Télécharger un logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP ou GIF — Max 2 Mo</p>
                </div>
              </div>
            </div>
            <div><Label htmlFor="name">Nom *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: NOLI Assurance" /></div>
            <div><Label htmlFor="contactEmail">Email</Label><Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div><Label htmlFor="phone">Téléphone</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="website">Site web</Label><Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button className="bg-[#B9E54D] text-black hover:bg-[#a5d044]" onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : detailItem ? (
                <>
                  {detailItem.logoUrl ? (
                    <img src={detailItem.logoUrl} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                  {detailItem.name}
                </>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-40" /></div>
          ) : detailItem ? (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Stats */}
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
                {/* Contact */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Contact</h3>
                  <div className="grid gap-2 text-sm">
                    {detailItem.contactEmail && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{detailItem.contactEmail}</div>}
                    {detailItem.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{detailItem.phone}</div>}
                    {detailItem.website && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" />{detailItem.website}</div>}
                    {!detailItem.contactEmail && !detailItem.phone && !detailItem.website && <p className="text-muted-foreground text-sm">Aucune information de contact</p>}
                  </div>
                </div>
                {/* Offers */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Offres ({detailItem.offers.length})</h3>
                  {detailItem.offers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune offre</p>
                  ) : (
                    <div className="space-y-1">
                      {detailItem.offers.map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <span className="text-sm">{o.name}</span>
                          <div className="flex items-center gap-2">
                            {o.contractType && <Badge variant="outline" className="text-xs">{o.contractType}</Badge>}
                            <Badge variant={o.isActive ? "default" : "secondary"} className="text-xs">{o.isActive ? "Actif" : "Inactif"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Coverages */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Garanties ({detailItem.coverages.length})</h3>
                  {detailItem.coverages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune garantie</p>
                  ) : (
                    <div className="space-y-1">
                      {detailItem.coverages.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{c.name}</span>
                            {c.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.category.name}</Badge>}
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${c.calculationType === "FREE" ? "bg-emerald-100 text-emerald-800" : c.calculationType === "FIXED_AMOUNT" ? "bg-blue-100 text-blue-800" : c.calculationType === "VARIABLE_BASED" ? "bg-orange-100 text-orange-800" : c.calculationType === "MATRIX_BASED" ? "bg-purple-100 text-purple-800" : ""}`}>{c.calculationType === "FREE" ? "Gratuit" : c.calculationType === "FIXED_AMOUNT" ? "Fixe" : c.calculationType === "VARIABLE_BASED" ? "Variable" : c.calculationType === "MATRIX_BASED" ? "Matrice" : c.calculationType}</span>
                          </div>
                          <Badge variant={c.isActive ? "default" : "secondary"} className="text-xs">{c.isActive ? "Actif" : "Inactif"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'assureur ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Toutes les données associées seront supprimées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}