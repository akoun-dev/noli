# Noli — Comparateur d'assurances

[![Coverage](public/badges/coverage.svg)](https://github.com/your-org/noli)

Plateforme de comparaison d'assurances multi-assureurs avec interface admin, espace utilisateur et tableau de bord assureur.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript (strict)
- **Base de données** : Postgres via [Supabase](https://supabase.com) (`@supabase/supabase-js`, `@supabase/ssr`)
- **UI** : Tailwind CSS v4 + shadcn/ui
- **State** : Zustand
- **Auth** : Supabase Auth (cookies httpOnly, session côté serveur — voir `src/lib/auth-guard.ts`)
- **Validation** : Zod v4
- **Tests** : Vitest + Testing Library + @vitest/coverage-v8

## Configuration

Copier `.env.example` en `.env` et renseigner les variables Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) ainsi que `RESEND_API_KEY` pour l'envoi d'emails. Le schéma de base de données est géré via les migrations dans `supabase/migrations/`.

## Scripts

| Commande | Description |
|----------|-------------|
| `bun dev` / `npm run dev` | Lance le serveur de développement |
| `bun run build` / `npm run build` | Build de production (standalone) |
| `bun run start` / `npm run start` | Démarre le build de production |
| `bun run test` / `npm run test` | Exécute les tests unitaires |
| `bun run test:coverage` | Exécute les tests avec rapport de couverture |
| `bun run test:coverage:badge` | Génère le rapport de couverture + le badge SVG |
| `bun run lint` / `npm run lint` | Vérification ESLint |

> ℹ️ Il n'y a pas de scripts `db:push` / `db:generate` (pas de Prisma) : le schéma est appliqué via les migrations Supabase (`supabase/migrations/`), à exécuter avec la CLI Supabase (`supabase db push`).

## Structure du projet

```
src/
├── app/          # Routes Next.js (App Router) + API
├── components/   # Composants React (admin, insurer, user, shared, ui)
├── hooks/        # Hooks personnalisés
├── lib/          # Utilitaires, services, validation
├── store/        # Store Zustand
└── types/        # Types TypeScript
```

## Tests

```bash
# Exécuter tous les tests
bun run test

# Avec rapport de couverture
bun run test:coverage

# Avec badge de couverture
bun run test:coverage:badge
```

Le badge de couverture est généré localement dans `public/badges/coverage.svg` et mis à jour via la commande `test:coverage:badge`.
