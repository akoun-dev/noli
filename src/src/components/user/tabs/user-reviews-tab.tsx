"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, ThumbsUp, Shield, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StarDisplay({ count, size = "md" }: { count: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < count
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

const demoReviews = [
  {
    initials: "JD",
    name: "Jean Dupont",
    insurer: "SAHAM Assurances",
    date: "il y a 3 jours",
    rating: 4,
    text: "Service rapide et professionnel. Mon devis a été traité en moins de 24h. Je recommande cette plateforme.",
    likes: 12,
  },
  {
    initials: "AK",
    name: "Aminata Koné",
    insurer: "NOLIA Assurance",
    date: "il y a 1 semaine",
    rating: 5,
    text: "Excellente expérience ! Le comparateur m'a permis d'économiser 35% sur ma prime annuelle. Interface intuitive et équipe réactive.",
    likes: 28,
  },
];

export function UserReviewsTab() {
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-48 w-full rounded-xl" />
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
        <h2 className="text-xl font-bold">Mes Avis</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Partagez votre expérience avec les assureurs.
        </p>
      </motion.div>

      {/* État vide amélioré */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-dashed bg-card/40 p-10 text-center"
      >
        <div className="rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 mx-auto w-fit mb-4">
          <MessageSquare className="h-10 w-10 text-yellow-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Vous n&apos;avez pas encore laissé d&apos;avis
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Une fois votre contrat souscrit, vous pourrez noter et commenter votre expérience
          pour aider d&apos;autres utilisateurs à faire le bon choix.
        </p>
      </motion.div>

      {/* Exemples d'avis améliorés */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Avis récents</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">4.5</span>
            <span>/ 5 — 2 avis</span>
          </div>
        </div>
        <div className="space-y-3">
          {demoReviews.map((review, i) => (
            <Card key={i} className="rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#B9E54D] to-[#a5d044] flex items-center justify-center text-black font-bold text-sm">
                      {review.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{review.name}</p>
                        <Shield className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{review.insurer}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <StarDisplay count={review.rating} size="sm" />
                </div>
                <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{review.likes}</span>
                  </button>
                  <span className="text-xs text-muted-foreground">Utile ?</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}