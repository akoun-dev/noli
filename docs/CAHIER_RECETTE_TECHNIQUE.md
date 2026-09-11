# NOLI — Cahier de recette technique

| | |
|---|---|
| **Produit** | NOLI — comparateur d'assurances (Côte d'Ivoire) |
| **Version** | `2.0.0` |
| **Type** | Recette technique (sécurité, API, données, tarification, exploitation) |
| **Environnement de test** | ☐ Recette ☐ Production — URL : ______________________ |
| **Testeur(s)** | ______________________ |
| **Date** | ____ / ____ / 2026 |

**Légende statut :** ✅ OK · ❌ KO · ⏭️ Non testé · ⚠️ OK avec réserve
**Priorité :** 🔴 Bloquant · 🟠 Majeur · 🟢 Mineur

> Rappel d'architecture : accès data via client Supabase `service_role` (RLS contournée) → **l'autorisation est applicative**. Identité toujours issue de la session (anti-IDOR). Prod : Next.js standalone + PM2 (mono-instance, :8080) derrière Caddy.

---

## 1. Authentification & session

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-AUTH-01 | Se connecter : vérifier le cookie de session | Cookie **httpOnly** (non lisible en JS), session validée serveur | 🔴 | | |
| TEC-AUTH-02 | Appeler une route protégée sans session | Réponse **401** (pas de fuite de données) | 🔴 | | |
| TEC-AUTH-03 | Mot de passe oublié → réinitialisation | Lien reçu, réinitialisation effective | 🟠 | | |
| TEC-AUTH-04 | Messages d'erreur login/inscription | **Génériques** (pas d'énumération de comptes) | 🟠 | | |
| TEC-AUTH-05 | Accès à un écran protégé après expiration/déconnexion | Redirection propre (pas d'écran vide en 401) | 🟠 | | |
| TEC-AUTH-06 | Compte **désactivé** tentant de se connecter | Accès refusé (profil `is_active=false` → pas de profil de session) | 🔴 | | |

## 2. RBAC & cloisonnement (anti-IDOR)

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-RBAC-01 | USER appelle une route `/api/admin/*` | **403** (rôle insuffisant) | 🔴 | | |
| TEC-RBAC-02 | USER appelle une route `/api/insurer/*` | **403** | 🔴 | | |
| TEC-RBAC-03 | Assureur A tente de lire les devis de l'assureur B (id dans l'URL/payload) | Refusé : filtrage sur l'`insurer_id` **de la session**, pas du paramètre | 🔴 | | |
| TEC-RBAC-04 | USER lit le devis d'un autre USER (id modifié) | Refusé (ownership `userId === session`) | 🔴 | | |
| TEC-RBAC-05 | Route admin de mise à jour d'un profil : tenter d'élever un compte en ADMIN via inscription | Impossible (le trigger n'accepte que USER/INSURER) | 🔴 | | |

## 3. Sécurité applicative

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-SEC-01 | Requête mutante `/api/*` avec `Origin` étranger | Rejetée (protection CSRF middleware) | 🔴 | | |
| TEC-SEC-02 | Champ de recherche avec caractères spéciaux PostgREST (`,`, `(`, `*`, `:`) | Aucune injection de filtre ; recherche sûre (`sanitizePostgrestSearch`) | 🔴 | | |
| TEC-SEC-03 | Saisie contenant du HTML/script dans un champ affiché | Échappé, pas d'exécution (XSS) | 🟠 | | |
| TEC-SEC-04 | Inspecter le bundle client / réseau | La clé `service_role` **n'apparaît jamais** côté client | 🔴 | | |
| TEC-SEC-05 | Politique de mot de passe (8+, maj, min, chiffre) appliquée serveur | Inscription refusée si non conforme, même en contournant le front | 🔴 | | |
| TEC-SEC-06 | Rejet d'un assureur en attente (action destructive) | Confirmation demandée avant suppression | 🟠 | | |

## 4. API & contrats d'interface

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-API-01 | POST avec corps invalide (schéma Zod) | **400** + message d'erreur exploitable | 🟠 | | |
| TEC-API-02 | Formats de réponse | `{ data }` en succès, `{ error }` + code HTTP en échec | 🟠 | | |
| TEC-API-03 | Endpoint de santé (`/api/health`) | Réponse OK | 🟢 | | |
| TEC-API-04 | Montant FCFA envoyé en texte (« 18 000 000 ») | Parsé correctement (pas de NaN) | 🟠 | | |
| TEC-API-05 | Paramètres numériques invalides (négatif, NaN, Infinity) | Rejetés (`parseNumberField`) | 🟠 | | |

## 5. Intégrité des données

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-DATA-01 | Vérifier le mapping snake_case ↔ camelCase (profil, offre, devis) | Champs correctement convertis (`mapRow`/`mapRows`) | 🟠 | | |
| TEC-DATA-02 | Créer une offre avec bornes min > max (prix/puissance/valeur) | Refusé (contrôle `min ≤ max`) | 🟠 | | |
| TEC-DATA-03 | Rattachement des devis anonymes après création de compte | Devis du même email rattachés au nouveau compte | 🟠 | | |
| TEC-DATA-04 | Dates : entrées valides/invalides | Pas d'affichage « Invalid Date » sur données valides | 🟢 | | |
| TEC-DATA-05 | Suppression d'un compte assureur (rejet) | Cascade propre (profil, liaison) ; pas de fiche compagnie orpheline active | 🟠 | | |

## 6. Moteur tarifaire

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-TAR-01 | Garantie **Gratuit** | Prime = 0, affichée « Inclus » | 🟠 | | |
| TEC-TAR-02 | Garantie **Montant fixe** | Prime = montant configuré | 🟠 | | |
| TEC-TAR-03 | Garantie **Basée sur variable** (VN/VA/CV) | Prime = variable × taux (avec seuil conditionnel si défini) | 🟠 | | |
| TEC-TAR-04 | Garantie **Matrice** (individuel accident, formule) | Prime issue de la matrice bien **affichée** (pas 0/« Inclus ») | 🔴 | | |
| TEC-TAR-05 | Formule sans libellé (créée via l'UI, champ prime seul) | Calcul robuste (pas d'erreur), prime affichée | 🟠 | | |
| TEC-TAR-06 | Cohérence somme des garanties ↔ prix affiché | À vérifier sur données réelles (point métier ouvert) | 🟠 | | |

## 7. Déploiement & exploitation

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-OPS-01 | Build de production (`bun run build`) | Build standalone sans erreur | 🔴 | | |
| TEC-OPS-02 | Application des migrations (`supabase db push`) | Toutes les migrations appliquées, base cohérente | 🔴 | | |
| TEC-OPS-03 | Démarrage via PM2 (`pm2 reload noli`) | Service `online`, écoute sur :8080 | 🔴 | | |
| TEC-OPS-04 | Accès via Caddy (HTTPS) | Application servie, en-têtes `X-Forwarded-*` présents | 🟠 | | |
| TEC-OPS-05 | Variables d'environnement chargées | `.env` chargé par PM2 ; aucun secret committé | 🔴 | | |
| TEC-OPS-06 | Rollback (checkout commit précédent + rebuild + reload) | Retour à l'état antérieur sans perte de service | 🟠 | | |

## 8. Sauvegarde & restauration

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-BCK-01 | Réaliser une sauvegarde de la base | Sauvegarde produite **hors dépôt** | 🔴 | | |
| TEC-BCK-02 | Restaurer la sauvegarde sur un environnement de test | Restauration complète et cohérente | 🔴 | | |
| TEC-BCK-03 | Vérifier qu'aucun dump n'est committé | `backups/`/`*.dump` ignorés par Git | 🟠 | | |

## 9. Robustesse & montée en charge

| ID | Scénario (étapes) | Résultat attendu | Prio | Obtenu | Statut |
|---|---|---|---|---|---|
| TEC-ROB-01 | Dépasser le seuil d'inscriptions (rate-limit) | Blocage temporaire (429) avec `Retry-After` | 🟠 | | |
| TEC-ROB-02 | Backend lent / injoignable à l'inscription | Message clair (timeout), pas d'attente muette | 🟠 | | |
| TEC-ROB-03 | Liste de devis assureur au-delà de 100 | Pagination à vérifier selon la volumétrie réelle | 🟢 | | |
| TEC-ROB-04 | Rappel : rate-limiting en mémoire = **mono-instance** | Ne pas passer en multi-instance sans store partagé | 🟠 | | |

---

## Synthèse

| Priorité | Nombre de cas | ✅ OK | ❌ KO | ⏭️ Non testé |
|---|---|---|---|---|
| 🔴 Bloquant | | | | |
| 🟠 Majeur | | | | |
| 🟢 Mineur | | | | |
| **Total** | | | | |

**Critère de sortie :** 100 % des cas 🔴 en ✅, aucun ❌ 🔴 ouvert.

**Anomalies relevées :**

| # | Cas (ID) | Description | Gravité | Suite donnée |
|---|---|---|---|---|
| | | | | |
