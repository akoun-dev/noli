"use client";

import { Shield, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function InsurerContractsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Contrats</h2>
        <p className="text-muted-foreground mt-1">
          Suivez les contrats souscrits via vos offres.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p>
            Les contrats apparaissent ici automatiquement lorsqu&apos;un devis
            que vous avez approuvé est finalisé par le client. Vous pouvez
            consulter les détails et gérer le suivi de chaque contrat.
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
                <TableHead>Offre</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="py-0">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      Aucun contrat souscrit via votre entreprise
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      Les contrats seront visibles ici après l&apos;approbation
                      et la finalisation d&apos;un devis par un client.
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