"use client";

import { motion } from "framer-motion";
import {
  Car,
  Bike,
  Heart,
  Home,
  Shield,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

const insuranceCards = [
  {
    label: "ASSURANCE AUTO",
    icon: Car,
    badge: "En service",
    badgeClass: "bg-primary/10 text-primary",
    available: true,
  },
  {
    label: "ASSURANCE MOTO",
    icon: Bike,
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "MUTUELLE SANTÉ",
    icon: Heart,
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "ASSURANCE HABITATION",
    icon: Home,
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "ASSURANCE EMPRUNTEUR",
    icon: Shield,
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "ÉNERGIE & SERVICES",
    icon: Zap,
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function LandingPage() {
  const setView = useAppStore((s) => s.setView);

  return (
    <main
      className="flex-1 relative min-h-[calc(100vh-4rem)]"
      style={{
        backgroundImage: "radial-gradient(circle, hsl(148 13% 73% / 0.35) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-8 py-12 md:py-20">
        {/* Header area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10 text-center md:mb-14"
        >
          <h1
            className="font-[family-name:var(--font-space-grotesk)] font-bold uppercase tracking-wide text-foreground"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            CHOISISSEZ VOTRE ASSURANCE
          </h1>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Auto disponible • autres en approche
          </p>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* LEFT COLUMN — Insurance cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {insuranceCards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    variants={itemVariants}
                    className={`group flex flex-col items-center gap-3 rounded-xl bg-white p-4 card-shadow transition-all duration-300 ${
                      card.available
                        ? "cursor-pointer hover:scale-[1.03] card-shadow-hover"
                        : "cursor-default opacity-70 pointer-events-none"
                    }`}
                    onClick={() => {
                      if (card.available) setView("compare");
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-center text-xs font-semibold uppercase tracking-wide text-foreground">
                      {card.label}
                    </span>
                    <span
                      className={`rounded-full px-2 text-xs ${card.badgeClass}`}
                    >
                      {card.badge}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT COLUMN — Mascot + Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center justify-center py-6 lg:py-0"
          >
            {/* Mascot placeholder */}
            <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/20">
              <span className="text-8xl" role="img" aria-label="Mascotte zèbre">
                🦓
              </span>
            </div>

            {/* Feature items */}
            <div className="mt-10 flex w-full max-w-xs flex-col gap-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    Auto déjà disponible
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Devis immédiat et souscription guidée
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    Transparence totale
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Offres triées et expliquées
                  </p>
                </div>
              </div>
            </div>

            {/* New parcours label */}
            <p className="mt-10 text-xs uppercase tracking-wider text-muted-foreground">
              NOUVEAU PARCOURS
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}