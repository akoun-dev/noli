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
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Clock,
  TrendingDown,
  FileText,
  Quote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

/* ─── Data ─────────────────────────────────────────────────────── */
const insuranceCards = [
  {
    label: "ASSURANCE AUTO",
    icon: Car,
    desc: "Comparez et souscrivez en quelques minutes",
    badge: "En service",
    badgeClass: "bg-primary/10 text-primary",
    available: true,
  },
  {
    label: "ASSURANCE MOTO",
    icon: Bike,
    desc: "Protection pour deux-roues",
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "MUTUELLE SANTÉ",
    icon: Heart,
    desc: "Couverture santé adaptée",
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "ASSURANCE HABITATION",
    icon: Home,
    desc: "Protégez votre domicile",
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "ASSURANCE EMPRUNTEUR",
    icon: Shield,
    desc: "Sécurisez vos crédits",
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
  {
    label: "ÉNERGIE & SERVICES",
    icon: Zap,
    desc: "Solutions énergétiques",
    badge: "Bientôt",
    badgeClass: "bg-muted text-muted-foreground",
    available: false,
  },
];

const howItWorksSteps = [
  {
    step: "01",
    icon: FileText,
    title: "Remplissez le formulaire",
    desc: "Renseignez vos informations personnelles, les détails de votre véhicule et vos besoins en garanties.",
  },
  {
    step: "02",
    icon: TrendingDown,
    title: "Comparez les offres",
    desc: "NOLI analyse instantanément les offres de nos partenaires assureurs et vous présente les meilleurs tarifs.",
  },
  {
    step: "03",
    icon: Shield,
    title: "Souscrivez en ligne",
    desc: "Choisissez l'offre qui vous convient et souscrivez directement en ligne. Simple, rapide et transparent.",
  },
];

const whyNoli = [
  {
    icon: TrendingDown,
    title: "Jusqu'à 40% d'économies",
    desc: "Comparez les tarifs de plusieurs assureurs et trouvez la meilleure offre pour votre budget.",
  },
  {
    icon: Clock,
    title: "Devis en 2 minutes",
    desc: "Obtenez des devis personnalisés instantanément sans démarche fastidieuse.",
  },
  {
    icon: Users,
    title: "Assureurs vérifiés",
    desc: "Tous nos partenaires sont des compagnies d'assurance agréées et fiables en Côte d'Ivoire.",
  },
  {
    icon: Sparkles,
    title: "100% gratuit",
    desc: "Notre service est totalement gratuit. Pas de frais cachés, pas de surprise.",
  },
];

const testimonials = [
  {
    name: "Aminata K.",
    role: "Propriétaire Toyota Corolla",
    text: "Grâce à NOLI, j'ai trouvé une assurance tous risques 35% moins chère que mon ancien contrat. Le processus était simple et rapide !",
    rating: 5,
  },
  {
    name: "Kouamé B.",
    role: "Professionnel, Abidjan",
    text: "En tant que professionnel, je n'avais pas le temps de comparer les assurances. NOLI l'a fait pour moi en quelques clics. Excellent service.",
    rating: 5,
  },
  {
    name: "Fatoumata D.",
    role: "Propriétaire Renault Duster",
    text: "La transparence de NOLI est ce qui m'a convaincue. On voit clairement ce qui est couvert et à quel prix. Je recommande vivement.",
    rating: 4,
  },
];

/* ─── Animation Variants ───────────────────────────────────────── */
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

function SectionHeader({
  badge,
  title,
  description,
}: {
  badge?: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={0}
      variants={fadeUp}
      className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
    >
      {badge && (
        <span className="inline-block mb-4 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          {badge}
        </span>
      )}
      <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
        {description}
      </p>
    </motion.div>
  );
}

/* ─── Component ────────────────────────────────────────────────── */
export default function LandingPage() {
  const setView = useAppStore((s) => s.setView);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <main className="flex-1">
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(148 13% 73% / 0.3) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-12 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="text-center lg:text-left"
            >
              <motion.span
                variants={itemVariants}
                className="inline-block mb-4 rounded-full bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
              >
                Comparateur d&apos;assurances #1 en Côte d&apos;Ivoire
              </motion.span>

              <motion.h1
                variants={itemVariants}
                className="font-[family-name:var(--font-space-grotesk)] font-bold uppercase tracking-wide text-foreground"
                style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
              >
                Comparez vos
                <span className="relative mx-2 inline-block">
                  <span className="relative z-10">assurances</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={heroInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                    className="absolute bottom-1 left-0 right-0 h-3 bg-accent/40 -z-0 origin-left rounded-sm"
                  />
                </span>
                <br />
                en quelques clics
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-5 max-w-lg mx-auto lg:mx-0 text-muted-foreground leading-relaxed"
              >
                NOLI vous aide à trouver la meilleure couverture d&apos;assurance
                automobile au meilleur prix. Comparez les offres des plus grands
                assureurs de Côte d&apos;Ivoire en toute transparence.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 text-base font-semibold"
                  onClick={() => setView("compare")}
                >
                  Comparer maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 text-base"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Comment ça marche ?
                </Button>
              </motion.div>

              {/* Mini stats */}
              <motion.div
                variants={itemVariants}
                className="mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm"
              >
                <div>
                  <p className="font-bold text-lg text-primary">6+</p>
                  <p className="text-muted-foreground">Assureurs</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="font-bold text-lg text-primary">18</p>
                  <p className="text-muted-foreground">Offres</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="font-bold text-lg text-primary">40%</p>
                  <p className="text-muted-foreground">D&apos;économies</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                heroInView
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.9 }
              }
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                {/* Glow circle behind mascot */}
                <div className="absolute inset-0 -m-8 rounded-full bg-accent/20 blur-3xl" />
                <div className="relative animate-float">
                  <img
                    src="/img/zebre.png"
                    alt="Mascotte NOLI"
                    className="h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── INSURANCE TYPE CARDS ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <SectionHeader
            badge="Nos services"
            title="Choisissez votre assurance"
            description="Auto disponible dès maintenant. D'autres types d'assurances arrivent bientôt."
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-6"
          >
            {insuranceCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  variants={itemVariants}
                  className={`group flex flex-col items-center gap-3 rounded-xl bg-white p-5 sm:p-6 card-shadow transition-all duration-300 text-center ${
                    card.available
                      ? "cursor-pointer hover:scale-[1.03] card-shadow-hover"
                      : "cursor-default opacity-60 pointer-events-none"
                  }`}
                  onClick={() => {
                    if (card.available) setView("compare");
                  }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground leading-tight">
                    {card.label}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs ${card.badgeClass}`}
                  >
                    {card.badge}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <SectionHeader
            badge="Processus simple"
            title="Comment ça marche ?"
            description="Obtenez votre devis d'assurance en 3 étapes simples et rapides."
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {howItWorksSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  custom={i * 0.15}
                  variants={fadeUp}
                  className="relative"
                >
                  {/* Connector line (desktop only) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px border-t-2 border-dashed border-border" />
                  )}

                  <div className="flex flex-col items-center text-center">
                    {/* Step number + icon */}
                    <div className="relative mb-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <Icon className="h-9 w-9" />
                      </div>
                      <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                        {step.step}
                      </span>
                    </div>

                    <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA in section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.45}
            variants={fadeUp}
            className="mt-14 text-center"
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 text-base font-semibold"
              onClick={() => setView("compare")}
            >
              Commencer ma comparaison
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── POURQUOI NOLI ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-primary text-secondary-foreground relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
          >
            <span className="inline-block mb-4 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              Nos avantages
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-secondary-foreground">
              Pourquoi choisir NOLI ?
            </h2>
            <p className="mt-4 text-secondary-foreground/60 leading-relaxed text-sm sm:text-base">
              NOLI simplifie la recherche d&apos;assurance en Côte d&apos;Ivoire.
              Voici ce qui nous distingue.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyNoli.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  custom={i * 0.1}
                  variants={fadeUp}
                  className="rounded-xl bg-secondary-foreground/5 p-6 border border-secondary-foreground/10 backdrop-blur-sm transition-colors hover:bg-secondary-foreground/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 mb-4">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-secondary-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-secondary-foreground/60 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <SectionHeader
            badge="Ils nous font confiance"
            title="Ce que disent nos utilisateurs"
            description="Des milliers de personnes ont déjà trouvé leur assurance idéale grâce à NOLI."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i * 0.1}
                variants={fadeUp}
              >
                <div className="h-full rounded-xl bg-white p-6 card-shadow flex flex-col">
                  {/* Quote icon */}
                  <Quote className="h-8 w-8 text-primary/20 mb-4 shrink-0" />

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={`h-4 w-4 ${
                          si < t.rating
                            ? "fill-accent text-accent"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Text */}
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1">
                    &ldquo;{t.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="mt-5 pt-5 border-t border-border flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-primary p-8 sm:p-12 md:p-16 text-center"
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="animate-float mb-6">
                <img
                  src="/img/zebre-fond-vert.png"
                  alt="Mascotte NOLI"
                  className="h-32 w-32 sm:h-40 sm:w-40 object-contain mx-auto drop-shadow-lg"
                />
              </div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-foreground tracking-tight">
                Prêt à économiser sur votre assurance ?
              </h2>
              <p className="mt-4 text-secondary-foreground/60 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                Rejoignez des milliers d&apos;Ivoiriens qui ont déjà trouvé
                l&apos;assurance idéale grâce à NOLI. C&apos;est gratuit et
                ça ne prend que 2 minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 text-base font-semibold"
                  onClick={() => setView("compare")}
                >
                  Comparer mes offres
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-secondary-foreground/50">
                <CheckCircle className="h-4 w-4" />
                Gratuit &bull; Sans engagement &bull; Résultats immédiats
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}