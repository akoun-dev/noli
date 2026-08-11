"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
interface Client {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  registeredAt: string | null;
  quotesCount: number;
  contractsCount: number;
}

/* ── Helpers ── */
const fullName = (c: Client) => {
  const n = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return n || "—";
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export function InsurerClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/insurer/clients");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(Array.isArray(data) ? data : data.clients ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const term = searchTerm.trim().toLowerCase();
  const filtered = !term
    ? clients
    : clients.filter((c) =>
        [fullName(c), c.email, c.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Clients</h2>
        <p className="text-muted-foreground mt-1">Gérez votre portefeuille client.</p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client (nom, email, téléphone)..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Impossible de charger les clients</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Une erreur s&apos;est produite.</p>
          <button onClick={fetchClients} className="text-sm font-medium text-primary hover:underline">
            Réessayer
          </button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-center">Devis</TableHead>
                  <TableHead className="text-center">Contrats</TableHead>
                  <TableHead>Inscrit le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-0">
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">
                          {clients.length === 0 ? "Aucun client trouvé" : "Aucun résultat"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">
                          {clients.length === 0
                            ? "Les clients apparaissent ici lorsqu'ils soumettent un devis incluant l'une de vos offres d'assurance."
                            : "Aucun client ne correspond à votre recherche."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{fullName(c)}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-center tabular-nums">{c.quotesCount}</TableCell>
                      <TableCell className="text-center tabular-nums">{c.contractsCount}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(c.registeredAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
