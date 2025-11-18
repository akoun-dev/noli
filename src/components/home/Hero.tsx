import { ArrowRight, Check, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Produits & Prix",
    description: "Compare les garanties en détail avec des conseils clairs et actionnables.",
    icon: "📊",
  },
  {
    title: "Avis clients",
    description: "Lis les retours d'expérience vérifiés avant de te décider sereinement.",
    icon: "⭐",
  },
  {
    title: "Choix malins",
    description: "Sélectionne une offre créée pour ton profil et ton budget.",
    icon: "🧠",
  },
];

const Hero = () => {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-hero blur-[120px] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-secondary/40 to-background" />
      </div>
      <div className="relative z-10 px-4 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center text-white">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide backdrop-blur">
              <Sparkles className="w-4 h-4" />
              Comparatif instantané
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/80">
                Compsat heightkont
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display leading-tight drop-shadow-xl">
                Comparez malin. <br /> Décidez serein.
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                Fais tes choix avec clarté. NOLI t'accompagne sur chaque étape de ton assurance auto, en toute transparence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_20px_45px_rgba(223,240,71,0.35)]"
                asChild
              >
                <Link to="/comparer">
                  Passe à l'action
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-white/15 text-white hover:bg-white/25 border-white/30"
                asChild
              >
                <Link to="/a-propos">Découvrir nos garanties</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <Card className="p-8 bg-white/95 text-foreground shadow-[0_30px_80px_rgba(23,24,23,0.2)] border-0 rounded-[32px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm text-muted-foreground">Compas assurance</p>
                  <p className="text-2xl font-bold text-primary">Auto Pro Secure</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Shield />
                </div>
              </div>

              <div className="flex items-baseline gap-3 border-y border-border/70 py-6">
                <span className="text-5xl font-bold text-primary">25 000</span>
                <div>
                  <p className="text-lg font-semibold text-primary">FCFA</p>
                  <p className="text-muted-foreground text-sm">par an</p>
                </div>
              </div>

              <div className="space-y-3 py-6">
                {["Comparaison instantanée", "Support 24/7", "Souscription guidée", "Budget optimisé"].map(
                  (feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm">
                      <span className="w-4 h-4 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                      {feature}
                    </div>
                  )
                )}
              </div>

              <Button className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base">
                Obtenir mon devis gratuit
              </Button>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-6">
                <span>⚡ En moins de 3 minutes</span>
                <span>🔒 Sans engagement</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-16">
        <div className="bg-foreground text-background py-10">
          <div className="max-w-6xl mx-auto px-4 grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <Card key={card.title} className="p-6 rounded-2xl bg-white/95 shadow-xl text-foreground">
                <div className="text-3xl">{card.icon}</div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{card.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
