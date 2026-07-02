"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  TrendingDown,
  Zap,
  Headphones,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  CalendarDays,
  Car,
  Shield,
  ShieldCheck,
  ShieldAlert,
  SearchX,
  LogIn,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { QuoteRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

const formatFCFA = (amount: number) =>
  new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

const statusConfig: Record<
  QuoteRecord["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "En attente",
    className:
      "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  in_progress: {
    label: "En cours",
    className:
      "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  approved: {
    label: "Approuvé",
    className:
      "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejeté",
    className:
      "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
};

function getCoverageLabel(coverageNeeds: QuoteRecord["coverageNeeds"]): string {
  const cats = coverageNeeds.guaranteeCategories || [];
  if (cats.length >= 6 || cats.includes("individuelle_conducteur")) return "Tous Risques";
  if (cats.length >= 3 || cats.includes("incendie") || cats.includes("vol")) return "Tiers+";
  return "Tiers";
}

function getCoverageBadge(type: string) {
  switch (type) {
    case "Tous Risques":
      return <ShieldAlert className="size-3.5 text-orange-500" />;
    case "Tiers+":
      return <ShieldCheck className="size-3.5 text-primary" />;
    default:
      return <Shield className="size-3.5 text-muted-foreground" />;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-shadow bg-card">
        <CardContent className="p-4 sm:p-6 flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-0.5 text-primary">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuoteRow({ quote }: { quote: QuoteRecord }) {
  const status = statusConfig[quote.status];
  const date = new Date(quote.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const coverageLabel = getCoverageLabel(quote.coverageNeeds);
  const vehicleYear = quote.vehicleInfo.year?.split("-")[0];
  const vehicleLabel = vehicleYear
    ? `Auto ${vehicleYear}`
    : "Auto";

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{quote.reference}</TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className="flex items-center gap-1.5 text-sm">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          {date}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5 text-sm">
          <Car className="size-3.5 text-muted-foreground shrink-0" />
          {vehicleLabel}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="flex items-center gap-1.5 text-sm">
          {getCoverageBadge(coverageLabel)}
          {coverageLabel}
        </span>
      </TableCell>
      <TableCell className="font-medium text-sm">
        {formatFCFA(quote.proposedPrice)}
      </TableCell>
      <TableCell>
        <Badge className={status.className}>{status.label}</Badge>
      </TableCell>
    </TableRow>
  );
}

function QuoteCard({ quote }: { quote: QuoteRecord }) {
  const status = statusConfig[quote.status];
  const date = new Date(quote.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const coverageLabel = getCoverageLabel(quote.coverageNeeds);
  const vehicleYear = quote.vehicleInfo.year?.split("-")[0];
  const vehicleLabel = vehicleYear
    ? `Auto ${vehicleYear}`
    : "Auto";

  return (
    <Card className="card-shadow bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {quote.reference}
            </p>
            <p className="text-sm font-medium mt-1">{quote.insurerName}</p>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Véhicule</p>
            <p className="font-medium">{vehicleLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date</p>
            <p className="font-medium">{date}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Prix proposé</p>
            <p className="font-medium text-primary">
              {formatFCFA(quote.proposedPrice)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Couverture</p>
            <p className="font-medium">{coverageLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user, userQuotes, setView, personalInfo } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const stats = useMemo(() => {
    const totalQuotes = userQuotes.length;
    const pendingCount = userQuotes.filter(
      (q) => q.status === "pending" || q.status === "in_progress"
    ).length;

    const pricedQuotes = userQuotes.filter((q) => q.proposedPrice > 0);
    let savings = 0;
    if (pricedQuotes.length >= 2) {
      const prices = pricedQuotes.map((q) => q.proposedPrice * 12);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      savings = max - min;
    }

    return { totalQuotes, pendingCount, savings };
  }, [userQuotes]);

  // Not logged in state
  if (!user.isLoggedIn) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="rounded-full bg-primary/10 p-6 mx-auto w-fit mb-6">
          <LogIn className="size-10 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Tableau de bord</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Connectez-vous pour accéder à votre espace personnel, suivre
          vos demandes de devis et gérer votre profil.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => setView("login")}
          >
            <LogIn className="size-4" />
            Se connecter
          </Button>
          <Button
            variant="outline"
            onClick={() => setView("register")}
          >
            Créer un compte
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Bonjour, <span className="text-foreground font-medium">{user.name || "Utilisateur"}</span> 👋
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="Devis demandés"
          value={stats.totalQuotes}
          sub="au total"
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats.pendingCount}
          sub="en cours de traitement"
        />
        <StatCard
          icon={TrendingDown}
          label="Économies estimées"
          value={stats.savings > 0 ? formatFCFA(stats.savings) : "—"}
          sub={
            stats.savings > 0
              ? "en comparant les offres"
              : "comparez pour voir"
          }
        />
      </div>

      {/* My Quotes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <Card className="card-shadow bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Mes demandes de devis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {userQuotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
                  <SearchX className="size-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">
                  Aucun devis demandé pour le moment
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Commencez par comparer des offres d&apos;assurance pour voir vos devis
                  apparaître ici.
                </p>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                  onClick={() => setView("compare")}
                >
                  <Zap className="size-4" />
                  Comparer des offres
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Couverture</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userQuotes.map((q) => (
                        <QuoteRow key={q.id} quote={q} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden p-4 space-y-3">
                  {userQuotes.map((q) => (
                    <QuoteCard key={q.id} quote={q} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => setView("compare")}
          >
            <Zap className="size-4" />
            Comparer une nouvelle assurance
          </Button>
          <Button variant="outline">
            <Headphones className="size-4" />
            Contacter le support
          </Button>
        </div>
      </motion.div>

      {/* Profile Section (Collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
          <Card className="card-shadow bg-card">
            <CollapsibleTrigger className="w-full text-left">
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Mon profil</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Gérer vos informations personnelles
                    </p>
                  </div>
                </div>
                {profileOpen ? (
                  <ChevronUp className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-5 text-muted-foreground" />
                )}
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nom complet</p>
                      <p className="text-sm font-medium">
                        {personalInfo.firstName && personalInfo.lastName
                          ? `${personalInfo.firstName} ${personalInfo.lastName}`
                          : user.name || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">
                        {user.email || personalInfo.email || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Phone className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Téléphone</p>
                      <p className="text-sm font-medium">
                        {personalInfo.phone
                          ? `+225 ${personalInfo.phone}`
                          : "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="mt-2">
                  Modifier mon profil
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </section>
  );
}