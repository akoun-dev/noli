"use client";

import { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { calcBadge, calcLabel } from "./constants";
import { Step1BasicInfo } from "./step1-basic-info";
import { Step2CalcType } from "./step2-calc-type";
import { Step3Tariffs } from "./step3-tariffs";
import { CommonParams } from "./common-params";
import type {
  Coverage,
  CoverageCategory,
  InsCatOption,
  CalculationType,
  Step1Data,
  MatrixTariff,
  FormulaConfig,
  CategoryTariff,
} from "./types";

interface GuaranteeWizardDialogProps {
  dialogOpen: boolean;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
  editingItem: Coverage | null;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  step1: Step1Data;
  setStep1: Dispatch<SetStateAction<Step1Data>>;
  calcType: CalculationType | "";
  setCalcType: Dispatch<SetStateAction<CalculationType | "">>;
  metadata: Record<string, unknown>;
  setMetadata: Dispatch<SetStateAction<Record<string, unknown>>>;
  saving: boolean;
  handleSave: () => void;
  categories: CoverageCategory[];
  insuranceCategories: InsCatOption[];
  coverages: Coverage[];
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

/* Dialog du wizard de création/édition de garantie (3 étapes) */
export function GuaranteeWizardDialog(props: GuaranteeWizardDialogProps) {
  const {
    dialogOpen,
    setDialogOpen,
    editingItem,
    step,
    setStep,
    step1,
    setStep1,
    calcType,
    setCalcType,
    metadata,
    setMetadata,
    saving,
    handleSave,
    categories,
    insuranceCategories,
    coverages,
    setMatrixTariffs,
    setMatrixFormulas,
    setCategoryTariffs,
  } = props;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-5xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Modifier la garantie" : "Nouvelle garantie"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step > s
                    ? "bg-emerald-500 text-white"
                    : step === s
                      ? "bg-brand text-black"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-12 ${
                    step > s ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[70vh] pr-4">
          {/* Step 1: Basic info */}
          {step === 1 && (
            <Step1BasicInfo
              step1={step1}
              setStep1={setStep1}
              categories={categories}
              insuranceCategories={insuranceCategories}
            />
          )}

          {/* Step 2: Calculation type selection */}
          {step === 2 && (
            <Step2CalcType
              calcType={calcType}
              setCalcType={setCalcType}
              setMetadata={setMetadata}
              setMatrixTariffs={setMatrixTariffs}
              setMatrixFormulas={setMatrixFormulas}
              setCategoryTariffs={setCategoryTariffs}
            />
          )}

          {/* Step 3: Calculation config */}
          {step === 3 && (
            <div className="py-2 space-y-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge className={calcBadge[calcType] ?? ""}>
                  {calcLabel[calcType] ?? calcType}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  — Configuration
                </span>
              </div>
              <Step3Tariffs
                calcType={calcType}
                metadata={metadata}
                setMetadata={setMetadata}
                matrixDimension={props.matrixDimension}
                setMatrixDimension={props.setMatrixDimension}
                matrixTariffs={props.matrixTariffs}
                setMatrixTariffs={setMatrixTariffs}
                matrixFormulas={props.matrixFormulas}
                setMatrixFormulas={setMatrixFormulas}
                matrixDefaultPrime={props.matrixDefaultPrime}
                setMatrixDefaultPrime={props.setMatrixDefaultPrime}
                categoryTariffs={props.categoryTariffs}
                setCategoryTariffs={setCategoryTariffs}
                tierceVehicleCategory={props.tierceVehicleCategory}
                setTierceVehicleCategory={props.setTierceVehicleCategory}
                tierceCategories={props.tierceCategories}
                setTierceCategories={props.setTierceCategories}
                newCategoryInput={props.newCategoryInput}
                setNewCategoryInput={props.setNewCategoryInput}
              />
              {calcType && (
                <CommonParams
                  metadata={metadata}
                  setMetadata={setMetadata}
                  coverages={coverages}
                />
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
          )}
          {step < 3 && (
            <Button
              className="bg-brand text-black hover:bg-brand-hover"
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !step1.name.trim()) || (step === 2 && !calcType)}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 3 && (
            <Button
              className="bg-brand text-black hover:bg-brand-hover"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingItem ? "Enregistrer" : "Créer la garantie"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
