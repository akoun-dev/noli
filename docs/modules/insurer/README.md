# Module Insurer - Documentation

## 🎯 Objectif du Module

Le module Insurer constitue l'espace professionnel dédié aux assureurs partenaires, leur permettant de gérer leurs offres, suivre leurs prospects, et analyser leurs performances commerciales.

## 📋 Fonctionnalités Principales

### 1. Tableau de Bord Commercial
- **Description**: Vue analytique complète de l'activité commerciale
- **Sous-fonctionnalités**:
  - KPIs principaux (devis, contrats, chiffre d'affaires)
  - Graphiques tendance et performance
  - Pipeline commercial visuel
  - Alertes et notifications importantes
  - Comparaison périodes (mois, trimestre, année)
  - Objectifs et réalisation quotas

### 2. Gestion des Offres d'Assurance
- **Description**: Interface complète de gestion des produits d'assurance
- **Sous-fonctionnalités**:
  - Création et modification offres
  - Configuration tarification et garanties
  - Activation/désactivation offres
  - Versioning offres avec historique
  - Aperçu rendu client
  - Import/export configuration

### 3. Gestion des Prospects et Clients
- **Description**: CRM intégré pour suivi relation client
- **Sous-fonctionnalités**:
  - Liste prospects avec statuts
  - Fiches clients complètes
  - Historique interactions
  - Suivi devis et contrats
  - Segmentation client
  - Export données clients

### 4. Analytics et Rapports
- **Description**: Outils d'analyse de performance avancés
- **Sous-fonctionnalités**:
  - Rapports personnalisables
  - Analyse conversion devis→contrats
  - Performance par offre/garantie
  - Analyse démographique clients
  - Prévisions et tendances
  - Export rapports (PDF, Excel)

### 5. Communication Client
- **Description**: Outils de communication multi-canaux
- **Sous-fonctionnalités**:
  - Messagerie instantanée intégrée
  - Email templates personnalisables
  - SMS campagnes
  - Prise de rendez-vous
  - Historique communications
  - Templates automatisés

### 6. Système d'Alertes
- **Description**: Notifications intelligentes pour actions importantes
- **Sous-fonctionnalités**:
  - Nouveaux devis à traiter
  - Expirations contrats imminent
  - Performance objectifs
  - Anomalies et alertes qualité
  - Rappels tâches importantes
  - Notifications temps réel

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// InsurerDashboard.tsx - Tableau bord assureur
interface InsurerDashboardProps {
  insurer: Insurer
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
}

// OfferManager.tsx - Gestionnaire offres
interface OfferManagerProps {
  offers: Offer[]
  onCreateOffer: () => void
  onEditOffer: (offerId: string) => void
  onDeleteOffer: (offerId: string) => void
}

// ClientManager.tsx - Gestionnaire clients
interface ClientManagerProps {
  clients: Client[]
  filters: ClientFilters
  onFiltersChange: (filters: ClientFilters) => void
  onClientAction: (clientId: string, action: ClientAction) => void
}

// AnalyticsPanel.tsx - Panneau analytics
interface AnalyticsPanelProps {
  timeRange: TimeRange
  metrics: AnalyticsMetrics
  onExportReport: (format: 'pdf' | 'excel') => void
}
```

### Structures de Données
```typescript
// Insurer.ts - Structure assureur
interface Insurer {
  id: string
  name: string
  logo: string
  contact: InsurerContact
  settings: InsurerSettings
  subscription: InsurerSubscription
  createdAt: Date
}

interface InsurerSettings {
  businessHours: BusinessHours
  timezone: string
  language: string
  currency: string
  notificationPreferences: NotificationPreferences
  commissionSettings: CommissionSettings
}

// Client.ts - Structure client
interface Client {
  id: string
  profile: ClientProfile
  status: ClientStatus
  source: LeadSource
  assignedAgent?: string
  createdAt: Date
  lastContact: Date
  value: ClientValue
}

interface ClientProfile {
  personalInfo: PersonalInfo
  professionalInfo?: ProfessionalInfo
  insuranceNeeds: InsuranceNeed[]
  communicationPreferences: CommunicationPreferences
  documents: ClientDocument[]
}

// AnalyticsMetrics.ts - Métriques analytics
interface AnalyticsMetrics {
  overview: OverviewMetrics
  conversion: ConversionMetrics
  revenue: RevenueMetrics
  performance: PerformanceMetrics
  client: ClientMetrics
}
```

### Contextes et Hooks
```typescript
// InsurerContext.tsx - Contexte assureur
interface InsurerContextType {
  insurer: Insurer | null
  clients: Client[]
  offers: Offer[]
  metrics: AnalyticsMetrics

  // Actions
  refreshData: () => Promise<void>
  updateSettings: (settings: Partial<InsurerSettings>) => Promise<void>
  createClient: (clientData: CreateClientRequest) => Promise<Client>
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<Client>
}

// useInsurerAnalytics.ts - Hook analytics
interface UseInsurerAnalyticsReturn {
  metrics: AnalyticsMetrics
  isLoading: boolean
  error: string | null
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void
  exportReport: (format: 'pdf' | 'excel', filters?: ReportFilters) => Promise<void>
  refreshMetrics: () => Promise<void>
}
```

## 📊 APIs et Services

### InsurerService
```typescript
interface IInsurerService {
  getInsurerProfile(insurerId: string): Promise<Insurer>
  updateInsurerSettings(insurerId: string, settings: Partial<InsurerSettings>): Promise<Insurer>
  getInsurerMetrics(insurerId: string, timeRange: TimeRange): Promise<AnalyticsMetrics>
  getInsurerClients(insurerId: string, filters?: ClientFilters): Promise<Client[]>
  getInsurerOffers(insurerId: string): Promise<Offer[]>
}
```

### ClientManagementService
```typescript
interface IClientManagementService {
  createClient(insurerId: string, clientData: CreateClientRequest): Promise<Client>
  updateClient(clientId: string, updates: Partial<Client>): Promise<Client>
  getClient(clientId: string): Promise<Client>
  searchClients(insurerId: string, query: string): Promise<Client[]>
  assignClient(clientId: string, agentId: string): Promise<void>
  updateClientStatus(clientId: string, status: ClientStatus): Promise<Client>
}
```

### OfferManagementService
```typescript
interface IOfferManagementService {
  createOffer(insurerId: string, offerData: CreateOfferRequest): Promise<Offer>
  updateOffer(offerId: string, updates: Partial<Offer>): Promise<Offer>
  deleteOffer(offerId: string): Promise<void>
  duplicateOffer(offerId: string): Promise<Offer>
  getOfferPerformance(offerId: string, timeRange: TimeRange): Promise<OfferPerformance>
  publishOffer(offerId: string): Promise<Offer>
}
```

### AnalyticsService
```typescript
interface IAnalyticsService {
  getOverviewMetrics(insurerId: string, timeRange: TimeRange): Promise<OverviewMetrics>
  getConversionMetrics(insurerId: string, timeRange: TimeRange): Promise<ConversionMetrics>
  getRevenueMetrics(insurerId: string, timeRange: TimeRange): Promise<RevenueMetrics>
  generateReport(insurerId: string, reportConfig: ReportConfig): Promise<Report>
  getForecastMetrics(insurerId: string, period: ForecastPeriod): Promise<ForecastMetrics>
}
```

### CommunicationService
```typescript
interface ICommunicationService {
  sendEmail(clientId: string, template: string, variables: Record<string, any>): Promise<void>
  sendSMS(clientId: string, message: string): Promise<void>
  createEmailTemplate(template: EmailTemplate): Promise<EmailTemplate>
  scheduleCampaign(campaign: Campaign): Promise<Campaign>
  getCommunicationHistory(clientId: string): Promise<Communication[]>
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **InsurerDashboardPage** (`/assureur/tableau-de-bord`)
   - Vue analytics principale
   - Widgets personnalisables
   - Accès rapides

2. **InsurerClientsPage** (`/assureur/clients`)
   - CRM complet avec filtres
   - Fiches clients détaillées
   - Actions groupées

3. **InsurerOffersPage** (`/assureur/offres`)
   - Gestion catalogue offres
   - Configuration tarification
   - Performance par offre

4. **InsurerAnalyticsPage** (`/assureur/analytics`)
   - Rapports détaillés
   - Analyse avancée
   - Export données

5. **InsurerSettingsPage** (`/assureur/parametres`)
   - Configuration compte
   - Préférences
   - Paramètres avancés

### Composants Principaux
- **KPIWidget**: Widgets métriques réutilisables
- **ClientCard**: Card client avec actions
- **OfferEditor**: Éditeur offres avancé
- **AnalyticsChart**: Graphiques analytics
- **CommunicationPanel**: Panneau communication
- **AlertSystem**: Système alertes intelligent

### Navigation et Layout
- **InsurerLayout**: Layout spécifique assureur
- **SidebarNavigation**: Menu latéral professionnel
- **QuickActionsBar**: Barre actions rapides
- **NotificationCenter**: Centre notifications

## 🧪 Tests

### Tests Unitaires
```typescript
// OfferEditor.test.tsx
describe('OfferEditor', () => {
  it('crée nouvelle offre correctement', async () => {
    const mockOnSave = jest.fn()
    render(<OfferEditor onSave={mockOnSave} />)

    await fireEvent.change(screen.getByTestId('offer-name'), { target: { value: 'Auto Premium' } })
    await fireEvent.change(screen.getByTestId('base-premium'), { target: { value: '500' } })
    await fireEvent.click(screen.getByTestId('save-offer'))

    expect(mockOnSave).toHaveBeenCalledWith({
      name: 'Auto Premium',
      basePremium: 500
    })
  })
})

// ClientCard.test.tsx
describe('ClientCard', () => {
  it('affiche informations client correctement', () => {
    const mockClient = createMockClient()
    render(<ClientCard client={mockClient} onAction={jest.fn()} />)

    expect(screen.getByText(`${mockClient.profile.personalInfo.firstName} ${mockClient.profile.personalInfo.lastName}`)).toBeInTheDocument()
    expect(screen.getByText(mockClient.status)).toBeInTheDocument()
  })
})
```

### Tests d'Intégration
- **Flux création offre**
- **Workflow gestion client**
- **Génération rapports**
- **Système alertes**

### Tests E2E (Playwright)
```typescript
// insurer-workflow.spec.ts
test('workflow assureur complet', async ({ page }) => {
  await page.goto('/connexion/assureur')
  await loginAsInsurer(page)

  // Vérification tableau bord
  await expect(page).toHaveURL('/assureur/tableau-de-bord')
  await expect(page.locator('[data-testid="kpi-revenue"]')).toBeVisible()
  await expect(page.locator('[data-testid="pipeline-chart"]')).toBeVisible()

  // Création nouvelle offre
  await page.click('[data-testid="nav-offers"]')
  await page.click('[data-testid="create-offer"]')
  await page.fill('[data-testid="offer-name"]', 'Nouvelle Offre Test')
  await page.fill('[data-testid="base-premium"]', '750')
  await page.click('[data-testid="save-offer"]')
  await expect(page.getByText('Offre créée avec succès')).toBeVisible()

  // Gestion client
  await page.click('[data-testid="nav-clients"]')
  await page.click('[data-testid="add-client"]')
  await page.fill('[data-testid="client-firstname"]', 'Jean')
  await page.fill('[data-testid="client-lastname"]', 'Dupont')
  await page.fill('[data-testid="client-email"]', 'jean.dupont@example.com')
  await page.click('[data-testid="save-client"]')
  await expect(page.getByText('Client ajouté avec succès')).toBeVisible()

  // Génération rapport
  await page.click('[data-testid="nav-analytics"]')
  await page.selectOption('[data-testid="report-period"]', 'last-month')
  await page.click('[data-testid="generate-report"]')
  await page.click('[data-testid="export-pdf"]')
  await expect(page.getByText('Rapport exporté avec succès')).toBeVisible()
})
```

## 📈 Performance

### Optimisations
- **Data Caching**: Cache données analytics
- **Virtual Scrolling**: Listes clients avec virtualisation
- **Chart Optimization**: Optimisation graphiques
- **Lazy Loading**: Chargement progressif composants
- **API Pagination**: Pagination API optimisée

### Monitoring
- **Dashboard Load Time**: Temps chargement tableau bord
- **API Response Times**: Temps réponse API
- **User Engagement**: Engagement utilisateur
- **Feature Usage**: Utilisation fonctionnalités

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Validation Errors**: Erreurs formulaires offres
2. **Business Logic Errors**: Contraintes métier
3. **API Errors**: Problèmes communication
4. **Permission Errors**: Actions non autorisées
5. **Data Errors**: Données invalides/corrompues

### Stratégies de Gestion
- **Form Validation**: Validation temps réel
- **Business Rules**: Validation règles métier
- **Retry Logic**: Tentatives automatiques
- **Error Boundaries**: Isolation erreurs
- **User Feedback**: Messages erreurs constructifs

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Real-time Collaboration**: Collaboration temps réel
- **Advanced Analytics**: Analytics prédictives
- **Mobile App**: Application mobile assureur
- **API Integration**: APIs externes

### Moyen Terme (3-6 mois)
- **AI Insights**: IA analyse données
- **Automation Tools**: Outils automatisation
- **White-label Solution**: Solution white-label
- **Multi-language Support**: Support multi-langues

### Long Terme (6+ mois)
- **Blockchain Integration**: Intégration blockchain
- **Machine Learning**: ML prédictions
- **IoT Integration**: IoT données véhicules
- **Full Platform**: Plateforme complète

## 📚 Documentation Complémentaire

- [Guide création offres avancé](./offer-creation-guide.md)
- [Configuration analytics](./analytics-setup.md)
- [Gestion CRM client](./crm-management.md)
- [Optimisation performance commerciale](./sales-optimization.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Plateforme Assureurs & Analytics*