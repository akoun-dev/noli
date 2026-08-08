# Exemple chiffré — calcul du prix affiché (`compare-service.ts`)

But : rendre concret le point « à décider par le métier » du rapport de recette.
Exemple **construit** à partir de la logique réelle du code (fichier
`src/lib/compare-service.ts`), avec des garanties à **montant fixe** pour que
l'arithmétique soit évidente. Les montants sont illustratifs.

---

## Données de départ — les garanties configurées par l'assureur

| Garantie | Type | Obligatoire ? | Retenue par le client ? | Montant/an |
|---|---|---|---|---|
| Responsabilité Civile (RC) | Montant fixe | ✅ **oui** | — | **45 000** |
| Défense & Recours | Montant fixe | non | ✅ oui | 8 000 |
| Assistance | Montant fixe | non | ✅ oui | 12 000 |
| Bris de Glaces | Montant fixe | non | ✅ oui | 25 000 |

## Le texte marketing de l'offre (`features`)

C'est ce que l'assureur a saisi comme libellés de l'offre :

```
features = [ "Défense & Recours", "Assistance 24/7", "Bris de glace", "Bris de glaces" ]
```

Deux choses réalistes ici :
- La **RC n'est pas** dans ce texte (elle est implicite/obligatoire).
- « Bris » apparaît **deux fois** sous deux libellés (« Bris de glace » et « Bris de glaces »).

---

## ✅ Le prix ATTENDU (somme « propre » = `grossPremium`)

Règle correcte : additionner les garanties **retenues OU obligatoires**.

```
RC (obligatoire)      45 000
Défense & Recours      8 000
Assistance            12 000
Bris de Glaces        25 000
-----------------------------
TOTAL ATTENDU        90 000 FCFA / an
```

Cette somme est **déjà calculée** par le code (`grossPremium`, fonction
`priceCoverages`, lignes 110-149)… mais **elle n'est pas utilisée** pour l'affichage.

## ❌ Le prix RÉELLEMENT AFFICHÉ (`computedPremium` → `annualPrice`, lignes 234-250)

Règle actuelle : parcourir le **texte `features`** et additionner par rapprochement de nom.

```
"Défense & Recours"  → Défense & Recours     8 000
"Assistance 24/7"    → Assistance           12 000
"Bris de glace"      → Bris de Glaces        25 000
"Bris de glaces"     → Bris de Glaces        25 000   ← COMPTÉ 2 FOIS
-----------------------------------------------------
TOTAL AFFICHÉ                               70 000 FCFA / an
```

La RC obligatoire (45 000) est **absente** (pas dans le texte), et le Bris (25 000)
est **compté deux fois**.

---

## Le verdict, côte à côte

| | Prix/an | Prix/mois (÷12) |
|---|---|---|
| ✅ **Attendu** (`grossPremium`) | **90 000** | 7 500 |
| ❌ **Affiché** (`computedPremium`) | **70 000** | 5 833 |
| **Écart** | **−20 000** | −1 667 |

Décomposition de l'écart : **−45 000** (RC obligatoire oubliée) **+25 000** (Bris
compté 2×) = **−20 000**.

> ⚠️ Ici les deux défauts se compensent partiellement, mais **ce n'est pas toujours
> le cas** :
> - Sans le doublon, l'oubli de la RC ferait afficher **45 000** au lieu de 90 000
>   (offre **dangereusement sous-évaluée**).
> - Sans l'oubli, le doublon ferait afficher **115 000** au lieu de 90 000
>   (offre **sur-évaluée**).
>
> Autrement dit, le prix peut être faux **dans les deux sens**, de façon
> imprévisible selon la saisie des libellés.

---

## Où le voir dans le code

- `src/lib/compare-service.ts`
  - **lignes 234-238** : la boucle qui additionne `computedPremium` depuis `features`
  - **ligne 250** : `annualPrice: Math.round(computedPremium)` ← le prix/an affiché
  - **ligne 249** : `monthlyPrice: Math.round(computedPremium / contractDuration)`
  - **lignes 110-149** : `priceCoverages` (le `grossPremium` « propre », non utilisé)
  - **lignes 161-200** : `findPricingForFeature` (le rapprochement par nom)
- `src/lib/compare-service.test.ts` (~262-270) : test qui **verrouille** le comportement actuel.

---

## Recommandation (à valider par le métier)

**Option A — baser le prix sur `grossPremium`** (garanties retenues + obligatoires).
Simple, robuste, indépendant des libellés marketing. C'est la correction la plus sûre.

**Option B — garder le calcul par `features`**, mais :
1. **dédupliquer** (ne compter chaque garantie qu'une fois), et
2. **ajouter systématiquement** les garanties obligatoires même absentes du texte.

Dans les deux cas, il faudra **mettre à jour le test** `compare-service.test.ts` en
conséquence — d'où la nécessité d'une **décision métier explicite** avant tout
changement, puisque le prix montré aux clients en dépend.
