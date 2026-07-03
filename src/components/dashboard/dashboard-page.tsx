"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  TrendingDown,
  Zap,
  Headphones,
  ChevronRight,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Car,
  CalendarDays,
  Eye,
  Loader2,
  LogIn,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ── Types ── */
interface UserStats {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  draftQuotes: number;
  totalSavings: number;
}

interface RecentQuote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  offerName: string | null;
  categoryName: string | null;
  insurerName: string | null;
  insurerLogo: string | null;
  vehicleData: Record<string, unknown>;
  personalData: Record<string, unknown>;
}

interface QuoteDetail extends RecentQuote {
  notes: string | null;
  updatedAt: string | null;
  offerDescription: string | null;
  deductible: number | null;
  coverageLines: {
    id: string;
    coverageName: string;
    coverageCode: string;
    premiumAmount: number;
    isMandatory: boolean;
    isIncluded: boolean;
  }[];
}

/* ── Helpers ── */
const formatFCFA = (amount: number | null | undefined) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const parseVehicle = (v: Record<string, unknown> | null): string => {
  if (!v) return "—";
  return [v.marque, v.modele].filter(Boolean).join(" ") || "—";
};

function statusBadge(status: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "PENDING":
      return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20">En attente</Badge>;
    case "APPROVED":
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">Approuvé</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-500/20">Rejeté</Badge>;
    case "DRAFT":
      return <Badge className="bg-gray-500/15 text-gray-500 hover:bg-gray-500/25 border-gray-500/20">Brouillon</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function statusIcon(status: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "APPROVED": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "REJECTED": return <XCircle className="h-4 w-4 text-red-500" />;
    case "PENDING": return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default: return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

/* ── Stat Card ── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  const iconBg = accent
    ? "bg-[#B9E54D]/15 text-[#B9E54D]"
    : "bg-primary/10 text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-shadow bg-card">
        <CardContent className="p-4 sm:p-6 flex items-start gap-4">
          <div className={`rounded-lg ${iconBg} p-2.5 shrink-0`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-0.5 tabular-nums">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="bg-card">
      <CardContent className="p-4 sm:p-6 flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Quote Detail Dialog ── */
function QuoteDetailDialog({
  quote,
  open,
  onOpenChange,
}: {
  quote: RecentQuote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [done, setDone] = useState(false);
  const { user } = useAppStore();
  const isLoading = !done;

  useEffect(() => {
    if (!user.id || !quote?.id) return;
    fetch(`/api/user/quotes/${quote.id}?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setDetail(null);
        } else {
          setDetail(data);
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setDone(true));
  }, [user.id, quote?.id]);

  const displayQuote = detail || quote;
  if (!displayQuote) return null;

  const vehicle = (displayQuote as QuoteDetail).vehicleData || {};
  const personal = (displayQuote as QuoteDetail).personalData || {};
  const coverages = detail?.coverageLines || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#B9E54D]" />
            Devis {displayQuote.reference}
          </DialogTitle>
          <DialogDescription>
            Créé le {formatDate(displayQuote.createdAt)}
            {displayQuote.updatedAt && ` · Mis à jour le ${formatDate(displayQuote.updatedAt)}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Status + Price */}
            <div className="flex items-center justify-between">
              {statusBadge(displayQuote.status)}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {displayQuote.status === "APPROVED" ? "Prix final" : "Montant estimé"}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {formatFCFA(displayQuote.finalPrice ?? displayQuote.estimatedPrice)}
                </p>
              </div>
            </div>

            {displayQuote.status === "APPROVED" && displayQuote.estimatedPrice != null && displayQuote.finalPrice != null && (
              displayQuote.finalPrice !== displayQuote.estimatedPrice && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between">
                  <span className="text-sm">Économie réalisée</span>
                  <span className="font-bold text-emerald-600 tabular-nums">
                    {formatFCFA(displayQuote.estimatedPrice - displayQuote.finalPrice)}
                  </span>
                </div>
              )
            )}

            <Separator />

            {/* Insurer info */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Assureur
              </h3>
              <div className="flex items-center gap-3">
                {displayQuote.insurerLogo ? (
                  <img src={displayQuote.insurerLogo} alt="" className="h-10 w-10 rounded-lg object-contain bg-muted p-1" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{displayQuote.insurerName || "—"}</p>
                  <p className="text-sm text-muted-foreground">{displayQuote.offerName || "—"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vehicle info */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Car className="h-4 w-4 text-muted-foreground" />
                Véhicule
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Marque / Modèle</p>
                  <p className="font-medium">{parseVehicle(vehicle as Record<string, unknown>)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Immatriculation</p>
                  <p className="font-medium">{(vehicle as Record<string, string>).immatriculation || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Puissance</p>
                  <p className="font-medium">{(vehicle as Record<string, string>).puissance || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Année</p>
                  <p className="font-medium">{(vehicle as Record<string, string>).annee || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carburant</p>
                  <p className="font-medium">{(vehicle as Record<string, string>).carburant || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valeur</p>
                  <p className="font-medium tabular-nums">{(vehicle as Record<string, string>).valeur ? formatFCFA(Number((vehicle as Record<string, string>).valeur)) : "—"}</p>
                </div>
              </div>
            </div>

            {/* Coverage lines */}
            {coverages.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Garanties ({coverages.length})
                  </h3>
                  <div className="space-y-2">
                    {coverages.map((cl) => (
                      <div key={cl.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2">
                          {cl.isIncluded ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm">{cl.coverageName}</span>
                          {cl.isMandatory && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-500/30 text-amber-600">
                              Oblig.
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium tabular-nums">{formatFCFA(cl.premiumAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {displayQuote.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {displayQuote.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Dashboard ── */
export function DashboardPage() {
  const { user, setView } = useAppStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [quotes, setQuotes] = useState<RecentQuote[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<RecentQuote | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchStats = useCallback(() => {
    if (!user.id) return;
    fetch(`/api/user/stats?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [user.id]);

  const fetchQuotes = useCallback(() => {
    if (!user.id) return;
    fetch(`/api/user/quotes?userId=${user.id}&limit=5`)
      .then((res) => res.json())
      .then((data) => setQuotes(data.quotes || []))
      .catch(() => {})
      .finally(() => setLoadingQuotes(false));
  }, [user.id]);

  useEffect(() => {
    fetchStats();
    fetchQuotes();
  }, [fetchStats, fetchQuotes]);

  // Not logged in state
  if (!user.isLoggedIn) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="rounded-full bg-primary/10 p-6 mx-auto w-fit mb-6">
          <LogIn className="size-10 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Tableau de bord</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Connectez-vous pour accéder à votre espace personnel, suivre
          vos demandes de devis et gérer votre profil.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => setView("login")}
          >
            <LogIn className="size-4" />
            Se connecter
          </Button>
          <Button
            variant="outline"
            onClick={() => setView("register")}
          >
            Créer un compte
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Bonjour, <span className="text-foreground font-medium">{user.name || "Utilisateur"}</span> 👋
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loadingStats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              icon={FileText}
              label="Devis demandés"
              value={stats.totalQuotes}
              sub="au total"
            />
            <StatCard
              icon={Clock}
              label="En attente"
              value={stats.pendingQuotes}
              sub="en cours de traitement"
              accent
            />
            <StatCard
              icon={CheckCircle2}
              label="Approuvés"
              value={stats.approvedQuotes}
              sub="acceptés par l'assureur"
            />
            <StatCard
              icon={TrendingDown}
              label="Économies"
              value={stats.totalSavings > 0 ? formatFCFA(stats.totalSavings) : "—"}
              sub={stats.totalSavings > 0 ? "en comparant" : "comparez pour voir"}
              accent
            />
          </>
        ) : null}
      </div>

      {/* Recent Quotes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <Card className="card-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Mes demandes de devis</CardTitle>
            {quotes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("my-quotes")}
                className="text-[#B9E54D] hover:text-[#a5d044] hover:bg-[#B9E54D]/10"
              >
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loadingQuotes ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">
                  Aucun devis demandé pour le moment
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Commencez par comparer des offres d&apos;assurance pour voir vos devis
                  apparaître ici.
                </p>
                <Button
                  className="bg-[#B9E54D] text-black hover:bg-[#a5d044] rounded-full"
                  onClick={() => setView("compare")}
                >
                  <Zap className="size-4" />
                  Comparer des offres
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Assureur</TableHead>
                        <TableHead className="hidden lg:table-cell">Véhicule</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((q) => (
                        <TableRow
                          key={q.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => { setSelectedQuote(q); setDialogOpen(true); }}
                        >
                          <TableCell className="font-mono text-xs">{q.reference}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {q.insurerLogo ? (
                                <img src={q.insurerLogo} alt="" className="h-5 w-5 rounded object-contain bg-muted" />
                              ) : null}
                              <span className="text-sm truncate max-w-[140px]">{q.insurerName || q.offerName || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {parseVehicle(q.vehicleData)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums text-sm">
                            {formatFCFA(q.finalPrice ?? q.estimatedPrice)}
                          </TableCell>
                          <TableCell>{statusBadge(q.status)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatDate(q.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 space-y-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => { setSelectedQuote(q); setDialogOpen(true); }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{q.reference}</p>
                          <p className="text-sm font-medium mt-0.5 truncate">{q.insurerName || q.offerName || "—"}</p>
                        </div>
                        {statusBadge(q.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{parseVehicle(q.vehicleData)}</span>
                        <span className="font-medium tabular-nums">{formatFCFA(q.finalPrice ?? q.estimatedPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            className="bg-[#B9E54D] text-black hover:bg-[#a5d044] rounded-full justify-start h-auto py-4 px-5"
            onClick={() => setView("compare")}
          >
            <Zap className="size-5 mr-3 shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-sm">Nouvelle comparaison</p>
              <p className="text-xs opacity-75 font-normal">Comparer et obtenir des devis</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="rounded-full justify-start h-auto py-4 px-5"
            onClick={() => setView("my-quotes")}
          >
            <FileText className="size-5 mr-3 shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-sm">Mes devis</p>
              <p className="text-xs text-muted-foreground font-normal">Suivre mes demandes</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="rounded-full justify-start h-auto py-4 px-5"
            onClick={() => setView("profile")}
          >
            <User className="size-5 mr-3 shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-sm">Mon profil</p>
              <p className="text-xs text-muted-foreground font-normal">Modifier mes informations</p>
            </div>
          </Button>
        </div>
      </motion.div>

      {/* Profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="card-shadow bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Mon profil
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("profile")}
                className="text-muted-foreground"
              >
                Modifier
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <Mail className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <Phone className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="text-sm font-medium">{user.name ? "Renseigné" : "Non renseigné"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <p className="text-sm font-medium text-emerald-600">Compte actif</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quote Detail Dialog */}
      <QuoteDetailDialog
        key={selectedQuote?.id ?? "closed"}
        quote={selectedQuote}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}