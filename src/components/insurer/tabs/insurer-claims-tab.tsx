"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Info, Clock, CheckCircle2, Search, FileWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface Claim {
  id: number;
  reference: string;
  type: string;
  description: string;
  incidentDate: string | null;
  status: string;
  createdAt: string;
  client?: { firstName: string | null; lastName: string | null; email: string } | null;
  contract?: { reference: string; offer?: { name: string } | null } | null;
}

const TYPE_LABEL: Record<string, string> = {
  ACCIDENT: "Accident",
  VOL: "Vol",
  BRIS_GLACE: "Bris de glace",
  INCENDIE: "Incendie",
  AUTRE: "Autre",
};

const STATUS: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Reçu", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  IN_REVIEW: { label: "En cours d'examen", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  APPROVED: { label: "Approuvé", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  REJECTED: { label: "Rejeté", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  CLOSED: { label: "Clôturé", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};
const STATUS_OPTIONS = ["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "CLOSED"];

const clientName = (c: Claim) => {
  const n = [c.client?.firstName, c.client?.lastName].filter(Boolean).join(" ").trim();
  return n || c.client?.email || "Client";
};
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export function InsurerClaimsTab() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/insurer/claims");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : data.claims ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const changeStatus = async (claim: Claim, status: string) => {
    if (status === claim.status) return;
    setUpdating(claim.id);
    try {
      const res = await fetch(`/api/insurer/claims/${claim.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status } : c)));
      toast({ title: "Sinistre mis à jour", description: `Statut : ${STATUS[status]?.label || status}.` });
    } catch {
      toast({ title: "Erreur", description: "Mise à jour impossible.", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const openCount = claims.filter((c) => c.status === "SUBMITTED").length;
  const inReviewCount = claims.filter((c) => c.status === "IN_REVIEW").length;
  const treatedCount = claims.filter((c) => ["APPROVED", "REJECTED", "CLOSED"].includes(c.status)).length;

  const term = searchTerm.trim().toLowerCase();
  const filtered = !term
    ? claims
    : claims.filter((c) =>
        [c.reference, clientName(c), c.contract?.reference, TYPE_LABEL[c.type] || c.type]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
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
      <div>
        <h2 className="text-2xl font-bold">Sinistres</h2>
        <p className="text-muted-foreground mt-1">Traitez les déclarations de sinistre liées à vos contrats.</p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, client, contrat ou type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-2.5 dark:bg-red-900/40">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{openCount}</p>
              <p className="text-xs text-muted-foreground">Sinistres ouverts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/40">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{inReviewCount}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/40">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{treatedCount}</p>
              <p className="text-xs text-muted-foreground">Traités</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-xl border border-dashed bg-card/40 p-10 text-center">
          <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold mb-1">Impossible de charger les sinistres</h3>
          <button onClick={fetchClaims} className="text-sm font-medium text-primary hover:underline">
            Réessayer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/10 to-amber-500/10 mx-auto mb-4">
            <FileWarning className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">
            {claims.length === 0 ? "Aucune déclaration de sinistre" : "Aucun résultat"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {claims.length === 0
              ? "Les sinistres déclarés par vos clients apparaîtront ici pour évaluation et traitement."
              : "Aucun sinistre ne correspond à votre recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const cfg = STATUS[c.status] || { label: c.status, color: "bg-gray-100 text-gray-700" };
            return (
              <Card key={c.id} className="rounded-xl border bg-card">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {TYPE_LABEL[c.type] || c.type}
                          <span className="text-muted-foreground font-normal"> · {clientName(c)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Réf : {c.reference} · Contrat {c.contract?.reference || "—"} · Déclaré le {formatDate(c.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Faire évoluer :</label>
                      <select
                        value={c.status}
                        disabled={updating === c.id}
                        onChange={(e) => changeStatus(c, e.target.value)}
                        className="rounded-lg border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
