"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/app-store";

const assuranceLinks = [
  { label: "Tiers simple", href: "#" },
  { label: "Tiers+", href: "#" },
  { label: "Tous risques", href: "#" },
  { label: "Assistance", href: "#" },
];

const noliLinks = [
  { label: "À propos", href: "#" },
  { label: "Contact", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Mentions légales", href: "#" },
];

export function Footer() {
  const setView = useAppStore((s) => s.setView);
  return (
    <footer id="footer" className="mt-auto w-full bg-primary dark:bg-[#1B464D] text-secondary-foreground">
      {/* Accent top bar */}
      <div className="h-1 w-full bg-accent" />

      <div className="mx-auto max-w-[1400px] px-8 py-12">
        {/* 4-column responsive grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Col 1: Logo + Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-4">
                <img src="/img/noli-vertical.png" alt="NOLI Assurance" className="h-10 w-auto object-contain brightness-0 invert-0 dark:brightness-200" />
              </div>
              <p className="text-sm leading-relaxed text-secondary-foreground/60">
                NOLI est votre plateforme de comparaison d&apos;assurances en
                Côte d&apos;Ivoire. Nous vous aidons à trouver la meilleure
                couverture au meilleur prix, en toute transparence.
              </p>
            </motion.div>
          </div>

          {/* Col 2: Assurance Auto */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground/40">
              Assurance Auto
            </h3>
            <ul className="flex flex-col gap-3">
              {assuranceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 transition-colors hover:text-accent"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-accent/40 transition-colors group-hover:bg-accent" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Col 3: NOLI */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground/40">
              NOLI
            </h3>
            <ul className="flex flex-col gap-3">
              {noliLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 transition-colors hover:text-accent"
                  >
                    <span className="inline-block h-1 w-1 rounded-full bg-accent/40 transition-colors group-hover:bg-accent" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Col 4: Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground/40">
              Contact
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3 text-sm text-secondary-foreground/70">
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
                  className="group flex items-center gap-3 text-sm text-secondary-foreground/70 transition-colors hover:text-accent"
                >
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  +225 27 00 00 00 00
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@noli.ci"
                  className="group flex items-center gap-3 text-sm text-secondary-foreground/70 transition-colors hover:text-accent"
                >
                  <Mail className="h-4 w-4 shrink-0 text-accent" />
                  contact@noli.ci
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <Separator className="bg-primary/20" />
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-8 py-5 sm:flex-row">
        <p className="text-xs text-secondary-foreground/50">
          © {new Date().getFullYear()} NOLI Assurance. Tous droits réservés.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView("admin")}
            className="text-xs text-secondary-foreground/30 hover:text-secondary-foreground/60 transition-colors"
          >
            Administration
          </button>
          <p className="flex items-center gap-1.5 text-xs text-secondary-foreground/50">
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