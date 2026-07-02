"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, Download, Clock, User, Edit, Trash,
  ArrowUpDown, ChevronLeft, ChevronRight, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  EXPORT: "Export",
  SETTINGS_CHANGE: "Paramètres modifiés",
  BACKUP_CREATE: "Sauvegarde",
  BACKUP_RESTORE: "Restauration",
};

const ACTION_BADGE_CLASSES: Record<string, string> = {
  LOGIN: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-400",
  CREATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
  UPDATE: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
  EXPORT: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400",
  SETTINGS_CHANGE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-400",
  BACKUP_CREATE: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-400",
  BACKUP_RESTORE: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-400",
};

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  pages: number;
}

export function AuditLogsTab() {
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Expanded detail
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (entityFilter !== "all") params.set("entity", entityFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data: AuditLogsResponse = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setPages(data.pages);
      } else {
        setLogs([]);
        setTotal(0);
        setPages(1);
      }
    } catch {
      setLogs([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, startDate, endDate, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setSearch("");
    setActionFilter("all");
    setEntityFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExport = () => {
    toast({ title: "Export en cours...", description: "Le fichier sera prêt sous peu." });
  };

  // Stats
  const todayLogs = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString() && l.action === "LOGIN";
  }).length;
  const updateCount = logs.filter((l) => l.action === "UPDATE").length;
  const deleteCount = logs.filter((l) => l.action === "DELETE").length;

  const formatDetails = (details: string | Record<string, unknown>) => {
    if (typeof details === 'string') {
      try { return JSON.stringify(JSON.parse(details), null, 2); } catch { return details; }
    }
    return JSON.stringify(details, null, 2);
  };

  const detailsPreview = (details: string | Record<string, unknown>) => {
    if (!details) return '—';
    if (typeof details === 'string') return details.length > 60 ? details.slice(0, 60) + '...' : details;
    const s = JSON.stringify(details);
    return s.length > 60 ? s.slice(0, 60) + '...' : s;
  };

  const renderStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total événements</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40">
            <User className="h-5 w-5 text-green-700 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Connexions aujourd&apos;hui</p>
            <p className="text-xl font-bold">{todayLogs}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
            <Edit className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Modifications</p>
            <p className="text-xl font-bold">{updateCount}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
            <Trash className="h-5 w-5 text-red-700 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Suppressions</p>
            <p className="text-xl font-bold">{deleteCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>
      <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
        <SelectTrigger className="w-full lg:w-[180px]">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="LOGIN">Connexion</SelectItem>
          <SelectItem value="LOGOUT">Déconnexion</SelectItem>
          <SelectItem value="CREATE">Création</SelectItem>
          <SelectItem value="UPDATE">Modification</SelectItem>
          <SelectItem value="DELETE">Suppression</SelectItem>
          <SelectItem value="EXPORT">Export</SelectItem>
          <SelectItem value="SETTINGS_CHANGE">Paramètres</SelectItem>
          <SelectItem value="BACKUP_CREATE">Sauvegarde</SelectItem>
        </SelectContent>
      </Select>
      <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
        <SelectTrigger className="w-full lg:w-[180px]">
          <SelectValue placeholder="Entité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="Utilisateur">Utilisateur</SelectItem>
          <SelectItem value="Assureur">Assureur</SelectItem>
          <SelectItem value="Offre">Offre</SelectItem>
          <SelectItem value="Devis">Devis</SelectItem>
          <SelectItem value="Paramètres">Paramètres</SelectItem>
          <SelectItem value="Sauvegarde">Sauvegarde</SelectItem>
          <SelectItem value="Rôle">Rôle</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={startDate}
        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
        className="w-full lg:w-[160px]"
        placeholder="Début"
      />
      <Input
        type="date"
        value={endDate}
        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
        className="w-full lg:w-[160px]"
        placeholder="Fin"
      />
      <Button variant="outline" onClick={resetFilters} className="shrink-0">
        Réinitialiser
      </Button>
    </div>
  );

  const renderTable = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-28" />
            </div>
          ))}
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Aucun journal trouvé</p>
          <p className="text-sm">Aucun événement ne correspond à vos critères de recherche.</p>
        </div>
      );
    }

    const ActionBadge = ({ action }: { action: string }) => (
      <Badge variant="secondary" className={ACTION_BADGE_CLASSES[action] || "bg-gray-100 text-gray-800"}>
        {ACTION_LABELS[action] || action}
      </Badge>
    );

    return (
      <>
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Date/Heure</div></TableHead>
                <TableHead><div className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Utilisateur</div></TableHead>
                <TableHead><div className="flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Action</div></TableHead>
                <TableHead>Entité</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{log.userName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell><ActionBadge action={log.action} /></TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <button
                      className="text-xs text-left text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      {expandedId === log.id
                        ? (
                          <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-md max-w-[300px] max-h-48 overflow-y-auto">
                            {formatDetails(log.details)}
                          </pre>
                        )
                        : (
                          <span className="line-clamp-1">{detailsPreview(log.details)}</span>
                        )}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={ACTION_BADGE_CLASSES[log.action] || "bg-gray-100 text-gray-800"}>
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{log.userName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                  </div>
                  <Badge variant="outline">{log.entity}</Badge>
                </div>
                <div>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer w-full text-left"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    {expandedId === log.id
                      ? (
                        <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-md max-h-48 overflow-y-auto">
                          {formatDetails(log.details)}
                        </pre>
                      )
                      : (
                        <span className="line-clamp-1">{detailsPreview(log.details)}</span>
                      )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-mono">IP: {log.ipAddress}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} sur {pages} ({total} résultat{total > 1 ? "s" : ""})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                if (pageNum < 1 || pageNum > pages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="icon"
                    className={pageNum === page ? "bg-[#B9E54D] text-black hover:bg-[#a5d044]" : ""}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Journaux d&apos;audit</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consultez et filtrez l&apos;historique de toutes les actions effectuées sur la plateforme.
          </p>
        </div>
        <Button onClick={handleExport} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
          <Download className="h-4 w-4 mr-2" />
          Exporter les journaux
        </Button>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Stats */}
      {renderStats()}

      {/* Table / Cards */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto rounded-lg border bg-card">
        <div className="p-4">{renderTable()}</div>
      </div>
    </div>
  );
}