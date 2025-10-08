import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-primary to-accent">
      <div className="container mx-auto max-w-7xl text-center text-primary-foreground">
        <h2 className="text-3xl md:text-4xl font-bold">Prêt à économiser sur votre assurance auto ?</h2>
        <p className="mt-2 opacity-90">Comparez les offres et souscrivez en ligne en quelques minutes.</p>
        <div className="mt-6">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/comparer">Commencer maintenant</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;

