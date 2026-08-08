"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, Shield, Package, Receipt, Users } from "lucide-react";

const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

interface Stats {
  totalInsurers: number; activeInsurers: number;
  totalOffers: number; activeOffers: number;
  totalCoverages: number; activeCoverages: number;
  totalQuotes: number; pendingQuotes: number;
  totalPackages: number; totalProfiles: number;
  totalCoverageCategories: number; totalInsuranceCategories: number; totalTariffRules: number;
  recentQuotes: { id: string; reference: string; status: string; estimatedPrice: number | null; personalData: string; createdAt: string; offer?: { name: string; insurer?: { name: string } } }[];
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  PENDING: { label: "En attente", variant: "outline" },
  APPROVED: { label: "Approuvé", variant: "default" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

export function DashboardTab() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try { const res = await fetch("/api/admin/stats"); if (res.ok) setStats(await res.json()); }
    catch { toast({ title: "Erreur de chargement", variant: "destructive" }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  if (!stats) return <p className="text-muted-foreground">Erreur.</p>;

  const cards = [
    { label: "Assureurs", value: stats.activeInsurers, sub: `${stats.totalInsurers} total`, icon: Building2, color: "text-blue-600" },
    { label: "Offres", value: stats.activeOffers, sub: `${stats.totalOffers} total`, icon: FileText, color: "text-emerald-600" },
    { label: "Garanties", value: stats.totalCoverages, sub: `${stats.totalCoverageCategories} catégories`, icon: Shield, color: "text-purple-600" },
    { label: "Devis", value: stats.pendingQuotes, sub: `${stats.totalQuotes} total`, icon: Receipt, color: "text-amber-600" },
    { label: "Utilisateurs", value: stats.totalProfiles, sub: `${stats.totalPackages} packages`, icon: Users, color: "text-rose-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => { const Icon = c.icon; return (
          <Card key={c.label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle><Icon className={`h-4 w-4 ${c.color}`} /></CardHeader><CardContent><div className="text-2xl font-bold">{c.value}</div><p className="text-xs text-muted-foreground mt-1">{c.sub}</p></CardContent></Card>
        ); })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Devis récents</CardTitle></CardHeader>
        <CardContent>
          {(!stats.recentQuotes || stats.recentQuotes.length === 0) ? <p className="text-sm text-muted-foreground py-6 text-center">Aucun devis.</p> : (
            <div aria-live="polite" className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead>Référence</TableHead><TableHead>Client</TableHead><TableHead>Assureur</TableHead><TableHead>Prix</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead>
            </TableRow></TableHeader><TableBody>
              {stats.recentQuotes.map((q) => { const pd = (() => { const raw = q.personalData; if (raw && typeof raw === "object") return raw as Record<string, unknown>; try { return JSON.parse(raw); } catch { return {}; } })(); const s = statusMap[q.status] || statusMap.DRAFT; return (
                <TableRow key={q.id}><TableCell className="font-mono text-xs">{q.reference}</TableCell><TableCell>{(pd.lastName || pd.firstName || "—")}</TableCell><TableCell className="text-sm">{q.offer?.insurer?.name || "—"}</TableCell><TableCell className="text-sm font-mono">{q.estimatedPrice ? new Intl.NumberFormat("fr-FR").format(q.estimatedPrice) + " FCFA" : "—"}</TableCell><TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell><TableCell className="text-muted-foreground text-sm">{fmtDate(q.createdAt)}</TableCell></TableRow>
              ); })}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}