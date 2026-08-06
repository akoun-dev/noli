"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Eye, CheckCircle2, XCircle, Loader2, X,
  User, Car, FileText, Calendar, Banknote, MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number;
  finalPrice: number | null;
  createdAt: string;
  updatedAt: string | null;
  userName: string;
  userEmail: string | null;
  vehicleData: string | Record<string, unknown> | null;
  personalData: string | Record<string, unknown> | null;
  notes: string | null;
  offerName: string | null;
}

interface QuotesResponse {
  quotes: Quote[];
  total: number;
  page: number;
  limit: number;
}

function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(date: string): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function parseJson(data: string | Record<string, unknown> | null): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === 'object') return data as Record<string, unknown>;
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function parseVehicleInfo(vehicleData: string | Record<string, unknown> | null): string {
  const v = parseJson(vehicleData);
  return [v.marque, v.modele].filter(Boolean).join(" ") || "—";
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
  onAction,
  actionLoading,
}: {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (quoteId: string, status: string) => void;
  actionLoading: boolean;
}) {
  if (!quote) return null;

  const personal = parseJson(quote.personalData) as Record<string, string>;
  const vehicle = parseJson(quote.vehicleData) as Record<string, string>;
  const canAct = quote.status === "PENDING" || quote.status === "DRAFT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#B9E54D]" />
            Devis {quote.reference}
          </DialogTitle>
          <DialogDescription>
            Créé le {formatDate(quote.createdAt)}
            {quote.updatedAt && ` · Mis à jour le ${formatDate(quote.updatedAt)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Status + Prices */}
          <div className="flex items-center justify-between">
            {statusBadge(quote.status)}
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Montant estimé</p>
              <p className="text-lg font-bold tabular-nums">{formatPrice(quote.estimatedPrice)}</p>
            </div>
          </div>

          {quote.finalPrice != null && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Prix final</span>
              <span className="font-bold tabular-nums">{formatPrice(quote.finalPrice)}</span>
            </div>
          )}

          <Separator />

          {/* Client info */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              Informations client
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nom complet</p>
                <p className="font-medium">{quote.userName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium truncate">{personal.email || quote.userEmail || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="font-medium">{personal.tel || personal.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Offre</p>
                <p className="font-medium truncate">{quote.offerName || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle info */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-muted-foreground" />
              Informations véhicule
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Marque / Modèle</p>
                <p className="font-medium">{[vehicle.marque, vehicle.modele].filter(Boolean).join(" ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Immatriculation</p>
                <p className="font-medium">{vehicle.immatriculation || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Puissance</p>
                <p className="font-medium">{vehicle.puissance || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Année</p>
                <p className="font-medium">{vehicle.annee || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carburant</p>
                <p className="font-medium">{vehicle.carburant || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valeur</p>
                <p className="font-medium tabular-nums">{vehicle.valeur ? formatPrice(Number(vehicle.valeur)) : "—"}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {quote.notes}
                </p>
              </div>
            </>
          )}

          {/* Action buttons */}
          {canAct && (
            <>
              <Separator />
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => onAction(quote.id, "APPROVED")}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approuver
                </Button>
                <Button
                  onClick={() => onAction(quote.id, "REJECTED")}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeter
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Quotes Tab ── */
export function InsurerQuotes() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuotes = useCallback(() => {
    if (!user.id) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: "1",
      limit: "50",
      search,
    });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/insurer/quotes?${params}`)
      .then((res) => res.json())
      .then((data: QuotesResponse) => {
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

  const handleAction = async (quoteId: string, status: string) => {
    if (!user.id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/insurer/quotes/${quoteId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur");
      toast({
        title: status === "APPROVED" ? "Devis approuvé" : "Devis rejeté",
        description: `Le devis a été ${status === "APPROVED" ? "approuvé" : "rejeté"} avec succès.`,
      });
      setDialogOpen(false);
      fetchQuotes();
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetail = (quote: Quote) => {
    setSelectedQuote(quote);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Devis Reçus</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} devis trouvé{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter badges */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par référence, client..."
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
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Aucun devis trouvé
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Offre</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenDetail(q)}
                  >
                    <TableCell className="font-mono text-sm">{q.reference}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{q.userName || "—"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{parseVehicleInfo(q.vehicleData)}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-muted-foreground">{q.offerName || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatPrice(q.finalPrice ?? q.estimatedPrice)}
                    </TableCell>
                    <TableCell>{statusBadge(q.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
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
                onClick={() => handleOpenDetail(q)}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{q.reference}</span>
                    {statusBadge(q.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[60%]">{q.userName}</span>
                    <span className="font-medium tabular-nums">
                      {formatPrice(q.finalPrice ?? q.estimatedPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[60%]">{parseVehicleInfo(q.vehicleData)}</span>
                    <span>{formatDate(q.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <QuoteDetailDialog
        quote={selectedQuote}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAction={handleAction}
        actionLoading={actionLoading}
      />
    </div>
  );
}