"use client";

import { Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleColors, roleLabels, type Profile } from "./settings-types";

export interface UsersTabProps {
  profiles: Profile[];
  search: string;
  setSearch: (s: string) => void;
  toggleProfileStatus: (p: Profile) => void;
  openEdit: (p: Profile) => void;
}

export function SettingsUsersTab({
  profiles,
  search,
  setSearch,
  toggleProfileStatus,
  openEdit,
}: UsersTabProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Utilisateurs</h2>
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-center">Devis</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.lastName || "—"} {p.firstName || ""}
                </TableCell>
                <TableCell className="text-sm">{p.email}</TableCell>
                <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                <TableCell>
                  <Badge className={roleColors[p.role] || ""}>
                    {roleLabels[p.role] || p.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {p._count.quotes}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={() => toggleProfileStatus(p)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {profiles.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {p.lastName || "—"} {p.firstName || ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.email}
                  </p>
                </div>
                <Badge className={roleColors[p.role] || ""}>
                  {roleLabels[p.role] || p.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {p.phone || "—"} · {p._count.quotes} devis
                </span>
                <span className="text-muted-foreground">
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Actif</Label>
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={() => toggleProfileStatus(p)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(p)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {profiles.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Aucun utilisateur trouvé
          </p>
        )}
      </div>
    </>
  );
}
