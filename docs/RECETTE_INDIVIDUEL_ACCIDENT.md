# NOLI — Recette ciblée : Individuel Accident

| | |
|---|---|
| **Produit** | NOLI `2.0.0` |
| **Point** | Règle de calcul « Individuel Accident » (point bloquant signalé par Tamsir) |
| **Référence** | Catalogue **Motor_Tarification**, feuille « IC IPT ASS » |
| **Date** | 12/09/2026 |

---

## 1. Rappel du point

L'Individuel Accident était le **point bloquant** : la règle de calcul ne « répercutait » pas correctement le tarif. Deux problèmes se cumulaient :
1. La garantie s'affichait **« Inclus »** (montant 0) à cause d'un bug (matrice ignorée) — *déjà corrigé*.
2. Le moteur **arrondissait à 500 F CFA** les primes fixes → **8 400 devenait 8 500**, **15 900 → 16 000**, donc **≠ catalogue** — *corrigé maintenant*.

## 2. Ce que dit le catalogue

**Individuelle Conducteur (IC)** — prime **fixe** par formule :

| Formule | Prime catalogue |
|---|---|
| Formule 1 | 5 500 F CFA |
| Formule 2 | 8 400 F CFA |
| Formule 3 | 15 900 F CFA |

**Individuelle Personnes Transportées (IPT)** — prime **par nombre de places** (extrait, Formule 1) : 3 pl. = 8 400 · 4 pl. = 10 200 · **5 pl. = 16 000** · 6 pl. = 17 800 · 7 pl. = 19 600 · 8 pl. = 25 400.

## 3. Correctif appliqué

Dans le moteur, l'**arrondi à 500 n'est plus appliqué aux primes fixes** (celles issues du catalogue) ; il reste sur les calculs en **pourcentage** (où il a du sens). Les primes IPT « par places » étaient déjà exactes.

## 4. Recette du moteur de calcul (réalisée)

Moteur réel (`pricing-service.ts`) exécuté sur les valeurs du catalogue, profil : *essence · 7 CV · 5 places · VN 15 000 000 · usage personnel*.

| Réf. | Garantie / formule | Catalogue (attendu) | Obtenu (moteur) | Statut |
|---|---|---:|---:|:---:|
| IA-IC-1 | Individuelle Conducteur — Formule 1 | 5 500 | 5 500 | ✅ OK |
| IA-IC-2 | Individuelle Conducteur — Formule 2 | 8 400 | 8 400 | ✅ OK |
| IA-IC-3 | Individuelle Conducteur — Formule 3 | 15 900 | 15 900 | ✅ OK |
| IA-IPT-1 | Ind. Personnes Transportées — F1 (5 pl.) | 16 000 | 16 000 | ✅ OK |
| IA-IPT-2 | Ind. Personnes Transportées — F2 (5 pl.) | 17 000 | 17 000 | ✅ OK |
| IA-IPT-3 | Ind. Personnes Transportées — F3 (5 pl.) | 30 600 | 30 600 | ✅ OK |
| IA-BUG | Formule sans libellé (cas du bug « Inclus ») | 5 500 | 5 500 | ✅ OK |

**Résultat : 7/7 conformes au catalogue.** (Voir la capture `RECETTE_Individuel_Accident.png` — démonstration du moteur, verrouillée par un test automatique de non-régression.)

> ⚠️ Cette recette valide la **règle de calcul**. Elle ne remplace pas la vérification finale **dans l'application déployée** avec les primes **réellement saisies** pour la compagnie testée (§5).

## 5. Recette UI à réaliser (Tamsir, sur la recette déployée)

Une fois la version `2.0.0` déployée sur la recette :

| # | Étape | Attendu | Capture | Statut |
|---|---|---|---|---|
| 1 | Lancer une comparaison avec un profil connu (noter le nombre de places, la valeur neuve) | Résultats affichés | ☐ | |
| 2 | Ouvrir une offre incluant « Individuel Accident » | Une **ligne Individuel Accident avec un montant** (pas « Inclus ») | ☐ | |
| 3 | Comparer le montant affiché au **catalogue** pour ce profil | Montant = valeur catalogue | ☐ | |
| 4 | Vérifier une formule IC (prime fixe) et une IPT (par places) | Les deux exacts | ☐ | |

*(Coller les captures d'écran de l'application en regard de chaque étape.)*

**En cas d'écart** : ce n'est plus un bug de calcul mais un **paramétrage** — vérifier les primes saisies pour la garantie dans le back-office (valeurs et mode « prime fixe » vs « par places »).

## 6. Conclusion

La règle de calcul de l'Individuel Accident est **conforme au catalogue** au niveau du moteur (IC en prime fixe exacte, IPT par places exacte, plus d'« Inclus »). Il reste à **confirmer en recette déployée** (§5) avec les données réelles de la compagnie — ce que Tamsir souhaitait légitimement faire.
