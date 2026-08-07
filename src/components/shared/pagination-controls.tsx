"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  className?: string;
}

/**
 * Contrôles de pagination standard (précédent / suivant + compteur).
 * - page      : page courante (1-based)
 * - pageCount : nombre total de pages
 * - total     : nombre total d'éléments (affiché)
 * - pageSize  : taille de page réelle (par défaut 50) — sert au compteur from–to
 */
export function PaginationControls({
  page,
  pageCount,
  total,
  onPageChange,
  pageSize = 50,
  className,
}: PaginationControlsProps) {
  if (total <= 0) return null;

  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safePageCount);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 pt-4",
        className
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Page {safePage} / {safePageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= safePageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Suivant
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Clamp la page courante quand elle dépasse le nombre de pages
 * (ex. après suppression de la dernière entrée d'une page).
 */
export function usePaginationClamp(
  page: number,
  setPage: (p: number) => void,
  pageCount: number
) {
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount, setPage]);
}
