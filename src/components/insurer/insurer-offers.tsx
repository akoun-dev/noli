"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, Eye, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";

interface Offer {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  deductible: number | null;
  contractType: string | null;
  isActive: boolean;
  status: string;
  features: string | null;
  quoteCount: number;
}

interface OffersResponse {
  offers: Offer[];
  total: number;
  page: number;
  limit: number;
}

function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function statusBadge(isActive: boolean) {
  return isActive
    ? <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20">Active</Badge>
    : <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
}

function parseFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ── Offer Detail Dialog ── */
function OfferDetailDialog({
  offer,
  open,
  onOpenChange,
}: {
  offer: Offer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!offer) return null;
  const features = parseFeatures(offer.features);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#B9E54D]" />
            {offer.name}
          </DialogTitle>
          <DialogDescription>
            {offer.category || "Sans catégorie"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Statut :</span>
            {statusBadge(offer.status)}
          </div>

          {/* Description */}
          {offer.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm leading-relaxed">{offer.description}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Prix min</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">{formatPrice(offer.minPrice)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Prix max</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">{formatPrice(offer.maxPrice)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Franchise</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">{formatPrice(offer.deductible)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Type de contrat</p>
              <p className="text-sm font-semibold mt-0.5">{offer.contractType || "—"}</p>
            </div>
          </div>

          {/* Quote count */}
          <div className="rounded-lg bg-[#B9E54D]/10 border border-[#B9E54D]/20 p-3">
            <p className="text-sm">
              <span className="font-semibold">{offer.quoteCount}</span> devis associé{offer.quoteCount > 1 ? "s" : ""}
            </p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Caractéristiques</p>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#B9E54D] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Offers Tab ── */
export function InsurerOffers() {
  const { user } = useAppStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchOffers = useCallback(() => {
    if (!user.id) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: "1",
      limit: "50",
      search,
      status: statusFilter,
    });
    fetch(`/api/insurer/offers?${params}`)
      .then((res) => res.json())
      .then((data: OffersResponse) => {
        const mapped = (data.offers || []).map((o: Record<string, unknown>) => ({
          id: o.id,
          name: o.name,
          description: o.description,
          category: typeof o.category === 'object' && o.category ? (o.category as Record<string, unknown>).name as string : (o.category as string | null),
          priceMin: o.priceMin as number | null,
          priceMax: o.priceMax as number | null,
          minPrice: o.priceMin as number | null,
          maxPrice: o.priceMax as number | null,
          deductible: o.deductible as number | null,
          contractType: o.contractType as string | null,
          isActive: o.isActive as boolean,
          status: o.isActive ? "active" : "inactive",
          features: o.features as string | null,
          quoteCount: (o._count as Record<string, Record<string, number>>)?.quotes ?? 0,
        }));
        setOffers(mapped as Offer[]);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOffers, 300);
    return () => clearTimeout(timer);
  }, [fetchOffers]);

  const handleOpenDetail = (offer: Offer) => {
    setSelectedOffer(offer);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Mes Offres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} offre{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une offre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Aucune offre trouvée
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix min</TableHead>
                  <TableHead className="text-right">Prix max</TableHead>
                  <TableHead className="text-right">Franchise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Devis</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow
                    key={offer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenDetail(offer)}
                  >
                    <TableCell className="font-medium">{offer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{offer.category || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPrice(offer.minPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPrice(offer.maxPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPrice(offer.deductible)}
                    </TableCell>
                    <TableCell className="text-sm">{offer.contractType || "—"}</TableCell>
                    <TableCell>{statusBadge(offer.status)}</TableCell>
                    <TableCell className="text-right tabular-nums">{offer.quoteCount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleOpenDetail(offer)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{offer.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {offer.category || "Sans catégorie"} · {offer.contractType || "—"}
                      </p>
                    </div>
                    {statusBadge(offer.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatPrice(offer.minPrice)} — {formatPrice(offer.maxPrice)}
                    </span>
                    <span className="tabular-nums font-medium">{offer.quoteCount} devis</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <OfferDetailDialog
        offer={selectedOffer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}