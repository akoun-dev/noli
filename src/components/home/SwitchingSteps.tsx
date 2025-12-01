import { CalendarClock, FileCheck2, Search, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    title: "Étape 1",
    description: "Comparez les offres du marché sur NOLI pour trouver mieux.",
    icon: Search,
  },
  {
    title: "Étape 2",
    description: "Choisissez le contrat qui vous convient chez un nouvel assureur.",
    icon: FileCheck2,
  },
  {
    title: "Étape 3",
    description: "Votre nouvel assureur s'occupe des démarches de résiliation.",
    icon: Timer,
  },
  {
    title: "Étape 4",
    description: "À la date choisie, l'ancien contrat est résilié et le nouveau démarre.",
    icon: CalendarClock,
  },
];

const SwitchingSteps = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-primary/5 via-background to-background dark:from-[#0b1518] dark:via-[#0f1a1e] dark:to-[#0c181c]">
      <div className="container mx-auto max-w-6xl space-y-10">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Loi Hamon
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Les étapes du changement d'assureur
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Résiliez simplement votre contrat auto grâce à la loi Hamon. On vous guide étape par étape pour passer au meilleur tarif.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.title}
                className="relative h-full rounded-3xl border border-border/60 bg-white/90 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-card/80 dark:border-border/40 dark:shadow-[0_25px_55px_-20px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-primary">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <div className="h-1 w-14 rounded-full bg-primary mb-4" />
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_15px_45px_rgba(27,70,77,0.35)]"
            asChild
          >
            <Link to="/comparer">Comparer en ligne</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SwitchingSteps;
