"use client";

import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Target,
} from "lucide-react";

const metricCards = [
  {
    label: "Total devis",
    value: "45",
    description: "depuis le début",
    icon: FileText,
  },
  {
    label: "Taux d'acceptation",
    value: "68%",
    description: "devis approuvés",
    icon: TrendingUp,
  },
  {
    label: "Revenu moyen / devis",
    value: "100 000 FCFA",
    description: "montant moyen",
    icon: DollarSign,
  },
  {
    label: "Clients uniques",
    value: "32",
    description: "clients actifs",
    icon: Users,
  },
];

const chartPlaceholders = [
  {
    title: "Évolution des devis (6 derniers mois)",
    icon: BarChart3,
    height: "h-64",
  },
  {
    title: "Répartition par catégorie",
    icon: PieChart,
    height: "h-64",
  },
  {
    title: "Performance par offre",
    icon: Target,
    height: "h-48",
  },
];

export function InsurerAnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Suivez les performances de vos offres et votre activité sur NOLI.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.description}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chartPlaceholders.map((chart) => {
          const Icon = chart.icon;
          return (
            <div
              key={chart.title}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{chart.title}</h3>
              </div>
              <div
                className={`${chart.height} w-full rounded-lg bg-muted flex items-center justify-center`}
              >
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground/60">
                    Graphique bientôt disponible
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}