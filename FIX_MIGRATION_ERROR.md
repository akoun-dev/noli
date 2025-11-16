# Correction rapide de l'erreur de migration

## Problème
La migration `20250116000002_add_missing_rpc_functions.sql` contenait des erreurs de syntaxe SQL qui ont empêché son exécution.

## Solution immédiate

Le fichier de migration a été corrigé avec la syntaxe SQL appropriée. Maintenant appliquez la commande :

```bash
# Continuer la migration
supabase db push
```

Si l'erreur persiste, vous pouvez aussi :

```bash
# Forcer la reapplication de la migration
supabase db reset --no-seed
# Ou
rm supabase/migrations/20250116000002_add_missing_rpc_functions.sql
supabase db push
```

## Vérification

Après correction, testez que les fonctions sont bien créées :

```sql
-- Vérifier les fonctions RPC
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%admin%'
OR routine_name LIKE '%coverage%';

-- Test simple
SELECT * FROM test_auth_users_access();
```

## Résultat attendu
- ✅ Plus d'erreurs de syntaxe SQL
- ✅ Toutes les fonctions RPC correctement créées
- ✅ Dashboard admin fonctionnel