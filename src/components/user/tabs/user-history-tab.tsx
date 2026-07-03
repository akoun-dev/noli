"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";

export function UserHistoryTab() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Historique</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Consultez l&apos;historique de vos comparaisons d&apos;assurance.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center py-20"
      >
        <div className="rounded-full bg-muted p-5 mx-auto w-fit mb-5">
          <History className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun historique de comparaison</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Votre historique de comparaisons sera enregistré automatiquement ici.
          Chaque fois que vous effectuez une comparaison d&apos;offres, elle sera
          ajoutée à cette liste pour vous permettre de retrouver facilement vos recherches.
        </p>
      </motion.div>
    </div>
  );
}