"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, FileCheck, FileText, Receipt, Download, Lock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const docCategories = [
  {
    icon: FileCheck,
    title: "Attestations d'assurance",
    description: "Attestations valides pour chaque contrat souscrit.",
    color: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
    badge: "PDF",
  },
  {
    icon: FileText,
    title: "Conditions Générales",
    description: "CGV applicables à vos contrats d'assurance.",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    badge: "PDF",
  },
  {
    icon: Receipt,
    title: "Quittances de paiement",
    description: "Reçus et justificatifs de vos primes.",
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    badge: "PDF",
  },
];

export function UserDocumentsTab() {
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Mes Documents</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Retrouvez tous vos documents d&apos;assurance en un seul endroit.
        </p>
      </motion.div>

      {/* État vide amélioré */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-dashed bg-card/40 p-10 text-center"
      >
        <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 mx-auto w-fit mb-4">
          <FolderOpen className="h-10 w-10 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun document disponible</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Vos documents (attestations, CGV, quittances) apparaîtront ici automatiquement
          après souscription à un contrat d&apos;assurance.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-green-500" />
            Documents sécurisés
          </div>
          <div className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-blue-500" />
            Téléchargement PDF
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Mise à jour automatique
          </div>
        </div>
      </motion.div>

      {/* Catégories de documents améliorées */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-base font-semibold mb-4">Types de documents disponibles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {docCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.title} className="rounded-xl border bg-card hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-default">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`rounded-lg p-2.5 ${cat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {cat.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium mb-1">{cat.title}</h4>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}