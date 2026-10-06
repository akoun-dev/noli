"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Coverage } from "./types";

interface CommonParamsProps {
  metadata: Record<string, unknown>;
  setMetadata: Dispatch<SetStateAction<Record<string, unknown>>>;
  coverages: Coverage[];
}

/* Paramètres communs (montants, capital, garantie requise, franchise) */
export function CommonParams({ metadata, setMetadata, coverages }: CommonParamsProps) {
  return (
    <>
      <Separator />
      <div className="rounded-lg border border-dashed p-4 space-y-4">
        <Label className="text-base font-semibold">Paramètres communs</Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Montant minimum (FCFA)</Label>
            <Input
              type="number"
              value={(metadata.minAmount as number) ?? ""}
              onChange={(e) =>
                setMetadata({ ...metadata, minAmount: e.target.value ? Number(e.target.value) : "" })
              }
              placeholder="Aucun minimum"
            />
          </div>
          <div>
            <Label>Montant maximum (FCFA)</Label>
            <Input
              type="number"
              value={(metadata.maxAmount as number) ?? ""}
              onChange={(e) =>
                setMetadata({ ...metadata, maxAmount: e.target.value ? Number(e.target.value) : "" })
              }
              placeholder="Aucun maximum"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Capital (FCFA)</Label>
            <Input
              type="number"
              value={(metadata.capital as number) ?? ""}
              onChange={(e) =>
                setMetadata({ ...metadata, capital: e.target.value ? Number(e.target.value) : "" })
              }
              placeholder="Ex: 3000000 (Avance sur recours)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Capitale de garantie si applicable
            </p>
          </div>
          <div>
            <Label>Garantie requise (code)</Label>
            <Select
              value={(metadata.requiresGuarantee as string) || ""}
              onValueChange={(v) =>
                setMetadata({ ...metadata, requiresGuarantee: v })
              }
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {coverages
                  .filter((c) => c.isActive)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Code de la garantie nécessaire pour activer celle-ci
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="font-medium">Franchise</Label>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-xs">Type de franchise</Label>
              <Select
                value={(metadata.franchiseType as string) || "__none__"}
                onValueChange={(v) =>
                  setMetadata({
                    ...metadata,
                    franchiseType: v === "__none__" ? "" : v,
                    franchiseEnabled: v !== "__none__",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucune franchise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune franchise</SelectItem>
                  <SelectItem value="PERCENT">Pourcentage (%)</SelectItem>
                  <SelectItem value="AMOUNT">Montant fixe (FCFA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(metadata.franchiseType as string) && (metadata.franchiseType as string) !== "__none__" && (
              <>
                <div>
                  <Label className="text-xs">
                    {metadata.franchiseType === "AMOUNT" ? "Montant (FCFA)" : "Taux (%)"}
                  </Label>
                  <Input
                    type="number"
                    step={(metadata.franchiseType as string) === "PERCENT" ? "0.01" : "1"}
                    value={(metadata.franchiseValue as number) ?? ""}
                    onChange={(e) =>
                      setMetadata({
                        ...metadata,
                        franchiseValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min (FCFA)</Label>
                    <Input
                      type="number"
                      value={(metadata.franchiseMin as number) ?? ""}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          franchiseMin: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max (FCFA)</Label>
                    <Input
                      type="number"
                      value={(metadata.franchiseMax as number) ?? ""}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          franchiseMax: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
