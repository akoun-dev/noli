# Audit Technique — NOLI Assurance

**Date :** 15 Juillet 2026  
**Projet :** NOLI — Comparateur d'assurances en Côte d'Ivoire  
**Stack :** Next.js 16 (App Router), TypeScript, Prisma (SQLite), Tailwind CSS, Zustand, shadcn/ui, Vitest  
**Version :** 2.0.0

---

## 1. Vue d'ensemble

NOLI est une application web de comparaison d'assurances avec 3 interfaces distinctes :

| Interface | Rôle | Accès |
|-----------|------|-------|
| **Parcours utilisateur** | Comparaison, résultats, devis | Public / USER |
| **Dashboard assureur** | Gestion des offres, garanties, devis reçus (9 onglets) | INSURER |
| **Panel administrateur** | Configuration complète (11 onglets) | ADMIN |

### 1.1 Base de données (Prisma / SQLite)

**Base :** `prisma/prisma/dev.db` — SQLite  
**Taille :** ~230 Ko  
**Modèles Prisma :** 21 modèles dans `schema.prisma`

#### Comptes et Profils

| Type | Email | Rôle |
|------|-------|------|
| Admin | `admin@noli.ci` | ADMIN |
| Utilisateur test | `user@test.ci` | USER |
| Assureur test | `assureur@saham.ci` | INSURER |

#### Statistiques de la base

| Entité | Compte | Notes |
|--------|--------|-------|
| **Profiles** | 3 | 1 USER, 1 INSURER, 1 ADMIN |
| **Insurers** | 1 | SAHAM Assurances (uniquement) |
| **InsurerAccounts** | 0 | Plus aucune liaison (assureur supprimé via inscription directe) |
| **InsuranceCategories** | 1 | Catégorie produit |
| **CoverageCategories** | 12 | Catégories de garanties |
| **Coverages** | 0 | Aucune garantie en base |
| **CoverageTariffRules** | 0 | Aucune règle de tarification |
| **InsuranceOffers** | 0 | Aucune offre |
| **Packages** | 4 | Packs prédéfinis |
| **PackageCoverages** | 0 | Aucun lien pack-garantie |
| **Quotes** | 0 | Aucun devis |
| **Notifications** | 0 | Aucune notification |
| **AuditLogs** | 5 | Suppressions d'anciens assureurs/offres |
| **SystemSettings** | 29 | Configuration système |
| **Roles** | 3 | ADMIN (34 perm), INSURER (8 perm), USER (3 perm) |
| **Permissions** | 34 | Réparties dans 9 catégories |
| **RolePermissions** | 45 | Liens rôles-permissions |
| **ProfileRoles** | 0 | Aucun rôle personnalisé attribué |
| **Backups** | 0 | Aucune sauvegarde effectuée |
| **Sessions** | 0 | Aucune session active |

> ⚠️ **Alerte :** La base est quasi vide. Seul l'assureur SAHAM existe, mais il n'a ni offres, ni garanties, ni devis. Le seed est nécessaire pour le développement.

---

## 2. Métriques du Code

| Métrique | Valeur |
|----------|--------|
| **Composants React** | 130 (dont 48 UI shadcn) |
| **Routes API** | 63 |
| **Modules lib** | 13 |
| **Fichiers de test** | 31 |
| **Tests unitaires** | 334 (tous passants ✅) |
| **Erreurs TypeScript** | 53 |
| **Fichiers modifiés non commit** | 8 |
| **Lignes ajoutées (non commit)** | ~1 266 |
| **Lignes supprimées (non commit)** | ~477 |

### 2.1 Arborescence des composants

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Routing central (12 vues via AppView)
│   ├── layout.tsx          # Layout racine
│   ├── globals.css         # Variables CSS (clair/sombre)
│   └── api/                # 63 routes API
├── components/
│   ├── ui/                 # 48 composants shadcn/ui
│   ├── admin/              # 14 onglets d'administration
│   │   ├── admin-page.tsx         # Layout admin (sidebar 11 items)
│   │   └── *.tsx                  # 13 onglets
│   ├── insurer/            # Dashboard assureur (10 fichiers)
│   │   ├── insurer-layout.tsx     # Layout assureur (sidebar 9 items)
│   │   └── tabs/                  # 9 onglets
│   ├── user/               # Dashboard utilisateur (12 fichiers)
│   │   ├── user-layout.tsx        # Layout utilisateur (sidebar 10 items)
│   │   └── tabs/                  # 10 onglets
│   ├── auth/               # Connexion/Inscription (wizard 3-4 étapes)
│   ├── landing/            # Page d'accueil
│   ├── comparison/         # Formulaire comparaison (3 étapes)
│   ├── results/            # Résultats + modale comparaison
│   ├── layout/             # Header, footer
│   ├── shared/             # Notification, theme, star rating
│   └── ...                 # Contact, About, Offers, Profile, Dashboard
├── lib/                    # Logique métier
├── store/                  # Zustand (état global)
├── hooks/                  # use-toast, use-mobile
└── types/                  # Types partagés
```

---

## 3. État des Interfaces

### 3.1 Parcours Public (12/12 fonctionnels ✅)

| Page | Composant | Statut |
|------|-----------|--------|
| Accueil | `landing-page.tsx` | ✅ Fonctionnel |
| Catalogue offres | `offers-page.tsx` | ✅ Fonctionnel |
| Comparaison (3 étapes) | `comparison-form.tsx` | ✅ Connecté API |
| Résultats | `results-page.tsx` | ✅ Connecté API |
| Modale comparaison | `ComparisonModal` | ✅ Corrigé |
| Connexion | `auth-pages.tsx` (LoginPage) | ✅ Fonctionnel |
| Inscription (wizard 4 étapes) | `auth-pages.tsx` (RegisterPage) | ✅ Fonctionnel |
| Mot de passe oublié | `auth-pages.tsx` (ForgotPasswordPage) | ✅ Fonctionnel |
| À propos | `about-page.tsx` | ✅ Statique |
| Contact | `contact-page.tsx` | ✅ Statique |
| Header | `header.tsx` | ✅ Fonctionnel |
| Footer | `footer.tsx` | ✅ Statique |

### 3.2 Interface Utilisateur (5/10 fonctionnels, 5 placeholders)

| Onglet | Composant | Statut |
|--------|-----------|--------|
| **Tableau de bord** | `user-dashboard-tab.tsx` | ✅ API connectée |
| **Mes Devis** | `user-quotes-tab.tsx` | ✅ API connectée |
| **Notifications** | `user-notifications-tab.tsx` | ✅ API connectée |
| **Mon Profil** | `user-profile-tab.tsx` | ✅ CRUD complet |
| **Paramètres** | `user-settings-tab.tsx` | ✅ API connectée |
| Mes Contrats | `user-contracts-tab.tsx` | ⏳ Placeholder |
| Mes Documents | `user-documents-tab.tsx` | ⏳ Placeholder |
| Mes Avis | `user-reviews-tab.tsx` | ⏳ Placeholder |
| Paiements | `user-payments-tab.tsx` | ⏳ Placeholder |
| Historique | `user-history-tab.tsx` | ⏳ Placeholder |

### 3.3 Interface Assureur (5/9 fonctionnels, 3 placeholders)

| Onglet | Composant | Statut |
|--------|-----------|--------|
| **Tableau de bord** | `insurer-dashboard-tab.tsx` | ✅ Stats réelles |
| **Mes Offres** | `insurer-offers-tab.tsx` | ✅ CRUD complet |
| **Mes Garanties** | `insurer-guarantees-tab.tsx` | ✅ CRUD complet |
| **Devis Reçus** | `insurer-quotes-tab.tsx` | ✅ Connecté |
| **Paramètres** | `insurer-settings-tab.tsx` | 🔶 Partiel (logo OK, équipe placeholder) |
| Analytiques | `insurer-analytics-tab.tsx` | ⏳ Graphiques placeholders |
| Clients | `insurer-clients-tab.tsx` | ⏳ Placeholder |
| Contrats | `insurer-contracts-tab.tsx` | ⏳ Placeholder |
| Sinistres | `insurer-claims-tab.tsx` | ⏳ Placeholder |

### 3.4 Interface Administrateur (11/11 fonctionnels ✅)

| Onglet | Composant | Statut |
|--------|-----------|--------|
| Tableau de bord | `dashboard-tab.tsx` | ✅ Stats réelles |
| Assureurs | `assureurs-tab.tsx` | ✅ CRUD complet |
| Catégories Produits | `categories-tab.tsx` | ✅ CRUD complet |
| Offres | `offres-tab.tsx` | ✅ CRUD complet |
| Cat. Garanties | `coverage-categories-tab.tsx` | ✅ CRUD complet |
| Garanties | `garanties-tab.tsx` | ✅ CRUD complet (3 étapes) |
| Couvertures | `coverages-tab.tsx` | ✅ CRUD complet |
| Devis | `devis-tab.tsx` | ✅ Connecté |
| Journaux d'audit | `audit-logs-tab.tsx` | ✅ Connecté |
| Sauvegardes | `backups-tab.tsx` | ✅ CRUD complet |
| Rôles & Permissions | `roles-tab.tsx` | ✅ CRUD complet |
| Paramètres (7 sous-onglets) | `settings-tab.tsx` | ✅ Connecté |

---

## 4. Analyse des Erreurs TypeScript (53 erreurs)

### 4.1 Erreurs par catégorie

| Catégorie | Nombre | Détail |
|-----------|--------|--------|
| **Module introuvable (TS2307)** | ~10 | `socket.io`, `socket.io-client` non installés |
| **Propriété inexistante (TS2339)** | ~15 | Types obsolètes ou incomplets |
| **Type incompatible (TS2322/TS2345)** | ~15 | Conversions string[] ↔ string, etc. |
| **Fonction introuvable (TS2304)** | ~5 | `requireAuth`, `vi` non déclarés |
| **Conversion forcée (TS2352)** | ~5 | Casts entre types incompatibles |

### 4.2 Problèmes récurrents

1. **socket.io / socket.io-client** — Dépendances manquantes dans `package.json`, mais importées dans `examples/`
2. **requireAuth** — Utilisé dans `src/app/api/admin/backups/` et `audit-logs/` mais non défini localement
3. **Types obsolètes** — Plusieurs composants utilisent des interfaces qui ne correspondent plus aux données réelles
4. **Conversion AppView** — Le switch-case dans `page.tsx` utilise des casts forcés

---

## 5. Tests (334 tests, 31 fichiers, ✅ 100% passants)

| Fichier de test | Tests | Statut |
|-----------------|-------|--------|
| `src/lib/constants.test.ts` | ✅ | Configuration, budgets, usages |
| `src/app/api/auth/route.test.ts` | ✅ | Auth (register, login, forgot, erreurs) |
| `src/components/results/results-page.test.tsx` | ✅ | Filtres, tri, rendu |
| `src/components/offers/offers-page.test.tsx` | ✅ | Catalogue, filtres |
| Autres | ✅ | Validation, utils, pricing, star rating, thème |

**Note :** Un test d'intégration `POST /api/auth — retourne 500 en cas d'erreur Prisma` logue une erreur dans stderr (attendue), mais le test passe.

---

## 6. Fonctionnalités Récemment Ajoutées (v2.0.0)

| Fonctionnalité | Détail | Statut |
|----------------|--------|--------|
| **Wizard inscription** | 3-4 étapes (Profil → Identité → Entreprise → Sécurité) | ✅ |
| **Inscription Assureur** | Crée automatiquement Insurer + InsurerAccount | ✅ |
| **Cartes de rôle** | UI avec icônes, features, sélection visuelle | ✅ |
| **Dashboard assureur** | KPIs réels depuis API (plus de mocks) | ✅ |
| **Modale comparaison** | Prix dynamiques par garantie, tooltips breakdown | ✅ |
| **Seed enrichi** | Nouvelles colonnes structurées (variableSource, ratePercent, etc.) | ✅ |

---

## 7. Recommandations

### 🔴 Critique

1. **Base de données vide** — Seul SAHAM existe sans offres/garanties. Lancer le seed (`/api/seed`) ou créer des données via l'admin pour tester le parcours complet.

2. **53 erreurs TypeScript** — Surtout des dépendances manquantes (`socket.io`) et des types obsolètes. Bloquant pour un build de production.

3. **Aucune couverture pour l'assureur SAHAM** — Bien que présent en base, il n'a ni offres ni garanties. Le parcours de comparaison ne retournera aucun résultat.

### 🟡 Important

4. **Tests limités** — 334 tests OK mais seulement sur les services utilitaires. Pas de tests pour les composants critiques (comparaison, admin, assureur).

5. **mini-services/ vide** — Dossier prévu pour des micro-services mais aucun contenu (juste `.gitkeep`).

6. **Persistance Zustand** — Pas de `persist` middleware → perte d'état au refresh navigateur.

### 🟢 Améliorations

7. **5 placeholders USER** sur 10 onglets (contrats, documents, avis, paiements, historique)

8. **3 placeholders INSURER** sur 9 onglets (analytiques graphiques, clients, contrats, sinistres)

9. **Backups** — 0 sauvegardes effectuées. Planifier des sauvegardes automatiques.

10. **Documentation API** — Pas de JSDoc sur les routes API et fonctions exportées.

---

## 8. Audit de Sécurité

| Point | Statut | Note |
|-------|--------|------|
| Mots de passe hashés (bcrypt) | ✅ | Hash sécurisé |
| Rôles (USER/INSURER/ADMIN) | ✅ | Séparation stricte |
| Permissions granulaires | ✅ | 34 permissions, 9 catégories |
| Sessions | ⚠️ | 0 sessions actives (pas de JWT) |
| Audit logging | ✅ | Toutes les opérations CRUD loggées |
| Validation Zod | ✅ | Validation côté serveur |
| Upload logo | ✅ | Limité à 2MB, types contrôlés |
| XSS | ⚠️ | Affichage `dangerouslySetInnerHTML` non trouvé |
| CORS | ⚠️ | Pas de configuration CORS explicite |

---

## 9. Statistiques Globales

| Catégorie | Valeur | Tendance |
|-----------|--------|----------|
| **Composants React** | 130 | 📈 +15 depuis v1 |
| **Routes API** | 63 | 📈 +20 depuis v1 |
| **Tests** | 334 (31 fichiers) | 📈 +244 depuis v1 |
| **Erreurs TS** | 53 | 📉 En baisse (était ~80) |
| **Couverture UI** | 48 composants shadcn | ✅ Stable |
| **Vues fonctionnelles** | 33/42 (78.6%) | 📈 12 public + 5 USER + 5 INSURER + 11 ADMIN |
| **Placeholders** | 8 | 📉 En baisse (était 12) |
| **Langue** | 100% français | ✅ |
| **Devise** | FCFA (`Intl.NumberFormat`) | ✅ |

---

*Audit généré le 15 Juillet 2026 — Projet NOLI Assurance v2.0.0*
