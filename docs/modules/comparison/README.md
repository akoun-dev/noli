# Module Comparison - Documentation

## 🎯 Objectif du Module

Le module Comparison gère l'ensemble du workflow de comparaison d'assurances, permettant aux utilisateurs de trouver la meilleure couverture pour leurs besoins en 3 étapes simples et intuitives.

## 📋 Fonctionnalités Principales

### 1. Formulaire de Comparaison en 3 Étapes
- **Description**: Workflow guidé pour collecter les informations nécessaires à la comparaison
- **Étape 1 - Informations Personnelles**:
  - Nom, prénom, email, téléphone
  - Date de naissance
  - Numéro et date permis de conduire
  - Adresse postale
  - Validation en temps réel

- **Étape 2 - Informations Véhicule**:
  - Marque, modèle, année
  - Numéro d'immatriculation
  - Type de véhicule (particulier, utilitaire, moto)
  - Type de carburant
  - Valeur estimée du véhicule
  - Usage personnel/professionnel

- **Étape 3 - Besoins de Couverture**:
  - Type de couverture souhaitée
  - Usage annuel (kilométrage)
  - Type de stationnement principal
  - Historique des sinistres
  - Besoins spécifiques (assistance, protection juridique, etc.)

### 2. Barre de Progression Intuitive
- **Description**: Navigation visuelle claire du workflow
- **Sous-fonctionnalités**:
  - Indicateur d'étape active
  - Étapes précédentes accessibles
  - Validation avant passage étape suivante
  - Sauvegarde automatique progression
  - Abandon possible avec reprise

### 3. Validation en Temps Réel
- **Description**: Feedback immédiat sur la saisie utilisateur
- **Sous-fonctionnalités**:
  - Validation email existence
  - Vérification format permis
  - Validation immatriculation
  - Contraintes métier (âge permis, valeur véhicule)
  - Messages d'erreur contextualisés

### 4. Sauvegarde et Reprise
- **Description**: Permet aux utilisateurs d'interrompre et reprendre leur comparaison
- **Sous-fonctionnalités**:
  - Sauvegarde automatique étape
  - Reprise depuis dernière étape
  - Email de rappel progression
  - Comparaisons sauvegardées
  - Historique des comparaisons

### 5. Calcul Tarification en Temps Réel
- **Description**: Estimation des tarifs basée sur les informations saisies
- **Sous-fonctionnalités**:
  - Calcul instantané estimations
  - Facteurs de risque dynamiques
  - Tarification par garanties
  - Comparaison visuelle tarifs
  - Explication facteurs tarifaires

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// Step1Personal.tsx - Étape 1: Informations personnelles
interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  licenseNumber: string
  licenseDate: string
  address: string
}

// Step2Vehicle.tsx - Étape 2: Informations véhicule
interface VehicleData {
  brand: string
  model: string
  year: number
  registrationNumber: string
  vehicleType: 'particulier' | 'utilitaire' | 'moto' | 'scooter'
  fuelType: 'essence' | 'diesel' | 'electrique' | 'hybride'
  value: number
  usage: 'personnel' | 'professionnel' | 'mixte'
}

// Step3Needs.tsx - Étape 3: Besoins couverture
interface CoverageData {
  coverageType: 'tiers' | 'tiers+vol' | 'tous-risques'
  annualKilometers: number
  parkingType: 'garage' | 'voiture' | 'rue'
  historyClaims: 'aucun' | '1-2' | '3-5' | '5+'
  additionalGuarantees: string[]
}
```

### Contexte de Comparaison
```typescript
// ComparisonContext.tsx
interface ComparisonContextType {
  currentStep: number
  totalSteps: number
  formData: ComparisonData
  isSaving: boolean
  canProgress: boolean
  errors: ValidationError[]

  // Actions
  setStep: (step: number) => void
  updateData: (step: number, data: any) => void
  saveProgress: () => Promise<void>
  validateStep: (step: number) => boolean
  submitComparison: () => Promise<ComparisonResult>
}

interface ComparisonData {
  step1: PersonalData
  step2: VehicleData
  step3: CoverageData
  savedAt?: Date
  comparisonId?: string
}
```

### Schémas de Validation (Zod)
```typescript
// personal.schema.ts
const personalSchema = z.object({
  firstName: z.string().min(2, 'Min 2 caractères'),
  lastName: z.string().min(2, 'Min 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Téléphone invalide'),
  birthDate: z.string().refine(validateAge, 'Âge minimum 18 ans requis'),
  licenseNumber: z.string().regex(/^[A-Z0-9]{12}$/, 'Format permis invalide'),
  licenseDate: z.string().refine(validateLicenseAge, 'Permis datant de moins de 2 ans'),
  address: z.string().min(10, 'Adresse complète requise')
})

// vehicle.schema.ts
const vehicleSchema = z.object({
  brand: z.string().min(2, 'Marque requise'),
  model: z.string().min(2, 'Modèle requis'),
  year: z.number().min(1990).max(new Date().getFullYear()),
  registrationNumber: z.string().regex(/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/, 'Immatriculation invalide'),
  value: z.number().min(1000).max(200000, 'Véhicule entre 1k€ et 200k€'),
  usage: z.enum(['personnel', 'professionnel', 'mixte'])
})
```

## 📊 APIs et Services

### ComparisonService
```typescript
interface IComparisonService {
  validateData(step: number, data: any): Promise<ValidationResult>
  calculatePremium(vehicleData: VehicleData, coverageData: CoverageData): Promise<PremiumCalculation>
  saveComparison(comparisonData: ComparisonData): Promise<string>
  getComparison(comparisonId: string): Promise<ComparisonData>
  submitFullComparison(comparisonData: CompleteComparisonData): Promise<ComparisonResult>
}

interface PremiumCalculation {
  basePremium: number
  riskFactors: RiskFactor[]
  totalPremium: number
  breakdown: PremiumBreakdown[]
  confidence: number
}
```

### TarificationService
```typescript
interface ITarificationService {
  getVehicleRiskProfile(vehicleData: VehicleData): Promise<RiskProfile>
  calculateBasePremium(vehicleValue: number, vehicleType: string): number
  applyRiskFactors(basePremium: number, riskProfile: RiskProfile): number
  calculateGuaranteePremiums(coverageData: CoverageData): GuaranteePremium[]
  getAvailableOffers(userData: PersonalData, vehicleData: VehicleData): Promise<Offer[]>
}
```

### ValidationService
```typescript
interface IValidationService {
  validateEmail(email: string): Promise<EmailValidationResult>
  validatePhone(phone: string): boolean
  validateLicenseNumber(licenseNumber: string): boolean
  validateRegistrationNumber(regNumber: string): boolean
  checkVehicleExists(brand: string, model: string, year: number): Promise<boolean>
  validateCoverageCombination(guarantees: string[]): ValidationResult
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **ComparisonPage** (`/comparer`)
   - Wrapper du workflow complet
   - Gestion état et navigation
   - Sauvegarde automatique

2. **ComparisonHistoryPage** (`/mes-comparaisons`)
   - Historique comparaisons utilisateur
   - Reprise comparaisons sauvegardées
   - Suppression comparaisons anciennes

### Composants Principaux
- **ComparisonStepper**: Barre de progression workflow
- **Step1Personal**: Formulaire informations personnelles
- **Step2Vehicle**: Formulaire informations véhicule
- **Step3Needs**: Formulaire besoins couverture
- **FormSummary**: Récapitulatif avant soumission
- **ValidationFeedback**: Messages validation temps réel

### États Visuels
- **Step Active**: Mise en surbrillance étape en cours
- **Step Completed**: Vert avec checkmark
- **Step Disabled**: Grisé et non cliquable
- **Step Error**: Rouge avec indicateur erreur
- **Form Loading**: Spinner et message attente
- **Form Error**: Messages d'erreur contextualisés

## 🧪 Tests

### Tests Unitaires
```typescript
// Step1Personal.test.tsx
describe('Step1Personal', () => {
  it('valide email correctement', () => {
    render(<Step1Personal />)
    fireEvent.change(screen.getByTestId('email'), { target: { value: 'test@example.com' } })
    expect(screen.getByTestId('email')).toHaveValidClass()
  })

  it('affiche erreur âge minimum', () => {
    render(<Step1Personal />)
    const birthDate = calculateDateFromAge(17)
    fireEvent.change(screen.getByTestId('birthDate'), { target: { value: birthDate } })
    expect(screen.getByText('Âge minimum 18 ans requis')).toBeInTheDocument()
  })
})

// ComparisonContext.test.tsx
describe('ComparisonContext', () => {
  it('sauvegarde progression automatiquement', async () => {
    const { result } = renderHook(() => useComparisonContext())
    await act(async () => {
      result.current.updateData(1, mockPersonalData)
    })
    expect(mockSaveProgress).toHaveBeenCalled()
  })
})
```

### Tests d'Intégration
- **Workflow complet 3 étapes**
- **Validation cross-étapes**
- **Sauvegarde et reprise progression**
- **Calcul tarification**

### Tests E2E (Playwright)
```typescript
// comparison-flow.spec.ts
test('workflow comparaison complet', async ({ page }) => {
  await page.goto('/comparer')

  // Étape 1
  await page.fill('[data-testid="firstName"]', 'Jean')
  await page.fill('[data-testid="lastName"]', 'Dupont')
  await page.fill('[data-testid="email"]', 'jean.dupont@example.com')
  await page.click('[data-testid="next-step"]')

  // Étape 2
  await page.selectOption('[data-testid="brand"]', 'Renault')
  await page.selectOption('[data-testid="model"]', 'Clio')
  await page.fill('[data-testid="year"]', '2020')
  await page.click('[data-testid="next-step"]')

  // Étape 3
  await page.selectOption('[data-testid="coverageType"]', 'tous-risques')
  await page.fill('[data-testid="annualKilometers"]', '15000')
  await page.click('[data-testid="submit-comparison"]')

  await expect(page).toHaveURL('/offres')
})

test('sauvegarde et reprise progression', async ({ page }) => {
  await page.goto('/comparer')
  await page.fill('[data-testid="firstName"]', 'Marie')
  await page.goto('/mes-comparaisons')
  await expect(page.getByText('Comparaison en cours')).toBeVisible()
  await page.click('[data-testid="resume-comparison"]')
  await expect(page.getByDisplayValue('Marie')).toBeVisible()
})
```

## 📈 Performance

### Optimisations
- **Form Debouncing**: Validation optimisée 300ms
- **Lazy Loading**: Composants étapes chargés à la demande
- **LocalStorage**: Cache progression utilisateur
- **API Caching**: Mémorisation calculs tarification
- **Bundle Splitting**: Forms séparés du bundle principal

### Monitoring
- **Conversion Rate**: Taux complétion workflow
- **Drop-off Rate**: Abandon par étape
- **Form Errors**: Erreurs validation fréquentes
- **Load Times**: Performance étapes

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Validation Errors**: Champs invalides
2. **API Errors**: Problèmes sauvegarde/calcul
3. **Network Errors**: Problèmes connexion
4. **Business Logic Errors**: Contraintes métier
5. **Timeout Errors**: Sauvegarde automatique échouée

### Stratégies de Gestion
- **Inline Validation**: Erreurs visibles immédiatement
- **Toast Notifications**: Erreurs globales
- **Auto-retry**: Tentatives sauvegarde automatique
- **Offline Support**: Mode dégradé avec LocalStorage
- **Error Recovery**: Options de correction utilisateur

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Auto-complétion véhicules**: API immatriculation
- **Progressive Profiling**: Collecte étalonnée informations
- **Social Login**: Préremplissage infos réseaux sociaux
- **Mobile Optimization**: Workflow adapté mobile

### Moyen Terme (3-6 mois)
- **AI Recommendations**: Suggestions basées profil
- **Real-time Co-browsing**: Assistance avec conseiller
- **Voice Input**: Saisie vocale informations
- **Document OCR**: Extraction automatique permis/carte grise

### Long Terme (6+ mois)
- **Predictive Analytics**: Anticipation besoins
- **Personalized Journey**: Parcours adapté profil
- **Integration Partners**: APIs assureurs/véhicules
- **Advanced Analytics**: Comportement utilisateurs

## 📚 Documentation Complémentaire

- [Guide d'implémentation formulaires](./forms-implementation.md)
- [Configuration tarification](./tarification-config.md)
- [Optimisation conversion tunnel](./conversion-optimization.md)
- [Guide de validation avancée](./advanced-validation.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Experience Utilisateur & Comparaison*