# Architecture NOLI (état réel)

> Source de vérité de l'organisation du code. Tout nouveau code se range ici ; si rien ne convient, on met d'abord ce document à jour.
> Mesuré le 2026-10-05 sur la branche `2.0.0` (245 fichiers `.ts/.tsx` sous `src/`).

## Stack
Next.js 16 (App Router) · TypeScript strict · Supabase (Postgres + Auth) · Tailwind v4 + shadcn/ui · Zustand · React Query · Zod v4 · Vitest. Build `output: standalone`, prod **nginx + PM2** (port 8080).

## Couches (séparation respectée ✅)
Chaîne de dépendance **unidirectionnelle**, sans cycle :

```
Interface (écrans/composants)  →  Routes API (/api/*)  →  Services métier (src/lib)  →  Accès données (src/lib/db.ts)
        src/components                 src/app/api              src/lib                     Supabase (service_role)
```

- **Un composant n'accède JAMAIS directement à la base** (vérifié : 0 import de `@/lib/db` ou `supabase` sous `src/components`). Les écrans appellent `/api/*` via `fetch`/`fetchWithTimeout`/React Query.
- `src/lib/db.ts` est importé par ~71 fichiers, **exclusivement** sous `src/app/api/**` et `src/lib/**`.
- `src/lib/**` n'importe jamais `src/components/**`. Graphe lib→lib acyclique.

## Arborescence `src/`
| Dossier | Couche | Rôle |
|---|---|---|
| `src/app/` | Interface + API | `page/layout/[...slug]/error/not-found` + `src/app/api/**` (~80 route handlers par domaine : admin, auth, insurer, user, contact, notifications, offers, quotes, compare, claims, reviews, stats, health, seed) |
| `src/components/` | Interface | Par domaine : about, admin (+settings), auth, comparison, contact, insurer (+tabs), landing, layout, legal, offers, results, shared, **ui** (shadcn vendored), user (+tabs) |
| `src/lib/` | Logique métier + accès données | `db.ts` (service_role), `auth-guard.ts` / `auth-actions.ts` (auth, session), `pricing-service.ts` / `compare-service.ts` / `insurer-offers-mapper.ts` (tarif/comparaison), `validation.ts` (Zod), `security.ts`, `rate-limit.ts`, `audit.ts`, `notifications.ts`, `email.ts`, `generate-pdf.ts`, `backups.ts`, `quotes-reconcile.ts`, `password-policy.ts`, `pagination.ts`, `utils.ts`, `constants.ts`, `fetch-with-timeout.ts` |
| `src/store/` | État client | `app-store.ts` (Zustand + persist ; pas de données personnelles persistées) |
| `src/hooks/` | Logique UI | `use-mobile.ts`, `use-toast.ts` |
| `src/types/` | Types partagés | types du domaine |

## Règles de rangement
- **Interface** → `src/components/<domaine>/`. Un composant = une responsabilité. Pas d'accès données direct.
- **Logique métier / calcul** → `src/lib/` (service) ou `src/hooks/` (logique d'UI).
- **Accès données** → uniquement via `src/lib/db.ts` (serveur) dans les routes `/api/*` et services. Un module par source.
- **Design system** → tokens dans `src/app/globals.css` (voir DECISIONS.md : `tailwind.config.ts` est hérité/mort). Pas de couleur en dur.
- **Base** → toute modif de schéma = migration versionnée dans `supabase/migrations/`.

## Sécurité (transversale)
`db` = service_role qui contourne la RLS → l'autorisation est **100 % applicative** (`requireAuth`/`requireRole`/ownership). Identité toujours issue de la session (anti-IDOR). Détails dans `CLAUDE.md`.

## Dette structurelle connue (voir STATUS.md pour les chiffres)
- 38 fichiers > 300 lignes (plusieurs composants « tab » > 1000 l) à découper au fil des touches.
- Duplication ~7,6 % (jscpd).
- Double système de thème (globals.css v4 = vérité ; `tailwind.config.ts` v3 = mort).
