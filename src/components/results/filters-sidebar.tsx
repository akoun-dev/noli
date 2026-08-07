"use client";

import { memo } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { COVERAGE_OPTIONS, BUDGET_STEP } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

export interface FiltersSidebarProps {
  coverageFilter: string;
  setCoverageFilter: (v: string) => void;
  uncheckedInsurers: Set<string>;
  toggleInsurer: (name: string) => void;
  onToggleAllInsurers: () => void;
  uniqueInsurers: string[];
  budgetMax: number;
  setBudgetMax: (v: number) => void;
  effectiveBudgetMax: number;
  onReset: () => void;
  totalOffers: number;
}

function FiltersSidebarComponent({
  coverageFilter,
  setCoverageFilter,
  uncheckedInsurers,
  toggleInsurer,
  uniqueInsurers,
  budgetMax,
  setBudgetMax,
  effectiveBudgetMax,
  onReset,
  totalOffers,
  onToggleAllInsurers,
}: FiltersSidebarProps) {
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
          <span className="text-xs text-muted-foreground">
            ({totalOffers})
          </span>
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
            max={effectiveBudgetMax}
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

// UI-C07 : mémoïsation pour éviter les re-renders quand les autres états changent.
export const FiltersSidebar = memo(FiltersSidebarComponent);
