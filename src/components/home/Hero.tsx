import { useState } from "react";
import { ArrowRight, BadgeCheck, Bike, Car, CheckCircle2, HeartPulse, Home, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const assuranceOptions = [
  {
    title: "Assurance auto",
    description: "Disponible dès maintenant avec devis instantané et offres vérifiées.",
    highlight: "En service",
    savings: "Jusqu'à 25% d'économies",
    icon: Car,
    available: true,
    href: "/comparer",
    detail: {
      badge: "Économisez jusqu'à 40% sur votre assurance auto",
      heroTitle: "Comparez les meilleures assurances auto en moins de 3 minutes",
      heroSubtitle: "Comparez gratuitement les offres des assureurs ivoiriens et trouvez l'assurance qui vous correspond au meilleur prix.",
      price: "25 000",
      currency: "FCFA",
      frequency: "/ an",
      guarantee: "Le meilleur prix garanti",
      features: ["Comparaison instantanée", "Meilleur prix garanti", "Souscription en ligne", "Assistance 24/7"],
      stats: [
        { label: "Assureurs", value: "6" },
        { label: "Clients", value: "50K+" },
        { label: "Temps", value: "3 min" },
        { label: "Économie", value: "40%" },
      ],
      ctaLabel: "Obtenir mon devis gratuit",
      ctaHref: "/comparer",
      subCta: ["En moins de 3 minutes", "Sans engagement", "100% sécurisé"],
    },
  },
  {
    title: "Assurance moto",
    description: "Protection du conducteur et du deux-roues.",
    highlight: "Bientôt",
    savings: "Comparateur en préparation",
    icon: Bike,
    available: false,
    detail: {
      badge: "Bientôt disponible",
      heroTitle: "Votre assurance moto arrive bientôt",
      heroSubtitle: "Nous finalisons la comparaison pour les conducteurs de deux-roues. Bénéficiez d'offres optimisées et d'une couverture adaptée à votre usage.",
      guarantee: "Parcours en cours de finalisation",
      features: ["Protections dédiées conducteur & passager", "Options équipements et accessoires", "Tarifs optimisés selon l'usage"],
      stats: [
        { label: "Assureurs", value: "6" },
        { label: "Temps", value: "3 min" },
        { label: "Priorité", value: "Liste d'attente" },
      ],
      ctaLabel: "Me prévenir dès l'ouverture",
      subCta: ["Ouverture prochainement"],
    },
  },
  {
    title: "Mutuelle santé",
    description: "Pour vous et votre famille, en toute sérénité.",
    highlight: "Bientôt",
    savings: "Parcours en cours de finalisation",
    icon: HeartPulse,
    available: false,
    detail: {
      badge: "Bientôt disponible",
      heroTitle: "Préparez votre mutuelle santé",
      heroSubtitle: "Restez informé du lancement des comparaisons santé pour vous et votre famille.",
      guarantee: "Couvertures et remboursements optimisés",
      features: ["Formules famille et individuelle", "Parcours de soins simplifié", "Options hospitalisation & optique"],
      stats: [
        { label: "Couverture", value: "Famille & solo" },
        { label: "Temps", value: "3 min" },
      ],
      ctaLabel: "Être informé",
      subCta: ["Arrive très vite"],
    },
  },
  {
    title: "Assurance habitation",
    description: "Maison, appartement et biens protégés.",
    highlight: "Bientôt",
    savings: "Arrive très vite",
    icon: Home,
    available: false,
    detail: {
      badge: "Bientôt disponible",
      heroTitle: "Votre habitation, bientôt mieux protégée",
      heroSubtitle: "Nous intégrons les meilleures offres habitation pour vous aider à sécuriser votre logement au juste prix.",
      guarantee: "Comparateur en finalisation",
      features: ["Biens mobiliers couverts", "Protection dégâts des eaux & incendie", "Options responsabilité civile"],
      stats: [
        { label: "Logements", value: "Maison / appart" },
        { label: "Temps", value: "3 min" },
      ],
      ctaLabel: "Me prévenir",
      subCta: ["Ouverture prochainement"],
    },
  },
  {
    title: "Assurance emprunteur",
    description: "Sécurisez vos crédits et vos projets.",
    highlight: "Bientôt",
    savings: "Offres en cours d'intégration",
    icon: ShieldCheck,
    available: false,
    detail: {
      badge: "Bientôt disponible",
      heroTitle: "Assurance emprunteur simplifiée",
      heroSubtitle: "Bientôt, comparez et changez d'assurance emprunteur pour alléger vos mensualités.",
      guarantee: "Offres en cours d'intégration",
      features: ["Délégation d'assurance facilitée", "Économies sur vos mensualités", "Protection emprunteur complète"],
      stats: [
        { label: "Crédits", value: "Immo & conso" },
        { label: "Temps", value: "3 min" },
      ],
      ctaLabel: "Être notifié",
      subCta: ["Arrive très vite"],
    },
  },
  {
    title: "Énergie & services",
    description: "Électricité, gaz et services du quotidien.",
    highlight: "Bientôt",
    savings: "Comparaison à venir",
    icon: Zap,
    available: false,
    detail: {
      badge: "Bientôt disponible",
      heroTitle: "Énergie & services : bientôt comparés",
      heroSubtitle: "Bientôt, optimisez vos factures d'énergie et services avec NOLI.",
      guarantee: "Comparaison à venir",
      features: ["Electricité & gaz", "Offres packagées services", "Accompagnement au changement"],
      stats: [
        { label: "Fournisseurs", value: "Sélectionnés" },
        { label: "Temps", value: "3 min" },
      ],
      ctaLabel: "Me tenir informé",
      subCta: ["Ouverture prochainement"],
    },
  },
];

const fallbackDetail = {
  badge: "Information",
  heroTitle: "Assurance",
  heroSubtitle: "Détails non disponibles pour le moment.",
  guarantee: "",
  features: [],
  stats: [],
  ctaLabel: "Fermer",
};

const Hero = () => {
  const [selectedOption, setSelectedOption] = useState(assuranceOptions[0]);
  const [openDetail, setOpenDetail] = useState(false);
  const SelectedIcon = selectedOption?.icon;
  const detail = selectedOption?.detail ?? fallbackDetail;
  const isAvailable = selectedOption?.available;

  const openOption = (option: (typeof assuranceOptions)[number]) => {
    setSelectedOption(option);
    setOpenDetail(true);
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-white to-primary/10 dark:from-[#0b1518] dark:via-[#081012] dark:to-[#0c181c]">
      <div className="absolute inset-0">
        <div className="absolute -left-32 -top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-[-10%] h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(27,70,77,0.12)_1px,_transparent_0)] bg-[length:32px_32px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(222,239,74,0.08)_1px,_transparent_0)]" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.05fr_1.1fr] gap-12 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur dark:bg-white/10 dark:text-primary-foreground">
              <Sparkles className="w-4 h-4" />
              Nouveau parcours
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/80 dark:text-primary-foreground/80">
                Assurance et comparatif
              </p>
              <h1 className="text-4xl md:text-5xl font-display leading-tight text-foreground">
                Avec NOLI, comparer c'est gagner.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                L'assurance auto est prête, les autres arrivent. Survolez les cartes pour voir ce qui se prépare et restez informé des prochains lancements.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_15px_45px_rgba(27,70,77,0.35)]"
                asChild
              >
                <Link to="/comparer">
                  Comparer mon assurance auto
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-white/60 text-foreground hover:bg-white/80 border border-border/60 dark:bg-white/10 dark:text-foreground"
              >
                Produits à venir
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:bg-white/5">
                <BadgeCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Auto déjà disponible</p>
                  <p className="text-xs text-muted-foreground">Devis immédiat et souscription guidée</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:bg-white/5">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Transparence totale</p>
                  <p className="text-xs text-muted-foreground">Offres triées et expliquées</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Choisissez votre assurance</p>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur dark:bg-white/10">
                Auto disponible • autres en approche
              </span>
            </div>

            <div className="relative z-10 grid sm:grid-cols-2 gap-4 lg:gap-6 pr-0 lg:pr-24">
              {assuranceOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => openOption(option)}
                    className="group relative block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
                  >
                    <Card
                      className={`relative overflow-hidden rounded-2xl border border-border/60 bg-white/90 p-5 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl dark:bg-card/80 ${
                        option.available ? "ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{option.title}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            option.available
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {option.highlight}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="text-foreground font-semibold">{option.savings}</div>
                        {option.available ? (
                          <div className="flex items-center gap-2 text-primary font-semibold">
                            Découvrir
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Cliquez pour en savoir plus</div>
                        )}
                      </div>

                      {!option.available && (
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-foreground/80 text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="text-sm font-semibold uppercase tracking-wide">Pas encore disponible</span>
                          <span className="text-xs text-background/80">On y travaille, restez connecté·e !</span>
                        </div>
                      )}
                    </Card>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:block">
              <div className="pointer-events-none absolute -right-16 -bottom-10 h-60 w-60 z-0 opacity-90">
                <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl" />
                <img
                  src="/img/noli_sans_fond.png"
                  alt="Mascotte NOLI"
                  className="relative h-full w-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-6xl overflow-hidden border-0 bg-background p-0 shadow-2xl sm:rounded-3xl">
          {selectedOption && (
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-primary/10 p-8 md:p-10 dark:from-[#0b1518] dark:via-[#0f1a1e] dark:to-[#0c181c]">
                <div className="absolute -left-20 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
                <div className="absolute bottom-0 right-[-10%] h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
                <div className="relative space-y-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm dark:bg-primary/20">
                    <Sparkles className="h-4 w-4" />
                    {detail.badge}
                  </span>
                  {detail.stepsCount ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/60 dark:bg-white/5">
                      Parcours en {detail.stepsCount} étapes
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    <h3 className="text-3xl md:text-4xl font-display leading-tight text-foreground">
                      {detail.heroTitle}
                    </h3>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      {detail.heroSubtitle}
                    </p>
                  </div>
                  {detail.stats?.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                      {detail.stats.map((stat) => (
                        <div key={stat.label} className="rounded-2xl bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:bg-white/5">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="bg-background p-6 md:p-8">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg dark:bg-card/70">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{selectedOption.title}</p>
                      <p className="text-xl font-semibold text-foreground">{detail.guarantee || selectedOption.highlight}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      {SelectedIcon ? <SelectedIcon className="h-6 w-6" /> : null}
                    </div>
                  </div>

                  <div className="my-6 border-t border-border/60" />

                  {detail.price ? (
                    <div className="flex items-end gap-3">
                      <p className="text-4xl font-bold text-foreground">{detail.price}</p>
                      <div className="text-muted-foreground">
                        <p className="text-lg font-semibold text-primary">{detail.currency}</p>
                        <p className="text-sm">{detail.frequency}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                      Pas encore disponible – ouverture prochaine
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    {detail.features?.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    {isAvailable && detail.ctaHref ? (
                      <Button
                        size="lg"
                        className="h-12 w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                        asChild
                      >
                        <Link to={detail.ctaHref}>
                          {detail.ctaLabel}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="h-12 w-full bg-muted text-foreground font-semibold hover:bg-muted/90"
                        disabled
                      >
                        {detail.ctaLabel}
                      </Button>
                    )}
                    {detail.subCta?.length ? (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {detail.subCta.map((item) => (
                          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-3 py-1">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Hero;
