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
  Check,
  ChevronsUpDown,
  Search,
  X,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
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
}

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

  // Dropdown state for guarantee selection
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [guaranteeSearch, setGuaranteeSearch] = useState("");

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
              className="hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-base truncate">
                            {offer.name}
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs break-words">{offer.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-muted-foreground truncate">
                      {offer.category?.name || "Non catégorisé"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
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

            {/* Guarantee selection — dropdown with search */}
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
                <div className="relative">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setPopoverOpen(!popoverOpen);
                      setGuaranteeSearch("");
                    }}
                    className="w-full justify-between h-auto min-h-10 py-2"
                  >
                    <span className="text-left truncate">
                      {form.selectedGuarantees.length === 0
                        ? "Sélectionner des garanties…"
                        : `${form.selectedGuarantees.length} garantie${form.selectedGuarantees.length > 1 ? "s" : ""} sélectionnée${form.selectedGuarantees.length > 1 ? "s" : ""}`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {popoverOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          setPopoverOpen(false);
                          setGuaranteeSearch("");
                        }}
                      />
                      <div className="absolute z-50 left-0 right-0 mt-1 rounded-md border bg-popover shadow-md flex flex-col" style={{ maxHeight: '320px' }}>
                        {/* Barre de recherche */}
                        <div className="relative border-b shrink-0">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="Rechercher une garantie…"
                            value={guaranteeSearch}
                            onChange={(e) => setGuaranteeSearch(e.target.value)}
                            className="border-0 pl-9 h-10 text-sm focus-visible:ring-0 rounded-none"
                            autoFocus
                          />
                          {guaranteeSearch && (
                            <button
                              onClick={() => setGuaranteeSearch("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {/* Liste filtrée */}
                        <div className="overflow-y-auto flex-1 p-1">
                          {(() => {
                            // Filtrer toutes les garanties
                            const q = guaranteeSearch.toLowerCase().trim();
                            const filteredEntries = Object.entries(groupedCoverages)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([cat, covs]) => [
                                cat,
                                q
                                  ? covs.filter((c) =>
                                      c.name.toLowerCase().includes(q) ||
                                      c.code.toLowerCase().includes(q) ||
                                      cat.toLowerCase().includes(q)
                                    )
                                  : covs,
                              ] as [string, CoverageMini[]])
                              .filter(([, covs]) => covs.length > 0);

                            if (filteredEntries.length === 0) {
                              return (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                  Aucune garantie trouvée.
                                </div>
                              );
                            }

                            return filteredEntries.map(([cat, covs]) => (
                              <div key={cat} className="mb-2">
                                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {cat}
                                </p>
                                {covs.map((c) => {
                                  const isSelected = form.selectedGuarantees.includes(c.name);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-left hover:bg-accent transition-colors ${
                                        isSelected ? "bg-accent/50" : ""
                                      }`}
                                      onClick={() => {
                                        setForm((f) => ({
                                          ...f,
                                          selectedGuarantees: isSelected
                                            ? f.selectedGuarantees.filter((n) => n !== c.name)
                                            : [...f.selectedGuarantees, c.name],
                                        }));
                                      }}
                                    >
                                      <div className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors shrink-0 ${
                                        isSelected
                                          ? "bg-[#B9E54D] text-black border-[#B9E54D]"
                                          : "border-muted-foreground/30"
                                      }`}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <span className="flex-1 truncate">{c.name}</span>
                                      {c.isMandatory && (
                                        <Badge
                                          variant="default"
                                          className="text-[10px] px-1.5 py-0 bg-[#B9E54D] text-black hover:bg-[#a5d044] shrink-0"
                                        >
                                          Obligatoire
                                        </Badge>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

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