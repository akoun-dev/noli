# 📚 Guide d'Installation - Authentification Supabase

Ce guide explique comment configurer et utiliser le système d'authentification Supabase pour NOLI Assurance.

## 🚀 **Configuration Initiale**

### 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL de projet et votre clé anon

### 2. Configurer les variables d'environnement

Copiez `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Configurez les variables suivantes :

```env
# Configuration Supabase
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase

# Autres configurations
VITE_APP_NAME=NOLI Assurance
VITE_DEBUG=true
```

### 3. Exécuter les migrations

Connectez-vous à votre projet Supabase et exécutez les fichiers de migration dans l'ordre :

1. `supabase/migrations/001_create_auth_tables.sql`
2. `supabase/migrations/002_create_indexes.sql`
3. `supabase/migrations/003_enable_rls.sql`
4. `supabase/migrations/004_create_functions.sql`

## 🏗️ **Architecture du Système**

### Tables créées

- **`profiles`** : Extension de `auth.users` avec les informations utilisateur
- **`user_sessions`** : Gestion des sessions actives
- **`password_reset_tokens`** : Tokens de réinitialisation de mot de passe
- **`audit_logs`** : Journal d'audit des actions

### Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Policies** granulaires par rôle et par ressource
- **Permissions** gérées par rôle (USER, INSURER, ADMIN)

## 🔧 **Utilisation du Système**

### AuthContext

Le `AuthContext` fournit toutes les fonctionnalités d'authentification :

```typescript
import { useAuth } from '@/contexts/AuthContext';

const {
  user,
  isAuthenticated,
  isLoading,
  permissions,
  login,
  register,
  logout,
  loginWithOAuth,
  updateUser,
  hasPermission,
  forgotPassword,
  resetPassword
} = useAuth();
```

### Exemples d'utilisation

#### Connexion

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const user = await login(email, password);
    console.log('Connecté:', user);
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
};
```

#### Inscription

```typescript
const handleRegister = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => {
  try {
    const user = await register(userData);
    console.log('Inscrit:', user);
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
  }
};
```

#### Vérification des permissions

```typescript
// Vérifier une permission spécifique
if (hasPermission('read:all_profiles')) {
  // Afficher la liste des utilisateurs
}

// Dans un composant
const { hasPermission } = useAuth();

{hasPermission('manage:system') && (
  <Button>Configuration système</Button>
)}
```

#### OAuth

```typescript
// Connexion avec Google
await loginWithOAuth('google');

// Connexion avec Facebook
await loginWithOAuth('facebook');
```

## 🛡️ **Guards de Route**

### AuthGuard

Protège les routes nécessitant une authentification :

```typescript
// Route protégée simple
<Route path="/dashboard" element={
  <AuthGuard>
    <DashboardPage />
  </AuthGuard>
} />

// Route protégée avec rôle requis
<Route path="/admin" element={
  <AuthGuard requiredRole="ADMIN">
    <AdminPage />
  </AuthGuard>
} />

// Route protégée avec permission requise
<Route path="/users" element={
  <AuthGuard requiredPermission="read:all_profiles">
    <UsersPage />
  </AuthGuard>
} />
```

### RoleGuard

Protège les routes avec plusieurs rôles ou permissions :

```typescript
// Accessible par ADMIN et INSURER
<Route path="/analytics" element={
  <RoleGuard allowedRoles={['ADMIN', 'INSURER']}>
    <AnalyticsPage />
  </RoleGuard>
} />

// Accessible avec permissions spécifiques
<Route path="/tarification" element={
  <RoleGuard 
    allowedRoles={['ADMIN']}
    requiredPermissions={['manage:tarification']}
  >
    <TarificationPage />
  </RoleGuard>
} />
```

## 🔐 **Permissions par Rôle**

### USER
- `read:own_profile` - Lire son profil
- `update:own_profile` - Mettre à jour son profil
- `read:own_quotes` - Lire ses devis
- `create:quotes` - Créer des devis
- `read:own_policies` - Lire ses contrats
- `create:payments` - Effectuer des paiements

### INSURER
- Toutes les permissions USER +
- `read:own_offers` - Lire ses offres
- `create:offers` - Créer des offres
- `update:own_offers` - Mettre à jour ses offres
- `read:quotes` - Lire tous les devis
- `respond:quotes` - Répondre aux devis
- `read:own_analytics` - Lire ses analytics
- `manage:clients` - Gérer les clients

### ADMIN
- Toutes les permissions INSURER +
- `read:all_profiles` - Lire tous les profils
- `update:all_profiles` - Mettre à jour tous les profils
- `create:profiles` - Créer des profils
- `delete:profiles` - Supprimer des profils
- `read:all_offers` - Lire toutes les offres
- `update:all_offers` - Mettre à jour toutes les offres
- `delete:offers` - Supprimer des offres
- `read:all_quotes` - Lire tous les devis
- `manage:quotes` - Gérer tous les devis
- `read:all_audit_logs` - Lire tous les logs d'audit
- `manage:tarification` - Gérer la tarification
- `manage:system` - Gérer le système

## 📊 **Audit et Logs**

### Actions tracées automatiquement

- `LOGIN` - Connexion utilisateur
- `LOGOUT` - Déconnexion utilisateur
- `ACCOUNT_CREATED` - Création de compte
- `PROFILE_UPDATE` - Mise à jour de profil
- `PASSWORD_RESET_REQUESTED` - Demande de reset
- `PASSWORD_RESET_COMPLETED` - Reset complété

### Ajouter des logs personnalisés

```typescript
import { supabaseHelpers } from '@/lib/supabase';

// Logger une action personnalisée
await supabaseHelpers.logAction(
  'QUOTE_CREATED',
  'quote',
  quoteId,
  { amount: 1000, vehicle: 'Peugeot 208' }
);
```

## 🔧 **Fonctions Avancées**

### Gestion des sessions

```typescript
// Obtenir les sessions actives
const sessions = await authService.getUserSessions();

// Révoquer une session
await authService.revokeSession(sessionId);
```

### Mise à jour du profil

```typescript
const updatedUser = await updateUser({
  firstName: 'Jean',
  lastName: 'Dupont',
  phone: '+225 07 00 00 00 00'
});
```

### Réinitialisation de mot de passe

```typescript
// Demander un reset
await forgotPassword('user@example.com');

// Confirmer le reset
await resetPassword('token_123', 'newPassword123');
```

## 🚨 **Dépannage**

### Erreurs courantes

1. **"Les variables d'environnement Supabase sont manquantes"**
   - Vérifiez que `.env.local` est correctement configuré
   - Redémarrez le serveur de développement

2. **"Profil utilisateur non trouvé"**
   - Vérifiez que les migrations ont été exécutées
   - Vérifiez que le trigger `handle_new_user` est actif

3. **"Permission refusée"**
   - Vérifiez les policies RLS dans Supabase
   - Vérifiez que l'utilisateur a le bon rôle

### Debug

Activez le mode debug dans `.env.local` :

```env
VITE_DEBUG=true
```

Les logs d'authentification apparaîtront dans la console du navigateur.

## 🔄 **Migration depuis le système mock**

1. Sauvegardez les données utilisateurs existantes
2. Exécutez les migrations Supabase
3. Mettez à jour les variables d'environnement
4. Testez les flux d'authentification
5. Supprimez l'ancien système mock

## 📞 **Support**

Pour toute question sur l'authentification Supabase :

- Documentation Supabase : [https://supabase.com/docs](https://supabase.com/docs)
- Issues du projet : Créez une issue sur GitHub
- Support technique : contact@noliassurance.com

---

**Note** : Ce système d'authentification est conçu pour être sécurisé, scalable et facile à maintenir. N'hésitez pas à consulter la documentation Supabase pour des fonctionnalités avancées supplémentaires.
