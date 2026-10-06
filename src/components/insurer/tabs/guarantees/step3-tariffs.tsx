"use client";

import { Dispatch, SetStateAction } from "react";
import { CircleDot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Step3VariableBased } from "./step3-variable-based";
import { Step3Matrix } from "./matrix/step3-matrix";
import type {
  CalculationType,
  MatrixTariff,
  FormulaConfig,
  CategoryTariff,
} from "./types";

interface Step3TariffsProps {
  calcType: CalculationType | "";
  metadata: Record<string, unknown>;
  setMetadata: Dispatch<SetStateAction<Record<string, unknown>>>;
  matrixDimension: string;
  setMatrixDimension: Dispatch<SetStateAction<string>>;
  matrixTariffs: MatrixTariff[];
  setMatrixTariffs: Dispatch<SetStateAction<MatrixTariff[]>>;
  matrixFormulas: FormulaConfig[];
  setMatrixFormulas: Dispatch<SetStateAction<FormulaConfig[]>>;
  matrixDefaultPrime: number;
  setMatrixDefaultPrime: Dispatch<SetStateAction<number>>;
  categoryTariffs: CategoryTariff[];
  setCategoryTariffs: Dispatch<SetStateAction<CategoryTariff[]>>;
  tierceVehicleCategory: string;
  setTierceVehicleCategory: Dispatch<SetStateAction<string>>;
  tierceCategories: string[];
  setTierceCategories: Dispatch<SetStateAction<string[]>>;
  newCategoryInput: string;
  setNewCategoryInput: Dispatch<SetStateAction<string>>;
}

/* Étape 3 du wizard : configuration selon le mode de calcul choisi */
export function Step3Tariffs(props: Step3TariffsProps) {
  const { calcType, metadata, setMetadata } = props;

  /* ─── FREE ─── */
  if (calcType === "FREE") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-8 text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4">
            <CircleDot className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-emerald-800 dark:text-emerald-300 font-semibold text-lg">
            Prime = 0 FCFA
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 max-w-md mx-auto">
            Aucune configuration supplémentaire requise. Cette garantie est
            incluse sans frais additionnels.
          </p>
        </div>
      </div>
    );
  }

  /* ─── FIXED_AMOUNT ─── */
  if (calcType === "FIXED_AMOUNT") {
    return (
      <div className="space-y-5">
        {/* Formula display */}
        <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
          <p className="font-mono text-sm font-semibold text-sky-800 dark:text-sky-300">
            Prime = fixedAmount{" "}
            {(metadata.packPriceReduced as number)
              ? "(ou packPriceReduced si inclus dans un pack)"
              : ""}
          </p>
        </div>

        {/* Main fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="w-full">
            <Label>Montant fixe (FCFA) *</Label>
            <Input
              className="w-full mt-1"
              type="number"
              placeholder="Ex: 5 000"
              value={(metadata.fixedAmount as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  fixedAmount: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Montant de la prime pour cette garantie.
            </p>
          </div>
          <div className="w-full">
            <Label>Prix réduit en pack (FCFA)</Label>
            <Input
              className="w-full mt-1"
              type="number"
              placeholder="Ex: 3 000"
              value={(metadata.packPriceReduced as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  packPriceReduced: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Prix appliqué si la garantie est incluse dans un pack.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── VARIABLE_BASED ─── */
  if (calcType === "VARIABLE_BASED") {
    return <Step3VariableBased metadata={metadata} setMetadata={setMetadata} />;
  }

  /* ─── MATRIX_BASED ─── */
  if (calcType === "MATRIX_BASED") {
    return (
      <Step3Matrix
        matrixDimension={props.matrixDimension}
        setMatrixDimension={props.setMatrixDimension}
        matrixTariffs={props.matrixTariffs}
        setMatrixTariffs={props.setMatrixTariffs}
        matrixFormulas={props.matrixFormulas}
        setMatrixFormulas={props.setMatrixFormulas}
        matrixDefaultPrime={props.matrixDefaultPrime}
        setMatrixDefaultPrime={props.setMatrixDefaultPrime}
        categoryTariffs={props.categoryTariffs}
        setCategoryTariffs={props.setCategoryTariffs}
        tierceVehicleCategory={props.tierceVehicleCategory}
        setTierceVehicleCategory={props.setTierceVehicleCategory}
        tierceCategories={props.tierceCategories}
        setTierceCategories={props.setTierceCategories}
        newCategoryInput={props.newCategoryInput}
        setNewCategoryInput={props.setNewCategoryInput}
      />
    );
  }

  return null;
}
