"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Filter, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Types ── */
interface Quote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  notes: string | null;
  createdAt: string;
  category?: { name: string } | null;
  offer?: { insurer?: { name: string } | null; name: string } | null;
}

/* ── Helpers ── */
const formatFCFA = (amount: number | null | undefined) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  PENDING: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  APPROVED: {
    label: "Approuvé",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  REJECTED: {
    label: "Rejeté",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const filterTabs = [
  { id: "all", label: "Tous" },
  { id: "DRAFT", label: "Brouillons" },
  { id: "PENDING", label: "En attente" },
  { id: "APPROVED", label: "Approuvés" },
  { id: "REJECTED", label: "Rejetés" },
];

/* ── Component ── */
export function UserQuotesTab() {
  const { user } = useAppStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchQuotes = useCallback(async () => {
    if (!user.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/quotes`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuotes(Array.isArray(data) ? data : data.quotes ?? []);
    } catch {
      // Ne pas masquer une panne derrière « Aucun devis » : on signale l'erreur.
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filtered =
    activeFilter === "all"
      ? quotes
      : quotes.filter((q) => q.status === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Mes Devis</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Suivez l&apos;état de vos demandes de devis.
        </p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {filterTabs.map((tab) => {
          const count =
            tab.id === "all"
              ? quotes.length
              : quotes.filter((q) => q.status === tab.id).length;
          const isActive = activeFilter === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`rounded-full text-xs shrink-0 ${
                isActive
                  ? "bg-brand text-black hover:bg-brand-hover"
                  : ""
              }`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 opacity-70">({count})</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        /* Error state — ne pas confondre panne et absence de devis */
        <div className="text-center py-16">
          <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Impossible de charger vos devis
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Une erreur s&apos;est produite. Vérifiez votre connexion et réessayez.
          </p>
          <Button variant="outline" onClick={fetchQuotes}>
            Réessayer
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-16"
        >
          <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun devis trouvé</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {activeFilter === "all"
              ? "Vous n'avez pas encore de devis. Commencez une comparaison pour recevoir vos premières offres."
              : `Aucun devis avec le statut "${statusConfig[activeFilter]?.label || activeFilter}".`}
          </p>
        </motion.div>
      ) : (
        /* Quote cards */
        <div className="space-y-3">
          {filtered.map((q, i) => {
            const cfg = statusConfig[q.status] || {
              label: q.status,
              color: "bg-gray-100 text-gray-700",
            };
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Card className="rounded-xl border bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="rounded-lg bg-muted p-2.5 shrink-0 mt-0.5">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {q.offer?.name || q.category?.name || "Devis"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Réf : {q.reference}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {q.category && (
                              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                                {q.category.name}
                              </span>
                            )}
                            {q.offer?.insurer?.name && (
                              <span className="text-xs text-muted-foreground">
                                {q.offer.insurer.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right info */}
                      <div className="flex items-center gap-4 sm:gap-6 sm:text-right shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {q.estimatedPrice != null ? "Prix estimé" : "Prix"}
                          </p>
                          <p className="text-sm font-semibold mt-0.5">
                            {formatFCFA(q.estimatedPrice ?? q.finalPrice)}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm mt-0.5">{formatDate(q.createdAt)}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}