# Organisation par Modules - NOLI Assurance

Ce document définit l'organisation modulaire de la plateforme NOLI Assurance pour optimiser le développement, la maintenance et la scalabilité.

## Architecture Générale

### Philosophie
- **Feature-Driven Development**: Organisation par fonctionnalités métier plutôt que par couches techniques
- **Rôles bien définis**: USER/INSURER/ADMIN avec des périmètres clairs
- **Low Coupling**: Modules autonomes avec des dépendances minimales
- **High Cohesion**: Fonctionnalités regroupées logiquement

## Structure des Modules

```
src/
├── core/                           # Module Fondamental
├── features/                       # Modules Métiers
│   ├── auth/                      # Authentification
│   ├── comparison/                # Comparaison d'assurances
│   ├── quotes/                    # Gestion des devis
│   ├── offers/                    # Offres d'assurance
│   ├── payments/                  # Paiements
│   ├── user/                      # Espace client
│   ├── insurer/                   # Espace assureur
│   ├── admin/                     # Administration
│   ├── notifications/             # Notifications
│   └── chat/                      # Communication
├── shared/                         # Modules Transversaux
│   ├── components/                # Composants UI
│   ├── services/                  # Services techniques
│   ├── utils/                     # Utilitaires
│   └── types/                     # Types TypeScript
└── infrastructure/                 # Infrastructure technique
```

---

## Module 1: Core (Fondamental)

**Responsabilité**: Fonctionnalités essentielles partagées par toute l'application

**Structure**:
```
core/
├── auth/                          # Authentification centralisée
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── PermissionCache.ts
│   ├── guards/
│   │   ├── AuthGuard.tsx
│   │   └── RoleGuard.tsx
│   ├── services/
│   │   ├── authService.ts
│   │   └── secureAuthService.ts
│   └── types/
│       └── auth.types.ts
├── routing/                       # Routage principal
│   ├── AppRoutes.tsx
│   ├── LazyRoutes.tsx
│   └── routeGuards.tsx
├── themes/                        # Thématique
│   ├── ThemeContext.tsx
│   └── theme.types.ts
└── database/                      # Connexion BDD
    ├── supabase.ts
    └── supabaseHelpers.ts
```

**Dépendances**: Supabase, React Router, TanStack Query

**Interfaces**:
- `AuthInterface`: Gestion authentification
- `RoutingInterface`: Configuration routes
- `DatabaseInterface`: Connexion base de données

---

## Module 2: Authentication

**Responsabilité**: Gestion complète du cycle d'authentification

**Structure**:
```
features/auth/
├── components/                    # Composants auth
│   ├── LoginForm/
│   ├── RegisterForm/
│   ├── ForgotPasswordForm/
│   └── SocialLoginButtons/
├── pages/                         # Pages d'auth
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ResetPasswordPage.tsx
├── hooks/                         # Hooks personnalisés
│   ├── useAuth.ts
│   └── usePermissions.ts
├── services/                      # Services auth
│   └── authApiService.ts
├── schemas/                       # Validation Zod
│   └── auth.schemas.ts
└── types/                         # Types locaux
    └── auth.types.ts
```

**Flux utilisateur**:
1. Page de connexion/inscription
2. Validation formulaires (Zod)
3. Authentification Supabase
4. Mise à jour AuthContext
5. Redirection selon rôle

**Dépendances**: Core Module, Form Services, Validation

---

## Module 3: Comparison (Comparaison)

**Responsabilité**: Workflow complet de comparaison d'assurances

**Structure**:
```
features/comparison/
├── components/                    # Composants du workflow
│   ├── ComparisonForm/           # Formulaire principal
│   ├── Step1Personal/            # Étape 1: Infos personnelles
│   ├── Step2Vehicle/             # Étape 2: Infos véhicule
│   ├── Step3Needs/               # Étape 3: Besoins couverture
│   ├── Stepper/                  # Barre de progression
│   └── FormSummary/              # Récapitulatif
├── pages/                         # Pages du module
│   ├── ComparisonPage.tsx        # Page principale
│   └── ComparisonHistoryPage.tsx # Historique
├── contexts/                      # État du formulaire
│   └── ComparisonContext.tsx
├── services/                      # Services métiers
│   ├── comparisonService.ts
│   └── comparisonHistoryService.ts
├── schemas/                       # Validation par étape
│   ├── personal.schema.ts
│   ├── vehicle.schema.ts
│   └── needs.schema.ts
├── types/                         # Types métiers
│   ├── comparison.types.ts
│   └── form.types.ts
└── hooks/                         # Hooks du module
    ├── useComparisonForm.ts
    └── useComparisonHistory.ts
```

**Workflow en 3 étapes**:
1. **Personnelles**: Nom, email, téléphone, permis
2. **Véhicule**: Marque, modèle, immatriculation, valeur
3. **Besoins**: Type couverture, usage, kilométrage

**Dépendances**: Core Module, Forms Module, Validation, Quote Service

---

## Module 4: Quotes (Devis)

**Responsabilité**: Génération et gestion des devis PDF

**Structure**:
```
features/quotes/
├── components/                    # Composants devis
│   ├── QuoteGenerator/
│   ├── QuotePreview/
│   ├── QuotePDFGenerator/
│   └── QuoteActions/
├── pages/                         # Pages devis
│   ├── QuoteDetailsPage.tsx
│   └── QuoteListPage.tsx
├── services/                      # Services devis
│   ├── quoteService.ts
│   └── quotePdfService.ts
├── templates/                     # Templates PDF
│   └── quote.template.ts
├── types/                         # Types devis
│   └── quote.types.ts
└── utils/                         # Utilitaires
    ├── pdfHelpers.ts
    └── quoteCalculations.ts
```

**Fonctionnalités**:
- Génération PDF avec jsPDF
- Calcul des tarifs
- Sauvegarde des devis
- Partage par email

**Dépendances**: PDF Module, Tarification Module, Notification Module

---

## Module 5: Offers (Offres)

**Responsabilité**: Gestion des offres d'assurance

**Structure**:
```
features/offers/
├── components/                    # Composants offres
│   ├── OfferCard/
│   ├── OfferFilters/
│   ├── OfferComparison/
│   ├── OfferDetails/
│   └── LiveChatWidget/
├── pages/                         # Pages offres
│   ├── OffersListPage.tsx
│   └── OfferDetailsPage.tsx
├── services/                      # Services offres
│   ├── offerService.ts
│   └── offerComparisonService.ts
├── hooks/                         # Hooks offres
│   ├── useOffers.ts
│   └── useOfferFilters.ts
└── types/                         # Types offres
    └── offer.types.ts
```

**Fonctionnalités**:
- Liste des offres disponibles
- Filtrage et recherche
- Comparaison d'offres
- Chat en direct

**Dépendances**: Core Module, Chat Module, Search Module

---

## Module 6: User (Espace Client)

**Responsabilité**: Portail client complet

**Structure**:
```
features/user/
├── components/                    # Composants utilisateur
│   ├── UserDashboard/
│   ├── ProfileManager/
│   ├── DocumentUploader/
│   ├── QuoteManager/
│   └── PolicyManager/
├── pages/                         # Pages utilisateur
│   ├── UserDashboardPage.tsx
│   ├── UserProfilePage.tsx
│   ├── UserQuotesPage.tsx
│   ├── UserPoliciesPage.tsx
│   ├── UserDocumentsPage.tsx
│   └── UserNotificationsPage.tsx
├── services/                      # Services utilisateur
│   ├── userService.ts
│   ├── documentService.ts
│   ├── policyService.ts
│   └── reviewService.ts
├── contexts/                      # Contexte utilisateur
│   └── UserContext.tsx
├── types/                         # Types utilisateur
│   └── user.types.ts
└── hooks/                         # Hooks utilisateur
    ├── useUserProfile.ts
    ├── useUserDocuments.ts
    └── useUserPolicies.ts
```

**Fonctionnalités**:
- Tableau de bord personnel
- Gestion profil et documents
- Suivi devis et contrats
- Notifications et alertes

**Dépendances**: Core Module, Document Module, Notification Module

---

## Module 7: Insurer (Espace Assureur)

**Responsabilité**: Portail assureur pour gestion commerciale

**Structure**:
```
features/insurer/
├── components/                    # Composants assureur
│   ├── InsurerDashboard/
│   ├── ClientManager/
│   ├── OfferManager/
│   ├── AnalyticsPanel/
│   ├── AlertSystem/
│   └── CommunicationPanel/
├── pages/                         # Pages assureur
│   ├── InsurerDashboardPage.tsx
│   ├── InsurerOffersPage.tsx
│   ├── InsurerClientsPage.tsx
│   ├── InsurerAnalyticsPage.tsx
│   └── InsurerSettingsPage.tsx
├── services/                      # Services assureur
│   ├── insurerService.ts
│   ├── clientCommunicationService.ts
│   ├── insurerAnalyticsService.ts
│   └── insurerAlertService.ts
├── types/                         # Types assureur
│   └── insurer.types.ts
└── hooks/                         # Hooks assureur
    ├── useInsurerData.ts
    ├── useClientCommunication.ts
    └── useInsurerAnalytics.ts
```

**Fonctionnalités**:
- Analytics commerciales
- Gestion clients
- Création/modification offres
- Système d'alertes
- Communication client

**Dépendances**: Core Module, Analytics Module, Chat Module, Notification Module

---

## Module 8: Admin (Administration)

**Responsabilité**: Administration et supervision de la plateforme

**Structure**:
```
features/admin/
├── components/                    # Composants admin
│   ├── AdminDashboard/
│   ├── UserManager/
│   ├── RoleManager/
│   ├── TarificationManager/
│   ├── SystemMonitor/
│   └── AuditLogs/
├── pages/                         # Pages admin
│   ├── AdminDashboardPage.tsx
│   ├── AdminUsersPage.tsx
│   ├── AdminTarificationPage.tsx
│   ├── AdminAnalyticsPage.tsx
│   └── AdminSettingsPage.tsx
├── services/                      # Services admin
│   ├── adminService.ts
│   ├── roleManagementService.ts
│   ├── auditService.ts
│   └── adminDataApiService.ts
├── types/                         # Types admin
│   └── admin.types.ts
└── hooks/                         # Hooks admin
    ├── useAdminData.ts
    ├── useRoleManagement.ts
    └── useAuditLogs.ts
```

**Fonctionnalités**:
- Gestion utilisateurs et rôles
- Configuration tarification
- Audit et logs
- Analytics plateforme
- Maintenance système

**Dépendances**: Core Module, Role Management, Audit Module, Tarification Module

---

## Module 9: Payments (Paiements)

**Responsabilité**: Traitement des paiements et gestion financière

**Structure**:
```
features/payments/
├── components/                    # Composants paiement
│   ├── PaymentForm/
│   ├── PaymentMethodSelector/
│   ├── TransactionHistory/
│   └── InvoiceGenerator/
├── pages/                         # Pages paiement
│   ├── PaymentsPage.tsx
│   └── PaymentHistoryPage.tsx
├── services/                      # Services paiement
│   ├── paymentService.ts
│   ├── transactionService.ts
│   └── invoiceService.ts
├── types/                         # Types paiement
│   └── payment.types.ts
└── hooks/                         # Hooks paiement
    ├── usePayments.ts
    └── useTransactionHistory.ts
```

**Fonctionnalités**:
- Traitement paiements sécurisés
- Gestion méthodes de paiement
- Historique transactions
- Génération factures

**Dépendances**: Core Module, External Payment APIs

---

## Module 10: Notifications

**Responsabilité**: Système de notifications et alertes

**Structure**:
```
features/notifications/
├── components/                    # Composants notifications
│   ├── NotificationCenter/
│   ├── NotificationBell/
│   ├── NotificationPreferences/
│   └── EmailTemplates/
├── services/                      # Services notifications
│   ├── notificationService.ts
│   ├── emailService.ts
│   └── pushNotificationService.ts
├── types/                         # Types notifications
│   └── notification.types.ts
└── hooks/                         # Hooks notifications
    ├── useNotifications.ts
    └── useNotificationPreferences.ts
```

**Fonctionnalités**:
- Notifications in-app
- Emails automatiques
- Push notifications
- Préférences utilisateur

**Dépendances**: Core Module, Email Services, Push Services

---

## Module 11: Chat (Communication)

**Responsabilité**: Communication temps réel

**Structure**:
```
features/chat/
├── components/                    # Composants chat
│   ├── ChatWidget/
│   ├── ChatInterface/
│   ├── ChatHistory/
│   └── ChatAgents/
├── services/                      # Services chat
│   ├── chatService.ts
│   ├── websocketService.ts
│   └── chatBotService.ts
├── types/                         # Types chat
│   └── chat.types.ts
└── hooks/                         # Hooks chat
    ├── useChat.ts
    └── useWebSocket.ts
```

**Fonctionnalités**:
- Chat temps réel
- Historique conversations
- Chatbot pour questions fréquentes
- Transfert vers agents humains

**Dépendances**: Core Module, WebSocket, Realtime Services

---

## Modules Transversaux (Shared)

### Shared Components
```
shared/components/
├── ui/                            # shadcn/ui (42+ composants)
├── forms/                         # Composants formulaires
├── layout/                        # Composants layout
├── common/                        # Composants partagés
└── charts/                        # Composants graphiques
```

### Shared Services
```
shared/services/
├── pdfService.ts                  # Génération PDF
├── notificationService.ts         # Notifications
├── realtimeService.ts             # Mises à jour temps réel
├── validationService.ts           # Validation
└── storageService.ts              # Stockage fichiers
```

### Shared Utils
```
shared/utils/
├── formatters.ts                  # Formatage données
├── validators.ts                  # Validateurs
├── calculators.ts                 # Calculs métiers
├── constants.ts                   # Constantes
└── helpers.ts                     # Fonctions utilitaires
```

---

## Infrastructure Technique

### Testing Infrastructure
```
infrastructure/testing/
├── unit/                          # Tests unitaires
├── integration/                   # Tests d'intégration
├── e2e/                          # Tests end-to-end
└── fixtures/                      # Données de test
```

### Performance Monitoring
```
infrastructure/monitoring/
├── sentry/                        # Error tracking
├── lighthouse/                    # Performance audits
├── analytics/                     # User analytics
└── logging/                       # Structured logging
```

---

## Règles d'Organisation

### 1. Principes de Développement
- **Single Responsibility**: Chaque module a une responsabilité claire
- **Interface Segregation**: Interfaces spécifiques pour chaque module
- **Dependency Inversion**: Dépendances abstraites, pas concrètes
- **Feature Isolation**: Modules autonomes et testables

### 2. Gestion des Dépendances
- **Modules Core**: Peuvent être utilisés par tous
- **Modules Features**: Dépendent du Core uniquement
- **Modules Shared**: Utilisés par multiple modules
- **Modules Infrastructure**: Supports techniques

### 3. Communication Entre Modules
- **Services partagés**: Pour la communication inter-modules
- **Contexts globaux**: Pour l'état partagé
- **Events/Bus**: Pour les actions découplées
- **API contracts**: Interfaces claires entre modules

### 4. Tests et Qualité
- **Tests par module**: Chaque module a ses propres tests
- **Tests d'intégration**: Pour les interactions entre modules
- **Tests E2E**: Pour les workflows complets
- **Coverage targets**: 70%+ par module

---

## Feuille de Route par Module

### Phase 1: Modules Fondamentaux (Sprint 1-2)
1. **Core Module**: Authentification, routing, BDD
2. **Auth Module**: Login/register complets
3. **Shared Components**: Base UI library

### Phase 2: Modules Métiers Core (Sprint 3-4)
4. **Comparison Module**: Workflow comparaison
5. **Quotes Module**: Génération devis PDF
6. **Offers Module**: Affichage offres

### Phase 3: Portails Utilisateurs (Sprint 5-6)
7. **User Module**: Espace client
8. **Payments Module**: Intégration paiements
9. **Notifications Module**: Système notifications

### Phase 4: Portails Professionnels (Sprint 7-8)
10. **Insurer Module**: Espace assureur
11. **Admin Module**: Administration complète
12. **Chat Module**: Communication temps réel

### Phase 5: Optimisation & Monitoring (Sprint 9-10)
13. **Performance**: Optimisation et monitoring
14. **Testing**: Tests complets et CI/CD
15. **Documentation**: Documentation technique et utilisateur

---

## Conclusion

Cette organisation modulaire permet:
- **Développement parallèle**: Équipes peuvent travailler sur différents modules simultanément
- **Maintenance facilitée**: Isolation des problèmes et corrections ciblées
- **Scalabilité**: Ajout de nouveaux modules sans impact sur les existants
- **Réutilisation**: Modules partagés optimisés et réutilisables
- **Testing**: Tests isolés et spécialisés par module

Chaque module est conçu comme un mini-projet autonome avec ses propres composants, services, types et tests, tout en s'intégrant harmonieusement dans l'écosystème NOLI Assurance.