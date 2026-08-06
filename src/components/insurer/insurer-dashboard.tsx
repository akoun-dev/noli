"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, ClipboardList, Clock, CheckCircle2, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/app-store";

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

function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

function parseVehicleInfo(vehicleInfo: string | Record<string, unknown> | null): string {
  if (!vehicleInfo) return "—";
  try {
    const v = typeof vehicleInfo === 'string' ? JSON.parse(vehicleInfo) : vehicleInfo;
    return [v.marque, v.modele].filter(Boolean).join(" ") || "—";
  } catch {
    return typeof vehicleInfo === "string" ? vehicleInfo : "—";
  }
}

function statusBadge(status: string) {
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
}

/* ── Stat Card Skeleton ── */
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

/* ── Stat Card ── */
function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent?: string;
}) {
  const iconBg = accent === "lime"
    ? "bg-[#B9E54D]/15 text-[#B9E54D]"
    : accent === "green"
    ? "bg-green-500/15 text-green-500"
    : "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Dashboard Tab ── */
export function InsurerDashboard() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    if (!user.id) return;
    fetch(`/api/insurer/stats`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Offres" value={stats.totalOffers} icon={FileText} />
          <StatCard title="Devis Reçus" value={stats.totalQuotes} icon={ClipboardList} />
          <StatCard title="En Attente" value={stats.pendingQuotes} icon={Clock} accent="lime" />
          <StatCard title="Approuvés" value={stats.approvedQuotes} icon={CheckCircle2} accent="green" />
        </div>
      ) : null}

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Devis Récents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                          {formatPrice(q.finalPrice ?? q.estimatedPrice)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(q.createdAt)}
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
                        {formatPrice(q.finalPrice ?? q.estimatedPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{parseVehicleInfo(q.vehicleInfo)}</span>
                      <span>{formatDate(q.createdAt)}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}