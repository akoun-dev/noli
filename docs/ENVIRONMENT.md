# Configuration Environnement - NOLI Assurance

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Variables d'environnement](#variables-denvironnement)
3. [Configuration par environnement](#configuration-par-environnement)
4. [Sécurité](#sécurité)
5. [Déploiement](#déploiement)
6. [Dépannage](#dépannage)

## Vue d'ensemble

Le projet NOLI Assurance utilise un système de configuration par environnement basé sur les variables d'environnement Vite. Chaque environnement (développement, staging, production) a sa propre configuration.

### Structure des fichiers

```
noli/
├── .env.example              # Template de configuration
├── .env.local                # Configuration développement (local)
├── .env.staging              # Configuration staging
├── .env.production           # Configuration production
└── scripts/
    └── setup-env.sh          # Script d'initialisation
```

## Variables d'environnement

### 🔧 Configuration Supabase

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Description**: Configuration du backend Supabase pour l'authentification et la base de données.

### 🚀 Configuration Application

```bash
VITE_APP_NAME=NOLI Assurance
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Plateforme de comparaison d'assurances auto
VITE_APP_URL=http://localhost:8080
```

**Description**: Informations générales sur l'application.

### 📧 Configuration Emails

```bash
VITE_EMAIL_FROM=noreply@noli.ci
VITE_EMAIL_SUPPORT=support@noli.ci
VITE_EMAIL_REPLY_TO=contact@noli.ci
```

**Description**: Configuration des adresses email pour les notifications système.

### 💳 Configuration Stripe

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_WEBHOOK_SECRET=whsec_...
```

**Description**: Clés API Stripe pour les paiements (test/production).

### 📊 Configuration Analytics

```bash
VITE_GA_ID=G-XXXXXXXXXX
VITE_GTM_ID=GTM-XXXXXXX
```

**Description**: Configuration Google Analytics et Google Tag Manager.

### 🛡️ Configuration Sentry

```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Description**: Configuration du monitoring d'erreurs et de performance.

### 🔐 Configuration Sécurité

```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_CORS_ORIGIN=http://localhost:8080
```

**Description**: Configuration des URLs API et des origines CORS.

## Configuration par environnement

### 🧹 Développement (.env.local)

- **URL**: `http://localhost:8080`
- **Mode**: `development`
- **Sentry**: Activé avec sampling 100%
- **Logs**: Niveau `debug`
- **Features**: Toutes les fonctionnalités activées

### 🧪 Staging (.env.staging)

- **URL**: `https://staging.noli.ci`
- **Mode**: `staging`
- **Sentry**: Activé avec sampling 50%
- **Logs**: Niveau `info`
- **Features**: Fonctionnalités de production

### 🚀 Production (.env.production)

- **URL**: `https://noli.ci`
- **Mode**: `production`
- **Sentry**: Activé avec sampling 10%
- **Logs**: Niveau `error`
- **Features**: Fonctionnalités activées uniquement si stables

## Sécurité

### 🔒 Protection des données sensibles

1. **Jamais commiter les fichiers `.env*` dans Git**
2. **Utiliser des clés différentes pour chaque environnement**
3. **Rotation régulière des clés API**
4. **Utiliser des secrets GitHub Actions pour le CI/CD**

### 🛡️ Variables sensibles

Les variables suivantes sont considérées comme sensibles:
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_*`
- `VITE_SENTRY_DSN`
- `VITE_TWILIO_*`

### 📋 .gitignore

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.staging
.env.production
```

## Déploiement

### 🚀 Script de configuration automatique

Utilisez le script d'initialisation pour configurer rapidement votre environnement:

```bash
./scripts/setup-env.sh
```

### 🔄 Variables du CI/CD

Dans votre pipeline CI/CD, configurez les variables d'environnement:

**GitHub Actions**:
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
  VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
```

**Vercel**:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### 📦 Build process

Le build utilise les variables d'environnement appropriées selon le mode:

```bash
# Développement
npm run dev                    # Utilise .env.local

# Staging
npm run build --mode staging   # Utilise .env.staging

# Production
npm run build                  # Utilise .env.production
```

## Dépannage

### 🔧 Problèmes courants

#### 1. Variables non chargées

**Symptôme**: Les variables d'environnement retournent `undefined`

**Solution**:
```bash
# Vérifier que le fichier .env.local existe
ls -la .env.local

# Redémarrer le serveur de développement
npm run dev
```

#### 2. Erreur de connexion Supabase

**Symptôme**: `Failed to connect to Supabase`

**Solution**:
```bash
# Vérifier les identifiants Supabase
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Tester la connexion
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
     "$VITE_SUPABASE_URL/rest/v1/"
```

#### 3. Sentry ne fonctionne pas

**Symptôme**: Aucune erreur n'apparaît dans Sentry

**Solution**:
```bash
# Vérifier la configuration Sentry
echo $VITE_SENTRY_DSN
echo $VITE_SENTRY_ENVIRONMENT

# Vérifier le build inclut Sentry
npm run build
```

#### 4. Erreur CORS

**Symptôme**: `Access-Control-Allow-Origin` error

**Solution**:
```bash
# Vérifier les origines CORS
echo $VITE_CORS_ORIGIN

# S'assurer que l'origine est incluse dans la configuration Supabase
```

### 🐛 Debug des variables

Pour vérifier que les variables sont bien chargées:

```typescript
// Dans un composant ou service
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Environment:', import.meta.env.MODE);
console.log('All env vars:', import.meta.env);
```

### 📊 Monitoring

Utilisez les outils de monitoring pour vérifier la configuration:

```bash
# Vérifier le build
npm run build

# Vérifier les tests
npm run test:run

# Vérifier la couverture
npm run test:coverage

# Vérifier la performance
npm run test:performance
```

## Bonnes pratiques

### ✅ À faire

1. **Documenter** les variables spécifiques à votre projet
2. **Valider** les configurations avant le déploiement
3. **Utiliser** des clés différentes par environnement
4. **Surveiller** les erreurs de configuration
5. **Mettre à jour** la documentation lors des changements

### ❌ À ne pas faire

1. **Commettre** les fichiers `.env*` dans Git
2. **Utiliser** les clés de production en développement
3. **Partager** les clés API publiquement
4. **Ignorer** les erreurs de configuration
5. **Oublier** de documenter les nouvelles variables

## Support

Pour toute question sur la configuration d'environnement:

1. Consultez la documentation technique: `docs/ARCHITECTURE.md`
2. Vérifiez les scripts: `scripts/setup-env.sh`
3. Testez avec différents environnements
4. Contactez l'équipe de support si nécessaire