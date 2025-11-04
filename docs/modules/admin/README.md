# Module Admin - Documentation

## 🎯 Objectif du Module

Le module Admin constitue le centre de contrôle administratif de la plateforme NOLI, permettant la supervision complète, la gestion des utilisateurs et assureurs, et l'administration technique du système.

## 📋 Fonctionnalités Principales

### 1. Tableau de Bord de Supervision
- **Description**: Vue panoramique de l'état de la plateforme
- **Sous-fonctionnalités**:
  - KPIs globaux (utilisateurs, devis, contrats)
  - État système et performance
  - Alertes critiques et notifications
  - Activité en temps réel
  - Statistiques par segment
  - Indicateurs de santé plateforme

### 2. Gestion des Utilisateurs
- **Description**: Administration complète des comptes utilisateurs
- **Sous-fonctionnalités**:
  - Liste utilisateurs avec filtres avancés
  - Création, modification, suppression comptes
  - Gestion des rôles et permissions
  - Activation/désactivation comptes
  - Reset mots de passe
  - Historique actions utilisateur

### 3. Gestion des Assureurs Partenaires
- **Description**: Administration des assureurs partenaires de la plateforme
- **Sous-fonctionnalités**:
  - Onboarding nouveaux assureurs
  - Validation et approbation comptes
  - Configuration contrats partenariat
  - Gération commissions et rémunérations
  - Suivi performance assureurs
  - Support technique dédié

### 4. Configuration Tarification
- **Description**: Outils de configuration des règles tarifaires
- **Sous-fonctionnalités**:
  - Configuration facteurs de risque
  - Définition tranches de tarification
  - Gestion taxes et frais
  - Ajustements saisonniers
  - Validation règles métier
  - Simulation tarification

### 5. Analytics et Reporting
- **Description**: Outils d'analyse et rapports administratifs
- **Sous-fonctionnalités**:
  - Rapports personnalisables
  - Analyse conversion entonnoir
  - Performance par assureur
  - Analyse comportementale
  - Export données massives
  - Dashboard personnalisables

### 6. Audit et Sécurité
- **Description**: Outils de surveillance et audit de sécurité
- **Sous-fonctionnalités**:
  - Logs d'audit complets
  - Détection anomalies
  - Gestion permissions fines
  - Politiques de sécurité
  - Backups et restauration
  - Monitoring sécurité

### 7. Maintenance Système
- **Description**: Outils de maintenance technique de la plateforme
- **Sous-fonctionnalités**:
  - Gestion des mises à jour
  - Configuration systèmes
  - Monitoring performance
  - Gestion erreurs systèmes
  - Nettoyage données
  - Health checks

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// AdminDashboard.tsx - Tableau bord supervision
interface AdminDashboardProps {
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  refreshData: () => void
}

// UserManager.tsx - Gestionnaire utilisateurs
interface UserManagerProps {
  users: User[]
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onUserAction: (userId: string, action: UserAction) => Promise<void>
}

// RoleManager.tsx - Gestionnaire rôles
interface RoleManagerProps {
  roles: Role[]
  permissions: Permission[]
  onRoleUpdate: (roleId: string, updates: Partial<Role>) => Promise<void>
  onPermissionUpdate: (permissionId: string, updates: Partial<Permission>) => Promise<void>
}

// SystemMonitor.tsx - Moniteur système
interface SystemMonitorProps {
  systemHealth: SystemHealth
  metrics: SystemMetrics
  alerts: SystemAlert[]
  onResolveAlert: (alertId: string) => Promise<void>
}
```

### Structures de Données
```typescript
// Admin.ts - Structure administrateur
interface Admin {
  id: string
  user: User
  permissions: AdminPermission[]
  settings: AdminSettings
  lastLogin: Date
  sessions: AdminSession[]
}

interface AdminSettings {
  defaultTimeRange: TimeRange
  notifications: NotificationSettings
  dashboardLayout: DashboardLayout
  preferredLanguage: string
  timezone: string
}

// SystemHealth.ts - État système
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  services: ServiceHealth[]
  performance: PerformanceMetrics
  resources: ResourceUsage
  uptime: number
  lastIncident?: Incident
}

// AuditLog.ts - Log d'audit
interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  action: AuditAction
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
}
```

### Contextes et Hooks
```typescript
// AdminContext.tsx - Contexte admin
interface AdminContextType {
  admin: Admin | null
  systemHealth: SystemHealth
  globalMetrics: GlobalMetrics
  recentAlerts: SystemAlert[]

  // Actions
  refreshSystemHealth: () => Promise<void>
  updateUserRole: (userId: string, role: Role) => Promise<void>
  resolveAlert: (alertId: string) => Promise<void>
  exportData: (exportType: ExportType, filters?: ExportFilters) => Promise<Blob>
}

// useAdminAnalytics.ts - Hook analytics admin
interface UseAdminAnalyticsReturn {
  metrics: GlobalMetrics
  isLoading: boolean
  error: string | null
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void
  generateReport: (reportConfig: ReportConfig) => Promise<Report>
  exportData: (exportConfig: ExportConfig) => Promise<void>
}
```

## 📊 APIs et Services

### AdminService
```typescript
interface IAdminService {
  getAdminProfile(adminId: string): Promise<Admin>
  updateAdminSettings(adminId: string, settings: Partial<AdminSettings>): Promise<Admin>
  getSystemHealth(): Promise<SystemHealth>
  getGlobalMetrics(timeRange: TimeRange): Promise<GlobalMetrics>
  generateSystemReport(reportConfig: SystemReportConfig): Promise<SystemReport>
}
```

### UserManagementService
```typescript
interface IUserManagementService {
  getUsers(filters?: UserFilters): Promise<User[]>
  createUser(userData: CreateAdminUserRequest): Promise<User>
  updateUser(userId: string, updates: Partial<User>): Promise<User>
  deleteUser(userId: string): Promise<void>
  activateUser(userId: string): Promise<User>
  deactivateUser(userId: string): Promise<User>
  resetUserPassword(userId: string): Promise<string>
}
```

### RoleManagementService
```typescript
interface IRoleManagementService {
  getRoles(): Promise<Role[]>
  getPermissions(): Promise<Permission[]>
  createRole(roleData: CreateRoleRequest): Promise<Role>
  updateRole(roleId: string, updates: Partial<Role>): Promise<Role>
  deleteRole(roleId: string): Promise<void>
  assignRole(userId: string, roleId: string): Promise<void>
  removeRole(userId: string, roleId: string): Promise<void>
}
```

### SystemMaintenanceService
```typescript
interface ISystemMaintenanceService {
  getSystemStatus(): Promise<SystemStatus>
  triggerMaintenance(maintenanceType: MaintenanceType): Promise<void>
  getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]>
  clearCache(cacheType?: CacheType): Promise<void>
  backupDatabase(): Promise<BackupResult>
  restoreDatabase(backupId: string): Promise<RestoreResult>
}
```

### AnalyticsService
```typescript
interface IAnalyticsService {
  getPlatformMetrics(timeRange: TimeRange): Promise<PlatformMetrics>
  getUserAnalytics(timeRange: TimeRange): Promise<UserAnalytics>
  getInsurerAnalytics(timeRange: TimeRange): Promise<InsurerAnalytics>
  getConversionAnalytics(timeRange: TimeRange): Promise<ConversionAnalytics>
  generateCustomReport(reportConfig: CustomReportConfig): Promise<Report>
  exportData(exportConfig: DataExportConfig): Promise<Blob>
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **AdminDashboardPage** (`/admin/tableau-de-bord`)
   - Supervision globale
   - Widgets critiques
   - Alertes prioritaires

2. **AdminUsersPage** (`/admin/utilisateurs`)
   - Gestion complète utilisateurs
   - Actions groupées
   - Import/export données

3. **AdminInsurersPage** (`/admin/assureurs`)
   - Administration assureurs
   - Validation partenariats
   - Suivi performance

4. **AdminTarificationPage** (`/admin/tarification`)
   - Configuration tarification
   - Simulation règles
   - Validation métier

5. **AdminAnalyticsPage** (`/admin/analytics`)
   - Rapports avancés
   - Data exploration
   - Export personnalisé

6. **AdminSecurityPage** (`/admin/securite`)
   - Audit et logs
   - Gestion permissions
   - Monitoring sécurité

7. **AdminSystemPage** (`/admin/systeme`)
   - Maintenance technique
   - Configuration système
   - Health monitoring

### Composants Principaux
- **SystemHealthWidget**: Widget état système
- **UserTable**: Table utilisateurs avancé
- **RoleEditor**: Éditeur rôles et permissions
- **AuditLogViewer**: Visualisateur logs audit
- **AlertManager**: Gestionnaire alertes
- **ConfigEditor**: Éditeur configuration système

### Navigation et Layout
- **AdminLayout**: Layout administration
- **SidebarAdmin**: Menu navigation admin
- **TopBarAdmin**: Barre supérieure admin
- **QuickAdminActions**: Actions rapides admin

## 🧪 Tests

### Tests Unitaires
```typescript
// UserManager.test.tsx
describe('UserManager', () => {
  it('crée nouvel utilisateur correctement', async () => {
    const mockOnCreateUser = jest.fn()
    render(<UserManager onCreateUser={mockOnCreateUser} />)

    await page.click('[data-testid="add-user"]')
    await page.fill('[data-testid="user-email"]', 'admin@example.com')
    await page.selectOption('[data-testid="user-role"]', 'admin')
    await page.click('[data-testid="save-user"]')

    expect(mockOnCreateUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      role: 'admin'
    })
  })
})

// SystemHealthWidget.test.tsx
describe('SystemHealthWidget', () => {
  it('affiche état système correctement', () => {
    const mockHealth = createMockSystemHealth()
    render(<SystemHealthWidget health={mockHealth} />)

    expect(screen.getByText(mockHealth.status)).toBeInTheDocument()
    expect(screen.getByText(`${mockHealth.uptime}%`)).toBeInTheDocument()
  })
})
```

### Tests d'Intégration
- **Workflow création utilisateur**
- **Gestion rôles et permissions**
- **Configuration tarification**
- **Génération rapports admin**

### Tests E2E (Playwright)
```typescript
// admin-workflow.spec.ts
test('workflow administration complet', async ({ page }) => {
  await page.goto('/connexion/admin')
  await loginAsAdmin(page)

  // Vérification tableau bord
  await expect(page).toHaveURL('/admin/tableau-de-bord')
  await expect(page.locator('[data-testid="system-health"]')).toBeVisible()
  await expect(page.locator('[data-testid="global-metrics"]')).toBeVisible()

  // Création utilisateur
  await page.click('[data-testid="nav-users"]')
  await page.click('[data-testid="add-user"]')
  await page.fill('[data-testid="user-email"]', 'newuser@example.com')
  await page.fill('[data-testid="user-firstname"]', 'John')
  await page.fill('[data-testid="user-lastname"]', 'Doe')
  await page.selectOption('[data-testid="user-role"]', 'user')
  await page.click('[data-testid="save-user"]')
  await expect(page.getByText('Utilisateur créé avec succès')).toBeVisible()

  // Gestion assureur
  await page.click('[data-testid="nav-insurers"]')
  await page.click('[data-testid="add-insurer"]')
  await page.fill('[data-testid="insurer-name"]', 'Nouvel Assureur Test')
  await page.fill('[data-testid="insurer-email"]', 'contact@assureur-test.com')
  await page.click('[data-testid="approve-insurer"]')
  await expect(page.getByText('Assureur approuvé avec succès')).toBeVisible()

  // Configuration tarification
  await page.click('[data-testid="nav-tarification"]')
  await page.click('[data-testid="add-risk-factor"]')
  await page.fill('[data-testid="factor-name"]', 'Age du conducteur')
  await page.selectOption('[data-testid="factor-type"]', 'age')
  await page.click('[data-testid="save-factor"]')
  await expect(page.getByText('Facteur de risque créé')).toBeVisible()

  // Génération rapport
  await page.click('[data-testid="nav-analytics"]')
  await page.selectOption('[data-testid="report-type"]', 'user-analytics')
  await page.selectOption('[data-testid="report-period"]', 'last-month')
  await page.click('[data-testid="generate-report"]')
  await page.click('[data-testid="export-pdf"]')
  await expect(page.getByText('Rapport généré avec succès')).toBeVisible()
})
```

## 📈 Performance

### Optimisations
- **Admin Caching**: Cache données administratives
- **Real-time Updates**: Mises à jour temps réel
- **Data Virtualization**: Virtualisation données volumineuses
- **Lazy Loading**: Chargement progressif composants
- **API Optimization**: Optimisation appels API

### Monitoring
- **Admin Performance**: Performance interface admin
- **System Load**: Charge système
- **User Activity**: Activité administrateurs
- **Error Rates**: Taux erreurs système

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Permission Errors**: Actions non autorisées
2. **Validation Errors**: Données invalides
3. **System Errors**: Erreurs système critiques
4. **Business Logic Errors**: Violations règles métier
5. **Network Errors**: Problèmes connectivité

### Stratégies de Gestion
- **Permission Checks**: Validation permissions
- **Data Validation**: Validation stricte données
- **Error Boundaries**: Isolation erreurs
- **Alert System**: Alertes automatiques
- **Fallback Modes**: Mode dégradé

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Real-time Collaboration**: Collaboration temps réel admin
- **Advanced Security**: Sécurité renforcée
- **AI Insights**: IA analyse systèmes
- **Mobile Admin**: Application mobile admin

### Moyen Terme (3-6 mois)
- **Multi-tenant Support**: Support multi-tenants
- **Advanced Analytics**: Analytics prédictives
- **Automation Tools**: Outils automatisation admin
- **API Gateway**: Gateway API admin

### Long Terme (6+ mois)
- **Microservices Architecture**: Architecture microservices
- **Blockchain Security**: Sécurité blockchain
- **ML Anomaly Detection**: ML détection anomalies
- **Full Automation**: Automatisation complète

## 📚 Documentation Complémentaire

- [Guide gestion utilisateurs avancé](./user-management-advanced.md)
- [Configuration sécurité renforcée](./security-hardening.md)
- [Optimisation performance admin](./admin-performance.md)
- [Guide audit et conformité](./audit-compliance.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Administration Plateforme & Système*