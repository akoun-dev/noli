"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Phone,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
  Shield,
  Plus,
  X,
  Trash2,
  Check,
  Info,
  Heart,
  TrendingDown,
  Star,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { InsurerOffer } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { MAX_COMPARE, COVERAGE_OPTIONS, BUDGET_MAX, BUDGET_STEP, resolveCoverageName } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ──────────────────────────── helpers ──────────────────────────── */

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

// Map DB coverage category codes to French display labels
const GUARANTEE_LABELS: Record<string, string> = {
  RESPONSABILITE_CIVILE: "RC",
  DEFENSE_RECOURS: "Défense & Recours",
  INDIVIDUELLE_CONDUCTEUR: "IC",
  INDIVIDUELLE_PASSAGERS: "IPT",
  INCENDIE: "Incendie",
  VOL: "Vol",
  BRIS_GLACES: "Bris de glaces",
  TIERCE_COMPLETE: "Tierce Complète",
  TIERCE_COLLISION: "Tierce Collision",
  ASSISTANCE: "Assistance",
  AVANCE_RECOURS: "Avance sur recours",
  ACCESSOIRES: "Accessoires",
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
  onToggleAllInsurers,
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
    <aside className="bg-white dark:bg-card rounded-xl p-4 lg:p-5 space-y-6 lg:sticky lg:top-20 shadow-sm border border-border/60">
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
            max={BUDGET_MAX}
            step={BUDGET_STEP}
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

/* ──────── Comparison Bar (sticky top) ──────── */

function ComparisonBar({
  offers,
  onRemove,
  onClear,
  onCompare,
  onOpen,
}: {
  offers: InsurerOffer[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
  onOpen: () => void;
}) {
  if (offers.length === 0) return null;

  return (
    <div
      className="sticky top-16 z-40 bg-muted/80 backdrop-blur-md border-b border-border/60 shadow-md animate-slide-up"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-foreground">Comparer</span>
          <span className="text-xs text-muted-foreground">
            ({offers.length}/{MAX_COMPARE})
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {offers.map((offer) => (
            <span
              key={offer.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border/60 px-3 py-1.5 text-sm text-foreground shadow-sm shrink-0"
            >
              <Shield className="size-3.5 text-primary" />
              {offer.insurerName}
              <button
                onClick={() => onRemove(offer.id)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Retirer ${offer.insurerName}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-sm font-medium"
            onClick={onClear}
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Vider
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-sm"
            onClick={onOpen}
            disabled={offers.length < 2}
          >
            <Shield className="size-3.5 mr-1.5" />
            Comparer
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────── Comparison Modal ──────── */

const COVERAGE_LABELS: Record<string, string> = {
  RESPONSABILITE_CIVILE: "RC",
  DEFENSE_RECOURS: "Défense & Recours",
  INDIVIDUELLE_CONDUCTEUR: "Ind. Conducteur",
  INDIVIDUELLE_PASSAGERS: "Ind. Passagers",
  INCENDIE: "Incendie",
  VOL: "Vol",
  BRIS_GLACES: "Bris de Glaces",
  TIERCE_COMPLETE: "Tierce Complète",
  TIERCE_COLLISION: "Tierce Collision",
  ASSISTANCE: "Assistance",
  AVANCE_RECOURS: "Avance sur Recours",
  ACCESSOIRES: "Accessoires",
};

function ComparisonModal({
  offers,
  open,
  onClose,
}: {
  offers: InsurerOffer[];
  open: boolean;
  onClose: () => void;
}) {
  const { vehicleInfo, coverageNeeds } = useAppStore();
  // Build category → guarantees structure from pricingBreakdown
  const categories = useMemo(() => {
    const catMap = new Map<string, { name: string; guarantees: string[] }>();
    let hasBreakdowns = false;

    for (const o of offers) {
      if (o.pricingBreakdown && o.pricingBreakdown.length > 0) {
        hasBreakdowns = true;
        for (const pb of o.pricingBreakdown) {
          const catKey = pb.categoryCode || "AUTRES";
          if (!catMap.has(catKey)) {
            catMap.set(catKey, { name: pb.categoryName || "Autres", guarantees: [] });
          }
          const entry = catMap.get(catKey)!;
          if (!entry.guarantees.includes(pb.guaranteeName)) {
            entry.guarantees.push(pb.guaranteeName);
          }
        }
      }
    }

    // Fallback: use features if no breakdowns
    if (!hasBreakdowns) {
      catMap.set("GARANTIES", { name: "Garanties incluses", guarantees: [] });
      for (const o of offers) {
        for (const f of o.features) {
          const name = resolveCoverageName(f);
          const entry = catMap.get("GARANTIES")!;
          if (!entry.guarantees.includes(name)) {
            entry.guarantees.push(name);
          }
        }
      }
    }

    return Array.from(catMap.entries());
  }, [offers]);

  // Build a lookup: offer.id → Set of guarantee names it has
  const guaranteeLookup = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of offers) {
      const set = new Set<string>();
      if (o.pricingBreakdown && o.pricingBreakdown.length > 0) {
        for (const pb of o.pricingBreakdown) {
          if (pb.guaranteeName) set.add(pb.guaranteeName);
        }
      } else {
        for (const f of o.features) set.add(resolveCoverageName(f));
      }
      map.set(o.id, set);
    }
    return map;
  }, [offers]);

  if (!open || offers.length < 2) return null;

  const selectedCategories = coverageNeeds.guaranteeCategories || [];
  const cheapest = [...offers].sort((a, b) => a.annualPrice - b.annualPrice)[0];
  const bestRated = [...offers].sort((a, b) => b.insurerRating - a.insurerRating)[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[1050px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30 sticky top-0 z-20">
          <DialogTitle className="text-lg font-bold text-foreground">
            Comparer les garanties
          </DialogTitle>
          <DialogClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none" asChild>
            <button type="button" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </DialogClose>
          <DialogDescription className="sr-only">
            Comparaison détaillée de {offers.length} offres d&apos;assurance
          </DialogDescription>
        </div>

        {/* ── Récap du véhicule et garanties demandées ── */}
        <div className="px-6 py-4 border-b border-border/40 bg-primary/[0.03]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Car className="size-4 text-primary" />
              <span className="font-semibold text-foreground">Véhicule</span>
              <span className="text-muted-foreground">
                {vehicleInfo.year || "—"} · {vehicleInfo.fiscalPower || "—"} CV · {vehicleInfo.fuelType || "—"}
              </span>
            </div>
            {vehicleInfo.newValue && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Valeur neuve :</span>
                <span className="font-semibold text-foreground">{formatFCFA(Number(vehicleInfo.newValue))}</span>
              </div>
            )}
            {vehicleInfo.currentValue && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Valeur actuelle :</span>
                <span className="font-semibold text-foreground">{formatFCFA(Number(vehicleInfo.currentValue))}</span>
              </div>
            )}
            {vehicleInfo.usage && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Usage :</span>
                <span className="font-medium text-foreground">{vehicleInfo.usage}</span>
              </div>
            )}
          </div>
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedCategories.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-semibold border border-primary/20"
                >
                  <Check className="size-3" />
                  {COVERAGE_LABELS[code] || code}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full bg-muted/50 text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium">
                {selectedCategories.length} garantie{selectedCategories.length > 1 ? "s" : ""} demandée{selectedCategories.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr>
                <th className="text-left p-4 w-52 bg-muted/30 sticky left-0 z-10 border-b border-border/60">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Critères
                  </span>
                </th>
                {offers.map((offer) => {
                  const isBest = offer.id === cheapest.id;
                  return (
                    <th
                      key={offer.id}
                      className={`text-center p-4 border-b border-border/60 min-w-[150px] ${isBest ? "bg-primary/[0.06]" : "bg-muted/30"}`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isBest ? "bg-primary/15 border-primary/40" : "bg-primary/10 border-primary/20"}`}>
                            <Shield className="size-5 text-primary" />
                          </div>
                          {isBest && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[9px] font-bold">
                              ★
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {offer.insurerName}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {offer.coverageType.replace("_", " ")}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Prix mensuel */}
              <tr className="bg-card">
                <td className="p-4 text-sm font-semibold text-foreground sticky left-0 bg-card border-b border-border/30">
                  Mensuel
                </td>
                {offers.map((offer) => (
                  <td
                    key={offer.id}
                    className={`p-4 text-center text-sm font-bold border-b border-border/30 ${offer.id === cheapest.id ? "text-green-600 dark:text-green-400" : "text-foreground"}`}
                  >
                    {formatFCFA(offer.monthlyPrice)}/mois
                  </td>
                ))}
              </tr>

              {/* Prix annuel */}
              <tr className="bg-muted/20">
                <td className="p-4 text-sm font-semibold text-foreground sticky left-0 bg-muted/20 border-b border-border/30">
                  Annuel
                </td>
                {offers.map((offer) => (
                  <td
                    key={offer.id}
                    className={`p-4 text-center text-sm font-bold border-b border-border/30 ${offer.id === cheapest.id ? "text-green-600 dark:text-green-400" : "text-foreground"}`}
                  >
                    {formatFCFA(offer.annualPrice)}
                  </td>
                ))}
              </tr>

              {/* Franchise */}
              <tr className="bg-card">
                <td className="p-4 text-sm font-medium text-foreground sticky left-0 bg-card border-b border-border/30">
                  Franchise
                </td>
                {offers.map((offer) => (
                  <td
                    key={offer.id}
                    className="p-4 text-center text-sm text-foreground border-b border-border/30"
                  >
                    {offer.deductible ? formatFCFA(offer.deductible) : "—"}
                  </td>
                ))}
              </tr>

              {/* Note assureur */}
              <tr className="bg-muted/20">
                <td className="p-4 text-sm font-medium text-foreground sticky left-0 bg-muted/20 border-b border-border/30">
                  Note
                </td>
                {offers.map((offer) => (
                  <td
                    key={offer.id}
                    className={`p-4 text-center text-sm font-semibold border-b border-border/30 ${offer.id === bestRated.id ? "text-accent" : "text-foreground"}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Star className="size-3.5 fill-current" />
                      {offer.insurerRating}/5
                    </div>
                  </td>
                ))}
              </tr>

              {/* Couverture max */}
              {offers.some((o) => o.maxCoverage > 0) && (
                <tr className="bg-card">
                  <td className="p-4 text-sm font-medium text-foreground sticky left-0 bg-card border-b border-border/30">
                    Couverture max
                  </td>
                  {offers.map((offer) => (
                    <td
                      key={offer.id}
                      className="p-4 text-center text-sm text-foreground border-b border-border/30"
                    >
                      {offer.maxCoverage > 0
                        ? `${Math.round(offer.maxCoverage / 1_000_000)}M FCFA`
                        : "—"}
                    </td>
                  ))}
                </tr>
              )}

              {/* Nombre de garanties */}
              <tr className="bg-primary/[0.03]">
                <td className="p-4 text-sm font-semibold text-foreground sticky left-0 bg-primary/[0.03] border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    Total garanties
                  </div>
                </td>
                {offers.map((offer) => {
                  const count = guaranteeLookup.get(offer.id)?.size ?? 0;
                  const requestedCount = selectedCategories.length;
                  const matchPercent = requestedCount > 0 ? Math.round((count / requestedCount) * 100) : 0;
                  return (
                    <td
                      key={offer.id}
                      className="p-4 text-center border-b border-border/30"
                    >
                      <span className="text-lg font-bold text-foreground">{count}</span>
                      {requestedCount > 0 && (
                        <div className="mt-1">
                          <span className={`text-[11px] font-semibold ${matchPercent >= 80 ? "text-green-600" : matchPercent >= 50 ? "text-amber-600" : "text-red-500"}`}>
                            {matchPercent}% de correspondance
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Guarantee rows grouped by category */}
              {categories.map(([catKey, catData], catIdx) => (
                <React.Fragment key={catKey}>
                  <tr>
                    <td
                      className="p-0"
                      colSpan={offers.length + 1}
                    >
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-muted/60 via-muted/30 to-transparent border-b border-t border-border/30">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                          <Shield className="size-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {catData.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 ml-auto">
                          {catData.guarantees.length} garanti{catData.guarantees.length > 1 ? 'es' : 'e'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {catData.guarantees.map((guarantee, idx) => {
                    const isZebra = catIdx % 2 === 0 ? idx % 2 === 1 : idx % 2 === 0;
                    return (
                      <tr
                        key={guarantee}
                        className={`transition-colors ${
                          isZebra ? "bg-[#B9E54D]/5" : "bg-card"
                        } hover:bg-muted/20`}
                      >
                        <td
                          className={`p-3 pl-6 text-sm text-foreground sticky left-0 border-b border-border/20 font-medium ${
                            isZebra ? "bg-[#B9E54D]/5" : "bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            {guarantee}
                          </div>
                        </td>
                        {offers.map((offer) => {
                          const hasGuarantee = guaranteeLookup.get(offer.id)?.has(guarantee) ?? false;
                          return (
                            <td
                              key={offer.id}
                              className="p-3 text-center border-b border-border/20"
                            >
                              {hasGuarantee ? (
                                <div className="flex items-center justify-center">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-800/50">
                                    <Check className="size-3.5 text-green-600 dark:text-green-400" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800/30">
                                    <X className="size-3.5 text-red-400 dark:text-red-400" />
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──────── Summary Panels ──────── */

function SummaryPanels({ offers }: { offers: InsurerOffer[] }) {
  const cheapestOffers = useMemo(
    () =>
      [...offers]
        .sort((a, b) => a.annualPrice - b.annualPrice)
        .slice(0, 3),
    [offers]
  );

  const bestRatedOffers = useMemo(
    () =>
      [...offers]
        .sort((a, b) => b.insurerRating - a.insurerRating)
        .slice(0, 3),
    [offers]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Left panel: Cheapest offers */}
      <div className="bg-white dark:bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40">
          <TrendingDown className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground text-center flex-1">
            Offres les moins chères
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="cursor-help">
                <Info className="size-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Les 3 offres les plus économiques parmi les résultats
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Offer rows */}
        <div className="divide-y divide-border/30">
          {cheapestOffers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              {offer.insurerLogo ? (
                <img
                  src={offer.insurerLogo}
                  alt={offer.insurerName}
                  className="size-8 rounded-full object-contain bg-muted/40 p-0.5 shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Shield className="size-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {offer.insurerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {offer.coverageType}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">
                  {formatFCFA(offer.annualPrice)}/an
                </p>
                <p className="text-[10px] text-muted-foreground">dossier inclus</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel: Best rated insurers */}
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40">
          <Star className="size-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground text-center flex-1">
            Assureurs les mieux notés
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="cursor-help">
                <Info className="size-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Les 3 assureurs les mieux notés par nos utilisateurs
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Offer rows */}
        <div className="divide-y divide-border/30">
          {bestRatedOffers.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
            >
              {offer.insurerLogo ? (
                <img
                  src={offer.insurerLogo}
                  alt={offer.insurerName}
                  className="size-8 rounded-full object-contain bg-muted/40 p-0.5 shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Shield className="size-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {offer.insurerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {offer.coverageType}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">
                  {formatFCFA(offer.annualPrice)}/an
                </p>
                <p className="text-[10px] text-muted-foreground">dossier inclus</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────── Offer Card (3-column horizontal layout) ──────── */

function OfferCard({
  offer,
  onRequestQuote,
  onRequestCall,
  onAddToCompare,
  isCompared,
}: {
  offer: InsurerOffer;
  onRequestQuote: (offer: InsurerOffer) => void;
  onRequestCall: (offer: InsurerOffer) => void;
  onAddToCompare: (offer: InsurerOffer) => void;
  isCompared: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const visibleFeatures = offer.features.slice(0, 4);

  return (
    <div className="space-y-0 animate-fade-in-up">
      <div className="bg-white dark:bg-card rounded-xl border border-border/70 shadow-md hover:shadow-xl transition-all duration-300 overflow-visible relative hover:-translate-y-0.5">
        {/* Heart icon top-right */}
        <button
          className="absolute top-3 right-3 z-10 text-muted-foreground/50 hover:text-red-500 transition-colors"
          aria-label="Ajouter aux favoris"
        >
          <Heart className="size-5" />
        </button>

        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* ── Left section: Insurer info ── */}
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-4 p-4 lg:p-5 lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border/40">
            {offer.insurerLogo ? (
              <img
                src={offer.insurerLogo}
                alt={offer.insurerName}
                className="size-12 lg:size-14 rounded-xl object-contain bg-muted/40 p-1 shrink-0"
              />
            ) : (
              <div className="flex h-12 lg:h-14 w-12 lg:w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Shield className="size-7 text-primary" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <h3 className="text-base lg:text-lg font-bold text-foreground leading-tight truncate">
                {offer.insurerName}
              </h3>
              <Badge
                variant="outline"
                className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-1 ${
                  coverageBadgeStyle(offer.coverageType)
                }`}
              >
                {offer.coverageType}
              </Badge>
            </div>
          </div>

          {/* ── Center section: Guarantees ── */}
          <div className="flex-1 p-4 lg:p-5 min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Garanties correspondantes
            </h4>
            {/* Matched guarantee badges */}
            {offer.matchedGuarantees && offer.matchedGuarantees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {offer.matchedGuarantees.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-semibold border border-primary/20"
                  >
                    <CheckCircle2 className="size-3" />
                    {GUARANTEE_LABELS[code] || code}
                  </span>
                ))}
              </div>
            )}
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-1">
              Garanties inclues
            </h4>
            <Separator className="mb-3" />
            <ul className="space-y-1.5">
              {visibleFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Franchise :{" "}
              <span className="font-medium text-foreground">
                {formatFCFA(offer.deductible)}
              </span>
            </p>
          </div>

          {/* ── Right section: Price + action buttons ── */}
          <div className="flex flex-col items-start lg:items-end gap-3 p-4 lg:p-5 lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-border/40">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                À partir de
              </p>
              <p className="text-xl lg:text-2xl font-bold text-primary leading-tight">
                {formatFCFA(offer.annualPrice)}
              </p>
              <p className="text-xs text-muted-foreground">
                /an · Soit {formatFCFA(offer.monthlyPrice)}/mois
              </p>
            </div>
            <div className="w-full flex flex-col gap-2 mt-auto">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold shadow-sm"
                onClick={() => onRequestQuote(offer)}
              >
                <FileText className="size-4 mr-2" />
                Obtenir le devis
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-lg font-medium"
                onClick={() => onRequestCall(offer)}
              >
                <Phone className="size-4 mr-2" />
                Être rappelé
              </Button>
              <Button
                variant={isCompared ? "default" : "outline"}
                className={`w-full rounded-lg font-medium transition-all duration-200 ${
                  isCompared
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-primary/30 text-primary hover:bg-primary/5"
                }`}
                onClick={() => onAddToCompare(offer)}
              >
                {isCompared ? (
                  <>
                    <Check className="size-4 mr-2" />
                    Comparer
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    Comparer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline "En savoir plus" dropdown ── */}
      <div className="mt-0">
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          En savoir plus sur cette offre
          {detailsOpen ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            detailsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
            <div className="bg-muted/20 rounded-lg border border-border/40 p-5 space-y-5">
                {/* Description */}
                {offer.description && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-foreground">
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {offer.description}
                    </p>
                  </div>
                )}

                {/* All features grid */}
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-foreground">
                    Garanties incluses
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {offer.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-foreground/90">{resolveCoverageName(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Coverage amount */}
                {offer.maxCoverage > 0 && (
                  <div className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border/30">
                    <Shield className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Capital maximum couvert
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {Math.round(offer.maxCoverage / 1_000_000)} M FCFA
                      </p>
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {offer.conditions && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-foreground">
                      Conditions
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {offer.conditions}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <Button
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold shadow-sm"
                  onClick={() => onRequestQuote(offer)}
                >
                  <FileText className="size-4 mr-2" />
                  Obtenir le devis
                </Button>
              </div>
        </div>
      </div>
    </div>
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
    setView,
    userQuotes,
    setUserQuotes,
    personalInfo,
    vehicleInfo,
    coverageNeeds,
    offersToCompare,
    setOffersToCompare,
    comparisonModalOpen,
    setComparisonModalOpen,
  } = useAppStore();
  const { toast } = useToast();

  /* ── local filter state ── */
  const [uncheckedInsurers, setUncheckedInsurers] = useState<Set<string>>(
    new Set()
  );
  const [coverageFilter, setCoverageFilter] = useState<string>("all");
  const [budgetMax, setBudgetMax] = useState<number>(BUDGET_MAX);
  const [priceMode, setPriceMode] = useState<"annual" | "monthly">("annual");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ── derived data ── */
  const uniqueInsurers = useMemo(() => {
    const names = [...new Set(comparisonResults.map((o) => o.insurerName))];
    return names.sort();
  }, [comparisonResults]);

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

    if (coverageFilter !== "all") {
      results = results.filter((o) => o.coverageType === coverageFilter);
    }

    if (effectiveChecked.size > 0) {
      results = results.filter((o) => effectiveChecked.has(o.insurerName));
    }

    results = results.filter((o) => o.monthlyPrice <= budgetMax);

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

  /* ── comparison handlers ── */
  const isOfferCompared = (offerId: string) =>
    offersToCompare.some((o) => o.id === offerId);

  const handleToggleCompare = useCallback(
    (offer: InsurerOffer) => {
      const alreadyCompared = offersToCompare.some((o) => o.id === offer.id);
      if (alreadyCompared) {
        setOffersToCompare(offersToCompare.filter((o) => o.id !== offer.id));
      } else {
        if (offersToCompare.length >= MAX_COMPARE) {
          toast({
            title: "Limite atteinte",
            description: `Vous pouvez comparer au maximum ${MAX_COMPARE} offres à la fois.`,
            variant: "destructive",
          });
          return;
        }
        setOffersToCompare([...offersToCompare, offer]);
      }
    },
    [offersToCompare, setOffersToCompare, toast]
  );

  const handleRemoveCompare = useCallback(
    (id: string) => {
      setOffersToCompare(offersToCompare.filter((o) => o.id !== id));
    },
    [offersToCompare, setOffersToCompare]
  );

  const handleClearCompare = useCallback(() => {
    setOffersToCompare([]);
  }, [setOffersToCompare]);

  const handleOpenComparison = useCallback(() => {
    if (offersToCompare.length >= 2) {
      setComparisonModalOpen(true);
    }
  }, [offersToCompare, setComparisonModalOpen]);

  /* ── handlers ── */
  const handleRequestQuote = (offer: InsurerOffer) => {
    toast({
      title: "Devis enregistré",
      description: "Votre demande de devis a bien été enregistrée. Un conseiller vous contactera prochainement.",
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

  const handleRequestCall = (offer: InsurerOffer) => {
    toast({
      title: "Demande de rappel envoyée",
      description: "Votre demande de rappel a bien été prise en compte. Un conseiller vous contactera prochainement.",
    });
  };

  const handleToggleAllInsurers = useCallback(() => {
    if (uncheckedInsurers.size === 0) {
      setUncheckedInsurers(new Set(uniqueInsurers));
    } else {
      setUncheckedInsurers(new Set());
    }
  }, [uncheckedInsurers, uniqueInsurers]);

  const resetFilters = () => {
    setCoverageFilter("all");
    setUncheckedInsurers(new Set());
    setBudgetMax(BUDGET_MAX);
    setSortBy("price_asc");
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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* ── Comparison Bar (sticky) ── */}
      {offersToCompare.length > 0 && (
        <ComparisonBar
          offers={offersToCompare}
          onRemove={handleRemoveCompare}
          onClear={handleClearCompare}
          onCompare={handleOpenComparison}
          onOpen={handleOpenComparison}
        />
      )}

      {/* ── Scrolling content below ── */}
      <div className="flex-1 overflow-y-auto">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* ── Top Bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setView("compare")}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              <span className="hidden sm:inline">Modifier mes choix</span>
              <span className="sm:hidden">Retour</span>
            </Button>

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
          <div
            className={`overflow-hidden lg:hidden mb-6 transition-all duration-250 ease-in-out ${
              mobileFiltersOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            }`}
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
          </div>

          {/* ── Summary Panels ── */}
          <SummaryPanels offers={comparisonResults} />

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
                  filteredAndSorted.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onRequestQuote={handleRequestQuote}
                      onRequestCall={handleRequestCall}
                      onAddToCompare={handleToggleCompare}
                      isCompared={isOfferCompared(offer.id)}
                    />
                  ))
              ) : (
                <div className="text-center py-16">
                  <div className="rounded-full bg-muted/40 p-6 mb-4 inline-block">
                    <SearchX className="size-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune offre ne correspond à vos critères
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Essayez d&apos;élargir vos filtres ou de modifier le budget.
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

          {/* Comparison modal */}
          <ComparisonModal
            offers={offersToCompare}
            open={comparisonModalOpen}
            onClose={() => setComparisonModalOpen(false)}
          />
        </section>
      </div>
    </div>
  );
}