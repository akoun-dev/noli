# 🚀 CI/CD Pipeline Documentation

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Workflows GitHub Actions](#workflows-github-actions)
- [Hooks Git locaux](#hooks-git-locaux)
- [Scripts npm](#scripts-npm)
- [Variables d'environnement](#variables-denvironnement)
- [Déploiement](#déploiement)
- [Notifications](#notifications)
- [Dépannage](#dépannage)

## Vue d'ensemble

Le pipeline CI/CD de Noli Assurance est conçu pour assurer la qualité du code, automatiser les tests et faciliter les déploiements. Il se compose de :

- **CI (Continuous Integration)** : Validation automatique à chaque push/PR
- **CD (Continuous Deployment)** : Déploiement automatisé vers staging/production
- **Qualité** : Lint, tests, sécurité, et analyse de performance
- **Notifications** : Alertes Slack/Discord/email en cas de succès ou d'échec

## 🔄 Workflows GitHub Actions

### 1. CI Pipeline (`ci.yml`)

**Déclencheurs :**
- Push sur `main` et `develop`
- Pull requests vers `main` et `develop`

**Jobs :**

#### Lint
- ESLint avec rapport JSON
- Prettier check
- Commentaire PR avec résultats ESLint

#### Security Audit
- Audit npm
- Analyse CodeQL
- Vérification des vulnérabilités

#### Tests
- Tests unitaires sur Node 18 et 20
- Couverture de code
- Upload des résultats vers Codecov

#### E2E Tests
- Tests Playwright
- Upload rapports et vidéos

#### Build
- Build de production
- Analyse de la taille du bundle
- Upload des artefacts

#### Bundle Analysis
- Analyse du bundle pour les PRs
- Commentaire PR avec recommandations

### 2. Deploy Application (`deploy.yml`)

**Déploiement Staging :**
- Déclenché : push sur `develop`
- Tests de smoke
- Déploiement Vercel

**Déploiement Production :**
- Déclenché : push sur `main`
- Tests complets
- Build optimisé
- Déploiement Vercel
- Tests de smoke complets
- Création de release GitHub

**Rollback :**
- Déclenché automatiquement en cas d'échec
- Rollback Vercel
- Vérification du rollback

### 3. Dependencies & Security (`dependencies.yml`)

**Tâches hebdomadaires :**
- Mise à jour des dépendances
- Scan de sécurité (Snyk, Trivy)
- Analyse de qualité (SonarCloud)
- Tests de performance (Lighthouse)
- Vérification des licences

### 4. Notifications (`notify.yml`)

**Notifications multi-canaux :**
- Slack (webhook)
- Discord (embeds)
- Email (échecs critiques)

## 🪝 Hooks Git Locaux

### Pre-commit (`.husky/pre-commit`)

Vérifications avant chaque commit :

```bash
# 1. Lint-staged (formatage et lint)
npx lint-staged

# 2. Vérification des console.log
git diff --cached --name-only | xargs grep -l "console\.log"

# 3. Vérification des TODO sans ticket
git diff --cached --name-only | xargs grep -n "TODO"

# 4. Vérification des fichiers volumineux (>1MB)
git diff --cached --name-only | xargs du -k

# 5. TypeScript type check
npx tsc --noEmit --skipLibCheck

# 6. Synchronisation package-lock.json
npm ci --dry-run

# 7. Scan de données sensibles
git diff --cached --name-only | xargs grep -i "password\|secret\|token"
```

### Commit-msg (`.husky/commit-msg`)

Validation des messages de commit :

```bash
# 1. Commitlint (format conventional commits)
npx commitlint --edit $1

# 2. Vérification de la longueur minimale (10 caractères)
# 3. Référence de ticket recommandée
# 4. Interdiction des commits WIP/fixup/squash
```

### Pre-push (`.husky/pre-push`)

Vérifications avant chaque push :

```bash
# 1. Tests unitaires
npm run test:run

# 2. Build (branches develop/main)
npm run build

# 3. Tests E2E (branche main)
npm run test:e2e

# 4. Vérification des modifications non commitées
git status --porcelain
```

## 📜 Scripts npm

### Développement
```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run build:dev        # Build de développement
npm run build:analyze    # Build + analyse bundle
npm run preview          # Preview build local
```

### Qualité
```bash
npm run lint             # ESLint
npm run lint:fix         # ESLint + auto-fix
npm run format           # Prettier format
npm run format:check     # Vérification format
npm run type-check       # TypeScript type check
```

### Tests
```bash
npm run test             # Vitest watch
npm run test:run         # Tests unitaires
npm run test:coverage    # Tests + couverture
npm run test:e2e         # Tests E2E
npm run test:all         # Tous les tests
npm run test:ci          # Tests CI (lint + coverage + build)
```

### Sécurité et Dépendances
```bash
npm run security:audit  # Audit sécurité
npm run deps:update     # Mise à jour dépendances
npm run deps:check      # Vérification dépendances obsolètes
```

### Git
```bash
npm run pre-commit      # Lint-staged
npm run pre-push        # Tests avant push
npm run commit          # Commit interactif (commitizen)
npm run release         # Release (standard-version)
```

## 🔧 Variables d'environnement

### GitHub Secrets requis

#### Déploiement
- `VERCEL_TOKEN` : Token API Vercel
- `VERCEL_ORG_ID` : ID organisation Vercel
- `VERCEL_PROJECT_ID` : ID projet staging
- `PRODUCTION_PROJECT_ID` : ID projet production

#### Supabase
- `STAGING_SUPABASE_URL` : URL staging
- `STAGING_SUPABASE_ANON_KEY` : Clé staging
- `PRODUCTION_SUPABASE_URL` : URL production
- `PRODUCTION_SUPABASE_ANON_KEY` : Clé production

#### Notifications
- `SLACK_WEBHOOK_URL` : Webhook Slack
- `DISCORD_WEBHOOK_URL` : Webhook Discord
- `EMAIL_USERNAME` : Email SMTP
- `EMAIL_PASSWORD` : Mot de passe SMTP
- `NOTIFICATION_EMAIL` : Email pour notifications

#### Sécurité
- `SONAR_TOKEN` : Token SonarCloud
- `SNYK_TOKEN` : Token Snyk
- `LHCI_GITHUB_APP_TOKEN` : Token Lighthouse CI

### Variables d'environnement locales

```bash
# .env.local
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_supabase
```

## 🚀 Déploiement

### Workflow de Déploiement

1. **Feature Branch → PR**
   - Tests CI complets
   - Review code
   - Merge vers `develop`

2. **Develop → Staging**
   - Déploiement automatique sur `develop`
   - Tests de smoke
   - Notification Slack

3. **Main → Production**
   - Merge vers `main`
   - Tests complets
   - Build optimisé
   - Déploiement production
   - Tests de smoke
   - Création release

### Environnements

#### Staging (`develop`)
- URL : `https://staging.noli.ci`
- Base de données test
- Configuration staging Supabase
- Déploiement automatique

#### Production (`main`)
- URL : `https://noli.ci`
- Base de données production
- Configuration production Supabase
- Déploiement automatique avec validation

### Rollback

Le rollback est automatiquement déclenché en cas d'échec :
- Détection d'échec de déploiement
- Rollback Vercel automatique
- Vérification du rollback
- Notification des équipes

## 📢 Notifications

### Slack

**Messages envoyés :**
- ✅ Succès CI/CD
- ❌ Échecs CI/CD
- 🚀 Déploiements
- 🔀 Pull requests
- 📦 Mises à jour de dépendances

**Configuration :**
1. Créer un webhook Slack
2. Ajouter `SLACK_WEBHOOK_URL` aux secrets GitHub
3. Personnaliser les messages dans `.github/workflows/notify.yml`

### Discord

**Embeds envoyés :**
- Résultats CI/CD
- Déploiements
- Statistiques des builds

**Configuration :**
1. Créer un webhook Discord
2. Ajouter `DISCORD_WEBHOOK_URL` aux secrets GitHub

### Email

**Notifications d'échec critique :**
- Échecs de déploiement production
- Vulnérabilités critiques
- Échecs de sécurité

## 🔧 Dépannage

### Problèmes Courants

#### Pre-commit hooks échouent
```bash
# Désactiver temporairement (non recommandé)
git commit --no-verify

# Forcer l'installation de Husky
npm run prepare

# Mettre à jour les hooks
rm -rf .husky
npm run prepare
```

#### Tests échouent dans CI
```bash
# Tests locaux
npm run test:ci

# Debug tests
npm run test:run -- --reporter=verbose

# Tests spécifiques
npm run test:run -- --grep "test name"
```

#### Déploiement échoue
```bash
# Vérifier la configuration Vercel
vercel list

# Logs de déploiement
vercel logs

# Build local en mode production
npm run build && npm run preview
```

### Configuration Locale

#### Installer les dépendances de développement
```bash
# Complète
npm install

# Développement uniquement
npm install --save-dev
```

#### Initialiser Git hooks
```bash
# Réinitialiser Husky
npm run prepare

# Manuel
npx husky install
```

#### Nettoyer le cache
```bash
# Nettoyer cache npm
npm cache clean --force

# Nettoyer cache Vite
rm -rf node_modules/.vite

# Réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Debug

#### Activer les logs détaillés
```bash
# Logs de build
DEBUG=vite:* npm run build

# Logs de tests
DEBUG=vitest:* npm run test

# Logs de Husky
HUSKY_DEBUG=1 git commit
```

#### Vérifier la configuration
```bash
# Configuration ESLint
npx eslint --print-config

# Configuration TypeScript
npx tsc --showConfig

# Configuration Playwright
npx playwright --version
```

## 📋 Checklist

### Avant de committer
- [ ] Code linté (`npm run lint:fix`)
- [ ] Code formaté (`npm run format`)
- [ ] Tests passent (`npm run test:run`)
- [ ] Type check OK (`npm run type-check`)
- [ ] Pas de console.log
- [ ] Messages de commit valides

### Avant de déployer
- [ ] Tests CI passent
- [ ] Build local OK (`npm run build`)
- [ ] Tests E2E OK (`npm run test:e2e`)
- [ ] Variables d'environnement configurées
- [ ] Secrets GitHub à jour

### Après déploiement
- [ ] Vérifier l'application en ligne
- [ ] Consulter les logs de déploiement
- [ ] Tests de smoke manuels
- [ ] Monitorer les erreurs
- [ ] Vérifier les performances

---

*Document maintenu par l'équipe Noli Assurance*
*Dernière mise à jour : 18 octobre 2024*