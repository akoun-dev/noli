# Guide de Déploiement Noli

Ce guide couvre le déploiement de l'application Noli selon les best practices Supabase.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration des environnements](#configuration-des-environnements)
3. [Déploiement de la base de données](#déploiement-de-la-base-de-données)
4. [Déploiement de l'application](#déploiement-de-lapplication)
5. [Monitoring et maintenance](#monitoring-et-maintenance)
6. [Dépannage](#dépannage)

## 🚀 Prérequis

### Outils requis
- Node.js 18+
- npm ou yarn
- Supabase CLI 2.45+
- Git

### Comptes requis
- Compte Supabase (https://supabase.com)
- Hébergement (Vercel, Netlify, etc.)

## 🔧 Configuration des environnements

### 1. Variables d'environnement

Copiez `.env.example` vers `.env.local` pour le développement :

```bash
cp .env.example .env.local
```

Configurez les variables obligatoires :

```bash
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_SUPABASE_SERVICE_KEY=votre_cle_service_role

# Application
VITE_APP_NAME=NOLI Assurance
VITE_APP_URL=http://localhost:5173
```

### 2. Configuration Supabase

Initialisez le projet Supabase :

```bash
# Connectez-vous à Supabase
supabase login

# Liez le projet
supabase link --project-ref votre-projet-id

# Vérifiez la connexion
supabase status
```

## 🗄️ Déploiement de la Base de Données

### 1. Appliquer les migrations

```bash
# Pousser les nouvelles migrations
supabase db push

# Appliquer les données de seed (développement)
supabase db reset
```

### 2. Gestion des environnements

**Développement :**
```bash
# Base de données locale
supabase start

# Réinitialiser avec les données de seed
supabase db reset
```

**Production :**
```bash
# Pousser les migrations vers la production
supabase db push

# Vérifier l'état
supabase migration list
```

### 3. Création des utilisateurs de test

```bash
# Option 1: Script Node.js
node scripts/create-test-users.js

# Option 2: Script SQL (via dashboard)
# Copier le contenu de scripts/create-test-users.sql
```

## 🚢 Déploiement de l'Application

### 1. Build de production

```bash
# Installer les dépendances
npm install

# Build pour la production
npm run build

# Preview local
npm run preview
```

### 2. Configuration de l'hébergement

**Vercel (recommandé) :**

1. Connectez votre repository GitHub
2. Configurez les variables d'environnement dans Vercel
3. Activez la détection automatique

Variables Vercel requises :
```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_APP_URL=https://votre-domaine.vercel.app
```

**Autres plateformes :**
Configurez les mêmes variables d'environnement et le build command `npm run build`.

### 3. DNS et Domaine

1. Configurez votre domaine personnalisé
2. Activez HTTPS automatiquement
3. Configurez les redirections si nécessaire

## 📊 Monitoring et Maintenance

### 1. Monitoring Supabase

Via le dashboard Supabase :
- **Database** : Performance, requêtes lentes
- **Authentication** : Connexions, erreurs
- **Storage** : Utilisation, quotas
- **Edge Functions** : Logs, erreurs

### 2. Monitoring Application

Configuration recommandée :
```bash
# Google Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry pour le tracking d'erreurs
VITE_SENTRY_DSN=https://your-sentry-dsn
```

### 3. Sauvegardes

Supabase gère automatiquement :
- Sauvegardes quotidiennes
- Point-in-time recovery (7 jours)
- Réplication géographique

### 4. Maintenance régulière

**Mensuel :**
- Vérifier les logs d'erreurs
- Mettre à jour les dépendances
- Surveiller les performances

**Trimestriel :**
- Audit de sécurité
- Nettoyage des données anciennes
- Optimisation des requêtes

## 🔧 Dépannage

### Problèmes courants

**1. Erreur de connexion Supabase**
```bash
# Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Tester la connexion
supabase status
```

**2. Erreur de migration**
```bash
# Réparer les migrations
supabase migration repair --status applied 004

# Repartir de zéro (développement uniquement)
supabase db reset
```

**3. Erreur de build**
```bash
# Nettoyer et reconstruire
rm -rf node_modules dist
npm install
npm run build
```

**4. Problèmes d'authentification**
```bash
# Vérifier les configurations RLS
supabase db shell --command "SELECT * FROM pg_policies WHERE tablename = 'profiles';"

# Tester les permissions
SELECT user_has_permission('read:own_profile');
```

### Commandes utiles

```bash
# Développement
supabase start          # Démarrer les services locaux
supabase db reset       # Réinitialiser la base de données
supabase db diff        # Voir les différences de schéma

# Production
supabase db push        # Pousser les migrations
supabase migration list # Vérifier l'état
supabase db dump        # Sauvegarder la base de données
```

### Support

- **Documentation Supabase** : https://supabase.com/docs
- **GitHub Issues** : https://github.com/supabase/supabase/issues
- **Discord** : https://discord.supabase.com

## 🚀 Checklist de déploiement

### Pré-déploiement
- [ ] Tests locaux passés
- [ ] Variables d'environnement configurées
- [ ] Migrations appliquées
- [ ] Données de seed chargées
- [ ] Build de production réussi

### Post-déploiement
- [ ] Application accessible
- [ ] Authentification fonctionnelle
- [ ] Base de données connectée
- [ ] Monitoring configuré
- [ ] HTTPS activé
- [ ] Domaine configuré

### Maintenance
- [ ] Logs surveillés
- [ ] Backups vérifiés
- [ ] Performance contrôlée
- [ ] Sécurité auditée

## 📚 Ressources additionnelles

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/projects/overview)
- [React + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Database Best Practices](https://supabase.com/docs/guides/database/webhooks)