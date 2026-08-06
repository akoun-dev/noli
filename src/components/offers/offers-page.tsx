"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchX,
  SlidersHorizontal,
  Check,
  Building2,
  Shield,
  ArrowRight,
  Loader2,
  Star,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Types ────────────────────────────────────────────────────── */

interface OfferInsurer {
  id: string;
  name: string;
  logoUrl: string | null;
  code: string;
}

interface OfferCategory {
  id: string;
  name: string;
  icon: string | null;
}

interface Offer {
  id: string;
  name: string;
  description: string;
  priceMin: number;
  priceMax: number;
  coverageAmount: number;
  deductible: number;
  contractType: string;
  features: string[];
  insurer: OfferInsurer;
  category: OfferCategory;
}

interface OffersResponse {
  offers: Offer[];
  categories: OfferCategory[];
  insurers: OfferInsurer[];
  total: number;
}

/* ─── Constants ─────────────────────────────────────────────────── */

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  basic: "Tiers",
  third_party_plus: "Tiers+",
  all_risks: "Tous Risques",
  premium: "Premium",
  premium_plus: "Premium+",
};

const CONTRACT_TYPE_BADGE: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  third_party_plus: "bg-secondary text-secondary-foreground",
  all_risks: "bg-accent text-accent-foreground",
  premium: "bg-primary/15 text-primary border-primary/30",
  premium_plus: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-400/40",
};

const FORMAT = new Intl.NumberFormat("fr-FR");

function formatPrice(amount: number): string {
  return FORMAT.format(amount) + " FCFA";
}

/* ─── Skeleton Card ─────────────────────────────────────────────── */

function OfferCardSkeleton() {
  return (
    <Card className="rounded-xl border-0">
      <CardContent className="p-5 space-y-4">
        {/* Header: insurer */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Description */}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        {/* Price */}
        <div className="pt-2 space-y-1">
          <Skeleton className="h-7 w-48" />
        </div>
        {/* Features */}
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        {/* Button */}
        <Skeleton className="h-10 w-full rounded-full mt-3" />
      </CardContent>
    </Card>
  );
}

/* ─── Offer Card ────────────────────────────────────────────────── */

function OfferCard({
  offer,
  onDemandQuote,
}: {
  offer: Offer;
  onDemandQuote: (offer: Offer) => void;
}) {
  const badgeClass =
    CONTRACT_TYPE_BADGE[offer.contractType] || "bg-muted text-muted-foreground";
  const contractLabel =
    CONTRACT_TYPE_LABELS[offer.contractType] || offer.contractType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="transition-shadow duration-300 hover:shadow-[var(--hover-shadow)]"
    >
      <Card className="rounded-xl border-0 bg-card card-shadow overflow-hidden">
        <CardContent className="p-5 flex flex-col gap-4">
          {/* ── Header: insurer ─────────────────────────────── */}
          <div className="flex items-center gap-3">
            {offer.insurer.logoUrl ? (
              <img
                src={offer.insurer.logoUrl}
                alt={offer.insurer.name}
                className="h-10 w-10 rounded-full object-cover bg-white p-0.5 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {offer.insurer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {offer.insurer.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {offer.category.name}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${badgeClass}`}
            >
              {contractLabel}
            </Badge>
          </div>

          {/* ── Offer name ──────────────────────────────────── */}
          <h3 className="text-base font-bold text-foreground leading-snug">
            {offer.name}
          </h3>

          {/* ── Description ─────────────────────────────────── */}
          {offer.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {offer.description}
            </p>
          )}

          {/* ── Price range ─────────────────────────────────── */}
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1">
              À partir de
            </p>
            <p className="text-xl font-extrabold text-primary">
              {offer.priceMin === offer.priceMax
                ? formatPrice(offer.priceMin)
                : `${formatPrice(offer.priceMin)} → ${formatPrice(offer.priceMax)}`}
            </p>
          </div>

          {/* ── Deductible & Coverage ───────────────────────── */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Franchise</span>
              <p className="font-semibold text-foreground">
                {formatPrice(offer.deductible)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Plafond couverture</span>
              <p className="font-semibold text-foreground">
                {formatPrice(offer.coverageAmount)}
              </p>
            </div>
          </div>

          {/* ── Features ────────────────────────────────────── */}
          {offer.features.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {offer.features.slice(0, 4).map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}

          {/* ── CTA ─────────────────────────────────────────── */}
          <Button
            onClick={() => onDemandQuote(offer)}
            className="w-full rounded-full bg-primary text-primary-foreground font-semibold mt-2 h-10 hover:opacity-90 transition-opacity"
          >
            Demander un devis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────── */

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="h-20 w-20 rounded-full bg-muted/40 flex items-center justify-center mb-6">
        <SearchX className="h-9 w-9 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Aucune offre trouvée
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Aucune offre ne correspond à vos critères de recherche. Essayez de
        modifier vos filtres pour voir plus de résultats.
      </p>
      <Button
        variant="outline"
        onClick={onClear}
        className="rounded-full font-medium"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Réinitialiser les filtres
      </Button>
    </motion.div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */

export function OffersPage() {
  const { resetComparison, setView, setSelectedOffer } = useAppStore();

  /* ── State ──────────────────────────────────────────────── */
  const [data, setData] = useState<OffersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter values
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [insurerFilter, setInsurerFilter] = useState<string>("all");
  const [contractTypeFilter, setContractTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price_asc");

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (insurerFilter !== "all") params.set("insurerId", insurerFilter);
      if (contractTypeFilter !== "all")
        params.set("contractType", contractTypeFilter);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/offers?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur serveur");
      const json: OffersResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, insurerFilter, contractTypeFilter, sortBy]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  /* ── Derived ────────────────────────────────────────────── */
  const offers = data?.offers ?? [];
  const categories = data?.categories ?? [];
  const insurers = data?.insurers ?? [];

  /* ── Handlers ───────────────────────────────────────────── */
  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setInsurerFilter("all");
    setContractTypeFilter("all");
    setSortBy("price_asc");
  }, []);

  const handleDemandQuote = useCallback(
    (offer: Offer) => {
      resetComparison();
      // Pre-select the offer in the store so comparison form can pick it up
      setSelectedOffer({
        id: offer.id,
        insurerId: offer.insurer.id,
        insurerName: offer.insurer.name,
        insurerLogo: offer.insurer.logoUrl,
        insurerRating: 0,
        name: offer.name,
        coverageType: offer.contractType,
        description: offer.description,
        monthlyPrice: offer.priceMin,
        annualPrice: offer.priceMax,
        contractDuration: 12,
        deductible: offer.deductible,
        maxCoverage: offer.coverageAmount,
        features: offer.features,
        conditions: null,
      });
      setView("compare");
    },
    [resetComparison, setSelectedOffer, setView]
  );

  const hasActiveFilters =
    categoryFilter !== "all" ||
    insurerFilter !== "all" ||
    contractTypeFilter !== "all";

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Hero Banner ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-60 w-60 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-foreground/15 rounded-full px-4 py-1.5 mb-5">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-primary-foreground/90">
                Catalogue complet
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-foreground tracking-tight leading-tight">
              Nos offres d&apos;assurance
            </h1>
            <p className="mt-4 text-sm sm:text-base text-primary-foreground/75 max-w-xl mx-auto leading-relaxed">
              Explorez les meilleures offres de nos assureurs partenaires
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Main Content ──────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* ── Filter Bar ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card card-shadow rounded-xl p-4 sm:p-5 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Filtres</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Category filter */}
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-full rounded-lg text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Toutes catégories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Insurer filter */}
            <Select
              value={insurerFilter}
              onValueChange={setInsurerFilter}
            >
              <SelectTrigger className="w-full rounded-lg text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tous les assureurs" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les assureurs</SelectItem>
                {insurers.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Contract type filter */}
            <Select
              value={contractTypeFilter}
              onValueChange={setContractTypeFilter}
            >
              <SelectTrigger className="w-full rounded-lg text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tous les contrats" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les contrats</SelectItem>
                <SelectItem value="basic">Tiers</SelectItem>
                <SelectItem value="third_party_plus">Tiers+</SelectItem>
                <SelectItem value="all_risks">Tous Risques</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="premium_plus">Premium+</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full rounded-lg text-sm">
                <div className="flex items-center gap-2 truncate">
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Trier par" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="name_asc">Nom A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Chargement…
                </span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{offers.length}</span>{" "}
                  offre{offers.length !== 1 ? "s" : ""} trouvée
                  {offers.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
        </motion.div>

        {/* ── Error State ──────────────────────────────────── */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              onClick={fetchOffers}
              className="mt-4 rounded-full"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* ── Loading Skeletons ────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Empty State ──────────────────────────────────── */}
        {!loading && !error && offers.length === 0 && (
          <EmptyState onClear={clearFilters} />
        )}

        {/* ── Offers Grid ──────────────────────────────────── */}
        {!loading && !error && offers.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${categoryFilter}-${insurerFilter}-${contractTypeFilter}-${sortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onDemandQuote={handleDemandQuote}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}