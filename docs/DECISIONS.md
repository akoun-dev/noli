# Décisions structurantes — NOLI

> Une ligne par décision : date · décision · raison (+ source). Ordre antéchronologique.

| Date | Décision | Raison / source |
|---|---|---|
| 2026-10-06 | **Design system consolidé en une source unique** : 12 tokens ajoutés à `globals.css` (`:root`/`.dark`/`@theme inline`), suppression de tous les hex en dur des 5 composants (landing, about, contact, footer, comparison-form). Suppression de `tailwind.config.ts` (config v3 morte) et de la dépendance `tailwindcss-animate` (consommée uniquement par ce fichier). | Livrable validé 2026-10-06. Rendu préservé à l'identique (tokens = hex d'origine). Tailwind v4 = config CSS pure. |
| 2026-10-05 | Mise en place du cadre de travail : agents (`.claude/agents/`), `CLAUDE.md` (règles), `STATUS.md`, garde-fous (eslint taille/complexité/cycles, knip, jscpd, hook pre-push `check`). | Demande du chef de projet (cadre « chef de chantier »). |
| 2026-10-05 | Garde-fous anti-spaghetti réglés en **warn / non bloquant**, seuils au niveau actuel. | L'existant dépasse déjà (38 fichiers > 300 l, 288 warnings, 7,6 % dup). Objectif : rendre visible + empêcher l'aggravation sans bloquer le flux. |
| 2026-10-05 | **Design system : source de vérité = `src/app/globals.css`** (Tailwind v4, `@theme`). `tailwind.config.ts` (style v3, `hsl(var(--))`) est considéré **hérité/mort**. | Projet en Tailwind v4 (`@tailwindcss/postcss`) ; la config JS n'est pas chargée. Source : rapport d'exploration 2026-10-05. |
| 2026-10-04 | Page Offres (`/offres`) : garde `offer.category?.name` (jointure left nullable) + `formatPrice` tolérant null. | Crash 500 en prod sur offre sans catégorie (PR #60). Source : logs navigateur + repro locale. |
| 2026-10-04 | Lien « Offres » ajouté à la nav publique (header + footer). | Recette métier MET-PUB-04 : page existante mais inaccessible (PR #59). |
| 2026-10-04 | `/api/*` inconnu → 404 JSON via `src/app/api/[...notfound]/route.ts`. | Recette technique TEC-RBAC-02 : un chemin inconnu retombait en 200 + HTML (PR #57). |
| 2026-10-04 | Cookie de session forcé **httpOnly** ; échange PKCE de récupération + signOut passés côté serveur ; client Supabase navigateur supprimé. | Recette technique TEC-AUTH-01 (PR #57). |
| 2026-09 | **Ligne active unique = `2.0.0`** (Supabase / Next.js), branche par défaut du dépôt. L'ancienne ligne `claude/noli-security-audit-*` (Vite / PostgreSQL) est hors périmètre / à archiver. | Deux bases de code sans ancêtre commun ; seule `2.0.0` est déployée et recettée. |
| 2026-09 | **Prod servie par nginx + PM2** (port 8080), pas Caddy. | Config `noli.ci.nginx` (`proxy_pass 127.0.0.1:8080`) + logs serveur. (Doc historique à corriger.) |

## À DÉFINIR (décisions en attente d'arbitrage)
- Découpage des fichiers géants (ordre de priorité, périmètre acceptable).
- Nettoyage du design (supprimer `tailwind.config.ts` mort, remplacer les hex en dur par des tokens).
- Suppression de `next-auth` (listé mais inutilisé) et des mentions SQLite héritées.
- Câblage (ou non) de `calculateNetPremium` (prime nette vs prime brute affichée).
