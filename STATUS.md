# STATUS — NOLI

> Source de vérité du chantier. Mise à jour à chaque étape et avant toute fin de session.
> Dernière mise à jour : 2026-10-06 · branche par défaut `2.0.0`.

## Livrable LIVRÉ ✅ — Découpe `insurer-guarantees-tab` (2238 → 123 l)
Branche : `claude/decoupe-insurer-guarantees-ohdyp0` · commit `3731b35` · preview : build local.

**DoD :**
| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Orchestrateur < 300 l + chaque fichier < 300 l | ✅ | tab 123 l ; 18 modules `guarantees/` de 64 à 270 l |
| 2 | Extraction PURE (0 changement de comportement) | ✅ | relecteur : blocs vérifiés verbatim (defaults, builders, parsing, hooks) |
| 3 | `bun run check` + `build` verts | ✅ | 0 erreur, 176 tests ; « Compiled successfully » |
| 4 | Écran rendu (smoke) | ✅ (home) / ⏳ (onglet) | home 200, 0 erreur console ; **onglet « Garanties » assureur = à tester sur preview (login requis)** |

Chaîne : dev-frontend (extraction) → **relecteur : CONFORME** → recette. Bonus : suppression de `renderFranchiseSection` (code mort). **PR #62 mergée dans `2.0.0` (`758f484`).**
⚠️ Seule vérif restante : rendu/comportement réel de l'onglet assureur « Garanties » (wizard/matrice/tarifs/CRUD) sur la deploy-preview Netlify (https://deploy-preview-62--noliassurance.netlify.app, ou prod après redéploiement) avec un compte assureur — non reproductible en local.

### Livrables précédents (mergés dans `2.0.0`)
- Design system source unique (PR #61, mergée) — 12 tokens, 0 hex en dur, `tailwind.config.ts` supprimé.
- Cadre de travail + garde-fous (commit `8c794f8`).

### Backlog « fichiers géants » (prochains)
- `coverages-tab.tsx` (1846 l) · `auth-form.tsx` (1241 l) · puis les autres > 300 l — un par un, même méthode (extraction pure → relecteur → recette).
- Option : re-découper les sous-composants denses du lot garanties (`use-guarantees-wizard` 270, `tierce-editor` 220) si on veut réduire les warnings de complexité.

## État des lieux (enquête 2026-10-05)
### Livré / fonctionne
- Recette **métier v2.2.0** : validée (tous ✅ sauf MET-PUB-04, corrigé).
- Recette **technique** : 43/45 conformes ; les 2 réserves 🔴 corrigées et mergées (voir PR ci-dessous), re-test à faire sur prod.
- Page `/offres` : corrigée (crash 500 catégorie nulle) — confirmée par captures (18 offres affichées).
- CI verte (tsc · lint · tests · build) sur `2.0.0`.

### Partiel / à confirmer
- **Page blanche / pages non stylées** signalées par Hervé (et confirmées multi-testeurs) sur Edge/Firefox/Chrome. **Diagnostic établi** : build sain (rebuild local du commit `2.0.0` → CSS principal `dde7a43004f4dd8f.css` ≈183 Ko contenant tous les tokens, servi 200). Symptôme = **assets `/_next/static/*.css`+`.js` en 404 en prod** (désynchro `.next` après redéploiements rapprochés, ou build tué avant la copie des statiques dans le standalone). **Non reproductible depuis l'environnement** (sortie vers noli.ci bloquée).
  - **Action en cours (2026-10-07) : message + runbook de redéploiement propre envoyés à Bernard** (`rm -rf .next` → `bun run build` complet → vérifier `ls .next/standalone/.next/static/chunks/*.css` → `pm2 restart` → `curl -I`). Vérif 404 côté testeur : F12 → Réseau → rouge sur `/_next/static/`. **En attente du retour de Bernard.**
- Re-tests recette technique (TEC-AUTH-01 cookie httpOnly, TEC-AUTH-06 compte désactivé) + flux reset mot de passe : à cocher par le testeur après redéploiement.

### Cassé / dette
- 38 fichiers > 300 lignes (top : `insurer-guarantees-tab` 2214, `coverages-tab` 1846, `auth-form` 1241).
- Duplication **7,6 %** (jscpd : 176 clones). Code mort (knip) : ~12 exports + 3 devDeps inutilisés, 1 doublon d'export.
- Double système de thème : `tailwind.config.ts` (v3, mort) vs `globals.css` (v4, vérité) ; 5 fichiers avec hex en dur.
- ESLint historiquement très permissif (quasi toutes règles désactivées).

## Pull requests récentes (toutes mergées dans `2.0.0`)
| PR | Objet | État |
|---|---|---|
| #60 | Fix crash 500 /offres (catégorie nulle) | mergée |
| #59 | Lien « Offres » nav publique (MET-PUB-04) | mergée |
| #58 | Confirmation activer/désactiver compte (TEC-AUTH-06) | mergée |
| #57 | Cookie httpOnly + 404 JSON /api (TEC-AUTH-01, TEC-RBAC-02) | mergée |
| #54–56 | Bouton PDF devis, durcissement sécurité, bornes offres | mergées |

## Décisions déduites (source)
Voir `docs/DECISIONS.md`. Principales : ligne active = `2.0.0` ; prod = nginx+PM2 ; design = `globals.css` ; garde-fous en warn.

## Hypothèses retenues
- Page blanche = incohérence d'assets après double déploiement (raisonnement : process stable + nginx sans cache + intermittence multi-utilisateurs).
- Le projet **n'est pas** un projet Lovable (dépôt Next.js codé à la main ; aucun lien Lovable trouvé). Investigation Lovable = sans objet.

## À DÉFINIR (arbitrages)
- Prochain livrable (voir Questions dans la réponse).
- Découpage des fichiers géants : périmètre / priorité.
- Nettoyage design (supprimer `tailwind.config.ts`, remplacer hex par tokens).

## Backlog
1. **Stabiliser la page blanche** (build propre + `pm2 restart` ; confirmer la disparition avec un testeur ; sinon capturer 404 réseau / erreur console).
2. **Re-test recette technique** sur prod (TEC-AUTH-01, TEC-AUTH-06, reset MDP) → passer la recette de « validée avec réserves » à « validée ».
3. **Consolider le design system** (1 seule source de vérité + tokens partout).
4. **Découper** les fichiers > 300 l (en commençant par les tabs > 1000 l).
5. Nettoyage : retirer `next-auth`, mentions SQLite/Caddy héritées, exports morts (knip).
6. Réduire la duplication (jscpd 7,6 %).

## Agents mobilisés
- `Explore` (scan architecture + anti-spaghetti) → rapport intégré ci-dessus + dans ARCHITECTURE.md. **Fermé ✅.**

## Garde-fous
`bun run check` (typecheck + lint + tests) = vert (0 erreur, 288 warnings de taille/complexité). Hook `pre-push` → `check`. `bun run check:unused` (knip) et `bun run check:dup` (jscpd) = rapports non bloquants.
