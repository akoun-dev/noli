# Guide de déploiement — NOLI

Runbook de mise en production de l'application NOLI (comparateur d'assurances).

- **Branche de production :** `2.0.0`
- **Infra :** build **Next.js 16 standalone** servi par **PM2** (`ecosystem.config.js`, app `noli`, mode **fork mono-instance**, port **8080**), derrière **Caddy** (`:81` → `reverse_proxy localhost:8080`).
- **Base de données :** Supabase (Postgres + Auth), externe. Migrations via la CLI Supabase.
- **Rappel :** le serveur standalone de Next.js ne charge pas `.env` automatiquement — c'est `ecosystem.config.js` qui injecte les variables dans l'environnement PM2. Ne jamais committer `.env`.

> Le déploiement n'est **pas automatique** : après un merge sur `2.0.0`, il faut rebuild + recharger PM2 sur le serveur (procédure ci-dessous).

---

## 1. Avant de déployer — évaluer l'impact

Selon le contenu de la release :

| Type de changement | Action supplémentaire |
|--------------------|------------------------|
| Code applicatif (frontend, `src/lib`, API routes) | Aucune — rebuild + reload suffisent. |
| Nouvelle **migration SQL** (`supabase/migrations/`) | Appliquer via la CLI Supabase **avant** le reload (voir §4). |
| Nouvelle **variable d'environnement** | Ajouter la clé dans `.env` du serveur **avant** le build. |
| Modification d'une **Edge Function** | `supabase functions deploy <nom>` (ex. `send-notification`). |
| Changement de `Caddyfile` | Recharger Caddy (`caddy reload` ou `systemctl reload caddy`). |

En cas de doute, lire le diff de la release : `git log --oneline <ancien>..<nouveau>` et inspecter `supabase/migrations/`, `.env.example`, `Caddyfile`.

---

## 2. Pré-requis serveur

- Accès SSH sous l'utilisateur qui exécute PM2.
- `bun`, `pm2`, `caddy` installés (et `supabase` CLI si migrations).
- Fichier **`.env` présent et à jour** à la racine du projet.
- Projet Supabase **actif** (le plan gratuit se met en pause après inactivité → provoque des échecs de connexion ; privilégier un plan payant en production).

---

## 3. Procédure standard (release code uniquement)

```bash
# 0. Se placer dans le projet
cd <chemin_du_projet_noli>

# 1. Récupérer la version à jour de la branche de prod
git fetch origin 2.0.0
git checkout 2.0.0
git pull --ff-only origin 2.0.0
git log --oneline -3        # vérifier que le(s) commit(s) attendu(s) sont présents

# 2. Installer les dépendances (bun.lock fait foi)
bun install

# 3. Build standalone (copie automatiquement static/ et public/ dans .next/standalone)
bun run build

# 4. Recharger l'application sans coupure (zero-downtime)
pm2 reload ecosystem.config.js --only noli    # ou : pm2 reload noli

# 5. Persister l'état PM2
pm2 save
```

Caddy n'a pas besoin d'être rechargé si le `Caddyfile` n'a pas changé.

---

## 4. Variante avec migration base de données

Si la release contient de nouvelles migrations (`supabase/migrations/`), les appliquer **entre le build et le reload** :

```bash
# Projet Supabase lié au préalable (supabase link --project-ref <ref>)
supabase db push           # ou : supabase migration up
```

Puis reprendre à l'étape 4 de la procédure standard.

> Les scripts `.zscripts/*.sh` sont des wrappers CI hérités (chemins en dur, référence à un `db:push` Prisma qui n'existe plus) — **ne pas les utiliser**, préférer les commandes ci-dessus.

---

## 5. Vérifications post-déploiement

```bash
pm2 status noli            # status = online, pas de boucle de restart
pm2 logs noli --lines 40   # aucun crash au démarrage ; app en écoute sur :8080
curl -I http://localhost:8080   # réponse HTTP attendue
```

Puis un parcours fonctionnel rapide côté navigateur (page d'accueil, comparaison, création de compte / connexion). Pour une release de recette, rejouer les points concernés (voir §7).

---

## 6. Rollback

Le déploiement ne touche que le code : retour au commit précédent puis rebuild.

```bash
cd <chemin_du_projet_noli>
git log --oneline -5           # repérer le commit précédent
git checkout <commit_precedent>
bun install
bun run build
pm2 reload noli
pm2 save
```

> **Attention :** si la release comportait une migration DB **non rétro-compatible**, prévoir la migration de retour correspondante. Les releases « code uniquement » n'ont pas de rollback base.

---

## 7. Dernière release déployée — Recette du 09/09/2026

**Branche `2.0.0` · PR #44 (`635a170`) + PR #45 (`8198eb9`) · code uniquement, aucune migration DB.**

Correctifs livrés :

1. **Date d'effet** — impossible le jour même, au plus tôt **J+1**.
2. **Auto-sélection de la formule** — le filtre « Formules » démarre sur la formule choisie au formulaire.
3. **Détails de règle masqués** — plus de « Méthode » ni de détail de calcul dans les info-bulles.
4. **Légende des couleurs** — le vert est expliqué dans la fenêtre de comparaison.
5. **Individuel accident** — la **matrice tarifaire** est répercutée (fini l'affichage « Inclus » à tort).
6. **Création de compte** — règles de mot de passe affichées + validation alignée (8 car., 1 majuscule, 1 minuscule, 1 chiffre).

Checklist de recette à rejouer après déploiement :

- [ ] #1 « Date d'effet » : le jour même est refusé, J+1 accepté.
- [ ] #2 Étape résultats : la formule choisie est pré-sélectionnée.
- [ ] #3 Info-bulle d'une garantie : plus de « Méthode » ni de détail de calcul.
- [ ] #4 Fenêtre « Comparer » : légende du vert visible en haut du tableau.
- [ ] #5 Offre avec **Individuel Accident** : un montant s'affiche (plus « Inclus »).
- [ ] #6 Création de compte : règles affichées ; création OK avec un mot de passe conforme.

**Point de config à valider avec l'assureur (non bloquant) :** le correctif #5 affiche la **prime fixe** de la formule. Si l'attendu métier pour *Individuel Accident (Conducteur)* de TGGS est une **prime par nombre de places**, l'activer dans la config de la garantie (option « par places » : `usePlaces` + grille). Le moteur gère déjà ce mode — c'est du **paramétrage**, pas du code.

---

## 8. Résumé express (canal ops)

```
Déploiement NOLI (branche 2.0.0). Code uniquement sauf mention de migration.

cd <projet> && git checkout 2.0.0 && git pull --ff-only origin 2.0.0
bun install && bun run build && pm2 reload noli && pm2 save

Vérifs : pm2 status/logs OK, curl :8080, puis parcours fonctionnel.
```
