# Audit Technique — NOLI Assurance

**Date :** Juillet 2026  
**Projet :** NOLI — Comparateur d'assurances en Côte d'Ivoire  
**Stack :** Next.js 16 (App Router), TypeScript, Prisma (SQLite), Tailwind CSS, Zustand, shadcn/ui, Vitest

---

## 1. Vue d'ensemble

NOLI est une application web de comparaison d'assurances avec 3 interfaces distinctes :

| Interface | Rôle | Accès |
|-----------|------|-------|
| **Parcours utilisateur** | Comparaison, résultats, devis | Public / USER |
| **Dashboard assureur** | Gestion des offres, garanties, devis reçus | INSURER |
| **Panel administrateur** | Configuration complète (11 onglets) | ADMIN |

### 1.1 Base de données (Prisma / SQLite)

21 modèles : `Profile`, `Insurer`, `InsurerAccount`, `InsuranceCategory`, `CoverageCategory`, `Coverage`, `CoverageTariffRule`, `InsuranceOffer`, `InsurancePackage`, `PackageCoverage`, `Quote`, `QuoteCoverage`, `SystemSetting`, `AuditLog`, `Backup`, `Notification`, `Role`, `Permission`, `RolePermission`, `ProfileRole`, + modèles supplémentaires (`Guarantee`, `Offer`, `OfferGuarantee`, `GuaranteeCategory`).

> **⚠️ Note :** Les modèles `Guarantee`, `Offer`, `OfferGuarantee`, `GuaranteeCategory` ne figurent pas dans `schema.prisma` mais sont utilisés dans les routes API et via `db.*`. Ils semblent avoir été ajoutés directement en base sans mise à jour du schéma Prisma.

---

## 2. Architecture Frontend

### 2.1 Arborescence composants

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Routing central (11 vues via AppView)
│   ├── layout.tsx          # Layout racine (polices, metadata)
│   ├── globals.css         # Variables CSS (thème clair/sombre)
│   └── api/                # 40+ routes API (route handlers)
├── components/
│   ├── ui/                 # 45 composants shadcn/ui réutilisables
│   ├── landing/            # Page d'accueil
│   ├── comparison/         # Formulaire de comparaison (3 étapes)
│   ├── results/            # Page résultats + modale de comparaison
│   ├── auth/               # Pages de connexion/inscription
│   ├── layout/             # Header, footer
│   ├── admin/              # 14 onglets d'administration
│   ├── insurer/            # Dashboard assureur (9 onglets)
│   ├── user/               # Dashboard utilisateur (10 onglets)
│   ├── offers/             # Catalogue d'offres public
│   ├── dashboard/          # Dashboard utilisateur simplifié
│   ├── profile/            # Page de profil
│   ├── contact/            # Page contact
│   ├── about/              # Page à propos
│   └── shared/             # Composants partagés (notification, theme, star)
├── lib/                    # Logique métier
│   ├── compare-service.ts  # Moteur de comparaison
│   ├── pricing-service.ts  # Moteur de tarification (4 méthodes)
│   ├── validation.ts       # Schémas Zod
│   ├── utils.ts            # Fonctions utilitaires
│   ├── constants.ts        # Constantes (options, seuils)
│   ├── auth-guard.ts       # Middleware d'authentification
│   ├── notifications.ts    # Helpers de notification
│   └── db.ts               # Client Prisma singleton
├── store/
│   └── app-store.ts        # État global Zustand (20+ propriétés)
├── hooks/
│   ├── use-toast.ts        # Hook toast shadcn
│   └── use-mobile.ts       # Hook détection mobile
└── types/
    └── index.ts            # Types TypeScript partagés
```

### 2.2 État global (Zustand)

Le store central (`app-store.ts`) gère :

- **Navigation :** `currentView`, `setView()`
- **Auth :** `user`, `authModal`, `setUser()`
- **Formulaire :** `personalInfo`, `vehicleInfo`, `coverageNeeds` (3 étapes)
- **Résultats :** `comparisonResults`, `offersToCompare`, `comparisonModalOpen`
- **Navigation interne :** `adminTab`, `userTab`, `insurerTab`

**Forces :** Store unique simple, bien typé, actions claires.  
**Faiblesses :** Pas de persistance (perte d'état au refresh), pas de séparation par domaine.

### 2.3 Routage

Le routage est centralisé dans `src/app/page.tsx` via un switch-case sur `currentView` (type `AppView`) :

```typescript
// 11 vues possibles
type AppView = "landing" | "offers" | "compare" | "results" | "about" 
  | "contact" | "admin" | "user-dashboard" | "insurer-dashboard" 
  | "login" | "register" | "forgot";
```

**Forces :** Simple, pas besoin de React Router, animations de transition entre vues.  
**Faiblesses :** Pas d'URL profonde (pas de partage de lien par vue), pas de SSR pour les pages.

### 2.4 Thème (clair/sombre)

- Implémentation via `next-themes` avec `ThemeProvider`
- Variables CSS dans `globals.css` avec `@custom-variant dark`
- Swap des couleurs `--primary` (teal) et `--accent` (lime) selon le thème
- Toggle accessible dans les 3 layouts (admin, assureur, utilisateur)

---

## 3. Architecture Backend

### 3.1 Routes API (40+ endpoints)

| Groupe | Routes | Description |
|--------|--------|-------------|
| **Auth** | `POST /api/auth` | Login, register, forgot password (bcrypt) |
| **Compare** | `POST /api/compare` | Moteur de comparaison principal |
| **Offres** | `GET /api/offers` | Catalogue public avec filtres |
| **Devis** | `GET /api/quotes` | Liste des devis |
| **Admin** | `30+ routes sous /api/admin/*` | CRUD complet pour tous les modèles |
| **Assureur** | `10+ routes sous /api/insurer/*` | CRUD pour les assureurs |
| **Utilisateur** | `GET/PUT /api/user/*` | Profil et devis |
| **Notifications** | `GET/PUT /api/notifications` | Système de notifications |

### 3.2 Moteur de comparaison (`compare-service.ts`)

Le cœur métier suit cet algorithme :

1. **Récupération** des offres actives (`InsuranceOffer`) et des garanties (`Coverage`)
2. **Filtrage** par éligibilité véhicule (`isVehicleEligible`)
3. **Matching** des catégories de garanties via mots-clés (`matchCategories`)
4. **Tarification** garantie par garantie (`calculateGuaranteePremium`) — 4 méthodes
5. **Calcul** de la prime nette (moins 5% + 2500 FCFA)
6. **Scoring** (7 critères, 0-200+ pts)
7. **Tri** par score descendant, puis prix ascendant

### 3.3 Moteur de tarification (`pricing-service.ts`)

4 méthodes de calcul :

| Méthode | Description | Formule |
|---------|-------------|---------|
| `FREE` | Gratuit | Prime = 0 FCFA |
| `FIXED_AMOUNT` | Montant fixe | Prime = `fixedAmount` (ou `packPriceReduced`) |
| `VARIABLE_BASED` | Taux sur variable | Prime = `variableValue × (ratePercent / 100)` |
| `MATRIX_BASED` | Grille tarifaire | Lookup dans grille (PF, carburant, formule...) |

### 3.4 Authentification

- **Hash :** bcryptjs
- **Rôles :** `USER`, `INSURER`, `ADMIN` (sur le modèle `Profile`)
- **Rôles personnalisés :** Système avancé avec permissions (34 permissions, 9 catégories)
- **Session :** Stockée côté client via Zustand (userId dans le store)
- **Comptes test :** admin@noli.ci, user@test.ci, assureur@saham.ci

---

## 4. Analyse des Problèmes Corrigés

### 4.1 P1 — Affichage après création en BO (✓ Corrigé)

**Problème :** Après création d'un assureur/offre/garantie, les éléments n'apparaissaient pas dans le parcours comparaison.

**Causes racines :**
1. Le champ `features` des offres était vide (`"[]"` par défaut), empêchant le matching de catégories
2. Les garanties créées via l'admin (`Guarantee`) n'étaient pas utilisées par le service de comparaison (qui lit `Coverage`)
3. Aucun mécanisme de synchronisation entre les modèles

**Correctifs appliqués :**
- Auto-population des `features` à la création d'offre selon le type de couverture
- Synchronisation des `features` de `InsuranceOffer` lors de la sauvegarde des liens garanties
- Fallback amélioré dans `matchCategories` (recherche aussi dans le nom/description de l'offre)

### 4.2 P2 — Bouton Modifier garanties (✓ Corrigé)

Ajout d'un bouton « Modifier » visible sur chaque ligne du tableau desktop, en plus du menu dropdown existant.

### 4.3 P3 — Améliorations UI (✓ Corrigé)

- Cartes landing : fond blanc, bordures, effets hover
- Catégories de garanties (formulaire étape 3) : meilleur contraste, transitions
- Modale de comparaison : en-têtes avec dégradé, badges de comptage, hover sur lignes
- Bouton X de fermeture : utilisation du bouton par défaut de Radix UI

### 4.4 P4 — Messages utilisateur (✓ Déjà correct)

Les messages de toast pour « Obtenir le devis » et « Être rappelé » étaient déjà conformes aux exigences.

---

## 5. Métriques et Statistiques

| Métrique | Valeur |
|----------|--------|
| **Composants React** | ~85 (dont 45 UI shadcn) |
| **Routes API** | ~45 |
| **Modèles Prisma** | 21+ |
| **Tests unitaires** | 6 fichiers, ~90 tests |
| **Couverture tests** | Utils, Pricing, Validation, Auth, StarRating, Theme |
| **Pages/Vues** | 11 (landing → admin) |
| **Onglets admin** | 11 |
| **Onglets assureur** | 9 |
| **Onglets utilisateur** | 10 |
| **Langue** | 100% français (UI + messages) |
| **Devise** | FCFA (format `Intl.NumberFormat('fr-FR')`) |

---

## 6. Recommandations

### 🔴 Critique

1. **Modèles manquants dans schema.prisma** — `db.guarantee`, `db.offer`, `db.offerGuarantee`, `db.guaranteeCategory` sont utilisés dans les routes API mais absents du schéma Prisma. Exécuter `prisma db pull` pour régénérer le schéma.

2. **Authentification sans JWT** — L'identification repose sur un `userId` passé en header/en-tête. À remplacer par des tokens JWT sécurisés.

### 🟡 Important

3. **Cache et rafraîchissement** — Les résultats de comparaison (`comparisonResults`) sont stockés dans le store Zustand sans mécanisme d'invalidation. Ajouter un timestamp ou un cache-buster.

4. **Tests de couverture** — Seuls les services utilitaires ont des tests. Ajouter des tests pour :
   - `compare-service.ts` (logique métier critique)
   - `compare/route.ts` (API endpoint)
   - `notifications.ts` (système de notification)

5. **Gestion d'erreurs API** — Certaines routes n'ont pas de try/catch cohérent. Standardiser le format de réponse d'erreur.

### 🟢 Amélioration

6. **Persistance Zustand** — Utiliser `zustand/middleware` avec `persist` pour éviter la perte d'état au refresh.

7. **Séparation du store** — Diviser `app-store.ts` en stores spécialisés (auth, comparison, ui, notifications).

8. **Tests de composants** — Ajouter des tests pour les composants critiques :
   - `comparison-form.tsx` (formulaire 3 étapes)
   - `results-page.tsx` (filtres, tri, comparaison)
   - `admin/garanties-tab.tsx` (CRUD garanties)

9. **Accessibilité** — Ajouter `aria-label` et rôles ARIA sur les composants interactifs personnalisés.

10. **Documentation API** — Ajouter des commentaires JSDoc sur les endpoints API et les fonctions exportées.

---

## 7. Flux de Données Critique

```
Utilisateur                    Backend                       Base de données
    │                            │                                │
    ├─ Remplir formulaire ──────►│                                │
    │   (3 étapes)               │                                │
    │                            ├─ POST /api/compare ──────────► │
    │                            │   personalInfo                 │
    │                            │   vehicleInfo                  │
    │                            │   coverageNeeds                │
    │                            │                                │
    │                            │◄── InsuranceOffer[] ──────────│
    │                            │    Coverage[]                  │
    │                            │                                │
    │                            ├─ Filtrer par éligibilité      │
    │                            ├─ Matcher catégories           │
    │                            ├─ Calculer tarifs              │
    │                            ├─ Score + tri                  │
    │                            │                                │
    │◄── Résultats + offres ─────┤                                │
    │                            │                                │
    ├─ Choisir offre ──────────► ├─ Créer devis ───────────────► │
    │   "Obtenir le devis"       │   Notification                │
    │                            │                                │
```

---

## 8. Audit des Interfaces par Acteur

### 8.1 Parcours Public / Visiteur

L'interface publique est accessible sans authentification et couvre le parcours de découverte jusqu'à la demande de devis.

| Page/Vue | Composant | API utilisée | État |
|----------|-----------|-------------|------|
| **Accueil** (landing) | `landing-page.tsx` | — (statique) | ✅ Fonctionnel |
| **Catalogue offres** (offers) | `offers-page.tsx` | `GET /api/offers` | ✅ Fonctionnel |
| **Comparaison étape 1** (compare) | `comparison-form.tsx` (Step1) | — | ✅ Fonctionnel |
| **Comparaison étape 2** (compare) | `comparison-form.tsx` (Step2) | — | ✅ Fonctionnel |
| **Comparaison étape 3** (compare) | `comparison-form.tsx` (Step3) | `GET /api/coverage-categories` | ✅ Fonctionnel |
| **Résultats comparaison** (results) | `results-page.tsx` | `POST /api/compare` | ✅ Fonctionnel |
| **Modale comparateur** | `ComparisonModal` | — | ✅ Corrigé (P3) |
| **Connexion** (login) | `auth-pages.tsx` (LoginPage) | `POST /api/auth` | ✅ Fonctionnel |
| **Inscription** (register) | `auth-pages.tsx` (RegisterPage) | `POST /api/auth` | ✅ Fonctionnel |
| **Mot de passe oublié** (forgot) | `auth-pages.tsx` (ForgotPasswordPage) | `POST /api/auth` | ✅ Fonctionnel |
| **À propos** (about) | `about-page.tsx` | — | ✅ Fonctionnel |
| **Contact** (contact) | `contact-page.tsx` | — | ✅ Fonctionnel |
| **Header** | `header.tsx` | — | ✅ Fonctionnel |
| **Footer** | `footer.tsx` | — | ✅ Fonctionnel |

**Flux utilisateur public type :**
```
Landing → Comparaison (3 étapes) → Résultats → Devis → Login (si pas connecté)
   ↓                                                        ↓
Catalogue offres ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←      Dashboard USER
```

**Points d'attention :**
- Les 6 cartes d'assurance sur la landing utilisent des données statiques. Seule « Assurance Auto » est cliquable (les autres affichent « Bientôt »)
- Le formulaire de comparaison en 3 étapes est connecté à l'API pour les catégories (étape 3) et la comparaison (POST /api/compare)
- Les messages toast pour « Obtenir le devis » et « Être rappelé » sont corrects ✅
- La modale de comparaison a été corrigée pour le bouton X ✅

---

### 8.2 Interface Utilisateur (USER) — « Mon Espace »

**Layout :** `user-layout.tsx` — Sidebar escamotable (10 items) + header bar + breadcrumb

#### 8.2.1 Onglets Connectés à l'API

| Onglet | Composant | API | Données | Statut |
|--------|-----------|-----|---------|--------|
| **Tableau de bord** | `user-dashboard-tab.tsx` | `GET /api/quotes` | Stats (devis en cours, contrats actifs), 3 derniers devis | ✅ Connecté |
| **Mes Devis** | `user-quotes-tab.tsx` | `GET /api/quotes` | Liste des devis avec filtres statut (Tous/Brouillon/En attente/Approuvé/Rejeté) | ✅ Connecté |
| **Notifications** | `user-notifications-tab.tsx` | `GET /api/notifications`, `PUT /api/notifications/[id]`, `PUT /api/notifications/read-all` | Liste notifications, marquer lu, tout marquer lu | ✅ Connecté |
| **Mon Profil** | `user-profile-tab.tsx` | `GET /api/user/profile`, `PUT /api/user/profile` | Infos perso (modification), changement mot de passe | ✅ Connecté |
| **Paramètres** | `user-settings-tab.tsx` | `PUT /api/user/profile` | Thème (clair/sombre/système), langue, notification email, changement mot de passe, zone danger | ✅ Connecté |

#### 8.2.2 Onglets « Placeholder » (statiques)

| Onglet | Composant | Contenu | Statut |
|--------|-----------|---------|--------|
| **Mes Contrats** | `user-contracts-tab.tsx` | Message « Aucun contrat souscrit » + CTA vers comparaison | ⏳ Placeholder |
| **Mes Documents** | `user-documents-tab.tsx` | 3 cartes info (Attestations, CGV, Quittances) | ⏳ Placeholder |
| **Mes Avis** | `user-reviews-tab.tsx` | Message « Aucun avis » + exemple d'avis statique avec étoiles | ⏳ Placeholder |
| **Paiements** | `user-payments-tab.tsx` | 4 cartes moyens de paiement (Mobile Money, Wave, Orange, CB) | ⏳ Placeholder |
| **Historique** | `user-history-tab.tsx` | Message « Aucun historique de comparaison » | ⏳ Placeholder |

**Fonctionnalités clés :**
- **Notifications temps réel :** Cloche avec compteur de notifications non lues dans le header
- **Dropdown utilisateur :** Accès rapide au profil, devis, contrats, paramètres, déconnexion
- **Thème :** Sélecteur Sun/Moon/Monitor synchronisé avec next-themes
- **Navigation :** Breadcrumb (Accueil > {onglet}) + retour au site depuis la sidebar
- **Responsive :** Sidebar cachée sur mobile, remplacée par un Sheet hamburger

**Points d'attention :**
- 5 onglets sur 10 sont des placeholders — pas de données réelles (contrats, documents, avis, paiements, historique)
- Le changement de mot de passe est fonctionnel via `PUT /api/user/profile`
- La suppression de compte (zone danger dans paramètres) affiche un toast « non disponible »
- Le profil utilise l'email depuis le store (non modifiable car pas de endpoint)

---

### 8.3 Interface Assureur (INSURER) — « Espace Assureur »

**Layout :** `insurer-layout.tsx` — Sidebar escamotable (9 items) + header bar + breadcrumb + badge « Assureur »

#### 8.3.1 Onglets avec CRUD Complet

| Onglet | Composant | API | Fonctionnalités | Statut |
|--------|-----------|-----|-----------------|--------|
| **Tableau de bord** | `insurer-dashboard-tab.tsx` | `GET /api/insurer/stats` | 6 KPIs (devis 7j/30j, taux transformation, contrats actifs, CA, sinistres), 5 derniers devis | ✅ Connecté |
| **Mes Offres** | `insurer-offers-tab.tsx` | `GET /api/insurer/offers`, `POST`, `PUT`, `DELETE` | Grille responsive, créer/modifier/supprimer (soft-delete) avec formulaire complet + éligibilité véhicule + garanties par catégorie | ✅ CRUD complet |
| **Mes Garanties** | `insurer-guarantees-tab.tsx` | `GET /api/insurer/coverages`, `POST`, `PUT`, `DELETE` | Tableau avec code/nom/catégorie/type calcul/statut, assistant 3 étapes (4 méthodes), | ✅ CRUD complet |
| **Devis Reçus** | `insurer-quotes-tab.tsx` | `GET /api/quotes` | Filtres statut (Tous/Brouillon/En attente/Approuvé/Rejeté), badges colorés, actions accepter/refuser/contre-proposition | ✅ Connecté |

#### 8.3.2 Onglets avec données réelles (lecture seule)

| Onglet | Composant | API | Contenu | Statut |
|--------|-----------|-----|---------|--------|
| **Analytiques** | `insurer-analytics-tab.tsx` | `GET /api/insurer/stats` | 4 métriques (total devis, taux acceptation, revenu moyen, clients uniques) + 3 graphiques (placeholders) | ⏳ Placeholder graphiques |
| **Clients** | `insurer-clients-tab.tsx` | — (statique) | Barre de recherche + tableau (en-têtes seulement) | ⏳ Placeholder |

#### 8.3.3 Onglets Placeholder

| Onglet | Composant | Contenu | Statut |
|--------|-----------|---------|--------|
| **Contrats** | `insurer-contracts-tab.tsx` | Bannière info + en-têtes tableau | ⏳ Placeholder |
| **Sinistres** | `insurer-claims-tab.tsx` | Bannière info ambre + en-têtes tableau | ⏳ Placeholder |
| **Paramètres** | `insurer-settings-tab.tsx` | Logo upload (fonctionnel), infos société, profil, changement mot de passe, équipe (placeholder) | 🔶 Partiel |

**Fonctionnalités clés :**
- **CRUD offres :** Création avec formulaire complet (type contrat, prix min/max, capital, franchise, éligibilité véhicule par accordéon)
- **CRUD garanties :** Assistant 3 étapes avec 4 méthodes de calcul (FREE, FIXED_AMOUNT, VARIABLE_BASED, MATRIX_BASED)
- **Logo upload :** Upload d'image (PNG/JPG/WebP/SVG, max 2MB) via `/api/insurer/logo`
- **Notifications :** Cloche avec notifications de devis reçus
- **Badge « Assureur » :** Identifiant visuel dans le header

**Points d'attention :**
- 3 onglets sur 9 sont des placeholders (contrats, sinistres, partie de paramètres)
- Les graphiques analytiques sont des placeholders (boîtes grises avec labels)
- La gestion d'équipe dans paramètres est un placeholder
- Le CRUD garanties est très complet avec 4 méthodes de calcul

---

### 8.4 Interface Administrateur (ADMIN) — « Administration »

**Layout :** `admin-page.tsx` — Sidebar 11 items + header bar + breadcrumb + dropdown admin

#### 8.4.1 Onglets de Configuration

| Onglet | Composant | Modèle | API | Fonctionnalités | Statut |
|--------|-----------|--------|-----|-----------------|--------|
| **Tableau de bord** | `dashboard-tab.tsx` | — | `GET /api/admin/stats` | Statistiques générales (assureurs, offres, garanties, utilisateurs, devis), 5 devis récents | ✅ Connecté |
| **Assureurs** | `assureurs-tab.tsx` | Insurer | `CRUD /api/admin/insurers` | Créer/modifier/supprimer, liste avec stats | ✅ CRUD complet |
| **Catégories Produits** | `categories-tab.tsx` | InsuranceCategory | `CRUD /api/admin/insurance-categories` | Gestion des catégories (Auto, Moto, Santé...) | ✅ CRUD complet |
| **Offres** | `offres-tab.tsx` | InsuranceOffer | `CRUD /api/admin/offers` | Créer/modifier avec garanties par checkbox + éligibilité véhicule | ✅ CRUD complet |
| **Cat. Garanties** | `coverage-categories-tab.tsx` | CoverageCategory | `CRUD /api/admin/coverage-categories` | Catégories de garanties (RC, Incendie, Vol...) | ✅ CRUD complet |
| **Garanties** | `garanties-tab.tsx` | Guarantee | `CRUD /api/admin/guarantees` | Assistant 3 étapes (4 méthodes calcul), bouton Modifier visible (P2) ✅ | ✅ CRUD complet |
| **Couvertures** | `coverages-tab.tsx` | Coverage | `CRUD /api/admin/coverages` + tarif-rules | Gestion complète avec règles de tarification | ✅ CRUD complet |
| **Devis** | `devis-tab.tsx` | Quote | `GET /api/admin/quotes`, `PUT` | Consultation, mise à jour statut, prix final, notes | ✅ Connecté |

#### 8.4.2 Onglets Système

| Onglet | Composant | Modèle | API | Fonctionnalités | Statut |
|--------|-----------|--------|-----|-----------------|--------|
| **Journaux d'audit** | `audit-logs-tab.tsx` | AuditLog | `GET /api/admin/audit-logs` | Filtres (action, entité, dates), tableau paginé, mobile cards | ✅ Connecté |
| **Sauvegardes** | `backups-tab.tsx` | Backup | `CRUD /api/admin/backups` | Création manuelle, planification, restauration, suppression | ✅ Connecté |
| **Rôles & Permissions** | `roles-tab.tsx` | Role, Permission | `CRUD /api/admin/roles` + `/api/admin/permissions` | 3 rôles par défaut (ADMIN 34 perm, INSURER 8, USER 3), rôles personnalisés | ✅ Connecté |
| **Paramètres** | `settings-tab.tsx` | SystemSetting | `GET/PUT /api/admin/settings` | 7 sous-onglets (Général, Email, Utilisateurs, Sécurité, Notifications, Apparence, Comptes) | ✅ Connecté |

**Fonctionnalités clés :**
- **Audit logging :** Toutes les opérations CRUD créent des entrées dans AuditLog
- **Permissions :** 34 permissions réparties dans 9 catégories, 3 rôles par défaut
- **Backups :** Sauvegarde manuelle (copie fichier SQLite), planification cron, restauration
- **Paramètres :** 25+ paramètres répartis dans 5 catégories (Général, Email, Sécurité, Notifications, Apparence)
- **Logo upload :** Upload par assureur

**Points d'attention :**
- 11 onglets tous fonctionnels — c'est l'interface la plus complète
- Les modèles `Guarantee`, `Offer`, `OfferGuarantee`, `GuaranteeCategory` ne sont pas dans `schema.prisma` mais sont utilisés
- Les journaux d'audit et les sauvegardes sont pleinement opérationnels
- La suppression est gérée via AlertDialog de confirmation partout

---

## 9. Synthèse des Interfaces

| Critère | Public | USER | INSURER | ADMIN |
|---------|--------|------|---------|-------|
| **Composants** | ~12 | 11 (layout + 10 tabs) | 10 (layout + 9 tabs) | 15 (layout + 14 tabs) |
| **Onglets fonctionnels** | 12/12 | 5/10 | 5/9 | 11/11 |
| **Placeholders** | 0 | 5 | 3 | 0 |
| **Routes API dédiées** | 2 | 4 | 10 | 30+ |
| **CRUD complet** | — | — | Offres, Garanties | Tout |
| **Notifications** | — | ✅ | ✅ | ✅ |
| **Thème sombre** | ✅ | ✅ | ✅ | ✅ |
| **Responsive mobile** | ✅ | ✅ | ✅ | ✅ |
| **Tests unitaires** | → Validation, Auth | → Validation, Auth | — | — |

### Légende
- ✅ = Fonctionnel / Implémenté
- ⏳ = Placeholder / En attente de développement
- 🔶 = Partiellement fonctionnel
- — = Non applicable / Non implémenté

---

*Audit généré le 5 juillet 2026 — Projet NOLI Assurance — Audit complet des 4 interfaces (Public, USER, INSURER, ADMIN)*
