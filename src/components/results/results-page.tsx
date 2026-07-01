"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  SearchX,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Zap,
  MapPin,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { InsurerOffer, SortOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

const coverageBadge = (type: string) => {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    Tiers: {
      label: "Tiers",
      className: "bg-muted text-muted-foreground border border-border",
      icon: <Shield className="size-3" />,
    },
    "Tiers+": {
      label: "Tiers+",
      className: "bg-primary/15 text-primary border border-primary/20",
      icon: <ShieldCheck className="size-3" />,
    },
    "Tous Risques": {
      label: "Tous Risques",
      className: "bg-accent/20 text-accent-foreground border border-accent/30",
      icon: <ShieldAlert className="size-3" />,
    },
  };
  return map[type] || {
    label: type,
    className: "bg-muted text-muted-foreground border border-border",
    icon: <Shield className="size-3" />,
  };
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix d\u00e9croissant" },
  { value: "rating_desc", label: "Meilleure note" },
  { value: "name_asc", label: "Nom A-Z" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < Math.floor(rating)
              ? "fill-accent text-accent"
              : i < rating
                ? "fill-accent/50 text-accent"
                : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
    </div>
  );
}

function OfferCard({
  offer,
  onViewDetails,
  onRequestQuote,
}: {
  offer: InsurerOffer;
  onViewDetails: (offer: InsurerOffer) => void;
  onRequestQuote: (offer: InsurerOffer) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = coverageBadge(offer.coverageType);
  const visibleFeatures = offer.features.slice(0, 4);
  const hiddenFeatures = offer.features.slice(4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="card-shadow bg-card overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardContent className="p-4 sm:p-6 flex flex-col flex-1 gap-4">
          {/* Insurer info */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                {offer.insurerName}
              </span>
              <h3 className="text-lg font-bold">{offer.name}</h3>
            </div>
            <Badge className={badge.className}>
              {badge.icon}
              {badge.label}
            </Badge>
          </div>

          <StarRating rating={offer.insurerRating} />

          {/* Price */}
          <div className="bg-accent/10 rounded-lg p-3 -mx-1">
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {formatFCFA(offer.monthlyPrice)}
              <span className="text-sm font-normal text-muted-foreground">/mois</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {formatFCFA(offer.annualPrice)}/an
            </p>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Franchise :</span>
              <span className="font-medium">{formatFCFA(offer.deductible)}</span>
            </div>
            {offer.maxCoverage > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Couverture max :</span>
                <span className="font-medium">
                  {Math.round(offer.maxCoverage / 1_000_000)} M FCFA
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Features */}
          <div className="flex-1">
            <ul className="space-y-1.5">
              {visibleFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="size-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {hiddenFeatures.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
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
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="size-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2">
            <Button
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/5 rounded-full"
              onClick={() => onViewDetails(offer)}
            >
              Voir les d\u00e9tails
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              onClick={() => onRequestQuote(offer)}
            >
              <Zap className="size-4" />
              Demander un devis
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
  const badge = coverageBadge(offer.coverageType);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{offer.name}</DialogTitle>
          <DialogDescription>
            {offer.insurerName} &middot; {offer.coverageType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating & Badge */}
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className={badge.className}>
              {badge.icon}
              {badge.label}
            </Badge>
            <StarRating rating={offer.insurerRating} />
          </div>

          {/* Pricing */}
          <div className="bg-accent/10 rounded-lg p-4 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatFCFA(offer.monthlyPrice)}
              </span>
              <span className="text-muted-foreground">/mois</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold">
                {formatFCFA(offer.annualPrice)}
              </span>
              <span className="text-muted-foreground">/an</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Franchise :</span>
                <p className="font-medium">{formatFCFA(offer.deductible)}</p>
              </div>
              {offer.maxCoverage > 0 && (
                <div>
                  <span className="text-muted-foreground">Couverture max :</span>
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
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {offer.description}
              </p>
            </div>
          )}

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-3">Garanties incluses</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {offer.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="size-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conditions */}
          {offer.conditions && (
            <div>
              <h4 className="font-semibold mb-2">Conditions</h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                {offer.conditions}
              </p>
            </div>
          )}

          {/* CTA */}
          <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => {
              onRequestQuote(offer);
              onClose();
            }}
          >
            <Zap className="size-4" />
            Demander ce devis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  } = useAppStore();
  const { toast } = useToast();

  const uniqueInsurers = useMemo(() => {
    const names = [...new Set(comparisonResults.map((o) => o.insurerName))];
    return names.sort();
  }, [comparisonResults]);

  const filteredAndSorted = useMemo(() => {
    let results = [...comparisonResults];

    // Filter
    if (selectedInsurerFilter !== "all") {
      results = results.filter(
        (o) => o.insurerName === selectedInsurerFilter
      );
    }

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
  }, [comparisonResults, sortBy, selectedInsurerFilter]);

  const handleRequestQuote = async (offer: InsurerOffer) => {
    toast({
      title: "Devis envoy\u00e9",
      description: `Votre demande de devis a \u00e9t\u00e9 envoy\u00e9e \u00e0 ${offer.insurerName}.`,
    });

    // Create a local quote record
    const quote: import("@/types").QuoteRecord = {
      id: crypto.randomUUID(),
      reference: `DEV-${Date.now().toString(36).toUpperCase()}`,
      status: "pending",
      personalInfo: { firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", licenseDate: "", hasClaims: false, claimsCount: 0, usage: "personnel", annualMileage: "10000" },
      vehicleInfo: { vehicleType: "", brand: "", model: "", year: "", fiscalPower: "", registration: "", newValue: "", currentValue: "", isImported: false },
      coverageNeeds: { coverageType: "tiers", options: [], monthlyBudget: "", deductibleLevel: "medium" },
      proposedPrice: offer.monthlyPrice,
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

  // Empty state
  if (comparisonResults.length === 0) {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="rounded-full bg-muted p-6 mb-6">
          <SearchX className="size-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Aucune offre trouv\u00e9e</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Aucune offre ne correspond \u00e0 vos crit\u00e8res. Essayez de modifier vos
          param\u00e8tres de recherche.
        </p>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          onClick={() => setView("compare")}
        >
          <MapPin className="size-4" />
          Modifier mes crit\u00e8res
        </Button>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => setView("compare")}
      >
        <ArrowLeft className="size-4" />
        Retour au formulaire
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {filteredAndSorted.length} offre{filteredAndSorted.length !== 1 ? "s" : ""} trouv\u00e9e
          {filteredAndSorted.length !== 1 ? "s" : ""}
        </h1>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Insurer filter chips */}
      <ScrollArea className="w-full mb-6" type="scroll">
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setSelectedInsurerFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              selectedInsurerFilter === "all"
                ? "bg-card text-primary border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            Tous
          </button>
          {uniqueInsurers.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedInsurerFilter(name)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                selectedInsurerFilter === name
                  ? "bg-card text-primary border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Offers grid */}
      {filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onViewDetails={handleViewDetails}
                onRequestQuote={handleRequestQuote}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="rounded-full bg-muted p-6 mb-4 inline-block">
            <SearchX className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Aucune offre ne correspond \u00e0 vos crit\u00e8res
          </h3>
          <p className="text-muted-foreground mb-6">
            Essayez de modifier le filtre ou les crit\u00e8res de tri.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedInsurerFilter("all");
              setSortBy("price_asc");
            }}
          >
            R\u00e9initialiser les filtres
          </Button>
        </div>
      )}

      {/* Offer detail dialog */}
      <OfferDetailDialog
        offer={selectedOffer}
        open={selectedOffer !== null}
        onClose={() => setSelectedOffer(null)}
        onRequestQuote={handleRequestQuote}
      />
    </section>
  );
}