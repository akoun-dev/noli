"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import {
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Building2,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ── Types ── */
interface CallbackRequest {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  phone: string | null;
  preferredTime: string | null;
  clientName: string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientEmail: string | null;
  insurerName: string | null;
  insurerId: string | null;
}

/* ── Helpers ── */
const TIME_LABELS: Record<string, string> = {
  matin: "Matin (8h-12h)",
  "apres-midi": "Après-midi (14h-18h)",
  soir: "Soirée (18h-20h)",
};

const timeSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
};

/* ── Component ── */
export function InsurerCallbacksTab() {
  const { user } = useAppStore();
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCallbacks = useCallback(async () => {
    if (!user.id) return;
    try {
      const res = await fetch(`/api/contact/callbacks`);
      const data = await res.json();
      setCallbacks(data.callbacks || []);
    } catch (err) {
      console.error("[callbacks] Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const handleMarkRead = async (id: string) => {
    setUpdating(id);
    try {
      await fetch("/api/contact/callbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      setCallbacks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isRead: true } : c))
      );
    } catch (err) {
      console.error("[callbacks] Erreur mise à jour:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkUnread = async (id: string) => {
    setUpdating(id);
    try {
      await fetch("/api/contact/callbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: false }),
      });
      setCallbacks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isRead: false } : c))
      );
    } catch (err) {
      console.error("[callbacks] Erreur mise à jour:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredCallbacks =
    activeFilter === "all"
      ? callbacks
      : activeFilter === "read"
        ? callbacks.filter((c) => c.isRead)
        : callbacks.filter((c) => !c.isRead);

  const unreadCount = callbacks.filter((c) => !c.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Demandes de rappel</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les demandes de rappel téléphonique de vos clients.
            {unreadCount > 0 && (
              <span className="ml-2 font-medium text-primary">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={fetchCallbacks}
        >
          <Clock className="size-4 mr-1.5" />
          Actualiser
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Toutes" },
          { id: "unread", label: "Nouvelles" },
          { id: "read", label: "Traitées" },
        ].map((f) => (
          <Button
            key={f.id}
            variant={activeFilter === f.id ? "default" : "outline"}
            size="sm"
            className={
              activeFilter === f.id
                ? "bg-brand text-black hover:bg-brand-hover"
                : ""
            }
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
            {f.id !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({f.id === "read"
                  ? callbacks.filter((c) => c.isRead).length
                  : unreadCount}
                )
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : filteredCallbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              Aucune demande de rappel
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {activeFilter !== "all"
                ? `Aucune demande avec ce statut. Essayez un autre filtre.`
                : "Les demandes de rappel apparaîtront ici lorsque des clients demanderont à être contactés."}
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Créneau</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCallbacks.map((cb) => (
                  <TableRow
                    key={cb.id}
                    className={`transition-colors ${
                      !cb.isRead
                        ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                        : ""
                    }`}
                  >
                    {/* Unread indicator */}
                    <TableCell>
                      {!cb.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </TableCell>

                    {/* Client info */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <User className="size-4 text-primary" />
                        </div>
                        <div>
                          <p
                            className={`text-sm ${
                              !cb.isRead
                                ? "font-semibold text-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {cb.clientName || "Client anonyme"}
                          </p>
                          {cb.clientEmail && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" />
                              {cb.clientEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <a
                        href={`tel:${cb.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <Phone className="size-3.5" />
                        {cb.phone || "—"}
                      </a>
                    </TableCell>

                    {/* Preferred time */}
                    <TableCell>
                      {cb.preferredTime ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal gap-1"
                        >
                          <CalendarDays className="size-3" />
                          {TIME_LABELS[cb.preferredTime] || cb.preferredTime}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Non spécifié
                        </span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {new Date(cb.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeSince(cb.createdAt)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!cb.isRead ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                            onClick={() => handleMarkRead(cb.id)}
                            disabled={updating === cb.id}
                          >
                            <CheckCircle2 className="size-3.5 mr-1" />
                            Marquer traitée
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleMarkUnread(cb.id)}
                            disabled={updating === cb.id}
                          >
                            <XCircle className="size-3.5 mr-1" />
                            Non traitée
                          </Button>
                        )}
                        {cb.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            asChild
                          >
                            <a href={`tel:${cb.phone}`}>
                              <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {callbacks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{callbacks.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {callbacks.filter((c) => c.isRead).length}
                </p>
                <p className="text-xs text-muted-foreground">Traitées</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
