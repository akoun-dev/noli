import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

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
  // Content-Security-Policy : restreint les sources de scripts/styles/images.
  // 'unsafe-inline' reste requis pour les scripts/styles injectés par Next.js
  // tant qu'on n'a pas de CSP à nonce (à durcir plus tard via middleware).
  // 'unsafe-eval' n'est ajouté qu'en développement : le runtime React/Turbopack
  // utilise eval() pour le fast refresh ; jamais en production.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
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
