# NOLI — Architecture fonctionnelle

| | |
|---|---|
| **Produit** | NOLI — comparateur d'assurances multi-assureurs (Côte d'Ivoire) |
| **Version** | `2.0.0` |
| **Objet** | Architecture **fonctionnelle** : acteurs, domaines fonctionnels, flux métier, règles de gestion |
| **Date** | 11/09/2026 |

> Ce document décrit le **quoi** (fonctions métier et leurs interactions). Pour le **comment** technique (pile, base, déploiement), voir `RAPPORT_CLOTURE.md` (§ Architecture technique) et `DEPLOIEMENT.md`.

---

## 1. Objet & périmètre

NOLI met en relation trois acteurs autour de la comparaison et de la souscription d'assurance auto : le **client** compare et demande des devis ; la **compagnie** publie ses offres et traite les demandes ; l'**administrateur** pilote le référentiel et les accès.

## 2. Acteurs & rôles

| Acteur | Description | Accès |
|---|---|---|
| **USER (client)** | Particulier qui compare, demande des devis, suit ses contrats | Espace client + parcours public |
| **INSURER (assureur)** | Compagnie qui gère offres, garanties, tarifs, devis, clients | Espace assureur (limité à sa compagnie) |
| **ADMIN** | Back-office : référentiels, assureurs, utilisateurs, paramètres | Administration complète |
| **Visiteur** | Non authentifié | Parcours public (comparaison, devis, contact) |

## 3. Cartographie fonctionnelle

```
                         ┌───────────────────────────────────────────┐
                         │                  NOLI                      │
                         └───────────────────────────────────────────┘
   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
   │ D1. Comparaison│  │ D2. Offres &  │   │ D3. Devis,     │  │ D4. Comptes &  │
   │  & Devis       │  │  Garanties    │   │  Contrats,     │  │  Accès         │
   │ (moteur tarif, │  │ (catalogue,   │   │  Sinistres     │  │ (auth, RBAC,   │
   │  comparaison)  │  │  tarification)│   │                │  │  validation)   │
   └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
   │ D5. Back-office│  │ D6. Relation  │   │ D7. Pilotage & │
   │  & Référentiels│  │  client       │   │  Conformité    │
   │ (admin)        │  │ (contact,     │   │ (audit,        │
   │                │  │  notifications│   │  sauvegardes)  │
   └───────────────┘   └───────────────┘   └───────────────┘
```

### Domaines fonctionnels

| # | Domaine | Fonctions principales |
|---|---|---|
| D1 | **Comparaison & Devis** | Saisie du besoin (profil, véhicule, garanties), **calcul de prime**, **comparaison & scoring** des offres, création de devis, demande de rappel |
| D2 | **Offres & Garanties** | Catalogue d'offres, garanties et **règles de tarification**, catégories, packages |
| D3 | **Devis, Contrats, Sinistres** | Suivi des devis et de leur statut, contrats, sinistres (côté assureur) |
| D4 | **Comptes & Accès** | Inscription/connexion, **rôles (RBAC)**, **auto-inscription assureur** + **validation admin** |
| D5 | **Back-office & Référentiels** | Gestion assureurs, catégories, garanties, tarifs, offres, utilisateurs, paramètres système |
| D6 | **Relation client** | Formulaire de contact, demandes de rappel, **notifications** |
| D7 | **Pilotage & Conformité** | Statistiques, **journaux d'audit**, **sauvegardes** |

## 4. Matrice acteurs × fonctions

| Fonction | Visiteur | USER | INSURER | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Comparer des offres | ✔ | ✔ | | |
| Demander un devis / un rappel | ✔ | ✔ | | |
| Suivre ses devis / contrats | | ✔ | | |
| Gérer offres / garanties / tarifs | | | ✔ (sa compagnie) | ✔ (tous) |
| Traiter les devis reçus | | | ✔ (sa compagnie) | ✔ |
| Gérer assureurs / référentiels | | | | ✔ |
| **Valider un compte assureur** | | | | ✔ |
| Paramètres système, audit, sauvegardes | | | | ✔ |

## 5. Flux fonctionnels principaux

### 5.1 Parcours comparaison → devis
```
Visiteur/USER → Saisie (profil + véhicule + besoins)
   → Moteur tarifaire (calcul de prime par garantie)
   → Comparaison & scoring (offres éligibles classées)
   → Résultats (filtres, comparaison, info-bulles)
   → « Obtenir un devis » → Devis créé (référence)
   → [option] Création de compte → rattachement des devis
```

### 5.2 Cycle du devis (côté assureur)
```
Devis créé (USER) → visible par l'assureur concerné
   → Traitement (changement de statut)
   → [suivi] Contrat / Sinistre
```

### 5.3 Inscription & validation assureur
```
Assureur → Auto-inscription (compagnie)
   → Compte créé EN ATTENTE (inactif, pas de rattachement à une compagnie existante)
   → ADMIN : écran « Validation Assureurs »
        → Valider (active profil + compagnie) → accès à l'espace assureur
        → Rejeter (suppression du compte en attente)
```

## 6. Modèle de données fonctionnel (entités métier)

| Entité | Rôle fonctionnel | Principales relations |
|---|---|---|
| **Profil (utilisateur)** | Compte et rôle (USER/INSURER/ADMIN) | lié à une compagnie via *compte assureur* |
| **Assureur (compagnie)** | Compagnie d'assurance | possède des offres, garanties, devis |
| **Compte assureur** | Lien utilisateur ↔ compagnie | rattache un profil INSURER à un assureur |
| **Catégorie d'assurance / de garantie** | Référentiel de classement | structure offres et garanties |
| **Garantie** | Couverture avec **règle de tarification** | appartient à une catégorie |
| **Règle tarifaire** | Paramètres de calcul de prime | rattachée à une garantie |
| **Offre / Package** | Produit commercial (formule) | regroupe des garanties |
| **Devis** | Demande chiffrée d'un client | lié à un profil, un assureur, des garanties |
| **Contrat / Sinistre** | Suivi post-devis | lié à un devis / une compagnie |
| **Notification / Avis / Contact** | Relation client | liés au profil |
| **Journal d'audit / Sauvegarde / Paramètres** | Pilotage & conformité | transverses |

## 7. Règles de gestion clés

| # | Règle |
|---|---|
| RG1 | **Tarification** : la prime d'une garantie se calcule selon 4 méthodes — Gratuit, Montant fixe, Basé sur une variable, Matrice tarifaire. Le prix présenté est la **prime brute**. |
| RG2 | **Date d'effet** : au plus tôt **le lendemain (J+1)** de la demande. |
| RG3 | **Cloisonnement assureur** : un assureur n'accède qu'aux données de **sa** compagnie (identité issue de la session). |
| RG4 | **Auto-inscription assureur** : compte créé **inactif**, activé uniquement par un **administrateur** ; pas de rattachement automatique à une compagnie existante. |
| RG5 | **Politique de mot de passe** : configurable (défaut : 8 caractères, majuscule, minuscule, chiffre). |
| RG6 | **Rattachement des devis anonymes** : les devis créés avant l'ouverture d'un compte sont rattachés au compte créé avec le même email. |

## 8. Interfaces & intégrations

| Interface | Usage |
|---|---|
| **Authentification** (Supabase Auth) | Comptes, sessions, réinitialisation de mot de passe |
| **Base de données** (Supabase/PostgreSQL) | Persistance de toutes les entités métier |
| **Envoi de notifications** (fonction dédiée) | Notifications transactionnelles |

---

### Documents liés
`RAPPORT_CLOTURE.md` · `DEPLOIEMENT.md` · `PLAN_DEPLOIEMENT.md` · `CAHIER_RECETTE_METIER.md` · `CAHIER_RECETTE_TECHNIQUE.md`
