# Module Core - Documentation

## 🎯 Objectif du Module

Le module Core constitue le fondation technique de toute l'application NOLI Assurance. Il fournit les services essentiels partagés par tous les autres modules.

## 📋 Fonctionnalités Principales

### 1. Authentification Centralisée
- **Description**: Gère l'ensemble du cycle d'authentification des utilisateurs
- **Sous-fonctionnalités**:
  - Connexion/Déconnexion sécurisée
  - Gestion des tokens avec cookies httpOnly
  - Rafraîchissement automatique des sessions
  - Support OAuth (Google, Facebook, GitHub)
  - Validation des permissions

### 2. Routage et Navigation
- **Description**: Architecture de routage sécurisée avec lazy loading
- **Sous-fonctionnalités**:
  - Routes protégées par garde-fous
  - Redirections selon les rôles
  - Chargement progressif des composants
  - Gestion des erreurs 404
  - Barres de navigation dynamiques

### 3. Connexion Base de Données
- **Description**: Interface centralisée pour Supabase
- **Sous-fonctionnalités**:
  - Configuration client Supabase
  - Helper functions pour opérations courantes
  - Gestion des erreurs BDD
  - Pool de connexions optimisé
  - Support transactionnel

### 4. Gestion des Thèmes
- **Description**: Système de thématisation pour l'interface
- **Sous-fonctionnalités**:
  - Mode clair/sombre
  - Personnalisation des couleurs
  - Persistance des préférences
  - Transitions animées
  - Support accessibilité

### 5. Gestion des Permissions
- **Description**: Système RBAC (Role-Based Access Control)
- **Sous-fonctionnalités**:
  - Cache des permissions
  - Validation granulaire
  - Héritage des rôles
  - Audit des accès
  - Permissions dynamiques

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// AuthContext.tsx - Gestion état authentification
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
}

// supabase.ts - Configuration BDD
const supabase = createClient<Database>(url, key, {
  auth: { flowType: 'pkce' }
})

// AppRoutes.tsx - Configuration routage
const routes = [
  { path: '/admin', element: <AdminLayout />, guard: 'admin' },
  { path: '/user', element: <UserLayout />, guard: 'user' }
]
```

### Flux Authentification
1. **Initialisation**: Vérification session existante
2. **Login**: Validation identifiants → Token → Context
3. **Redirection**: Selon rôle utilisateur
4. **Persistance**: Cookies sécurisés + cache local
5. **Logout**: Nettoyage session + redirection

### Sécurité Implémentée
- **PKCE Flow**: Protection contre les attaques par injection
- **Cookies httpOnly**: Protection XSS
- **CSP**: Politique de sécurité contenu
- **Role Guards**: Protection routes
- **Permission Cache**: Optimisation validation

## 📊 APIs et Interfaces

### AuthInterface
```typescript
interface IAuthService {
  signIn(email: string, password: string): Promise<User>
  signUp(userData: RegisterData): Promise<User>
  signOut(): Promise<void>
  refreshToken(): Promise<void>
  hasPermission(permission: string): boolean
}
```

### DatabaseInterface
```typescript
interface IDatabaseService {
  query<T>(sql: string, params?: any[]): Promise<T[]>
  transaction<T>(callback: () => Promise<T>): Promise<T>
  subscribe<T>(table: string, callback: (data: T) => void): void
}
```

### RoutingInterface
```typescript
interface IRoutingService {
  navigate(path: string): void
  protectRoute(roles: string[]): boolean
  redirectByRole(user: User): string
}
```

## 🔧 Configuration

### Variables d'Environnement
```bash
# Configuration Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Features Authentification
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_MFA=false

# Configuration Application
VITE_SESSION_TIMEOUT_HOURS=24
VITE_MAX_LOGIN_ATTEMPTS=5
```

### Configuration Vite
```typescript
// Code splitting optimisé
manualChunks: {
  vendor: ['react', 'react-dom'],
  supabase: ['@supabase/supabase-js'],
  router: ['react-router-dom']
}
```

## 🧪 Tests

### Tests Unitaires
- **AuthContext**: Validation états et transitions
- **AuthGuard**: Tests protection routes
- **PermissionCache**: Validation cache permissions
- **ThemeContext**: Tests changements thèmes

### Tests d'Intégration
- **Flux authentification complet**
- **Redirections selon rôles**
- **Rafraîchissement tokens**
- **Gestion erreurs BDD**

### Tests E2E
- **Login → Dashboard → Logout**
- **Accès refusé routes protégées**
- **Changement thème persistant**
- **Timeout session**

## 📈 Performance

### Optimisations
- **Lazy Loading**: Routes et composants lourds
- **Permission Cache**: Évite requêtes répétées
- **Session Persistence**: Cookies optimisés
- **Bundle Splitting**: Modules séparés

### Monitoring
- **Sentry**: Tracking erreurs authentification
- **Performance Analytics**: Temps de connexion
- **User Analytics**: Taux de conversion login

## 🚨 Erreurs Communes

### Problèmes Connus
1. **Session Expired**: Gestion automatique reconnexion
2. **Permission Denied**: Messages clairs utilisateurs
3. **Network Error**: Mode dégradé avec cache
4. **CORS Issues**: Configuration Supabase

### Solutions
- **Retry Logic**: 3 tentatives max avec backoff
- **Fallback Modes**: Cache local si BDD indisponible
- **User Feedback**: Messages d'erreur explicites
- **Graceful Degradation**: Fonctionnalités limitées offline

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Multi-Factor Authentication**
- **Biometric Authentication**
- **Session Management Avancé**
- **Audit Logging Complet**

### Moyen Terme (3-6 mois)
- **Single Sign-On (SSO)**
- **LDAP Integration**
- **Advanced RBAC**
- **Consent Management**

### Long Terme (6+ mois)
- **Zero Trust Architecture**
- **Machine Learning Security**
- **Advanced Analytics**
- **Compliance Tools**

## 📚 Documentation Complémentaire

- [Guide d'implémentation authentification](./auth-implementation.md)
- [Configuration permissions avancées](./permissions-config.md)
- [Performance tuning guide](./performance-tuning.md)
- [Security best practices](./security-practices.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Core Infrastructure*