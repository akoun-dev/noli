# Instructions pour corriger les erreurs Supabase

## Problèmes identifiés

1. **Erreur enum profile_role 'ANONYMOUS'** : Les fonctions RPC référençaient une valeur `ANONYMOUS` qui n'existe pas dans l'enum
2. **Erreur de type json/jsonb dans system_health_check** : Incompatibilité entre le type de retour attendu (json) et défini (jsonb)
3. **Erreur 403 Forbidden sur les policies** : Permissions RLS (Row Level Security) incorrectes

## Corrections apportées

### 1. Migration des fonctions RPC corrigées
Fichier : `supabase/migrations/20250116000000_fix_rpc_functions.sql`

**Corrections :**
- Remplacement de `role != 'ANONYMOUS'` par `role IN ('USER', 'INSURER', 'ADMIN')`
- Correction du type de retour de `system_health_check` de `JSONB` vers `JSON`
- Ajout de casts explicites pour garantir la compatibilité des types
- Reconstruction complète des fonctions problématiques

### 2. Migration des politiques RLS corrigées
Fichier : `supabase/migrations/20250116000001_fix_rls_policies.sql`

**Corrections :**
- Suppression des politiques existantes qui causaient des conflits
- Création de nouvelles politiques RLS complètes et cohérentes
- Ajout de permissions appropriées pour les rôles ADMIN, INSURER, et USER
- Création de fonctions utilitaires `is_admin()` et `is_insurer()`

## Application des corrections

### Étape 1 : Appliquer les migrations

Exécutez les commandes suivantes pour appliquer les migrations à votre base de données Supabase :

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou si vous préférez appliquer les migrations manuellement
# 1. Copiez le contenu de 20250116000000_fix_rpc_functions.sql
# 2. Exécutez-le dans l'éditeur SQL de Supabase
# 3. Copiez le contenu de 20250116000001_fix_rls_policies.sql
# 4. Exécutez-le dans l'éditeur SQL de Supabase
```

### Étape 2 : Vérifier l'application

Après avoir appliqué les migrations, vérifiez que :

1. **Les fonctions RPC sont disponibles** :
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('get_platform_statistics', 'get_user_activity_breakdown', 'system_health_check');
   ```

2. **Les politiques RLS sont actives** :
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Testez les fonctions** :
   ```sql
   -- Test system_health_check
   SELECT * FROM system_health_check();

   -- Test get_platform_statistics
   SELECT * FROM get_platform_statistics(30);

   -- Test get_user_activity_breakdown
   SELECT * FROM get_user_activity_breakdown(7);
   ```

### Étape 3 : Redémarrer l'application

Après avoir appliqué les corrections, redémarrez votre application pour que les changements soient pris en compte :

```bash
npm run dev
```

## Résultats attendus

Après l'application de ces corrections, vous ne devriez plus voir les erreurs suivantes dans la console :

- ✅ `POST https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/rpc/get_user_activity_breakdown 400 (Bad Request)`
- ✅ `POST https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/rpc/get_platform_statistics 400 (Bad Request)`
- ✅ `POST https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/rpc/system_health_check 400 (Bad Request)`
- ✅ `HEAD https://pmlmljfqxlpazabumgqf.supabase.co/rest/v1/policies?select=* 403 (Forbidden)`

## Dépannage

Si les erreurs persistent après avoir appliqué les migrations :

1. **Vérifiez que les migrations ont été correctement appliquées** dans le dashboard Supabase
2. **Rafraîchissez le token JWT** en vous déconnectant et reconnectant
3. **Vérifiez les permissions de l'utilisateur** dans la table `profiles`
4. **Consultez les logs Supabase** pour d'éventuelles erreurs supplémentaires

## Support

Si vous rencontrez des problèmes lors de l'application de ces corrections :

1. Vérifiez la version de Supabase que vous utilisez
2. Assurez-vous d'avoir les permissions nécessaires sur la base de données
3. Consultez la documentation Supabase sur les RLS et les fonctions RPC