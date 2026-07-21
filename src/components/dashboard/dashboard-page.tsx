"use client";

import { useMemo, useState, useEffect } from "react";
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
  Loader2,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { QuoteRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Brouillon",
    className:
      "bg-muted text-muted-foreground border border-border dark:bg-muted/50 dark:text-muted-foreground dark:border-border",
  },
  PENDING: {
    label: "En attente",
    className:
      "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  },
  IN_PROGRESS: {
    label: "En cours",
    className:
      "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  APPROVED: {
    label: "Approuvé",
    className:
      "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  REJECTED: {
    label: "Rejeté",
    className:
      "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  },
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

interface DBQuote {
  id: string;
  reference: string;
  status: string;
  estimatedPrice: number | null;
  finalPrice: number | null;
  vehicleData: string;
  personalData: string;
  coverageRequirements: string;
  createdAt: string;
  category: { id: string; name: string } | null;
  offer: { id: string; name: string; insurer: { id: string; name: string; logoUrl: string | null } } | null;
}

function getCoverageLabelFromData(coverageData: string): string {
  try {
    const data = JSON.parse(coverageData);
    const cats = data.guaranteeCategories || [];
    if (cats.length >= 6 || cats.includes("individuelle_conducteur")) return "Tous Risques";
    if (cats.length >= 3 || cats.includes("incendie") || cats.includes("vol")) return "Tiers+";
    return "Tiers";
  } catch {
    return "Tiers";
  }
}

function getVehicleYear(vehicleData: string): string {
  try {
    const data = JSON.parse(vehicleData);
    return data.year?.split("-")[0] || "?";
  } catch {
    return "?";
  }
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
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
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
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold mt-0.5 text-primary">{value}</p>
                {sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuoteRow({ quote }: { quote: DBQuote }) {
  const status = statusConfig[quote.status] || statusConfig.DRAFT;
  const date = new Date(quote.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const coverageLabel = getCoverageLabelFromData(quote.coverageRequirements);
  const vehicleYear = getVehicleYear(quote.vehicleData);

  return (
    <TableRow className="group">
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
          Auto {vehicleYear}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="flex items-center gap-1.5 text-sm">
          {getCoverageBadge(coverageLabel)}
          {coverageLabel}
        </span>
      </TableCell>
      <TableCell className="font-medium text-sm">
        {quote.estimatedPrice ? formatFCFA(quote.estimatedPrice) : "—"}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="size-3" />
          {quote.offer?.insurer?.name || "NOLI"}
        </span>
      </TableCell>
      <TableCell>
        <Badge className={status.className}>{status.label}</Badge>
      </TableCell>
    </TableRow>
  );
}

function QuoteCard({ quote }: { quote: DBQuote }) {
  const status = statusConfig[quote.status] || statusConfig.DRAFT;
  const date = new Date(quote.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const coverageLabel = getCoverageLabelFromData(quote.coverageRequirements);
  const vehicleYear = getVehicleYear(quote.vehicleData);

  return (
    <Card className="card-shadow bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {quote.reference}
            </p>
            <p className="text-sm font-medium mt-1">
              {quote.offer?.insurer?.name || "NOLI Assurance"}
            </p>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Véhicule</p>
            <p className="font-medium">Auto {vehicleYear}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date</p>
            <p className="font-medium">{date}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Prix estimé</p>
            <p className="font-medium text-primary">
              {quote.estimatedPrice ? formatFCFA(quote.estimatedPrice) : "—"}
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
  const { user, setView } = useAppStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [dbQuotes, setDbQuotes] = useState<DBQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    createdAt: string;
  } | null>(null);

  // Fetch user quotes and profile from DB
  useEffect(() => {
    if (!user.isLoggedIn || !user.id) {
      setQuotesLoading(false);
      return;
    }

    const fetchData = async () => {
      setQuotesLoading(true);
      try {
        const [quotesRes, profileRes] = await Promise.all([
          fetch(`/api/quotes?userId=${user.id}`),
          fetch(`/api/user/profile?userId=${user.id}`),
        ]);

        if (quotesRes.ok) {
          const data = await quotesRes.json();
          setDbQuotes(data.quotes || []);
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfileData({
            firstName: data.profile?.firstName || "",
            lastName: data.profile?.lastName || "",
            phone: data.profile?.phone || "",
            createdAt: data.profile?.createdAt || "",
          });
        }
      } catch {
        // Silently fail — dashboard still shows structure
      } finally {
        setQuotesLoading(false);
      }
    };

    fetchData();
  }, [user.isLoggedIn, user.id]);

  const stats = useMemo(() => {
    const totalQuotes = dbQuotes.length;
    const pendingCount = dbQuotes.filter(
      (q) => q.status === "PENDING" || q.status === "DRAFT" || q.status === "IN_PROGRESS"
    ).length;

    const pricedQuotes = dbQuotes.filter((q) => (q.estimatedPrice || 0) > 0);
    let savings = 0;
    if (pricedQuotes.length >= 2) {
      const prices = pricedQuotes.map((q) => (q.estimatedPrice || 0) * 11);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      savings = max - min;
    }

    return { totalQuotes, pendingCount, savings };
  }, [dbQuotes]);

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

  const memberSince = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">
              Bonjour,{" "}
              <span className="text-foreground font-medium">
                {user.name || "Utilisateur"}
              </span>{" "}
              👋
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-fit"
            onClick={() => setView("profile")}
          >
            <User className="size-4" />
            Mon profil
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="Devis demandés"
          value={quotesLoading ? "—" : stats.totalQuotes}
          sub="au total"
          loading={quotesLoading}
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={quotesLoading ? "—" : stats.pendingCount}
          sub="en cours de traitement"
          loading={quotesLoading}
        />
        <StatCard
          icon={TrendingDown}
          label="Économies estimées"
          value={quotesLoading ? "—" : stats.savings > 0 ? formatFCFA(stats.savings) : "—"}
          sub={
            stats.savings > 0
              ? "en comparant les offres"
              : "comparez pour voir"
          }
          loading={quotesLoading}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full justify-start"
            onClick={() => setView("compare")}
          >
            <Zap className="size-4" />
            Nouvelle comparaison
          </Button>
          <Button
            variant="outline"
            className="rounded-full justify-start"
            onClick={() => setView("offers")}
          >
            <Shield className="size-4" />
            Parcourir les offres
          </Button>
          <Button
            variant="outline"
            className="rounded-full justify-start"
            onClick={() => setView("profile")}
          >
            <User className="size-4" />
            Modifier mon profil
          </Button>
        </div>
      </motion.div>

      {/* My Quotes Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-8"
      >
        <Card className="card-shadow bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Mes demandes de devis</CardTitle>
            {!quotesLoading && dbQuotes.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {dbQuotes.length} devis
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {quotesLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16 hidden sm:block" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : dbQuotes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-4">
                  <SearchX className="size-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">
                  Aucun devis demandé pour le moment
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
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
                <div className="hidden xl:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Couverture</TableHead>
                        <TableHead>Prix estimé</TableHead>
                        <TableHead>Assureur</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbQuotes.map((q) => (
                        <QuoteRow key={q.id} quote={q} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile/tablet cards */}
                <div className="xl:hidden p-4 space-y-3">
                  {dbQuotes.map((q) => (
                    <QuoteCard key={q.id} quote={q} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Summary (Collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
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
                      Vos informations personnelles
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nom complet</p>
                      <p className="text-sm font-medium">
                        {user.name || "Non renseigné"}
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
                        {user.email || "Non renseigné"}
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
                        {profileData?.phone
                          ? `+225 ${profileData.phone}`
                          : "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  {memberSince && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-muted p-2">
                        <CalendarDays className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Membre depuis</p>
                        <p className="text-sm font-medium capitalize">
                          {memberSince}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 rounded-full"
                  onClick={() => setView("profile")}
                >
                  Modifier mon profil
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </section>
  );
}