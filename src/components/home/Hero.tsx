import { ArrowRight, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <div className="space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-full text-sm font-medium">
              <span>🚗</span>
              <span>Économisez jusqu'à 40% sur votre assurance auto</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Comparez les meilleures assurances auto{" "}
                <span className="text-primary">en moins de 3 minutes</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Comparez gratuitement les offres des plus grands assureurs ivoiriens et trouvez l'assurance qui vous correspond au meilleur prix.
              </p>
            </div>

            {/* CTA Button */}
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all group"
              asChild
            >
              <Link to="/comparer">
                Commencer mon devis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              {[
                { value: "6", label: "Assureurs" },
                { value: "50K+", label: "Clients" },
                { value: "3 min", label: "Temps" },
                { value: "40%", label: "Économie" },
              ].map((stat, index) => (
                <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Floating Card */}
          <div className="relative animate-float">
            <Card className="p-8 shadow-2xl border-2 border-primary/10 bg-card relative overflow-hidden">
              {/* Car Icon Badge */}
              <div className="absolute top-8 right-8 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>

              <div className="space-y-6">
                {/* Card Title */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Assurance Auto</h3>
                  <p className="text-sm text-muted-foreground mt-1">Le meilleur prix garanti</p>
                </div>

                {/* Price */}
                <div className="py-6 border-y border-border">
                  <div className="text-sm text-muted-foreground mb-2">À partir de</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">25 000</span>
                    <span className="text-xl font-semibold text-primary">FCFA</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">/ an</div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {[
                    "Comparaison instantanée",
                    "Meilleur prix garanti",
                    "Souscription en ligne",
                    "Assistance 24/7",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button 
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base group"
                  asChild
                >
                  <Link to="/comparer">
                    Obtenir mon devis gratuit
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>En moins de 3 minutes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔒</span>
                    <span>Sans engagement</span>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
                    <Shield className="w-3 h-3 text-accent" />
                    <span className="text-xs font-medium text-accent">100% sécurisé</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
