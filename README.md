# Noli — Comparateur d'assurances

[![Coverage](public/badges/coverage.svg)](https://github.com/your-org/noli)

Plateforme de comparaison d'assurances multi-assureurs avec interface admin, espace utilisateur et tableau de bord assureur.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **Base de données / Auth** : PostgreSQL natif (Docker en développement) + authentification applicative locale
- **UI** : Tailwind CSS v4 + shadcn/ui
- **State** : Zustand
- **Validation** : Zod v4
- **Tests** : Vitest + Testing Library + @vitest/coverage-v8

Les migrations natives sont dans `db/migrations/`. La base de développement se
lance avec `docker compose -f docker-compose.dev.yml up -d postgres`, puis se
prépare avec `npm run db:migrate` et `npm run db:seed`.

## Configuration

Copier `.env.example` en `.env` et renseigner `DATABASE_URL` ainsi que
`AUTH_SESSION_SECRET`. Les variables SMTP/Resend sont optionnelles en local.

Les anciennes migrations Supabase sont conservées comme référence historique.
Les migrations exécutées par l'application se trouvent dans `db/migrations/`.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm dev` | Lance le serveur de développement |
| `npm run build` | Build de production |
| `npm run test` | Exécute les tests unitaires |
| `npm run test:coverage` | Exécute les tests avec rapport de couverture |
| `npm run test:coverage:badge` | Génère le rapport de couverture + le badge SVG |
| `npm run lint` | Vérification ESLint |

## Structure du projet

```ini
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
npm run test

# Avec rapport de couverture
npm run test:coverage

# Avec badge de couverture
npm run test:coverage:badge
```

Le badge de couverture est généré localement dans `public/badges/coverage.svg` et mis à jour via la commande `test:coverage:badge`.
