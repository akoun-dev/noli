# STATUS — NOLI

> Source de vérité du chantier. Mise à jour à chaque étape et avant toute fin de session.
> Dernière mise à jour : 2026-10-05 · branche par défaut `2.0.0`.

## Livrable en cours
**Consolidation du design system — une seule source de vérité** (validé le 2026-10-06).
Branche : `claude/design-system-source-unique-ohdyp0`. Preview : build local (noli.ci inaccessible depuis l'environnement).

**DoD :**
| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | `tailwind.config.ts` (mort, non chargé) supprimé sans régression | en cours | vérif : aucun `@config`, non référencé, postcss v4 pur |
| 2 | 0 hex en dur dans les 5 fichiers (landing, about, contact, footer, comparison-form) → tokens | en cours | — |
| 3 | `globals.css` = source unique documentée (tokens ajoutés si besoin) | en cours | — |
| 4 | `bun run check` vert | en cours | — |
| 5 | Captures *avant/après* identiques (landing, about, contact) | en cours | recette |

Chaîne : designer (mapping) → dev-frontend (application) → relecteur (anti-spaghetti) → recette (captures). PR/merge `2.0.0` sur demande explicite.

## État des lieux (enquête 2026-10-05)
### Livré / fonctionne
- Recette **métier v2.2.0** : validée (tous ✅ sauf MET-PUB-04, corrigé).
- Recette **technique** : 43/45 conformes ; les 2 réserves 🔴 corrigées et mergées (voir PR ci-dessous), re-test à faire sur prod.
- Page `/offres` : corrigée (crash 500 catégorie nulle) — confirmée par captures (18 offres affichées).
- CI verte (tsc · lint · tests · build) sur `2.0.0`.

### Partiel / à confirmer
- **Page blanche intermittente** signalée par plusieurs testeurs (« ça part, ça vient »). Process PM2 **stable** (logs : pas de crash). Hypothèse : assets `_next/static` incohérents après 2 redéploiements rapprochés. Correctif proposé : build propre unique + `pm2 restart`. **Non reproductible depuis l'environnement** (sortie vers noli.ci bloquée).
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
