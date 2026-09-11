# NOLI — Plan de déploiement

| | |
|---|---|
| **Produit** | NOLI — comparateur d'assurances (Côte d'Ivoire) |
| **Version** | `2.0.0` |
| **Objet** | Plan de déploiement en recette puis production |
| **Date** | 11/09/2026 |

> Ce document est le **plan** (environnements, prérequis, phases, rôles, go/no-go). La **procédure technique détaillée** (commandes) est dans `DEPLOIEMENT.md`, référencée en §5.

---

## 1. Objectif & portée

Déployer la version `2.0.0` de NOLI sur l'environnement de **recette** pour validation, puis en **production** après décision de go-live. Le déploiement est **manuel** (pas de CI/CD de déploiement) et **sans interruption** (rechargement PM2).

## 2. Environnements

| Environnement | Rôle | Base de données | Accès |
|---|---|---|---|
| **Recette** | Validation métier & technique avant prod | Projet Supabase de recette | Équipe projet |
| **Production** | Service en ligne | Projet Supabase de prod | Public |

**Architecture cible (identique recette/prod) :** application Next.js *standalone* servie par **PM2** (mono-instance, port 8080) derrière **Caddy** (reverse proxy HTTPS). Variables d'environnement chargées via `.env` (jamais committé).

## 3. Rôles & responsabilités

| Rôle | Responsable | Périmètre |
|---|---|---|
| Pilote de déploiement | ______________ | Coordination, go/no-go |
| Exploitant (serveur / PM2 / Caddy) | ______________ | Exécution du déploiement |
| Administrateur base (Supabase) | ______________ | Sauvegarde, migrations |
| Recette (métier + technique) | ______________ | Exécution des cahiers de recette |
| Décision métier (tarif, go-live) | ______________ | Validation fonctionnelle |

## 4. Pré-requis (avant tout déploiement)

- [ ] Accès serveur (SSH) et droits PM2 / Caddy.
- [ ] Outils installés : `bun`, `pm2`, `caddy`, CLI `supabase`.
- [ ] Fichier **`.env`** présent, complet et sécurisé sur l'environnement cible.
- [ ] Projet **Supabase actif** et **en plan payant** pour la production (le plan gratuit se met en pause après inactivité).
- [ ] Domaine / **HTTPS** opérationnels (Caddy).
- [ ] Version `2.0.0` à jour et **CI au vert** (typage, lint, tests, build).

## 5. Procédure de déploiement (phases)

> Détail des commandes : **`DEPLOIEMENT.md`**.

| Phase | Action | Vérification |
|---|---|---|
| **P0. Préparation** | Annoncer la fenêtre ; vérifier les prérequis (§4) | Prérequis cochés |
| **P1. Sauvegarde** | Sauvegarder la base **avant** intervention (hors dépôt) | Fichier de sauvegarde produit |
| **P2. Récupération du code** | `git fetch/checkout/pull` de `2.0.0` | Dernier commit attendu présent |
| **P3. Migrations** | Appliquer les migrations (`supabase db push`) | Migrations appliquées sans erreur |
| **P4. Build** | `bun install` puis `bun run build` (standalone) | Build sans erreur |
| **P5. Bascule** | `pm2 reload noli` puis `pm2 save` | Service `online`, écoute :8080 |
| **P6. Vérification** | Contrôles post-déploiement (§6) | Parcours critiques OK |
| **P7. Recette** | Dérouler les cahiers de recette (métier + technique) | Critères de sortie atteints |
| **P8. Go/No-Go** | Décision de maintien ou rollback | Décision tracée |

## 6. Vérifications post-déploiement

- [ ] `pm2 status noli` : `online`, sans boucle de redémarrage.
- [ ] `pm2 logs noli` : aucune erreur au démarrage ; écoute sur :8080.
- [ ] Application accessible via l'URL (HTTPS, Caddy).
- [ ] Parcours critiques : comparaison → devis, connexion des 3 rôles, inscription assureur → validation admin, création de compte utilisateur.

## 7. Critères Go / No-Go

**Go si :** tous les cas 🔴 des cahiers de recette sont ✅, aucune anomalie bloquante ouverte, service stable, sauvegarde disponible.
**No-Go si :** au moins une anomalie 🔴 ouverte, ou instabilité du service, ou migration en échec → **rollback** (§8) et réunion de décision.

## 8. Rollback

Le déploiement ne touche que le code (sauf migration) :
- [ ] Revenir au commit précédent, `bun install`, `bun run build`, `pm2 reload noli`, `pm2 save`.
- [ ] Si une migration **non rétro-compatible** a été appliquée : restaurer la sauvegarde (P1) et/ou exécuter la migration inverse.
- [ ] Tracer l'incident et les causes.

## 9. Planning indicatif

| Jalon | Échéance | Dépend de |
|---|---|---|
| Fixer la date de go-live | Réunion de clôture | — |
| Passage Supabase en plan payant | Avant go-live | Décision |
| Sauvegardes + test de restauration | Avant go-live | Accès base |
| **Déploiement recette** | J | Prérequis §4 |
| Recette (cahiers) | J → J+1 | Déploiement recette |
| Confirmation tarif « Individuel Accident » | Avant J+3 | Assureur |
| **Déploiement production** | J+n (après Go) | Recette validée |
| Supervision (logs + alertes) | J+n+5 | Production |

## 10. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Migrations non appliquées | Comportement incohérent (ex. inscription assureur) | Étape P3 obligatoire + vérification |
| Base Supabase en pause (plan gratuit) | Coupure de service | Plan payant avant go-live |
| Perte de données | Irréversible | Sauvegarde P1 + restauration testée |
| Déploiement en échec | Indisponibilité | Rollback §8 + fenêtre planifiée |
| Mono-instance (rate-limit mémoire) | Limite de montée en charge | Store partagé si passage multi-instance |

---

### Documents liés
`DEPLOIEMENT.md` (procédure détaillée) · `RAPPORT_CLOTURE.md` · `ARCHITECTURE_FONCTIONNELLE.md` · `SAUVEGARDE_DR.md` · `CAHIER_RECETTE_METIER.md` · `CAHIER_RECETTE_TECHNIQUE.md`
