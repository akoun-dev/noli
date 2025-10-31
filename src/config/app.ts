export const APP_CONFIG = {
  name: 'NOLI Assurance',
  version: '1.0.0',
  description: 'Plateforme de comparaison d\'assurances automobiles',
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
  },
  features: {
    enableAuth: true,
    enableComparison: true,
    enableOffers: true,
    enablePayments: false,
  },
  ui: {
    theme: 'light',
    language: 'fr',
    currency: 'XOF',
    country: 'CI',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;