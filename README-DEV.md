# 🚀 Noli Assurance - Guide de Développement

## Table des matières

- [Démarrage rapide](#démarrage-rapide)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Développement](#développement)
- [Tests](#tests)
- [CI/CD](#cicd)
- [Conventions de code](#conventions-de-code)
- [Dépannage](#dépannage)

## Démarrage rapide

```bash
# Cloner le projet
git clone <repository-url>
cd noli

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:8080`

## Prérequis

- **Node.js** 18.0 ou supérieur
- **npm** 8.0 ou supérieur
- **Git** pour le contrôle de version

## Installation

### 1. Cloner le projet
```bash
git clone <repository-url>
cd noli
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer avec vos configurations
vim .env.local
```

### 4. Initialiser Git hooks
```bash
npm run prepare
```

### 5. Démarrer le développement
```bash
npm run dev
```

## Scripts disponibles

### 🛠️ Développement
```bash
npm run dev              # Serveur de développement (localhost:8080)
npm run build            # Build de production
npm run build:dev        # Build de développement
npm run preview          # Preview build local
npm run build:analyze    # Build + analyse du bundle
```

### 🔍 Qualité
```bash
npm run lint             # ESLint
npm run lint:fix         # ESLint + corrections automatiques
npm run format           # Prettier formatage
npm run format:check     # Vérification du format
npm run type-check       # Vérification TypeScript
```

### 🧪 Tests
```bash
npm run test             # Tests unitaires (watch mode)
npm run test:run         # Tests unitaires (single run)
npm run test:coverage    # Tests + couverture
npm run test:ui          # Interface graphique des tests
npm run test:e2e         # Tests E2E
npm run test:e2e:ui      # Interface graphique E2E
npm run test:all         # Tous les tests
npm run test:ci          # Tests complets pour CI
```

### 🔒 Sécurité
```bash
npm run security:audit  # Audit de sécurité
npm run deps:update     # Mise à jour dépendances
npm run deps:check      # Vérification dépendances obsolètes
```

### 📝 Git
```bash
npm run pre-commit      # Hooks pre-commit manuels
npm run pre-push        # Tests avant push
npm run commit          # Commit interactif
npm run release         # Création de release
```

## Structure du projet

```
noli/
├── .github/workflows/         # Workflows GitHub Actions
│   ├── ci.yml                # Pipeline CI
│   ├── deploy.yml            # Pipeline de déploiement
│   ├── dependencies.yml      # Gestion dépendances
│   └── notify.yml            # Notifications
├── .husky/                   # Git hooks locaux
│   ├── pre-commit           # Hooks pre-commit
│   ├── commit-msg           # Validation messages
│   └── pre-push             # Tests avant push
├── docs/                     # Documentation
├── public/                   # Fichiers statiques
├── src/                      # Code source
│   ├── components/           # Composants React
│   ├── features/             # Fonctionnalités métier
│   ├── contexts/             # Contextes React
│   ├── hooks/                # Hooks personnalisés
│   ├── lib/                  # Utilitaires
│   ├── pages/                # Pages
│   ├── services/             # Services API
│   └── types/                # Types TypeScript
├── tests/                    # Tests E2E
├── coverage/                 # Rapports de couverture
├── dist/                     # Build de production
├── .env.example              # Exemple variables d'environnement
├── .eslintrc.cjs             # Configuration ESLint
├── .gitignore                # Fichiers ignorés par Git
├── .lintstagedrc.json        # Configuration lint-staged
├── .prettierrc               # Configuration Prettier
├── commitlint.config.js      # Configuration messages de commit
├── package.json              # Dépendances et scripts
├── playwright.config.ts      # Configuration Playwright
├── tsconfig.json             # Configuration TypeScript
├── vite.config.ts            # Configuration Vite
└── vitest.config.ts          # Configuration Vitest
```

## Développement

### 🌟 Nouvelle fonctionnalité

1. **Créer une branche**
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   ```

2. **Développer**
   - Utiliser les composants existants
   - Suivre les conventions de code
   - Ajouter les tests nécessaires

3. **Tester**
   ```bash
   npm run test:run
   npm run type-check
   npm run lint
   ```

4. **Committer**
   ```bash
   git add .
   npm run commit  # Commit interactif avec validation
   ```

5. **Push et PR**
   ```bash
   git push origin feature/nouvelle-fonctionnalite
   ```

### 📝 Conventions de commit

Utiliser les commits conventionnels :

```bash
feat: ajouter la fonctionnalité de comparaison
fix: corriger le bug d'authentification
docs: mettre à jour la documentation
refactor: optimiser le service d'assurance
test: ajouter les tests pour le composant formulaire
build: mettre à jour Vite
chore: mettre à jour les dépendances
```

### 🔧 Hooks Git automatiques

**Pre-commit :**
- Lint et formatage automatiques
- Vérification TypeScript
- Scan de données sensibles
- Validation des TODO

**Commit-msg :**
- Format des messages (conventional commits)
- Longueur minimale
- Référence de ticket recommandée

**Pre-push :**
- Tests unitaires
- Build de validation
- Tests E2E (branche main)

## Tests

### 🧪 Tests unitaires

```bash
# Lancer tous les tests
npm run test

# Watch mode
npm run test:watch

# Couverture
npm run test:coverage

# Tests spécifiques
npm run test:run -- --grep "AuthService"
```

### 🎭 Tests E2E

```bash
# Lancer tous les tests E2E
npm run test:e2e

# Mode graphique
npm run test:e2e:ui

# Mode debug
npm run test:e2e:debug

# Tests spécifiques
npx playwright test auth.spec.ts
```

### 📊 Rapports de couverture

Les rapports sont générés dans `coverage/` :
- `index.html` : Rapport interactif
- `lcov.info` : Format pour CI
- `coverage-final.json` : Données brutes

## CI/CD

### 🔄 Pipeline CI

Déclenché sur :
- Push sur `main` et `develop`
- Pull requests

Étapes :
1. **Lint** : ESLint + Prettier
2. **Sécurité** : Audit + CodeQL
3. **Tests** : Unitaires + E2E
4. **Build** : Production + analyse
5. **Analyse** : Bundle size + qualité

### 🚀 Déploiement

**Staging (develop) :**
- Déploiement automatique
- Tests de smoke
- URL : `https://staging.noli.ci`

**Production (main) :**
- Validation complète
- Build optimisé
- Tests de smoke
- URL : `https://noli.ci`

### 📢 Notifications

- **Slack** : Succès/échecs CI/CD
- **Discord** : Embeds détaillés
- **Email** : Échecs critiques

## Conventions de code

### 📏 Style Guide

- **ESLint** : `npm run lint`
- **Prettier** : `npm run format`
- **TypeScript** : Mode strict activé

### 🏗️ Architecture

- **Feature-based** : Code organisé par fonctionnalités
- **Components** : Réutilisables et testables
- **Hooks** : Logique personnalisée
- **Services** : API et logique métier

### 📁 Nommage

- **Fichiers** : `kebab-case`
- **Composants** : `PascalCase`
- **Variables** : `camelCase`
- **Constants** : `UPPER_SNAKE_CASE`
- **Types** : `PascalCase`

### 🔧 Bonnes pratiques

- **Hooks** : Privilégier les hooks personnalisés
- **Typage** : TypeScript strict
- **Tests** : Couverture minimum 70%
- **Documentation** : JSDoc pour les fonctions complexes

## Dépannage

### Problèmes courants

#### 🚫 Pre-commit hooks échouent
```bash
# Désactiver temporairement (non recommandé)
git commit --no-verify

# Réinitialiser les hooks
npm run prepare
```

#### 🧪 Tests échouent localement
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Mode debug
DEBUG=vitest:* npm run test
```

#### 🏗️ Build échoue
```bash
# Vérifier les variables d'environnement
cat .env.local

# Build verbose
DEBUG=vite:* npm run build
```

#### 🎭 Tests E2E échouent
```bash
# Réinitialiser Playwright
npx playwright install

# Mode headed pour debug
npm run test:e2e:headed
```

### 🔧 Configuration locale

#### Variables d'environnement
```bash
# .env.local
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_supabase
```

#### Configuration ESLint
```bash
# Vérifier la configuration
npx eslint --print-config

# Ignorer temporairement des fichiers
echo "dist/" >> .eslintignore
```

#### Configuration TypeScript
```bash
# Vérifier la configuration
npx tsc --showConfig

# Mise à jour des types
npm update @types/react @types/react-dom
```

### 📋 Checklist avant commit

- [ ] Code linté (`npm run lint:fix`)
- [ ] Code formaté (`npm run format`)
- [ ] Tests passent (`npm run test:run`)
- [ ] Type check OK (`npm run type-check`)
- [ ] Pas de console.log dans le code
- [ ] Messages de commit valides
- [ ] Documentation mise à jour

### 🆘 Obtenir de l'aide

1. **Consulter la documentation** : `CI-CD.md`
2. **Vérifier les issues GitHub** : Issues et discussions
3. **Contacter l'équipe** : Slack ou Discord
4. **Debug pas à pas** : Activer les logs détaillés

---

*Pour plus d'informations, consultez la [documentation complète](./CI-CD.md)*

*Équipe Noli Assurance - Dernière mise à jour : 18 octobre 2024*