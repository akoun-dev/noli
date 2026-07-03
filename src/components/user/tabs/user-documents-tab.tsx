"use client";

import { motion } from "framer-motion";
import { FolderOpen, FileCheck, FileText, Receipt, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const docCategories = [
  {
    icon: FileCheck,
    title: "Attestations d'assurance",
    description: "Vos attestations d'assurance valides pour chaque contrat souscrit.",
  },
  {
    icon: FileText,
    title: "Conditions Générales (CGV)",
    description: "Les conditions générales de vente applicables à vos contrats.",
  },
  {
    icon: Receipt,
    title: "Quittances de paiement",
    description: "Vos reçus et justificatifs de paiement de primes d'assurance.",
  },
];

export function UserDocumentsTab() {
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center py-20"
      >
        <div className="rounded-full bg-muted p-5 mx-auto w-fit mb-5">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun document disponible</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
          Vos documents (attestations, CGV, quittances) apparaîtront ici automatiquement
          lorsque vous souscrirez à un contrat d&apos;assurance.
        </p>
      </motion.div>

      {/* Document categories preview */}
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
              <Card key={cat.title} className="rounded-xl border bg-card">
                <CardContent className="p-5">
                  <div className="rounded-lg bg-muted p-2.5 w-fit mb-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
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