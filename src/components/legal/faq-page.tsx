"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

const faqs = [
  {
    q: "Comment fonctionne NOLI ?",
    a: "NOLI compare les offres d'assurance automobile des principaux assureurs de Côte d'Ivoire. Remplissez simplement vos informations une fois, et nous vous présentons les meilleures offres adaptées à votre profil.",
  },
  {
    q: "Est-ce que NOLI est gratuit ?",
    a: "Oui, NOLI est entièrement gratuit pour les utilisateurs. Nous sommes rémunérés par les assureurs partenaires lorsque vous souscrivez une police via notre plateforme.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Nous utilisons un cryptage de bout en bout pour protéger vos informations personnelles. Vos données ne sont jamais partagées sans votre consentement explicite.",
  },
  {
    q: "Puis-je comparer plusieurs types d'assurance ?",
    a: "Actuellement, nous comparons les assurances automobile. D'autres catégories (moto, habitation, etc.) seront disponibles prochainement.",
  },
  {
    q: "Comment sont calculés les prix affichés ?",
    a: "Les prix sont calculés en temps réel en fonction des informations que vous fournissez (véhicule, profil, garanties souhaitées) et des grilles tarifaires de chaque assureur partenaire.",
  },
  {
    q: "Puis-je obtenir un devis sans m'engager ?",
    a: "Oui, la comparaison et le devis sont totalement gratuits et sans engagement. Vous ne payez que si vous décidez de souscrire une offre.",
  },
  {
    q: "Que faire en cas de sinistre ?",
    a: "En cas de sinistre, contactez directement votre assureur. NOLI est une plateforme de comparaison et n'intervient pas dans la gestion des sinistres.",
  },
  {
    q: "Comment contacter le service client ?",
    a: "Vous pouvez nous joindre par email à contact@noli.ci ou par téléphone au +225 27 00 00 00 00, du lundi au vendredi de 8h à 18h.",
  },
];

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Foire Aux Questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Tout ce que vous devez savoir sur NOLI Assurance
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/30"
              >
                <span className="font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === i ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Vous ne trouvez pas votre réponse ?
          </p>
          <Button
            onClick={() => setView("contact")}
            className="rounded-full"
          >
            Contactez-nous
          </Button>
        </div>
      </section>
    </div>
  );
}
