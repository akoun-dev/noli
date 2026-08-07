# Noli — Comparateur d'assurances

[![Coverage](public/badges/coverage.svg)](https://github.com/your-org/noli)

Plateforme de comparaison d'assurances multi-assureurs avec interface admin, espace utilisateur et tableau de bord assureur.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **Base de données / Auth** : Supabase (Postgres + Supabase Auth, migrations SQL dans `supabase/migrations/`)
- **UI** : Tailwind CSS v4 + shadcn/ui
- **State** : Zustand
- **Validation** : Zod v4
- **Tests** : Vitest + Testing Library + @vitest/coverage-v8

> ⚠️ Le projet a migré de Prisma/SQLite vers Supabase. La dépendance
> `next-auth` présente dans `package.json` n'est plus utilisée dans le code
> (l'authentification passe entièrement par Supabase Auth via
> `src/lib/auth-guard.ts`) — à retirer lors d'un prochain nettoyage de
> dépendances.

## Configuration

Copier `.env.example` en `.env` et renseigner les clés Supabase du projet
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) ainsi que `RESEND_API_KEY` pour les emails.

Les migrations SQL (schéma + policies RLS) se trouvent dans
`supabase/migrations/` et s'appliquent via la CLI Supabase
(`supabase db push` / `supabase migration up`, selon votre workflow).

## Scripts

| Commande | Description |
|----------|-------------|
| `bun dev` | Lance le serveur de développement |
| `bun run build` | Build de production |
| `bun run test` | Exécute les tests unitaires |
| `bun run test:coverage` | Exécute les tests avec rapport de couverture |
| `bun run test:coverage:badge` | Génère le rapport de couverture + le badge SVG |
| `bun run lint` | Vérification ESLint |

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
