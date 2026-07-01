"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Phone,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { InsurerOffer } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

/* ──────────────────────────── helpers ──────────────────────────── */

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

const COVERAGE_OPTIONS = ["Tous", "Tiers", "Tiers+", "Tous Risques"] as const;

const coverageBadgeStyle = (type: string) => {
  switch (type) {
    case "Tiers":
      return "bg-muted/60 text-muted-foreground border-border";
    case "Tiers+":
      return "bg-secondary/15 text-secondary border-secondary/25";
    case "Tous Risques":
      return "bg-accent/20 text-accent-foreground border-accent/35";
    default:
      return "bg-muted/60 text-muted-foreground border-border";
  }
};

/* ──────────────────────── sub-components ───────────────────────── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`size-3.5 ${
            i < Math.floor(rating)
              ? "text-accent"
              : i < rating
                ? "text-accent/50"
                : "text-muted/40"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
    </div>
  );
}

/* ──────── Sidebar Filters ──────── */

function FiltersSidebar({
  coverageFilter,
  setCoverageFilter,
  uncheckedInsurers,
  toggleInsurer,
  uniqueInsurers,
  budgetMax,
  setBudgetMax,
  onReset,
  totalOffers,
}: {
  coverageFilter: string;
  setCoverageFilter: (v: string) => void;
  uncheckedInsurers: Set<string>;
  toggleInsurer: (name: string) => void;
  onToggleAllInsurers: () => void;
  uniqueInsurers: string[];
  budgetMax: number;
  setBudgetMax: (v: number) => void;
  onReset: () => void;
  totalOffers: number;
}) {
  const allChecked = uncheckedInsurers.size === 0;

  return (
    <aside className="bg-muted/30 rounded-xl p-4 lg:p-5 space-y-6 lg:sticky lg:top-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wide text-primary">
            Filtres
          </h2>
          <span className="text-xs text-muted-foreground">({totalOffers})</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-secondary hover:text-primary font-medium transition-colors flex items-center gap-1"
        >
          <RotateCcw className="size-3" />
          Réinitialiser
        </button>
      </div>

      <Separator />

      {/* Formules */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Formules
        </h3>
        <div className="flex flex-wrap gap-2">
          {COVERAGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() =>
                setCoverageFilter(opt === "Tous" ? "all" : opt)
              }
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                (opt === "Tous" && coverageFilter === "all") ||
                coverageFilter === opt
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Assureurs */}
      {uniqueInsurers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-foreground">
            Assureurs
          </h3>
          <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={allChecked}
                onCheckedChange={() => onToggleAllInsurers()}
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                Tout sélectionner
              </span>
            </label>
            {uniqueInsurers.map((name) => {
              const isChecked = !uncheckedInsurers.has(name);
              return (
                <label
                  key={name}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleInsurer(name)}
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      {/* Budget mensuel */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Budget mensuel
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0 FCFA</span>
            <span className="font-semibold text-sm text-primary">
              {formatFCFA(budgetMax)}
            </span>
          </div>
          <Slider
            value={[budgetMax]}
            onValueChange={([v]) => setBudgetMax(v)}
            min={0}
            max={300000}
            step={5000}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground text-center">
            0 FCFA — {formatFCFA(budgetMax)}
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ──────── Offer Card ──────── */

function OfferCard({
  offer,
  priceMode,
  onViewDetails,
  onRequestQuote,
}: {
  offer: InsurerOffer;
  priceMode: "annual" | "monthly";
  onViewDetails: (offer: InsurerOffer) => void;
  onRequestQuote: (offer: InsurerOffer) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = offer.features.slice(0, 4);
  const hiddenFeatures = offer.features.slice(4);

  const mainPrice =
    priceMode === "annual" ? offer.annualPrice : offer.monthlyPrice;
  const secondaryPrice =
    priceMode === "annual" ? offer.monthlyPrice : offer.annualPrice;
  const mainLabel = priceMode === "annual" ? "/an" : "/mois";
  const secondaryLabel = priceMode === "annual" ? "/mois" : "/an";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="bg-card rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col gap-4 h-full">
        {/* Top section: Insurer name + coverage badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {offer.insurerName}
            </h3>
            <p className="text-sm text-muted-foreground">{offer.name}</p>
          </div>
          <Badge
            variant="outline"
            className={
              coverageBadgeStyle(offer.coverageType) +
              " rounded-full px-3 py-0.5 text-xs font-semibold shrink-0"
            }
          >
            {offer.coverageType}
          </Badge>
        </div>

        {/* Star rating */}
        <StarRating rating={offer.insurerRating} />

        <Separator />

        {/* Guarantees included */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Garanties incluses
          </h4>
          <ul className="space-y-1.5">
            {visibleFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>
          {hiddenFeatures.length > 0 && (
            <div className="mt-1.5">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-secondary hover:text-primary font-medium flex items-center gap-1 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="size-3.5" />
                    Voir moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" />
                    +{hiddenFeatures.length} de plus
                  </>
                )}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-1.5 mt-1.5"
                  >
                    {hiddenFeatures.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-foreground/90">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing section */}
        <div className="bg-primary/5 rounded-lg p-4 -mx-1">
          <p className="text-xs text-muted-foreground mb-1">À partir de</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary leading-tight">
            {formatFCFA(mainPrice)}
            <span className="text-sm font-normal text-muted-foreground">
              {mainLabel}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Soit{" "}
            <span className="font-medium text-foreground">
              {formatFCFA(secondaryPrice)}
            </span>{" "}
            {secondaryLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Franchise :{" "}
            <span className="font-medium text-foreground">
              {formatFCFA(offer.deductible)}
            </span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-auto pt-1">
          <Button
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-semibold shadow-sm"
            onClick={() => onRequestQuote(offer)}
          >
            <FileText className="size-4 mr-2" />
            Obtenir le devis
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full border-primary/30 text-primary hover:bg-primary/5 font-medium"
            onClick={() => onViewDetails(offer)}
          >
            <Phone className="size-4 mr-2" />
            Être rappelé
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────── Detail Dialog ──────── */

function OfferDetailDialog({
  offer,
  open,
  onClose,
  onRequestQuote,
}: {
  offer: InsurerOffer | null;
  open: boolean;
  onClose: () => void;
  onRequestQuote: (offer: InsurerOffer) => void;
}) {
  if (!offer) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">{offer.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {offer.insurerName} &middot; {offer.coverageType}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={
                coverageBadgeStyle(offer.coverageType) +
                " rounded-full px-3 py-0.5 text-xs font-semibold shrink-0"
              }
            >
              {offer.coverageType}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Rating */}
          <StarRating rating={offer.insurerRating} />

          {/* Pricing */}
          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground">À partir de</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatFCFA(offer.annualPrice)}
              </span>
              <span className="text-muted-foreground">/an</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium text-foreground">
                {formatFCFA(offer.monthlyPrice)}
              </span>
              <span className="text-muted-foreground">/mois</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Franchise :</span>
                <p className="font-medium">{formatFCFA(offer.deductible)}</p>
              </div>
              {offer.maxCoverage > 0 && (
                <div>
                  <span className="text-muted-foreground">
                    Couverture max :
                  </span>
                  <p className="font-medium">
                    {Math.round(offer.maxCoverage / 1_000_000)} M FCFA
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {offer.description && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {offer.description}
              </p>
            </div>
          )}

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Garanties incluses</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {offer.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conditions */}
          {offer.conditions && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Conditions</h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                {offer.conditions}
              </p>
            </div>
          )}

          {/* CTA */}
          <Button
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-semibold shadow-sm"
            onClick={() => {
              onRequestQuote(offer);
              onClose();
            }}
          >
            <FileText className="size-4 mr-2" />
            Obtenir le devis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────── Empty State (no results at all) ──────── */

function EmptyResultsState({ onGoBack }: { onGoBack: () => void }) {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="rounded-full bg-muted/40 p-6 mb-6">
        <SearchX className="size-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Aucune offre trouvée</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Aucune offre ne correspond à vos critères. Essayez de modifier vos
        paramètres de recherche.
      </p>
      <Button
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        onClick={onGoBack}
      >
        <ArrowLeft className="size-4 mr-2" />
        Modifier mes critères
      </Button>
    </section>
  );
}

/* ══════════════════════════ MAIN ══════════════════════════ */

export function ResultsPage() {
  const {
    comparisonResults,
    sortBy,
    setSortBy,
    selectedInsurerFilter,
    setSelectedInsurerFilter,
    selectedOffer,
    setSelectedOffer,
    setView,
    userQuotes,
    setUserQuotes,
    personalInfo,
    vehicleInfo,
    coverageNeeds,
  } = useAppStore();
  const { toast } = useToast();

  /* ── local filter state ── */
  // `uncheckedInsurers` is a blacklist: empty set = all insurers selected
  const [uncheckedInsurers, setUncheckedInsurers] = useState<Set<string>>(
    new Set()
  );
  const [coverageFilter, setCoverageFilter] = useState<string>("all");
  const [budgetMax, setBudgetMax] = useState<number>(300000);
  const [priceMode, setPriceMode] = useState<"annual" | "monthly">("annual");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ── derived data ── */
  const uniqueInsurers = useMemo(() => {
    const names = [...new Set(comparisonResults.map((o) => o.insurerName))];
    return names.sort();
  }, [comparisonResults]);

  // Compute effective checked insurers: all minus unchecked
  const effectiveChecked = useMemo(() => {
    const all = new Set(comparisonResults.map((o) => o.insurerName));
    for (const name of uncheckedInsurers) {
      all.delete(name);
    }
    return all;
  }, [comparisonResults, uncheckedInsurers]);

  const toggleInsurer = useCallback((name: string) => {
    setUncheckedInsurers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const filteredAndSorted = useMemo(() => {
    let results = [...comparisonResults];

    // Coverage filter
    if (coverageFilter !== "all") {
      results = results.filter((o) => o.coverageType === coverageFilter);
    }

    // Insurer filter: only show checked insurers
    if (effectiveChecked.size > 0) {
      results = results.filter((o) => effectiveChecked.has(o.insurerName));
    }

    // Budget filter (monthly price)
    results = results.filter((o) => o.monthlyPrice <= budgetMax);

    // Sort
    switch (sortBy) {
      case "price_asc":
        results.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        break;
      case "price_desc":
        results.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
        break;
      case "rating_desc":
        results.sort((a, b) => b.insurerRating - a.insurerRating);
        break;
      case "name_asc":
        results.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        break;
    }

    return results;
  }, [comparisonResults, sortBy, coverageFilter, effectiveChecked, budgetMax]);

  /* ── handlers ── */
  const handleRequestQuote = (offer: InsurerOffer) => {
    toast({
      title: "Devis enregistré",
      description: `Votre demande de devis pour ${offer.name} a été enregistrée.`,
    });

    const quote: import("@/types").QuoteRecord = {
      id: crypto.randomUUID(),
      reference: `DEV-${Date.now().toString(36).toUpperCase()}`,
      status: "pending",
      personalInfo: { ...personalInfo },
      vehicleInfo: { ...vehicleInfo },
      coverageNeeds: { ...coverageNeeds },
      proposedPrice: offer.annualPrice,
      finalPrice: null,
      insurerName: offer.insurerName,
      offerName: offer.name,
      createdAt: new Date().toISOString(),
    };

    setUserQuotes([quote, ...userQuotes]);
  };

  const handleViewDetails = (offer: InsurerOffer) => {
    setSelectedOffer(offer);
  };

  const handleToggleAllInsurers = useCallback(() => {
    if (uncheckedInsurers.size === 0) {
      // All checked → uncheck all
      setUncheckedInsurers(new Set(uniqueInsurers));
    } else {
      // Some unchecked → check all
      setUncheckedInsurers(new Set());
    }
  }, [uncheckedInsurers, uniqueInsurers]);

  const resetFilters = () => {
    setCoverageFilter("all");
    setUncheckedInsurers(new Set());
    setBudgetMax(300000);
    setSortBy("price_asc");
    setSelectedInsurerFilter("all");
  };

  const activeFilterCount = [
    coverageFilter !== "all",
    uncheckedInsurers.size > 0,
    budgetMax < 300000,
  ].filter(Boolean).length;

  /* ── empty state (no comparison results at all) ── */
  if (comparisonResults.length === 0) {
    return <EmptyResultsState onGoBack={() => setView("compare")} />;
  }

  /* ── main render ── */
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground hover:text-foreground shrink-0"
          onClick={() => setView("compare")}
        >
          <ArrowLeft className="size-4 mr-1.5" />
          <span className="hidden sm:inline">Retour au formulaire</span>
          <span className="sm:hidden">Retour</span>
        </Button>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex-1">
          {filteredAndSorted.length} offre
          {filteredAndSorted.length !== 1 ? "s" : ""} trouvée
          {filteredAndSorted.length !== 1 ? "s" : ""}
        </h1>

        {/* Price mode toggle */}
        <div className="flex items-center bg-muted/30 rounded-full p-0.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setPriceMode("annual")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              priceMode === "annual"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Par an
          </button>
          <button
            onClick={() => setPriceMode("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              priceMode === "monthly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Par mois
          </button>
        </div>
      </div>

      {/* ── Mobile Filter Toggle ── */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full justify-between rounded-xl border-border"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter className="size-4" />
            <span className="font-medium">Filtres</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs min-w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${
              mobileFiltersOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {/* ── Mobile Filters (collapsible) ── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden lg:hidden mb-6"
          >
            <FiltersSidebar
              coverageFilter={coverageFilter}
              setCoverageFilter={setCoverageFilter}
              uncheckedInsurers={uncheckedInsurers}
              toggleInsurer={toggleInsurer}
              onToggleAllInsurers={handleToggleAllInsurers}
              uniqueInsurers={uniqueInsurers}
              budgetMax={budgetMax}
              setBudgetMax={setBudgetMax}
              onReset={resetFilters}
              totalOffers={comparisonResults.length}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <FiltersSidebar
            coverageFilter={coverageFilter}
            setCoverageFilter={setCoverageFilter}
            uncheckedInsurers={uncheckedInsurers}
            toggleInsurer={toggleInsurer}
            onToggleAllInsurers={handleToggleAllInsurers}
            uniqueInsurers={uniqueInsurers}
            budgetMax={budgetMax}
            setBudgetMax={setBudgetMax}
            onReset={resetFilters}
            totalOffers={comparisonResults.length}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-4">
          {filteredAndSorted.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  priceMode={priceMode}
                  onViewDetails={handleViewDetails}
                  onRequestQuote={handleRequestQuote}
                />
              ))}
            </AnimatePresence>
          ) : (
            /* Filtered empty state */
            <div className="text-center py-16">
              <div className="rounded-full bg-muted/40 p-6 mb-4 inline-block">
                <SearchX className="size-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Aucune offre ne correspond à vos critères
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Essayez d&rsquo;élargir vos filtres ou de modifier le budget.
              </p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={resetFilters}
              >
                <RotateCcw className="size-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Detail dialog */}
      <OfferDetailDialog
        offer={selectedOffer}
        open={selectedOffer !== null}
        onClose={() => setSelectedOffer(null)}
        onRequestQuote={handleRequestQuote}
      />
    </section>
  );
}