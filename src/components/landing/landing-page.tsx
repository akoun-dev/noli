"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Car,
  Bike,
  Heart,
  Home,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

/* ─── Data ─────────────────────────────────────────────────────── */
const insuranceCards = [
  {
    label: "Assurance Auto",
    icon: Car,
    color: "#F97316",
    colorBg: "rgba(249,115,22,0.10)",
    savings: "Jusqu'à 40% d'économies",
    badge: "En service",
    badgeClass: "bg-[#16A34A]/10 text-[#16A34A]",
    available: true,
  },
  {
    label: "Assurance Moto",
    icon: Bike,
    color: "#3B82F6",
    colorBg: "rgba(59,130,246,0.10)",
    savings: "Jusqu'à 35% d'économies",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Mutuelle Santé",
    icon: Heart,
    color: "#22C55E",
    colorBg: "rgba(34,197,94,0.10)",
    savings: "Jusqu'à 30% d'économies",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Assurance Habitation",
    icon: Home,
    color: "#EF4444",
    colorBg: "rgba(239,68,68,0.10)",
    savings: "Jusqu'à 25% d'économies",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Assurance Emprunteur",
    icon: Shield,
    color: "#A855F7",
    colorBg: "rgba(168,85,247,0.10)",
    savings: "Jusqu'à 20% d'économies",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Énergie & Services",
    icon: Zap,
    color: "#EAB308",
    colorBg: "rgba(234,179,8,0.10)",
    savings: "Jusqu'à 15% d'économies",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
];

/* ─── Animation Variants ───────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const mascotVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

/* ─── Component ────────────────────────────────────────────────── */
export default function LandingPage() {
  const setView = useAppStore((s) => s.setView);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <main className="flex-1">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        ref={sectionRef}
        className="relative overflow-hidden bg-[#E8F4F0]"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#D1ECDF]/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#DEEF4A]/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 py-10 sm:py-14 md:py-20 lg:py-24">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 md:mb-12 max-w-2xl"
          >
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-primary leading-tight">
              Comparez vos assurances{" "}
              <span className="text-secondary">en quelques clics</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              NOLI analyse les offres des meilleurs assureurs en Côte
              d&apos;Ivoire pour vous trouver le meilleur tarif. Simple, rapide
              et transparent.
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            {/* ── LEFT: 2×3 Card Grid (3/5 = 60%) ── */}
            <div className="lg:col-span-3">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              >
                {insuranceCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      variants={itemVariants}
                      role={card.available ? "button" : undefined}
                      tabIndex={card.available ? 0 : undefined}
                      aria-label={
                        card.available
                          ? `Comparer ${card.label}`
                          : `${card.label} — bientôt disponible`
                      }
                      className={`group relative flex flex-col gap-3 rounded-xl bg-white p-5 card-shadow transition-all duration-300 ${
                        card.available
                          ? "cursor-pointer hover:scale-[1.02] card-shadow-hover ring-1 ring-transparent hover:ring-accent/40"
                          : "cursor-default opacity-50 pointer-events-none"
                      }`}
                      onClick={() => {
                        if (card.available) setView("compare");
                      }}
                      onKeyDown={(e) => {
                        if (card.available && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setView("compare");
                        }
                      }}
                    >
                      {/* Badge top-right */}
                      <span
                        className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ${card.badgeClass}`}
                      >
                        {card.badge}
                      </span>

                      {/* Icon */}
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-lg shrink-0"
                        style={{ backgroundColor: card.colorBg }}
                      >
                        <Icon
                          className="h-5.5 w-5.5"
                          style={{ color: card.color }}
                          strokeWidth={2}
                        />
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug pr-20">
                        {card.label}
                      </h3>

                      {/* Savings stat */}
                      <p className="text-xs sm:text-sm font-medium text-primary">
                        {card.savings}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* ── RIGHT: Mascot (2/5 = 40%) ── */}
            <motion.div
              variants={mascotVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 flex items-center justify-center lg:sticky lg:top-32"
            >
              <div className="relative">
                {/* Glow circle behind mascot */}
                <div
                  className="absolute inset-0 -m-6 rounded-full blur-3xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(222,239,74,0.35) 0%, rgba(222,239,74,0.08) 50%, transparent 70%)",
                  }}
                />
                {/* Decorative ring */}
                <div className="absolute -inset-4 rounded-full border-2 border-dashed border-accent/20 pointer-events-none" />

                <div className="relative animate-float">
                  <img
                    src="/img/zebre.png"
                    alt="Mascotte NOLI — le zèbre comparateur d'assurances"
                    className="h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80 lg:h-[340px] lg:w-[340px] object-contain drop-shadow-2xl"
                    draggable={false}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Below Grid: CTA + Stats ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 md:mt-14 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl"
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setView("compare")}
            >
              Comparer maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {/* Stats row */}
            <div className="flex items-center gap-4 sm:gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-primary">6+</span>
                <span className="text-muted-foreground">Assureurs</span>
              </div>
              <span className="text-muted/50" aria-hidden="true">
                •
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-primary">18</span>
                <span className="text-muted-foreground">Offres</span>
              </div>
              <span className="text-muted/50" aria-hidden="true">
                •
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-primary">40%</span>
                <span className="text-muted-foreground">d&apos;économies</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}