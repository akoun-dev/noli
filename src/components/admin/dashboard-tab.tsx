"use client";

import { useEffect, useState } from "react";
import { Building2, FileText, ShieldCheck, Receipt, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalInsurers: number;
  activeInsurers: number;
  totalOffers: number;
  activeOffers: number;
  totalQuotes: number;
  pendingQuotes: number;
  totalGuarantees: number;
  totalGuaranteeLinks: number;
  totalOfferLinks: number;
  recentQuotes: QuoteRow[];
}

interface QuoteRow {
  id: string;
  reference: string;
  status: string;
  proposedPrice: number | null;
  createdAt: string;
  personalInfo: { lastName?: string; firstName?: string; email?: string };
  offer: { name: string; insurer: { name: string } } | null;
}

const fmtPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  in_progress: { label: "En cours", variant: "default" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) setStats(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground">Erreur de chargement.</p>;

  const cards = [
    { label: "Assureurs", value: stats.activeInsurers, sub: `${stats.totalInsurers} total`, icon: Building2, color: "text-blue-600" },
    { label: "Offres", value: stats.activeOffers, sub: `${stats.totalOffers} total`, icon: FileText, color: "text-emerald-600" },
    { label: "Garanties", value: stats.totalGuarantees, sub: "catalogue", icon: ShieldCheck, color: "text-purple-600" },
    { label: "Devis", value: stats.pendingQuotes, sub: `${stats.totalQuotes} total`, icon: Receipt, color: "text-amber-600" },
    { label: "Liens", value: stats.totalOfferLinks, sub: `${stats.totalGuaranteeLinks} assureur-gar.`, icon: Link2, color: "text-rose-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Devis récents</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun devis pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Assureur</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentQuotes.map((q) => {
                    const s = statusMap[q.status] || statusMap.pending;
                    return (
                      <TableRow key={q.id}>
                        <TableCell className="font-mono text-xs">{q.reference}</TableCell>
                        <TableCell>{q.personalInfo?.lastName || "—"}</TableCell>
                        <TableCell>{q.offer?.insurer?.name || "—"}</TableCell>
                        <TableCell>{q.proposedPrice ? fmtPrice(q.proposedPrice) : "—"}</TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{fmtDate(q.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}