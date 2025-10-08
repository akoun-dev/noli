import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  const items = [
    { name: "Aïcha", city: "Abidjan", text: "J'ai économisé 35% sur mon assurance. Processus rapide et clair." },
    { name: "Yao", city: "Bouaké", text: "Comparaison très simple, j'ai trouvé une offre mieux couverte." },
    { name: "Mariam", city: "Yamoussoukro", text: "Service efficace, je recommande NOLI à mes proches." },
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Ils nous font confiance</h2>
          <p className="text-muted-foreground mt-2">Avis de nos utilisateurs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <Card key={i} className="p-6 h-full">
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed">{t.text}</p>
              <div className="mt-4 text-sm text-muted-foreground">{t.name} • {t.city}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

