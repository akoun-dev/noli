# Module Offers - Documentation

## 🎯 Objectif du Module

Le module Offers gère l'affichage, la recherche, la comparaison et la gestion des offres d'assurance disponibles sur la plateforme NOLI.

## 📋 Fonctionnalités Principales

### 1. Catalogue d'Offres Dynamique
- **Description**: Affichage complet des offres d'assurance disponibles
- **Sous-fonctionnalités**:
  - Grille offres responsive avec visual cards
  - Filtres multi-critères (prix, couverture, assureur)
  - Tri personnalisable (prix, popularité, nouveauté)
  - Badges et étiquettes descriptives
  - Pagination infinie avec lazy loading
  - Mode grille/liste au choix

### 2. Comparaison d'Offres Avancée
- **Description**: Outils de comparaison détaillée entre offres
- **Sous-fonctionnalités**:
  - Tableau comparatif côte à côte
  - Highlight des différences clés
  - Scoring par critère (prix, garanties, service)
  - Export comparatif (PDF, Excel)
  - Sauvegarde comparaisons
  - Partage comparatif avec tiers

### 3. Filtres et Recherche Intelligente
- **Description**: Système de recherche puissant avec filtres avancés
- **Sous-fonctionnalités**:
  - Recherche textuelle plein texte
  - Filtres prix avec slider interactif
  - Filtrage par type de couverture
  - Filtres assureurs et garanties
  - Filtres spécifiques véhicule
  - Sauvegarde critères de recherche

### 4. Détails Offres Complets
- **Description**: Pages détaillées pour chaque offre
- **Sous-fonctionnalités**:
  - Informations complètes assureur
  - Détail garanties et exclusions
  - Tarification transparente
  - Avis et témoignages clients
  - FAQ et conditions générales
  - Contact direct assureur

### 5. Chat en Direct Intégré
- **Description**: Communication temps réel avec conseillers
- **Sous-fonctionnalités**:
  - Chat widget flottant
  - Conseillers spécialisés par offre
  - Transfert vers experts techniques
  - Historique conversations
  - Chatbot pour questions fréquentes
  - File d'attente et temps d'attente

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// OfferCard.tsx - Card offre dans la grille
interface OfferCardProps {
  offer: Offer
  onViewDetails: (offerId: string) => void
  onCompare: (offerId: string) => void
  onContact: (offerId: string) => void
  comparisonMode?: boolean
  isSelected?: boolean
}

// OfferFilters.tsx - Panneau de filtres
interface OfferFiltersProps {
  filters: OfferFilters
  onFiltersChange: (filters: OfferFilters) => void
  availableFilters: FilterOptions
  onReset: () => void
}

// OfferComparison.tsx - Outil comparaison
interface OfferComparisonProps {
  selectedOffers: Offer[]
  onRemoveOffer: (offerId: string) => void
  onAddOffer: () => void
  onExport: (format: 'pdf' | 'excel') => void
}
```

### Structures de Données
```typescript
// Offer.ts - Structure offre
interface Offer {
  id: string
  name: string
  description: string
  insurer: InsurerInfo
  category: OfferCategory
  coverage: CoverageInfo
  pricing: PricingInfo
  features: OfferFeature[]
  restrictions: OfferRestriction[]
  reviews: OfferReview[]
  availability: OfferAvailability
  metadata: OfferMetadata
}

interface CoverageInfo {
  type: CoverageType
  guarantees: Guarantee[]
  exclusions: Exclusion[]
  limits: CoverageLimit[]
  deductibles: Deductible[]
  assistance: AssistanceInfo[]
}

interface PricingInfo {
  basePremium: number
  paymentOptions: PaymentOption[]
  discounts: AvailableDiscount[]
  taxes: TaxInfo[]
  totalAnnual: number
  totalMonthly: number
}

interface OfferReview {
  id: string
  userId: string
  rating: number
  comment: string
  pros: string[]
  cons: string[]
  createdAt: Date
  verified: boolean
}
```

### Système de Filtres
```typescript
// OfferFilters.ts - Configuration filtres
interface OfferFilters {
  search?: string
  priceRange?: [number, number]
  coverageTypes?: CoverageType[]
  insurers?: string[]
  vehicleTypes?: VehicleType[]
  guarantees?: string[]
  rating?: number
  availability?: boolean
  sortBy?: SortOption
  page?: number
  limit?: number
}

interface FilterOptions {
  maxPrice: number
  minPrice: number
  availableInsurers: InsurerInfo[]
  availableCoverages: CoverageType[]
  availableGuarantees: Guarantee[]
  priceDistribution: PriceDistribution
}
```

## 📊 APIs et Services

### OfferService
```typescript
interface IOfferService {
  getOffers(filters?: OfferFilters): Promise<OfferListResult>
  getOffer(offerId: string): Promise<Offer>
  searchOffers(query: string, filters?: OfferFilters): Promise<Offer[]>
  getPopularOffers(limit?: number): Promise<Offer[]>
  getRecommendedOffers(userId: string): Promise<Offer[]>
  compareOffers(offerIds: string[]): Promise<OfferComparison>
  getOfferReviews(offerId: string): Promise<OfferReview[]>
  submitReview(offerId: string, review: CreateReviewRequest): Promise<OfferReview>
}

interface OfferListResult {
  offers: Offer[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  facets: SearchFacets
}
```

### SearchService
```typescript
interface ISearchService {
  buildSearchQuery(filters: OfferFilters): SearchQuery
  executeSearch(query: SearchQuery): Promise<SearchResult>
  getSuggestions(query: string): Promise<string[]>
  getPopularSearches(): Promise<string[]>
  saveSearchHistory(userId: string, search: SearchHistory): Promise<void>
  getSearchHistory(userId: string): Promise<SearchHistory[]>
}
```

### ComparisonService
```typescript
interface IComparisonService {
  addOfferToComparison(offerId: string, userId: string): Promise<void>
  removeOfferFromComparison(offerId: string, userId: string): Promise<void>
  getComparisonList(userId: string): Promise<Offer[]>
  generateComparisonReport(offerIds: string[]): Promise<ComparisonReport>
  shareComparison(comparisonId: string, recipients: string[]): Promise<ShareResult>
  saveComparison(name: string, offerIds: string[]): Promise<string>
}
```

### ChatService
```typescript
interface IChatService {
  initiateChat(offerId: string, userId: string): Promise<ChatSession>
  sendMessage(sessionId: string, message: string): Promise<ChatMessage>
  getChatHistory(sessionId: string): Promise<ChatMessage[]>
  transferToAgent(sessionId: string, agentId: string): Promise<void>
  getAvailableAgents(specialty?: string): Promise<AgentInfo[]>
  endChatSession(sessionId: string): Promise<void>
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **OffersListPage** (`/offres`)
   - Grille principale offres
   - Filtres latéraux
   - Barre recherche
   - Modes affichage

2. **OfferDetailsPage** (`/offres/[id]`)
   - Détails complets offre
   - Galerie images
   - Avis clients
   - Actions principales

3. **OfferComparisonPage** (`/comparer-offres`)
   - Tableau comparatif
   - Outils analyse
   - Export options

4. **OfferSearchPage** (`/recherche-offres`)
   - Page recherche avancée
   - Suggestions intelligentes
   - Historique recherches

### Composants Principaux
- **OfferGrid**: Grille responsive offres
- **OfferCard**: Card individuelle offre
- **OfferFilters**: Panneau filtres complet
- **OfferComparison**: Tableau comparatif
- **OfferDetails**: Détails offre enrichis
- **ChatWidget**: Widget chat flottant
- **OfferReviews**: Section avis clients

### États Visuels
- **Loading States**: Skeletons pendant chargement
- **Empty States**: Messages si aucun résultat
- **Error States**: Messages erreurs filtrées
- **Selected States**: Offres sélectionnées visibles
- **Comparison Mode**: Mode comparaison activé
- **Chat Active**: Indicateur chat en cours

## 🧪 Tests

### Tests Unitaires
```typescript
// OfferFilters.test.tsx
describe('OfferFilters', () => {
  it('applique filtres prix correctement', () => {
    const mockOnFiltersChange = jest.fn()
    render(<OfferFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

    fireEvent.change(screen.getByTestId('price-min'), { target: { value: '500' } })
    fireEvent.change(screen.getByTestId('price-max'), { target: { value: '2000' } })

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      priceRange: [500, 2000]
    })
  })

  it('réinitialise tous les filtres', () => {
    const mockOnReset = jest.fn()
    render(<OfferFilters filters={{ search: 'test' }} onFiltersChange={jest.fn()} onReset={mockOnReset} />)

    fireEvent.click(screen.getByTestId('reset-filters'))
    expect(mockOnReset).toHaveBeenCalled()
  })
})

// OfferCard.test.tsx
describe('OfferCard', () => {
  it('affiche informations offre correctement', () => {
    const mockOffer = createMockOffer()
    render(<OfferCard offer={mockOffer} onViewDetails={jest.fn()} onCompare={jest.fn()} onContact={jest.fn()} />)

    expect(screen.getByText(mockOffer.name)).toBeInTheDocument()
    expect(screen.getByText(`${mockOffer.pricing.basePremium}€/an`)).toBeInTheDocument()
    expect(screen.getByText(mockOffer.insurer.name)).toBeInTheDocument()
  })
})
```

### Tests d'Intégration
- **Flux recherche complet**
- **Application filtres multiples**
- **Comparaison offres**
- **Chat workflow**

### Tests E2E (Playwright)
```typescript
// offers-flow.spec.ts
test('recherche et comparaison offres', async ({ page }) => {
  await page.goto('/offres')

  // Recherche
  await page.fill('[data-testid="search-input"]', 'assurance voiture')
  await page.click('[data-testid="search-button"]')

  // Filtres
  await page.click('[data-testid="filter-price"]')
  await page.fill('[data-testid="price-min"]', '500')
  await page.fill('[data-testid="price-max"]', '1500')
  await page.click('[data-testid="apply-filters"]')

  // Sélection offres pour comparaison
  await page.click('[data-testid="offer-1"] [data-testid="compare-btn"]')
  await page.click('[data-testid="offer-2"] [data-testid="compare-btn"]')
  await page.click('[data-testid="compare-selected"]')

  // Vérification page comparaison
  await expect(page).toHaveURL('/comparer-offres')
  await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible()
  await expect(page.locator('[data-testid="offer-card"]')).toHaveCount(2)

  // Export comparatif
  await page.click('[data-testid="export-pdf"]')
  await expect(page.getByText('Comparatif exporté avec succès')).toBeVisible()
})

test('chat avec conseiller', async ({ page }) => {
  await page.goto('/offres/offer-123')

  await page.click('[data-testid="chat-widget"]')
  await page.fill('[data-testid="chat-message"]', 'Bonjour, je voudrais plus d\'informations')
  await page.click('[data-testid="send-message"]')

  await expect(page.getByText('Conseiller connecté')).toBeVisible()
  await expect(page.locator('[data-testid="chat-message"]')).toHaveCount(2) // User + Bot
})
```

## 📈 Performance

### Optimisations
- **Virtual Scrolling**: Grille avec virtualisation
- **Image Optimization**: Lazy loading offres
- **Debounced Search**: Recherche avec délai 300ms
- **Cache Results**: Mémorisation résultats recherche
- **Prefetching**: Préchargement pages suivantes

### Monitoring
- **Search Performance**: Temps réponse recherche
- **Filter Usage**: Utilisation filtres les plus populaires
- **Conversion Rate**: Taux conversion offres
- **Chat Metrics**: Temps réponse chat, satisfaction

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Search Errors**: Problèmes recherche API
2. **Filter Errors**: Filtres invalides
3. **Comparison Errors**: Limites comparaison
4. **Chat Errors**: Problèmes connexion chat
5. **Load Errors**: Problèmes chargement offres

### Stratégies de Gestion
- **Fallback Search**: Recherche basique si erreur
- **Filter Validation**: Validation filtres avant envoi
- **Retry Logic**: Tentatives automatiques
- **User Feedback**: Messages erreurs clairs
- **Offline Support**: Mode dégradé avec cache

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **AI Recommendations**: Recommandations IA
- **Voice Search**: Recherche vocale
- **Advanced Filters**: Filtres plus granulaires
- **Real-time Updates**: Mises à jour temps réel

### Moyen Terme (3-6 mois)
- **3D Visualization**: Visualisation 3D offres
- **Video Reviews**: Avis vidéo clients
- **Live Chat Video**: Appels vidéo conseillers
- **Mobile App**: Application mobile native

### Long Terme (6+ mois)
- **AR/VR Integration**: Réalité augmentée
- **Blockchain Verification**: Vérification blockchain
- **Predictive Analytics**: Prédictions comportement
- **Full AI Assistant**: Assistant IA complet

## 📚 Documentation Complémentaire

- [Guide configuration filtres](./filters-configuration.md)
- [Optimisation recherche](./search-optimization.md)
- [Integration chat tiers](./chat-integration.md)
- [Personnalisation expérience](./personalization-guide.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Offres & Experience Client*