"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Car,
  Plus,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  priceMin: number | null;
  priceMax: number | null;
  coverageAmount: number | null;
  deductible: number;
  contractType: string | null;
  features: string[];
  isActive: boolean;
  category: { id: string; name: string; icon: string | null } | null;
  createdAt: string;
  // Vehicle eligibility fields (optional, from DB)
  fiscalPowerMin?: number | null;
  fiscalPowerMax?: number | null;
  fuelTypes?: string;
  newValueMin?: number | null;
  newValueMax?: number | null;
  venalValueMin?: number | null;
  venalValueMax?: number | null;
  vehicleUsage?: string;
}

interface CoverageMini {
  id: string;
  code: string;
  name: string;
  type: string;
  calculationType: string;
  isMandatory: boolean;
  isActive: boolean;
  category: { id: string; name: string; code: string } | null;
}

interface OfferFormData {
  name: string;
  categoryId: string;
  description: string;
  priceMin: string;
  priceMax: string;
  coverageAmount: string;
  deductible: string;
  contractType: string;
  selectedGuarantees: string[]; // coverage names
  isActive: boolean;
  // Vehicle eligibility
  fiscalPowerMin: string;
  fiscalPowerMax: string;
  fuelTypes: string[];
  newValueMin: string;
  newValueMax: string;
  venalValueMin: string;
  venalValueMax: string;
  vehicleUsage: string[];
}

const FUEL_OPTIONS = ["Essence", "Diesel", "Hybride", "Électrique"];
const USAGE_OPTIONS = ["Personnel", "Professionnel", "Taxi/VTC", "Autre"];

const safeJsonParse = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
};

const emptyForm: OfferFormData = {
  name: "",
  categoryId: "",
  description: "",
  priceMin: "",
  priceMax: "",
  coverageAmount: "",
  deductible: "0",
  contractType: "",
  selectedGuarantees: [],
  isActive: true,
  // Vehicle eligibility
  fiscalPowerMin: "",
  fiscalPowerMax: "",
  fuelTypes: [],
  newValueMin: "",
  newValueMax: "",
  venalValueMin: "",
  venalValueMax: "",
  vehicleUsage: [],
};

const contractTypeLabels: Record<string, string> = {
  basic: "Tiers simple",
  third_party_plus: "Tiers étendu",
  all_risks: "Tous risques",
};

const formatPrice = (amount: number | null) =>
  amount != null
    ? new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
    : "—";

export function InsurerOffersTab() {
  const { user } = useAppStore();
  const { toast } = useToast();

  const [insurerId, setInsurerId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Coverages for guarantee selection
  const [formCoverages, setFormCoverages] = useState<CoverageMini[]>([]);
  const [formCoveragesLoading, setFormCoveragesLoading] = useState(false);

  /* ── Fetch helpers ── */
  const fetchInsurer = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/insurer/account?userId=${userId}`);
      if (!res.ok) throw new Error("Compte assureur non trouvé");
      const data = await res.json();
      setInsurerId(data.id);
      return data.id;
    } catch {
      setError("Impossible de charger votre compte assureur");
      return null;
    }
  }, []);

  const fetchOffers = useCallback(async (iid: string) => {
    try {
      const res = await fetch(`/api/insurer/offers?insurerId=${iid}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOffers(data.offers || []);
    } catch {
      setError("Erreur lors du chargement des offres");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insurance-categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!insurerId) return;
    await fetchOffers(insurerId);
  }, [insurerId, fetchOffers]);

  /* ── Init ── */
  useEffect(() => {
    if (!user.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const iid = await fetchInsurer(user.id!);
      if (iid) await fetchOffers(iid);
      await fetchCategories();
      setLoading(false);
    })();
  }, [user.id]);

  /* ── Fetch coverages when insurerId is known (for guarantee selection) ── */
  useEffect(() => {
    if (!insurerId) {
      setFormCoverages([]);
      return;
    }
    setFormCoveragesLoading(true);
    fetch(`/api/insurer/coverages?insurerId=${insurerId}`)
      .then((r) => {
        if (r.ok) return r.json();
        return { coverages: [] };
      })
      .then((data) => setFormCoverages(data.coverages || []))
      .catch(() => setFormCoverages([]))
      .finally(() => setFormCoveragesLoading(false));
  }, [insurerId]);

  /* ── Form helpers ── */
  const openCreate = () => {
    setEditingOffer(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({
      name: offer.name,
      categoryId: offer.category?.id || "",
      description: offer.description || "",
      priceMin: offer.priceMin != null ? String(offer.priceMin) : "",
      priceMax: offer.priceMax != null ? String(offer.priceMax) : "",
      coverageAmount:
        offer.coverageAmount != null ? String(offer.coverageAmount) : "",
      deductible: String(offer.deductible),
      contractType: offer.contractType || "",
      selectedGuarantees: Array.isArray(offer.features) ? offer.features : safeJsonParse(offer.features),
      isActive: offer.isActive,
      // Vehicle eligibility
      fiscalPowerMin: offer.fiscalPowerMin != null ? String(offer.fiscalPowerMin) : "",
      fiscalPowerMax: offer.fiscalPowerMax != null ? String(offer.fiscalPowerMax) : "",
      fuelTypes: safeJsonParse(offer.fuelTypes),
      newValueMin: offer.newValueMin != null ? String(offer.newValueMin) : "",
      newValueMax: offer.newValueMax != null ? String(offer.newValueMax) : "",
      venalValueMin: offer.venalValueMin != null ? String(offer.venalValueMin) : "",
      venalValueMax: offer.venalValueMax != null ? String(offer.venalValueMax) : "",
      vehicleUsage: safeJsonParse(offer.vehicleUsage),
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
      priceMin: form.priceMin ? Number(form.priceMin) : null,
      priceMax: form.priceMax ? Number(form.priceMax) : null,
      coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : null,
      deductible: form.deductible ? Number(form.deductible) : 0,
      contractType: form.contractType || null,
      features: form.selectedGuarantees,
      isActive: form.isActive,
      // Vehicle eligibility
      fiscalPowerMin: form.fiscalPowerMin ? Number(form.fiscalPowerMin) : null,
      fiscalPowerMax: form.fiscalPowerMax ? Number(form.fiscalPowerMax) : null,
      fuelTypes: JSON.stringify(form.fuelTypes),
      newValueMin: form.newValueMin ? Number(form.newValueMin) : null,
      newValueMax: form.newValueMax ? Number(form.newValueMax) : null,
      venalValueMin: form.venalValueMin ? Number(form.venalValueMin) : null,
      venalValueMax: form.venalValueMax ? Number(form.venalValueMax) : null,
      vehicleUsage: JSON.stringify(form.vehicleUsage),
    };

    try {
      const url = editingOffer
        ? `/api/insurer/offers/${editingOffer.id}`
        : "/api/insurer/offers";
      const method = editingOffer ? "PUT" : "POST";

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
        title: editingOffer
          ? "Offre mise à jour avec succès"
          : "Offre créée avec succès",
        description: editingOffer
          ? `"${form.name}" a été modifiée.`
          : `"${form.name}" a été ajoutée à vos offres.`,
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
      const res = await fetch(`/api/insurer/offers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({
        title: "Offre supprimée",
        description: `"${deleteTarget.name}" a été désactivée.`,
      });
      setDeleteTarget(null);
      await refreshData();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'offre",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleGuarantee = (coverageName: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    setForm((f) => ({
      ...f,
      selectedGuarantees: checked
        ? [...f.selectedGuarantees, coverageName]
        : f.selectedGuarantees.filter((n) => n !== coverageName),
    }));
  };

  const toggleFuelType = (fuel: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    setForm((f) => ({
      ...f,
      fuelTypes: checked
        ? [...f.fuelTypes, fuel]
        : f.fuelTypes.filter((t) => t !== fuel),
    }));
  };

  const toggleVehicleUsage = (usage: string, checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;
    setForm((f) => ({
      ...f,
      vehicleUsage: checked
        ? [...f.vehicleUsage, usage]
        : f.vehicleUsage.filter((u) => u !== usage),
    }));
  };

  /* ── Group coverages by category for display ── */
  const groupedCoverages = formCoverages.reduce<
    Record<string, CoverageMini[]>
  >((acc, c) => {
    const key = c.category?.name || "Autre";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes Offres</h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos offres d&apos;assurance disponibles sur NOLI.
          </p>
        </div>
        <Button
          className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
          onClick={openCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Créer une offre
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && offers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Car className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Aucune offre trouvée</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Vous n&apos;avez pas encore d&apos;offres d&apos;assurance.
            Cliquez sur &quot;Créer une offre&quot; pour commencer.
          </p>
        </div>
      )}

      {/* Offers grid */}
      {!loading && !error && offers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-base truncate">
                      {offer.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {offer.category?.name || "Non catégorisé"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {offer.isActive ? (
                      <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Price range */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">
                    {formatPrice(offer.priceMin)}
                  </span>
                  {offer.priceMax &&
                    offer.priceMax !== offer.priceMin && (
                      <span className="text-sm text-muted-foreground">
                        — {formatPrice(offer.priceMax)}
                      </span>
                    )}
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  {offer.contractType && (
                    <Badge variant="outline" className="text-xs">
                      {contractTypeLabels[offer.contractType] ||
                        offer.contractType}
                    </Badge>
                  )}
                  {offer.coverageAmount && (
                    <Badge variant="secondary" className="text-xs">
                      Capital : {formatPrice(offer.coverageAmount)}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {offer.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {offer.description}
                  </p>
                )}

                {/* Features / Guarantees */}
                {offer.features.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Garanties
                    </p>
                    <TooltipProvider>
                      <ul className="space-y-1">
                        {offer.features.slice(0, 4).map((f, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-center gap-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#B9E54D] shrink-0" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate">{f}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{f}</p>
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        ))}
                        {offer.features.length > 4 && (
                          <li className="text-xs text-muted-foreground pl-3.5">
                            +{offer.features.length - 4} autre(s)...
                          </li>
                        )}
                      </ul>
                    </TooltipProvider>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => openEdit(offer)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(offer)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? "Modifier l'offre" : "Nouvelle offre"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer
                ? "Modifiez les informations de votre offre."
                : "Remplissez les informations pour créer une nouvelle offre."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="offer-name">Nom de l&apos;offre *</Label>
              <Input
                className="w-full"
                id="offer-name"
                placeholder="Ex: Assurance Auto Premium"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Catégorie de produit</Label>
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

            {/* Contract Type */}
            <div className="space-y-2">
              <Label>Type de contrat</Label>
              <Select
                value={form.contractType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, contractType: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Tiers Simple</SelectItem>
                  <SelectItem value="third_party_plus">Tiers+</SelectItem>
                  <SelectItem value="all_risks">Tous Risques</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="offer-desc">Description</Label>
              <Textarea
                className="w-full"
                id="offer-desc"
                placeholder="Description de l'offre..."
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Price fields */}
            <div className="w-full grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-min">Prix min (FCFA)</Label>
                <Input
                  className="w-full"
                  id="price-min"
                  type="number"
                  placeholder="0"
                  value={form.priceMin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceMin: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-max">Prix max (FCFA)</Label>
                <Input
                  className="w-full"
                  id="price-max"
                  type="number"
                  placeholder="0"
                  value={form.priceMax}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceMax: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverage-amount">Capital garanti (FCFA)</Label>
                <Input
                  className="w-full"
                  id="coverage-amount"
                  type="number"
                  placeholder="0"
                  value={form.coverageAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coverageAmount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductible">Franchise (FCFA)</Label>
                <Input
                  className="w-full"
                  id="deductible"
                  type="number"
                  placeholder="0"
                  value={form.deductible}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deductible: e.target.value }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Guarantee selection (like admin) */}
            <div className="space-y-2">
              <Label>Garanties</Label>
              {formCoveragesLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!formCoveragesLoading &&
                insurerId &&
                formCoverages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune garantie configurée. Créez d&apos;abord des
                    garanties dans l&apos;onglet &quot;Mes Garanties&quot;.
                  </p>
                )}
              {!formCoveragesLoading && formCoverages.length > 0 && (
                <div className="border rounded-lg max-h-64 overflow-y-auto p-3 space-y-3">
                  {Object.entries(groupedCoverages)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cat, covs]) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          {cat}
                        </p>
                        <div className="space-y-1.5">
                          {covs.map((c) => (
                            <div key={c.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`cov-${c.id}`}
                                checked={form.selectedGuarantees.includes(
                                  c.name
                                )}
                                onCheckedChange={(checked) =>
                                  toggleGuarantee(c.name, checked)
                                }
                              />
                              <Label
                                htmlFor={`cov-${c.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {c.name}
                              </Label>
                              {c.isMandatory && (
                                <Badge
                                  variant="default"
                                  className="text-[10px] px-1.5 py-0 bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                                >
                                  Obligatoire
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Vehicle Eligibility Accordion */}
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="vehicle-eligibility" className="border rounded-lg px-4">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <span className="font-semibold text-sm">Éligibilité Véhicule</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0 space-y-4">
                  <p className="text-xs text-muted-foreground">Définissez les critères d&apos;éligibilité des véhicules pour cette offre. Laissez vide pour accepter tous les véhicules.</p>

                  {/* Puissance fiscale */}
                  <div className="w-full grid gap-2">
                    <Label>Puissance fiscale (CV)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          className="w-full"
                          type="number"
                          placeholder="Min"
                          value={form.fiscalPowerMin}
                          onChange={(e) => setForm((f) => ({ ...f, fiscalPowerMin: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          className="w-full"
                          type="number"
                          placeholder="Max"
                          value={form.fiscalPowerMax}
                          onChange={(e) => setForm((f) => ({ ...f, fiscalPowerMax: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Carburant */}
                  <div className="w-full grid gap-2">
                    <Label>Carburant</Label>
                    <div className="flex flex-wrap gap-3">
                      {FUEL_OPTIONS.map((fuel) => (
                        <div key={fuel} className="flex items-center gap-2">
                          <Checkbox
                            id={`fuel-${fuel}`}
                            checked={form.fuelTypes.includes(fuel)}
                            onCheckedChange={(checked) => toggleFuelType(fuel, checked)}
                          />
                          <Label htmlFor={`fuel-${fuel}`} className="text-sm font-normal cursor-pointer">{fuel}</Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Laissez vide pour accepter tous les types de carburant.</p>
                  </div>

                  {/* Valeur à neuf */}
                  <div className="w-full grid gap-2">
                    <Label>Valeur à neuf (FCFA)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          className="w-full"
                          type="number"
                          placeholder="0"
                          value={form.newValueMin}
                          onChange={(e) => setForm((f) => ({ ...f, newValueMin: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          className="w-full"
                          type="number"
                          placeholder="0"
                          value={form.newValueMax}
                          onChange={(e) => setForm((f) => ({ ...f, newValueMax: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Valeur vénale */}
                  <div className="w-full grid gap-2">
                    <Label>Valeur vénale (FCFA)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          className="w-full"
                          type="number"
                          placeholder="0"
                          value={form.venalValueMin}
                          onChange={(e) => setForm((f) => ({ ...f, venalValueMin: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          className="w-full"
                          type="number"
                          placeholder="0"
                          value={form.venalValueMax}
                          onChange={(e) => setForm((f) => ({ ...f, venalValueMax: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="w-full grid gap-2">
                    <Label>Usage</Label>
                    <div className="flex flex-wrap gap-3">
                      {USAGE_OPTIONS.map((usage) => (
                        <div key={usage} className="flex items-center gap-2">
                          <Checkbox
                            id={`usage-${usage}`}
                            checked={form.vehicleUsage.includes(usage)}
                            onCheckedChange={(checked) => toggleVehicleUsage(usage, checked)}
                          />
                          <Label htmlFor={`usage-${usage}`} className="text-sm font-normal cursor-pointer">{usage}</Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Laissez vide pour accepter tous les usages.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Separator />

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="offer-active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: !!v }))
                }
              />
              <Label htmlFor="offer-active" className="cursor-pointer">
                Offre active
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
              disabled={submitting || !form.name.trim()}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOffer ? "Enregistrer" : "Créer l'offre"}
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
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;offre &quot;{deleteTarget?.name}&quot; sera désactivée.
              Elle ne sera plus visible par les utilisateurs.
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