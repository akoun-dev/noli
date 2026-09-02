"use client";

import { useEffect } from "react";

/**
 * Error boundary racine : capture les erreurs survenant dans le layout racine
 * lui-même (que `error.tsx` ne peut pas intercepter). Il REMPLACE le layout,
 * donc il doit fournir ses propres <html>/<body> ; globals.css n'étant pas
 * garanti ici, on utilise des styles inline pour un rendu fiable.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              margin: "0 0 0.75rem",
            }}
          >
            Une erreur est survenue
          </h1>
          <p style={{ color: "#64748b", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            Un problème inattendu a interrompu l&apos;application. Vous pouvez
            réessayer.
          </p>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              borderRadius: "9999px",
              border: "none",
              background: "#0ea5e9",
              color: "#ffffff",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
        <p style={{ marginTop: "4rem", fontSize: "0.75rem", color: "#94a3b8" }}>
          NOLI Assurance — Comparateur d&apos;assurances en Côte d&apos;Ivoire
        </p>
      </body>
    </html>
  );
}
