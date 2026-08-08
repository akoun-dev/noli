# Audit de sécurité — Noli `2.0.0` (Next.js)

**Date :** 2026-08-08
**Périmètre :** branche `2.0.0` (application Next.js réellement en production).
**Méthode :** vérification outillée (TypeScript, tests, build, lint) + revue manuelle
du modèle d'authentification et des ~60 routes API, avec focus sur l'autorisation
(rôles) et les accès inter-comptes (IDOR).

> **Note de contexte.** Un premier lot de correctifs avait été produit sur la
> branche `main` (une application **Vite**, codebase distinct). Ce travail ne
> s'applique **pas** à `2.0.0` et n'est pas inclus ici. Le présent audit porte
> uniquement sur le produit réel (`2.0.0`).

---

## 1. Bilan de santé outillé

| Contrôle | Commande | Résultat |
|---|---|---|
| TypeScript strict | `tsc --noEmit` (`ignoreBuildErrors: false`) | ✅ **0 erreur** |
| Tests | `vitest run` | ✅ **98/98** |
| Build production | `next build` | ✅ **réussi** |
| Lint | `eslint .` | ✅ **0 erreur** (après correctif, voir §4) |

---

## 2. Modèle d'authentification — **solide**

- **Session = JWT Supabase** validé côté serveur via `supabase.auth.getUser()`
  (`src/lib/auth-guard.ts`) — la méthode sûre (le JWT est vérifié, pas simplement
  lu depuis le cookie).
- Helpers centralisés : `requireAuth(roles)`, `requireAdmin`, `requireRole`.
- **CSRF** : middleware global (`src/middleware.ts`) qui vérifie l'en-tête `Origin`
  sur les méthodes mutantes (`POST/PUT/PATCH/DELETE`) des routes `/api/*`, en
  complément des cookies `SameSite=Lax`.
- **Identité assureur tirée de la session**, jamais du client (`getInsurerAccount`).

## 3. Autorisation par route — **conforme**

- **Routes `admin/*`** (27 fichiers) : toutes protégées par
  `requireAuth(["ADMIN"])` **avec** court-circuit `if (guard) return guard;`.
  → pas d'élévation de privilège possible depuis un compte `USER`/`INSURER`.
- **Routes `insurer/*/[id]`** (offres, devis) : vérifient systématiquement
  l'appartenance (`offer.insurerId === insurerId`, `quote.offer.insurerId ===
  account.insurerId`) avant lecture/écriture → **pas d'IDOR** entre assureurs.
- **Routes `user/*` et `notifications/[id]`** : contrôlent la propriété
  (`resource.userId === session.id`) → un utilisateur ne peut lire/modifier que
  ses propres devis/notifications.
- **`insurer/me`** : réservé au rôle `INSURER`, périmètre limité au compte lié.
- **`seed`** : réservé `ADMIN`, **idempotent** (upserts, garde sur données
  existantes) — non destructif.
- **Routes publiques** (`offers`, `coverage-categories`, `stats`, `auth/*`,
  `contact/*`) : exposition volontaire ; `stats` ne renvoie que des **compteurs
  agrégés** (nb assureurs/offres/utilisateurs), pas de données nominatives.

**Conclusion :** l'application est **déjà bien durcie**. Aucune faille d'accès
majeure identifiée. Le commit « durcissement sécurité » antérieur (marqueurs
`H-04`, `M-01`, …) avait déjà traité l'essentiel.

---

## 4. Correctif appliqué

- **Lint (`ecosystem.config.js`)** : ce fichier de configuration **PM2** doit être
  en CommonJS (`require`/`module.exports`) — PM2 le charge ainsi. Les 2 erreurs
  `no-require-imports` étaient donc des faux positifs sur un fichier de
  déploiement. Il a été ajouté aux `ignores` d'ESLint (comme les autres fichiers
  de config déjà exclus). `npm run lint` passe désormais au vert.

---

## 5. Observations mineures (non bloquantes, pour décision produit)

1. **`insurer/me` (GET)** — code mort : `const isAdmin = role === "ADMIN"` est
   calculé alors que la ligne suivante bloque tout rôle ≠ `INSURER`. La branche
   `!isAdmin` est donc inatteignable. *Décider :* soit un `ADMIN` doit pouvoir
   consulter le profil d'un assureur via `?userId=` (alors autoriser `ADMIN` dans
   le garde), soit retirer ce code mort.
2. **`admin/callbacks` (GET)** — filtre les rappels par `user_id = profil admin
   courant`. Pour un panneau d'administration censé voir *tous* les rappels, c'est
   probablement un filtre trop restrictif (fonctionnel, pas sécurité).
3. **`seed` en production** — bien qu'`ADMIN`-only et idempotent, un endpoint de
   seed exposé en prod reste un point d'attention. *Optionnel :* le doubler d'un
   garde `NODE_ENV !== "production"`.

Aucune de ces observations n'est une vulnérabilité exploitable.

---

## 6. Verdict

`2.0.0` est un codebase **sain et bien sécurisé** : types stricts, tests verts,
build OK, modèle d'auth centralisé et correctement appliqué, protections IDOR et
CSRF en place. Les seuls éléments restants sont des **nettoyages mineurs** relevant
de décisions produit, pas des correctifs de sécurité urgents.
