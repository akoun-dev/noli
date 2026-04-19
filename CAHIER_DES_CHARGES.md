# 📋 Cahier des Charges - NOLI Assurance

## Présentation du Projet

NOLI Assurance est une plateforme de comparaison d'assurances automobiles pour le marché ivoirien, permettant aux utilisateurs de comparer les offres de plusieurs assureurs et de demander des devis en ligne.

### Contexte
- **Marché cible** : Côte d'Ivoire (Abidjan)
- **Audience cible** : Particuliers et assureurs
- **Problème** : Difficulté pour les particuliers de comparer les offres d'assurance
- **Solution** : Plateforme digitale de comparaison en temps réel

---

## Objectifs Principaux

### Business
- Lancer un MVP en 8 semaines maximum
- Budget limité aux fonctionnalités essentielles
- Expérience mobile-first
- Acquisition des premiers utilisateurs
- Validation du business model

### Techniques
- Performance: temps de chargement < 3s
- Sécurité: authentification robuste, validation des données
- Responsive design: mobile-first
- Accessibilité: composants ARIA-compliant
- Scale: support de 1000+ utilisateurs

---

## Fonctionnalités Essentielles

### 🔐 Module 1: Authentification

#### 1.1 Inscription Utilisateur
- Formulaire d'inscription simple
- Validation email et téléphone
- Vérification par code SMS
- Création de profil utilisateur

#### 1.2 Connexion Utilisateur
- Login par email/mot de passe
- Mot de passe oublié
- Session persistante
- Déconnexion sécurisée

#### 1.3 Gestion de Profil
- Modification des informations
- Changement de mot de passe
- Suppression de compte

#### 1.4 Rôles et Permissions
- **ADMIN** : Accès complet à la plateforme
- **INSURER** : Gestion des offres et devis
- **USER** : Comparaison et demande de devis

### 📝 Module 2: Comparateur d'Assurance (Cœur du métier)

#### 2.1 Formulaire de Comparaison (3 étapes)

**Étape 1: Informations Personnelles**
- Nom, prénom, email, téléphone
- Date de naissance
- Date d'obtention du permis
- Antécédents de sinistres
- Usage personnel/professionnel
- Kilométrage annuel

**Étape 2: Informations Véhicule**
- Type de véhicule
- Marque et modèle
- Année de mise en circulation
- Puissance fiscale
- Immatriculation
- Valeur neuve/vénale

**Étape 3: Besoins Assurance**
- Type de couverture (Tiers, Tiers+, Tous risques)
- Options souhaitées
- Budget mensuel
- Niveau de franchise

#### 2.2 Résultats de Comparaison
- Liste des offres disponibles
- Tri par prix/notation
- Filtres par assureur
- Détails interactifs des offres
- Boutons d'action: "Choisir", "Devis gratuit", "Être rappelé"

### 📄 Module 3: Gestion des Devis

#### 3.1 Création de Devis
- Sauvegarde des comparaisons
- Génération de PDF horodatés
- Envoi par email/WhatsApp avec opt-in RGPD
- Numéro de référence unique

#### 3.2 Suivi des Devis
- Liste des devis créés
- Statut en temps réel (en cours, en attente, validé)
- Historique des modifications
- Relance automatique

#### 3.3 Espace Utilisateur
- Tableau de bord personnel
- Historique des comparaisons
- Suivi des demandes en cours
- Notifications push/email/WhatsApp

### 🏢 Module 4: Interface Assureur

#### 4.1 Espace Partenaire
- Connexion assureur sécurisée
- Tableau de bord personnalisé
- Liste des devis reçus
- Réponse aux devis
- Statistiques de performance

#### 4.2 Gestion des Offres
- Création / modification des offres
- Configuration des tarifs et couvertures
- Chargement des données via fichier Excel/CSV
- Activation/désactivation des offres
- Historique des modifications

#### 4.3 Analytics Détaillés
- Suivi taux de conversion (devis → souscription)
- Analyse revenus et performance par produit
- Segmentation des profils utilisateurs
- Export des données pour suivi interne

### 📊 Module 5: Dashboard Admin

#### 5.1 Administration
- Gestion des utilisateurs (CRUD)
- Gestion des assureurs (CRUD)
- Gestion des offres (CRUD)
- Validation des comptes
- Gestion des droits et rôles
- Désactivation comptes problématiques

#### 5.2 Supervision Plateforme
- Vue complète des activités
- Indicateurs clés (comparaisons, clics, taux conversion)
- Monitoring des performances
- Gestion des incidents

#### 5.3 Statistiques Globales
- KPI suivis :
  - Taux complétion formulaire >70%
  - Taux clic → assureurs >25%
  - Conversion devis → souscription >10%
  - Latence résultats <3s

#### 5.4 Outils de Modération
- Contrôle qualité des offres
- Gestion des avis clients
- Audit logs
- Validation des fichiers assureurs

---

## Acteurs du Système

### 1. Clients/Assurés
- **Profil** : Particuliers cherchant à comparer des assurances
- **Besoins** : Simplicité, transparence, meilleurs prix
- **Parcours** : Comparaison → Devis → Souscription

### 2. Assureurs
- **Profil** : Compagnies d'assurance partenaires
- **Besoins** : Acquisition de clients, gestion des offres
- **Parcours** : Configuration → Réception → Conversion

### 3. Administrateurs
- **Profil** : Équipe de gestion de la plateforme
- **Besoins** : Supervision, modération, analytics
- **Parcours** : Monitoring → Validation → Optimisation