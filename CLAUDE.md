# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

**Noli** — comparateur d'assurances multi-assureurs (Côte d'Ivoire). Plateforme trois-acteurs : **USER** (client qui compare et demande des devis), **INSURER** (compagnie qui gère offres/devis), **ADMIN** (back-office complet). L'app est en français (UI, commentaires, commits).

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Supabase (Postgres + Auth, **pas de Prisma**) · Tailwind v4 + shadcn/ui · Zustand · React Query · react-hook-form + Zod v4 · Vitest. Build `output: "standalone"`, prod derrière **nginx** + **PM2** (mono-instance fork, port 8080). Branche par défaut : **`2.0.0`**.

## Commandes

```bash
bun install                 # bun.lock est le lockfile de référence (CI utilise npm ci + package-lock.json)
bun run dev                 # dev server → http://localhost:3000
bun run build               # build standalone + copie static/public dans .next/standalone
bun run start               # lance .next/standalone/server.js (bun, NODE_ENV=production)
bun run lint                # eslint
bun run typecheck           # tsc --noEmit (ne JAMAIS ignoreBuildErrors)
bun run test                # vitest run (tous les tests)
bun run test:watch          # vitest watch
bunx vitest run src/lib/pricing-service.test.ts   # un seul fichier de test
bunx vitest -t "calcule la prime"                 # un seul test par nom
bun run test:coverage       # couverture (rapport dans ./coverage)
bun run check               # garde-fous complets (typecheck + lint + tests) — à passer avant push
bun run check:unused        # knip — code mort / dépendances inutilisées (rapport)
bun run check:dup           # jscpd — code dupliqué (rapport)
```

Migrations SQL (schéma + RLS) dans `supabase/migrations/`, appliquées via la **CLI Supabase** (`supabase db push` / `supabase migration up`, projet lié `lqjdmugtrhwtkofkcmlw`). Edge Function notifications : `supabase functions deploy send-notification`.

> Les scripts `.zscripts/*.sh` sont des wrappers CI hérités (référencent un `db:push` Prisma qui n'existe plus) — préférer les commandes ci-dessus.

## Architecture — ce qui n'est pas évident

### Deux clients Supabase, deux sémantiques (CRUCIAL)
- **`db`** (`src/lib/db.ts`) → client **`service_role`**, **contourne la RLS**, serveur uniquement. C'est un `Proxy` qui crée le client au premier appel (un `.env` incomplet ne casse donc pas le build). **Tout le data-access métier passe par `db`** → l'autorisation repose **entièrement sur les checks applicatifs** (`requireAuth`, `requireRole`, comparaison d'IDs). La RLS n'est évaluée que pour les requêtes via la anon key. Conséquence : une route qui oublie `requireAuth` = fuite sans filet.
- **`getSupabaseServerClient()`** (`src/lib/auth-guard.ts`) → client **anon lié au cookie session**, RLS active. Utilisé **pour l'auth** (`signUp`, `signInWithPassword`, `getUser`, échange PKCE de récupération). Les cookies de session sont posés **httpOnly** (durcissement TEC-AUTH-01).

### Modèle d'authentification / RBAC
- Session = JWT Supabase Auth dans cookies **httpOnly** (`@supabase/ssr`). Toujours valider côté serveur via `supabase.auth.getUser()` (jamais `getSession`/client).
- `getSessionProfile()` (`auth-guard.ts`) → renvoie le profil (rôle, `isActive`) lu via `db` ; renvoie `null` si le compte est désactivé. Helpers : `requireAuth(roles?)`, `requireAdmin(profile)`, `requireRole(profile, roles)`, `getInsurerAccount(profileId)`.
- **L'identité vient toujours de la session**, jamais d'un paramètre client (anti-IDOR). Pour un insurer, `getInsurerAccount(profile.id)` puis filtrage `where insurer_id = account.insurerId`.
- Conventions de routes API : `/api/admin/*` (ADMIN), `/api/insurer/*` (INSURER + scope `insurer_account`), `/api/user/*` (ownership `userId === session.id`), `/api/auth/*` (actions dans `src/lib/auth-actions.ts`), publiques : `/api/quotes`, `/api/compare`, `/api/offers`, `/api/contact*`. Un chemin `/api/*` inconnu renvoie une 404 JSON (`src/app/api/[...notfound]/route.ts`).

### snake_case (BDD) ↔ camelCase (app)
Colonnes Postgres en snake_case, app en camelCase. Convertir les résultats avec **`mapRow` / `mapRows`** (`src/lib/db.ts`). Dans les requêtes PostgREST on alias explicitement : `select("firstName:first_name, lastName:last_name")`. Attention aux jointures `left` (ex. `offer.category` peut être `null`).

### Moteur tarifaire / comparaison
Cœur métier dans `src/lib/` : `pricing-service.ts` (calcul des primes via `coverage_tariff_rules`, 4 méthodes : FREE / FIXED_AMOUNT / VARIABLE_BASED / MATRIX_BASED), `compare-service.ts` (matching offres↔devis + scoring), `insurer-offers-mapper.ts`. Ces fichiers ont des tests (`*.test.ts`) — les mettre à jour quand la logique change. Le prix affiché est la **prime brute** (somme des primes de garanties) ; `calculateNetPremium` existe mais n'est pas câblée.

### Validation & sécurité
- Schémas Zod centralisés dans `src/lib/validation.ts`. Toujours `safeParse` le body des routes API.
- Helpers `src/lib/security.ts` : `parseNumberField` (rejette NaN/Infinity/négatif), `validateOfferRanges` (bornes min ≤ max des offres), `sanitizePostgrestSearch` (**obligatoire pour tout `search` interpolé dans `.or()`/`.ilike()`**, sinon injection de filtre PostgREST), `escapeHtml`, `MASKED_SECRET`.
- Helper `parseFCFA` (`src/lib/utils.ts`) pour tout montant FCFA saisi en texte (gère les espaces/virgules) — ne pas utiliser `Number()` brut.
- Rate limiting en mémoire (`src/lib/rate-limit.ts`) → **mono-instance uniquement** (PM2 fork), fiable seulement derrière le reverse-proxy (qui réécrit `X-Forwarded-For`).
- `src/middleware.ts` : check `Origin` (CSRF) sur méthodes mutantes `/api/*`.
- `resolveSiteUrl` (`auth-actions.ts`) : lien de reset construit depuis une **allowlist d'hôtes** (anti Host-header poisoning) ; positionner `NEXT_PUBLIC_SITE_URL=https://noli.ci` en prod.

### State & UI
- Store global Zustand `src/store/app-store.ts` (`persist`) : retient auth + onglets actifs, mais **PAS les données personnelles** (nom/email/téléphone) — repartent à zéro à chaque load (UI-H04).
- Composants `src/components/ui/*` = shadcn/ui **vendored** (exclus de la couverture et des garde-fous, ne pas auditer/refactorer sauf besoin).
- Alias de chemin `@/*` → `src/*` (configuré dans `tsconfig.json` et `vitest.config.ts`).

## Conventions de code
- Commentaires et messages utilisateur en **français**.
- Réponses API : `{ data }` ou `{ error }` avec code HTTP approprié ; messages d'erreur génériques côté auth (pas d'énumération de comptes).
- `console.error` pour le logging serveur ; `logAudit()` (`src/lib/audit.ts`) pour les actions sensibles (attribue à l'utilisateur de la session).
- Ne jamais exposer la `service_role` côté client ni committer `.env` (déjà dans `.gitignore`).

## Pièges connus
- `next-auth` est listé dans `package.json` mais **n'est plus utilisé** (auth via Supabase) — à retirer.
- Le projet a migré Prisma/SQLite → Supabase : certains commentaires/scripts mentionnent encore SQLite (ex. `ecosystem.config.js`) ou Caddy (la prod est **nginx**). La BDD est Postgres.
- `roles`/`permissions`/`role_permissions`/`profile_roles` existent mais ne sont lus par aucune policy ni le code (RBAC décoratif) — `is_admin()` ne vérifie que `profiles.role = 'ADMIN'`.

---

# Règles de travail

## Rôle
- Session principale = chef de chantier : enquête, plan, délégation aux agents de .claude/agents/, vérification, livraison.
- Design → designer. Interface → dev-frontend. Base/API → dev-backend. Vérification → recette. Relecture → relecteur.

## Enquête avant question
- Chercher d'abord dans git, la base, Lovable, les mails, Drive et la preview.
- Réponse trouvée = décision appliquée avec sa source. Réponse probable = hypothèse prudente appliquée et signalée.
- Me remonter uniquement les arbitrages ou l'introuvable, en précisant où tu as cherché.

## Livrable d'abord
- Chaque session sert UN livrable, inscrit dans STATUS.md avec sa DoD : critères vérifiables, URL de preview, ce que j'ouvre pour constater.
- Ce qui sort du livrable va au backlog de STATUS.md.
- Fini = chaque critère de la DoD vérifié par l'agent recette sur la preview déployée, avec preuve.

## Une seule validation
- Au démarrage : plan court + questions regroupées. Après mon arbitrage, exécution jusqu'au bout en autonomie.
- Points d'arrêt : changement d'architecture, sortie du périmètre, action irréversible en production, dépense d'argent.

## Autonomie technique
- Sur la branche du livrable : commits fréquents, push, migrations sur la preview, déploiement preview, en autonomie.
- Pull request et merge sur main : sur ma demande explicite.
- Lovable : uniquement pour prévisualiser l'interface quand je le demande.

## Anti-spaghetti
Structure
- Architecture unique décrite dans docs/ARCHITECTURE.md (dossiers, couches, rôle de chacun). Tout nouveau code s'y range ; si rien ne convient, on met d'abord le document à jour.
- Couches séparées : interface (écrans, composants) → logique métier (services, hooks) → accès aux données (un module par source). Les écrans passent par la logique métier pour accéder aux données.
- Dépendances sans cycle.
Une seule source de vérité
- Avant de créer un fichier, un composant, une fonction, une table ou un style : chercher l'existant, le réutiliser ou l'étendre.
- Une seule version par écran ou fonction : on modifie l'original, sans copie « v2 », « new », « copy » ou « old ».
- Couleurs, typographies, espacements : uniquement via le design system.
- Constantes, libellés et règles métier centralisés.
Taille et lisibilité
- Fichier de plus de 300 lignes ou fonction de plus de 50 lignes : on découpe.
- Un composant = une responsabilité. Noms explicites et cohérents dans tout le dépôt.
- Typage strict ; le code inutile est supprimé, pas commenté.
Changements
- Une branche = un livrable. Commits petits et lisibles.
- Ce qu'un changement rend inutile (code, fichier, dépendance, colonne) est supprimé dans le même lot.
- Décision structurante = une ligne dans docs/DECISIONS.md (date, décision, raison).
- Base : toute modification passe par une migration versionnée dans le dépôt.
Contrôle
- Le relecteur vérifie chaque lot : doublon, code mort, couches, taille, design system, migration. Un lot conforme est pushé ; sinon il est corrigé.
- Le script « check » passe avant chaque push.

## Passation
- STATUS.md = source de vérité : livrable, DoD, fait / reste à faire, décisions (sources), hypothèses, À DÉFINIR, backlog, PR, agents mobilisés.
- Mise à jour à chaque étape franchie et avant toute fin de session.
- Contexte long (résumé automatique) : mets à jour STATUS.md et dis-moi « Ouvre une nouvelle session ».

## Clôture de session
- Agents et tâches de fond terminés ou arrêtés : aucun ne reste actif.
- STATUS.md à jour, tout commité et pushé.
- État du chantier remis au format ci-dessous.

## État du chantier (en français, concis)
- Livrable ✅/❌
- Tableau DoD : critère / statut / preuve
- URL preview + branche + dernier commit
- Agents mobilisés et ce que chacun a rendu
- Résultat du script « check »
- Agents et tâches de fond : tous fermés ✅ (sinon lesquels et pourquoi)
- Backlog, À DÉFINIR, prochaine étape
