# Audit Complet — Noli — 06/08/2026

> Comparateur d'assurances · Next.js 16 (App Router, `output: standalone`) · TypeScript · **Supabase** (migration Prisma/SQLite) · Tailwind v4 + shadcn/ui
> Vérifications réelles effectuées ce jour : 56 `route.ts` audités, 22 migrations relues, `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`, `npm run build`, scan secrets, état git complet.

---

## 1. Synthèse exécutive

**Verdict : migration Supabase techniquement solide, mais la surface d'attaque de l'API n'a pas suivi — rien ne doit partir en production en l'état.**

Points forts : 22 migrations versionnées appliquées au cloud, RLS posée sur les 20 tables, seed idempotent, auth JWT branchée, **les 27 routes admin sont toutes protégées** (`requireAuth(["ADMIN"])`), doublon `src/src` supprimé.

Points bloquants :

| # | Sévérité | Constat |
|---|----------|---------|
| 1 | 🔴 Critique | **`.env` commité dans git** (3 commits, remote `github.com/akoun-dev/noli.git`) avec la **vraie clé `SUPABASE_SERVICE_ROLE_KEY`** → accès total à la BDD si le dépôt est partagé. |
| 2 | 🔴 Critique | **24 routes sans aucune auth** (dont `/api/seed` qui réécrit la base, tout le CRUD `insurer/*`, les notifications). |
| 3 | 🔴 Critique | **18 routes avec IDOR** : l'identité vient du query/body/header client (`userId`, `insurerId`, `x-user-id`), donc falsifiable. |
| 4 | 🔴 Critique | **RLS contournée à 100 %** : toutes les routes passent par le client `service_role` (`src/lib/db.ts`) qui bypass la RLS. La protection repose uniquement sur des guards applicatifs lacunaires. |
| 5 | 🔴 Critique | **`typescript.ignoreBuildErrors: true`** → les **39 erreurs TS** passent en production. |
| 6 | 🔴 Critique | **0 test** (`npx vitest run` → « No test files found », exit 1). |
| 7 | 🟠 Important | `/api/quotes?all=true` dump tous les devis + emails ; `/api/insurer/quotes` expose `personal_data`/`vehicle_data` (PII clients). |
| 8 | 🟠 Important | Upload **SVG** non authentifié (`/api/insurer/logo`, header `x-user-id` forgeable) servi depuis `public/` → risque XSS stockée. |
| 9 | 🟠 Important | Routes backups **fonctionnellement cassées** depuis la migration (manipulent l'ancienne base SQLite `db/custom.db`). |
| 10 | 🟠 Important | Auto-inscription **INSURER** sans validation admin (`z.enum(["USER","INSURER"])`). |
| 11 | 🟠 Important | **4 composants admin morts** (`garanties-tab`, `categories-tab`, `offres-tab`, `packages-tab`) + edge function `send-notification` non déployée mais référencée dans `config.toml`. |
| 12 | 🟡 Modéré | Rien n'est **commité depuis la migration** (196 D + 66 M + 11 D). Fichiers parasites trackés (`db/custom.db`, `worklog.md`, `comptes-test.md`, `browser-state.json`…). |
| 13 | 🟡 Modéré | `next-auth` + `bcryptjs` + `@types/bcryptjs` en dépendances **inutilisés** ; 27 règles ESLint désactivées ; `reactStrictMode: false`. |

---

## 2. État de la migration Supabase

| Sujet | État | Détail |
|-------|------|--------|
| Migrations | ✅ | 22 fichiers `20260806*.sql`, synchronisées au cloud (`db push` → « up to date ») |
| Tables | ✅ | 20 tables (helpers + `extend_notification_types` = code utilitaire, sans table) |
| RLS | ✅ | `enable row level security` présent sur les **20 tables** ; policies par rôle (utilisateur/insurer/admin) |
| Seed | ✅ | `supabase/seed.sql` (3,7 Ko, idempotent via `ON CONFLICT`) + `[db.seed]` dans `config.toml` |
| Auth | ✅ | JWT Supabase + cookies httpOnly via `@supabase/ssr` ; `auth-guard.ts` (`getSessionProfile`, `requireAuth`, `requireRole`, `requireAdmin`) |
| Comptes de test | ✅ | `admin@noli.ci` / `user@test.ci` / `assureur@saham.ci` — login 200 OK |
| Client données | ⚠️ | **`db` = `service_role` (bypass RLS)** utilisé par **toutes** les routes ; aucun client scoped au JWT de l'utilisateur |
| Bugs GoTrue | ✅ | Tokens `''` + bcrypt cost 10 (NULL `confirmation_token` corrigé) ; `mailer_autoconfirm=true` (pas de SMTP custom) |

**Lecture critique :** la RLS est écrite correctement, mais comme le service_role la contourne systématiquement, elle n'est **opérationnellement jamais exercée**. Le vrai contrôle repose sur les guards applicatifs — or 24 routes n'en ont pas.

---

## 3. Sécurité des routes API (56 auditées)

### 3.1 Bilan chiffré

| Indicateur | Nombre |
|---|---|
| Routes auditées | **56** |
| Routes **protégées** (toutes méthodes) | **32** (27 admin + `profile`, `user/profile`, `insurer/me`, `insurer/insurance-categories`, `insurer/coverage-categories`) |
| Routes **non protégées** | **24** |
| Routes avec **IDOR** | **18** |
| Risque Critique | 2 (`seed`, `quotes`) |
| Risque Dangereux | 17 |
| Risque OK | 37 |

**Détail des 24 routes non protégées :**

| Route | Méthodes | IDOR / Identité client | Risque |
|---|---|---|---|
| `/api/seed` | POST | aucune (écritures DB en masse) | **Critique** |
| `/api/quotes` | GET | `userId` query ; `all=true` → tout dump | **Critique** |
| `/api/compare` | POST | `userId` dans le body | Dangereux |
| `/api/notifications` | GET, POST | `userId` query/body | Dangereux |
| `/api/notifications/[id]` | PUT | `id` en URL | Dangereux |
| `/api/notifications/read-all` | PUT | `userId` query | Dangereux |
| `/api/insurer/quotes` | GET | `userId` query → devis + PII | Dangereux |
| `/api/insurer/quotes/[id]/status` | PUT | `userId` query + `id` URL (check contournable) | Dangereux |
| `/api/insurer/stats` | GET | `userId` query | Dangereux |
| `/api/insurer/account` | GET | `userId` query | Dangereux |
| `/api/insurer/offers` | GET, POST | `insurerId` query/body | Dangereux |
| `/api/insurer/offers/[id]` | GET, PUT, DELETE | `id` URL, sans propriété | Dangereux |
| `/api/insurer/coverages` | GET, POST | `insurerId` query/body | Dangereux |
| `/api/insurer/coverages/[id]` | GET, PUT, DELETE | `id` URL, sans propriété | Dangereux |
| `/api/insurer/logo` | POST | **`x-user-id` en header** (forgeable) | Dangereux |
| `/api/contact/callbacks` | GET, PATCH | `userId` query (tél/email) + `id` body | Dangereux |
| `/api/user/stats` | GET | `userId` query | Dangereux |
| `/api/user/quotes` | GET, POST | GET : `userId` query → PII | Dangereux |
| `/api/user/quotes/[id]` | GET | `userId` query + `id` URL (check contournable) | Dangereux |
| `/api/auth` | POST | endpoint auth (action `me` protégée) | OK |
| `/api/coverage-categories` | GET | — (catalogue public) | OK |
| `/api/stats` | GET | — (compteurs agrégés) | OK |
| `/api/offers` | GET | — (catalogue public) | OK |
| `/api/contact/request-callback` | POST | — (formulaire public, voulu) | OK |

### 3.2 Les 5 failles les plus graves

1. **`/api/seed` POST** — aucun garde, upsert/écriture en masse dans `insurers`, `coverages`, `insurance_offers`, `coverage_tariff_rules`… N'importe qui peut corrompre ou réinitialiser la base.
2. **`/api/quotes` GET** — retourne tous les devis avec `personal_data`, `vehicle_data` et les **emails des profils** ; `all=true` dump intégral sans auth.
3. **`/api/insurer/quotes` GET** — en passant un `userId` arbitraire, on récupère devis + PII de l'assureur lié.
4. **`/api/insurer/logo` POST** — upload non authentifié, identité = header falsifiable ; accepte `image/svg+xml` servi depuis `public/uploads/` → vecteur XSS stockée.
5. **`/api/user/quotes/[id]` GET** — contrôle d'appartenance `quote.userId !== userId` comparé à une valeur **fournie par le client** → lecture du devis complet d'une victime.

### 3.3 Constats complémentaires

- `requireAdmin()` et `requireRole()` dans `auth-guard.ts` sont **morts** : aucune route ne les appelle (les routes admin utilisent `requireAuth(["ADMIN"])`).
- Toutes les routes écrivent via `db` (service_role) — **aucune route n'utilise un client Supabase scoped au JWT**.
- 0 secret hardcodé dans `src/` ; `.env` uniquement référencé via `process.env`.

---

## 4. Qualité & build

| Métrique | Résultat | Verdict |
|----------|----------|:-------:|
| `npx tsc --noEmit` | **39 erreurs** | 🔴 |
| `npm run build` | **OK** (mais `ignoreBuildErrors: true` le masque) | 🟠 |
| `npx eslint .` | **2 erreurs + 3 warnings** | 🟠 |
| `npx vitest run` | **0 fichier de test** (exit 1) | 🔴 |
| `console.*` dans src | 3 | 🟢 |
| `any` dans src | 31 | 🟡 |
| `@ts-ignore` | 0 | 🟢 |
| Règles ESLint désactivées | **27** | 🔴 |

- **Erreurs TS notables** : `examples/websocket/*` (modules `socket.io`/`socket.io-client` manquants, code mort) ; `dashboard-page.tsx` / `insurer-page.tsx` / `my-quotes-page.tsx` (type `AppView` sans `"profile"`) ; `header.tsx` (propriété `icon` absente) ; `offers-page.tsx` (`InsurerOffer` incomplet) ; `db.ts:31` (cast Proxy) ; divers `unknown`/`{}` rendus en `ReactNode`.
- **ESLint** : 2 erreurs `react-hooks/set-state-in-effect` (`insurer-dashboard-tab.tsx:184`) ; warnings `no-unused-expressions` (auth-modals/auth-pages) et `import/no-anonymous-default-export` (edge function).
- **Configs** : `next.config.ts` → `output: standalone`, `reactStrictMode: false`, `ignoreBuildErrors: true` ; `tsconfig` → `strict: true` mais `noImplicitAny: false` ; `test:coverage:badge` référence `scripts/generate-coverage-badge.mjs` **manquant**.

---

## 5. Code mort & nettoyage

| Élément | État | À faire |
|---------|------|---------|
| `src/components/admin/garanties-tab.tsx` | 🔴 orphelin | supprimer (route `/admin/guarantees` supprimée) |
| `src/components/admin/categories-tab.tsx` | 🔴 orphelin | supprimer (route `/admin/guarantee-categories` supprimée) |
| `src/components/admin/offres-tab.tsx` | 🔴 orphelin | supprimer (route `/admin/offers` supprimée) |
| `src/components/admin/packages-tab.tsx` | 🔴 orphelin (non importé par `admin-page.tsx`, qui monte 12 tabs) | supprimer ou intégrer |
| `supabase/functions/send-notification/` | 🟠 **non déployée** (liste vide) mais référencée `config.toml` (`verify_jwt=false`) + erreur TS (`npm:@supabase/server`) | supprimer ou déployer |
| `examples/websocket/` | 🔴 mort (`socket.io`, non référencé) | supprimer |
| `next-auth@4.24.11` | 🔴 aucune import dans src | retirer |
| `bcryptjs` + `@types/bcryptjs` | 🔴 aucune import dans src | retirer |
| `mini-services/` | 🟢 vide | — |
| `db/custom.db` | 🟠 SQLite 286 Ko **tracké** | retirer du suivi |
| `public/uploads/` | 🟡 gitignoré (ligne 67) mais servi | vérifier le type SVG |

---

## 6. Git & secrets

- Branche `2.0.0`, remote `https://github.com/akoun-dev/noli.git`.
- **`.env` tracké dans 3 commits** (`1520f00`, `1c7850a`, `3e89d5d`) : contient `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, **`SUPABASE_SERVICE_ROLE_KEY`**, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`. Le `.gitignore` couvre désormais `.env*` (`!.env.example`) — mais la clé reste dans l'index **et l'historique**.
- **Rien commité depuis la migration** : 196 suppressions **stagées** (`src/src/**` doublon), 66 modifiés, 11 supprimés (routes `guarantees`/`offers`/`guarantee-categories`, `prisma/schema.prisma`, `prisma/dev.db`, `seed-user-data.ts`).
- **Fichiers parasites trackés** : `db/custom.db`, `worklog.md` (60 Ko), `comptes-test.md` (identifiants de test), `browser-state.json`, `vision-out.json`, `agent-ctx/*.md`, `deploiement.md`, `seed-user-data.ts`.
- `prisma/` : dev.db supprimé du disque (suppression non commitée).
- `.env.example` : présent sur le disque, propre, **non commité**.

---

## 7. Plan d'action priorisé

### P0 — Critique (avant toute mise en prod)
1. **Révoquer/régénérer la clé `SUPABASE_SERVICE_ROLE_KEY`** (dashboard Supabase) + `git rm --cached .env` ; si le dépôt est partagé, purger l'historique.
2. ~~**Protéger les 24 routes**~~ ✅ **FAIT** : `requireAuth` sur tout le CRUD `insurer/*`, `notifications/*`, `quotes`, `compare`, `user/*`, `contact/callbacks` ; **`/api/seed` verrouillé (ADMIN uniquement)**.
3. ~~**Corriger les 18 IDOR**~~ ✅ **FAIT** : suppression des `userId`/`insurerId`/`x-user-id` du client ; identité via `getSessionProfile()` (`getInsurerAccount()` ajouté pour le rôle INSURER) ; vérifications d'appartenance (403) sur GET/PUT/DELETE des ressources scoped.
4. **Passer les routes user-scoped sur un client RLS** (client scoped JWT) ou au minimum ajouter les vérifications d'appartenance côté serveur. *(Vérifications serveur ajoutées ✅ — client RLS en P1)*
5. **`typescript.ignoreBuildErrors: false`** + corriger les 39 erreurs TS.
6. **Réintroduire des tests** (auth-guard, pricing/compare, services).

### P1 — Important
7. Verrouiller `/api/quotes?all=true` et l'exposition des `personal_data`/`vehicle_data`.
8. ~~Bannir `image/svg+xml` dans `/api/insurer/logo`~~ ✅ **FAIT** : seuls PNG/JPG/WebP acceptés ; suppression du header `x-user-id`.
9. Corriger ou déprécier les routes backups (base SQLite supprimée).
10. Exiger une validation admin pour le rôle INSURER.
11. Commiter le travail de migration en attente (196 D + 66 M + 11 D) après revue.

### P2 — Améliorations
12. Supprimer le code mort (§5) et les deps inutilisées.
13. Réactiver progressivement ESLint et `reactStrictMode`.
14. Nettoyer les fichiers parasites du dépôt + `.gitignore` (`db/custom.db`, `supabase/.temp/`).
15. Mettre à jour le README (Prisma/SQLite → Supabase).

### Corrigé hors plan
- **`/api/insurer/stats` renvoyait 500** (erreur PostgREST `PGRST108`) : le filtre `.eq("offer.insurer_id", …)` exigeait `offer` embarqué dans le `select` ; corrigé sur les requêtes count et `recentQuotes` (validation : 200 OK avec session assureur).

---

*Audit généré le 06/08/2026 — vérifié par exécution : tsc (39 erreurs), eslint (2+3), vitest (0 test), build (OK via ignoreBuildErrors), scan secrets, audit manuel des 56 routes et 22 migrations.*
