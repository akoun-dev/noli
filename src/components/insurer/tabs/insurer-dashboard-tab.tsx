"use client";

import { useAppStore } from "@/store/app-store";
import { useEffect, useState } from "react";
import {
  FileText,
  TrendingUp,
  Shield,
  DollarSign,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RecentQuote {
  id: string;
  reference: string;
  clientName: string;
  category: string;
  status: string;
  estimatedPrice: number | null;
  createdAt: string;
}

const kpiCards = [
  {
    label: "Devis reçus (7j)",
    value: "12",
    change: "+3",
    trend: "up" as const,
    icon: FileText,
    description: "derniers 7 jours",
  },
  {
    label: "Devis reçus (30j)",
    value: "45",
    change: "+12",
    trend: "up" as const,
    icon: FileText,
    description: "derniers 30 jours",
  },
  {
    label: "Taux de transformation",
    value: "68%",
    change: "+5%",
    trend: "up" as const,
    icon: TrendingUp,
    description: "devis → contrats",
  },
  {
    label: "Contrats actifs",
    value: "23",
    change: "+2",
    trend: "up" as const,
    icon: Shield,
    description: "en cours",
  },
  {
    label: "Chiffre d'affaires",
    value: "4 500 000 FCFA",
    change: "+800 000",
    trend: "up" as const,
    icon: DollarSign,
    description: "ce mois",
  },
  {
    label: "Sinistres en cours",
    value: "3",
    change: "-1",
    trend: "down" as const,
    icon: AlertTriangle,
    description: "à traiter",
  },
];

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

export function InsurerDashboardTab() {
  const { user } = useAppStore();
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);

  useEffect(() => {
    fetch("/api/quotes?all=true&limit=5")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentQuotes(
            data.slice(0, 5).map((q: Record<string, unknown>) => ({
              id: q.id as string,
              reference: (q.reference as string) || "—",
              clientName:
                ((q.personalData as Record<string, unknown>)?.lastName as string) || "—",
              category:
                ((q.category as Record<string, unknown>)?.name as string) || "—",
              status: (q.status as string) || "DRAFT",
              estimatedPrice: (q.estimatedPrice as number) || null,
              createdAt: q.createdAt as string,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold">
          Bienvenue, {user.name || "Assureur"} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Voici un aperçu de votre activité sur NOLI Assurance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span
                      className={
                        kpi.trend === "up" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {kpi.change}
                    </span>
                    <span className="text-muted-foreground">
                      vs période préc.
                    </span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Quotes Table */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h3 className="text-lg font-semibold">Devis récents</h3>
            <p className="text-sm text-muted-foreground">
              Les 5 derniers devis reçus
            </p>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Montant estimé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuotes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Chargement des devis...
                  </TableCell>
                </TableRow>
              ) : (
                recentQuotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      {q.reference}
                    </TableCell>
                    <TableCell>{q.clientName}</TableCell>
                    <TableCell>{q.category}</TableCell>
                    <TableCell>
                      {q.estimatedPrice
                        ? new Intl.NumberFormat("fr-FR").format(q.estimatedPrice) +
                          " FCFA"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-medium border-0 ${
                          statusColors[q.status] || statusColors.DRAFT
                        }`}
                      >
                        {statusLabels[q.status] || q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.createdAt
                        ? new Date(q.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}