# NOLI — Rapport de clôture de projet

| | |
|---|---|
| **Produit** | NOLI — comparateur d'assurances multi-assureurs (Côte d'Ivoire) |
| **Version** | `2.0.0` (branche de production) |
| **Date** | 11/09/2026 |
| **Statut** | ✅ Clôture technique — en attente de décision de go-live |
| **Objet** | Rapport de clôture : fonctionnalités, architecture, qualité, mise en production |
| **Référence** | `docs/` : `DEPLOIEMENT.md` · `AUDIT_SECURITE_2.0.0.md` · `RECETTE_FONCTIONNELLE_2.0.0.md` · `SAUVEGARDE_DR.md` · `PLAN_INDUSTRIALISATION.md` |

---

## 1. Résumé exécutif

La plateforme **NOLI** est **fonctionnellement complète** sur ses trois espaces (client, assureur, administration) et **techniquement saine** : typage et lint sans erreur, **141/141 tests automatisés au vert**, build de production validé.

**Aucun défaut ouvert.** Les actions restantes sont purement opérationnelles (déploiement, recette sur l'environnement cible) et de courte durée : un **go-live en quelques jours ouvrés est réaliste**, sous réserve de la fixation d'une date butoir en réunion de clôture.

### Indicateurs clés

| Indicateur | Valeur | État |
|---|---|---|
| Tests automatisés | 141 / 141 | ✅ |
| Erreurs TypeScript | 0 | ✅ |
| Erreurs Lint | 0 | ✅ |
| Build production (standalone) | OK | ✅ |
| Défauts ouverts | 0 | ✅ |
| Tables de données | 23 | ✅ |
| Migrations SQL (définies au dépôt) | 28 | ✅ |
| Recette fonctionnelle | En attente (checklist §7) | ⏳ |
| Date de go-live | À fixer | ⏳ |

---

## 2. Présentation & périmètre

NOLI est une plateforme **trois acteurs** permettant de comparer des offres d'assurance auto de plusieurs compagnies, de demander des devis et de gérer la relation jusqu'au contrat :

| Acteur | Rôle |
|---|---|
| **USER (client)** | Compare les offres, demande des devis, suit ses contrats |
| **INSURER (compagnie)** | Gère ses offres, garanties, tarifs, devis et clients |
| **ADMIN (back-office)** | Administre l'ensemble : assureurs, garanties, tarifs, utilisateurs, paramètres |

L'application est **entièrement en français** (interface et contenus).

---

## 3. Fonctionnalités livrées

### 3.1 Espace public / visiteur
- Page d'accueil, présentation, FAQ, pages légales, formulaire de contact.
- **Parcours de comparaison sans compte** : profil + véhicule + besoins → **résultats comparés** (offres classées, prix, garanties).
- **Demande de devis** et **demande de rappel** depuis les résultats.
- Consultation des offres publiques et avis.

### 3.2 Espace USER (client)
- Tableau de bord personnel.
- **Mes devis** : suivi, détail, **rattachement automatique** des devis créés avant l'ouverture du compte.
- **Mes contrats**, **documents**, **paiements**, **historique**.
- **Avis**, **notifications**, **profil** et **paramètres** (dont sécurité du compte).

### 3.3 Espace INSURER (compagnie)
- Tableau de bord et **analytics** de la compagnie.
- **Offres** et **garanties** : création/édition avec **règles de tarification**.
- **Devis** reçus (suivi et changement de statut), **clients**, **contrats**, **sinistres**, **demandes de rappel**.
- **Paramètres** de la compagnie (logo, coordonnées).
- **Cloisonnement strict** : chaque assureur n'accède qu'à son propre périmètre.

### 3.4 Espace ADMIN (back-office)
- Tableau de bord global et **statistiques**.
- Gestion des **assureurs**, **catégories d'assurance**, **catégories de garanties**, **garanties** et **règles tarifaires**, **offres**, **packages**.
- Gestion des **devis**, **utilisateurs / rôles**, **demandes de rappel**.
- **Validation des comptes assureurs auto-inscrits** : écran dédié listant les comptes en attente, avec **activation** (profil + compagnie) ou **rejet** en un geste.
- **Paramètres système** (dont la **politique de mot de passe**), **journaux d'audit**, **sauvegardes**.

### 3.5 Moteur tarifaire & comparaison (cœur métier)
- **Calcul de prime par garantie selon 4 méthodes** : **Gratuit**, **Montant fixe**, **Basé sur une variable** (valeur neuve / vénale / puissance fiscale), **Matrice tarifaire** (grille multi-dimensionnelle : puissance fiscale, carburant, catégorie, formule, places).
- **Comparaison** : appariement des offres aux besoins, **scoring** et classement ; prix affiché = **prime brute**.

### 3.6 Fonctionnalités transverses
- **Authentification** : inscription, connexion, mot de passe oublié / réinitialisation.
- **Auto-inscription assureur** : compte créé **en attente de validation par un administrateur** (aucun accès avant activation) ; l'admin valide ou rejette depuis un **écran dédié**.
- **Notifications** (in-app + envoi via une fonction dédiée).
- **Journalisation d'audit** des actions sensibles.

---

## 4. Architecture technique

### 4.1 Pile technologique

| Couche | Technologie |
|---|---|
| Frontend / Backend | Next.js 16 (App Router), TypeScript strict, build **standalone** |
| UI | Tailwind CSS v4 + shadcn/ui, Zustand, React Query, react-hook-form + Zod |
| Base de données & Auth | **Supabase** (PostgreSQL + Auth) — **sans ORM** (SQL/PostgREST direct) |
| Tests | Vitest |
| Production | **PM2** (mono-instance, port 8080) derrière **Caddy** (reverse proxy HTTPS) |

### 4.2 Accès aux données — deux clients Supabase
- **Client `service_role` (serveur uniquement)** : porte tout l'accès métier. L'**autorisation repose sur les contrôles applicatifs** (rôle, propriété, identité de session).
- **Client anonyme lié au cookie de session** : utilisé pour l'**authentification**.

### 4.3 Authentification & rôles (RBAC)
- Session = **JWT Supabase** en cookies **httpOnly**, validée **côté serveur**.
- Rôles **USER / INSURER / ADMIN** ; helpers `requireAuth`, `requireRole`, `requireAdmin`, `getInsurerAccount`.
- **Principe anti-usurpation (IDOR)** : l'identité provient toujours de la session, jamais d'un paramètre client. Un assureur est filtré sur **son** identifiant de compagnie.
- Conventions d'API : `/api/admin/*`, `/api/insurer/*`, `/api/user/*`, `/api/auth/*`, et routes publiques (`/api/quotes`, `/api/compare`, `/api/offers`, `/api/contact*`).

### 4.4 Modèle de données
**23 tables**, dont : `profiles`, `insurers`, `insurer_accounts`, `insurance_categories`, `coverage_categories`, `coverages`, `coverage_tariff_rules`, `insurance_offers`, `insurance_packages`, `package_coverages`, `quotes`, `quote_coverages`, `contracts`, `claims`, `reviews`, `notifications`, `system_settings`, `audit_logs`, `backups`, plus le socle de rôles/permissions. **28 migrations** SQL (schéma + politiques).

### 4.5 Sécurité applicative
- Validation systématique des entrées (**Zod**) ; protection contre l'injection de filtre, échappement HTML, parsing sûr des montants.
- **Protection CSRF** (contrôle d'origine sur les mutations d'API).
- **Rate-limiting** en mémoire (dépend du fonctionnement **mono-instance**).
- Secrets hors dépôt ; clé d'administration base **jamais exposée** au client.
- **Assureurs auto-inscrits inactifs** jusqu'à validation par un administrateur ; pas de rattachement automatique à une compagnie existante.

### 4.6 Qualité

| Contrôle | Résultat |
|---|---|
| Typage TypeScript | ✅ 0 erreur |
| Lint | ✅ 0 erreur |
| Tests automatisés (Vitest) | ✅ **141 / 141** |
| Build de production | ✅ OK |

---

## 5. Mise en production

Le produit est **fonctionnellement complet** et le **code est sain**. Il ne reste **aucun défaut ouvert** ; ce qui suit relève de la mise en production normale.

### 5.1 Runbook de déploiement (`docs/DEPLOIEMENT.md`)
1. **Sauvegarde** de la base avant intervention.
2. Application des **migrations** en attente.
3. Déploiement : `git pull` → `bun install` → `bun run build` → `pm2 reload noli` → `pm2 save`.
4. **Vérification** post-déploiement : santé du service + parcours critiques (checklist §7).

### 5.2 Recommandations d'exploitation
| # | Recommandation | Priorité | Échéance |
|---|---|---|---|
| R1 | **Passer la base de données en plan payant** — le plan gratuit se met en pause après inactivité (source de coupures de connexion) | 🔴 Haute | Avant go-live |
| R2 | **Sauvegardes régulières hors dépôt** + restauration testée | 🔴 Haute | Avant go-live |
| R3 | **Supervision** : logs + alerte de disponibilité | 🟠 Moyenne | Sous 2 semaines |
| R4 | Conserver l'**intégration continue** (typage + lint + tests + build) à chaque évolution | 🟢 Continue | Permanente |
| R5 | Haute disponibilité (multi-instance) : basculer le rate-limiting sur un store partagé | 🟡 Évolutive | Selon montée en charge |

### 5.3 Risques identifiés
| Risque | Impact | Mitigation |
|---|---|---|
| Plan gratuit Supabase en pause | 🔴 Coupure de service | R1 — plan payant |
| Perte de données | 🔴 Irréversible | R2 — sauvegardes + restauration testée |
| Deficit de supervision | 🟠 Découverte tardive des incidents | R3 — alertes de disponibilité |
| Mono-instance (rate-limiting mémoire) | 🟡 Limite de montée en charge | R5 — store partagé si multi-instance |

### 5.4 Décision métier attendue
- **Mode de tarif de la garantie « Individuel Accident »** : prime fixe (comportement actuel) **ou** par nombre de places (activable par simple paramétrage). → **Confirmation à apporter par l'assureur.**

### 5.5 Date butoir
⟶ **À fixer en réunion de clôture.** Les actions restantes étant de courte durée, un go-live sous **quelques jours ouvrés** est réaliste.

---

## 6. Plan d'action post-clôture

| # | Action | Responsable | Échéance | Dépendance |
|---|---|---|---|---|
| A1 | Fixer la date de go-live | Métier + Tech | Réunion de clôture | — |
| A2 | Souscrire au plan payant Supabase | Tech / Exploitation | Avant go-live | A1 |
| A3 | Mettre en place sauvegardes + test de restauration | Tech | Avant go-live | A1 |
| A4 | Déployer en production (runbook §5.1) | Tech | Jour J | A2, A3 |
| A5 | Exécuter la recette fonctionnelle (checklist §7) | Métier + Tech | Jour J / J+1 | A4 |
| A6 | Obtenir la confirmation tarifaire « Individuel Accident » | Assureur | Avant J+3 | — |
| A7 | Configurer la supervision (logs + alertes) | Tech | J+5 | A4 |

---

## 7. Checklist de recette (environnement déployé)

| # | Cas de test | Priorité | Statut |
|---|---|---|---|
| 1 | Parcours de comparaison complet (formulaire → résultats → devis) | 🔴 Bloquant | ⬜ |
| 2 | Date d'effet : jour même refusé, lendemain accepté | 🔴 Bloquant | ⬜ |
| 3 | Formule choisie pré-sélectionnée à l'étape des résultats | 🟠 Majeur | ⬜ |
| 4 | Info-bulles et légende conformes en comparaison | 🟠 Majeur | ⬜ |
| 5 | Garantie « Individuel Accident » : montant correctement affiché | 🔴 Bloquant | ⬜ |
| 6 | Création de compte : règles de mot de passe affichées + création fonctionnelle | 🔴 Bloquant | ⬜ |
| 7 | Connexion / déconnexion des trois rôles (USER, INSURER, ADMIN) | 🔴 Bloquant | ⬜ |
| 8 | Assureur auto-inscrit : compte en attente, activé par un admin avant tout accès | 🔴 Bloquant | ⬜ |
| 9 | Espace assureur limité à sa compagnie ; back-office admin complet | 🔴 Bloquant | ⬜ |

> **Critère de sortie** : 100 % des cas bloquants passés, aucun anomalie critique ouverte.

---

## 8. Conclusion

La plateforme NOLI est **fonctionnellement complète** sur les trois espaces (client, assureur, admin) et **techniquement saine** (build et tests au vert, zéro défaut ouvert). La mise en production consiste à **déployer et valider sur l'environnement cible**, avec la fixation d'une **date butoir** — objet de la réunion de clôture.

**Prochaine étape** : réunion de clôture → validation de la date de go-live et lancement du plan d'action (§6).

---

### Documentation de référence (dépôt `docs/`)
`DEPLOIEMENT.md` · `AUDIT_SECURITE_2.0.0.md` · `RECETTE_FONCTIONNELLE_2.0.0.md` · `SAUVEGARDE_DR.md` · `PLAN_INDUSTRIALISATION.md`
