# Module User - Documentation

## 🎯 Objectif du Module

Le module User constitue l'espace client personnel où les utilisateurs peuvent gérer leur profil, suivre leurs devis et contrats, et accéder à toutes leurs informations d'assurance.

## 📋 Fonctionnalités Principales

### 1. Tableau de Bord Personnel
- **Description**: Vue d'ensemble complète de la situation assurance utilisateur
- **Sous-fonctionnalités**:
  - Résumé contrats actifs
  - Statut devis en cours
  - Prochaines échéances
  - Notifications importantes
  - Accès rapides aux fonctionnalités
  - Graphiques et statistiques personnelles

### 2. Gestion de Profil Complète
- **Description**: Interface complète de gestion des informations personnelles
- **Sous-fonctionnalités**:
  - Informations de base (nom, email, téléphone)
  - Adresse et coordonnées
  - Photo de profil
  - Préférences de notification
  - Paramètres de sécurité
  - Historique modifications

### 3. Gestion des Devis
- **Description**: Suivi et gestion de tous les devis utilisateur
- **Sous-fonctionnalités**:
  - Liste des devis avec statuts
  - Téléchargement PDF devis
  - Comparaison devis similaires
  - Conversion devis en contrat
  - Expiration et renouvellement
  - Partage devis avec tiers

### 4. Gestion des Contrats
- **Description**: Administration complète des contrats d'assurance actifs
- **Sous-fonctionnalités**:
  - Liste contrats actifs et historiques
  - Détails couverture et garanties
  - Gestion des sinistres
  - Modification contrat (ajout garanties)
  - Résiliation et renouvellement
  - Documents contractuels

### 5. Gestion des Documents
- **Description**: Espace de stockage et gestion des documents importants
- **Sous-fonctionnalités**:
  - Upload documents (permis, carte grise, etc.)
  - Classification et tags
  - Recherche dans documents
  - Partage sécurisé documents
  - Expiration alertes documents
  - Versioning documents

### 6. Notifications et Alertes
- **Description**: Système centralisé de notifications personnalisées
- **Sous-fonctionnalités**:
  - Centre de notifications
  - Préférences de notification
  - Historique notifications
  - Actions rapides depuis notifications
  - Emails et SMS personnalisés
  - Alertes push mobile

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// UserDashboard.tsx - Tableau bord principal
interface UserDashboardProps {
  user: User
  onNavigation: (section: string) => void
}

// ProfileManager.tsx - Gestion profil
interface ProfileManagerProps {
  user: User
  onUpdate: (updates: Partial<User>) => Promise<void>
  onPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>
}

// ContractManager.tsx - Gestion contrats
interface ContractManagerProps {
  contracts: Contract[]
  onContractAction: (contractId: string, action: ContractAction) => Promise<void>
}

// DocumentUploader.tsx - Upload documents
interface DocumentUploaderProps {
  onUpload: (files: File[], metadata: DocumentMetadata) => Promise<void>
  acceptedTypes: string[]
  maxFileSize: number
}
```

### Structures de Données
```typescript
// User.ts - Structure utilisateur
interface User {
  id: string
  email: string
  profile: UserProfile
  preferences: UserPreferences
  security: UserSecurity
  subscription: UserSubscription
  createdAt: Date
  updatedAt: Date
}

interface UserProfile {
  firstName: string
  lastName: string
  phone: string
  address: Address
  avatar?: string
  dateOfBirth: Date
  profession?: string
}

interface UserPreferences {
  language: 'fr' | 'en'
  timezone: string
  currency: string
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  newsletter: boolean
}

// Contract.ts - Structure contrat
interface Contract {
  id: string
  number: string
  status: 'active' | 'pending' | 'expired' | 'cancelled'
  offer: Offer
  startDate: Date
  endDate: Date
  premium: PremiumInfo
  coverage: ContractCoverage
  documents: ContractDocument[]
  claims: Claim[]
  payments: Payment[]
}
```

### Contextes et Hooks
```typescript
// UserContext.tsx - Contexte utilisateur
interface UserContextType {
  user: User | null
  isLoading: boolean
  error: string | null

  // Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
}

// useUserDashboard.ts - Hook tableau bord
interface UseUserDashboardReturn {
  stats: DashboardStats
  recentActivity: Activity[]
  upcomingRenewals: Renewal[]
  notifications: Notification[]
  refresh: () => Promise<void>
}
```

## 📊 APIs et Services

### UserService
```typescript
interface IUserService {
  getProfile(userId: string): Promise<User>
  updateProfile(userId: string, updates: Partial<User>): Promise<User>
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>
  uploadAvatar(userId: string, file: File): Promise<string>
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>
  deleteAccount(userId: string, password: string): Promise<void>
}
```

### ContractService
```typescript
interface IContractService {
  getUserContracts(userId: string): Promise<Contract[]>
  getContract(contractId: string): Promise<Contract>
  updateContract(contractId: string, updates: Partial<Contract>): Promise<Contract>
  cancelContract(contractId: string, reason: string): Promise<void>
  renewContract(contractId: string): Promise<Contract>
  addGuarantee(contractId: string, guaranteeId: string): Promise<Contract>
}
```

### DocumentService
```typescript
interface IDocumentService {
  uploadDocument(userId: string, file: File, metadata: DocumentMetadata): Promise<Document>
  getUserDocuments(userId: string, filters?: DocumentFilters): Promise<Document[]>
  updateDocument(documentId: string, updates: Partial<Document>): Promise<Document>
  deleteDocument(documentId: string): Promise<void>
  shareDocument(documentId: string, recipients: string[], permissions: SharePermissions): Promise<void>
  searchDocuments(userId: string, query: string): Promise<Document[]>
}
```

### NotificationService
```typescript
interface INotificationService {
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>
  markNotificationAsRead(notificationId: string): Promise<void>
  markAllNotificationsAsRead(userId: string): Promise<void>
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>
  sendNotification(userId: string, notification: CreateNotificationRequest): Promise<Notification>
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **UserDashboardPage** (`/tableau-de-bord`)
   - Vue d'overview complète
   - Widgets personnalisables
   - Accès rapides

2. **UserProfilePage** (`/profil`)
   - Formulaire profil complet
   - Changement mot de passe
   - Préférences utilisateur

3. **UserQuotesPage** (`/mes-devis`)
   - Liste devis avec statuts
   - Actions rapides
   - Filtres et recherche

4. **UserContractsPage** (`/mes-contrats`)
   - Contrats actifs et historiques
   - Détails et documents
   - Gestion sinistres

5. **UserDocumentsPage** (`/mes-documents`)
   - Upload et gestion documents
   - Classification et recherche
   - Partage sécurisé

6. **UserNotificationsPage** (`/mes-notifications`)
   - Centre notifications
   - Préférences et historique

### Composants Principaux
- **DashboardWidget**: Widgets tableau bord réutilisables
- **ContractCard**: Card contrat avec actions
- **QuoteStatus**: Indicateur statut devis
- **DocumentPreview**: Aperçu documents
- **NotificationCenter**: Centre notifications
- **ProfileForm**: Formulaire profil avec validation
- **SecuritySettings**: Paramètres sécurité

### Navigation et Layout
- **UserLayout**: Layout spécifique utilisateur
- **SidebarMenu**: Menu latéral navigation
- **Breadcrumbs**: Fil d'Ariane navigation
- **QuickActions**: Actions rapides accessibles

## 🧪 Tests

### Tests Unitaires
```typescript
// UserProfileForm.test.tsx
describe('UserProfileForm', () => {
  it('valide correctement les champs profil', async () => {
    const mockOnSubmit = jest.fn()
    render(<UserProfileForm user={mockUser} onSubmit={mockOnSubmit} />)

    await fireEvent.change(screen.getByTestId('firstName'), { target: { value: 'John' } })
    await fireEvent.change(screen.getByTestId('lastName'), { target: { value: 'Doe' } })
    await fireEvent.click(screen.getByTestId('save-profile'))

    expect(mockOnSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe'
    })
  })

  it('affiche erreurs validation', async () => {
    render(<UserProfileForm user={mockUser} onSubmit={jest.fn()} />)

    await fireEvent.change(screen.getByTestId('email'), { target: { value: 'invalid-email' } })
    await fireEvent.blur(screen.getByTestId('email'))

    expect(screen.getByText('Email invalide')).toBeInTheDocument()
  })
})

// ContractCard.test.tsx
describe('ContractCard', () => {
  it('affiche informations contrat correctement', () => {
    const mockContract = createMockContract()
    render(<ContractCard contract={mockContract} onAction={jest.fn()} />)

    expect(screen.getByText(mockContract.offer.name)).toBeInTheDocument()
    expect(screen.getByText(mockContract.status)).toBeInTheDocument()
    expect(screen.getByText(`${mockContract.premium.amount}€/an`)).toBeInTheDocument()
  })
})
```

### Tests d'Intégration
- **Flux profil complet**
- **Gestion contrats**
- **Upload documents**
- **Workflow notifications**

### Tests E2E (Playwright)
```typescript
// user-dashboard.spec.ts
test('tableau bord utilisateur complet', async ({ page }) => {
  await page.goto('/connexion')
  await loginAsUser(page)

  // Vérification tableau bord
  await expect(page).toHaveURL('/tableau-de-bord')
  await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible()
  await expect(page.locator('[data-testid="active-contracts"]')).toBeVisible()
  await expect(page.locator('[data-testid="recent-quotes"]')).toBeVisible()

  // Navigation vers profil
  await page.click('[data-testid="nav-profile"]')
  await expect(page).toHaveURL('/profil')

  // Mise à jour profil
  await page.fill('[data-testid="phone"]', '0612345678')
  await page.click('[data-testid="save-profile"]')
  await expect(page.getByText('Profil mis à jour')).toBeVisible()

  // Navigation vers documents
  await page.click('[data-testid="nav-documents"]')
  await page.setInputFiles('[data-testid="file-upload"]', 'test-permis.pdf')
  await page.fill('[data-testid="document-name"]', 'Permis de conduire')
  await page.click('[data-testid="upload-document"]')
  await expect(page.getByText('Document uploadé avec succès')).toBeVisible()
})
```

## 📈 Performance

### Optimisations
- **Dashboard Caching**: Cache données tableau bord
- **Image Optimization**: Optimisation avatars et documents
- **Lazy Loading**: Chargement progressif composants
- **API Debouncing**: Limitation appels API
- **LocalStorage**: Cache préférences utilisateur

### Monitoring
- **Page Load Times**: Temps chargement pages utilisateur
- **Interaction Rates**: Taux interaction fonctionnalités
- **Error Rates**: Erreurs formulaires et actions
- **Feature Usage**: Utilisation fonctionnalités principales

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Validation Errors**: Erreurs formulaires
2. **Upload Errors**: Problèmes upload documents
3. **API Errors**: Problèmes communication backend
4. **Permission Errors**: Actions non autorisées
5. **Network Errors**: Problèmes connexion

### Stratégies de Gestion
- **Form Validation**: Validation temps réel
- **Retry Logic**: Tentatives automatiques
- **Offline Support**: Mode dégradé
- **User Feedback**: Messages erreurs clairs
- **Graceful Degradation**: Fonctionnalités limitées

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Mobile App**: Application mobile native
- **Real-time Updates**: Mises à jour temps réel
- **Advanced Analytics**: Analytics personnelles
- **Voice Commands**: Commandes vocales

### Moyen Terme (3-6 mois)
- **AI Assistant**: Assistant personnel IA
- **Predictive Insights**: Prédictions besoins
- **Integration Bank**: Connexion banques
- **Family Accounts**: Comptes famille

### Long Terme (6+ mois)
- **Blockchain Identity**: Identité blockchain
- **IoT Integration**: IoT smart home
- **Personalized Pricing**: Tarification personnalisée
- **Full Automation**: Automatisation complète

## 📚 Documentation Complémentaire

- [Guide gestion profil utilisateur](./profile-management.md)
- [Configuration notifications](./notification-setup.md)
- [Sécurité compte utilisateur](./user-security.md)
- [Gestion documents avancée](./document-management.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Espace Client & Expérience Utilisateur*