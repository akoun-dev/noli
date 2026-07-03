"use client";

import { Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, SlidersHorizontal } from "lucide-react";

export function InsurerClientsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Clients</h2>
        <p className="text-muted-foreground mt-1">
          Gérez votre portefeuille client.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-9"
            disabled
          />
        </div>
        <Button variant="outline" disabled>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filtres
        </Button>
      </div>

      {/* Empty state */}
      <div className="rounded-xl border bg-card">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="text-center">Devis</TableHead>
                <TableHead className="text-center">Contrats</TableHead>
                <TableHead>Date inscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="py-0">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">
                      Aucun client trouvé
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                      Les clients apparaissent ici lorsqu&apos;ils soumettent un
                      devis incluant l&apos;une de vos offres d&apos;assurance.
                      Continuez à optimiser vos offres pour attirer davantage de
                      clients.
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