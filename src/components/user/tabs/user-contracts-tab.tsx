"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

export function UserContractsTab() {
  const { setView, setComparisonStep } = useAppStore();

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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center py-20"
      >
        <div className="rounded-full bg-muted p-5 mx-auto w-fit mb-5">
          <Shield className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun contrat souscrit pour le moment</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Vos contrats apparaîtront ici dès qu&apos;un devis aura été approuvé et signé par l&apos;assureur.
          Commencez par demander un devis pour souscrire à une offre d&apos;assurance.
        </p>
        <Button
          className="bg-[#B9E54D] text-black hover:bg-[#a5d044] rounded-full"
          onClick={() => {
            setComparisonStep(1);
            setView("compare");
          }}
        >
          Demander un devis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}