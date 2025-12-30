import { ArrowRight, BadgeCheck, Bike, Car, HeartPulse, Home, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";

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

const Hero = () => {
  const navigate = useNavigate();

  const handleCardClick = (option: (typeof assuranceOptions)[number]) => {
    if (option.available && option.href) {
      navigate(option.href);
    }
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
        <div className="grid lg:grid-cols-[1.1fr_1.05fr] gap-12 items-start">
          <div className="space-y-6 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur dark:bg-white/10 dark:text-primary-foreground">
              <Sparkles className="w-4 h-4" />
              Nouveau parcours
            </div>

            <div className="relative mx-auto max-w-2xl">
              <div className="absolute -left-10 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
              <div className="absolute right-[-6%] bottom-[-6%] h-20 w-20 rounded-full bg-accent/25 blur-2xl" />
              <div className="relative overflow-hidden bg-transparent p-0 shadow-none backdrop-blur-none rounded-none">
                <img
                  src="/img/zebre_plein_sans_fond.png"
                  alt="Mascotte NOLI"
                  className="mx-auto block h-[23rem] w-[23rem] md:h-[29rem] md:w-[29rem] object-contain -scale-x-100"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
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

          <div className="relative lg:order-1">
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
                  onClick={() => handleCardClick(option)}
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
                          <div className="text-xs text-muted-foreground">Arrive bientôt</div>
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
    </section>
  );
};

export default Hero;
