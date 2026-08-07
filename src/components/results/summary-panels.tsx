"use client";

import { memo, useMemo } from "react";
import { TrendingDown, Star, Info, Shield } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InsurerOffer } from "@/types";

export interface SummaryPanelsProps {
  offers: InsurerOffer[];
}

function SummaryPanelsComponent({ offers }: SummaryPanelsProps) {
  const cheapestOffers = useMemo(
    () =>
      [...offers]
        .sort((a, b) => a.annualPrice - b.annualPrice)
        .slice(0, 3),
    [offers]
  )

  const bestRatedOffers = useMemo(
    () =>
      [...offers]
        .sort((a, b) => b.insurerRating - a.insurerRating)
        .slice(0, 3),
    [offers]
  )

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
              Les 3 offres les plus économiques parmi les
              résultats
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Offer rows */}
        <div className="divide-y divide-border/30">
          {cheapestOffers.map(offer => (
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
                <p className="text-[10px] text-muted-foreground">
                  dossier inclus
                </p>
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
          {bestRatedOffers.map(offer => (
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
                <p className="text-[10px] text-muted-foreground">
                  dossier inclus
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const SummaryPanels = memo(SummaryPanelsComponent);
