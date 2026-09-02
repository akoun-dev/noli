"use client";

import { memo, useState } from "react";
import {
  Shield,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  Loader2,
  Plus,
  Check,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { resolveCoverageName } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  findPricingForFeature,
  normalizeGuaranteeName,
  coverageBadgeStyle,
} from "./results-helpers";
import type { InsurerOffer } from "@/types";

export interface OfferCardProps {
  offer: InsurerOffer;
  onRequestQuote: (offer: InsurerOffer) => void;
  onRequestCall: (offer: InsurerOffer) => void;
  onAddToCompare: (offer: InsurerOffer) => void;
  isCompared: boolean;
  priceMode: "annual" | "monthly";
  quoteLoading: string | null;
}

function OfferCardComponent({
  offer,
  onRequestQuote,
  onRequestCall,
  onAddToCompare,
  isCompared,
  priceMode,
  quoteLoading,
}: OfferCardProps) {
  const isQuoteLoading = quoteLoading === offer.id
  const [detailsOpen, setDetailsOpen] = useState(false)
  const visibleFeatures = offer.features.slice(0, 4)

  return (
    <div className="space-y-0 animate-fade-in-up">
      <div className="bg-white dark:bg-card rounded-xl border border-border/70 shadow-md hover:shadow-xl transition-all duration-300 overflow-visible relative hover:-translate-y-0.5">
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
              <h3 className="text-base lg:text-lg font-bold text-foreground leading-tight break-words">
                {offer.insurerName}
              </h3>
              <Badge
                variant="outline"
                className={`w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-1 ${coverageBadgeStyle(
                  offer.coverageType
                )}`}
              >
                {offer.coverageType}
              </Badge>
            </div>
          </div>

          {/* ── Center section: Guarantees ── */}
          <div className="flex-1 p-4 lg:p-5 min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 mt-1">
              Garanties incluses
            </h4>
            <Separator className="mb-3" />
            <ul className="space-y-1.5">
              {visibleFeatures.map((feature, idx) => {
                const pricing = findPricingForFeature(
                  offer.pricingBreakdown,
                  feature
                )
                const description =
                  offer.guaranteeDescriptions?.[feature] ||
                  offer.guaranteeDescriptions?.[
                    Object.keys(
                      offer.guaranteeDescriptions || {}
                    ).find(
                      k =>
                        normalizeGuaranteeName(k) ===
                        normalizeGuaranteeName(feature)
                    ) || ""
                  ] ||
                  null
                return (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm"
                  >
                    <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-wrap items-start gap-x-2 gap-y-0.5">
                      <span className="text-foreground/90 min-w-0 break-words">
                        {feature}
                      </span>
                      {pricing && (
                        <span
                          className={`text-xs font-semibold shrink-0 tabular-nums whitespace-nowrap ml-auto ${
                            pricing.amount === 0
                              ? "text-success"
                              : "text-foreground"
                          }`}
                        >
                          {pricing.amount === 0
                            ? "Inclus"
                            : `${formatFCFA(pricing.amount)}/an`}
                        </span>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors mt-0.5"
                        >
                          <Info className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        className="max-w-[320px] text-sm bg-foreground text-background border-foreground"
                        arrowClassName="fill-foreground bg-foreground"
                      >
                        <div className="space-y-1.5">
                          <p className="font-bold text-background">
                            {feature}
                          </p>
                          {description ? (
                            <p className="text-background/90 whitespace-pre-line leading-relaxed">
                              {description}
                            </p>
                          ) : (
                            <p className="text-background/60 italic">
                              Description non
                              disponible
                            </p>
                          )}
                          {pricing && (
                            <div className="border-t border-background/20 pt-1.5 mt-1.5 space-y-1">
                              {pricing.coverageCapital != null &&
                                pricing.coverageCapital > 0 && (
                                  <p className="text-background/90">
                                    Capital
                                    garanti :{" "}
                                    <span className="font-bold text-background">
                                      {formatFCFA(
                                        pricing.coverageCapital
                                      )}
                                    </span>
                                  </p>
                                )}
                              <p className="text-background/90">
                                Coût :{" "}
                                <span className="font-bold text-background">
                                  {pricing.amount ===
                                  0
                                    ? "Gratuit"
                                    : formatFCFA(
                                        pricing.amount
                                      )}
                                </span>
                              </p>
                              {pricing.breakdown && (
                                <p className="text-background/80 whitespace-pre-line text-xs">
                                  {
                                    pricing.breakdown
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                )
              })}
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
              {priceMode === "monthly" ? (
                <>
                  <p className="text-xl lg:text-2xl font-bold text-primary leading-tight">
                    {formatFCFA(offer.monthlyPrice)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /mois · Soit{" "}
                    {formatFCFA(offer.annualPrice)}/an
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl lg:text-2xl font-bold text-primary leading-tight">
                    {formatFCFA(offer.annualPrice)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /an · Soit{" "}
                    {formatFCFA(offer.monthlyPrice)}/mois
                  </p>
                </>
              )}
            </div>
            <div className="w-full flex flex-col gap-2 mt-auto">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg font-semibold shadow-sm"
                onClick={() => onRequestQuote(offer)}
                disabled={isQuoteLoading}
              >
                {isQuoteLoading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="size-4 mr-2" />
                )}
                {isQuoteLoading ? "Création..." : "Obtenir un devis"}
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

        {/* ── "En savoir plus" dropdown ── */}
        <div className="border-t border-border/40">
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
              detailsOpen
                ? "max-h-[2000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="bg-muted/20 px-5 pb-5 space-y-5">
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
                  {offer.features.map((feature, idx) => {
                    const resolvedName =
                      resolveCoverageName(feature)
                    const pricing = findPricingForFeature(
                      offer.pricingBreakdown,
                      feature
                    )
                    const description =
                      offer.guaranteeDescriptions?.[
                        feature
                      ] ||
                      offer.guaranteeDescriptions?.[
                        Object.keys(
                          offer.guaranteeDescriptions ||
                            {}
                        ).find(
                          k =>
                            normalizeGuaranteeName(
                              k
                            ) ===
                            normalizeGuaranteeName(
                              feature
                            )
                        ) || ""
                      ] ||
                      null
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-wrap items-start gap-x-2 gap-y-0.5">
                          <span className="text-foreground/90 min-w-0 break-words">
                            {resolvedName}
                          </span>
                          {pricing && (
                            <span
                              className={`text-xs font-semibold shrink-0 tabular-nums whitespace-nowrap ml-auto ${
                                pricing.amount === 0
                                  ? "text-success"
                                  : "text-foreground"
                              }`}
                            >
                              {pricing.amount === 0
                                ? "Inclus"
                                : `${formatFCFA(pricing.amount)}/an`}
                            </span>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors mt-0.5"
                            >
                              <Info className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[300px] text-sm bg-foreground text-background border-foreground"
                            arrowClassName="fill-foreground bg-foreground"
                          >
                            <div className="space-y-1.5">
                              <p className="font-bold text-background">
                                {resolvedName}
                              </p>
                              {description ? (
                                <p className="text-background/90 whitespace-pre-line leading-relaxed">
                                  {
                                    description
                                  }
                                </p>
                              ) : (
                                <p className="text-background/60 italic">
                                  Description
                                  non
                                  disponible
                                </p>
                              )}
                              {pricing && (
                                <div className="border-t border-background/20 pt-1.5 mt-1.5 space-y-1">
                                  {pricing.coverageCapital != null &&
                                    pricing.coverageCapital > 0 && (
                                      <p className="text-background/90">
                                        Capital
                                        garanti :{" "}
                                        <span className="font-bold text-background">
                                          {formatFCFA(
                                            pricing.coverageCapital
                                          )}
                                        </span>
                                      </p>
                                    )}
                                  <p className="text-background/90">
                                    Coût :{" "}
                                    <span className="font-bold text-background">
                                      {pricing.amount ===
                                      0
                                        ? "Gratuit"
                                        : `${formatFCFA(pricing.amount)}/an`}
                                    </span>
                                  </p>
                                  <p className="text-background/90">
                                    Méthode :{" "}
                                    <span className="font-semibold text-background">
                                      {
                                        pricing.method
                                      }
                                    </span>
                                  </p>
                                  {pricing.breakdown && (
                                    <p className="text-background/80 whitespace-pre-line text-xs">
                                      {
                                        pricing.breakdown
                                      }
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    )
                  })}
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
                      {Math.round(
                        offer.maxCoverage / 1_000_000
                      )}{" "}
                      M FCFA
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
                disabled={isQuoteLoading}
              >
                {isQuoteLoading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="size-4 mr-2" />
                )}
                {isQuoteLoading ? "Création..." : "Obtenir un devis"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// UI-C07 : mémoïsé — ne se re-rend que si ses props changent réellement.
export const OfferCard = memo(OfferCardComponent);
