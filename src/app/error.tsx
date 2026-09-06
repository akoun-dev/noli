"use client";

import { useEffect } from "react";

/**
 * Error boundary Next (App Router) pour les erreurs runtime d'un segment.
 * Offre un rendu de repli branché + un `reset()` pour re-tenter le rendu,
 * au lieu de l'écran d'erreur brut de Next.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalisé pour l'observabilité (capturé dans les logs serveur).
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-[8rem] sm:text-[10rem] font-bold leading-none text-destructive/10 select-none">
          500
        </h1>
        <div className="-mt-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Une erreur est survenue
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Désolé, un problème inattendu s&apos;est produit. Vous pouvez
            réessayer ou revenir à l&apos;accueil.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
      <p className="mt-16 text-xs text-muted-foreground/50">
        NOLI Assurance — Comparateur d&apos;assurances en Côte d&apos;Ivoire
      </p>
    </div>
  );
}
