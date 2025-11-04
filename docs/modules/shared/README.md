# Module Shared - Documentation

## 🎯 Objectif du Module

Le module Shared contient tous les composants, services et utilitaires partagés entre les différents modules de la plateforme NOLI. Il assure la cohérence, la réutilisabilité et la maintenance facilitée du code.

## 📋 Fonctionnalités Principales

### 1. Composants UI Partagés
- **Description**: Bibliothèque de composants UI réutilisables et cohérents
- **Sous-fonctionnalités**:
  - Composants shadcn/ui (42+ composants de base)
  - Composants métiers personnalisés
  - Thème et design system unifié
  - Composants responsive et accessibles
  - Documentation avec Storybook
  - Tests automatisés

### 2. Services Techniques Communs
- **Description**: Services partagés utilisés par plusieurs modules
- **Sous-fonctionnalités**:
  - Service PDF generation
  - Service notifications
  - Service temps réel
  - Service validation
  - Service stockage fichiers
  - Service logging

### 3. Utilitaires et Helpers
- **Description**: Fonctions utilitaires et helpers pour opérations communes
- **Sous-fonctionnalités**:
  - Formateurs de données
  - Validateurs
  - Calculateurs métier
  - Constantes et enums
  - Fonctions date/heure
  - Helpers URL et navigation

### 4. Types TypeScript Partagés
- **Description**: Définitions de types communes à toute l'application
- **Sous-fonctionnalités**:
  - Types base de données
  - Types API
  - Types métier
  - Interfaces génériques
  - Enums et constantes typées
  - Types utilitaires

### 5. Hooks Personnalisés
- **Description**: Hooks React réutilisables pour logique partagée
- **Sous-fonctionnalités**:
  - Hooks API
  - Hooks UI
  - Hooks business
  - Hooks utilitaires
  - Hooks performance
  - Hooks testing

## 🏗️ Architecture Technique

### Structure des Dossiers
```
shared/
├── components/                    # Composants partagés
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Composants formulaires
│   ├── layout/                   # Composants layout
│   ├── charts/                   # Composants graphiques
│   └── common/                   # Composants communs
├── services/                      # Services techniques
│   ├── pdfService.ts
│   ├── notificationService.ts
│   ├── realtimeService.ts
│   ├── validationService.ts
│   └── storageService.ts
├── utils/                         # Utilitaires
│   ├── formatters.ts
│   ├── validators.ts
│   ├── calculators.ts
│   ├── constants.ts
│   └── helpers.ts
├── types/                         # Types partagés
│   ├── database.ts
│   ├── api.ts
│   ├── business.ts
│   └── common.ts
├── hooks/                         # Hooks personnalisés
│   ├── useApi.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useFormat.ts
└── styles/                        # Styles partagés
    ├── theme.ts
    ├── animations.ts
    └── responsive.ts
```

### Composants UI Principaux
```typescript
// BaseButton.tsx - Bouton de base
interface BaseButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
}

// DataTable.tsx - Tableau de données
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  pagination?: PaginationConfig
  sorting?: SortingConfig
  filtering?: FilteringConfig
  onRowClick?: (row: T) => void
}

// Modal.tsx - Modal réutilisable
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  footer?: ReactNode
}
```

### Services Partagés
```typescript
// pdfService.ts - Service génération PDF
export class PDFService {
  async generateDocument(template: PDFTemplate, data: any): Promise<Blob>
  async mergePDFs(pdfs: Blob[]): Promise<Blob>
  async optimizePDF(pdf: Blob): Promise<Blob>
  async addWatermark(pdf: Blob, watermark: string): Promise<Blob>
}

// notificationService.ts - Service notifications
export class NotificationService {
  async sendEmail(notification: EmailNotification): Promise<EmailResult>
  async sendSMS(notification: SMSNotification): Promise<SMSResult>
  async sendPush(notification: PushNotification): Promise<PushResult>
  async scheduleNotification(notification: ScheduledNotification): Promise<void>
}

// validationService.ts - Service validation
export class ValidationService {
  validateEmail(email: string): boolean
  validatePhone(phone: string): boolean
  validatePassword(password: string): PasswordStrength
  validateForm(data: any, schema: z.ZodSchema): ValidationResult
}
```

### Hooks Personnalisés
```typescript
// useApi.ts - Hook appels API
export function useApi<T>(
  url: string,
  options?: UseApiOptions
): {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (data: any) => Promise<T>
}

// useLocalStorage.ts - Hook local storage
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void]

// useDebounce.ts - Hook debounce
export function useDebounce<T>(
  value: T,
  delay: number
): T
```

## 📊 Composants Disponibles

### shadcn/ui Components
```typescript
// Composants de base disponibles (42+)
- Button, Input, Select, Checkbox, Radio
- Dialog, Sheet, Drawer, Popover
- Table, Card, Badge, Avatar
- Tabs, Accordion, Collapsible
- Progress, Slider, Switch
- Toast, Alert, Alert Dialog
- Form, Label, Textarea
- Dropdown Menu, Context Menu
- Navigation Menu, Command
- Scroll Area, Separator
- Aspect Ratio, Toggle
```

### Composants Métiers
```typescript
// FormComponents.tsx - Composants formulaires métier
- VehicleForm: Formulaire véhicule
- PersonalInfoForm: Formulaire infos personnelles
- CoverageSelector: Sélecteur couverture
- PaymentForm: Formulaire paiement
- QuoteSummary: Résumé devis

// ChartComponents.tsx - Composants graphiques
- LineChart: Graphique lignes
- BarChart: Graphique barres
- PieChart: Graphique secteurs
- MetricCard: Card métrique
- TrendIndicator: Indicateur tendance

// LayoutComponents.tsx - Composants layout
- PageHeader: En-tête page
- Sidebar: Menu latéral
- Breadcrumb: Fil d'Ariane
- LoadingSpinner: Spinner chargement
- ErrorBoundary: Limite erreurs
```

## 🎨 Design System

### Thème et Couleurs
```typescript
// theme.ts - Configuration thème
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    }
  }
}
```

### Composants Thémés
```typescript
// ThemedComponent.tsx - Exemple composante thémée
export function ThemedButton({ variant, children, ...props }: ButtonProps) {
  const theme = useTheme()

  const styles = {
    primary: {
      backgroundColor: theme.colors.primary[500],
      color: theme.colors.white
    },
    secondary: {
      backgroundColor: theme.colors.gray[200],
      color: theme.colors.gray[800]
    }
  }

  return (
    <button
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🧪 Tests et Documentation

### Tests des Composants
```typescript
// Button.test.tsx - Tests composant bouton
describe('Button', () => {
  it('rend correctement avec les props par défaut', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applique les variantes correctement', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary-500')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
  })
})
```

### Storybook Documentation
```typescript
// Button.stories.tsx - Stories Storybook
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  }
} as ComponentMeta<typeof Button>

export const Primary: ComponentStory<typeof Button> = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
}

export const Secondary: ComponentStory<typeof Button> = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
}
```

## 📈 Performance

### Optimisations
- **Tree Shaking**: Élimination code non utilisé
- **Bundle Splitting**: Séparation bundles composants
- **Lazy Loading**: Chargement à la demande
- **Memoization**: Mémorisation composants coûteux
- **Virtual Scrolling**: Virtualisation listes longues

### Monitoring
- **Component Performance**: Performance composants
- **Bundle Size**: Taille bundles
- **Render Performance**: Performance rendu
- **Memory Usage**: Utilisation mémoire
- **Accessibility Score**: Score accessibilité

## 🚨 Bonnes Pratiques

### Guidelines Développement
1. **Component First**: Composants d'abord, logique après
2. **TypeScript Strict**: Typage strict obligatoire
3. **Tests Automatisés**: Tests unitaires pour chaque composant
4. **Documentation**: Documentation Storybook complète
5. **Accessibility**: Accessibilité WCAG 2.1 AA minimum
6. **Responsive Design**: Mobile-first approach

### Conventions de Nommage
```typescript
// Composants: PascalCase avec préfixe descriptif
export const UserAvatar = ({ user, size }: UserAvatarProps) => {}

// Hooks: camelCase avec préfixe "use"
export function useUserProfile(userId: string) {}

// Utils: camelCase avec nom descriptif
export function formatCurrency(amount: number, currency: string) {}

// Types: PascalCase avec suffixe descriptif
export interface UserProfile {}
export type NotificationStatus = 'sent' | 'delivered' | 'read'
```

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Component Library V2**: Nouvelle version bibliothèque
- **Design Tokens**: Tokens design systématisés
- **Enhanced Testing**: Tests visuels automatisés
- **Performance Monitoring**: Monitoring performance avancé

### Moyen Terme (3-6 mois)
- **Micro-frontends**: Architecture micro-frontends
- **Component Marketplace**: Marketplace composants
- **AI-powered Components**: Composants IA-powered
- **Advanced Theming**: Thématisation avancée

### Long Terme (6+ mois)
- **Cross-platform Components**: Composants multi-plateformes
- **Web Components**: Standards web components
- **Zero-bundle Components**: Composants zero-bundle
- **AI-generated Components**: IA génération composants

## 📚 Documentation Complémentaire

- [Guide contribution composants](./component-contributing.md)
- [Configuration thème avancée](./theme-configuration.md)
- [Optimisation performance](./performance-optimization.md)
- [Guide accessibilité](./accessibility-guide.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Design System & Composants Partagés*