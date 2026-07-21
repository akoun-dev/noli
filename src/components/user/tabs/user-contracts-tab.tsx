"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, FileCheck, Clock, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

export function UserContractsTab() {
  const { setView, setComparisonStep } = useAppStore();
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
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
        <h2 className="text-xl font-bold">Mes Contrats</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez vos contrats d&apos;assurance souscrits.
        </p>
      </motion.div>

      {/* Timeline vide améliorée */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-dashed bg-card/40 p-10 text-center"
      >
        <div className="rounded-full bg-gradient-to-br from-[#B9E54D]/20 to-[#B9E54D]/5 p-4 mx-auto w-fit mb-4">
          <Shield className="h-10 w-10 text-[#B9E54D]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun contrat souscrit pour le moment</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Vos contrats apparaîtront ici dès qu&apos;un devis aura été approuvé et signé.
          Commencez par une comparaison gratuite.
        </p>
        <Button
          className="bg-[#B9E54D] text-black hover:bg-[#a5d044] rounded-full shadow-sm"
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

      {/* Étapes explicatives */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
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
    </div>
  );
}