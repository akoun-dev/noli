# NOLI — Cahier de recette métier

| | |
|---|---|
| **Produit** | NOLI — comparateur d'assurances (Côte d'Ivoire) |
| **Version** | `2.0.0` |
| **Type** | Recette fonctionnelle / métier |
| **Environnement de test** | ☐ Recette ☐ Production — URL : ______________________ |
| **Testeur(s)** | ______________________ |
| **Date** | ____ / ____ / 2026 |

**Légende statut :** ✅ OK · ❌ KO · ⏭️ Non testé · ⚠️ OK avec réserve
**Priorité :** 🔴 Bloquant · 🟠 Majeur · 🟢 Mineur

> Mode d'emploi : dérouler chaque cas dans l'ordre, renseigner **Résultat obtenu** et **Statut**. Un cas 🔴 en échec bloque la mise en production.

---

## 1. Espace public / visiteur

*Préconditions : ne pas être connecté ; page d'accueil ouverte.*

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| MET-PUB-01 | Ouvrir la page d'accueil | La page se charge, navigation visible (Accueil, À propos, FAQ, Contact) | 🟠 | | |
| MET-PUB-02 | Ouvrir la FAQ puis les pages légales | Contenus affichés, pas d'erreur | 🟢 | | |
| MET-PUB-03 | Envoyer un message via le formulaire de contact | Message accepté, confirmation affichée | 🟠 | | |
| MET-PUB-04 | Consulter la liste des offres publiques | Offres affichées avec assureur, formule, prix | 🟠 | | |
| MET-PUB-05 | Ouvrir un lien direct de sous-page (ex. /faq) dans un onglet neuf | La bonne page s'affiche (pas de renvoi à l'accueil) | 🟠 | | |

## 2. Parcours comparaison & devis (cœur métier)

*Préconditions : partir de l'accueil, cliquer sur « Comparer ».*

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| MET-CMP-01 | Renseigner l'étape « informations personnelles » | Validation des champs, passage à l'étape suivante | 🟠 | | |
| MET-CMP-02 | Renseigner le véhicule (montants en FCFA avec espaces, ex. « 15 000 000 ») | Montants acceptés et correctement interprétés | 🔴 | | |
| MET-CMP-03 | Choisir la **date d'effet** = aujourd'hui | Refusé : la date doit être au plus tôt **le lendemain (J+1)** | 🔴 | | |
| MET-CMP-04 | Choisir la date d'effet = demain | Accepté | 🔴 | | |
| MET-CMP-05 | Sélectionner un type de contrat (ex. Tous Risques) et lancer la comparaison | Liste de résultats affichée, nombre d'offres annoncé | 🔴 | | |
| MET-CMP-06 | Vérifier la **pré-sélection de la formule** choisie à l'étape résultats | Le filtre « Formules » démarre sur la formule choisie | 🟠 | | |
| MET-CMP-07 | Ouvrir une info-bulle de garantie | Description + coût affichés, **sans détail technique de règle** | 🟠 | | |
| MET-CMP-08 | Ouvrir « Comparer » (≥ 2 offres) | Tableau comparatif + **légende des couleurs** (vert = moins chère / gratuit) | 🟠 | | |
| MET-CMP-09 | Vérifier la garantie « Individuel Accident » sur une offre concernée | Un **montant** s'affiche (et non « Inclus » par erreur) | 🔴 | | |
| MET-CMP-10 | Trier par prix / filtrer par assureur / par budget | Les filtres et tris s'appliquent correctement | 🟠 | | |
| MET-CMP-11 | Cliquer « Obtenir un devis » sur une offre | Devis créé, **référence** affichée, confirmation persistante | 🔴 | | |
| MET-CMP-12 | Cliquer « Être rappelé » et soumettre | Demande de rappel enregistrée, confirmation | 🟠 | | |
| MET-CMP-13 | Basculer prix mensuel / annuel | Les montants basculent de façon cohérente | 🟢 | | |

## 3. Espace USER (client)

*Préconditions : compte client créé et connecté.*

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| MET-USR-01 | Créer un compte avec un mot de passe **conforme** (8+, maj, min, chiffre) | Compte créé, règles affichées pendant la saisie | 🔴 | | |
| MET-USR-02 | Tenter un mot de passe non conforme (ex. « secret ») | Refus + message clair sur les exigences | 🟠 | | |
| MET-USR-03 | Se connecter puis se déconnecter | Connexion et déconnexion OK | 🔴 | | |
| MET-USR-04 | Consulter « Mes devis » | Devis de l'utilisateur listés (dont ceux créés avant le compte, même email) | 🟠 | | |
| MET-USR-05 | Ouvrir le détail d'un devis | Détail cohérent avec la demande | 🟠 | | |
| MET-USR-06 | Parcourir contrats / documents / historique / notifications | Écrans accessibles sans erreur | 🟢 | | |
| MET-USR-07 | Modifier le profil (nom, téléphone) | Modifications enregistrées et persistantes | 🟠 | | |
| MET-USR-08 | Recharger la page en étant connecté | La session est conservée | 🟠 | | |

## 4. Espace INSURER (assureur)

*Préconditions : compte assureur **validé** et connecté.*

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| MET-INS-01 | Ouvrir le tableau de bord assureur | KPI et analytics de **sa** compagnie uniquement | 🔴 | | |
| MET-INS-02 | Créer / modifier une **offre** | Offre enregistrée, catégorie bien conservée | 🟠 | | |
| MET-INS-03 | Créer / modifier une **garantie** avec règle de tarification | Garantie et règle enregistrées | 🟠 | | |
| MET-INS-04 | Consulter les **devis** reçus | Seuls les devis de sa compagnie sont visibles | 🔴 | | |
| MET-INS-05 | Changer le statut d'un devis | Statut mis à jour, historique cohérent | 🟠 | | |
| MET-INS-06 | Modifier les paramètres compagnie (logo, téléphone) | Enregistrés et persistants (téléphone compagnie, pas profil) | 🟠 | | |
| MET-INS-07 | Vérifier l'onglet « Mes Offres » se charge | Liste affichée (pas de squelette bloqué) | 🟠 | | |

## 5. Espace ADMIN (back-office)

*Préconditions : compte admin connecté.*

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| MET-ADM-01 | Ouvrir le tableau de bord admin | Statistiques globales affichées | 🟠 | | |
| MET-ADM-02 | Gérer les assureurs (créer, activer/désactiver) | Opérations effectives | 🟠 | | |
| MET-ADM-03 | Gérer catégories, garanties, règles tarifaires, offres, packages | CRUD fonctionnel | 🟠 | | |
| MET-ADM-04 | Consulter et filtrer les **journaux d'audit** (par entité, action) | Filtres opérants, résultats cohérents | 🟢 | | |
| MET-ADM-05 | Modifier la **politique de mot de passe** (paramètres système) | Nouvelle politique prise en compte à l'inscription | 🟠 | | |
| MET-ADM-06 | Gérer utilisateurs / rôles | Activation/désactivation et rôles effectifs | 🟠 | | |
| MET-ADM-07 | Gérer / planifier une **sauvegarde** | Planification enregistrée et rechargée correctement | 🟢 | | |

## 6. Auto-inscription & validation assureur (bout en bout)

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| MET-VAL-01 | S'inscrire comme **assureur** (nouvelle compagnie) | Compte créé **en attente** ; message « un administrateur doit activer votre espace » | 🔴 | | |
| MET-VAL-02 | Tenter d'accéder à l'espace assureur avant validation | Accès refusé (compte inactif) | 🔴 | | |
| MET-VAL-03 | S'inscrire assureur avec le **nom d'une compagnie existante** | Aucun rattachement automatique à la compagnie existante | 🔴 | | |
| MET-VAL-04 | Côté admin, ouvrir « Validation Assureurs » | Le compte en attente apparaît avec ses coordonnées | 🔴 | | |
| MET-VAL-05 | Cliquer **Valider** | Profil + compagnie activés ; l'assureur accède ensuite à son espace | 🔴 | | |
| MET-VAL-06 | Sur un autre compte en attente, cliquer **Rejeter** puis confirmer | Compte supprimé après confirmation | 🟠 | | |

---

## Synthèse

| Priorité | Nombre de cas | ✅ OK | ❌ KO | ⏭️ Non testé |
|---|---|---|---|---|
| 🔴 Bloquant | | | | |
| 🟠 Majeur | | | | |
| 🟢 Mineur | | | | |
| **Total** | | | | |

**Critère de sortie :** 100 % des cas 🔴 en ✅, aucun ❌ 🔴 ouvert.

**Anomalies relevées :**

| # | Cas (ID) | Description | Gravité | Suite donnée |
|---|---|---|---|---|
| | | | | |
