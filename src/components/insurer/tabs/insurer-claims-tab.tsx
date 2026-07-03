"use client";

import { AlertTriangle, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function InsurerClaimsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Sinistres</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les déclarations de sinistres liées à vos contrats.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p>
            Lorsqu&apos;un client déclare un sinistre sur un contrat actif,
            la déclaration apparaît ici pour suivi. Vous pouvez évaluer le
            dossier, demander des pièces justificatives et traiter
            l&apos;indemnisation.
          </p>
        </div>
      </div>

      {/* Empty table */}
      <div className="rounded-xl border bg-card">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="py-0">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      Aucune déclaration de sinistre
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      Les déclarations de sinistres de vos clients
                      apparaîtront ici. Vous pourrez alors les évaluer et les
                      traiter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}