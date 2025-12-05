# 🛠️ Correction de l'erreur IPT_PLACES_FORMULA

## 🎯 Problème

L'erreur `invalid input value for enum coverage_calculation_type: "IPT_PLACES_FORMULA"` (code PostgreSQL `22P02`) se produisait lors de la création de garanties de type "Individuelle personnes transportées" car la valeur `IPT_PLACES_FORMULA` manquait dans l'énumération PostgreSQL.

## 🔧 Solution appliquée

### 1. Migration SQL créée
Fichier : [`supabase/migrations/20251204220000_add_ipt_places_formula_to_enum.sql`](supabase/migrations/20251204220000_add_ipt_places_formula_to_enum.sql)

```sql
-- Add the missing IPT_PLACES_FORMULA value to the coverage_calculation_type enum
ALTER TYPE public.coverage_calculation_type 
ADD VALUE 'IPT_PLACES_FORMULA';
```

### 2. Script de test
Fichier : [`test_ipt_places_formula.js`](test_ipt_places_formula.js)

## 🚀 Comment appliquer la solution

### Étape 1 : Appliquer la migration sur Supabase

1. **Via l'interface Supabase Dashboard** :
   - Connectez-vous à votre projet Supabase
   - Allez dans la section "SQL Editor"
   - Copiez-collez le contenu de [`20251204220000_add_ipt_places_formula_to_enum.sql`](supabase/migrations/20251204220000_add_ipt_places_formula_to_enum.sql)
   - Exécutez la requête

2. **Via la ligne de commande (si vous avez le CLI Supabase)** :
   ```bash
   supabase db push
   ```

### Étape 2 : Vérifier que la migration fonctionne

1. **Exécuter le script de test** :
   ```bash
   # Installer les dépendances si nécessaire
   npm install @supabase/supabase-js
   
   # Configurer les variables d'environnement
   export VITE_SUPABASE_URL="votre-url-supabase"
   export VITE_SUPABASE_ANON_KEY="votre-anon-key"
   
   # Exécuter le test
   node test_ipt_places_formula.js
   ```

2. **Vérifier manuellement dans l'interface** :
   - Allez dans la page d'administration des tarifications
   - Créez une nouvelle garantie
   - Sélectionnez "Individuelle personnes transportées (FORMULE 1)"
   - Remplissez les champs obligatoires
   - Cliquez sur "Créer la garantie"
   - L'erreur ne devrait plus apparaître

## 📋 Résultat attendu

Après application de la migration :
- ✅ Plus d'erreur `22P02` lors de la création de garanties IPT_PLACES_FORMULA
- ✅ L'interface d'administration permet de créer des garanties "Individuelle personnes transportées"
- ✅ La logique de calcul existante fonctionne correctement
- ✅ Cohérence restaurée entre le frontend et la base de données

## 🔍 Vérification

Pour vérifier que la migration est bien appliquée, vous pouvez exécuter cette requête SQL dans Supabase :

```sql
-- Vérifier les valeurs de l'énumération
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'coverage_calculation_type'
)
ORDER BY enumlabel;
```

Vous devriez voir `IPT_PLACES_FORMULA` dans la liste des valeurs.

## 🚨 En cas de problème

Si l'erreur persiste après la migration :

1. **Vérifiez que la migration a bien été appliquée** avec la requête SQL ci-dessus
2. **Redémarrez votre application** pour vider les caches éventuels
3. **Vérifiez les permissions** de votre utilisateur Supabase
4. **Contactez le support** si le problème continue

## 📚 Contexte technique

- **Type d'erreur** : PostgreSQL `22P02` (invalid_text_representation)
- **Cause** : Valeur manquante dans l'énumération `coverage_calculation_type`
- **Impact** : Blocage de la création de garanties de type IPT
- **Solution** : Ajout de la valeur manquante via `ALTER TYPE ... ADD VALUE`

---

🎉 **La migration est maintenant prête à être appliquée pour résoudre définitivement ce problème !**