"use client";

import Image from "next/image";
import { MapPin, Phone, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/app-store";

const noliLinks: { label: string; view: string }[] = [
  { label: "À propos", view: "about" },
  { label: "Contact", view: "contact" },
  { label: "FAQ", view: "faq" },
  { label: "Mentions légales", view: "mentions-legales" },
];

export function Footer() {
  const setView = useAppStore((s) => s.setView);
  return (
    <footer id="footer" className="mt-auto w-full bg-primary dark:bg-[#1B464D] text-secondary-foreground">
      <div className="h-1 w-full bg-accent" />

      <div className="mx-auto max-w-[1400px] px-8 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {/* Col 1: Logo + Description */}
          <div className="sm:col-span-2 lg:col-span-1 animate-slide-up">
            <div className="mb-4">
              <Image
                src="/img/noli-vertical.png"
                alt="NOLI Assurance"
                width={160}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </div>
            {/* UI-C02 : opacité relevée pour atteindre un contraste ≥ 4.5:1 */}
            <p className="text-sm leading-relaxed text-secondary-foreground/85">
              NOLI est votre plateforme de comparaison d&apos;assurances en
              Côte d&apos;Ivoire. Nous vous aidons à trouver la meilleure
              couverture au meilleur prix, en toute transparence.
            </p>
          </div>

          {/* Col 2: NOLI */}
          <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground/65">
              NOLI
            </h3>
            <ul className="flex flex-col gap-3">
              {noliLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => setView(link.view as never)}
                    className="group inline-flex items-center gap-1.5 text-sm text-secondary-foreground/90 transition-colors hover:text-accent"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-accent/60 transition-colors group-hover:bg-accent" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground/65">
              Contact
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3 text-sm text-secondary-foreground/90">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  Zone 4, Rue du Commerce,
                  <br />
                  Abidjan, Côte d&apos;Ivoire
                </span>
              </li>
              <li>
                <a
                  href="tel:+2252700000000"
                  className="group flex items-center gap-3 text-sm text-secondary-foreground/90 transition-colors hover:text-accent"
                >
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  +225 27 00 00 00 00
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@noli.ci"
                  className="group flex items-center gap-3 text-sm text-secondary-foreground/90 transition-colors hover:text-accent"
                >
                  <Mail className="h-4 w-4 shrink-0 text-accent" />
                  contact@noli.ci
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Separator className="bg-primary/20" />
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-8 py-5 sm:flex-row">
        <p className="text-xs text-secondary-foreground/80">
          © {new Date().getFullYear()} NOLI Assurance. Tous droits réservés.
        </p>
        <div className="flex items-center gap-4">
          <p className="flex items-center gap-1.5 text-xs text-secondary-foreground/80">
            Propulsé par
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground">
              NOLI
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
