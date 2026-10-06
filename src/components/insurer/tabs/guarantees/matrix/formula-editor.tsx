"use client";

import { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getDefaultFormulas } from "../defaults";
import type { FormulaConfig } from "../types";

interface FormulaEditorProps {
  matrixFormulas: FormulaConfig[];
  setMatrixFormulas: Dispatch<SetStateAction<FormulaConfig[]>>;
}

/* Éditeur de matrice par formule (IC/IPT) avec tarifs par nombre de places */
export function FormulaEditor({ matrixFormulas, setMatrixFormulas }: FormulaEditorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Définissez les formules avec leurs plafonds de garanties et primes.
      </p>
      {matrixFormulas.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">Aucune formule configurée</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setMatrixFormulas(getDefaultFormulas())}>
            <Plus className="h-4 w-4 mr-2" />Initialiser avec formules par défaut
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {matrixFormulas.map((formula) => (
            <div key={formula.formula} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Formule {formula.formula}</span>
                  <Input type="text" value={formula.label} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, label: e.target.value } : f))} className="h-8 w-40 text-sm" placeholder="Libellé" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  aria-label={`Supprimer la formule ${formula.formula}`}
                  onClick={() => setMatrixFormulas(matrixFormulas.filter(f => f.formula !== formula.formula))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Capital Décès (FCFA)</Label>
                    <Input type="number" className="h-8 text-sm" value={formula.capitalDeces || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, capitalDeces: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Capital Invalidité (FCFA)</Label>
                    <Input type="number" className="h-8 text-sm" value={formula.capitalInvalidite || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, capitalInvalidite: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Frais Médicaux (FCFA)</Label>
                    <Input type="number" className="h-8 text-sm" value={formula.fraisMedicaux || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, fraisMedicaux: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                  </div>
                  {!formula.usePlaces && (
                    <div>
                      <Label className="text-xs">Prime fixe (FCFA)</Label>
                      <Input type="number" className="h-8 text-sm" value={formula.prime || ""} onChange={(e) => setMatrixFormulas(matrixFormulas.map(f => f.formula === formula.formula ? { ...f, prime: parseInt(e.target.value) || 0 } : f))} placeholder="0" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-2">
                  <Checkbox
                    checked={formula.usePlaces}
                    onCheckedChange={(v) => {
                      const checked = !!v;
                      setMatrixFormulas(matrixFormulas.map(f =>
                        f.formula === formula.formula
                          ? {
                              ...f,
                              usePlaces: checked,
                              placesTariffs: checked
                                ? (f.placesTariffs && f.placesTariffs.length > 0)
                                  ? f.placesTariffs
                                  : [{ places: 2, prime: 0, label: "2 places" }]
                                : undefined,
                            }
                          : f
                      ));
                    }}
                    id={`use-places-${formula.formula}`}
                  />
                  <label htmlFor={`use-places-${formula.formula}`} className="text-xs cursor-pointer">
                    Basée sur le nombre de places
                  </label>
                </div>
                {formula.usePlaces && formula.placesTariffs && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Tarif par nombre de places (FCFA)</Label>
                    {formula.placesTariffs.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-24">
                          <Label className="text-[10px] text-muted-foreground">Places</Label>
                          <Input
                            type="number"
                            className="h-8 text-sm"
                            value={pt.places || ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const newTariffs = (formula.placesTariffs || []).map((t, i) =>
                                i === idx ? { ...t, places: val, label: `${val} place${val > 1 ? "s" : ""}` } : t
                              );
                              setMatrixFormulas(matrixFormulas.map(f =>
                                f.formula === formula.formula ? { ...f, placesTariffs: newTariffs } : f
                              ));
                            }}
                            min={1}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-[10px] text-muted-foreground">Prime (FCFA)</Label>
                          <Input
                            type="number"
                            className="h-8 text-sm"
                            value={pt.prime || ""}
                            onChange={(e) => {
                              const newTariffs = (formula.placesTariffs || []).map((t, i) =>
                                i === idx ? { ...t, prime: parseInt(e.target.value) || 0 } : t
                              );
                              setMatrixFormulas(matrixFormulas.map(f =>
                                f.formula === formula.formula ? { ...f, placesTariffs: newTariffs } : f
                              ));
                            }}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive mt-4"
                          aria-label="Supprimer cette ligne de tarif"
                          onClick={() => {
                            const newTariffs = (formula.placesTariffs || []).filter((_, i) => i !== idx);
                            setMatrixFormulas(matrixFormulas.map(f =>
                              f.formula === formula.formula ? { ...f, placesTariffs: newTariffs } : f
                            ));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const existing = formula.placesTariffs || [];
                        const maxPlaces = existing.length > 0 ? Math.max(...existing.map(p => p.places)) : 1;
                        const nextPlaces = maxPlaces + 1;
                        setMatrixFormulas(matrixFormulas.map(f =>
                          f.formula === formula.formula
                            ? { ...f, placesTariffs: [...existing, { places: nextPlaces, prime: 0, label: `${nextPlaces} place${nextPlaces > 1 ? "s" : ""}` }] }
                            : f
                        ));
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />Ajouter une tranche
                    </Button>
                  </div>
                )}
              </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => {
            const nextNum = matrixFormulas.length > 0 ? Math.max(...matrixFormulas.map(f => f.formula)) + 1 : 1;
            setMatrixFormulas([...matrixFormulas, { formula: nextNum, label: `Formule ${nextNum}`, capitalDeces: 0, capitalInvalidite: 0, fraisMedicaux: 0, prime: 0, usePlaces: false }]);
          }}>
            <Plus className="h-3 w-3 mr-1" />Ajouter une formule
          </Button>
        </div>
      )}
    </div>
  );
}
