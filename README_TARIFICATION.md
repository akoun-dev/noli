# 📊 Système de Tarification - NOLI Assurance

## 🎯 Vue d'ensemble

Le système de tarification de NOLI Assurance est une solution complète de gestion des garanties et tarifs pour les assurances automobiles. Il permet aux administrateurs de configurer finement les offres d'assurance tout en offrant une expérience fluide aux clients.

## 🏗️ Architecture Technique

```
src/
├── types/
│   └── tarification.d.ts          # Types TypeScript complets
├── features/tarification/
│   └── services/
│       ├── guaranteeService.ts    # Gestion des garanties/packages
│       └── pricingService.ts      # Calculs de tarification
├── pages/admin/
│   ├── AdminTarificationPage.tsx  # Interface admin complète
│   └── AdminOffersPage.tsx        # Intégration garanties
└── docs/
    └── TARIFICATION_ADMIN.md      # Guide détaillé
```

## 🔧 Composants Principaux

### 1. Types et Interfaces (`/src/types/tarification.d.ts`)

Types TypeScript définissant la structure des données :

```typescript
interface Guarantee {
  id: string;
  name: string;
  code: string;
  category: GuaranteeCategory;
  description: string;
  calculationMethod: CalculationMethodType;
  isOptional: boolean;
  isActive: boolean;
  rate?: number;
  minValue?: number;
  maxValue?: number;
  // ...
}

interface InsurancePackage {
  id: string;
  name: string;
  code: string;
  description: string;
  guarantees: string[];
  basePrice: number;
  totalPrice: number;
  // ...
}
```

### 2. Service de Gestion (`/src/features/tarification/services/guaranteeService.ts`)

Classe principale pour la gestion des garanties et packages :

```typescript
class GuaranteeService {
  // CRUD Garanties
  async getGuarantees(): Promise<Guarantee[]>
  async createGuarantee(data: GuaranteeFormData): Promise<Guarantee>
  async updateGuarantee(id: string, data: Partial<GuaranteeFormData>): Promise<Guarantee>
  async deleteGuarantee(id: string): Promise<void>

  // CRUD Packages
  async getPackages(): Promise<InsurancePackage[]>
  async createPackage(data: PackageFormData): Promise<InsurancePackage>

  // Configuration
  getGuaranteeCategories()
  getCalculationMethods()
}
```

### 3. Service de Tarification (`/src/features/tarification/services/pricingService.ts`)

Moteur de calcul des prix :

```typescript
class PricingService {
  static async calculatePrice(calculation: PricingCalculation): Promise<PricingResult>
  static quickCalculate(basePrice: number, guarantees: Array<{id: string; selected: boolean}>): number

  // 7 méthodes de calcul
  private static calculateFixedAmount()
  private static calculateRateOnSI()
  private static calculateRateOnNewValue()
  private static calculateMTPLTariff()
  private static calculateTCMTCLMatrix()
  private static calculateICIPTFormula()
  private static calculateConditionalRate()
}
```

## 💡 Méthodes de Calcul Disponibles

### 1. **FIXED_AMOUNT** - Montant Fixe
```typescript
// Prime fixe indépendante du véhicule
// Usage: Défense et Recours, Assistance
calculateFixedAmount(guarantee: Guarantee): number {
  return guarantee.rate || 0;
}
```

### 2. **RATE_ON_SI** - Taux sur Valeur Assurée
```typescript
// Pourcentage appliqué sur la valeur vénale
// Usage: Incendie, Vol
calculateRateOnSI(guarantee: Guarantee, vehicle: Vehicle): number {
  return (guarantee.rate / 100) * vehicle.values.venale;
}
```

### 3. **RATE_ON_NEW_VALUE** - Taux sur Valeur Neuve
```typescript
// Pourcentage appliqué sur la valeur neuve
// Usage: Bris de glaces
calculateRateOnNewValue(guarantee: Guarantee, vehicle: Vehicle): number {
  return (guarantee.rate / 100) * vehicle.values.neuve;
}
```

### 4. **MTPL_TARIFF** - Grille Responsabilité Civile
```typescript
// Basé sur la grille officielle RC
// Usage: Responsabilité Civile obligatoire
calculateMTPLTariff(vehicle: Vehicle): number {
  const rcEntry = grids.tarifRC.find(entry =>
    entry.category === vehicle.categoryCode &&
    entry.energy === vehicle.energy &&
    vehicle.fiscalPower >= entry.powerMin &&
    vehicle.fiscalPower <= entry.powerMax
  );
  return rcEntry ? rcEntry.prime : 0;
}
```

### 5. **TCM_TCL_MATRIX** - Matrice Tierce
```typescript
// Basé sur la grille TCM/TCL
// Usage: Tierce Complète, Tierce Collision
calculateTCMTCLMatrix(guarantee: Guarantee, vehicle: Vehicle, parameters: any): number {
  const guaranteeType = guarantee.category === 'TIERCE_COMPLETE' ? 'Tierce Complete' : 'Tierce Collision';
  const franchise = parameters.tierceFranchise || 0;

  const tcmEntry = grids.tarifTCMTCL.find(entry =>
    entry.category === vehicle.categoryCode &&
    entry.guaranteeType === guaranteeType &&
    vehicle.values.neuve >= entry.valueNeufMin &&
    vehicle.values.neuve <= entry.valueNeufMax &&
    entry.franchise === franchise
  );

  return tcmEntry ? (tcmEntry.rate / 100) * vehicle.values.neuve : 0;
}
```

### 6. **IC_IPT_FORMULA** - Formule IC/IPT
```typescript
// Basé sur la grille IC/IPT
// Usage: Individuelle Conducteur, Individuelle Passagers
calculateICIPTFormula(guarantee: Guarantee, vehicle: Vehicle, parameters: any): number {
  const type = guarantee.category === 'INDIVIDUELLE_CONDUCTEUR' ? 'IC' : 'IPT';
  const formula = parameters.icIptFormula || 1;
  const nbPlaces = type === 'IPT' ? vehicle.nbPlaces : 0;

  const icIptEntry = grids.tarifICIPT.find(entry =>
    entry.type === type &&
    entry.formula === formula &&
    (entry.nbPlaces === 0 || entry.nbPlaces === nbPlaces)
  );

  return icIptEntry ? icIptEntry.prime : 0;
}
```

### 7. **CONDITIONAL_RATE** - Taux Conditionnel
```typescript
// Taux variable selon conditions
// Usage: Vol avec conditions de valeur
calculateConditionalRate(guarantee: Guarantee, vehicle: Vehicle): number {
  const { condition, rateIfTrue, rateIfFalse } = guarantee.parameters;
  const conditionMet = this.evaluateCondition(condition, vehicle.values.venale);
  const rate = conditionMet ? (rateIfTrue || 1.1) : (rateIfFalse || 2.1);
  return (rate / 100) * vehicle.values.venale;
}
```

## 🎨 Interface d'Administration

### Accès
1. Connectez-vous en tant qu'administrateur
2. Menu `Tarification` → `/admin/tarification`

### Onglets disponibles

#### 1. **Garanties**
- **Création** : Formulaire complet avec toutes les méthodes de calcul
- **Liste** : Vue tabulaire avec filtres et recherche
- **Édition** : Modification des garanties existantes
- **Activation/Désactivation** : Gestion du statut

#### 2. **Packages**
- **Création** : Sélection des garanties et définition des prix
- **Liste** : Vue des packages avec garanties incluses
- **Prix** : Base et total calculé automatiquement
- **Restrictions** : Types de véhicules si applicable

#### 3. **Grilles**
- **Grille RC** : Responsabilité Civile par catégorie/puissance
- **Grille IC/IPT** : Formules par nombre de places
- **Grille TCM/TCL** : Taux par valeur et franchise
- **Tarifs fixes** : Montants fixes par garantie

#### 4. **Statistiques**
- **Utilisation** : Garanties les plus utilisées
- **Prix moyens** : Analyse des tarifs
- **Tendances** : Évolution dans le temps

## 🔗 Intégration avec les Offres

### Création d'offre avec garanties

```typescript
// Dans AdminOffersPage.tsx
const [selectedGuaranteeIds, setSelectedGuaranteeIds] = useState<string[]>([]);
const [selectedPackageId, setSelectedPackageId] = useState<string>('');
const [offerType, setOfferType] = useState<'TAILOR_MADE' | 'PACK'>('TAILOR_MADE');

// Calcul du prix en temps réel
const pricing = React.useMemo(() => {
  if (offerType === 'PACK' && selectedPackageId) {
    const pkg = packages.find(p => p.id === selectedPackageId);
    return pkg ? pkg.totalPrice : Number(formData.price) || 0;
  } else {
    const base = Number(formData.price) || 0;
    return pricingService.quickCalculate(base, selectedGuaranteeIds.map(id => ({ id, selected: true })));
  }
}, [formData.price, selectedGuaranteeIds, offerType, selectedPackageId, packages]);
```

### Double mode de création

1. **Sur mesure (TAILOR_MADE)**
   - Sélection manuelle des garanties
   - Prix calculé selon garanties choisies
   - Flexibilité maximale

2. **Package prédéfini (PACK)**
   - Sélection d'un package existant
   - Garanties automatiquement incluses
   - Prix prédéfini

## 📊 Données Initiales

### Garanties pré-configurées

| Code | Nom | Catégorie | Méthode de calcul | Valeur |
|------|-----|-----------|------------------|--------|
| RC | Responsabilité Civile | RESPONSABILITE_CIVILE | MTPL_TARIFF | - |
| DR | Défense et Recours | DEFENSE_RECOURS | FIXED_AMOUNT | 7,950 FCFA |
| IC | Individuelle Conducteur | INDIVIDUELLE_CONDUCTEUR | IC_IPT_FORMULA | - |
| INC | Incendie | INCENDIE | RATE_ON_SI | 0.8% |
| VOL | Vol | VOL | CONDITIONAL_RATE | 1.1%/2.1% |
| TDC | Tierce Complète | TIERCE_COMPLETE | TCM_TCL_MATRIX | - |

### Packages pré-configurés

| Nom | Prix | Garanties incluses |
|-----|------|-------------------|
| Plan Essentiel | 85,000 FCFA | RC + Défense et Recours |
| Plan Évolution | 180,000 FCFA | RC + DR + IC + IPT + Incendie + Bris de glaces |
| Plan Premium | 320,000 FCFA | 10 garanties couverture complète |
| Pick-up Pro | 240,000 FCFA | Spécialisé véhicules utilitaires |

## 🔄 Workflow d'utilisation

### 1. Configuration initiale
```
1. Accéder à /admin/tarification
2. Vérifier les garanties pré-configurées
3. Ajouter/Modifier des garanties si nécessaire
4. Configurer les packages
5. Tester les calculs
```

### 2. Création d'offre
```
1. Aller dans /admin/offers
2. "Nouvelle offre"
3. Remplir informations de base
4. Choisir le type (Sur mesure/Package)
5. Sélectionner garanties ou package
6. Vérifier le prix calculé
7. Publier l'offre
```

### 3. Exemple concret

**Scenario** : Offre "Auto Standard" pour véhicule catégorie 401

```typescript
// Véhicule
const vehicle = {
  categoryCode: '401',
  energy: 'Essence',
  fiscalPower: 8,
  nbPlaces: 5,
  values: {
    venale: 12000000,  // 12M FCFA
    neuve: 15000000    // 15M FCFA
  }
};

// Garanties sélectionnées (mode TAILOR_MADE)
const guarantees = ['RC', 'DR', 'VOL', 'TDC'];

// Calcul du prix
const result = await pricingService.calculatePrice({
  vehicle,
  guaranteeIds: guarantees,
  calculationMethod: 'TAILOR_MADE',
  parameters: {
    tierceFranchise: 250000  // 250k FCFA
  }
});

// Résultat attendu : ~770,295 FCFA
```

## 🛠️ Personnalisation

### Ajouter une nouvelle méthode de calcul

1. **Ajouter le type** dans `tarification.d.ts` :
```typescript
export type CalculationMethodType =
  | 'FIXED_AMOUNT'
  | 'RATE_ON_SI'
  | 'RATE_ON_NEW_VALUE'
  | 'MTPL_TARIFF'
  | 'TCM_TCL_MATRIX'
  | 'IC_IPT_FORMULA'
  | 'CONDITIONAL_RATE'
  | 'CUSTOM_METHOD';  // Nouvelle méthode
```

2. **Implémenter la logique** dans `pricingService.ts` :
```typescript
private static calculateCustomMethod(guarantee: Guarantee, vehicle: Vehicle): number {
  // Logique personnalisée
  return calculatedPrice;
}
```

3. **Ajouter au switch** de calcul principal :
```typescript
case 'CUSTOM_METHOD':
  calculatedPrice = this.calculateCustomMethod(guarantee, vehicle);
  pricingMethod = 'Méthode personnalisée';
  break;
```

### Ajouter une nouvelle catégorie de garantie

```typescript
export type GuaranteeCategory =
  | 'RESPONSABILITE_CIVILE'
  | 'DEFENSE_RECOURS'
  | 'INDIVIDUELLE_CONDUCTEUR'
  // ... catégories existantes
  | 'NEW_CATEGORY';  // Nouvelle catégorie
```

## 📈 Évolutions Futures

### Fonctionnalités prévues

1. **Tarification dynamique**
   - Selon profil conducteur
   - Historique de conduite
   - Zone géographique

2. **Promotions temporaires**
   - Réductions saisonnières
   - Offres spéciales
   - Codes promotionnels

3. **Analytics avancés**
   - Tableaux de bord
   - Rapports personnalisés
   - Prédictions de ventes

4. **API externe**
   - Synchronisation assureurs
   - Import/export automatique
   - Validation en temps réel

## 🐛 Dépannage

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Prix incorrect | Vérifier les méthodes de calcul et les valeurs |
| Garantie invisible | Vérifier le statut `isActive` |
| Package non appliqué | Confirmer que les garanties existent |
| Calcul lent | Optimiser les requêtes ou utiliser le cache |

### Debug

```typescript
// Activer le mode debug
console.log('Pricing calculation:', {
  vehicle,
  guarantees: selectedGuaranteeIds,
  calculationMethod: offerType,
  result: pricing
});
```

## 📞 Support

- **Documentation** : `/docs/TARIFICATION_ADMIN.md`
- **Code source** : `src/features/tarification/`
- **Tests** : Exemples dans les composants
- **Logs** : Console du navigateur pour le debug

---

## 🎉 Conclusion

Le système de tarification de NOLI Assurance offre une solution complète, flexible et évolutive pour la gestion des garanties automobiles. Il allie simplicité d'utilisation pour les administrateurs et puissance de calcul pour une tarification précise et équitable.

**Points forts** :
- ✅ Interface intuitive
- ✅ Calculs précis et conformes
- ✅ Grande flexibilité de configuration
- ✅ Intégration complète avec les offres
- ✅ Documentation complète

**Prêt pour la production** 🚀