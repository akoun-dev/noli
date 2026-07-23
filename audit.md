# Audit Complet — Noli — 23/07/2026

> Comparateur d'assurances · Next.js 16 (App Router) · TypeScript · Prisma/SQLite · Tailwind v4 + shadcn/ui
> Branche auditée : `2.0.0` (HEAD `a2a89fd`)
> Outils : Node 24.18, npm 11.16, `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`

---

## Synthèse exécutive

Le projet est fonctionnel et mature côté produit (interfaces admin/assureur/user complètes, pricing-service riche).
En revanche, **plusieurs problèmes graves** sont apparus depuis l'audit du 15/07 et remettent en cause la qualité et la sécurité :

| # | Sévérité | Constat |
|---|----------|---------|
| 1 | 🔴 Critique | **Tous les tests ont été supprimés** (commit `7f7cf86`). `npm test` → 0 fichier. Le README et le badge coverage mentent. |
| 2 | 🔴 Critique | **`ignoreBuildErrors: true`** dans `next.config.ts` → le build prod ignore les 46 erreurs TS. |
| 3 | 🔴 Critique | **2 routes admin appellent `requireAuth` sans l'importer** → `ReferenceError` au runtime (audit-logs, backups). |
| 4 | 🟠 Important | **23 routes API sans aucune vérification d'authentification**, dont `/api/seed` (réécrit la BDD), `/api/insurer/*` (CRUD offres/garanties/devis), `/api/user/quotes/*`, `/api/notifications/*`. |
| 5 | 🟠 Important | **IDOR / manque de contrôle d'appartenance** sur plusieurs routes (notifs, quotes insurer). |
| 6 | 🟡 Modéré | Fichiers parasites versionnés : BDD SQLite (`dev.db`), `worklog.md`, `comptes-test.md`, `browser-state.json`, `vision-out.json`, `agent-ctx/`, `examples/`, `download/`. |
| 7 | 🟡 Modéré | ESLintconfig **désactive quasiment toutes les règles** (any, unused-vars, exhaustive-deps, no-console, no-undef…). |
| 8 | 🟢 Mineur | Fichiers géants (2 185 / 2 103 / 1 818 lignes), 139 `console.*` en production, 27 types `any`. |

---

## 1. Métriques du code

| Métrique | Valeur | État |
|----------|:------:|:----:|
| Fichiers source (`src/`) | 195 | — |
| Composants `.tsx` | 114 | — |
| Fichiers `.ts` | 80 | — |
| Routes API (`route.ts`) | 65 | — |
| Pages App Router | 1 (catch-all `[[...slug]]`) | — |
| **Fichiers de test** | **0** | 🔴 |
| **Tests** | **0 / 0 ✅** | 🔴 |
| **Erreurs TypeScript** | **46** | 🟠 |
| Erreurs ESLint | 2 | 🟢 |
| Warnings ESLint | 2 | 🟢 |

### Répartition des 46 erreurs TypeScript

| Code | Description | # |
|------|-------------|:-:|
| TS2304 | Nom introuvable (`requireAuth`) | 3 |
| TS2339 | Propriété inexistante sur un type | 13 |
| TS2345 | Argument non assignable | 9 |
| TS2322 | Type non assignable | 11 |
| TS2353 | Propriété inconnue dans littéral objet | 5 |
| TS2352 / TS2769 | Conversion / surcharge | 3 |
| TS2769 | vitest.config `coverage` | 1 |
| Autres (avatarUrl, AppView…) | — | 1 |

**Localisation :** `src/components/insurer/*` (≈ 18 erreurs), `src/lib/compare-service.ts` (4), `src/components/admin/*` (8), `src/components/user|profile|dashboard` (9), `src/app/api/*` (2), `vitest.config.ts` (1).

---

## 2. Sécurité — 🔴 la priorité absolue

### 2.1 Authentification

- Modèle : session en BDD (table `Session`), cookie `noli_session` httpOnly, `sameSite=lax`, `secure` en prod. ✅
- Mots de passe : `bcryptjs`. ✅
- `src/lib/auth-guard.ts` expose `requireAuth(roles)`, `requireAdmin`, `requireRole`, `getSessionProfile`. ✅
- ⚠️ **`next-auth` (v4.24.11) est en dépendance mais nulle part utilisé** dans le code (0 `getServerSession`, 0 `NextAuth`). Charge morte + risque de confusion.

### 2.2 Routes non protégées (0 vérification d'auth)

```
src/app/api/compare/route.ts
src/app/api/contact/callbacks/route.ts
src/app/api/contact/request-callback/route.ts
src/app/api/coverage-categories/route.ts
src/app/api/insurer/account/route.ts          ← compte assureur sans auth
src/app/api/insurer/coverages/[id]/route.ts   ← GET/PUT/DELETE garanties sans auth
src/app/api/insurer/coverages/route.ts        ← CRUD garanties sans auth
src/app/api/insurer/logo/route.ts             ← upload logo sans auth
src/app/api/insurer/offers/[id]/route.ts      ← CRUD offres sans auth
src/app/api/insurer/offers/route.ts
src/app/api/insurer/quotes/[id]/status/route.ts  ← change statut devis sans auth
src/app/api/insurer/quotes/route.ts
src/app/api/insurer/stats/route.ts
src/app/api/notifications/[id]/route.ts       ← modifie la notification de n'importe qui
src/app/api/notifications/read-all/route.ts
src/app/api/notifications/route.ts
src/app/api/offers/route.ts
src/app/api/quotes/route.ts
src/app/api/route.ts
src/app/api/seed/route.ts                     ← POST réécrit la BDD sans auth
src/app/api/stats/route.ts
src/app/api/user/quotes/[id]/route.ts
src/app/api/user/quotes/route.ts
src/app/api/user/stats/route.ts
```

### 2.3 Bugs d'import → crash runtime 🔴

`requireAuth(["ADMIN"])` est appelé **sans import** dans :

- `src/app/api/admin/audit-logs/route.ts:6` → `ReferenceError` (TS2304 confirmé)
- `src/app/api/admin/backups/route.ts:7,24` → `ReferenceError`

→ Ces deux routes admin **plantent à chaque appel** au lieu d'être protégées. Correctif : ajouter `import { requireAuth } from "@/lib/auth-guard"`.

### 2.4 IDOR / contrôle d'appartenance

- ✅ `user/quotes/[id]` vérifie `quote.userId !== userId` (mais `userId` vient du query string, pas de la session → falsifiable tant que l'auth n'est pas branchée).
- 🔴 `notifications/[id]` (PUT/DELETE) : aucune vérification que la notif appartient à l'utilisateur courant.
- 🔴 `insurer/coverages/[id]`, `insurer/offers/[id]` : aucune vérification que l'enregistrement appartient à l'assureur courant.

### 2.5 Validation des entrées

- **Zod est en dépendance mais 0 route API ne l'utilise** (`from "zod"` absent de `src/app/api`).
- Le parsing se fait à la main (`await request.json()` puis accès direct). Risque d'injection de données malformées.

### 2.6 Secrets

- `.env` contient uniquement `DATABASE_URL` (✅). Clé `RESEND_API_KEY` et `EMAIL_FROM` lus via `process.env` (✅ pas hardcodés).
- 🔴 **La BDD SQLite `prisma/prisma/dev.db` est versionnée dans git** (avec profils, hashes de mots de passe, etc.). À sortir du dépôt + `git rm --cached`.
- 🔴 `comptes-test.md` (comptes de test) est lui aussi versionné.

---

## 3. Base de données

- **Provider :** SQLite (via Prisma). Schéma : 21 modèles, cohérent et bien structuré.
- 🔴 **Aucune migration** (`prisma/migrations/` n'existe pas). Le schéma est poussé via `db push` uniquement → impossible de tracer/rejouer l'évolution. À passer en `prisma migrate`.
- 🔴 La BDD de dev (`prisma/prisma/dev.db`) est committée.
- `seed-user-data.ts` existe à la racine (et non dans `prisma/`), référence `seed-categories.ts` dans le script `db:seed` mais ce fichier est absent.
- Pas de `prisma/seed.ts` référencé dans le `package.json` Prisma → `prisma db seed` ne fonctionne pas.

---

## 4. Qualité & architecture

### 4.1 Configuration

- 🔴 `next.config.ts` : `typescript.ignoreBuildErrors: true` → **le build de production ignore les 46 erreurs TS**. Le bug `requireAuth` non importé passe donc en prod silencieusement et explose à l'exécution.
- 🔴 `eslint.config.mjs` désactive ~25 règles (`no-explicit-any`, `no-unused-vars`, `exhaustive-deps`, `no-console`, `no-undef`, `no-unreachable`…). Le linter ne filtre plus grand-chose.
- `reactStrictMode: false` → perd une détection de bugs.
- ✅ `tsconfig.json` : `strict: true` (mais `noImplicitAny: false`).

### 4.2 Fichiers les plus volumineux (candidates au refactoring)

| Lignes | Fichier |
|-------:|---------|
| 2 185 | `src/components/insurer/tabs/insurer-guarantees-tab.tsx` |
| 2 103 | `src/components/results/results-page.tsx` |
| 1 818 | `src/components/admin/coverages-tab.tsx` |
| 1 641 | `src/components/admin/settings-tab.tsx` |
| 1 027 | `src/lib/pricing-service.ts` |
| 973 | `src/components/auth/auth-pages.tsx` |
| 925 | `src/components/auth/auth-modals.tsx` |
| 872 | `src/components/insurer/tabs/insurer-offers-tab.tsx` |
| 857 | `src/components/admin/garanties-tab.tsx` |
| 733 | `src/components/comparison/comparison-form.tsx` |

Les 3 premiers dépassent largement 1 500 lignes → extraire sous-composants / hooks.

### 4.3 Code smells

| Constat | Nombre |
|---------|:------:|
| `console.log/error/warn` en production | 139 |
| Types `any` explicites | 27 |
| `TODO`/`FIXME`/`HACK` | 0 |
| `@ts-ignore` / `eslint-disable` | 0 (toutes les règles sont désactivées globalement) |

### 4.4 Duplication

- Les onglets « garanties » existent en triple : `admin/garanties-tab.tsx`, `admin/coverages-tab.tsx`, `insurer/tabs/insurer-guarantees-tab.tsx`. Logique très similaire, beaucoup de code répété.
- `parseJsonField<T>` recopié dans plusieurs `route.ts` (user/quotes, insurer/quotes…) → à factoriser dans `src/lib/`.

### 4.5 Fichiers parasites dans le dépôt 🔴🟡

Versionnés alors qu'ils ne devraient pas l'être :

```
prisma/prisma/dev.db          ← base + mots de passe hashés
db/custom.db                  ← autre base
comptes-test.md               ← comptes de test en clair
audit.md                      ← (ce fichier, ok)
worklog.md  (61 Ko)
browser-state.json
vision-out.json
agent-ctx/*.md                ← notes d'agents
examples/websocket/*          ← exemple non utilisé (socket.io non installé)
download/README.md
mini-services/.gitkeep
```

Le commit `7f7cf86` a supprimé les **tests** en les qualifiant de « temporary documentation and test files » — c'est une erreur : il s'agissait de la suite de tests réelle.

---

## 5. Interfaces fonctionnelles

(Les statuts ci-dessous sont inchangés vs. audit 15/07 côté produit ; la plupart des écrans existent.)

### Publics
Landing · Comparaison · Résultats · Connexion/Inscription · Profil · Mentions légales · FAQ · Contact · À propos · Offres · Dashboard — ✅

### USER
Dashboard · Mes Devis · Mes Contrats · Mon Profil · Documents — ✅
Historique · Paiements · Avis · Notifications · Paramètres — ⏳ placeholders

### INSURER
Dashboard · Offres · Garanties · Devis — ✅
Paramètres — 🔶 partiel · Clients · Contrats · Sinistres · Analytics — ⏳ placeholders

### ADMIN
Dashboard · Assureurs · Catégories produit/garantie · Garanties · Couvertures · Offres · Packs · Rôles & Permissions · Sauvegardes · Logs d'audit · Devis · Paramètres — ✅
⚠️ **Onglets Sauvegardes et Logs d'audit cassés côté API** (routes en `ReferenceError`).

---

## 6. Plan d'action priorisé

### P0 — Critique (bloquant pour la mise en prod)
1. **Restaurer l'auth sur les 2 routes admin cassées** : ajouter `import { requireAuth } from "@/lib/auth-guard"` dans `audit-logs/route.ts` et `backups/route.ts` (+ `[id]`).
2. **Protéger les 23 routes non gardées** : `requireAuth(["ADMIN"|"INSURER"|"USER"])` au minimum sur `/api/insurer/*`, `/api/user/*`, `/api/notifications/*`, `/api/admin/*` restants, et **verrouiller `/api/seed`** (ADMIN only, voire désactivé en prod).
3. **Brancher l'identité sur la session** (pas le `userId` du query string) pour fixer les IDOR notifs/quotes.
4. **Mettre `ignoreBuildErrors: false`** dans `next.config.ts` et corriger les 46 erreurs TS.
5. **Sortir la BDD du git** : `git rm --cached prisma/prisma/dev.db db/custom.db`, les ajouter au `.gitignore`, et **faire tourner les mots de passe** (hashes exposés dans l'historique).

### P1 — Important
6. Réintroduire une suite de tests (au moins les 31 fichiers supprimés via `git show 7f7cf86^`, ou repartir de zéro sur les services critiques : `pricing-service`, `compare-service`, `auth-guard`).
7. Mettre en place **Prisma migrations** (`prisma migrate dev`) à la place de `db push`.
8. Ajouter la **validation Zod** sur les entrées des routes POST/PUT.
9. Corriger les **IDOR** (vérifier `insurerId` de l'enregistrement vs assureur connecté).
10. Supprimer la dépendance inutilisée `next-auth` (ou l'utiliser réellement).

### P2 — Améliorations
11. Réactiver progressivement les règles ESLint désactivées.
12. Refactorer les 3-4 fichiers > 1 500 lignes.
13. Factoriser `parseJsonField` et la logique « garanties » dupliquée.
14. Nettoyer les fichiers parasites du dépôt (`agent-ctx`, `examples`, `download`, `worklog.md`, `browser-state.json`, `vision-out.json`).
15. Remplacer les `console.*` de prod par un logger, réduire les `any`.

---

## 7. Évolution vs. audit du 15/07

| Indicateur | 15/07 | 23/07 | Tendance |
|------------|:-----:|:-----:|:--------:|
| Tests | 334 ✅ | **0** | 🔴 |
| Erreurs TS | 51 | 46 | 🟢 léger mieux |
| Routes non protégées | non mesuré | **23** | 🔴 |
| Routes admin cassées (import) | — | **2** | 🔴 (régression) |
| `ignoreBuildErrors` | — | **activé** | 🔴 (masque les erreurs) |
| BDD dans git | non mentionné | **oui** | 🔴 |

**Conclusion :** le produit a avancé fonctionnellement, mais la dette technique et la posture de sécurité se sont dégradées depuis le 15/07. Les points P0 ci-dessus doivent être traités **avant toute mise en production**.

---

*Audit généré le 23/07/2026 — exécuté avec npm (Node 24.18).*
