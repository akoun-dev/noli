"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { variableSources } from "./constants";

interface Step3VariableBasedProps {
  metadata: Record<string, unknown>;
  setMetadata: Dispatch<SetStateAction<Record<string, unknown>>>;
}

/* Configuration VARIABLE_BASED : taux en % d'une variable du véhicule */
export function Step3VariableBased({ metadata, setMetadata }: Step3VariableBasedProps) {
  return (
    <div className="space-y-5">
      {/* Formula display */}
      <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-1">Formule de calcul</p>
        <p className="font-mono text-sm font-semibold text-orange-800 dark:text-orange-300">
          {metadata.conditionedByNewValue
            ? "Si variable ≤ seuil : variable × taux_sous / 100, sinon : variable × taux_au-dessus / 100"
            : "Prime = variableValue × (ratePercent / 100)"}
        </p>
      </div>

      {/* Variable source */}
      <div className="w-full">
        <Label>Variable source *</Label>
        <Select
          value={(metadata.variableSource as string) || "NEW_VALUE"}
          onValueChange={(v) =>
            setMetadata({ ...metadata, variableSource: v })
          }
        >
          <SelectTrigger className="w-full mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variableSources.map((vs) => (
              <SelectItem key={vs.value} value={vs.value}>
                {vs.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          La valeur du véhicule utilisée pour le calcul.
        </p>
      </div>

      {/* Base rate (always visible) */}
      <div className="w-full">
        <Label>Taux de base (%) *</Label>
        <Input
          className="w-full mt-1"
          type="number"
          step="0.01"
          placeholder="Ex: 0.8"
          value={(metadata.ratePercent as number) ?? ""}
          onChange={(e) =>
            setMetadata({
              ...metadata,
              ratePercent: parseFloat(e.target.value) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ex: 0.8 pour Incendie, 1.2 pour Vol, 0.35 pour Bris de Glaces.
        </p>
      </div>

      {/* Example calculation */}
      {!!metadata.variableSource && !!metadata.ratePercent ? (
        <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
          <p className="font-medium text-muted-foreground">Exemples de calcul :</p>
          <p className="font-mono">
            VN 18 000 000 × {(metadata.ratePercent as number) || 0}% ={" "}
            <span className="font-bold text-foreground">
              {(
                18000000 *
                ((metadata.ratePercent as number) || 0) /
                100
              ).toLocaleString("fr-FR")}{" "}
              FCFA
            </span>
          </p>
          <p className="font-mono">
            VN 10 000 000 × {(metadata.ratePercent as number) || 0}% ={" "}
            <span className="font-bold text-foreground">
              {(
                10000000 *
                ((metadata.ratePercent as number) || 0) /
                100
              ).toLocaleString("fr-FR")}{" "}
              FCFA
            </span>
          </p>
        </div>
      ) : null}

      <Separator />

      {/* Conditional toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="cond-toggle"
          checked={!!metadata.conditionedByNewValue}
          onCheckedChange={(v) =>
            setMetadata({ ...metadata, conditionedByNewValue: !!v })
          }
        />
        <Label htmlFor="cond-toggle">
          Taux conditionné par seuil de valeur neuve
        </Label>
      </div>
      {!!metadata.conditionedByNewValue && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="w-full">
            <Label className="text-xs">
              Seuil VN (FCFA)
            </Label>
            <Input
              className="w-full mt-1"
              type="number"
              placeholder="Ex: 25 000 000"
              value={(metadata.newValueThreshold as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  newValueThreshold: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-0.5">
              Si VN ≤ seuil
            </p>
          </div>
          <div className="w-full">
            <Label className="text-xs">Taux sous seuil (%)</Label>
            <Input
              className="w-full mt-1"
              type="number"
              step="0.01"
              placeholder="Ex: 1.2"
              value={(metadata.rateBelowThresholdPercent as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  rateBelowThresholdPercent:
                    parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="w-full">
            <Label className="text-xs">Taux au-dessus (%)</Label>
            <Input
              className="w-full mt-1"
              type="number"
              step="0.01"
              placeholder="Ex: 2.0"
              value={(metadata.rateAboveThresholdPercent as number) ?? ""}
              onChange={(e) =>
                setMetadata({
                  ...metadata,
                  rateAboveThresholdPercent:
                    parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
      )}

      {/* Conditional example */}
      {!!metadata.conditionedByNewValue && !!metadata.newValueThreshold ? (
        <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
          <p className="font-medium text-muted-foreground">Exemples conditionnels :</p>
          <p className="font-mono">
            VN 18M ≤ {Number(metadata.newValueThreshold).toLocaleString("fr-FR")} → VN × {(metadata.rateBelowThresholdPercent as number) || 0}% ={" "}
            <span className="font-bold text-foreground">
              {(18000000 * ((metadata.rateBelowThresholdPercent as number) || 0) / 100).toLocaleString("fr-FR")} FCFA
            </span>
          </p>
          <p className="font-mono">
            VN 35M &gt; {Number(metadata.newValueThreshold).toLocaleString("fr-FR")} → VN × {(metadata.rateAboveThresholdPercent as number) || 0}% ={" "}
            <span className="font-bold text-foreground">
              {(35000000 * ((metadata.rateAboveThresholdPercent as number) || 0) / 100).toLocaleString("fr-FR")} FCFA
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
