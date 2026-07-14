# Noli — Comparateur d'assurances

[![Coverage](public/badges/coverage.svg)](https://github.com/your-org/noli)

Plateforme de comparaison d'assurances multi-assureurs avec interface admin, espace utilisateur et tableau de bord assureur.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **Base de données** : SQLite (via Prisma)
- **UI** : Tailwind CSS v4 + shadcn/ui
- **State** : Zustand
- **Auth** : next-auth
- **Validation** : Zod v4
- **Tests** : Vitest + Testing Library + @vitest/coverage-v8

## Scripts

| Commande | Description |
|----------|-------------|
| `bun dev` | Lance le serveur de développement |
| `bun run build` | Build de production |
| `bun run test` | Exécute les tests unitaires |
| `bun run test:coverage` | Exécute les tests avec rapport de couverture |
| `bun run test:coverage:badge` | Génère le rapport de couverture + le badge SVG |
| `bun run lint` | Vérification ESLint |
| `bun run db:push` | Push le schéma Prisma vers la base |
| `bun run db:generate` | Génère le client Prisma |

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
