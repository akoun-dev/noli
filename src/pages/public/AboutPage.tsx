import React from 'react';
import { Shield, Users, Award, Globe } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              À Propos de NOLI Assurance
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Votre plateforme de confiance pour comparer les meilleures assurances automobiles en Côte d'Ivoire
            </p>
          </div>

          {/* Mission Section */}
          <div className="mb-16">
            <div className="bg-card rounded-lg shadow-sm border p-8">
              <h2 className="text-3xl font-bold text-foreground mb-6">Notre Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                NOLI Assurance a été créée avec une mission simple : rendre l'assurance automobile accessible,
                transparent et abordable pour tous les Ivoiriens.
              </p>
              <p className="text-lg text-muted-foreground">
                Nous croyons que chaque mérite de trouver la meilleure couverture au meilleur prix,
                sans avoir à passer des heures à comparer les offres manuellement.
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Nos Valeurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Confiance</h3>
                <p className="text-muted-foreground">Des partenaires assureurs fiables et réputés</p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Service Client</h3>
                <p className="text-muted-foreground">Une assistance dédiée pour vous accompagner</p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Excellence</h3>
                <p className="text-muted-foreground">Les meilleures garanties au meilleur prix</p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Innovation</h3>
                <p className="text-muted-foreground">Une technologie moderne pour votre sérénité</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-primary text-white rounded-lg p-12 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">50,000+</div>
                <div className="text-primary-foreground/80">Utilisateurs satisfaits</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">25+</div>
                <div className="text-primary-foreground/80">Assureurs partenaires</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100,000+</div>
                <div className="text-primary-foreground/80">Devis générés</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">30%</div>
                <div className="text-primary-foreground/80">Économie moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
