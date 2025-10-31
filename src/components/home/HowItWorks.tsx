import { FileText, Search, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      number: "01",
      title: "Remplissez le formulaire",
      description: "Indiquez vos informations et celles de votre véhicule en moins de 3 minutes"
    },
    {
      icon: Search,
      number: "02",
      title: "Comparez les offres",
      description: "Visualisez instantanément les meilleures offres des assureurs partenaires"
    },
    {
      icon: CheckCircle2,
      number: "03",
      title: "Souscrivez en ligne",
      description: "Choisissez votre offre et finalisez votre souscription directement en ligne"
    }
  ];

  return (
    <section id="comment" className="py-20 px-4 bg-gradient-to-br from-primary/5 to-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Obtenez votre assurance auto en 3 étapes simples
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-success opacity-20" />
          
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative bg-card border-2 border-transparent hover:border-primary/20 animate-slide-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step Number */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 mt-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
