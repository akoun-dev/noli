# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Noli** — comparateur d'assurances multi-assureurs (Côte d'Ivoire). Plateforme trois-acteurs : **USER** (client qui compare et demande des devis), **INSURER** (compagnie qui gère offres/devis), **ADMIN** (back-office complet). L'app est en français (UI, commentaires, commits).

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Supabase (Postgres + Auth, **pas de Prisma**) · Tailwind v4 + shadcn/ui · Zustand · React Query · react-hook-form + Zod v4 · Vitest. Build `output: "standalone"`, prod derrière **Caddy** + **PM2** (mono-instance fork).

## Commandes

```bash
bun install                 # bun.lock est le lockfile de référence
bun run dev                 # dev server → http://localhost:3000
bun run build               # build standalone + copie static/public dans .next/standalone
bun run start               # lance .next/standalone/server.js (bun, NODE_ENV=production)
bun run lint                # eslint
npx tsc --noEmit            # typecheck (pas de script dédié ; ne JAMAIS ignoreBuildErrors)
bun run test                # vitest run (tous les tests)
bun run test:watch          # vitest watch
bunx vitest run src/lib/pricing-service.test.ts   # un seul fichier de test
bunx vitest -t "calcule la prime"                 # un seul test par nom
bun run test:coverage       # couverture (rapport dans ./coverage)
```

Migrations SQL (schéma + RLS) dans `supabase/migrations/`, appliquées via la **CLI Supabase** (`supabase db push` / `supabase migration up`, projet lié). Edge Function notifications : `supabase functions deploy send-notification`.

> Les scripts `.zscripts/*.sh` sont des wrappers CI hérités (référencent un `db:push` Prisma qui n'existe plus) — préférer les commandes ci-dessus.

## Architecture — ce qui n'est pas évident

### Deux clients Supabase, deux sémantiques (CRUCIAL)
- **`db`** (`src/lib/db.ts`) → client **`service_role`**, **contourne la RLS**, serveur uniquement. C'est un `Proxy` qui crée le client au premier appel (un `.env` incomplet ne casse donc pas le build). **Tout le data-access métier passe par `db`** → l'autorisation repose **entièrement sur les checks applicatifs** (`requireAuth`, `requireRole`, comparaison d'IDs). La RLS n'est évaluée que pour les requêtes via la anon key. Conséquence : une route qui oublie `requireAuth` = fuite sans filet.
- **`getSupabaseServerClient()`** (`src/lib/auth-guard.ts`) → client **anon lié au cookie session**, RLS active. Utilisé **pour l'auth** (`signUp`, `signInWithPassword`, `getUser`).

### Modèle d'authentification / RBAC
- Session = JWT Supabase Auth dans cookies httpOnly (`@supabase/ssr`). Toujours valider côté serveur via `supabase.auth.getUser()` (jamais `getSession`/client).
- `getSessionProfile()` (`auth-guard.ts`) → renvoie le profil (rôle, `isActive`) lu via `db` ; renvoie `null` si le compte est désactivé. Helpers : `requireAuth(roles?)`, `requireAdmin(profile)`, `requireRole(profile, roles)`, `getInsurerAccount(profileId)`.
- **L'identité vient toujours de la session**, jamais d'un paramètre client (anti-IDOR). Pour un insurer, `getInsurerAccount(profile.id)` puis filtrage `where insurer_id = account.insurerId`.
- Conventions de routes API : `/api/admin/*` (ADMIN), `/api/insurer/*` (INSURER + scope `insurer_account`), `/api/user/*` (ownership `userId === session.id`), `/api/auth/*` (actions dans `src/lib/auth-actions.ts`), publiques : `/api/quotes`, `/api/compare`, `/api/offers`, `/api/contact*`.

### snake_case (BDD) ↔ camelCase (app)
Colonnes Postgres en snake_case, app en camelCase. Convertir les résultats avec **`mapRow` / `mapRows`** (`src/lib/db.ts`). Dans les requêtes PostgREST on alias explicitement : `select("firstName:first_name, lastName:last_name")`.

### Moteur tarifaire / comparaison
Cœur métier dans `src/lib/` : `pricing-service.ts` (calcul des primes via `coverage_tariff_rules`, 4 méthodes : FREE / FIXED_AMOUNT / VARIABLE_BASED / MATRIX_BASED), `compare-service.ts` (matching offres↔devis + scoring), `insurer-offers-mapper.ts`. Ces fichiers ont des tests (`*.test.ts`) — les mettre à jour quand la logique change. Le prix affiché est la **prime brute** (somme des primes de garanties) ; `calculateNetPremium` existe mais n'est pas câblée.

### Validation & sécurité
- Schémas Zod centralisés dans `src/lib/validation.ts`. Toujours `safeParse` le body des routes API.
- Helpers `src/lib/security.ts` : `parseNumberField` (rejette NaN/Infinity/négatif), `sanitizePostgrestSearch` (**obligatoire pour tout `search` interpolé dans `.or()`/`.ilike()`**, sinon injection de filtre PostgREST), `escapeHtml`, `MASKED_SECRET`.
- Helper `parseFCFA` (`src/lib/utils.ts`) pour tout montant FCFA saisi en texte (gère les espaces/virgules) — ne pas utiliser `Number()` brut.
- Rate limiting en mémoire (`src/lib/rate-limit.ts`) → **mono-instance uniquement** (PM2 fork), fiable seulement derrière Caddy (qui réécrit `X-Forwarded-For`).
- `src/middleware.ts` : check `Origin` (CSRF) sur méthodes mutantes `/api/*`.

### State & UI
- Store global Zustand `src/store/app-store.ts` (`persist`) : retient auth + onglets actifs, mais **PAS les données personnelles** (nom/email/téléphone) — repartent à zéro à chaque load (UI-H04).
- Composants `src/components/ui/*` = shadcn/ui **vendored** (exclus de la couverture, ne pas auditer/refactorer sauf besoin).
- Alias de chemin `@/*` → `src/*` (configuré dans `tsconfig.json` et `vitest.config.ts`).

## Conventions de code
- Commentaires et messages utilisateur en **français**.
- Réponses API : `{ data }` ou `{ error }` avec code HTTP approprié ; messages d'erreur génériques côté auth (pas d'énumération de comptes).
- `console.error` pour le logging serveur ; `logAudit()` (`src/lib/audit.ts`) pour les actions sensibles (attribue à l'utilisateur de la session).
- Ne jamais exposer la `service_role` côté client ni committer `.env` (déjà dans `.gitignore`).

## Pièges connus
- `next-auth` est listé dans `package.json` mais **n'est plus utilisé** (auth via Supabase) — à retirer.
- Le projet a migré Prisma/SQLite → Supabase : certains commentaires/scripts mentionnent encore SQLite (ex. `ecosystem.config.js`). La BDD est Postgres.
- `roles`/`permissions`/`role_permissions`/`profile_roles` existent mais ne sont lus par aucune policy ni le code (RBAC décoratif) — `is_admin()` ne vérifie que `profiles.role = 'ADMIN'`.
