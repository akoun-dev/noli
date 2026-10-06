"use client";

import { Dispatch, SetStateAction } from "react";
import { Check } from "lucide-react";
import { step2Options } from "./constants";
import type { CalculationType, MatrixTariff, FormulaConfig, CategoryTariff } from "./types";

interface Step2CalcTypeProps {
  calcType: CalculationType | "";
  setCalcType: Dispatch<SetStateAction<CalculationType | "">>;
  setMetadata: Dispatch<SetStateAction<Record<string, unknown>>>;
  setMatrixTariffs: Dispatch<SetStateAction<MatrixTariff[]>>;
  setMatrixFormulas: Dispatch<SetStateAction<FormulaConfig[]>>;
  setCategoryTariffs: Dispatch<SetStateAction<CategoryTariff[]>>;
}

/* Étape 2 du wizard : choix du mode de calcul de la prime */
export function Step2CalcType({
  calcType,
  setCalcType,
  setMetadata,
  setMatrixTariffs,
  setMatrixFormulas,
  setCategoryTariffs,
}: Step2CalcTypeProps) {
  return (
    <div className="space-y-3 py-2">
      <p className="text-sm text-muted-foreground mb-4">
        Sélectionnez le mode de calcul de la prime pour cette garantie.
      </p>
      <div className="space-y-3">
        {step2Options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = calcType === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                setCalcType(opt.type);
                // Reset metadata when switching type
                setMetadata({});
                setMatrixTariffs([]);
                setMatrixFormulas([]);
                setCategoryTariffs([]);
              }}
              className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30 bg-card"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-brand text-black"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-brand" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground/70 mt-1">
                  {opt.formula}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
