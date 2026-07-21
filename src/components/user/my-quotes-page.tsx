"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  X,
  FileText,
  Car,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
interface Quote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  createdAt: string;
  updatedAt: string | null;
  notes: string | null;
  offerName: string | null;
  offerDescription: string | null;
  categoryName: string | null;
  insurerName: string | null;
  insurerLogo: string | null;
  deductible: number | null;
  vehicleData: Record<string, unknown>;
  personalData: Record<string, unknown>;
}

interface QuoteDetail extends Quote {
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

const statusFilters = [
  { value: "all", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvés" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "DRAFT", label: "Brouillons" },
];

/* ── Quote Detail Dialog ── */
function QuoteDetailDialog({
  quote,
  open,
  onOpenChange,
}: {
  quote: Quote | null;
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
        if (data.error) setDetail(null);
        else setDetail(data);
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
            {Array.from({ length: 6 }).map((_, i) => (
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

            {displayQuote.status === "APPROVED" &&
              displayQuote.estimatedPrice != null &&
              displayQuote.finalPrice != null &&
              displayQuote.finalPrice !== displayQuote.estimatedPrice && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between">
                  <span className="text-sm">Économie réalisée</span>
                  <span className="font-bold text-emerald-600 tabular-nums">
                    {formatFCFA(displayQuote.estimatedPrice - displayQuote.finalPrice)}
                  </span>
                </div>
              )}

            <Separator />

            {/* Insurer */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Assureur
              </h3>
              <div className="flex items-center gap-3">
                {displayQuote.insurerLogo ? (
                  <img
                    src={displayQuote.insurerLogo}
                    alt=""
                    className="h-10 w-10 rounded-lg object-contain bg-muted p-1"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{displayQuote.insurerName || "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {displayQuote.offerName || "—"}
                    {displayQuote.categoryName && ` · ${displayQuote.categoryName}`}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Vehicle */}
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
                  <p className="font-medium tabular-nums">
                    {(vehicle as Record<string, string>).valeur
                      ? formatFCFA(Number((vehicle as Record<string, string>).valeur))
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal data */}
            <Separator />
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nom complet</p>
                  <p className="font-medium">
                    {[(personal as Record<string, string>).prenom, (personal as Record<string, string>).nom]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium truncate">{(personal as Record<string, string>).email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{(personal as Record<string, string>).tel || "—"}</p>
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
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {coverages.map((cl) => (
                      <div key={cl.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {cl.isIncluded ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-sm truncate">{cl.coverageName}</span>
                          {cl.isMandatory && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 border-amber-500/30 text-amber-600 shrink-0"
                            >
                              Oblig.
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium tabular-nums shrink-0 ml-2">
                          {formatFCFA(cl.premiumAmount)}
                        </span>
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

/* ── Main My Quotes Page ── */
export function MyQuotesPage() {
  const { user, setView } = useAppStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchQuotes = useCallback(() => {
    if (!user.id) return;
    setLoading(true);
    const params = new URLSearchParams({
      userId: user.id,
      page: "1",
      limit: "50",
      search,
    });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/user/quotes?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setQuotes(data.quotes || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchQuotes, 300);
    return () => clearTimeout(timer);
  }, [fetchQuotes]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={() => setView("dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Retour au tableau de bord
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold">Mes Devis</h1>
        <p className="text-muted-foreground mt-1">
          {total} devis trouvé{total > 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Status filter badges */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        {statusFilters.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setStatusFilter(sf.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === sf.value
                ? "bg-[#B9E54D] text-black border-[#B9E54D]"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {sf.label}
          </button>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, assureur, offre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Aucun devis trouvé</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {statusFilter !== "all" || search
                ? "Essayez de modifier vos filtres de recherche."
                : "Commencez par comparer des offres d'assurance."}
            </p>
            {statusFilter === "all" && !search && (
              <Button
                className="bg-[#B9E54D] text-black hover:bg-[#a5d044] rounded-full"
                onClick={() => setView("compare")}
              >
                Comparer des offres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Assureur</TableHead>
                  <TableHead className="hidden lg:table-cell">Véhicule</TableHead>
                  <TableHead className="hidden lg:table-cell">Offre</TableHead>
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
                    onClick={() => {
                      setSelectedQuote(q);
                      setDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-sm">{q.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {q.insurerLogo ? (
                          <img
                            src={q.insurerLogo}
                            alt=""
                            className="h-5 w-5 rounded object-contain bg-muted"
                          />
                        ) : null}
                        <span className="text-sm truncate max-w-[140px]">
                          {q.insurerName || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {parseVehicle(q.vehicleData)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[150px] truncate">
                      {q.offerName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-sm">
                      {formatFCFA(q.finalPrice ?? q.estimatedPrice)}
                    </TableCell>
                    <TableCell>{statusBadge(q.status)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(q.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {quotes.map((q) => (
              <Card
                key={q.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedQuote(q);
                  setDialogOpen(true);
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground">{q.reference}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {q.insurerLogo ? (
                          <img
                            src={q.insurerLogo}
                            alt=""
                            className="h-4 w-4 rounded object-contain bg-muted"
                          />
                        ) : null}
                        <p className="text-sm font-medium truncate">{q.insurerName || q.offerName || "—"}</p>
                      </div>
                    </div>
                    {statusBadge(q.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{parseVehicle(q.vehicleData)}</span>
                    <span className="font-medium tabular-nums">
                      {formatFCFA(q.finalPrice ?? q.estimatedPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[60%]">{q.offerName || "—"}</span>
                    <span>{formatDate(q.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Detail Dialog */}
      <QuoteDetailDialog
        key={selectedQuote?.id ?? "closed"}
        quote={selectedQuote}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}