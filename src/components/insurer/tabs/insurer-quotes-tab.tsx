"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QuoteRow {
  id: string;
  reference: string;
  clientName: string;
  categoryName: string;
  offerName: string;
  estimatedPrice: number | null;
  status: string;
  createdAt: string;
}

const statusFilters = [
  { id: "all", label: "Tous" },
  { id: "DRAFT", label: "Brouillons" },
  { id: "PENDING", label: "En attente" },
  { id: "APPROVED", label: "Approuvés" },
  { id: "REJECTED", label: "Refusés" },
] as const;

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

const statusIcons: Record<string, React.ReactNode> = {
  DRAFT: <FileEdit className="h-3.5 w-3.5" />,
  PENDING: <Clock className="h-3.5 w-3.5" />,
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
};

export function InsurerQuotesTab() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchQuotes = useCallback(() => {
    // Fetch all quotes (insurer sees all — in production, filter by insurerId)
    fetch("/api/quotes?all=true&limit=100")
      .then((r) => {
        if (!r.ok) throw new Error("Erreur serveur");
        return r.json();
      })
      .then((data) => {
        const raw = data.quotes || data;
        if (Array.isArray(raw)) {
          setQuotes(
            raw.map((q: Record<string, unknown>) => ({
              id: q.id as string,
              reference: (q.reference as string) || "—",
              clientName:
                ((q.user as Record<string, unknown>)?.firstName as string)
                ? [((q.user as Record<string, unknown>)?.firstName as string), ((q.user as Record<string, unknown>)?.lastName as string)].filter(Boolean).join(" ")
                : ((q.personalData as Record<string, unknown>)?.lastName as string) || "—",
              categoryName:
                ((q.category as Record<string, unknown>)?.name as string) || "—",
              offerName:
                ((q.offer as Record<string, unknown>)?.name as string) || "—",
              estimatedPrice: (q.estimatedPrice as number) || null,
              status: (q.status as string) || "DRAFT",
              createdAt: q.createdAt as string,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes =
    activeFilter === "all"
      ? quotes
      : quotes.filter((q) => q.status === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Devis Reçus</h2>
        <p className="text-muted-foreground mt-1">
          Consultez et gérez les devis soumis par les clients.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Button
            key={f.id}
            variant={activeFilter === f.id ? "default" : "outline"}
            size="sm"
            className={
              activeFilter === f.id
                ? "bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                : ""
            }
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({quotes.filter((q) => q.status === f.id).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun devis trouvé</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {activeFilter !== "all"
                ? `Aucun devis avec le statut "${statusLabels[activeFilter]}". Essayez un autre filtre.`
                : "Aucun devis n'a été soumis pour le moment. Les devis apparaissent ici lorsqu'un client en demande un."}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Offre</TableHead>
                  <TableHead>Montant estimé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      {q.reference}
                    </TableCell>
                    <TableCell>{q.clientName}</TableCell>
                    <TableCell>{q.categoryName}</TableCell>
                    <TableCell>{q.offerName}</TableCell>
                    <TableCell>
                      {q.estimatedPrice
                        ? new Intl.NumberFormat("fr-FR").format(
                            q.estimatedPrice
                          ) + " FCFA"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-medium border-0 gap-1 ${
                          statusColors[q.status] || statusColors.DRAFT
                        }`}
                      >
                        {statusIcons[q.status]}
                        {statusLabels[q.status] || q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {q.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 h-8 text-xs disabled:opacity-50"
                            disabled
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Accepter
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 text-xs disabled:opacity-50"
                            disabled
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Refuser
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-8 text-xs disabled:opacity-50"
                            disabled
                          >
                            <FileEdit className="mr-1 h-3.5 w-3.5" />
                            Contre-proposition
                          </Button>
                        </div>
                      )}
                      {q.status === "DRAFT" && (
                        <span className="text-xs text-muted-foreground">
                          En attente de soumission
                        </span>
                      )}
                      {q.status === "APPROVED" && (
                        <span className="text-xs text-green-600">Traité</span>
                      )}
                      {q.status === "REJECTED" && (
                        <span className="text-xs text-red-600">Traité</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}