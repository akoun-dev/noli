# Plan de Migration des Données Mockées

## État Actuel

L'application utilise principalement des données réelles de Supabase, mais il reste quelques utilisations de données mockées à migrer.

### Analyse Complète

#### 📁 Fichiers de données mockées restants
- `src/data/mock/users.ts` - Données de test utilisateurs (non utilisé en production)

#### 🔎 Utilisations de données mockées à migrer

1. **OfferListPage.tsx** (Ligne 45)
   - `mockOffers` - Offres d'assurance fictives
   - **Action**: Remplacer par les données du service `offerService`

2. **UserPoliciesPage.tsx** (Ligne 49)
   - `mockPolicies` - Contrats d'assurance fictifs
   - **Action**: Remplacer par les données du service `policyService`

3. **Services API avec fallback**
   - `comparisonHistoryService.ts` (Ligne 537)
   - `offerService.ts` (Ligne 714)
   - `quoteService.ts` (Ligne 962)
   - `backupService.ts` (Ligne 239)
   - **Statut**: Ces services utilisent déjà le `FallbackService` ✅

## Actions Requises

### 🎯 Priorité Haute

1. **Migrer OfferListPage.tsx**
   ```typescript
   // Remplacer
   const mockOffers = [...]

   // Par
   const { data: offers, isLoading, error } = useQuery({
     queryKey: ['offers'],
     queryFn: () => offerService.getOffers()
   })
   ```

2. **Migrer UserPoliciesPage.tsx**
   ```typescript
   // Remplacer
   const mockPolicies = [...]

   // Par
   const { data: policies, isLoading, error } = useQuery({
     queryKey: ['policies'],
     queryFn: () => policyService.getUserPolicies()
   })
   ```

### 📋 Priorité Moyenne

3. **Nettoyer les fichiers mock non utilisés**
   - Supprimer `src/data/mock/users.ts` s'il n'est utilisé que dans les tests
   - Conserver uniquement les mocks nécessaires pour les tests unitaires

4. **Valider le système Fallback**
   - S'assurer que tous les services utilisent `FallbackService`
   - Tester le comportement en cas d'erreur API

### 🔧 Priorité Basse

5. **Documenter les API endpoints**
   - Créer une documentation des services API
   - Documenter le format des données attendues

## Script de Migration

Exécuter le script de validation :
```bash
npm run validate:mock-migration
```

## Validation

Après migration :
1. ✅ Aucun fichier mock dans `src/data/mock/` (sauf pour les tests)
2. ✅ Aucune utilisation de mock dans le code source
3. ✅ Tous les services utilisent Supabase ou FallbackService
4. ✅ `VITE_MOCK_DATA=false` dans tous les environnements

## Sécurité

- ✅ Les services utilisent déjà Supabase avec RLS
- ✅ Les tokens sont stockés dans des cookies httpOnly
- ✅ CSP est configuré et actif
- ✅ Les hooks pré-commit empêchent les régressions