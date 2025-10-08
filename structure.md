src
├── App.tsx
├── assets/                        # Images, icônes, logos
│   ├── logo.svg
│   ├── hero-banner.jpg
│   └── partners/
├── components/                    # Composants transverses
│   ├── common/                    # Header, Footer, Hero, Features
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── PartnerLogos.tsx
│   ├── layout/                    # Layouts (admin, public, etc.)
│   │   └── MainNavigationHeader.tsx
│   ├── forms/                     # Champs formulaires génériques
│   └── ui/                        # shadcn/ui (button, card, table…)
│       ├── button.tsx
│       ├── card.tsx
│       ├── form.tsx
│       ├── table.tsx
│       ├── toast.tsx
│       └── ...
├── config/                        # Configs globales
│   ├── app.ts
│   ├── env.ts
│   ├── routes.ts
│   └── theme.ts
├── contexts/                      # Context API (auth, user, settings)
│   ├── AuthContext.tsx
│   └── UserContext.tsx
├── data/                          # Données & Repositories
│   ├── api/                       # Clients HTTP (Supabase)
│   │   
│   ├── repositories/              # Repos métiers (Assureur, Offre…)
│   │   ├── OfferRepository.ts
│   │   ├── UserRepository.ts
│   │   └── AdminRepository.ts
│   └── stores/                    # Stores (Zustand/React Query)
│       └── OfferStore.ts
├── errors/                        # Gestion des erreurs
│   ├── boundaries/
│   ├── handlers/
│   └── types/
├── features/                      # Domaines fonctionnels
│   ├── auth/                      # Connexion / Inscription
│   │   ├── pages/LoginPage.tsx
│   │   ├── pages/RegisterPage.tsx
│   │   ├── services/AuthService.ts
│   │   └── hooks/useAuth.ts
│   ├── comparison/                # Parcours comparateur
│   │   ├── components/
│   │   │   ├── ComparisonForm.tsx
│   │   │   ├── StepProfile.tsx
│   │   │   ├── StepVehicle.tsx
│   │   │   └── StepCoverage.tsx
│   │   ├── pages/ComparisonPage.tsx
│   │   └── services/ComparisonService.ts
│   ├── offers/                    # Gestion et affichage des offres
│   │   ├── components/OfferCard.tsx
│   │   ├── pages/OfferListPage.tsx
│   │   └── services/OfferService.ts
│   ├── insurers/                  # Espace assureurs
│   │   ├── pages/InsurerDashboardPage.tsx
│   │   └── services/InsurerService.ts
│   ├── admin/                     # Espace administrateur
│   │   ├── pages/AdminDashboardPage.tsx
│   │   └── services/AdminService.ts
│   ├── notifications/
│   ├── payments/                  # Paiement/souscription futur
│   └── reporting/                 # Analytics, statistiques
├── guards/                        # AuthGuard, RoleGuard
├── hooks/                         # Hooks génériques (useToast, useMobile…)
├── layouts/                       # Layouts pages (Public, Admin, Assureur)
├── lib/                           # Utils spécifiques (formatters, dates…)
├── pages/                         # Routing global (public/admin/assureur)
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── AboutUsPage.tsx
│   │   └── ContactPage.tsx
│   ├── admin/
│   ├── insurer/
│   └── user/
├── services/                      # Services transverses (mail, pdf…)
│   ├── PdfService.ts
│   ├── NotificationService.ts
│   └── AnalyticsService.ts
├── types/                         # Types globaux (DTOs, models…)
├── utils/                         # Fonctions utilitaires (validation, format…)
└── main.tsx
