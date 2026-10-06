"use client";

import { Dispatch, SetStateAction } from "react";
import { ShieldCheck, Pencil, Trash2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { PAGE_SIZE, calcBadge, calcLabel } from "./constants";
import { displayCoveragePrice } from "./defaults";
import type { Coverage } from "./types";

interface GuaranteesTableProps {
  loading: boolean;
  error: string | null;
  coverages: Coverage[];
  filteredCoverages: Coverage[];
  pagedCoverages: Coverage[];
  searchQuery: string;
  handleSearchChange: (value: string) => void;
  page: number;
  pageCount: number;
  setPage: Dispatch<SetStateAction<number>>;
  openEdit: (item: Coverage) => void;
  setDeleteTarget: Dispatch<SetStateAction<Coverage | null>>;
}

/* Tableau des garanties avec recherche et pagination */
export function GuaranteesTable({
  loading,
  error,
  coverages,
  filteredCoverages,
  pagedCoverages,
  searchQuery,
  handleSearchChange,
  page,
  pageCount,
  setPage,
  openEdit,
  setDeleteTarget,
}: GuaranteesTableProps) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Search bar */}
      <div className="p-4 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher par nom, code, catégorie, type…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm bg-muted/30 border-muted focus-visible:bg-background transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">
            {searchQuery.trim()
              ? `${filteredCoverages.length} résultat${filteredCoverages.length > 1 ? "s" : ""} sur ${coverages.length} garantie${coverages.length > 1 ? "s" : ""}`
              : `${coverages.length} garantie${coverages.length > 1 ? "s" : ""} configurée${coverages.length > 1 ? "s" : ""}`
            }
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="flex-1" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <ShieldCheck className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : coverages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              Aucune garantie configurée
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Cliquez sur &quot;Ajouter une garantie&quot; pour créer votre
              première garantie.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="min-w-[160px]">Nom</TableHead>
                <TableHead className="hidden md:table-cell min-w-[130px]">
                  Catégorie
                </TableHead>
                <TableHead className="hidden lg:table-cell min-w-[120px]">
                  Type de calcul
                </TableHead>
                <TableHead className="text-center w-[100px]">Obligatoire</TableHead>
                <TableHead className="min-w-[120px]">Prix</TableHead>
                <TableHead className="w-[90px]">Statut</TableHead>
                <TableHead className="text-right w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoverages.length === 0 && searchQuery.trim() ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Aucune garantie ne correspond à &quot;{searchQuery}&quot;
                      </p>
                      <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
                        Effacer la recherche
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedCoverages.map((cov) => (
                <TableRow key={cov.id}>
                  <TableCell className="font-medium">{cov.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {cov.category?.name || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${calcBadge[cov.calculationType] ?? ""}`}
                    >
                      {calcLabel[cov.calculationType] || cov.calculationType}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {cov.isMandatory ? (
                      <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        Oui
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Non
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-[160px] truncate" title={displayCoveragePrice(cov)}>
                    {displayCoveragePrice(cov)}
                  </TableCell>
                  <TableCell>
                    {cov.isActive ? (
                      <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Modifier la garantie ${cov.name}`}
                        onClick={() => openEdit(cov)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={`Supprimer la garantie ${cov.name}`}
                        onClick={() => setDeleteTarget(cov)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        )}
      </div>

      {!loading && !error && filteredCoverages.length > 0 && (
        <div className="px-4 pb-4">
          <PaginationControls
            page={page}
            pageCount={pageCount}
            total={filteredCoverages.length}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}
