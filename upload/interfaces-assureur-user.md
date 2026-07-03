# Interfaces Utilisateur & Assureur — NOLI

---

## 1. Interface Utilisateur (USER)

### 1.1 Layout

```
┌──────────────────────────────────────────────────┐
│  Sidebar (gauche, escamotable)                   │
│  ┌────────────────────────────────────────────┐  │
│  │  Header                                    │  │
│  │  ┌─────────┬──────────────┬────┬────┬────┐ │  │
│  │  │ ☰ menu  │ Titre page   │ 🔔 │ 🌙 │ 👤 │ │  │
│  │  │ mobile  │ [badge Client]│ notif│theme│avtr│ │  │
│  │  └─────────┴──────────────┴────┴────┴────┘ │  │
│  ├────────────────────────────────────────────┘  │
│  │  Contenu de la page (<Outlet />)              │
│  │                                               │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │         Fil d'Ariane                     │  │
│  │  │  Accueil > Tableau de bord > ...         │  │
│  │  └─────────────────────────────────────────┘  │
│  │                                               │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │         Page content                     │  │
│  │  │                                           │  │
│  │  └─────────────────────────────────────────┘  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ChatWidget (flottant, coin inférieur droit)     │
└──────────────────────────────────────────────────┘
```

**Guards** : `AuthGuard requiredRole='USER'`
**Wrapper** : `UserProvider`
**Fichiers** :
- `src/layouts/UserLayout.tsx`
- `src/components/layout/Sidebar.tsx` (mode USER)
- `src/features/chat/components/ChatWidget.tsx`

---

### 1.2 Menu latéral (Sidebar)

| Icône | Libellé | Route |
|-------|---------|-------|
| `LayoutDashboard` | Tableau de bord | `/tableau-de-bord` |
| `FileText` | Mes Devis | `/mes-devis` |
| `Shield` | Mes Contrats | `/mes-contrats` |
| `FolderOpen` | Mes Documents | `/documents` |
| `Star` | Mes Avis | `/mes-avis` |
| `CreditCard` | Paiements | `/paiements` |
| `History` | Historique | `/historique-comparaisons` |
| `Bell` | Notifications | `/notifications` |
| `Users` | Mon Profil | `/profil` |

---

### 1.3 Menu déroulant utilisateur (Header)

| Libellé | Route |
|---------|-------|
| Mon profil | `/profil` |
| Mes Devis | `/mes-devis` |
| Mes Contrats | `/mes-contrats` |
| Paramètres | `/parametres` |
| Déconnexion | — |

---

### 1.4 Vues / Pages

| Route | Page | Description |
|-------|------|-------------|
| `/tableau-de-bord` | `UserDashboardPage` | Vue d'ensemble : devis en cours, contrats actifs, notifications récentes, paiements à venir |
| `/mes-devis` | `UserQuotesPage` | Liste des devis avec statut (en attente, accepté, refusé, expiré) + filtres |
| `/mes-contrats` | `UserPoliciesPage` | Contrats souscrits : détail, avenants, résiliation |
| `/documents` | `DocumentsPage` | Gestion documentaire : attestations, CGV, quittances |
| `/mes-avis` | `MyReviewsPage` | Avis laissés et à donner sur les assureurs |
| `/paiements` | `PaymentsPage` | Historique des paiements, moyens de paiement, échéances |
| `/historique-comparaisons` | `ComparisonHistoryPage` | Comparaisons passées, résultats sauvegardés |
| `/notifications` | `UserNotificationsPage` | Centre de notifications : messages, alertes, rappels |
| `/profil` | `UserProfilePage` | Informations personnelles, véhicules, préférences |
| `/parametres` | `UserSettingsPage` | Paramètres du compte : email, mot de passe, 2FA, langue |

---

### 1.5 Composants spécifiques

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `QuoteCard` | `src/features/user/components/QuoteCard.tsx` | Carte affichant un devis récapitulatif |
| `QuoteFilters` | `src/features/user/components/QuoteFilters.tsx` | Filtres pour la liste des devis |
| `NotificationItem` | `src/features/user/components/NotificationItem.tsx` | Élément de notification individuel |
| `NotificationPreferences` | `src/features/user/components/NotificationPreferences.tsx` | Préférences de notification |
| `NotificationBell` | `src/features/notifications/components/NotificationBell.tsx` | Cloche de notification dans le header |
| `ChatWidget` | `src/features/chat/components/ChatWidget.tsx` | Widget de chat flottant |

### 1.6 Services

| Service | Fichier | Rôle |
|---------|---------|------|
| `quoteService` | `src/features/user/services/quoteService.ts` | Logique métier des devis |
| `policyService` | `src/features/user/services/policyService.ts` | Gestion des contrats |
| `documentService` | `src/features/user/services/documentService.ts` | Gestion documentaire |
| `notificationService` | `src/features/user/services/notificationService.ts` | Notifications utilisateur |
| `reviewService` | `src/features/user/services/reviewService.ts` | Avis utilisateur |

---

## 2. Interface Assureur (INSURER)

### 2.1 Layout

```
┌──────────────────────────────────────────────────┐
│  Sidebar (gauche, escamotable)                   │
│  ┌────────────────────────────────────────────┐  │
│  │  Header                                    │  │
│  │  ┌─────────┬──────────────┬────┬────┬────┐ │  │
│  │  │ ☰ menu  │ Titre page   │ 🔔 │ 🌙 │ 👤 │ │  │
│  │  │ mobile  │[badge Assur.]│ notif│thm│avtr│ │  │
│  │  └─────────┴──────────────┴────┴────┴────┘ │  │
│  ├────────────────────────────────────────────┘  │
│  │  Contenu de la page (<Outlet />)              │
│  │                                               │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │         Fil d'Ariane                     │  │
│  │  │  Accueil > Espace Assureur > ...         │  │
│  │  └─────────────────────────────────────────┘  │
│  │                                               │
│  │  ┌─────────────────────────────────────────┐  │
│  │  │         Page content                     │  │
│  │  │                                           │  │
│  │  └─────────────────────────────────────────┘  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Note** : La page `/assureur/configuration` (onboarding initial) n'a **pas** de layout — elle est rendue en plein écran sans sidebar ni header.

**Guards** : `AuthGuard requiredRole='INSURER'`
**Fichiers** :
- `src/layouts/InsurerLayout.tsx`
- `src/components/layout/Sidebar.tsx` (mode INSURER)

---

### 2.2 Menu latéral (Sidebar)

| Icône | Libellé | Route | Badge |
|-------|---------|-------|-------|
| `LayoutDashboard` | Tableau de bord | `/assureur/tableau-de-bord` | — |
| `Users` | Clients | `/assureur/clients` | — |
| `Shield` | Contrats | `/assureur/contrats` | — |
| `AlertTriangle` | Sinistres | `/assureur/sinistres` | — |
| `Car` | Offres | `/assureur/offres` | — |
| `FileText` | Devis Reçus | `/assureur/devis` | 🔴 nb devis PENDING |
| `BarChart3` | Analytics | `/assureur/analytics` | — |
| `Shield` | Mes Garanties | `/assureur/garanties` | — |
| `Settings` | Paramètres | `/assureur/parametres` | — |

Le badge "Devis Reçus" affiche le nombre de `quote_offers` avec `status = 'PENDING'`, rafraîchi toutes les 60s.

---

### 2.3 Menu déroulant utilisateur (Header)

| Libellé | Route |
|---------|-------|
| Entreprise | `/assureur/parametres` |
| Mon profil | `/assureur/parametres` |
| Paramètres | `/assureur/parametres` |
| Déconnexion | — |

---

### 2.4 Vues / Pages

| Route | Page | Description |
|-------|------|-------------|
| `/assureur/configuration` | `InsurerSetupPage` | **Onboarding** — configuration initiale du compte assureur (infos société, logo, coordonnées). Plein écran, sans layout. |
| `/assureur/tableau-de-bord` | `InsurerDashboardPage` | KPIs : devis reçus (j7, j30), taux de transformation, contrats actifs, chiffre d'affaires, sinistres en cours |
| `/assureur/clients` | `InsurerClientsPage` | Liste des clients avec recherche, filtres, export |
| `/assureur/clients/:clientId` | `InsurerClientDetailsPage` | Fiche client détaillée : contrats, sinistres, historique des échanges |
| `/assureur/contrats` | `InsurerContractsPage` | Gestion des contrats : souscriptions, avenants, résiliations, échéances |
| `/assureur/sinistres` | `InsurerClaimsPage` | Déclarations de sinistres : suivi, traitement, statut |
| `/assureur/offres` | `InsurerOffersPage` | Catalogue d'offres : création, modification, activation/suspension, import CSV |
| `/assureur/devis` | `InsurerQuotesPage` | Devis reçus des clients : acceptation, refus, contre-proposition |
| `/assureur/analytics` | `InsurerAnalyticsPage` | Statistiques avancées : performances, tendances, entonnoir de conversion |
| `/assureur/garanties` | `InsurerGuaranteesPage` | Gestion des garanties proposées : tarification, formules |
| `/assureur/notifications` | `InsurerNotificationsPage` | Centre de notifications et alertes temps réel |
| `/assureur/parametres` | `InsurerSettingsPage` | Paramètres de la société, profil, préférences, API, équipe |

---

### 2.5 Composants spécifiques

| Composant | Fichier | Usage |
|-----------|---------|-------|
| `NotificationSystem` | `src/components/insurer/NotificationSystem.tsx` | Système d'alertes temps réel (abonnement Supabase `insurer_alerts`) |
| `OfferFormModal` | `src/components/insurer/OfferFormModal.tsx` | Modale de création/édition d'offre |
| `CSVImportModal` | `src/components/insurer/CSVImportModal.tsx` | Import en masse d'offres par CSV |
| `InsurerAlertPanel` | `src/features/insurers/components/InsurerAlertPanel.tsx` | Panneau d'alertes assureur |
| `ClientContactPanel` | `src/features/insurers/components/ClientContactPanel.tsx` | Panneau de contact client |
| `CampaignManager` | `src/features/insurers/components/CampaignManager.tsx` | Gestion de campagnes |
| `DetailedAnalyticsDashboard` | `src/features/insurers/components/DetailedAnalyticsDashboard.tsx` | Dashboard analytics avancé |

### 2.6 Services

| Service | Fichier | Rôle |
|---------|---------|------|
| `offerService` | `src/features/insurer/services/offerService.ts` | Gestion des offres |
| `quoteService` | `src/features/insurer/services/quoteService.ts` | Traitement des devis reçus |
| `insurerAlertService` | `src/features/insurers/services/insurerAlertService.ts` | Alertes assureur |
| `clientCommunicationService` | `src/features/insurers/services/clientCommunicationService.ts` | Communication avec les clients |
| `insurerAnalyticsService` | `src/features/insurers/services/insurerAnalyticsService.ts` | Statistiques et analytics |

### 2.7 Hooks

| Hook | Fichier | Usage |
|------|---------|-------|
| `useClientCommunication` | `src/features/insurers/hooks/useClientCommunication.ts` | Gestion de la communication client |

---

## 3. Comparaison visuelle rapide

| Aspect | Utilisateur (USER) | Assureur (INSURER) |
|--------|-------------------|-------------------|
| **Chemin des routes** | `/tableau-de-bord`, `/mes-devis`, ... | `/assureur/tableau-de-bord`, `/assureur/offres`, ... |
| **Badge dans le header** | "Client" | "Assureur" |
| **Salutation** | "Bonjour, {prénom}" | "{nom de la société}" |
| **Widget de chat** | ✅ ChatWidget flottant | ❌ Pas de chat (NotificationSystem) |
| **Notifications** | `NotificationBell` (dropdown simple) | `NotificationSystem` (alertes temps réel avec actions) |
| **Nombre de vues** | 10 | 12 (1 onboarding + 11 avec layout) |
| **Onboarding** | ❌ | ✅ `/assureur/configuration` (plein écran, sans layout) |
| **Menu déroulant** | Liens vers profil, devis, contrats, paramètres | Tout redirige vers `/assureur/parametres` |
| **Filtre commun** | — | Clients, Contrats, Sinistres, Offres, Devis, Analytics |

---

## 4. Flux de navigation

### 4.1 Utilisateur

```
Accueil public
  │
  ├── Authentification (Connexion / Inscription)
  │
  └── [AuthGuard: USER] → UserProvider → UserLayout
        │
        ├── Tableau de bord
        ├── Mes Devis → Détail devis → Acceptation → Paiement → Contrat
        ├── Mes Contrats → Détail contrat → Avenant / Résiliation
        ├── Mes Documents
        ├── Mes Avis
        ├── Paiements
        ├── Historique Comparaisons
        ├── Notifications
        ├── Mon Profil
        └── Paramètres
```

### 4.2 Assureur

```
Accueil public
  │
  ├── Authentification (Connexion)
  │
  ├── [AuthGuard: INSURER]
  │     │
  │     ├── (si première connexion) → /assureur/configuration [plein écran, sans layout]
  │     │
  │     └── InsurerLayout
  │           │
  │           ├── Tableau de bord
  │           ├── Clients → Fiche client
  │           ├── Contrats
  │           ├── Sinistres
  │           ├── Offres → Création / Import CSV
  │           ├── Devis Reçus → Acceptation / Refus / Contre-proposition
  │           ├── Analytics
  │           ├── Mes Garanties
  │           ├── Notifications
  │           └── Paramètres
  │
  └── NotificationSystem (alertes temps réel sur toutes les pages)
```

---

## 5. Architecture des guards

```
App.tsx
  │
  ├── <Routes>
  │     ├── <Route element={<PublicLayout />}>
  │     │     ├── /, /a-propos, /contact
  │     │
  │     ├── <Route element={<AuthGuard requiredRole='USER' />}>
  │     │     └── <Route element={<UserProvider><UserLayout /></UserProvider>}>
  │     │           ├── /tableau-de-bord
  │     │           ├── /mes-devis, /mes-contrats, /documents, ...
  │     │           └── /profil, /parametres
  │     │
  │     ├── <Route element={<AuthGuard requiredRole='INSURER' />}>
  │     │     ├── /assureur/configuration  (no layout)
  │     │     └── <Route element={<InsurerLayout />}>
  │     │           ├── /assureur/tableau-de-bord
  │     │           ├── /assureur/offres, /assureur/devis, ...
  │     │           └── /assureur/parametres
  │     │
  │     └── <Route element={<AuthGuard requiredRole='ADMIN' />}>
  │           └── <Route element={<AdminLayout />}>
  │                 ├── /admin/tableau-de-bord
  │                 └── ...
```
