"use client";

import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < count
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export function UserReviewsTab() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Mes Avis</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Partagez votre expérience avec les assureurs et leurs offres.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center py-20"
      >
        <div className="rounded-full bg-muted p-5 mx-auto w-fit mb-5">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Vous n&apos;avez pas encore laissé d&apos;avis
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Vous pourrez laisser un avis sur votre expérience une fois que vous
          aurez souscrit à un contrat d&apos;assurance.
        </p>
      </motion.div>

      {/* Rating example */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-base font-semibold mb-4">Exemple d&apos;avis</h3>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#B9E54D] flex items-center justify-center text-black font-bold text-sm">
                JD
              </div>
              <div>
                <p className="text-sm font-medium">Jean Dupont</p>
                <p className="text-xs text-muted-foreground">Assureur : SAHAM Assurances</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">il y a 3 jours</span>
          </div>
          <StarDisplay count={4} />
          <p className="text-sm text-muted-foreground mt-3">
            &quot;Service rapide et professionnel. Mon devis a été traité en moins de 24h.
            Je recommande cette plateforme.&quot;
          </p>
        </div>
      </motion.div>
    </div>
  );
}