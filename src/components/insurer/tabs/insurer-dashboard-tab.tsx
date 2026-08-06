"use client";

import { useAppStore } from "@/store/app-store";
import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  TrendingUp,
  Shield,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Clock,
  CheckCircle2,
  Building2,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/* ── Types ── */
interface StatsData {
  totalOffers: number;
  activeOffers: number;
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  draftQuotes: number;
  totalCoverages: number;
  recentQuotes: {
    id: string;
    reference: string;
    status: string;
    estimatedPrice: number;
    finalPrice: number | null;
    createdAt: string;
    userName: string;
    vehicleInfo: string | Record<string, unknown>;
  }[];
}

/* ── Helpers ── */
const fmtPrice = (amount: number | null | undefined): string => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const fmtDate = (date: string): string =>
  new Date(date).toLocaleDateString("fr-FR");

const parseVehicleInfo = (v: string | Record<string, unknown> | null): string => {
  if (!v) return "—";
  try {
    const o = typeof v === "string" ? JSON.parse(v) : v;
    return [o.marque, o.modele].filter(Boolean).join(" ") || "—";
  } catch {
    return typeof v === "string" ? v : "—";
  }
};

const statusBadge = (status: string) => {
  const s = status?.toUpperCase();
  switch (s) {
    case "PENDING":
      return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20">En attente</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20">Approuvé</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20">Rejeté</Badge>;
    case "DRAFT":
      return <Badge className="bg-gray-500/15 text-gray-500 hover:bg-gray-500/25 border-gray-500/20">Brouillon</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};



/* ── KPI Card ── */
function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  change,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  change?: string;
}) {
  const iconBg = trend === "up"
    ? "bg-green-500/15 text-green-500"
    : trend === "down"
    ? "bg-red-500/15 text-red-500"
    : "bg-muted text-muted-foreground";

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change && trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Component ── */
export function InsurerDashboardTab() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    if (!user.id) return;
    fetch(`/api/insurer/stats?userId=${user.id}`)
      .then(async (res) => {
        setError(null);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Erreur de chargement");
        }
        return res.json();
      })
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const conversionRate = stats && stats.totalQuotes > 0
    ? Math.round((stats.approvedQuotes / stats.totalQuotes) * 100)
    : 0;

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

      {/* Error: no insurer account */}
      {!loading && error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Compte assureur non configuré</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Votre profil a été créé avec le rôle Assureur, mais il n&apos;est pas encore lié à
            une compagnie d&apos;assurance. Veuillez contacter un administrateur pour
            finaliser la configuration de votre compte.
          </p>
          <code className="text-xs text-muted-foreground/60 bg-muted px-3 py-1.5 rounded-md">
            {error}
          </code>
        </div>
      ) : null}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : !error && stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            title="Total Offres"
            value={stats.totalOffers}
            subtitle="proposées"
            icon={FileText}
          />
          <KpiCard
            title="Garanties"
            value={stats.totalCoverages}
            subtitle="configurées"
            icon={Shield}
          />
          <KpiCard
            title="Devis Reçus"
            value={stats.totalQuotes}
            subtitle="au total"
            icon={ClipboardList}
          />
          <KpiCard
            title="En Attente"
            value={stats.pendingQuotes}
            subtitle="à traiter"
            icon={Clock}
            trend="up"
            change={`${stats.pendingQuotes} en attente`}
          />
          <KpiCard
            title="Approuvés"
            value={stats.approvedQuotes}
            subtitle="devis acceptés"
            icon={CheckCircle2}
            trend="up"
            change={`${conversionRate}% de conversion`}
          />
          <KpiCard
            title="Taux de transformation"
            value={`${conversionRate}%`}
            subtitle="devis → contrats"
            icon={TrendingUp}
            trend={conversionRate >= 50 ? "up" : "down"}
            change={`${stats.approvedQuotes}/${stats.totalQuotes} approuvés`}
          />
        </div>
      ) : !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard title="Total Offres" value="—" icon={FileText} />
          <KpiCard title="Garanties" value="—" icon={Shield} />
          <KpiCard title="Devis Reçus" value="—" icon={ClipboardList} />
          <KpiCard title="En Attente" value="—" icon={Clock} />
          <KpiCard title="Approuvés" value="—" icon={CheckCircle2} />
          <KpiCard title="Taux de transformation" value="—" icon={TrendingUp} />
        </div>
      ) : null}

      {/* Recent Quotes */}
      {!error && (
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
          <div>
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats?.recentQuotes && stats.recentQuotes.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentQuotes.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-mono text-sm">{q.reference}</TableCell>
                          <TableCell>{q.userName || "—"}</TableCell>
                          <TableCell>{parseVehicleInfo(q.vehicleInfo)}</TableCell>
                          <TableCell>{statusBadge(q.status)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtPrice(q.finalPrice ?? q.estimatedPrice)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(q.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y">
                  {stats.recentQuotes.map((q) => (
                    <div key={q.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{q.reference}</span>
                        {statusBadge(q.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{q.userName || "—"}</span>
                        <span className="font-medium tabular-nums">
                          {fmtPrice(q.finalPrice ?? q.estimatedPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{parseVehicleInfo(q.vehicleInfo)}</span>
                        <span>{fmtDate(q.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Aucun devis récent
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
