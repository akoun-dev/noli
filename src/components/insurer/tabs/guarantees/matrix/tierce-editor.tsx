"use client";

import { Dispatch, SetStateAction } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VN_RANGES, FRANCHISE_LEVELS } from "../constants";
import { getDefaultCategoryTariffs } from "../defaults";
import type { CategoryTariff } from "../types";

interface TierceEditorProps {
  matrixDimension: string;
  tierceCategories: string[];
  setTierceCategories: Dispatch<SetStateAction<string[]>>;
  tierceVehicleCategory: string;
  setTierceVehicleCategory: Dispatch<SetStateAction<string>>;
  categoryTariffs: CategoryTariff[];
  setCategoryTariffs: Dispatch<SetStateAction<CategoryTariff[]>>;
  newCategoryInput: string;
  setNewCategoryInput: Dispatch<SetStateAction<string>>;
  matrixDefaultPrime: number;
  setMatrixDefaultPrime: Dispatch<SetStateAction<number>>;
}

/* Éditeur de grille Tierce (complète/collision) : tranches VN × franchises par catégorie */
export function TierceEditor({
  matrixDimension,
  tierceCategories,
  setTierceCategories,
  tierceVehicleCategory,
  setTierceVehicleCategory,
  categoryTariffs,
  setCategoryTariffs,
  newCategoryInput,
  setNewCategoryInput,
  matrixDefaultPrime,
  setMatrixDefaultPrime,
}: TierceEditorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {matrixDimension === "TIERCE_COMPLETE" ? "Tierce Complète (DTA)" : "Tierce Collision (DC)"} — Taux en % de la VN selon tranche et franchise.
      </p>

      {/* Vehicle category selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm shrink-0">Catégorie véhicule</Label>
        <div className="flex gap-1 flex-wrap">
          {tierceCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-0">
              <Button
                type="button"
                variant={tierceVehicleCategory === cat ? "default" : "outline"}
                size="sm"
                className={`rounded-r-none ${tierceVehicleCategory === cat ? "bg-brand text-black hover:bg-brand-hover" : ""}`}
                onClick={() => {
                  setTierceVehicleCategory(cat);
                  setCategoryTariffs(getDefaultCategoryTariffs(
                    matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                    cat
                  ));
                }}
              >
                {cat}
              </Button>
              <Button
                type="button"
                variant={tierceVehicleCategory === cat ? "default" : "outline"}
                size="sm"
                className={`h-8 w-6 p-0 rounded-l-none border-l-0 ${tierceVehicleCategory === cat ? "bg-brand text-black hover:bg-brand-hover" : "text-muted-foreground hover:text-destructive"}`}
                onClick={() => {
                  const filtered = categoryTariffs.filter(ct => ct.vehicleCategory !== cat);
                  const remaining = tierceCategories.filter(c => c !== cat);
                  setTierceCategories(remaining);
                  setCategoryTariffs(filtered);
                  if (tierceVehicleCategory === cat && remaining.length > 0) {
                    const nextCat = remaining[0];
                    setTierceVehicleCategory(nextCat);
                    const defaults = getDefaultCategoryTariffs(
                      matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                      nextCat
                    );
                    setCategoryTariffs(defaults.length > 0 ? defaults : filtered);
                  }
                }}
                title="Supprimer la catégorie"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {/* Add category button */}
          <div className="flex items-center gap-1 ml-2">
            <Input
              className="h-7 w-20 text-xs"
              placeholder="Nouveau"
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value.replace(/[^\w]/g, "").toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCategoryInput.trim()) {
                  if (!tierceCategories.includes(newCategoryInput.trim())) {
                    setTierceCategories([...tierceCategories, newCategoryInput.trim()].sort());
                    setTierceVehicleCategory(newCategoryInput.trim());
                    setCategoryTariffs([]);
                  }
                  setNewCategoryInput("");
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={!newCategoryInput.trim() || tierceCategories.includes(newCategoryInput.trim())}
              onClick={() => {
                const cat = newCategoryInput.trim();
                if (cat && !tierceCategories.includes(cat)) {
                  setTierceCategories([...tierceCategories, cat].sort());
                  setTierceVehicleCategory(cat);
                  setCategoryTariffs([]);
                }
                setNewCategoryInput("");
              }}
              title="Ajouter la catégorie"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {categoryTariffs.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Aucune tarification configurée</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setCategoryTariffs(getDefaultCategoryTariffs(matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION", tierceVehicleCategory))}>
            <Plus className="h-4 w-4 mr-2" />Initialiser avec tarifs par défaut
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border bg-muted/50 text-xs font-medium">Tranche VN</th>
                {FRANCHISE_LEVELS.map(fl => (
                  <th key={fl.value} className="text-center p-2 border bg-muted/50 text-xs font-medium">{fl.label}</th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {VN_RANGES.map(range => {
                const rowEntries = categoryTariffs.filter(ct => ct.valueMin === range.min && ct.guaranteeType === matrixDimension && ct.vehicleCategory === tierceVehicleCategory);
                return (
                  <tr key={range.key}>
                    <td className="p-2 border font-medium text-xs whitespace-nowrap">{range.label}</td>
                    {FRANCHISE_LEVELS.map(fl => {
                      const entry = rowEntries.find(r => r.franchise === fl.value);
                      return (
                        <td key={fl.value} className="p-1 border text-center">
                          {entry ? (
                            <Input
                              type="number"
                              step="0.001"
                              className="h-7 w-20 text-xs text-center mx-auto"
                              value={entry.prime || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setCategoryTariffs(categoryTariffs.map(ct => ct.key === entry.key ? { ...ct, prime: val } : ct));
                              }}
                            />
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                const now = Date.now();
                                setCategoryTariffs([...categoryTariffs, {
                                  key: `${matrixDimension.toLowerCase()}_${tierceVehicleCategory}_${range.key}_${fl.value}_${now}`,
                                  category: range.key,
                                  guaranteeType: matrixDimension as "TIERCE_COMPLETE" | "TIERCE_COLLISION",
                                  valueMin: range.min,
                                  valueMax: range.max,
                                  valueLabel: range.label,
                                  franchise: fl.value,
                                  franchiseLabel: fl.label,
                                  prime: 0,
                                  vehicleCategory: tierceVehicleCategory,
                                }]);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      );
                    })}
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2">
            Les valeurs sont des <strong>taux en %</strong> de la VN. Ex: 4.4 = 4.4% × VN. Cliquez <span className="inline-flex align-middle"><Plus className="h-3 w-3" /></span> pour ajouter une cellule.
          </p>
        </div>
      )}
      <div>
        <Label>Prime par défaut (FCFA) — optionnel</Label>
        <Input type="number" value={matrixDefaultPrime || ""} onChange={(e) => setMatrixDefaultPrime(parseInt(e.target.value) || 0)} placeholder="0" />
        <p className="text-xs text-muted-foreground mt-1">Utilisée si aucune correspondance n&apos;est trouvée dans la grille</p>
      </div>
    </div>
  );
}
