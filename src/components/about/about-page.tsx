"use client";

import { motion } from "framer-motion";
import { Eye, Zap, Shield, Heart } from "lucide-react";

/* ─── Animation Variants ───────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

/* ─── Data ─────────────────────────────────────────────────────── */
const values = [
  {
    icon: Eye,
    title: "Transparence",
    desc: "Des offres claires, sans surprise",
  },
  {
    icon: Zap,
    title: "Simplicité",
    desc: "Comparez en quelques clics",
  },
  {
    icon: Shield,
    title: "Confiance",
    desc: "Assureurs vérifiés et agréés",
  },
  {
    icon: Heart,
    title: "Proximité",
    desc: "Un service pensé pour la Côte d'Ivoire",
  },
];

const stats = [
  { value: "6+", label: "Assureurs partenaires" },
  { value: "18+", label: "Offres disponibles" },
  { value: "40%", label: "D'économies moyennes" },
];

/* ─── Component ────────────────────────────────────────────────── */
export function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#E8F4F0] py-20 md:py-28">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase"
          >
            Qui sommes-nous
          </motion.span>

          <motion.h1
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.1}
            variants={fadeUp}
            className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            À propos de{" "}
            <span className="text-primary">NOLI</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.2}
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl font-subtitle text-lg text-muted-foreground sm:text-xl"
          >
            La plateforme qui démocratise l&apos;assurance en Côte d&apos;Ivoire.
            Notre mission : rendre la comparaison d&apos;assurances simple,
            transparente et accessible à tous.
          </motion.p>
        </div>
      </section>

      {/* ─── Notre Mission ───────────────────────────────────── */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase"
          >
            Notre Mission
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.1}
            variants={fadeUp}
            className="font-display text-3xl font-bold text-foreground sm:text-4xl"
          >
            Rendre l&apos;assurance accessible à tous les Ivoiriens
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.2}
            variants={fadeUp}
            className="mt-8 space-y-5 font-subtitle text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            <p>
              NOLI est une plateforme ivoirienne de comparaison d&apos;assurances
              conçue pour aider les particuliers et les professionnels à trouver
              la couverture qui leur convient, au meilleur prix. En un instant,
              comparez les offres de plusieurs compagnies d&apos;assurance agréées
              et souscrivez en toute confiance.
            </p>

            <p>
              Nous comprenons que choisir une assurance peut être complexe et
              fastidieux. C&apos;est pourquoi nous avons créé un outil intuitif qui
              analyse vos besoins et vous présente les meilleures options du
              marché, avec des détails clairs et compréhensibles. Plus besoin de
              contacter chaque assureur un par un — NOLI fait le travail pour
              vous.
            </p>

            <p>
              Basée en Côte d&apos;Ivoire, notre équipe connaît les réalités locales
              et s&apos;engage à offrir un service fiable, transparent et adapté aux
              besoins spécifiques du marché ivoirien. Notre objectif est simple :
              vous faire économiser du temps et de l&apos;argent, tout en
              garantissant une couverture de qualité.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Nos Valeurs ─────────────────────────────────────── */}
      <section className="bg-[#E8F4F0] py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase"
          >
            Nos Valeurs
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.1}
            variants={fadeUp}
            className="font-display text-3xl font-bold text-foreground sm:text-4xl"
          >
            Ce qui nous guide chaque jour
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={containerVariants}
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  variants={itemVariants}
                  className="group rounded-xl border border-border/50 bg-background p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-1.5 font-subtitle text-sm text-muted-foreground">
                    {v.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Nos Chiffres ────────────────────────────────────── */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase"
          >
            Nos Chiffres
          </motion.div>

          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0.1}
            variants={fadeUp}
            className="mb-12 text-center font-display text-3xl font-bold text-foreground sm:text-4xl"
          >
            NOLI en quelques données
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={containerVariants}
            className="grid gap-6 sm:grid-cols-3"
          >
            {stats.map((s) => (
              <motion.div
                key={s.label}
                variants={itemVariants}
                className="rounded-xl border border-border/50 bg-[#E8F4F0] px-6 py-8 text-center"
              >
                <p className="font-display text-4xl font-bold text-primary sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 font-subtitle text-sm text-muted-foreground sm:text-base">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}