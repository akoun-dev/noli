"use client";

import { useEffect, useState } from "react";
import { Eye, Zap, Shield, Heart } from "lucide-react";

const values = [
  {
    icon: Eye,
    title: "Transparence",
    desc: "Des offres claires, sans surprise",
  },
  {
    icon: Zap,
    title: "Simplicité",
    desc: "Comparez en quelques clics",
  },
  {
    icon: Shield,
    title: "Confiance",
    desc: "Assureurs vérifiés et agréés",
  },
  {
    icon: Heart,
    title: "Proximité",
    desc: "Un service pensé pour la Côte d'Ivoire",
  },
];

export function AboutPage() {
  const [stats, setStats] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        const items = [
          { value: `${data.insurers}+`, label: "Assureurs partenaires" },
          { value: `${data.offers}+`, label: "Offres disponibles" },
          { value: `${data.users}+`, label: "Utilisateurs inscrits" },
        ];
        setStats(items);
      })
      .catch(() => {
        setStats([
          { value: "—", label: "Assureurs partenaires" },
          { value: "—", label: "Offres disponibles" },
          { value: "—", label: "Utilisateurs inscrits" },
        ]);
      });
  }, []);

  return (
    <main className="min-h-screen">
      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#E8F4F0] dark:bg-[#121e19] py-20 md:py-28">
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase animate-fade-in-up">
            Qui sommes-nous
          </span>

          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl animate-slide-up">
            À propos de{" "}
            <span className="text-primary">NOLI</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-subtitle text-lg text-muted-foreground sm:text-xl animate-slide-up delay-200">
            La plateforme qui démocratise l&apos;assurance en Côte d&apos;Ivoire.
            Notre mission : rendre la comparaison d&apos;assurances simple,
            transparente et accessible à tous.
          </p>
        </div>
      </section>

      {/* ─── Notre Mission ───────────────────────────────────── */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase animate-fade-in-up">
            Notre Mission
          </div>

          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            Rendre l&apos;assurance accessible à tous les Ivoiriens
          </h2>

          <div className="mt-8 space-y-5 font-subtitle text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            <p>
              NOLI est une plateforme ivoirienne de comparaison d&apos;assurances
              conçue pour aider les particuliers et les professionnels à trouver
              la couverture qui leur convient, au meilleur prix. En un instant,
              comparez les offres de plusieurs compagnies d&apos;assurance agréées
              et souscrivez en toute confiance.
            </p>

            <p>
              Nous comprenons que choisir une assurance peut être complexe et
              fastidieux. C&apos;est pourquoi nous avons créé un outil intuitif qui
              analyse vos besoins et vous présente les meilleures options du
              marché, avec des détails clairs et compréhensibles. Plus besoin de
              contacter chaque assureur un par un — NOLI fait le travail pour
              vous.
            </p>

            <p>
              Basée en Côte d&apos;Ivoire, notre équipe connaît les réalités locales
              et s&apos;engage à offrir un service fiable, transparent et adapté aux
              besoins spécifiques du marché ivoirien. Notre objectif est simple :
              vous faire économiser du temps et de l&apos;argent, tout en
              garantissant une couverture de qualité.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Nos Valeurs ─────────────────────────────────────── */}
      <section className="bg-[#E8F4F0] dark:bg-[#121e19] py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase animate-fade-in-up">
            Nos Valeurs
          </div>

          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            Ce qui nous guide chaque jour
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="group rounded-xl border border-border/50 bg-background p-6 shadow-sm transition-shadow duration-300 hover:shadow-md animate-fade-in-up"
                  style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-1.5 font-subtitle text-sm text-muted-foreground">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Nos Chiffres ────────────────────────────────────── */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase animate-fade-in-up">
            Nos Chiffres
          </div>

          <h2 className="mb-12 text-center font-display text-3xl font-bold text-foreground sm:text-4xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            NOLI en quelques données
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map((s, idx) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/50 bg-[#E8F4F0] dark:bg-[#121e19] px-6 py-8 text-center animate-fade-in-up"
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                <p className="font-display text-4xl font-bold text-primary sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 font-subtitle text-sm text-muted-foreground sm:text-base">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
