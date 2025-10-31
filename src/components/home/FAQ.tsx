import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Questions fréquentes</h2>
          <p className="text-muted-foreground mt-2">Tout savoir sur la comparaison et la souscription</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>La comparaison est-elle vraiment gratuite ?</AccordionTrigger>
            <AccordionContent>
              Oui. La comparaison et l’obtention des devis sont 100% gratuites et sans engagement.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Quels assureurs sont disponibles ?</AccordionTrigger>
            <AccordionContent>
              Nous travaillons avec des assureurs reconnus en Côte d'Ivoire pour vous proposer des offres fiables.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Combien de temps pour avoir un devis ?</AccordionTrigger>
            <AccordionContent>
              En général moins de 3 minutes, notre formulaire est optimisé pour aller vite.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Puis-je souscrire en ligne ?</AccordionTrigger>
            <AccordionContent>
              Oui, la souscription est possible directement en ligne selon l’assureur choisi.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;

