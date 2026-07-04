"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  Flame,
  Lock,
  Car,
  Eye,
  Scale,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface CoverageCategory {
  id: string;
  name: string;
  code: string;
}

interface Coverage {
  id: string;
  code: string;
  type: string;
  name: string;
  description: string | null;
  calculationType: string;
  isMandatory: boolean;
  isActive: boolean;
  displayOrder: number;
  category: { id: string; name: string; code: string } | null;
}

interface CoverageFormData {
  name: string;
  categoryId: string;
  description: string;
  calculationType: string;
  isMandatory: boolean;
}

const emptyForm: CoverageFormData = {
  name: "",
  categoryId: "",
  description: "",
  calculationType: "FIXED_AMOUNT",
  isMandatory: false,
};

const calcTypeLabels: Record<string, string> = {
  FREE: "Libre",
  FIXED_AMOUNT: "Montant fixe",
  VARIABLE_BASED: "Base variable",
  MATRIX_BASED: "Basé sur matrice",
};

/* ── Decorative info cards (kept from original) ── */
const guaranteeCategories = [
  {
    name: "Responsabilité Civile",
    description:
      "Couverture des dommages causés aux tiers. Obligatoire pour tous les véhicules.",
    icon: Scale,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    name: "Incendie",
    description:
      "Indemnisation en cas de destruction ou de dommages causés par un incendie.",
    icon: Flame,
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    name: "Vol",
    description:
      "Protection contre le vol, la tentative de vol et les actes de vandalisme.",
    icon: Lock,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    name: "Dommages tous accidents",
    description:
      "Prise en charge des dommages subis par le véhicule quel que soit le responsable.",
    icon: Car,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    name: "Bris de glace",
    description:
      "Réparation ou remplacement des vitrages, pare-brise et lunettes endommagés.",
    icon: Eye,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

export function InsurerGuaranteesTab() {
  const { user } = useAppStore();
  const { toast } = useToast();

  const [insurerId, setInsurerId] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [categories, setCategories] = useState<CoverageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coverage | null>(null);
  const [form, setForm] = useState<CoverageFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Coverage | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch helpers ── */
  const fetchInsurer = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/insurer/account?userId=${userId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInsurerId(data.id);
      return data.id;
    } catch {
      setError("Impossible de charger votre compte assureur");
      return null;
    }
  }, []);

  const fetchCoverages = useCallback(async (iid: string) => {
    try {
      const res = await fetch(`/api/insurer/coverages?insurerId=${iid}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoverages(data.coverages || []);
    } catch {
      setError("Erreur lors du chargement des garanties");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coverage-categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!insurerId) return;
    await fetchCoverages(insurerId);
  }, [insurerId, fetchCoverages]);

  /* ── Init ── */
  useEffect(() => {
    if (!user.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const iid = await fetchInsurer(user.id!);
      if (iid) await fetchCoverages(iid);
      await fetchCategories();
      setLoading(false);
    })();
  }, [user.id]);

  /* ── Form helpers ── */
  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: Coverage) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      categoryId: item.category?.id || "",
      description: item.description || "",
      calculationType: item.calculationType,
      isMandatory: item.isMandatory,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !insurerId) return;
    setSubmitting(true);

    const payload = {
      insurerId,
      categoryId: form.categoryId || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      calculationType: form.calculationType,
      isMandatory: form.isMandatory,
    };

    try {
      const url = editingItem
        ? `/api/insurer/coverages/${editingItem.id}`
        : "/api/insurer/coverages";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      toast({
        title: editingItem
          ? "Garantie mise à jour avec succès"
          : "Garantie créée avec succès",
        description: editingItem
          ? `"${form.name}" a été modifiée.`
          : `"${form.name}" a été ajoutée à vos garanties.`,
      });

      setDialogOpen(false);
      await refreshData();
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/insurer/coverages/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast({
        title: "Garantie supprimée",
        description: `"${deleteTarget.name}" a été désactivée.`,
      });
      setDeleteTarget(null);
      await refreshData();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la garantie",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes Garanties</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les garanties et couvertures proposées dans vos offres.
          </p>
        </div>
        <Button
          className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
          onClick={openCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une garantie
        </Button>
      </div>

      {/* Decorative info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {guaranteeCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${cat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {cat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Guarantees table */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold">Liste des garanties</h3>
          <p className="text-sm text-muted-foreground">
            Toutes vos garanties configurées
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <ShieldCheck className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : coverages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <ShieldCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                Aucune garantie configurée
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Cliquez sur &quot;Ajouter une garantie&quot; pour créer votre
                première garantie.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Catégorie
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Type de calcul
                  </TableHead>
                  <TableHead className="text-center">Obligatoire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverages.map((cov) => (
                  <TableRow key={cov.id}>
                    <TableCell className="font-mono text-xs">
                      {cov.code}
                    </TableCell>
                    <TableCell className="font-medium">{cov.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cov.category?.name || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {calcTypeLabels[cov.calculationType] ||
                        cov.calculationType}
                    </TableCell>
                    <TableCell className="text-center">
                      {cov.isMandatory ? (
                        <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Oui
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Non
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {cov.isActive ? (
                        <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(cov)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cov)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier la garantie" : "Nouvelle garantie"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Modifiez les informations de la garantie."
                : "Remplissez les informations pour créer une nouvelle garantie."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="cov-name">Nom *</Label>
              <Input
                className="w-full"
                id="cov-name"
                placeholder="Ex: Responsabilité Civile Automobile"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Catégorie de garantie</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoryId: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Calculation Type */}
            <div className="space-y-2">
              <Label>Type de calcul</Label>
              <Select
                value={form.calculationType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, calculationType: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Libre</SelectItem>
                  <SelectItem value="FIXED_AMOUNT">Montant fixe</SelectItem>
                  <SelectItem value="VARIABLE_BASED">
                    Base variable
                  </SelectItem>
                  <SelectItem value="MATRIX_BASED">
                    Basé sur matrice
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="cov-desc">Description</Label>
              <Textarea
                className="w-full"
                id="cov-desc"
                placeholder="Description de la garantie..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Mandatory */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="cov-mandatory"
                checked={form.isMandatory}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isMandatory: !!v }))
                }
              />
              <Label htmlFor="cov-mandatory" className="cursor-pointer">
                Garantie obligatoire
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
              onClick={handleSubmit}
              disabled={
                submitting || !form.name.trim()
              }
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? "Enregistrer" : "Créer la garantie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette garantie ?</AlertDialogTitle>
            <AlertDialogDescription>
              La garantie &quot;{deleteTarget?.name}&quot; ({deleteTarget?.code})
              sera désactivée. Elle ne sera plus disponible dans vos offres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}