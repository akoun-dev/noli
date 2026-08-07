import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche l'embarquement de l'app dans une iframe tierce (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le navigateur de deviner le type MIME des ressources.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limite les informations envoyées dans l'en-tête Referer vers d'autres origines.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive par défaut les API sensibles du navigateur non utilisées par l'app.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS pendant 2 ans, y compris pour les sous-domaines.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Le typage est vérifié via `tsc --noEmit` en CI/pre-commit ; ne jamais
  // masquer les erreurs de build ici (cela a déjà causé des régressions).
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
