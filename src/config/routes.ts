export const APP_ROUTES = {
  // Public routes
  public: {
    home: '/',
    about: '/a-propos',
    contact: '/contact',
  },

  // Auth routes
  auth: {
    login: '/auth/connexion',
    register: '/auth/inscription',
    forgotPassword: '/auth/mot-de-passe-oublie',
    resetPassword: '/auth/reinitialiser-mot-de-passe',
  },

  // Comparison routes
  comparison: {
    start: '/comparer',
    step1: '/comparer/profil',
    step2: '/comparer/vehicule',
    step3: '/comparer/besoins',
  },

  // Offers routes
  offers: {
    list: '/offres',
    detail: '/offres/:id',
    quote: '/offres/:id/devis',
  },

  // User routes
  user: {
    dashboard: '/tableau-de-bord',
    profile: '/profil',
    quotes: '/mes-devis',
    policies: '/mes-contrats',
    documents: '/documents',
    reviews: '/mes-avis',
  },

  // Insurer routes
  insurer: {
    dashboard: '/assureur/tableau-de-bord',
    offers: '/assureur/offres',
    quotes: '/assureur/devis',
    analytics: '/assureur/analytics',
  },

  // Admin routes
  admin: {
    dashboard: '/admin/tableau-de-bord',
    users: '/admin/utilisateurs',
    insurers: '/admin/assureurs',
    offers: '/admin/offres',
    quotes: '/admin/devis',
    tarification: '/admin/tarification',
    settings: '/admin/parametres',
  },
} as const

export type RouteKey = keyof typeof APP_ROUTES
