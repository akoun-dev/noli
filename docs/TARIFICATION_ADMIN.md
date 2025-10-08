# Système de Tarification - Guide Administrateur

## Vue d'ensemble

Le système de tarification de NOLI Assurance permet aux administrateurs de gérer complètement les garanties, packages et grilles de tarification pour les offres d'assurance automobile.

## Accès à la tarification

1. Connectez-vous en tant qu'administrateur
2. Dans le menu de navigation, cliquez sur "Tarification"
3. Accédez à la page `/admin/tarification`

## Fonctionnalités principales

### 1. Gestion des Garanties

#### Créer une garantie

1. Allez dans l'onglet "Garanties"
2. Cliquez sur "Nouvelle garantie"
3. Remplissez les informations requises :
   - **Nom** : Nom complet de la garantie (ex: "Responsabilité Civile")
   - **Code** : Code court unique (ex: "RC")
   - **Catégorie** : Type de garantie
   - **Description** : Détails de la couverture
   - **Méthode de calcul** : Comment le prix est calculé
   - **Tarification** : Valeurs fixes ou taux selon la méthode
   - **Conditions** : Restrictions ou conditions particulières

#### Méthodes de calcul disponibles

| Méthode | Description | Utilisation typique |
|---------|-------------|---------------------|
| **Montant Fixe** | Prime fixe indépendante du véhicule | Défense et Recours, Assistance |
| **Taux sur Valeur Assurée** | Pourcentage de la valeur vénale | Incendie, Vol |
| **Taux sur Valeur Neuve** | Pourcentage de la valeur neuve | Bris de glaces |
| **Grille RC** | Basé sur grille officielle Responsabilité Civile | Responsabilité Civile obligatoire |
| **Matrice Tierce** | Basé sur grille TCM/TCL | Tierce Complète, Tierce Collision |
| **Formule IC/IPT** | Basé sur grille IC/IPT | Individuelle Conducteur/Passagers |
| **Taux Conditionnel** | Taux variable selon conditions | Vol avec conditions de valeur |

### 2. Gestion des Packages

#### Créer un package

1. Allez dans l'onglet "Packages"
2. Cliquez sur "Nouveau package"
3. Définissez :
   - **Nom** : Nom commercial du package
   - **Description** : Avantages et couvertures
   - **Prix de base** : Tarif de départ
   - **Garanties incluses** : Sélectionnez les garanties
   - **Restrictions** : Types de véhicules si applicable

#### Packages pré-configurés

- **Plan Essentiel** : Couverture de base économique
- **Plan Évolution** : Équilibre entre prix et couverture
- **Plan Premium** : Protection maximale
- **Plan Pick-up Pro** : Spécialisé véhicules utilitaires

### 3. Grilles de Tarification

Les grilles sont accessibles en lecture seule dans l'onglet "Grilles" :

#### Grille Responsabilité Civile
- Basée sur catégorie véhicule (401, 402, etc.)
- Dépend du type d'énergie (Essence, Diesel)
- Varie selon la puissance fiscale

#### Grille IC/IPT
- Différentes formules disponibles (1, 2, 3)
- Variations selon nombre de places

#### Grille TCM/TCL
- Couvre Tierce Complète et Tierce Collision
- Variations selon :
  - Valeur neuve du véhicule
  - Montant de franchise
  - Catégorie du véhicule

### 4. Intégration avec les Offres

#### Création d'offre avec garanties

1. Allez dans "Gestion des Offres"
2. Cliquez "Nouvelle offre"
3. Choisissez le type d'offre :
   - **Sur mesure** : Sélectionnez manuellement les garanties
   - **Package prédéfini** : Utilisez un package existant

#### Avantages de l'intégration

- **Prix automatique** : Calculé selon les garanties sélectionnées
- **Cohérence** : Les couvertures correspondent aux garanties réelles
- **Flexibilité** : Possibilité de modifier les tarifs au besoin

## Bonnes pratiques

### 1. Structure des garanties

- **Codes uniques** : Utilisez des codes courts et significatifs
- **Descriptions claires** : Expliquez ce qui est couvert
- **Catégories logiques** : Regroupez les garanties similaires

### 2. Tarification

- **Valeurs réalistes** : Basez-vous sur les coûts du marché
- **Limites min/max** : Définissez des bornes pour éviter les abus
- **Tests réguliers** : Vérifiez les calculs avec des exemples

### 3. Packages

- **Équilibre** : Combinez garanties obligatoires et optionnelles
- **Prix compétitifs** : Positionnez-vous par rapport à la concurrence
- **Segments clairs** : Ciblez différents types de clients

## Exemples d'utilisation

### Cas 1 : Créer une offre "Tous Risques"

1. **Type d'offre** : Package prédéfini
2. **Package** : Plan Premium
3. **Garanties incluses automatiquement** :
   - Responsabilité Civile
   - Défense et Recours
   - Individuelle Conducteur
   - Individuelle Passagers
   - Incendie
   - Vol
   - Vol à mains armées
   - Bris de glaces
   - Tierce Complète
   - Avance sur recours
4. **Prix calculé** : 320 000 FCFA

### Cas 2 : Offre économique personnalisée

1. **Type d'offre** : Sur mesure
2. **Garanties sélectionnées** :
   - Responsabilité Civile (obligatoire)
   - Défense et Recours
   - Vol (taux conditionnel)
3. **Prix de base** : 80 000 FCFA
4. **Prix calculé** : ~95 000 FCFA

## Dépannage

### Problèmes courants

#### Prix incorrect
- Vérifiez les méthodes de calcul des garanties
- Confirmez les taux et montants fixes
- Testez avec différents véhicules

#### Garantie non visible
- Vérifiez que la garantie est "Active"
- Confirmez qu'elle appartient à la bonne catégorie
- Actualisez la page

#### Package ne s'applique pas
- Vérifiez que le package est "Active"
- Confirmez que les garanties incluses existent
- Vérifiez les restrictions de type de véhicule

### Support technique

Pour toute question ou problème technique :
1. Consultez les logs dans la console du navigateur
2. Vérifiez les données dans localStorage
3. Contactez l'équipe de développement

## Évolutions futures

### Fonctionnalités en développement

- **Calcul avancé** : Intégration complète des grilles de tarification
- **Simulation** : Outil de simulation pour les clients
- **Historique** : Suivi des modifications de tarifs
- **Export** : Export des grilles au format Excel
- **API** : Synchronisation avec les systèmes assureurs

### Améliorations prévues

- **Tarification dynamique** : Selon le profil du conducteur
- **Promotions** : Gestion des offres temporaires
- **Analytics** : Analyse des performances des garanties
- **Multi-pays** : Adaptation à d'autres marchés

---

## Résumé

Le système de tarification de NOLI Assurance offre une solution complète et flexible pour gérer les garanties et tarifs automobiles. Il permet une administration précise tout en s'intégrant parfaitement avec le processus de création d'offres.

L'approche combinant garanties individuelles et packages prédéfinis offre le meilleur équilibre entre flexibilité et facilité d'utilisation pour les administrateurs comme pour les clients.