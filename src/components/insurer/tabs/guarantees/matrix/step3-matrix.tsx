"use client";

import { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { matrixDimensions } from "../constants";
import type { MatrixTariff, FormulaConfig, CategoryTariff } from "../types";
import { FiscalPowerEditor } from "./fiscal-power-editor";
import { FormulaEditor } from "./formula-editor";
import { VehicleCategoryEditor } from "./vehicle-category-editor";
import { TierceEditor } from "./tierce-editor";

interface Step3MatrixProps {
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

/* Configuration MATRIX_BASED : choix de la dimension + éditeur dédié */
export function Step3Matrix(props: Step3MatrixProps) {
  const {
    matrixDimension,
    setMatrixDimension,
    matrixTariffs,
    setMatrixTariffs,
    matrixFormulas,
    setMatrixFormulas,
    matrixDefaultPrime,
    setMatrixDefaultPrime,
    categoryTariffs,
    setCategoryTariffs,
    tierceVehicleCategory,
    setTierceVehicleCategory,
    tierceCategories,
    setTierceCategories,
    newCategoryInput,
    setNewCategoryInput,
  } = props;

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
        <p className="font-mono text-sm font-semibold text-violet-800 dark:text-violet-300">
          Prime = lookup dans la grille selon la dimension choisie
        </p>
      </div>

      <div className="w-full">
        <Label>Dimension de la matrice</Label>
        <Select
          value={matrixDimension}
          onValueChange={(v) => {
            setMatrixDimension(v);
            setMatrixTariffs([]);
            setMatrixFormulas([]);
            setCategoryTariffs([]);
          }}
        >
          <SelectTrigger className="w-full mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {matrixDimensions.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {matrixDimension === "FISCAL_POWER" && (
        <FiscalPowerEditor
          matrixTariffs={matrixTariffs}
          setMatrixTariffs={setMatrixTariffs}
          matrixDefaultPrime={matrixDefaultPrime}
          setMatrixDefaultPrime={setMatrixDefaultPrime}
        />
      )}

      {matrixDimension === "FORMULA" && (
        <FormulaEditor
          matrixFormulas={matrixFormulas}
          setMatrixFormulas={setMatrixFormulas}
        />
      )}

      {matrixDimension === "VEHICLE_CATEGORY" && (
        <VehicleCategoryEditor
          matrixTariffs={matrixTariffs}
          setMatrixTariffs={setMatrixTariffs}
        />
      )}

      {(matrixDimension === "TIERCE_COMPLETE" || matrixDimension === "TIERCE_COLLISION") && (
        <TierceEditor
          matrixDimension={matrixDimension}
          tierceCategories={tierceCategories}
          setTierceCategories={setTierceCategories}
          tierceVehicleCategory={tierceVehicleCategory}
          setTierceVehicleCategory={setTierceVehicleCategory}
          categoryTariffs={categoryTariffs}
          setCategoryTariffs={setCategoryTariffs}
          newCategoryInput={newCategoryInput}
          setNewCategoryInput={setNewCategoryInput}
          matrixDefaultPrime={matrixDefaultPrime}
          setMatrixDefaultPrime={setMatrixDefaultPrime}
        />
      )}
    </div>
  );
}
