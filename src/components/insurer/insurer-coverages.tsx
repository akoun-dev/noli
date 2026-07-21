"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Shield, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";

interface Coverage {
  id: string;
  code: string;
  name: string;
  type: string | null;
  category: string | null;
  isMandatory: boolean;
  status: string;
  description: string | null;
}

function statusBadge(status: string) {
  const s = status?.toLowerCase();
  switch (s) {
    case "active":
      return <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20">Active</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/* ── Coverages Tab ── */
export function InsurerCoverages() {
  const { user } = useAppStore();
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);

  const fetchCoverages = useCallback(() => {
    if (!user.id) return;
    fetch(`/api/insurer/coverages?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const list: Coverage[] = (data.coverages || []).map((c: Record<string, unknown>) => ({
          ...c,
          category: typeof c.category === 'object' && c.category
            ? (c.category as Record<string, unknown>).name as string
            : (c.category as string | null),
        }));
        setCoverages(list);
        // Extract unique categories
        const cats = [...new Set(list.map((c) => c.category).filter(Boolean) as string[])].sort();
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => { fetchCoverages(); }, [fetchCoverages]);

  // Client-side filtering
  const filtered = coverages.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#B9E54D]" />
          Garanties
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {coverages.length} garantie{coverages.length > 1 ? "s" : ""} au total
          {filtered.length !== coverages.length && ` · ${filtered.length} affichée${filtered.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou code..."
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
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            Aucune garantie trouvée
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Obligatoire</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.type || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell>
                      {c.isMandatory ? (
                        <Badge variant="outline" className="border-green-500/30 text-green-600">Oui</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.isMandatory && (
                        <Badge variant="outline" className="border-green-500/30 text-green-600 text-xs">Oblig.</Badge>
                      )}
                      {statusBadge(c.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{c.type || "—"} · {c.category || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}