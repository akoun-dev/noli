"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ArrowRight,
  FileCheck,
  Clock,
  CheckCircle2,
  Building2,
  AlertCircle,
  FileWarning,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const CLAIM_TYPES = [
  { value: "ACCIDENT", label: "Accident" },
  { value: "VOL", label: "Vol" },
  { value: "BRIS_GLACE", label: "Bris de glace" },
  { value: "INCENDIE", label: "Incendie" },
  { value: "AUTRE", label: "Autre" },
];

const contractSteps = [
  {
    step: 1,
    icon: FileCheck,
    title: "Demandez un devis",
    description: "Comparez les offres et choisissez celle qui vous convient.",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  },
  {
    step: 2,
    icon: Clock,
    title: "Attendez l'approbation",
    description: "L'assureur examine votre demande et approuve votre devis.",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  },
  {
    step: 3,
    icon: CheckCircle2,
    title: "Signature & activation",
    description: "Signez électroniquement et votre contrat est actif immédiatement.",
    color: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
  },
  {
    step: 4,
    icon: Shield,
    title: "Suivi du contrat",
    description: "Consultez vos garanties, paiements et documents rattachés.",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
  },
];

interface Contract {
  id: string;
  reference: string;
  status: string;
  startDate: string;
  endDate: string | null;
  premium: number | null;
  createdAt: string;
  quote: { reference: string; finalPrice: number | null } | null;
  insurer: { id: string; name: string; code: string; logoUrl: string | null } | null;
  offer: { id: string; name: string } | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Actif",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  EXPIRED: {
    label: "Expiré",
    className:
      "bg-muted text-muted-foreground border-border dark:bg-muted/50 dark:text-muted-foreground",
  },
  CANCELLED: {
    label: "Résilié",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
};

const fmtFCFA = (n: number | null) =>
  n == null ? "—" : `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ── Dialogue de déclaration de sinistre ── */
function ClaimDialog({
  contract,
  onClose,
}: {
  contract: Contract | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = useState("ACCIDENT");
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contract) {
      setType("ACCIDENT");
      setIncidentDate("");
      setDescription("");
    }
  }, [contract]);

  const submit = async () => {
    if (!contract) return;
    if (description.trim().length < 10) {
      toast({
        title: "Description trop courte",
        description: "Merci de décrire le sinistre (au moins 10 caractères).",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: Number(contract.id),
          type,
          incidentDate: incidentDate || undefined,
          description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast({
        title: "Sinistre déclaré",
        description: `Référence ${data.reference}. Votre assureur va l'examiner.`,
      });
      onClose();
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Impossible de déclarer le sinistre.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!contract} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Déclarer un sinistre</DialogTitle>
          <DialogDescription>
            Contrat {contract?.reference} — {contract?.insurer?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claim-type">Type de sinistre</Label>
            <select
              id="claim-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CLAIM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="claim-date">Date du sinistre</Label>
            <Input
              id="claim-date"
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="claim-desc">Description</Label>
            <textarea
              id="claim-desc"
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les circonstances du sinistre…"
              className="w-full rounded-lg border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving} className="bg-brand text-black hover:bg-brand-hover">
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileWarning className="size-4 mr-2" />}
            Envoyer la déclaration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserContractsTab() {
  const { setView, setComparisonStep } = useAppStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimFor, setClaimFor] = useState<Contract | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/user/contracts");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Impossible de charger vos contrats.");
          return;
        }
        setContracts(data.contracts || []);
      } catch {
        setError("Impossible de charger vos contrats.");
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Mes Contrats</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez vos contrats d&apos;assurance souscrits.
        </p>
      </motion.div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-dashed bg-card/40 p-10 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Real contracts */}
      {!loading && !error && contracts.length > 0 && (
        <div className="space-y-3">
          {contracts.map((contract, i) => {
            const cfg = statusConfig[contract.status] || statusConfig.EXPIRED;
            return (
              <motion.div
                key={contract.id}
                initial={{ y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="rounded-xl border bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {contract.insurer?.logoUrl ? (
                            <img
                              src={contract.insurer.logoUrl}
                              alt={contract.insurer.name}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {contract.insurer?.name || "Assureur"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {contract.reference}
                          </p>
                        </div>
                      </div>
                      <Badge className={cfg.className}>{cfg.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Formule</p>
                        <p className="font-medium truncate">
                          {contract.offer?.name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Prime</p>
                        <p className="font-medium text-primary tabular-nums">
                          {fmtFCFA(contract.premium ?? contract.quote?.finalPrice ?? null)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Début</p>
                        <p className="font-medium">{fmtDate(contract.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Fin</p>
                        <p className="font-medium">{fmtDate(contract.endDate)}</p>
                      </div>
                    </div>
                    {contract.status === "ACTIVE" && (
                      <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClaimFor(contract)}
                        >
                          <FileWarning className="h-4 w-4 mr-2" />
                          Déclarer un sinistre
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && contracts.length === 0 && (
        <motion.div
          initial={{}}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-dashed bg-card/40 p-10 text-center"
        >
          <div className="rounded-full bg-gradient-to-br from-brand/20 to-brand/5 p-4 mx-auto w-fit mb-4">
            <Shield className="h-10 w-10 text-brand" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun contrat souscrit pour le moment</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Vos contrats apparaîtront ici dès qu&apos;un devis aura été approuvé.
            Commencez par une comparaison gratuite.
          </p>
          <Button
            className="bg-brand text-black hover:bg-brand-hover rounded-full shadow-sm"
            onClick={() => {
              setComparisonStep(1);
              setView("compare");
            }}
          >
            <Shield className="mr-2 h-4 w-4" />
            Demander un devis gratuit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Étapes explicatives (affichées quand aucun contrat) */}
      {!loading && contracts.length === 0 && (
        <motion.div
          initial={{ y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            Comment ça marche ?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {contractSteps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="rounded-xl border bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`rounded-lg p-2.5 w-fit mb-3 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {item.step}
                      </span>
                      <h4 className="text-sm font-medium">{item.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      <ClaimDialog contract={claimFor} onClose={() => setClaimFor(null)} />
    </div>
  );
}
