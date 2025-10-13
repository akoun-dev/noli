# Noli - Plateforme de Comparaison d'Assurances

Noli est une plateforme web moderne de comparaison d'assurances qui permet aux utilisateurs de comparer, gérer et souscrire à des contrats d'assurance en toute simplicité.

## 🚀 Fonctionnalités

### Pour les Utilisateurs
- **Comparaison d'assurances**: Processus en 3 étapes (Informations personnelles → Véhicule → Besoins)
- **Gestion des devis**: Suivi et gestion de tous les devis demandés
- **Gestion des contrats**: Visualisation et gestion des contrats souscrits
- **Paiements en ligne**: Paiement sécurisé des primes d'assurance
- **Tableau de bord**: Vue d'ensemble de toutes ses assurances

### Pour les Assureurs
- **Gestion des offres**: Création et modification des offres d'assurance
- **Suivi des devis**: Consultation des devis reçus et réponse aux demandes
- **Analytics**: Tableau de bord détaillé sur les performances commerciales
- **Communication clients**: Outils de communication intégrés avec les clients
- **Alertes**: Système de notifications pour nouvelles demandes

### Pour les Administrateurs
- **Supervision**: Vue d'ensemble de toute la plateforme
- **Gestion des utilisateurs**: Administration des comptes utilisateurs et assureurs
- **Tarification**: Configuration des règles tarifaires et garanties
- **Audit**: Suivi complet des actions et modifications
- **Analytics**: Statistiques détaillées sur l'utilisation de la plateforme

## 🛠️ Stack Technique

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: React Context (Auth, User, Theme)
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Theme**: next-themes (dark mode)

## 📋 Prérequis

- Node.js 18+ et npm installés
- Git pour le contrôle de version

## 🚀 Installation et Démarrage

```bash
# Cloner le repository
git clone <URL_DU_REPOSITORY>
cd noli

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:5173 dans votre navigateur
```

## 📜 Scripts Disponibles

```bash
# Développement
npm run dev          # Serveur de développement avec hot-reload

# Build
npm run build        # Build pour production
npm run build:dev    # Build pour développement

# Qualité
npm run lint         # Linter le code

# Preview
npm run preview      # Preview du build de production
```

## 🏗️ Architecture du Projet

### Structure des Dossiers

```
src/
├── components/          # Composants UI réutilisables
│   ├── ui/             # Composants shadcn/ui
│   ├── common/         # Composants partagés
│   ├── home/           # Page d'accueil
│   └── insurer/        # Composants assureurs
├── features/           # Modules par fonctionnalité
│   ├── admin/          # Administration
│   ├── auth/           # Authentification
│   ├── comparison/     # Comparaison d'assurances
│   ├── offers/         # Gestion des offres
│   ├── payments/       # Paiements
│   └── user/           # Gestion utilisateur
├── contexts/           # Contextes React
├── guards/             # Protection des routes
├── layouts/            # Mises en page
├── pages/              # Pages des routes
├── services/           # Services API
└── types/              # Définitions TypeScript
```

### Gestion des Rôles

La plateforme utilise un système de contrôle d'accès basé sur les rôles :

- **USER**: Accès aux fonctionnalités de comparaison et gestion personnelle
- **INSURER**: Accès à la gestion des offres et suivi client
- **ADMIN**: Accès complet à l'administration de la plateforme

## 🔐 Authentification

- Système d'authentification JWT
- Stockage sécurisé des tokens
- Protection automatique des routes
- Redirections basés sur les rôles

## 🎨 Thème et Design

- Support du mode sombre/clair
- Design responsive pour mobile et desktop
- Composants accessibles (ARIA)
- Interface moderne et intuitive

## 📱 Routes Principales

### Publiques
- `/`: Page d'accueil
- `/a-propos`: Présentation de Noli
- `/contact`: Contact et support
- `/auth/connexion`: Connexion
- `/auth/inscription`: Inscription

### Comparaison
- `/comparer`: Formulaire de comparaison d'assurance
- `/offres`: Liste des offres disponibles

### Utilisateur (protégées)
- `/tableau-de-bord`: Tableau de bord utilisateur
- `/mes-devis`: Gestion des devis
- `/mes-contrats`: Gestion des contrats
- `/paiements`: Historique et paiements

### Assureur (protégées)
- `/assureur/tableau-de-bord`: Dashboard assureur
- `/assureur/offres`: Gestion des offres
- `/assureur/analytics`: Analytics commerciales

### Admin (protégées)
- `/admin/tableau-de-bord`: Supervision générale
- `/admin/utilisateurs`: Gestion des utilisateurs
- `/admin/tarification`: Configuration des tarifs

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence privée. Veuillez contacter l'administrateur pour plus d'informations.

## 📞 Support

Pour toute question ou support technique, veuillez contacter l'équipe Noli via le formulaire de contact sur la plateforme.

---

**Développé avec ❤️ par l'équipe Noli**
