"use client";

import { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatrixTariff } from "../types";

interface VehicleCategoryEditorProps {
  matrixTariffs: MatrixTariff[];
  setMatrixTariffs: Dispatch<SetStateAction<MatrixTariff[]>>;
}

/* Éditeur de matrice par catégorie de véhicule (401, 402, etc.) */
export function VehicleCategoryEditor({ matrixTariffs, setMatrixTariffs }: VehicleCategoryEditorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Définissez les primes par catégorie de véhicule (401, 402, etc.).
      </p>
      {(!matrixTariffs || matrixTariffs.length === 0) ? (
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Aucun tarif configuré</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setMatrixTariffs([
            { key: `vc_401_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "401" },
            { key: `vc_402_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "402" },
            { key: `vc_412_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "412" },
          ])}>
            <Plus className="h-4 w-4 mr-2" />Initialiser avec catégories par défaut
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {matrixTariffs.map((tariff) => (
            <div key={tariff.key} className="flex items-center gap-2">
              <Input type="text" className="h-8 w-20 text-sm shrink-0" placeholder="Code" value={tariff.vehicleCategory || ""} onChange={(e) => {
                setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, vehicleCategory: e.target.value } : t));
              }} />
              <Input type="number" className="h-8 flex-1 text-sm" placeholder="Prime FCFA" value={tariff.prime || ""} onChange={(e) => {
                setMatrixTariffs(matrixTariffs.map(t => t.key === tariff.key ? { ...t, prime: parseInt(e.target.value) || 0 } : t));
              }} />
              <span className="text-xs text-muted-foreground shrink-0">FCFA</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0 text-destructive"
                aria-label="Supprimer cette catégorie de véhicule"
                onClick={() => setMatrixTariffs(matrixTariffs.filter(t => t.key !== tariff.key))}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => {
            setMatrixTariffs([...matrixTariffs, { key: `vc_${Date.now()}`, fuelType: "Essence", fiscalPowerMin: 0, fiscalPowerMax: 0, prime: 0, vehicleCategory: "" }]);
          }}>
            <Plus className="h-3 w-3 mr-1" />Ajouter une catégorie
          </Button>
        </div>
      )}
    </div>
  );
}
