"use client";

import { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDefaultFiscalPowerTariffs } from "../defaults";
import type { MatrixTariff } from "../types";

interface FiscalPowerEditorProps {
  matrixTariffs: MatrixTariff[];
  setMatrixTariffs: Dispatch<SetStateAction<MatrixTariff[]>>;
  matrixDefaultPrime: number;
  setMatrixDefaultPrime: Dispatch<SetStateAction<number>>;
}

/* Éditeur de matrice selon la puissance fiscale (CV) et le carburant */
export function FiscalPowerEditor({
  matrixTariffs,
  setMatrixTariffs,
  matrixDefaultPrime,
  setMatrixDefaultPrime,
}: FiscalPowerEditorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Définissez les tarifs selon le type de carburant et la puissance fiscale (CV).
      </p>
      {(!matrixTariffs || matrixTariffs.length === 0) ? (
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Aucun tarif configuré</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setMatrixTariffs(getDefaultFiscalPowerTariffs())}>
            <Plus className="h-4 w-4 mr-2" />Initialiser avec tarifs par défaut
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["Essence", "Diesel"] as const).map((fuelType) => (
            <div key={fuelType} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">{fuelType}</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  setMatrixTariffs([...matrixTariffs, { key: `${fuelType.toLowerCase()}_${Date.now()}`, fuelType, fiscalPowerMin: 1, fiscalPowerMax: 99, prime: 0 }]);
                }}>
                  <Plus className="h-3 w-3 mr-1" />Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {matrixTariffs.filter((t) => t.fuelType === fuelType).map((tariff) => (
                  <div key={tariff.key} className="flex items-center gap-2">
                    <Input type="number" className="h-8 w-16 text-sm" placeholder="Min" value={tariff.fiscalPowerMin || ""} onChange={(e) => {
                      setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, fiscalPowerMin: parseInt(e.target.value) || 1 } : t));
                    }} />
                    <span className="text-xs text-muted-foreground">-</span>
                    <Input type="number" className="h-8 w-16 text-sm" placeholder="Max" value={tariff.fiscalPowerMax === 99 ? "" : tariff.fiscalPowerMax} onChange={(e) => {
                      setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, fiscalPowerMax: parseInt(e.target.value) || 99 } : t));
                    }} />
                    <span className="text-xs bg-muted px-2 py-1 rounded">CV</span>
                    <Input type="number" className="h-8 w-24 text-sm" placeholder="Tarif" value={tariff.prime || ""} onChange={(e) => {
                      setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, prime: parseInt(e.target.value) || 0 } : t));
                    }} />
                    <span className="text-xs text-muted-foreground">FCFA</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      aria-label="Supprimer cette ligne de tarif"
                      onClick={() => setMatrixTariffs(matrixTariffs.filter(t => t.key !== tariff.key))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div>
        <Label>Prime par défaut (FCFA) — optionnel</Label>
        <Input type="number" value={matrixDefaultPrime || ""} onChange={(e) => setMatrixDefaultPrime(parseInt(e.target.value) || 0)} placeholder="0" />
        <p className="text-xs text-muted-foreground mt-1">Utilisée si aucune correspondance n&apos;est trouvée dans la matrice</p>
      </div>
    </div>
  );
}
