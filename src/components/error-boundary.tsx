"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Libellé affiché dans la zone d'erreur. */
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * UI-H03 : Error Boundary — évite l'écran blanc en cas d'erreur de rendu.
 * Affiche un message explicite avec un bouton de rechargement.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary]", this.props.label || "section", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
        >
          <div className="rounded-full bg-destructive/10 p-5">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Une erreur est survenue
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Quelque chose s&apos;est mal passé dans l&apos;affichage de
              cette section. Rechargez la page pour continuer.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
