"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatLastLogin,
  roleColors,
  roleLabels,
  type Profile,
  type Role,
} from "./settings-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface AccountsTabProps {
  profiles: Profile[];
  search: string;
  setSearch: (s: string) => void;
  roles: Role[];
  expandedRow: string | null;
  setExpandedRow: (id: string | null) => void;
  toggleProfileStatus: (p: Profile) => void;
  changeProfileRole: (p: Profile, r: string) => void;
  deleteProfile: (p: Profile) => void;
}

export function SettingsAccountsTab({
  profiles,
  search,
  setSearch,
  roles,
  expandedRow,
  setExpandedRow,
  toggleProfileStatus,
  changeProfileRole,
  deleteProfile,
}: AccountsTabProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Gestion des comptes</h2>
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
              <TableHead>Rôle</TableHead>
              <TableHead>Rôles personnalisés</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead>Devis</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => {
              const isExpanded = expandedRow === p.id;
              return (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() =>
                    setExpandedRow(isExpanded ? null : p.id)
                  }
                >
                  <TableCell className="font-medium">
                    {p.lastName || "—"} {p.firstName || ""}
                  </TableCell>
                  <TableCell className="text-sm">{p.email}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[p.role] || ""}>
                      {roleLabels[p.role] || p.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.role === "ADMIN" && (
                        <Badge variant="outline" className="text-xs">
                          Super Admin
                        </Badge>
                      )}
                      {p.role === "INSURER" && (
                        <Badge variant="outline" className="text-xs">
                          Gestionnaire
                        </Badge>
                      )}
                      {roles
                        .filter((r) => r.name === p.role)
                        .map((r) => (
                          <Badge
                            key={r.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {r.label}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        Actif
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        Inactif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastLogin(p.lastLogin)}
                  </TableCell>
                  <TableCell className="text-center">
                    {p._count.quotes}
                  </TableCell>
                  <TableCell>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Aucun compte trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {profiles.map((p) => {
          const isExpanded = expandedRow === p.id;
          return (
            <Card
              key={p.id}
              className="cursor-pointer"
              onClick={() =>
                setExpandedRow(isExpanded ? null : p.id)
              }
            >
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
                  <div className="flex items-center gap-2">
                    {p.isActive ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
                        Actif
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs">
                        Inactif
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={roleColors[p.role] || ""}>
                    {roleLabels[p.role] || p.role}
                  </Badge>
                  <span className="text-muted-foreground">
                    Dernière connexion : {formatLastLogin(p.lastLogin)}
                  </span>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div
                    className="pt-3 border-t space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Rôles assignés
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge className={roleColors[p.role] || ""}>
                          {roleLabels[p.role] || p.role}
                        </Badge>
                        {roles
                          .filter((r) => r.name === p.role)
                          .map((r) => (
                            <Badge
                              key={r.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {r.label}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Résumé des permissions
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {p.role === "ADMIN"
                          ? "Accès complet : gestion des assureurs, offres, garanties, utilisateurs, paramètres."
                          : p.role === "INSURER"
                            ? "Gestion des offres, garanties et consultation des devis associés."
                            : "Consultation des devis et gestion du profil personnel."}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Résumé d&apos;activité
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {p._count.quotes} devis · Inscrit le{" "}
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString(
                              "fr-FR"
                            )
                          : "—"}{" "}
                        · Dernière connexion :{" "}
                        {formatLastLogin(p.lastLogin)}
                      </p>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant={p.isActive ? "outline" : "default"}
                        size="sm"
                        className={
                          p.isActive ? "" : "bg-brand text-black hover:bg-brand-hover"
                        }
                        onClick={() => toggleProfileStatus(p)}
                      >
                        {p.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Select
                        value={p.role}
                        onValueChange={(v) => changeProfileRole(p, v)}
                      >
                        <SelectTrigger className="h-9 w-full sm:w-44">
                          <SelectValue placeholder="Changer le rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Utilisateur</SelectItem>
                          <SelectItem value="INSURER">Assureur</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {profiles.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Aucun compte trouvé
          </p>
        )}
      </div>

      {/* Desktop expanded row panel */}
      {expandedRow && (
        <div className="hidden md:block mt-4">
          <Card className="w-full">
            <CardContent className="p-6 space-y-4">
              {(() => {
                const p = profiles.find(
                  (pr) => pr.id === expandedRow
                );
                if (!p) return null;
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Rôles assignés
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={roleColors[p.role] || ""}>
                            {roleLabels[p.role] || p.role}
                          </Badge>
                          {roles
                            .filter((r) => r.name === p.role)
                            .map((r) => (
                              <Badge
                                key={r.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {r.label}
                              </Badge>
                            ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Permissions
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p.role === "ADMIN"
                            ? "Accès complet"
                            : p.role === "INSURER"
                              ? "Gestion offres/devis"
                              : "Consultation"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Activité
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p._count.quotes} devis · Inscrit le{" "}
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString(
                                "fr-FR"
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        variant={p.isActive ? "outline" : "default"}
                        size="sm"
                        className={
                          p.isActive
                            ? ""
                            : "bg-brand text-black hover:bg-brand-hover"
                        }
                        onClick={() => toggleProfileStatus(p)}
                      >
                        {p.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Select
                        value={p.role}
                        onValueChange={(v) => changeProfileRole(p, v)}
                      >
                        <SelectTrigger className="h-9 w-44">
                          <SelectValue placeholder="Changer le rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">Utilisateur</SelectItem>
                          <SelectItem value="INSURER">Assureur</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Supprimer
                      </Button>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte et toutes les données associées seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const p = profiles.find((pr) => pr.id === deleteId);
                if (p) deleteProfile(p);
                setDeleteId(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
