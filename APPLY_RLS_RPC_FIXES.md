# Instructions pour corriger les erreurs RLS et RPC Supabase

## Problèmes identifiés

1. **Erreurs RLS (Row Level Security)** : Politiques récursives causant des boucles infinies
2. **Fonctions RPC manquantes** : Plusieurs fonctions utilisées dans le code n'existent pas
3. **Erreurs 403 Forbidden** : Permissions RLS incorrectes sur les tables
4. **Erreurs 400 Bad Request** : Types de données incompatibles dans les fonctions RPC

## Corrections disponibles

### 1. Migration principale RLS + RPC corrigées
Fichier : `supabase/migrations/20251116000000_fix_recursive_rls_and_rpc.sql`

**Corrections incluses :**
- ✅ Suppression de toutes les politiques RLS récursives
- ✅ Création de nouvelles politiques RLS non-récursives
- ✅ Fonctions helper simplifiées (`is_admin()`, `is_insurer()`)
- ✅ Fonctions RPC corrigées sans dépendances récursives
- ✅ Tables manquantes créées (`audit_logs`, `user_sessions`)
- ✅ Logging d'audit simplifié

### 2. Fonctions RPC manquantes ajoutées
Fichier : `supabase/migrations/20250116000002_add_missing_rpc_functions.sql`

**Fonctions ajoutées :**
- ✅ `get_available_coverages()` - Tarification des couvertures
- ✅ `calculate_coverage_premium()` - Calcul des primes
- ✅ `add_coverage_to_quote()` - Ajout de couverture à un devis
- ✅ `update_quote_coverage_premiums()` - Mise à jour des primes
- ✅ `calculate_quote_total_premium()` - Calcul de la prime totale
- ✅ `get_current_insurer_id()` - ID de l'assureur actuel
- ✅ `admin_create_user()` - Création d'utilisateur admin
- ✅ `admin_update_user()` - Mise à jour d'utilisateur admin
- ✅ `admin_delete_user()` - Suppression d'utilisateur admin
- ✅ `test_auth_users_access()` - Debug authentification

## Application des corrections

### Étape 1 : Appliquer les migrations dans l'ordre

Exécutez les migrations dans l'ordre chronologique :

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou appliquez manuellement dans le dashboard Supabase :
# 1. Copiez/collez le contenu de 20251116000000_fix_recursive_rls_and_rpc.sql
# 2. Exécutez-le dans l'éditeur SQL
# 3. Copiez/collez le contenu de 20250116000002_add_missing_rpc_functions.sql
# 4. Exécutez-le dans l'éditeur SQL
```

### Étape 2 : Vérifier l'application des migrations

Connectez-vous au dashboard Supabase et vérifiez :

```sql
-- Vérifier que les fonctions existent
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_platform_statistics',
    'get_user_activity_breakdown',
    'system_health_check',
    'get_available_coverages',
    'admin_create_user',
    'test_auth_users_access'
);

-- Vérifier que les politiques RLS existent
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Vérifier que les tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('audit_logs', 'user_sessions', 'profiles', 'quotes');
```

### Étape 3 : Tester les fonctions RPC

```sql
-- Test 1: Vérifier l'accès administrateur
SELECT * FROM test_auth_users_access();

-- Test 2: Statistiques de la plateforme
SELECT * FROM get_platform_statistics(30);

-- Test 3: Activité utilisateur
SELECT * FROM get_user_activity_breakdown(7);

-- Test 4: Santé du système
SELECT * FROM system_health_check();

-- Test 5: Couvertures disponibles
SELECT * FROM get_available_coverages('voiture', 3000000, 'all');
```

## Résultats attendus

Après application des corrections, vous ne devriez plus voir les erreurs suivantes :

### ❌ Erreurs qui disparaîtront :
- `POST https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/rpc/get_user_activity_breakdown 400 (Bad Request)`
- `POST https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/rpc/get_platform_statistics 400 (Bad Request)`
- `POST https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/rpc/system_health_check 400 (Bad Request)`
- `HEAD https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/policies?select=* 403 (Forbidden)`
- Erreurs de récursion infinie dans les politiques RLS

### ✅ Fonctionnalités qui fonctionneront :
- Dashboard admin avec statistiques
- Gestion des utilisateurs admin
- Système de tarification des assurances
- Logging d'audit des actions admin
- Calcul des primes et couvertures
- Accès aux données basé sur les rôles

## Dépannage

### Si les erreurs persistent :

1. **Vérifiez que les migrations ont été appliquées** :
   ```sql
   SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;
   ```

2. **Redémarrez votre application** après application des migrations

3. **Vérifiez les permissions** :
   ```sql
   SELECT * FROM pg_roles WHERE rolname = 'authenticated';
   ```

4. **Testez avec un nouvel onglet/incognito** pour éviter les problèmes de cache

5. **Consultez les logs Supabase** pour d'éventuelles erreurs SQL

### Pour les développeurs :

```typescript
// Tester l'accès RPC après corrections
import { supabase } from '@/lib/supabase'

// Test statistiques plateforme
const { data: stats, error: statsError } = await supabase.rpc('get_platform_statistics', { p_days_back: 30 })
console.log('Stats:', stats, 'Error:', statsError)

// Test activité utilisateur
const { data: activity, error: activityError } = await supabase.rpc('get_user_activity_breakdown', { p_days_back: 7 })
console.log('Activity:', activity, 'Error:', activityError)

// Test santé système
const { data: health, error: healthError } = await supabase.rpc('system_health_check')
console.log('Health:', health, 'Error:', healthError)
```

## Support

Si vous rencontrez des problèmes lors de l'application de ces corrections :

1. Vérifiez la version de Supabase que vous utilisez
2. Assurez-vous d'avoir les permissions administrateur sur la base de données
3. Appliquez les migrations une par une en vérifiant les erreurs
4. Consultez la documentation Supabase sur les RLS et les fonctions RPC

---

**Note importante** : Ces corrections sont conçues pour être appliquées dans un environnement de développement. Pour la production, testez d'abord sur une copie de la base de données.