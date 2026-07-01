"use client";

import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
];

export function Footer() {
  return (
    <footer className="mt-auto w-full bg-primary text-primary-foreground">
      {/* Lime accent top border */}
      <div className="bg-brand h-1 w-full" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Column 1: Logo + Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-4 flex items-center gap-1">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  NOLI
                </span>
                <span className="bg-brand inline-block size-2.5 rounded-full" />
                <span className="text-base font-medium text-primary-foreground/70">
                  Assurance
                </span>
              </div>
              <p className="text-sm leading-relaxed text-primary-foreground/60">
                Comparez les meilleures offres d&apos;assurance auto en Côte
                d&apos;Ivoire. Trouvez la couverture idéale au meilleur prix en
                quelques clics.
              </p>
              {/* Social icons */}
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-brand hover:text-brand-foreground"
                  >
                    <social.icon className="size-4" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Column 2: Assurance Auto */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/40">
              Assurance Auto
            </h3>
            <ul className="flex flex-col gap-3">
              {assuranceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 transition-colors hover:text-brand"
                  >
                    <span className="inline-block size-1 rounded-full bg-brand/40 transition-colors group-hover:bg-brand" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: NOLI */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/40">
              NOLI
            </h3>
            <ul className="flex flex-col gap-3">
              {noliLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 transition-colors hover:text-brand"
                  >
                    <span className="inline-block size-1 rounded-full bg-brand/40 transition-colors group-hover:bg-brand" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 4: Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground/40">
              Contact
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3 text-sm text-primary-foreground/70">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  Zone 4, Rue du Commerce,
                  <br />
                  Abidjan, Côte d&apos;Ivoire
                </span>
              </li>
              <li>
                <a
                  href="tel:+2252700000000"
                  className="group flex items-center gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-brand"
                >
                  <Phone className="size-4 shrink-0 text-brand" />
                  +225 27 00 00 00 00
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@noli.ci"
                  className="group flex items-center gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-brand"
                >
                  <Mail className="size-4 shrink-0 text-brand" />
                  contact@noli.ci
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom bar */}
      <Separator className="bg-primary-foreground/10" />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} NOLI Assurance. Tous droits réservés.
        </p>
        <p className="flex items-center gap-1.5 text-xs text-primary-foreground/50">
          Propulsé par
          <span className="font-semibold text-brand">NOLI</span>
          <span className="text-primary-foreground/30">Assurance</span>
        </p>
      </div>
    </footer>
  );
}