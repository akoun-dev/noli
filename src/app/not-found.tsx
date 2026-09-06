import Link from "next/link";

/**
 * 404 au niveau serveur (App Router) : rendu pour les appels `notFound()`
 * et les segments non résolus. Complète le 404 client du catch-all `[...slug]`.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-[10rem] sm:text-[12rem] font-bold leading-none text-primary/10 select-none">
          404
        </h1>
        <div className="-mt-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Page introuvable
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Oups ! La page que vous cherchez n&apos;existe pas ou a été
            déplacée. Vérifiez l&apos;URL ou retournez à l&apos;accueil.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/comparer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            Comparer mes offres
          </Link>
        </div>
      </div>
      <p className="mt-16 text-xs text-muted-foreground/50">
        NOLI Assurance — Comparateur d&apos;assurances en Côte d&apos;Ivoire
      </p>
    </div>
  );
}
