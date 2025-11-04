# Module Quotes - Documentation

## 🎯 Objectif du Module

Le module Quotes gère la génération, la gestion et la distribution des devis d'assurance. Il transforme les données de comparaison en devis personnalisés et professionnels au format PDF.

## 📋 Fonctionnalités Principales

### 1. Génération de Devis PDF
- **Description**: Création automatique de devis personnalisés au format PDF
- **Sous-fonctionnalités**:
  - Templates PDF professionnels et personnalisables
  - Calcul automatique des primes
  - Génération avec logo et informations assureur
  - Barres de protection et filigranes
  - Optimisation taille fichier
  - Support multi-langues

### 2. Calcul Tarification Dynamique
- **Description**: Moteur de calcul des primes d'assurance en temps réel
- **Sous-fonctionnalités**:
  - Calcul prime base selon profil risque
  - Application des majorations/minorations
  - Gestion des franchises et garanties
  - Calcul taxes et frais annexes
  - Support tarification par tranche
  - Validation règles métier

### 3. Gestion des Devis
- **Description**: Cycle de vie complet des devis utilisateur
- **Sous-fonctionnalités**:
  - Sauvegarde automatique devis
  - Historique des devis générés
  - Statut devis (brouillon, envoyé, accepté, expiré)
  - Duplication et modification devis
  - Archivage automatique (30 jours)
  - Recherche et filtrage devis

### 4. Personnalisation Avancée
- **Description**: Adaptation des devis selon profil utilisateur
- **Sous-fonctionnalités**:
  - Personnalisation informations client
  - Sélection garanties optionnelles
  - Ajustement franchises
  - Configuration périodes de paiement
  - Remises et promotions
  - Conditions particulières

### 5. Partage et Distribution
- **Description**: Mécanismes de distribution multi-canaux des devis
- **Sous-fonctionnalités**:
  - Envoi email automatique
  - Lien de partage sécurisé
  - Téléchargement direct
  - SMS avec lien devis
  - Partage réseaux sociaux
  - Suivi ouverture devis

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// QuoteGenerator.tsx - Générateur de devis
interface QuoteGeneratorProps {
  comparisonData: ComparisonData
  selectedOffers: Offer[]
  onQuoteGenerated: (quote: Quote) => void
  onQuoteError: (error: Error) => void
}

// QuotePDFGenerator.tsx - Génération PDF
interface QuotePDFGeneratorProps {
  quoteData: QuoteData
  template: QuoteTemplate
  companyInfo: CompanyInfo
  customerInfo: CustomerInfo
}

// QuotePreview.tsx - Aperçu avant génération
interface QuotePreviewProps {
  quoteData: QuoteData
  onEdit: () => void
  onGenerate: () => void
  onShare: () => void
}
```

### Structures de Données
```typescript
// QuoteData.ts - Structure devis
interface QuoteData {
  id: string
  number: string
  createdAt: Date
  validUntil: Date
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected'

  customer: CustomerInfo
  vehicle: VehicleInfo
  coverage: CoverageInfo
  pricing: PricingInfo
  company: CompanyInfo
  terms: QuoteTerms
}

interface PricingInfo {
  basePremium: number
  additionalGuarantees: GuaranteePremium[]
  taxes: TaxInfo[]
  totalPremium: number
  paymentSchedule: PaymentOption[]
  discounts: DiscountInfo[]
}

interface QuoteTemplate {
  id: string
  name: string
  sections: TemplateSection[]
  styling: TemplateStyling
  companyBranding: CompanyBranding
  legalInfo: LegalInfo
}
```

### Moteur de Calcul Tarification
```typescript
// TarificationEngine.ts
class TarificationEngine {
  async calculateQuote(
    customerData: CustomerData,
    vehicleData: VehicleData,
    coverageData: CoverageData
  ): Promise<QuoteCalculation> {
    // 1. Calcul base de tarification
    const baseRate = await this.calculateBaseRate(vehicleData, coverageData)

    // 2. Application facteurs de risque
    const riskAdjustment = await this.calculateRiskAdjustment(customerData)

    // 3. Application garanties optionnelles
    const guaranteePremiums = await this.calculateGuaranteePremiums(coverageData)

    // 4. Calcul taxes et frais
    const taxes = await this.calculateTaxes(baseRate + riskAdjustment + guaranteePremiums)

    return {
      basePremium: baseRate,
      riskAdjustment,
      guaranteePremiums,
      taxes,
      totalPremium: baseRate + riskAdjustment + guaranteePremiums + taxes
    }
  }
}
```

## 📊 APIs et Services

### QuoteService
```typescript
interface IQuoteService {
  generateQuote(comparisonData: ComparisonData, selectedOffers: Offer[]): Promise<Quote>
  updateQuote(quoteId: string, updates: Partial<QuoteData>): Promise<Quote>
  duplicateQuote(quoteId: string): Promise<Quote>
  deleteQuote(quoteId: string): Promise<void>
  getQuote(quoteId: string): Promise<Quote>
  getUserQuotes(userId: string, filters?: QuoteFilters): Promise<Quote[]>
  updateQuoteStatus(quoteId: string, status: QuoteStatus): Promise<void>
}

interface QuoteFilters {
  status?: QuoteStatus[]
  dateRange?: DateRange
  vehicleType?: string[]
  coverageType?: string[]
  premiumRange?: PriceRange
}
```

### PDFService
```typescript
interface IPDFService {
  generateQuotePDF(quoteData: QuoteData, template: QuoteTemplate): Promise<Blob>
  generateMultipleQuotesPDF(quotes: QuoteData[]): Promise<Blob>
  previewPDF(quoteData: QuoteData): Promise<string> // Base64 preview
  optimizePDF(pdfBlob: Blob): Promise<Blob>
  addWatermark(pdfBlob: Blob, watermark: string): Promise<Blob>
  validatePDF(pdfBlob: Blob): Promise<boolean>
}
```

### TarificationService
```typescript
interface ITarificationService {
  calculateBasePremium(vehicle: VehicleInfo, coverage: CoverageInfo): Promise<number>
  calculateRiskProfile(customer: CustomerInfo, vehicle: VehicleInfo): Promise<RiskProfile>
  applyRiskFactors(basePremium: number, riskProfile: RiskProfile): number
  calculateTaxes(premium: number): Promise<TaxCalculation>
  getAvailableDiscounts(customer: CustomerInfo): Promise<Discount[]>
  validatePricingRules(pricing: PricingInfo): ValidationResult
}
```

### NotificationService
```typescript
interface INotificationService {
  sendQuoteEmail(quote: Quote, recipient: string): Promise<EmailResult>
  sendQuoteSMS(quote: Quote, phoneNumber: string): Promise<SMSResult>
  generateShareLink(quoteId: string): Promise<ShareLink>
  trackQuoteOpen(quoteId: string, trackingId: string): Promise<void>
  scheduleQuoteReminder(quoteId: string, reminderDate: Date): Promise<void>
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **QuoteDetailsPage** (`/devis/[id]`)
   - Visualisation complète devis
   - Options modification/partage
   - Statut et historique

2. **QuoteListPage** (`/mes-devis`)
   - Liste devis utilisateur
   - Filtrage et recherche
   - Actions groupées

3. **QuoteGeneratorPage** (`/generer-devis`)
   - Assistant génération devis
   - Personnalisation avancée
   - Aperçu temps réel

### Composants Principaux
- **QuotePDFGenerator**: Générateur PDF avec preview
- **QuoteCalculator**: Calculateur tarification
- **QuoteCustomizer**: Personnalisation garanties
- **QuoteShareModal**: Modal partage multi-canal
- **QuoteStatusBadge**: Badge statut devis
- **QuoteTimeline**: Timeline historique devis

### Templates PDF Disponibles
- **Standard**: Template minimaliste et professionnel
- **Premium**: Template riche avec graphiques
- **Corporate**: Template pour entreprises
- **Custom**: Templates personnalisés assureurs

## 🧪 Tests

### Tests Unitaires
```typescript
// TarificationEngine.test.ts
describe('TarificationEngine', () => {
  it('calcule prime base correctement', async () => {
    const engine = new TarificationEngine()
    const premium = await engine.calculateBasePremium(mockVehicleData, mockCoverageData)
    expect(premium).toBeGreaterThan(0)
    expect(premium).toBeLessThan(10000)
  })

  it('applique facteurs risque correctement', async () => {
    const basePremium = 1000
    const riskProfile = { age: 25, experience: 2, history: 'clean' }
    const adjustedPremium = await engine.applyRiskFactors(basePremium, riskProfile)
    expect(adjustedPremium).toBeGreaterThan(basePremium * 0.8)
    expect(adjustedPremium).toBeLessThan(basePremium * 2)
  })
})

// PDFService.test.ts
describe('PDFService', () => {
  it('génère PDF valide', async () => {
    const pdfBlob = await pdfService.generateQuotePDF(mockQuoteData, mockTemplate)
    expect(pdfBlob.type).toBe('application/pdf')
    expect(pdfBlob.size).toBeGreaterThan(1000)
  })

  it('optimise taille PDF', async () => {
    const originalBlob = new Blob(['large content'], { type: 'application/pdf' })
    const optimizedBlob = await pdfService.optimizePDF(originalBlob)
    expect(optimizedBlob.size).toBeLessThan(originalBlob.size)
  })
})
```

### Tests d'Intégration
- **Flux génération devis complet**
- **Calcul tarification complexe**
- **Intégration templates PDF**
- **Notification email/SMS**

### Tests E2E (Playwright)
```typescript
// quote-generation.spec.ts
test('génération devis complète', async ({ page }) => {
  await page.goto('/comparer')
  // Remplir formulaire comparaison...
  await page.click('[data-testid="submit-comparison"]')

  // Sélectionner offres
  await page.click('[data-testid="offer-1"]')
  await page.click('[data-testid="offer-2"]')
  await page.click('[data-testid="generate-quotes"]')

  // Personnaliser devis
  await page.click('[data-testid="customize-quote"]')
  await page.check('[data-testid="guarantee-assistance"]')
  await page.click('[data-testid="preview-quote"]')

  // Générer PDF
  await page.click('[data-testid="generate-pdf"]')
  await expect(page.getByText('Devis généré avec succès')).toBeVisible()

  // Partager devis
  await page.click('[data-testid="share-quote"]')
  await page.fill('[data-testid="email-recipient"]', 'client@example.com')
  await page.click('[data-testid="send-email"]')
  await expect(page.getByText('Devis envoyé par email')).toBeVisible()
})
```

## 📈 Performance

### Optimisations
- **PDF Generation**: Caching templates et lazy loading
- **Tarification Calcul**: Memoization et workers
- **Image Optimization**: Compression logos et images
- **Bundle Splitting**: Générateur PDF séparé
- **API Debouncing**: Limitation appels tarification

### Monitoring
- **Generation Time**: Temps génération PDF
- **Success Rate**: Taux succès génération
- **File Size**: Taille moyenne PDFs
- **User Actions**: Clicks partage/téléchargement

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **PDF Generation Errors**: Problèmes génération PDF
2. **Calculation Errors**: Erreurs calcul tarification
3. **Template Errors**: Templates invalides
4. **Network Errors**: Problèmes sauvegarde
5. **Validation Errors**: Données invalides

### Stratégies de Gestion
- **Fallback Templates**: Templates par défaut si erreur
- **Retry Logic**: Tentatives génération automatiques
- **User Notifications**: Messages clairs et actionnables
- **Error Logging**: Traçage complet debugging
- **Graceful Degradation**: Mode limité si erreur

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Advanced Templates**: Templates interactifs
- **Real-time Collaboration**: Co-création devis
- **Digital Signatures**: Signature électronique
- **Batch Generation**: Génération multiples devis

### Moyen Terme (3-6 mois)
- **AI Pricing Optimization**: Optimisation IA tarification
- **Dynamic Templates**: Templates adaptatifs
- **Integration Insurers**: APIs directes assureurs
- **Mobile App**: Application mobile devis

### Long Terme (6+ mois)
- **Blockchain Verification**: Vérification blockchain
- **Smart Contracts**: Contrats intelligents
- **Predictive Analytics**: Prédictions conversion
- **Full Automation**: Automatisation complète

## 📚 Documentation Complémentaire

- [Guide développement templates PDF](./pdf-templates.md)
- [Configuration tarification avancée](./advanced-tarification.md)
- [Intégration assureurs tiers](./insurer-integration.md)
- [Optimisation performance PDF](./pdf-optimization.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Devis & Tarification*