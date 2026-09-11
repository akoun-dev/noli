"use client";

import { useCallback, useEffect, useState } from "react";
import { UserCheck, Building2, Mail, Phone, CalendarDays, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface PendingCompany {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}
interface PendingInsurer {
  profileId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  company: PendingCompany | null;
}

export function InsurerValidationTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<PendingInsurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null); // profileId en cours

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/insurers/pending");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de chargement");
      setItems(json.data || []);
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de charger les comptes en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const act = useCallback(
    async (profileId: string, action: "validate" | "reject") => {
      setActing(profileId);
      try {
        const res = await fetch("/api/admin/insurers/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId, action }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Action impossible");
        toast({
          title: action === "validate" ? "Compte assureur validé" : "Compte rejeté",
          description:
            action === "validate"
              ? "L'assureur peut désormais accéder à son espace."
              : "Le compte en attente a été supprimé.",
        });
        setItems((prev) => prev.filter((i) => i.profileId !== profileId));
      } catch (err) {
        toast({
          title: "Erreur",
          description: err instanceof Error ? err.message : "Action impossible",
          variant: "destructive",
        });
      } finally {
        setActing(null);
      }
    },
    [toast]
  );

  const fullName = (i: PendingInsurer) =>
    [i.firstName, i.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserCheck className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Validation des comptes assureurs</h2>
        {!loading && (
          <Badge variant="outline" className="ml-1">
            {items.length} en attente
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Les assureurs qui s&apos;inscrivent eux-mêmes restent inactifs jusqu&apos;à validation.
        Valider active le compte et sa compagnie ; rejeter supprime le compte en attente.
      </p>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            Aucun compte assureur en attente de validation.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vue tableau (desktop) */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Compagnie</TableHead>
                  <TableHead>Coordonnées</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.profileId}>
                    <TableCell className="font-medium">{fullName(i)}</TableCell>
                    <TableCell>
                      {i.company ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {i.company.name}
                          <span className="text-xs text-muted-foreground">({i.company.code})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" />
                          {i.email}
                        </span>
                        {i.phone && (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3.5" />
                            {i.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => act(i.profileId, "validate")}
                          disabled={acting === i.profileId}
                        >
                          {acting === i.profileId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          <span className="ml-1">Valider</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(i.profileId, "reject")}
                          disabled={acting === i.profileId}
                        >
                          <X className="size-4" />
                          <span className="ml-1">Rejeter</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vue cartes (mobile) */}
          <div className="md:hidden space-y-3">
            {items.map((i) => (
              <Card key={i.profileId} className="rounded-xl border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{fullName(i)}</p>
                      {i.company && (
                        <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                          <Building2 className="size-3.5" />
                          {i.company.name} ({i.company.code})
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {new Date(i.createdAt).toLocaleDateString("fr-FR")}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-0.5">
                    <p className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {i.email}
                    </p>
                    {i.phone && (
                      <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3.5" />
                        {i.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => act(i.profileId, "validate")}
                      disabled={acting === i.profileId}
                    >
                      {acting === i.profileId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      <span className="ml-1">Valider</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => act(i.profileId, "reject")}
                      disabled={acting === i.profileId}
                    >
                      <X className="size-4" />
                      <span className="ml-1">Rejeter</span>
                    </Button>
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
