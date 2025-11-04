# 📋 Guide de Déploiement - Module Admin NOLI Assurance

## 🚀 Vue d'ensemble

Ce guide couvre le déploiement complet du module d'administration amélioré pour NOLI Assurance avec :
- ✅ Connexion Supabase réelle
- ✅ Dashboard interactif avec graphiques
- ✅ Notifications en temps réel
- ✅ Système d'audit complet
- ✅ Tests d'intégration automatisés

## 📋 Prérequis

### Environnement
- **Node.js** 18+
- **npm** 9+
- **Supabase** avec permissions admin
- **Accès** à la base de données

### Variables d'Environnement
Configurez votre fichier `.env.local` :

```bash
# Supabase (Obligatoire)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application (Optionnel)
VITE_APP_NAME=NOLI Assurance
VITE_APP_VERSION=2.0.0
VITE_ENABLE_ADMIN_FEATURES=true
```

## 🛠️ Étapes de Déploiement

### 1. Installation et Configuration

```bash
# Cloner le projet
git clone <repository-url>
cd noli

# Installer les dépendances
npm ci

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos configurations Supabase
```

### 2. Migration de la Base de Données

**⚠️ Important :** Ces étapes nécessitent un accès admin à Supabase

#### Option A: Via la Console Supabase
1. Allez dans `Supabase Dashboard > SQL Editor`
2. Exécutez les fichiers SQL dans l'ordre :
   ```sql
   -- 1. Créer les tables admin
   -- Copier/coller le contenu de : migrations/admin_audit_tables.sql

   -- 2. Créer les fonctions RPC
   -- Copier/coller le contenu de : migrations/admin_rpc_functions.sql
   ```

#### Option B: Via le Script Automatisé
```bash
# Lancer l'aide aux migrations
npm run admin:migrate
```

### 3. Tests d'Intégration

```bash
# Exécuter les tests admin
npm run admin:test
```

Le script va tester :
- ✅ Connexion Supabase
- ✅ Fonctions RPC admin
- ✅ Tables admin
- ✅ Abonnements temps réel
- ✅ Gestion utilisateurs
- ✅ Système d'audit
- ✅ Permissions et rôles

### 4. Build et Déploiement

#### Développement
```bash
# Lancer le serveur de développement avec dashboard admin
npm run admin:dev
```

#### Production
```bash
# Build complet avec tests
npm run admin:build

# Ou déploiement automatisé
npm run admin:deploy
```

### 5. Vérification Post-Déploiement

1. **Accéder au dashboard** : `http://localhost:5173/admin`
2. **Se connecter** avec un compte admin
3. **Vérifier les fonctionnalités** :
   - 📊 Dashboard avec graphiques
   - 🔔 Notifications temps réel
   - 👥 Gestion utilisateurs
   - 📋 Logs d'audit
   - 📈 Analytics

## 🔧 Configuration Avancée

### Supabase RLS (Row Level Security)

Les politiques de sécurité sont déjà configurées dans les migrations :

```sql
-- Exemple: Politique pour les logs d'audit
CREATE POLICY "Admins can view all audit logs" ON audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'ADMIN'
        AND is_active = true
    )
);
```

### WebSocket Configuration

Les notifications temps réel utilisent les abonnements Supabase :

```typescript
// Le système écoute automatiquement :
- profiles (création, modification)
- quotes (création, mise à jour)
- system_alerts (nouvelles alertes)
- audit_logs (logs critiques)
```

### Performance Optimisation

Le dashboard inclut :
- **Lazy loading** des composants
- **Cache intelligent** avec React Query
- **Pagination** pour les grandes listes
- **Debounce** pour les recherches
- **Optimisation bundle** avec Vite

## 📊 Fonctionnalités Déployées

### 🎯 Dashboard Interactif
- **Graphiques en temps réel** avec Recharts
- **Métriques plateforme** actualisées automatiquement
- **Filtres temporels** (7J, 30J, 90J)
- **Export de rapports** (CSV, JSON, PDF)

### 🔔 Notifications Temps Réel
- **Activités utilisateur** instantanées
- **Alertes système** critiques
- **Métriques en direct** (CPU, mémoire, uptime)
- **Gestion des notifications** (dismiss, actions)

### 👥 Gestion Utilisateurs
- **CRUD complet** avec validations
- **Opérations groupées** (bulk actions)
- **Export CSV** des données
- **Statistiques détaillées**

### 🔍 Audit et Sécurité
- **Logs complets** de toutes les actions
- **67+ permissions** granulaires
- **6 rôles prédéfinis** (Super Admin, Admin, etc.)
- **Alertes sécurité** automatiques

### 📈 Analytics Avancés
- **Statistiques démographiques**
- **Analytics par appareil**
- **Taux de conversion**
- **Tendances temporelles**

## 🚨 Dépannage

### Problèmes Communs

#### 1. Erreur de connexion Supabase
```bash
Error: "Variables Supabase manquantes"
```
**Solution**: Vérifiez `.env.local` et redémarrez le serveur

#### 2. Fonctions RPC non trouvées
```bash
Error: "function admin_get_platform_stats does not exist"
```
**Solution**: Appliquez les migrations SQL `admin_rpc_functions.sql`

#### 3. Permissions refusées
```bash
Error: "Permission denied for table audit_logs"
```
**Solution**: Vérifiez que l'utilisateur a le rôle `ADMIN` dans `profiles`

#### 4. Notifications temps réel ne fonctionnent pas
```bash
Warning: "Abonnement temps réel échoué"
```
**Solution**: Vérifiez la connexion internet et les permissions RLS

### Logs et Debug

**Activer le mode debug** :
```bash
VITE_DEBUG=true npm run admin:dev
```

**Vérifier la console** pour les erreurs WebSocket et React Query

### Performance

**Monitorer les performances** :
- Utilisez l'onglet "Temps réel" pour les métriques système
- Surveillez les temps de réponse des API
- Vérifiez l'utilisation mémoire du navigateur

## 🔄 Maintenance

### Tâches Quotidiennes
- ✅ Vérifier les alertes système
- ✅ Surveiller les performances
- ✅ Review des logs d'audit critiques

### Tâches Hebdomadaires
- 📊 Générer les rapports analytics
- 💾 Nettoyer les anciens logs
- 🔄 Vérifier les sauvegardes

### Tâches Mensuelles
- 📈 Review des métriques plateforme
- 🔐 Audit de sécurité
- 📝 Mise à jour documentation

## 📚 Support

### Documentation Technique
- **Code source** : `src/features/admin/`
- **Composants** : `src/features/admin/components/`
- **Services** : `src/features/admin/services/`
- **Types** : `src/types/admin.d.ts`

### Scripts Utiles
```bash
# Test complet d'intégration
npm run admin:test

# Déploiement automatisé
npm run admin:deploy

# Build avec validation
npm run admin:build
```

### Contacts
- **Développeur Admin** : @admin-agent
- **Support Technique** : Créer un ticket dans le dashboard admin
- **Documentation** : `/docs` dans l'application

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Migrations SQL appliquées
- [ ] Tests d'intégration passés (100%)
- [ ] Build généré sans erreurs
- [ ] Dashboard accessible sur `/admin`
- [ ] Notifications temps réel fonctionnelles
- [] Graphiques analytics affichés
- [] Logs d'audit opérationnels
- [ ] Permissions admin validées
- [ ] Monitoring santé système actif

🎉 **Félicitations !** Votre module Admin NOLI est maintenant déployé avec toutes les fonctionnalités avancées !