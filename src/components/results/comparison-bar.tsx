"use client";

import { memo } from "react";
import { Shield, X, Trash2 } from "lucide-react";
import { MAX_COMPARE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import type { InsurerOffer } from "@/types";

export interface ComparisonBarProps {
  offers: InsurerOffer[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpen: () => void;
}

function ComparisonBarComponent({
  offers,
  onRemove,
  onClear,
  onOpen,
}: ComparisonBarProps) {
  if (offers.length === 0) return null;

  return (
    <div className="sticky top-16 z-40 bg-muted/80 backdrop-blur-md border-b border-border/60 shadow-md animate-slide-up">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-foreground">
            Comparer
          </span>
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

export const ComparisonBar = memo(ComparisonBarComponent);
