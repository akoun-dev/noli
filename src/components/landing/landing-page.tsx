"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Shield,
  TrendingDown,
  ClipboardList,
  BarChart3,
  CheckCircle,
  Zap,
  Eye,
  Award,
  PiggyBank,
  Star,
  ChevronRight,
  ArrowRight,
  Quote,
} from "lucide-react";
import type { CoverageNeeds } from "@/types";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-12 md:mb-16">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ──────── HERO ──────── */
function HeroSection() {
  const setView = useAppStore((s) => s.setView);
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center"
        >
          <motion.div variants={fadeInUp} custom={0}>
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 text-sm font-medium bg-brand-light text-brand-foreground border-0"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Plateforme N°1 en Côte d&apos;Ivoire
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
          >
            Comparez vos assurances auto
            <br />
            <span className="text-brand">en 3 minutes</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            custom={2}
            className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Trouvez la meilleure offre d&apos;assurance automobile parmi les
            assureurs leaders en Côte d&apos;Ivoire. Simple, rapide et gratuit.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            custom={3}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-brand text-brand-foreground hover:bg-brand-dark font-semibold text-base px-8 py-6 h-auto rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => setView("compare")}
            >
              Comparer maintenant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-medium text-base px-8 py-6 h-auto rounded-xl"
              onClick={() => {
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Comment ça marche ?
              <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            custom={4}
            className="mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto"
          >
            {[
              {
                icon: Building2,
                value: "6+",
                label: "Assureurs",
              },
              { icon: Shield, value: "18+", label: "Offres" },
              {
                icon: TrendingDown,
                value: "30%",
                label: "d'économies",
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand mx-auto mb-1.5" />
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────── HOW IT WORKS ──────── */
function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const steps = [
    {
      num: 1,
      icon: ClipboardList,
      title: "Remplissez le formulaire",
      desc: "Renseignez vos informations personnelles et celles de votre véhicule en quelques clics.",
    },
    {
      num: 2,
      icon: BarChart3,
      title: "Comparez les offres",
      desc: "Découvrez les meilleures offres adaptées à votre profil et votre budget.",
    },
    {
      num: 3,
      icon: CheckCircle,
      title: "Choisissez et économisez",
      desc: "Sélectionnez l'offre qui vous convient et demandez votre devis gratuitement.",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="py-16 md:py-24 bg-muted/40"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <SectionTitle
          title="Comment ça marche ?"
          subtitle="Obtenez votre devis personnalisé en 3 étapes simples"
        />
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
        >
          {steps.map((step, i) => (
            <motion.div key={step.num} variants={fadeInUp} custom={i}>
              <div className="relative flex flex-col items-center text-center">
                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-brand/30" />
                )}
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-brand/10 flex items-center justify-center mb-5">
                  <step.icon className="w-8 h-8 text-brand" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand text-brand-foreground text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────── COVERAGE TYPES ──────── */
function CoverageTypesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const setView = useAppStore((s) => s.setView);
  const setCoverageNeeds = useAppStore((s) => s.setCoverageNeeds);
  const setComparisonStep = useAppStore((s) => s.setComparisonStep);

  const plans = [
    {
      type: "tiers" as const,
      name: "Tiers Simple",
      icon: Shield,
      price: "10 000",
      desc: "La couverture de base obligatoire pour circuler en toute légalité.",
      features: [
        "Responsabilité civile",
        "Assistance dépannage",
        "Défense pénale",
      ],
      popular: false,
    },
    {
      type: "tiers_plus" as const,
      name: "Tiers Étendu (Tiers+)",
      icon: Shield,
      price: "25 000",
      desc: "Protection élargie incluant le vol, l'incendie et les bris de glace.",
      features: [
        "Responsabilité civile",
        "Vol et incendie",
        "Bris de glace",
        "Véhicule de courtoisie",
        "Assistance étendue",
      ],
      popular: true,
    },
    {
      type: "tous_risques" as const,
      name: "Tous Risques",
      icon: Shield,
      price: "55 000",
      desc: "Protection complète pour rouler l'esprit tranquille en toutes circonstances.",
      features: [
        "Dommages tous accidents",
        "Catastrophes naturelles",
        "Protection du conducteur",
        "Indemnisation valeur à neuf",
        "Assistance illimitée",
        "Toutes garanties Tiers+",
      ],
      popular: false,
    },
  ];

  const handleChoose = useCallback(
    (type: CoverageNeeds["coverageType"]) => {
      setCoverageNeeds({ coverageType: type });
      setComparisonStep(3);
      setView("compare");
    },
    [setCoverageNeeds, setComparisonStep, setView]
  );

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <SectionTitle
          title="Les types de couverture"
          subtitle="Choisissez la formule adaptée à vos besoins et à votre budget"
        />
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {plans.map((plan, i) => (
            <motion.div key={plan.type} variants={fadeInUp} custom={i}>
              <Card
                className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular
                    ? "border-2 border-brand shadow-lg shadow-brand/10"
                    : "hover:border-brand/40"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-brand text-brand-foreground font-semibold px-4 py-1">
                      Recommandé
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-6 pb-6 flex flex-col flex-1 p-6">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                    <plan.icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {plan.desc}
                  </p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-brand">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      FCFA/mois
                    </span>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-medium ${
                      plan.popular
                        ? "bg-brand text-brand-foreground hover:bg-brand-dark"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                    onClick={() => handleChoose(plan.type)}
                  >
                    Choisir cette formule
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────── WHY NOLI ──────── */
function WhyNoliSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const features = [
    {
      icon: PiggyBank,
      title: "Économies garanties",
      desc: "Jusqu'à 30% d'économies sur votre prime d'assurance en comparant les offres du marché.",
    },
    {
      icon: Eye,
      title: "Comparaison transparente",
      desc: "Toutes les informations claires, sans surprise ni frais cachés. Comparez en toute confiance.",
    },
    {
      icon: Zap,
      title: "Processus rapide",
      desc: "Recevez vos résultats personnalisés en moins de 3 minutes, sans attente ni démarche complexe.",
    },
    {
      icon: Award,
      title: "Assureurs de confiance",
      desc: "Nos partenaires sont tous agréés par l'ARCA-CI et répondent aux normes les plus strictes.",
    },
  ];

  return (
    <section ref={ref} className="py-16 md:py-24 bg-muted/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <SectionTitle
          title="Pourquoi choisir NOLI ?"
          subtitle="Des avantages concrets pour les conducteurs ivoiriens"
        />
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeInUp} custom={i}>
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────── TESTIMONIALS ──────── */
function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const testimonials = [
    {
      name: "Kouadio A.",
      role: "Conducteur à Abidjan",
      text: "Grâce à NOLI, j'ai trouvé une assurance tous risques 25% moins chère que mon ancien contrat. Le processus est vraiment simple et rapide !",
      rating: 5,
    },
    {
      name: "Mariam D.",
      role: "Propriétaire de SUV",
      text: "J'apprécie la transparence des offres. Pas de surprises, tout est clair dès le départ. Je recommande à tous mes proches.",
      rating: 5,
    },
    {
      name: "Yao K.",
      role: "Professionnel",
      text: "Le service client est très réactif. J'ai été rappelé par un assureur en moins d'une heure après ma demande de devis.",
      rating: 4,
    },
  ];

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <SectionTitle
          title="Ce que disent nos utilisateurs"
          subtitle="Plus de 2 000 conducteurs nous font confiance"
        />
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div key={t.name} variants={fadeInUp} custom={i}>
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <Quote className="w-8 h-8 text-brand/30 mb-3" />
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-brand">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm">
                        {t.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.role}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className={`w-3.5 h-3.5 ${
                            j < t.rating
                              ? "text-brand fill-brand"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ──────── CTA SECTION ──────── */
function CtaSection() {
  const setView = useAppStore((s) => s.setView);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="brand-gradient rounded-3xl p-8 md:p-14 text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Prêt à économiser sur votre assurance auto ?
          </h2>
          <p className="text-foreground/80 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Rejoignez des milliers de conducteurs qui économisent chaque mois
            avec NOLI Assurance.
          </p>
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 font-semibold text-base px-8 py-6 h-auto rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
            onClick={() => setView("compare")}
          >
            Comparer mes offres gratuitement
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────── MAIN EXPORT ──────── */
export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <CoverageTypesSection />
      <WhyNoliSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
}