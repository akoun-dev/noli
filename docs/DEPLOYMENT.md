# Guide de Déploiement - NOLI Assurance

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration](#configuration)
4. [Déploiement Local](#déploiement-local)
5. [Déploiement Staging](#déploiement-staging)
6. [Déploiement Production](#déploiement-production)
7. [Monitoring](#monitoring)
8. [Dépannage](#dépannage)

## Vue d'ensemble

NOLI Assurance utilise une architecture moderne avec plusieurs environnements de déploiement:

- **Développement**: `http://localhost:8080`
- **Staging**: `https://staging.noli.ci`
- **Production**: `https://noli.ci`

## Prérequis

### 🛠️ Outils requis

- **Node.js**: Version 18+
- **npm**: Version 9+
- **Git**: Pour la gestion du code source
- **Docker**: Pour les déploiements containerisés (optionnel)

### 🔑 Accès requis

- **Compte Supabase**: Configuration backend
- **Compte Sentry**: Monitoring des erreurs
- **Compte Stripe**: Traitements de paiement
- **Hébergeur**: Pour le déploiement production

## Configuration

### 1. Configuration initiale

```bash
# Cloner le projet
git clone https://github.com/your-org/noli-assurance.git
cd noli-assurance

# Exécuter le script de configuration
./scripts/setup-env.sh
```

### 2. Configuration des variables d'environnement

Copiez les fichiers d'environnement et adaptez-les:

```bash
# Copier les templates
cp .env.example .env.local
cp .env.example .env.staging
cp .env.example .env.production
```

Configurez les variables essentielles:

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### 3. Configuration des secrets

Configurez les secrets dans votre plateforme de CI/CD:

**GitHub Actions**:
```yaml
secrets:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
  STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
```

## Déploiement Local

### 🚀 Développement local

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Accéder à l'application
# http://localhost:8080
```

### 📦 Build local

```bash
# Build de développement
npm run build:dev

# Build de production
npm run build

# Preview du build
npm run preview
```

### 🧪 Tests locaux

```bash
# Tests unitaires
npm run test:run

# Tests E2E
npm run test:e2e

# Tests de performance
npm run test:performance
```

## Déploiement Staging

### 🚀 Méthode 1: Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer sur Vercel
vercel --prod
```

Configuration Vercel:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### 🚀 Méthode 2: Netlify

```bash
# Installer Netlify CLI
npm i -g netlify-cli

# Build et déploiement
npm run build
netlify deploy --prod --dir=dist
```

### 🚀 Méthode 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build Docker image
docker build -t noli-assurance .

# Déployer
docker run -p 80:80 noli-assurance
```

## Déploiement Production

### 🚀 Méthode 1: Vercel (Recommandé)

```bash
# Configuration Vercel pour production
vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "regions": ["cdg1"],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@stripe_publishable_key",
    "VITE_SENTRY_DSN": "@sentry_dsn"
  }
}
```

```bash
# Déploiement production
vercel --prod
```

### 🚀 Méthode 2: Serveur dédié

```bash
# Script de déploiement
#!/bin/bash
# scripts/deploy-production.sh

echo "🚀 Déploiement en production..."

# Build de production
npm run build

# Configuration du serveur
ssh user@server "cd /var/www/noli && git pull origin main"

# Upload des fichiers
rsync -avz --delete dist/ user@server:/var/www/noli/

# Redémarrer le service
ssh user@server "sudo systemctl reload nginx"

echo "✅ Déploiement terminé!"
```

### 🚀 Méthode 3: Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: noli-assurance
spec:
  replicas: 3
  selector:
    matchLabels:
      app: noli-assurance
  template:
    metadata:
      labels:
        app: noli-assurance
    spec:
      containers:
      - name: noli-assurance
        image: noli-assurance:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: noli-secrets
              key: supabase-url
```

## Monitoring

### 🛡️ Sentry Configuration

Le monitoring Sentry est configuré pour capturer:

- **Erreurs JavaScript** en temps réel
- **Performance** des transactions
- **Sessions Replay** pour le débogage
- **Métriques** personnalisées

Configuration Sentry dans `src/lib/sentry.ts`:

```typescript
export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};
```

### 📊 Performance Monitoring

Configuration Lighthouse CI:

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['https://noli.ci'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
  },
};
```

### 📈 Analytics Configuration

Google Analytics intégré pour le suivi:

- **Pages vues**
- **Événements personnalisés**
- **Taux de conversion**
- **Performance des pages**

## Dépannage

### 🔧 Problèmes courants

#### 1. Build échoue

**Symptôme**: Erreur pendant `npm run build`

**Solutions**:
```bash
# Vérifier les dépendances
npm audit

# Mettre à jour les dépendances
npm update

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

#### 2. Variables d'environnement manquantes

**Symptôme**: `undefined` pour certaines variables

**Solutions**:
```bash
# Vérifier les fichiers .env
ls -la .env*

# Redémarrer le serveur
npm run dev

# Vérifier les variables
echo $VITE_SUPABASE_URL
```

#### 3. Erreurs CORS

**Symptôme**: Erreur Cross-Origin dans la console

**Solutions**:
```bash
# Vérifier la configuration CORS
echo $VITE_CORS_ORIGIN

# Mettre à jour la configuration Supabase
# Dans le dashboard Supabase > Settings > API
```

#### 4. Sentry ne capture pas les erreurs

**Symptôme**: Aucune erreur n'apparaît dans Sentry

**Solutions**:
```bash
# Vérifier la configuration Sentry
echo $VITE_SENTRY_DSN
echo $VITE_SENTRY_ENVIRONMENT

# Vérifier que le build inclut Sentry
npm run build --mode production
```

### 🐛 Outils de débogage

```bash
# Vérifier les variables d'environnement
npm run build && echo "Build successful"

# Tests complets
npm run test:all

# Analyse de performance
npm run test:performance

# Analyse du bundle
npm run build --analyze
```

## Bonnes pratiques

### ✅ Avant déploiement

1. **Tests**: Exécutez tous les tests
2. **Build**: Vérifiez que le build fonctionne
3. **Performance**: Testez avec Lighthouse
4. **Sécurité**: Vérifiez les configurations
5. **Monitoring**: Configurez les outils de monitoring

### 🔄 Processus de déploiement

1. **Code Review**: Revue du code par l'équipe
2. **Tests**: Tests unitaires et E2E
3. **Staging**: Déploiement en staging
4. **Validation**: Validation de la version
5. **Production**: Déploiement en production
6. **Monitoring**: Surveillance post-déploiement

### 📋 Checklist de déploiement

- [ ] Tests unitaires passants
- [ ] Tests E2E passants
- [ ] Build réussi
- [ ] Variables d'environnement configurées
- [ ] Sécurité vérifiée
- [ ] Performance analysée
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

## Support

Pour toute question de déploiement:

1. **Documentation technique**: `docs/ARCHITECTURE.md`
2. **Configuration environnement**: `docs/ENVIRONMENT.md`
3. **Scripts de déploiement**: `scripts/`
4. **GitHub Issues**: Créer un ticket pour les problèmes
5. **Contact**: Équipe de support technique

## Maintenance

### 🔄 Mises à jour régulières

- **Dépendances**: `npm update` (mensuel)
- **Sécurité**: `npm audit` (hebdomadaire)
- **Performance**: `npm run test:performance` (mensuel)
- **Tests**: `npm run test:all` (chaque commit)

### 📊 Surveillance continue

- **Erreurs**: Dashboard Sentry
- **Performance**: Google Analytics
- **Disponibilité**: Uptime monitoring
- **Sécurité**: Alertes de sécurité