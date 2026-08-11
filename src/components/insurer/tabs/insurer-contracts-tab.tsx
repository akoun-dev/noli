"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Info, Search, FileText, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Types ── */
interface Contract {
  id: number | string;
  reference: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  premium: number | null;
  createdAt: string;
  client?: { firstName: string | null; lastName: string | null; email: string } | null;
  offer?: { id: number | string; name: string } | null;
  quote?: { reference: string } | null;
}

/* ── Helpers ── */
const formatFCFA = (amount: number | null | undefined) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
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

const clientName = (c: Contract) => {
  const n = [c.client?.firstName, c.client?.lastName].filter(Boolean).join(" ").trim();
  return n || c.client?.email || "Client";
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: {
    label: "Actif",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  EXPIRED: {
    label: "Expiré",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  CANCELLED: {
    label: "Résilié",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function InsurerContractsTab() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/insurer/contracts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : data.contracts ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  /* ── KPIs (calculés sur les vraies données) ── */
  const now = new Date();
  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const thisMonthCount = contracts.filter((c) => {
    const d = new Date(c.createdAt);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const distinctClients = new Set(
    contracts.map((c) => c.client?.email).filter(Boolean)
  ).size;

  const term = searchTerm.trim().toLowerCase();
  const filtered = !term
    ? contracts
    : contracts.filter((c) =>
        [clientName(c), c.offer?.name, c.reference, c.quote?.reference]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="text-2xl font-bold">Contrats</h2>
        <p className="text-muted-foreground mt-1">
          Suivez les contrats souscrits via vos offres d&apos;assurance.
        </p>
      </motion.div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un contrat par client, offre ou référence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/40">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Contrats actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/40">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{thisMonthCount}</p>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/40">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{distinctClients}</p>
              <p className="text-xs text-muted-foreground">Clients souscripteurs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-xl border border-dashed bg-card/40 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-3">
            <Info className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">Impossible de charger les contrats</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Une erreur s&apos;est produite. Réessayez.
          </p>
          <button
            onClick={fetchContracts}
            className="text-sm font-medium text-primary hover:underline"
          >
            Réessayer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* État vide */
        <div className="rounded-xl border border-dashed bg-card/40">
          <div className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-green-500/10 mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold">
              {contracts.length === 0 ? "Aucun contrat souscrit" : "Aucun résultat"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {contracts.length === 0
                ? "Les contrats apparaîtront ici après l'approbation et la finalisation d'un devis par un client."
                : "Aucun contrat ne correspond à votre recherche."}
            </p>
          </div>
        </div>
      ) : (
        /* Liste des contrats */
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const cfg = statusConfig[c.status] || { label: c.status, color: "bg-gray-100 text-gray-700" };
            return (
              <motion.div
                key={c.id}
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Card className="rounded-xl border bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="rounded-lg bg-muted p-2.5 shrink-0 mt-0.5">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{clientName(c)}</p>
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {c.offer?.name || "Offre"} · Réf : {c.reference}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Depuis le {formatDate(c.startDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 sm:text-right shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground">Prime</p>
                          <p className="text-sm font-semibold tabular-nums mt-0.5">
                            {formatFCFA(c.premium)}
                          </p>
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
