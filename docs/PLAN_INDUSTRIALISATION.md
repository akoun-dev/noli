# Plan d'industrialisation — Noli 2.0.0

**Objectif :** passer d'une qualité « MVP qui marche » à un **produit industrialisé**
(fiable, exploitable, sécurisé, maintenable, tenable en production).
**Cible de déploiement retenue :** **VPS mono-serveur + PM2** (Next.js `output:
standalone`, reverse-proxy Caddy), **base Supabase/Postgres externe**.

> Document de cadrage à valider par l'équipe (Somet, Hervé, Akoun) avant exécution.
> Effort indiqué en tailles relatives : **S** (≤1 j), **M** (2-4 j), **L** (≥1 sem).
> « Qui » : **Claude** (je peux le faire), **Dev** (Hervé/Akoun), **Ops** (accès serveur/comptes).

---

## 1. Constat (vérifié dans le code)

**✅ Fondations déjà en place**
- Base **Supabase/Postgres** managée · **24 migrations** versionnées · **RLS** dans 21/24.
- Next.js `output: standalone` (adapté PM2) · **en-têtes de sécurité** (HSTS, X-Frame, CSP).
- **Rate-limiting** codé · **105 tests** + outillage couverture · `.env.example` · doc déploiement.

**⚠️ Écarts pour l'industrialisation**
- ❌ **Aucun CI/CD** (qualité vérifiée manuellement).
- ❌ **Aucune observabilité** (pas de suivi d'erreurs, d'alertes, de healthcheck).
- ⚠️ **Sauvegarde cassée** : `lib/backups.ts` sauvegarde un fichier **SQLite local**
  (`db/custom.db`) qui **n'est pas la vraie base** (la prod est sur Supabase/Postgres).
  → la fonctionnalité « sauvegarde » admin ne protège rien.
- ⚠️ **Contrainte mono-instance fondée sur une fausse hypothèse** : `ecosystem.config.js`
  impose 1 seule instance « car SQLite »… **or il n'y a aucune dépendance SQLite**.
  La base étant externe, on pourrait scaler (PM2 cluster) — au prix du rate-limit partagé.
- ⚠️ **Rate-limit en mémoire** (`new Map`) : OK en mono-instance, **bloquant** si multi-instance.
- ⚠️ **RLS non garante** : l'app se connecte en `service_role` (**bypass RLS**) → toute la
  sécurité repose sur les gardes applicatives (auditées et OK), mais la RLS doit être
  auditée comme filet de sécurité réel.
- ⚠️ **CSP** présente mais `script-src 'unsafe-inline'` (à durcir).
- ⚠️ Couverture de tests **fine** (6 fichiers pour ~60 routes) · **pas d'E2E** · pas de
  **staging/prod** clairement séparés · **pas de runbooks**.

---

## 2. P0 — Socle « industriel » (bloquant, à faire en premier)

| # | Chantier | Détail | Qui | Effort |
|---|---|---|---|---|
| P0.1 | **CI/CD** | GitHub Actions sur chaque PR : `tsc` + `eslint` + `vitest` + `next build`, **merge bloqué si rouge** ; vérif migrations. | Claude | S-M |
| P0.2 | **Healthcheck** | Route `/api/health` (ping DB Supabase + version), pour PM2 & supervision. | Claude | S |
| P0.3 | **Observabilité** | Sentry (erreurs front+serveur) · logs structurés + rotation (PM2 logrotate) · supervision uptime + **alertes** (mail/Slack). | Dev+Ops | M |
| P0.4 | **Sauvegarde/DR réelle** | Remplacer la sauvegarde SQLite morte par une **sauvegarde Supabase/Postgres** (pg_dump planifié ou backups Supabase) + **restauration testée**. | Dev+Ops | M |
| P0.5 | **Déploiement reproductible** | Script de déploiement (build → `pm2 reload` zéro-downtime) + **procédure de rollback** documentée. | Dev+Ops | S-M |
| P0.6 | **Nettoyage legacy** | Retirer/États clarifier : `ecosystem.config.js` (fausse contrainte SQLite), `Caddyfile` vs Netlify, `lib/backups.ts` SQLite. Une seule cible assumée. | Claude+Dev | S |
| P0.7 | **Secrets & config** | Vérifier qu'aucun secret n'est au repo · `.env` par environnement · **rotation de la clé `service_role`**. | Ops | S |

---

## 3. P1 — Fiabilité & qualité

| # | Chantier | Détail | Qui | Effort |
|---|---|---|---|---|
| P1.1 | **Couverture de tests ciblée** | Tests sur auth, **calcul de prix**, routes/parcours critiques + **seuil de couverture** en CI (échec sous X %). | Claude+Dev | M |
| P1.2 | **Tests E2E** | Playwright sur les parcours clés : comparaison→devis, connexion/rôles, espaces assureur/admin. | Claude+Dev | M-L |
| P1.3 | **Staging** | Environnement de préproduction iso-prod (données de test) pour la recette live avant chaque release. | Ops | M |
| P1.4 | **Audit RLS** | Vérifier que les policies RLS protègent réellement chaque table (puisque l'app bypass en `service_role`). | Dev | M |
| P1.5 | **Migrations en CI** | Appliquer/valider les migrations automatiquement (dry-run) et versionner le schéma. | Dev | S-M |
| P1.6 | **Durcissement CSP** | Retirer `unsafe-inline` (nonces/hash) ; revue en-têtes. | Dev | S-M |

---

## 4. P2 — Scale, performance & qualité produit

| # | Chantier | Détail | Qui | Effort |
|---|---|---|---|---|
| P2.1 | **Performance** | Cache HTTP/Next, analyse de bundle, optimisation images, budgets perf, test de charge. | Dev | M |
| P2.2 | **SEO** | L'app est une SPA (route catch-all) → vérifier indexation, meta, SSR/pré-rendu des pages publiques (le fix « liens directs » y contribue). | Dev | M |
| P2.3 | **Accessibilité (a11y)** | Audit WCAG (navigation clavier, contrastes, ARIA). | Dev | M |
| P2.4 | **Scalabilité (si besoin)** | Lever la contrainte mono-instance (SQLite legacy retiré) → PM2 cluster + **rate-limit partagé** (Redis/Upstash) + sessions/état stateless. | Dev+Ops | M-L |
| P2.5 | **Runbooks & pilotage** | Procédures incident/rollback/on-call · tableaux de bord métier · politique de release. | Dev+Ops | M |

---

## 5. Séquence recommandée

1. **P0.1 + P0.2** (CI/CD + healthcheck) — je peux les livrer **immédiatement**, faible risque.
2. **P0.6 + P0.4** (nettoyage legacy + vraie sauvegarde DB) — enlève les pièges et sécurise les données.
3. **P0.3 + P0.7** (observabilité + secrets) — dès qu'un compte Sentry et l'accès serveur sont dispo.
4. **P0.5** (déploiement zéro-downtime + rollback).
5. Puis **P1** (tests/E2E/staging/RLS), enfin **P2** (perf/SEO/a11y/scale) selon les priorités business.

**Estimation globale P0 :** ~1,5 à 2,5 semaines-équipe (selon accès Ops).
**P0→P1 :** ~4 à 6 semaines-équipe. **P2 :** selon ambition (perf/SEO/a11y/scale).

---

## 6. Ce que je (Claude) peux faire tout de suite

Sans aucun accès externe, à faible risque, avec tests/build verts :
- **CI/CD GitHub Actions** (P0.1) · **healthcheck `/api/health`** (P0.2)
- **Nettoyage des configs legacy** + clarification (P0.6)
- Remplacement du code de **sauvegarde** par une base saine (P0.4, partie code)
- **Tests supplémentaires** ciblés + seuil de couverture (P1.1)

Ce qui **nécessite l'équipe/Ops** (comptes, serveur, secrets) : Sentry, alertes,
staging, rotation de clés, sauvegardes planifiées côté serveur, tests de restauration.

> Rien de tout cela ne remet en cause le produit actuel : il **fonctionne** et est
> fonctionnellement sain. L'industrialisation le rend **exploitable et durable** en prod.
