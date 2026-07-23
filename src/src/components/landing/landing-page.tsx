"use client";

import {
  Car,
  Bike,
  Heart,
  Home,
  Shield,
  Zap,
  ArrowRight,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Quote,
  Eye,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

const insuranceCards = [
  {
    label: "Assurance Auto",
    icon: Car,
    color: "#F97316",
    colorBg: "rgba(249,115,22,0.10)",
    badge: "En service",
    badgeClass: "bg-[#16A34A]/10 text-[#16A34A]",
    available: true,
  },
  {
    label: "Assurance Moto",
    icon: Bike,
    color: "#3B82F6",
    colorBg: "rgba(59,130,246,0.10)",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Mutuelle Santé",
    icon: Heart,
    color: "#22C55E",
    colorBg: "rgba(34,197,94,0.10)",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Assurance Habitation",
    icon: Home,
    color: "#EF4444",
    colorBg: "rgba(239,68,68,0.10)",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Assurance Emprunteur",
    icon: Shield,
    color: "#A855F7",
    colorBg: "rgba(168,85,247,0.10)",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
  {
    label: "Énergie & Services",
    icon: Zap,
    color: "#EAB308",
    colorBg: "rgba(234,179,8,0.10)",
    badge: "Bientôt",
    badgeClass: "bg-muted/30 text-muted-foreground",
    available: false,
  },
];

const steps = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Remplissez le formulaire",
    desc: "Entrez vos informations personnelles et les détails de votre véhicule. C'est rapide et simple.",
  },
  {
    num: "02",
    icon: BarChart3,
    title: "Comparez les offres",
    desc: "NOLI analyse instantanément les offres de nos assureurs partenaires et vous présente les meilleures.",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "Choisissez et souscrivez",
    desc: "Sélectionnez l'offre qui vous convient et souscrivez en quelques clics. C'est tout !",
  },
];

const advantages = [
  {
    icon: Eye,
    title: "Transparence totale",
    desc: "Pas de frais cachés. Tous les prix et garanties sont affichés clairement avant votre décision.",
  },
  {
    icon: Zap,
    title: "Résultats instantanés",
    desc: "Recevez des devis personnalisés en quelques secondes, sans attente ni démarche fastidieuse.",
  },
  {
    icon: Users,
    title: "Assureurs vérifiés",
    desc: "Tous nos partenaires sont agréés par l'ASA (Autorité de Supervision de l'Assurance) de Côte d'Ivoire.",
  },
  {
    icon: Shield,
    title: "Économies garanties",
    desc: "Jusqu'à 40% d'économies en moyenne grâce à notre algorithme de comparaison intelligent.",
  },
];

const testimonials = [
  {
    name: "Aminata K.",
    role: "Propriétaire de Toyota Corolla",
    text: "J'ai trouvé une assurance tous risques 35% moins chère que mon ancien contrat. NOLI m'a fait gagner du temps et de l'argent !",
    rating: 5,
  },
  {
    name: "Kouamé Y.",
    role: "Chauffeur de taxi",
    text: "En tant que taxi, je cherchais une couverture adaptée à mon activité. NOLI m'a permis de comparer et de trouver la bonne formule rapidement.",
    rating: 5,
  },
  {
    name: "Fatoumata D.",
    role: "Fonctionnaire, propriétaire d'un SUV",
    text: "Interface très simple, je recommande ! J'ai pu souscrire mon assurance auto en moins de 10 minutes depuis mon téléphone.",
    rating: 4,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`size-4 ${
            i < Math.floor(rating)
              ? "text-accent"
              : i < rating
                ? "text-accent/50"
                : "text-muted/30"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function LandingPage() {
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="flex-1">
      {/* ════════════ HERO ════════════ */}
      <section className="relative overflow-hidden bg-[#E8F4F0] dark:bg-[#121e19]">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#D1ECDF]/50 dark:bg-[#1a3a2a]/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#DEEF4A]/10 dark:bg-[#DEEF4A]/5 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 py-10 sm:py-14 md:py-20 lg:py-24">
          <div className="mb-8 md:mb-12 max-w-2xl animate-slide-up">
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-primary leading-tight">
              Comparez vos assurances{" "}
              <span className="text-secondary">en quelques clics</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              NOLI analyse les offres des meilleurs assureurs en Côte
              d&apos;Ivoire pour vous trouver le meilleur tarif. Simple, rapide
              et transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {insuranceCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      role={card.available ? "button" : undefined}
                      tabIndex={card.available ? 0 : undefined}
                      aria-label={
                        card.available
                          ? `Comparer ${card.label}`
                          : `${card.label} — bientôt disponible`
                      }
                      className={`group relative flex flex-col gap-3 rounded-xl p-5 transition-all duration-300 animate-fade-in-up ${
                        card.available
                          ? "bg-white dark:bg-card cursor-pointer hover:scale-[1.03] hover:shadow-xl border-2 border-border/60 hover:border-accent/50 hover:-translate-y-1 shadow-md"
                          : "bg-muted/20 cursor-default opacity-50 pointer-events-none border-2 border-dashed border-border/40"
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
                      <span
                        className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none ${card.badgeClass}`}
                      >
                        {card.badge}
                      </span>
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3"
                        style={{ backgroundColor: card.colorBg }}
                      >
                        <Icon
                          className="h-5.5 w-5.5"
                          style={{ color: card.color }}
                          strokeWidth={2}
                        />
                      </div>
                      <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug pr-20">
                        {card.label}
                      </h3>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 flex items-center justify-center lg:sticky lg:top-32 animate-fade-in delay-300">
              <div className="relative">
                <div
                  className="absolute inset-0 -m-6 rounded-full blur-3xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(222,239,74,0.35) 0%, rgba(222,239,74,0.08) 50%, transparent 70%)",
                  }}
                />
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
            </div>
          </div>

          <div className="mt-10 md:mt-14 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-3xl animate-slide-up delay-500">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setView("compare")}
            >
              Comparer maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════ COMMENT ÇA MARCHE ════════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 animate-fade-in-up">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
              Comment ça marche
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-bold text-foreground">
              3 étapes simples
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Comparez et souscrivez votre assurance en quelques minutes, sans quitter votre canapé.
            </p>
          </div>

          <div className="relative grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="hidden md:block absolute top-14 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30" />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                    <div
                      key={step.num}
                      className="relative text-center animate-fade-in-up"
                      style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                    >
                  <div className="relative inline-flex items-center justify-center mb-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-7" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════ POURQUOI NOLI ════════════ */}
      <section className="bg-primary dark:bg-[#1B464D] py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 animate-fade-in-up">
            <span className="mb-4 inline-block rounded-full bg-primary-foreground/15 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary-foreground uppercase">
              Nos avantages
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-bold text-primary-foreground">
              Pourquoi choisir NOLI ?
            </h2>
            <p className="mt-3 text-primary-foreground/60 max-w-xl mx-auto">
              Une plateforme pensée pour les Ivoiriens, avec des avantages concrets.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {advantages.map((adv, idx) => {
              const Icon = adv.icon;
              return (
                <div
                  key={adv.title}
                  className="rounded-xl bg-primary-foreground/10 backdrop-blur-sm p-6 border border-primary-foreground/10 transition-all duration-300 hover:bg-primary-foreground/15 animate-fade-in-up"
                  style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 mb-4">
                    <Icon className="size-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                    {adv.title}
                  </h3>
                  <p className="text-sm text-primary-foreground/60 leading-relaxed">
                    {adv.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════ TÉMOIGNAGES ════════════ */}
      <section className="bg-[#E8F4F0] dark:bg-[#121e19] py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 animate-fade-in-up">
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
              Témoignages
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-bold text-foreground">
              Ce que disent nos utilisateurs
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, idx) => (
              <div
                key={t.name}
                className="bg-card rounded-xl p-6 card-shadow flex flex-col gap-4 animate-fade-in-up"
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                <Quote className="size-8 text-primary/20 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto">
                    <StarRating rating={t.rating} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <div className="relative inline-block mb-6">
              <div className="animate-float">
                <img
                  src="/img/zebre.png"
                  alt="Mascotte NOLI"
                  className="h-40 w-40 sm:h-48 sm:w-48 object-contain mx-auto drop-shadow-lg"
                  draggable={false}
                />
              </div>
            </div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Prêt à économiser sur votre assurance ?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Rejoignez des milliers d&apos;Ivoiriens qui comparent et souscrivent
              leur assurance en toute confiance avec NOLI.
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setView("compare")}
            >
              Comparer mes offres
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
