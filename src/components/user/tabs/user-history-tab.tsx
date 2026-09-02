"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { History, Search, Filter, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app-store";

/* ── Types ── */
interface Quote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  category?: { name: string } | null;
  offer?: { insurer?: { name: string } | null; name: string } | null;
}

/* ── Helpers ── */
const formatFCFA = (amount: number | null | undefined) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const formatDateTime = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const statusLabel: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
};

const filters = ["Toutes", "Aujourd'hui", "Cette semaine", "Ce mois"] as const;
type FilterKey = (typeof filters)[number];

/** Renvoie true si `dateStr` est dans la fenêtre du filtre choisi. */
function inRange(dateStr: string, filter: FilterKey): boolean {
  if (filter === "Toutes") return true;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (filter === "Aujourd'hui") {
    return d.toDateString() === now.toDateString();
  }
  if (filter === "Cette semaine") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  // Ce mois
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/* ── Component ── */
export function UserHistoryTab() {
  const { user, setView, setComparisonStep, setUserTab } = useAppStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("Toutes");

  const fetchHistory = useCallback(async () => {
    if (!user.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data : data.quotes ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const entries = [...quotes]
    .filter((q) => inRange(q.createdAt, activeFilter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const goCompare = () => {
    setComparisonStep(1);
    setView("compare");
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-bold">Historique</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Retrouvez vos comparaisons et devis précédents.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={goCompare}>
          <Search className="h-4 w-4 mr-2" />
          Nouvelle comparaison
        </Button>
      </motion.div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              activeFilter === f
                ? "bg-brand text-black font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f}
          </button>
        ))}
        <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        /* État vide */
        <div className="rounded-xl border border-dashed bg-card/40">
          <div className="p-10 text-center">
            <div className="rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 mx-auto w-fit mb-4">
              <History className="h-10 w-10 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {quotes.length === 0
                ? "Aucun historique de comparaison"
                : "Aucune activité sur cette période"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {quotes.length === 0
                ? "Chaque comparaison qui aboutit à un devis apparaîtra ici, pour retrouver facilement vos recherches."
                : "Essayez un autre filtre de période, ou lancez une nouvelle comparaison."}
            </p>
            <Button
              className="bg-brand text-black hover:bg-brand-hover rounded-full shadow-sm"
              onClick={goCompare}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Effectuer une comparaison
            </Button>
          </div>
        </div>
      ) : (
        /* Timeline des comparaisons / devis */
        <div className="relative pl-6 border-l-2 border-muted space-y-4">
          {entries.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="relative"
            >
              <div className="absolute -left-[31px] top-1.5 bg-card p-1 rounded-full border border-border">
                <FileText className="h-3.5 w-3.5 text-brand" />
              </div>
              <button
                onClick={() => setUserTab("quotes")}
                className="w-full text-left rounded-xl border bg-card hover:shadow-md transition-shadow p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {q.offer?.name || q.category?.name || "Comparaison"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Réf : {q.reference} · {formatDateTime(q.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatFCFA(q.estimatedPrice ?? q.finalPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                      {statusLabel[q.status] || q.status}
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
