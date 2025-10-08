import { Shield, Clock, TrendingDown, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "100% Gratuit",
      description: "Comparez sans frais toutes les offres d'assurance auto disponibles en Côte d'Ivoire",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      icon: Clock,
      title: "Rapide & Simple",
      description: "Obtenez vos devis en moins de 3 minutes avec notre formulaire optimisé",
      color: "text-accent",
      bg: "bg-accent/10"
    },
    {
      icon: TrendingDown,
      title: "Économisez jusqu'à 40%",
      description: "Trouvez l'assurance la moins chère adaptée à votre profil et vos besoins",
      color: "text-info",
      bg: "bg-info/10"
    },
    {
      icon: Users,
      title: "50 000+ Clients Satisfaits",
      description: "Rejoignez des milliers d'ivoiriens qui nous font déjà confiance",
      color: "text-success",
      bg: "bg-success/10"
    }
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Avec NOLI, comparer c'est gagner
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez toutes nos solutions d'assurance pour vous protéger au meilleur prix
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
