# Comptes de Test - NOLI Assurance

## Comptes Utilisateurs

### Utilisateur Standard
- **Email**: `user@example.com`
- **Mot de passe**: `password123` ou `user`
- **Rôle**: USER
- **Nom**: Jean Dupont
- **Téléphone**: +2250712345678

### Utilisateur Premium
- **Email**: `marie.kouame@example.com`
- **Mot de passe**: `password123` ou `marie`
- **Rôle**: USER
- **Nom**: Marie Kouamé
- **Téléphone**: +2250776543210

### Utilisateur Test
- **Email**: `test@user.com`
- **Mot de passe**: `password123` ou `test`
- **Rôle**: USER
- **Nom**: Test User
- **Téléphone**: +2250711122333

## Comptes Assureurs

### NSIA Assurances
- **Email**: `nsia@assurances.ci`
- **Mot de passe**: `password123` ou `nsia`
- **Rôle**: INSURER
- **Nom**: Thomas Konan
- **Téléphone**: +2250722334455

### SUNU Assurances
- **Email**: `sunu@contact.ci`
- **Mot de passe**: `password123` ou `sunu`
- **Rôle**: INSURER
- **Nom**: Fatou Diop
- **Téléphone**: +2250733445566

### Demo Assurance
- **Email**: `demo@insurer.ci`
- **Mot de passe**: `password123` ou `demo`
- **Rôle**: INSURER
- **Nom**: Demo Assurance
- **Téléphone**: +2250744455667

## Compte Administrateur

### Administrateur Système
- **Email**: `admin@noli.ci`
- **Mot de passe**: `password123` ou `admin`
- **Rôle**: ADMIN
- **Nom**: System Administrator
- **Téléphone**: +2250700000000

## Mot de passe Universel

Pour tous les comptes, vous pouvez utiliser :
- `password123`
- Le nom d'utilisateur (partie avant le @ de l'email)
- `Noli2024`

## Accès par Rôle

### USER
- Accès au tableau de bord utilisateur
- Peut comparer des offres
- Peut demander des devis
- Peut gérer ses favoris

### INSURER
- Accès au tableau de bord assureur
- Peut gérer les offres
- Peut consulter les devis
- Peut voir les analytics

### ADMIN
- Accès complet à l'administration
- Peut gérer les utilisateurs
- Peut superviser le système
- Peut gérer les données

## Instructions

1. Ouvrez l'application : http://localhost:8081
2. Cliquez sur "Se connecter" ou naviguez vers `/auth/connexion`
3. Utilisez un des comptes ci-dessus
4. Testez différentes fonctionnalités selon le rôle

## Dépannage

Si la connexion ne fonctionne pas :
1. Vérifiez que le serveur de développement est en cours d'exécution
2. Essayez de vider le localStorage du navigateur
3. Utilisez la console du navigateur pour voir les erreurs
4. Redémarrez le serveur de développement

## Pages Accessibles

### Publiques
- `/` - Page d'accueil
- `/offres` - Liste des offres
- `/comparer` - Comparateur
- `/auth/connexion` - Connexion
- `/auth/inscription` - Inscription

### Utilisateurs connectés
- `/tableau-de-bord` - Dashboard utilisateur
- `/mes-devis` - Mes devis
- `/profil` - Profil utilisateur

### Assureurs
- `/assureur/tableau-de-bord` - Dashboard assureur
- `/assureur/offres` - Gestion des offres
- `/assureur/devis` - Devis reçus

### Administration
- `/admin/tableau-de-bord` - Dashboard admin
- `/admin/utilisateurs` - Gestion utilisateurs
- `/admin/supervision` - Supervision système