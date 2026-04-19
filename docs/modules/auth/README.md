# Module Auth - Documentation

## 🎯 Objectif du Module

Le module Auth gère l'ensemble de l'expérience d'authentification utilisateur, de la création de compte à la gestion des mots de passe, en passant par l'authentification sociale.

## 📋 Fonctionnalités Principales

### 1. Connexion Utilisateur
- **Description**: Interface de connexion sécurisée avec validation en temps réel
- **Sous-fonctionnalités**:
  - Formulaire email/mot de passe
  - Validation visuelle des champs
  - Messages d'erreur contextuels
  - Option "Se souvenir de moi"
  - Lien mot de passe oublié
  - Support authentification sociale

### 2. Création de Compte
- **Description**: Processus d'inscription complet avec validation multi-étapes
- **Sous-fonctionnalités**:
  - Formulaire d'inscription complet
  - Vérification email en temps réel
  - Validation force mot de passe
  - Acceptation CGU
  - Vérification compte par email
  - Welcome email

### 3. Gestion Mot de Passe
- **Description**: Sécurisation complète des mots de passe utilisateur
- **Sous-fonctionnalités**:
  - Mot de passe oublié
  - Réinitialisation par email
  - Force mot de passe indicator
  - Historique mots de passe
  - Expiration automatique
  - Confirmation changement

### 4. Authentification Sociale
- **Description**: Connexion via fournisseurs OAuth tiers
- **Sous-fonctionnalités**:
  - Connexion Google
  - Connexion Facebook
  - Connexion GitHub
  - Mapping profils sociaux
  - Import automatique données
  - Gestion consentements

### 5. Validation et Sécurité
- **Description**: Protection contre les menaces et validation robuste
- **Sous-fonctionnalités**:
  - Rate limiting (max 5 tentatives)
  - CAPTCHA si nécessaire
  - Vérification email
  - Politique mots de passe
  - Logs de connexion
  - Détection anomalies

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// LoginForm.tsx - Formulaire de connexion
interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

// RegisterForm.tsx - Formulaire d'inscription
interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  acceptTerms: boolean
}

// PasswordResetForm.tsx - Réinitialisation mot de passe
interface PasswordResetData {
  email: string
  token: string
  newPassword: string
  confirmPassword: string
}
```

### Schémas de Validation (Zod)
```typescript
// login.schema.ts
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Min 8 caractères')
})

// register.schema.ts
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Min 8 caractères')
    .regex(/[A-Z]/, '1 majuscule requise')
    .regex(/[0-9]/, '1 chiffre requis'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas"
})
```

### Flux Utilisateur
1. **Arrivée**: Page d'accueil authentification
2. **Choix**: Login / Register / Social Login
3. **Validation**: Formulaire avec feedback temps réel
4. **Soumission**: Appel API avec loading state
5. **Résultat**: Succès → redirection / Erreur → correction
6. **Post-auth**: Initialisation contexte utilisateur

## 📊 APIs et Services

### AuthService
```typescript
interface IAuthService {
  signIn(credentials: LoginCredentials): Promise<AuthResult>
  signUp(userData: RegisterData): Promise<AuthResult>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>
  signInWithOAuth(provider: OAuthProvider): Promise<void>
}

interface AuthResult {
  success: boolean
  user?: User
  error?: string
  requiresVerification?: boolean
}
```

### OAuthService
```typescript
interface IOAuthService {
  getAuthUrl(provider: OAuthProvider): string
  handleCallback(code: string, state: string): Promise<OAuthResult>
  linkAccount(userId: string, provider: OAuthProvider): Promise<void>
  unlinkAccount(userId: string, provider: OAuthProvider): Promise<void>
}
```

### ValidationService
```typescript
interface IValidationService {
  validateEmail(email: string): Promise<EmailValidationResult>
  validatePassword(password: string): PasswordStrength
  checkPasswordHistory(userId: string, newPassword: string): Promise<boolean>
  detectSuspiciousActivity(email: string): Promise<boolean>
}
```

## 🔧 Configuration

### Variables d'Environnement
```bash
# Configuration Authentification
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_PHONE_VERIFICATION=false
VITE_ENABLE_MFA=false

# OAuth Providers
VITE_GOOGLE_CLIENT_ID=...
VITE_FACEBOOK_APP_ID=...
VITE_GITHUB_CLIENT_ID=...

# Sécurité
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_DURATION_MINUTES=15
VITE_PASSWORD_MIN_LENGTH=8
VITE_SESSION_TIMEOUT_HOURS=24

# Emails
VITE_EMAIL_FROM=noreply@noliassurance.com
VITE_EMAIL_SUPPORT=support@noliassurance.com
```

### Configuration OAuth
```typescript
// oauth.config.ts
export const oauthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: ['email', 'profile'],
    redirectUri: `${window.location.origin}/auth/callback`
  },
  facebook: {
    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
    scope: ['email', 'public_profile'],
    redirectUri: `${window.location.origin}/auth/facebook/callback`
  }
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **LoginPage** (`/auth/connexion`)
   - Formulaire connexion principal
   - Options sociales
   - Liens vers register/forgot

2. **RegisterPage** (`/auth/inscription`)
   - Formulaire d'inscription
   - Validation temps réel
   - Progression multi-étapes

3. **ForgotPasswordPage** (`/auth/mot-de-passe-oublie`)
   - Email pour réinitialisation
   - Confirmation envoi
   - Retour connexion

4. **ResetPasswordPage** (`/auth/reset-password?token=...`)
   - Nouveau mot de passe
   - Confirmation
   - Redirection post-succès

5. **CallbackPage** (`/auth/callback`)
   - Traitement retour OAuth
   - Redirection automatique
   - Gestion erreurs

### Composants Réutilisables
- **AuthLayout**: Layout commun pages auth
- **SocialLoginButtons**: Boutons connexion sociale
- **PasswordStrengthIndicator**: Barre force mot de passe
- **ValidationMessage**: Messages d'erreur/validation
- **LoadingSpinner**: Loading states authentification

## 🧪 Tests

### Tests Unitaires
```typescript
// LoginForm.test.tsx
describe('LoginForm', () => {
  it('valide email correctement', () => {
    // Test validation email
  })

  it('affiche erreurs validation', () => {
    // Test messages d'erreur
  })

  it('soumet formulaire valide', () => {
    // Test soumission réussie
  })
})

// AuthContext.test.tsx
describe('AuthContext', () => {
  it('gère état connexion', () => {
    // Test état authentification
  })

  it('stocke permissions correctement', () => {
    // Test gestion permissions
  })
})
```

### Tests d'Intégration
- **Flux connexion complet**
- **Validation formulaire multi-étapes**
- **OAuth flow complet**
- **Réinitialisation mot de passe**

### Tests E2E (Playwright)
```typescript
// auth-flow.spec.ts
test('flux inscription complet', async ({ page }) => {
  await page.goto('/auth/inscription')
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'SecurePass123!')
  await page.fill('[data-testid="confirmPassword"]', 'SecurePass123!')
  await page.click('[data-testid="register-button"]')
  await expect(page).toHaveURL('/tableau-de-bord')
})

test('connexion OAuth Google', async ({ page }) => {
  await page.goto('/auth/connexion')
  await page.click('[data-testid="google-login"]')
  // Test flow OAuth...
})
```

## 📈 Performance

### Optimisations
- **Form Debouncing**: Validation en temps réel optimisée
- **Image Lazy Loading**: Logos réseaux sociaux
- **Code Splitting**: Séparation forms/auth
- **Cache Validation**: Mémorisation résultats validation

### Monitoring
- **Conversion Rate**: Taux inscription réussie
- **Error Rate**: Erreurs validation/authentification
- **Performance**: Temps chargement pages
- **User Analytics**: Parcours utilisateurs

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Validation Errors**: Champs invalides
2. **Network Errors**: Problèmes connexion API
3. **Auth Errors**: Identifiants incorrects
4. **OAuth Errors**: Échec connexion sociale
5. **Rate Limit Errors**: Trop de tentatives

### Stratégies de Gestion
- **User-Friendly Messages**: Messages clairs et actionnables
- **Retry Logic**: Tentatives automatiques pour erreurs réseau
- **Graceful Degradation**: Mode limité si service indisponible
- **Error Logging**: Traçage complet pour debugging

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Phone Verification**: Vérification par SMS
- **Biometric Auth**: Empreinte/Face ID
- **Magic Links**: Connexion sans mot de passe
- **Advanced CAPTCHA**: Protection renforcée

### Moyen Terme (3-6 mois)
- **Multi-Factor Authentication**
- **Social Proof**: Connexion via réseaux sociaux
- **Passwordless Authentication**
- **Advanced Security Monitoring**

### Long Terme (6+ mois)
- **Decentralized Identity**: Web3/Blockchain
- **Zero-Knowledge Proofs**
- **AI-Powered Security**
- **Advanced Fraud Detection**

## 📚 Documentation Complémentaire

- [Guide d'implémentation OAuth](./oauth-implementation.md)
- [Politique mots de passe](./password-policy.md)
- [Configuration emails transactionnels](./email-configuration.md)
- [Guide de sécurité authentification](./auth-security.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Authentification & Sécurité*