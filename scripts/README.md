# Scripts de Base de Données Noli

Ce dossier contient des scripts pour créer et vérifier les données de test pour votre application Noli.

## 📁 Scripts Disponibles

### 1. `create-test-users.js` (Node.js)
Script JavaScript pour créer des comptes utilisateurs de test via l'API Supabase.

**Prérequis:**
```bash
npm install @supabase/supabase-js
```

**Configuration:**
1. Allez sur [Dashboard Supabase](https://supabase.com/dashboard/project/bcrixajuomtbfjvtgubb)
2. Settings → API
3. Copiez la clé "service_role"
4. Modifiez le script et remplacez `VOTRE_SERVICE_ROLE_KEY`

**Exécution:**
```bash
node scripts/create-test-users.js
```

**Comptes créés:**
- `admin@noli.com` (Admin) - `Admin123!`
- `assureur1@noli.com` (Assureur) - `Assureur123!`
- `assureur2@noli.com` (Assureur) - `Assureur123!`
- `user1@noli.com` (Utilisateur) - `User123!`
- `user2@noli.com` (Utilisateur) - `User123!`

### 2. `create-test-users.sql` (SQL)
Script SQL pour créer des utilisateurs de test directement dans la base de données.

**⚠️ Attention:** Ce script nécessite des privilèges d'admin sur `auth.users`.

**Exécution:**
1. Via la console SQL du dashboard Supabase
2. Ou avec un client PostgreSQL ayant les droits nécessaires

```sql
-- Copiez-collez le contenu du fichier dans la console SQL
```

### 3. `verify-seed-data.sql` (SQL)
Script de vérification pour confirmer que toutes les données ont été correctement insérées.

**Exécution:**
```sql
-- Exécutez ce script dans la console SQL pour vérifier l'état de la base de données
```

## 🗄️ État Actuel de la Base de Données

### Migrations Appliquées
- ✅ `001_create_auth_tables.sql` - Tables d'authentification
- ✅ `002_create_indexes.sql` - Index de performance
- ✅ `003_enable_rls.sql` - Row Level Security
- ✅ `005_create_log_functions.sql` - Fonctions de logging
- ✅ `006_create_auth_functions.sql` - Fonctions d'authentification
- ✅ `007_seed_data.sql` - Données de test

### Données de Seed
- 📊 **Categories d'assurance:** Auto, Habitation, Santé, Vie
- 🏢 **Assureurs:** 4 compagnies fictives (AssurPro, SecuHome, AutoSecure, SantéPlus)
- 📋 **Offres d'assurance:** 4 offres de démonstration
- 🔍 **Logs d'audit:** Exemples pour test

### Fonctions Disponibles
- `log_user_action()` - Enregistre les actions dans les logs
- `log_user_action_safe()` - Version avec gestion d'erreurs
- `handle_new_user()` - Crée automatiquement un profil à l'inscription
- `create_password_reset_token()` - Génère un token de reset
- `use_password_reset_token()` - Valide un token de reset
- `get_user_profile()` - Récupère un profil avec permissions
- `get_user_permissions()` - Retourne les permissions selon le rôle
- `user_has_permission()` - Vérifie une permission spécifique
- `log_user_login()` - Trigger pour les connexions
- `log_user_logout()` - Trigger pour les déconnexions

## 🚀 Guide d'Utilisation Rapide

### 1. Configuration Initiale
```bash
# Vérifier que les migrations sont à jour
supabase migration list

# Appliquer les dernières migrations si nécessaire
supabase db push
```

### 2. Création des Utilisateurs de Test
**Option A - Script JavaScript (recommandé):**
```bash
# Installer les dépendances
npm install @supabase/supabase-js

# Configurer la clé service_role dans le script
# Puis exécuter
node scripts/create-test-users.js
```

**Option B - Script SQL:**
```bash
# Copier le contenu de scripts/create-test-users.sql
# Le coller dans la console SQL du dashboard Supabase
# Exécuter
```

### 3. Vérification
```bash
# Copier le contenu de scripts/verify-seed-data.sql
# Le coller dans la console SQL
# Exécuter pour vérifier toutes les données
```

### 4. Test de l'Application
1. Démarrer l'application: `npm run dev`
2. Se connecter avec les comptes de test
3. Vérifier que les rôles et permissions fonctionnent correctement

## 🔧 Personnalisation

### Ajouter de Nouveaux Utilisateurs
Modifiez le tableau `testUsers` dans `create-test-users.js` ou ajoutez des appels à `create_test_user()` dans le script SQL.

### Ajouter de Nouvelles Données de Test
Modifiez `supabase/migrations/007_seed_data.sql` pour ajouter d'autres données de test.

## 📝 Notes Important

- Les mots de passe des utilisateurs de test sont simples pour faciliter le développement
- En production, utilisez des mots de passe forts et une politique de sécurité stricte
- Les utilisateurs sont créés avec `email_confirm=true` pour éviter les étapes de validation
- Les fonctions de logging utilisent `SECURITY DEFINER` avec gestion d'erreurs pour éviter les blocages

## 🆘 Dépannage

### Problèmes Communs
1. **Erreur "function does not exist"**: Vérifiez que les migrations 005 et 006 sont appliquées
2. **Erreur de permissions**: Assurez-vous d'utiliser la clé `service_role` pour créer des utilisateurs
3. **Migration conflict**: Utilisez `supabase migration repair` pour résoudre les conflits

### Commandes Utiles
```bash
# Vérifier l'état des migrations
supabase migration list

# Réparer une migration
supabase migration repair --status [applied|reverted] [version]

# Réinitialiser la base de données locale
supabase db reset

# Pousser les migrations
supabase db push
```