# Recette fonctionnelle — Noli `2.0.0`

**Date :** 2026-08-08
**Périmètre :** branche `2.0.0` (Next.js). Revue fonctionnelle de bout en bout des
4 parcours (utilisateur, assureur, admin, cœur comparaison/devis), par
recoupement systématique **front ↔ route API** (méthode HTTP, noms de champs,
forme des réponses, états, boutons). Chaque bug a été **vérifié manuellement**
avant correction.

**Méthode :** recette *technique* (revue de code). Une recette *live* (clics dans
l'app avec les vraies clés Supabase) reste à faire côté staging pour les 2 points
« à valider » ci-dessous.

---

## Bugs corrigés (11)

| # | Grav. | Bug | Correctif |
|---|---|---|---|
| 1 | 🔴 Haute | **Listes devis/stats assureur non filtrées** : `.eq("offer.insurer_id")` sur un embed to-one *sans* `!inner` ne filtre pas les lignes racine → un assureur pouvait voir *tous* les devis de la plateforme + KPI gonflés. | `!inner` ajouté sur `insurer/quotes` et les 6 requêtes de `insurer/stats`. |
| 2 | 🟠 Moy | Compteur « Devis » du détail d'offre (admin) affichait le total plateforme (`offerId` ignoré par la route). | `admin/quotes` lit et applique `offerId` (`eq("offer_id")`). |
| 3 | 🟠 Moy | Dashboard admin : colonne « Client » toujours « — » (double `JSON.parse` sur un objet déjà désérialisé). | Le front gère le cas objet avant de tenter `JSON.parse`. |
| 4 | 🟠 Moy | Filtre « Entité » des journaux d'audit ne renvoyait jamais rien (valeurs FR envoyées vs entités EN stockées). | Valeurs du menu alignées sur les entités réelles (`User`, `Insurer`, `InsuranceOffer`, `Quote`, `Settings`, `Backup`, `Role`). |
| 5 | 🟠 Moy | Impossible d'assigner une **catégorie** à une offre à la création (aucun sélecteur ; `categoryId` restait vide). | Ajout du chargement des catégories + d'un `Select` de catégorie dans le formulaire d'offre. |
| 6 | 🟠 Moy | **Catégorie de garantie perdue** à la création (le POST écrasait `type` par le code auto-généré). | POST écrit `type: type || genCode` (cohérent avec le PUT). |
| 7 | 🟠 Moy | **Téléphone entreprise** (assureur) non persistant : rechargé depuis le profil utilisateur au lieu de `insurers.phone`. | Le champ est réhydraté depuis `insurerData.phone`. |
| 8 | 🟡 Bas | **Date d'effet** supprimée du devis auto-enregistré (Zod retirait la clé inconnue). | `effectiveDate` ajoutée au schéma véhicule (`validation.ts`). |
| 9 | 🟡 Bas | 2 **recherches inopérantes** (catégories garanties / produits) : `search` jamais lu. | Filtre `ilike("name", …)` ajouté aux 2 routes. |
| 10 | 🟡 Bas | Planification de **sauvegarde en écriture seule** : jamais rechargée → réaffichait « désactivé » après reload. | Le GET renvoie la planif enregistrée ; l'onglet réhydrate l'état. |
| 11 | 🟡 Bas | Filtre **budget** mal calé/libellé en mode « par mois » (max du curseur figé sur l'annuel). | `effectiveBudgetMax` dépend du `priceMode` ; libellé dynamique (mensuel/annuel). |

---

## À valider en recette *live* (non corrigés — dépendent des données réelles)

Ces 2 points n'ont **pas** été corrigés à l'aveugle car le comportement dépend des
données ou d'une intention produit à confirmer :

1. **Somme des prix par garantie ≠ prix annuel affiché.** Le serveur
   (`compare-service.ts`) et le front (`results-helpers.ts`/`offer-card.tsx`)
   utilisent deux normalisations de libellés différentes (`normalizeGuaranteeText`
   vs `normalizeGuaranteeName` + `resolveCoverageName`). Pour des libellés avec
   tiret/underscore, une ligne affichée peut ne pas être comptée par le serveur
   (ou l'inverse). *À vérifier sur les `coverages`/`features` réels ; corriger en
   unifiant la normalisation.*
2. **« Demander un devis » depuis le catalogue** appelle `setSelectedOffer` puis
   `setView("compare")`, mais `ComparisonForm` ne lit jamais `selectedOffer` :
   l'offre choisie n'est pas pré-remplie. Impact limité (toutes les offres
   éligibles réapparaissent après comparaison). *À confirmer : comportement voulu
   ou pré-remplissage attendu ?*

## Notes (non-bugs)

- Onglets sans appel API (écrans statiques/vides) : côté utilisateur
  (avis, paiements, historique), côté assureur (contrats, clients, sinistres).
  Ce sont des fonctionnalités **non branchées**, pas des bugs front/route — à
  activer seulement si prévues dans cette version.
- KPI « Notifications » du tableau de bord utilisateur codé à `0` (placeholder, au
  même titre que « Économies réalisées » affiché « — »). Laissé tel quel : décision
  d'affichage, pas un bug.
- `pricing-service.ts` : branche morte `seatsRaw === "+8"` (le formulaire produit
  `"9+"`), sans impact — `parseInt("9+")` = 9. Non corrigé (aucun effet).

---

## Vérification post-correctifs

`tsc --noEmit` : **0 erreur** · `eslint` : **0** · `vitest` : **98/98** ·
`next build` : **OK**. Aucun changement de comportement hors des bugs traités.

---

# 2e passe (re-recette) — vérification des correctifs + nouveaux bugs

Après application des 11 correctifs ci-dessus, une **2e recette** a (a) vérifié
chaque correctif et (b) cherché ce qui restait sous un autre angle (cycle de
chargement, rafraîchissement après action, états d'erreur, validations).

## Vérification des 11 correctifs
Tous **confirmés corrects**. Deux compléments détectés et traités (voir ci-dessous :
filtre d'audit incomplet).

## Nouveaux bugs corrigés (2e passe)

| # | Grav. | Bug | Correctif |
|---|---|---|---|
| 12 | 🔴 **Haute** | **Onglet « Mes Offres » (assureur) bloqué sur le squelette** : `fetchOffers` ne remettait jamais `loading` à `false` sur le chemin succès. **Bug pré-existant dans `2.0.0`.** | `finally { setLoading(false) }` ajouté. |
| 13 | 🟠 Moy | Filtre **« Entité »** des journaux d'audit **incomplet** : 5 entités non filtrables (garanties, catégories, règles tarifaires, rôles/profil). | 5 `SelectItem` ajoutés (Coverage, CoverageCategory, InsuranceCategory, CoverageTariffRule, Profile). |
| 14 | 🟠 Moy | **« Mes Devis » masquait les pannes** : erreur réseau/500 avalée → affichait « Aucun devis » même quand l'utilisateur en a. | État d'erreur + bouton « Réessayer » ajoutés. |
| 15 | 🟡 Bas | Filtre **« Action »** des journaux : 3 options mortes (LOGIN/LOGOUT/EXPORT jamais écrites) + 3 manquantes (REGISTER, BACKUP_DELETE, BACKUP_RESTORE). | Menu réaligné sur les actions réellement journalisées. |
| 16 | 🟡 Bas | Offres : bornes **min > max** acceptées (prix, puissance, valeurs). | Contrôle `min ≤ max` ajouté (POST + PUT). |

## Points laissés à décision produit / recette live (non corrigés)

- **CTA « Demander un devis » du catalogue** : `selectedOffer` est défini mais
  **jamais consommé** → l'utilisateur atterrit sur un formulaire vierge, l'offre
  choisie est perdue. *Bug ou simple point d'entrée ? À trancher côté produit.*
- **« Contrats actifs » (tableau de bord user)** compte les devis `APPROVED` et non
  les contrats `ACTIVE` de `/api/user/contracts` → un contrat expiré reste compté.
  *À confirmer (intention).*
- **KPI « Notifications »** du tableau de bord user codé à `0` (placeholder).
- **Garantie « montant fixe » à 0** acceptée (montant non validé à l'étape 3).
- **Devis assureur** : `limit=100` sans pagination → au-delà de 100 devis, les
  suivants ne s'affichent pas (à traiter selon la volumétrie réelle).

## Vérification post-correctifs (2e passe)
`tsc` **0** · `eslint` **0** · `vitest` **98/98** · `next build` **OK**.
