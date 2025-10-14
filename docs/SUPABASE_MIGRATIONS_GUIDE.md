# 📋 Guide Complet des Migrations Supabase

Ce guide explique comment lancer les migrations Supabase pour configurer complètement le système d'authentification NOLI Assurance.

## 🚀 **Prérequis**

### 1. Compte Supabase
- Un compte actif sur [https://supabase.com](https://supabase.com)
- Un projet créé avec votre base de données PostgreSQL

### 2. Accès nécessaires
- URL de votre projet Supabase
- Clé API (anon key et service role key)
- Accès à l'interface d'administration ou CLI

## 📁 **Structure des Migrations**

```
supabase/migrations/
├── 001_create_auth_tables.sql     # Création des tables de base
├── 002_create_indexes.sql         # Indexes et contraintes
├── 003_enable_rls.sql            # Row Level Security
├── 004_create_functions.sql      # Fonctions et triggers
└── 005_seed_data.sql             # Données de test
```

## 🔄 **Méthodes d'Exécution**

### Méthode 1: Interface Supabase Dashboard (Recommandée)

**Étape 1: Connexion**
1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu latéral

**Étape 2: Exécution séquentielle**
⚠️ **IMPORTANT**: Exécutez les fichiers dans cet ordre EXACT pour éviter les erreurs de dépendance :

1. **001_create_auth_tables.sql**
   ```sql
   -- Crée les tables de base (profiles, user_sessions, etc.)
   -- Copiez-collez tout le contenu du fichier
   -- Cliquez sur "Run" et attendez la fin de l'exécution
   ```

2. **002_create_indexes.sql**
   ```sql
   -- Crée les indexes et contraintes
   -- Attendez la fin complète de la migration 1 avant d'exécuter
   ```

3. **003_enable_rls.sql**
   ```sql
   -- Active le Row Level Security (sécurité)
   -- Doit être exécuté après les tables et indexes
   ```

4. **004_create_functions.sql**
   ```sql
   -- Crée les fonctions et triggers (très important!)
   -- Le seed (005) dépend de ces fonctions
   ```

5. **005_seed_data.sql**
   ```sql
   -- Crée les comptes de test
   -- Utilise les fonctions créées dans 004
   ```

**⚠️ ERREUR COURANTE**: Si vous voyez l'erreur `function public.log_user_action() does not exist`, cela signifie que la migration 004 n'a pas été exécutée avant la 005.

### Méthode 2: Supabase CLI (Avancée)

**Installation**
```bash
# Installer Supabase CLI
npm install -g supabase

# Ou via brew (macOS)
brew install supabase/tap/supabase
```

**Configuration**
```bash
# Se connecter à Supabase
supabase login

# Lier le projet local
supabase link --project-ref votre-projet-id
```

**Exécution**
```bash
# Exécuter toutes les migrations
supabase db push

# Ou exécuter fichier par fichier
supabase db reset  # Réinitialise et exécute tout
```

### Méthode 3: psql Direct (Experts)

**Connexion**
```bash
# Récupérer la chaîne de connexion depuis Supabase Dashboard
# Settings > Database > Connection string > URI

psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**Exécution**
```bash
# Exécuter chaque fichier
psql -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -f 001_create_auth_tables.sql
psql -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -f 002_create_indexes.sql
# ... etc
```

## 🔧 **Configuration Post-Migration**

### 1. Variables d'Environnement

Créez votre fichier `.env.local` :
```env
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon

# Autres configurations
VITE_APP_NAME=NOLI Assurance
VITE_DEBUG=true
```

### 2. Configuration des Mots de Passe

**Option A: Via l'interface (Recommandée)**
1. Allez dans Authentication > Users
2. Pour chaque utilisateur de test, cliquez sur "Reset password"
3. Entrez le mot de passe : `NoliTest2024!`

**Option B: Via SQL**
```sql
-- Exécutez cette requête dans le SQL Editor
UPDATE auth.users 
SET encrypted_password = crypt('NoliTest2024!', gen_salt('bf'))
WHERE email IN (
  'jean.konan@noli.com',
  'marie.toure@noli.com',
  'kouakou.bamba@noli.com',
  'contact@assurauto.ci',
  'admin@sunuassurance.ci',
  'commercial@nsia.ci',
  'admin@noliassurance.com'
);
```

## 👥 **Comptes de Test Créés**

### Utilisateurs (USER)
- **jean.konan@noli.com** - Jean Konan (particulier standard)
- **marie.toure@noli.com** - Marie Toure (profil complet)
- **kouakou.bamba@noli.com** - Kouakou Bamba (jeune professionnel)

### Assureurs (INSURER)
- **contact@assurauto.ci** - AssurAuto CI
- **admin@sunuassurance.ci** - Sunu Assurance CI
- **commercial@nsia.ci** - NSIA Banque Assurance

### Administrateur (ADMIN)
- **admin@noliassurance.com** - Super Administrateur

**Mot de passe universel : `NoliTest2024!`**

## ✅ **Validation de l'Installation**

### 1. Test des Connexions
```bash
# Lancez l'application
npm run dev

# Testez chaque compte de test
```

### 2. Vérification des Tables
```sql
-- Vérifiez que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'user_sessions', 'password_reset_tokens', 'audit_logs');
```

### 3. Vérification des Données
```sql
-- Comptez les utilisateurs par rôle
SELECT role, COUNT(*) FROM public.profiles GROUP BY role;

-- Vérifiez les permissions
SELECT email, role FROM public.profiles ORDER BY role, email;
```

### 4. Test des Fonctions
```sql
-- Testez la fonction de permissions
SELECT * FROM public.get_user_permissions(
  (SELECT id FROM public.profiles WHERE email = 'jean.konan@noli.com' LIMIT 1)
);
```

## 🚨 **Dépannage**

### Erreurs Courantes

**1. "Relation does not exist"**
- Cause: Les migrations n'ont pas été exécutées dans l'ordre
- Solution: Réexécutez les migrations dans l'ordre chronologique

**2. "Permission denied"**
- Cause: L'utilisateur n'a pas les droits nécessaires
- Solution: Utilisez le service role key ou l'interface admin

**3. "Function does not exist"**
- Cause: La migration 004 n'a pas été exécutée
- Solution: Exécutez 004_create_functions.sql

**4. "RLS policy exists"**
- Cause: Tentative de réexécuter une migration
- Solution: Utilisez `DROP POLICY IF EXISTS` avant recréation

### Logs et Debug

**Activer les logs Supabase:**
1. Allez dans Settings > Database
2. Activez "Database Logging"
3. Consultez les logs en temps réel

**Debug dans l'application:**
```typescript
// Dans votre navigateur, ouvrez la console
import { testAuthConfig } from '@/utils/authTest';

// Test de configuration
await testAuthConfig();
```

## 🔄 **Réinitialisation Complète**

Si vous devez recommencer :

```sql
-- Supprimez toutes les tables (DANGER!)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimez les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_user_action() CASCADE;
-- ... etc

-- Recommencez les migrations depuis 001
```

## 📞 **Support**

- **Documentation Supabase**: [https://supabase.com/docs](https://supabase.com/docs)
- **Issues du projet**: Créez une issue sur GitHub
- **Support technique**: support@noliassurance.com

---

## 🎉 **Prochaines Étapes**

Une fois les migrations terminées :

1. ✅ Testez toutes les connexions
2. ✅ Vérifiez les permissions par rôle
3. ✅ Testez les guards de route
4. ✅ Validez l'audit des actions
5. 🚀 Déployez en production !

**Votre système d'authentification NOLI Assurance est prêt !** 🎊
