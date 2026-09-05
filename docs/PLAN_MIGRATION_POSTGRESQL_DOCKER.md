# Plan de migration vers PostgreSQL auto-heberge avec Docker

## 1. Objet et perimetre

Ce document decrit la migration de Noli depuis Supabase vers une instance PostgreSQL geree localement par Docker pour le developpement.

Le perimetre couvre :

- le remplacement de Supabase PostgreSQL et de PostgREST par PostgreSQL natif ;
- le remplacement de Supabase Auth par une authentification geree par l'application ;
- la migration du schema, des donnees et des comptes utilisateurs ;
- le remplacement de l'Edge Function `send-notification` ;
- la configuration Docker, les variables d'environnement et les sauvegardes ;
- les tests, la bascule, le rollback et les risques.

Le plan vise d'abord un environnement de developpement reproductible. Une exposition Internet ou une mise en production necessite des mesures supplementaires : TLS, gestion de secrets, supervision, haute disponibilite et politique de sauvegarde hors site.

## 2. Etat actuel constate

### 2.1 Dependances Supabase

Le code utilise actuellement Supabase a plusieurs niveaux :

- `src/lib/db.ts` construit un client avec `SUPABASE_SERVICE_ROLE_KEY` et utilise l'API PostgREST ;
- `src/lib/auth-guard.ts` utilise `@supabase/ssr`, les cookies et `supabase.auth.getUser()` ;
- `src/lib/auth-actions.ts` appelle `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, `setSession`, `updateUser` et `db.auth.admin.updateUserById` ;
- les migrations utilisent `auth.users`, `auth.uid()` et `public.is_admin()` ;
- la RLS est definie dans les migrations Supabase ;
- `supabase/functions/send-notification/index.ts` implemente l'envoi de notifications avec un secret partage ;
- `supabase/seed.sql` insere directement des utilisateurs dans `auth.users` ;
- `supabase/config.toml` configure les migrations, le seed et l'Edge Function.

### 2.2 Schema metier existant

Les migrations definissent notamment les tables suivantes :

- `profiles` ;
- `insurers` et `insurer_accounts` ;
- `insurance_categories`, `coverage_categories`, `coverages`, `coverage_tariff_rules` ;
- `insurance_offers`, `insurance_packages`, `package_coverages` ;
- `quotes`, `quote_coverages`, `contracts`, `claims` ;
- `reviews`, `notifications`, `audit_logs` ;
- `system_settings`, `backups` ;
- `roles`, `permissions`, `role_permissions`, `profile_roles`.

La table `profiles.id` reference actuellement `auth.users(id)`. Cette reference devra etre remplacee par une table d'utilisateurs locale.

### 2.3 Contraintes de l'existant

- Les requetes applicatives passent par un client `service_role`, donc contournent la RLS Supabase.
- Les relations et alias sont construits avec la syntaxe PostgREST, par exemple `select("firstName:first_name")`.
- Les identifiants Supabase sont des UUID.
- Les mots de passe ne sont pas dans `profiles` ; ils sont geres par Supabase Auth.
- Le code de sauvegarde admin produit un export JSON logique, qui ne remplace pas un dump PostgreSQL.
- `ops/backup-db.sh` utilise encore le nom `SUPABASE_DB_URL` et devra etre generalise.

## 3. Architecture cible

### 3.1 Vue d'ensemble

La cible de developpement est la suivante :

```text
Navigateur
    |
    v
Next.js / API routes
    |
    +--> PostgreSQL local dans Docker
    |       - schema public
    |       - roles PostgreSQL
    |       - extensions necessaires
    |
    +--> Service email SMTP/Resend conserve
    +--> Notifications gerees par une fonction serveur Next.js
```

PostgreSQL ne doit pas etre expose publiquement par defaut. Le conteneur est accessible :

- par le reseau Docker pour l'application conteneurisee ;
- par `localhost` uniquement pour les outils de developpement, si necessaire.

### 3.2 Choix d'authentification cible

La cible recommandee est une authentification applicative locale, basee sur :

- une table `users` locale ;
- un hash de mot de passe avec Argon2id recommande, ou bcrypt pendant une phase de compatibilite ;
- des cookies de session `httpOnly`, `secure` en production et `SameSite=Lax` ou `Strict` selon le parcours ;
- des sessions persistantes dans une table `sessions` ;
- des tokens de recuperation de mot de passe a usage unique et a expiration courte ;
- les roles applicatifs `USER`, `INSURER`, `ADMIN` conserves dans `users.role` ou `profiles.role` selon la decision de schema.

Cette option evite de reproduire le fonctionnement interne de Supabase Auth et supprime les dependances `@supabase/ssr` et `@supabase/supabase-js`.

Une bibliotheque d'authentification peut etre introduite, mais elle devra etre choisie explicitement. Le depot actuel ne contient pas de remplacement pret a l'emploi. Une implementation maison devra etre limitee aux besoins de Noli et couvrir les tests de securite avant toute bascule.

### 3.3 Acces aux donnees

Deux niveaux sont recommandes :

- un module serveur unique `src/lib/db.ts` utilisant `pg` et un pool de connexions ;
- des requetes SQL parametrees ou un query builder/ORM choisi explicitement.

La solution minimale est le driver `pg` avec des fonctions d'acces aux donnees centralisees. Elle limite le changement de dependances mais necessite de remplacer toutes les chaines PostgREST par du SQL parametre.

Un ORM comme Drizzle ou Kysely peut ameliorer le typage, mais ajouterait une migration d'architecture. Il ne doit pas etre introduit simultanement sans necessite.

### 3.4 Autorisation

Deux approches sont possibles :

1. **Autorisation applicative, recommandee pour la premiere etape** : les routes gardent `requireAuth`, `requireRole`, les scopes utilisateur/assureur et les controles d'ownership ; PostgreSQL recoit les donnees via un compte applicatif prive.
2. **RLS PostgreSQL native** : des roles SQL et `SET LOCAL`/variables de session reproduisent le contexte utilisateur. Cette approche est plus complexe avec Next.js et ne doit etre adoptee qu'apres une conception precise des connexions et de la reutilisation du pool.

La premiere etape doit conserver l'autorisation applicative existante et ajouter des tests d'ownership. Ne pas supposer que la RLS Supabase sera automatiquement preservee apres le changement de driver.

## 4. Configuration Docker

### 4.1 Fichier compose recommande

Ajouter un fichier `docker-compose.dev.yml` ou `compose.dev.yml` a la racine :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: noli-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-noli}
      POSTGRES_USER: ${POSTGRES_USER:-noli_app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
    ports:
      - "127.0.0.1:${POSTGRES_PORT:-5433}:5432"
    volumes:
      - noli-postgres-data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  noli-postgres-data:
```

Le port `5433` cote hote evite une collision avec un PostgreSQL local eventuel. Le port peut etre change par `POSTGRES_PORT`.

### 4.2 Initialisation

Ne pas placer les migrations metier dans `docker/postgres/init` si elles doivent etre rejouables ou versionnees par l'application. Le repertoire d'initialisation doit rester limite aux elements necessaires au premier demarrage, par exemple :

- creation eventuelle d'extensions ;
- configuration minimale du serveur ;
- creation de roles techniques uniquement si elle n'est pas geree par le script de migration.

Les migrations metier doivent etre appliquees par un outil versionne et deterministe. La solution la plus simple pour la premiere migration est de rejouer les fichiers SQL dans l'ordre timestamp, apres adaptation des references Supabase.

### 4.3 Commandes de base

```bash
docker compose -f docker-compose.dev.yml up -d postgres
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml exec postgres pg_isready -U noli_app -d noli
docker compose -f docker-compose.dev.yml down
```

Ne pas utiliser `docker compose down -v` sauf pour detruire volontairement les donnees de developpement.

## 5. Variables d'environnement

### 5.1 Variables cibles

Ajouter les variables suivantes dans `.env.example` et dans un fichier local non versionne :

```dotenv
# PostgreSQL local
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5433
POSTGRES_DB=noli
POSTGRES_USER=noli_app
POSTGRES_PASSWORD=change-me

# URL de connexion serveur uniquement
DATABASE_URL=postgresql://noli_app:change-me@127.0.0.1:5433/noli

# Pool PostgreSQL
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT_MS=10000
DATABASE_CONNECTION_TIMEOUT_MS=5000

# Authentification applicative
AUTH_SESSION_SECRET=change-me-with-at-least-32-random-bytes
AUTH_SESSION_TTL_DAYS=7
AUTH_PASSWORD_RESET_TTL_MINUTES=30

# Site et emails
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
RESEND_API_KEY=
EMAIL_FROM=

# Rate limiting
RATE_LIMIT_STORE=memory
```

### 5.2 Variables a supprimer ou renommer

Apres la bascule fonctionnelle, supprimer des chemins applicatifs :

- `NEXT_PUBLIC_SUPABASE_URL` ;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- `SUPABASE_SERVICE_ROLE_KEY` ;
- `NOLI_FUNCTION_SECRET` si l'Edge Function est remplacee ;
- `SUPABASE_DB_URL` dans le script de backup, a remplacer par `DATABASE_URL` ou `BACKUP_DATABASE_URL`.

Ne pas exposer `DATABASE_URL`, `POSTGRES_PASSWORD` ou `AUTH_SESSION_SECRET` avec le prefixe `NEXT_PUBLIC_`.

## 6. Migration du schema

### 6.1 Principe

Le schema metier est majoritairement du PostgreSQL standard et peut etre conserve. Les elements suivants sont toutefois specifiques a Supabase et doivent etre remplaces :

- schema `auth` et table `auth.users` ;
- fonctions `auth.uid()` ;
- appels `public.is_admin()` qui dependent du contexte Supabase ;
- triggers lies a `auth.users` ;
- policies RLS qui ciblent `auth.uid()` ;
- droits et objets geres implicitement par Supabase ;
- syntaxe PostgREST cote application.

### 6.2 Nouvelle table utilisateurs

Creer une table locale, par exemple :

```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Puis faire evoluer `profiles` :

```sql
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references public.users(id) on delete cascade;
```

Deux variantes sont possibles :

- conserver `profiles.id = users.id`, ce qui minimise les changements applicatifs ;
- deplacer les colonnes identite de `profiles` vers `users`, ce qui est plus propre mais plus invasif.

La premiere variante est recommandee pour la migration initiale.

Ajouter ensuite :

```sql
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_expires_at_idx on public.sessions(expires_at);
```

Pour la recuperation de mot de passe :

```sql
create table public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
```

Les tokens bruts ne doivent jamais etre stockes en base : seul leur hash doit l'etre.

### 6.3 Extensions

Verifier les extensions effectivement utilisees par les migrations et le seed. Le code fourni utilise explicitement `pgcrypto` dans `supabase/seed.sql` pour le hash bcrypt et la generation de sel.

Initialiser au minimum :

```sql
create extension if not exists pgcrypto;
```

`pgcrypto` suffit pour `gen_random_uuid()` et les fonctions cryptographiques SQL existantes. Si la cible utilise Argon2id, le hash sera gere par l'application et non par cette extension.

Ne pas recopier automatiquement toutes les extensions disponibles sur Supabase. Produire d'abord l'inventaire avec :

```sql
select extname, extversion from pg_extension order by extname;
```

Puis valider chaque extension sur l'image Docker cible.

### 6.4 Fonctions et triggers

Conserver et adapter :

- `set_updated_at()` ;
- les triggers `*_set_updated_at` ;
- les contraintes de domaine et de montants ;
- les triggers de protection des champs sensibles.

Remplacer ou supprimer :

- `handle_new_user()` sur `auth.users` ;
- `on_auth_user_created` ;
- les references directes a `auth.uid()`.

La creation du profil devra etre faite dans la meme transaction applicative que la creation de l'utilisateur, ou par un trigger local sur `public.users` si ce choix est retenu.

### 6.5 RLS

La RLS actuelle ne peut pas etre recopiee telle quelle, car `auth.uid()` n'existe pas dans PostgreSQL natif.

Pour la premiere version locale :

- conserver les contraintes SQL d'integrite ;
- desactiver les policies Supabase devenues inapplicables ou les laisser uniquement apres adaptation ;
- faire appliquer les scopes dans les routes et dans les modules d'acces aux donnees ;
- ajouter des tests d'autorisation pour chaque domaine sensible.

Si une RLS native est souhaitee plus tard, definir une convention de contexte par connexion, par exemple `set_config('app.user_id', ..., true)`, puis remplacer `auth.uid()` par une fonction locale qui lit ce contexte. Cette approche doit etre concue avec soin a cause du pool de connexions et des transactions.

## 7. Export et import des donnees

### 7.1 Preparer l'export source

Avant toute modification :

1. geler la version applicative source ;
2. obtenir une chaine de connexion PostgreSQL Supabase autorisee a effectuer un dump ;
3. verifier l'espace disque local ;
4. calculer l'empreinte du dump ;
5. consigner la date, la version des migrations et la source du dump ;
6. effectuer au moins deux restaurations de test sur des bases vierges.

Pour les tables metier accessibles :

```bash
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --dbname="$SOURCE_DATABASE_URL" \
  --file="noli-source-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Le script existant `ops/backup-db.sh` peut servir de base, mais doit renommer `SUPABASE_DB_URL` en `SOURCE_DATABASE_URL` ou accepter un parametre generique.

### 7.2 Export du schema

Produire deux artefacts distincts :

- un dump complet de reference, conserve pour rollback et audit ;
- un dump de donnees ou un export adapte a la nouvelle structure.

Inspecter le contenu avant import :

```bash
pg_restore --list noli-source.dump > noli-source.contents.txt
```

Identifier notamment :

- objets du schema `auth` ;
- roles PostgreSQL Supabase ;
- extensions proprietaires ou non disponibles ;
- policies RLS ;
- fonctions SQL ;
- sequences et contraintes ;
- donnees de `profiles` et relations dependantes.

### 7.3 Donnees `auth.users`

La migration des utilisateurs est le point le plus sensible.

Trois scenarios existent :

#### Scenario A : hash de mot de passe reutilisable

Si les lignes `auth.users` et les hashes bcrypt peuvent etre exportes legalement et techniquement, copier les valeurs compatibles dans `public.users.password_hash`.

Avant de retenir cette option, verifier :

- le format exact du hash ;
- sa compatibilite avec la bibliotheque Node choisie ;
- les statuts de confirmation email ;
- les utilisateurs sans mot de passe local ;
- les comptes utilisant un fournisseur externe ;
- les tokens et sessions existants, qui ne doivent pas etre reutilises.

#### Scenario B : migration des comptes sans migration des mots de passe

Importer les utilisateurs avec `password_hash = null` et imposer une procedure de reinitialisation au prochain login.

Cette option est la plus sure si l'acces a `auth.users` ou la compatibilite des hashes ne peut pas etre garantie.

#### Scenario C : double lecture temporaire

Pendant une courte periode, tenter l'authentification locale puis, pour les comptes non migres, verifier encore le fournisseur source et migrer le hash apres succes.

Cette option ne doit etre utilisee que si l'acces source reste disponible et si le flux est strictement borne dans le temps. Elle retarde la suppression de Supabase et augmente la complexite.

### 7.4 Ordre d'import recommande

Apres adaptation du schema :

1. extensions et fonctions ;
2. `users` ;
3. `profiles` ;
4. `insurers` ;
5. `insurer_accounts` ;
6. categories ;
7. garanties ;
8. regles tarifaires ;
9. offres ;
10. packages et associations ;
11. devis ;
12. lignes de devis ;
13. contrats ;
14. sinistres ;
15. avis ;
16. notifications ;
17. roles, permissions et associations ;
18. parametres, audit et metadonnees de sauvegarde.

Desactiver temporairement les contraintes uniquement si un cycle de dependances l'exige. Les reactiver et executer une verification d'integrite immediatement apres.

### 7.5 Verifications post-import

Comparer entre source et cible :

- nombre de lignes par table ;
- nombre de profils actifs/inactifs ;
- nombre d'assureurs et de comptes lies ;
- nombre d'offres actives ;
- nombre de devis par statut ;
- nombre de contrats et sinistres ;
- bornes et checks de montants ;
- relations orphelines ;
- valeurs JSON invalides dans `features`, `vehicle_data`, `personal_data`, `coverage_requirements`, `metadata` et `conditions`.

Executer des checks de referential integrity et des requetes d'echantillonnage sur les donnees sensibles. Les totaux seuls ne suffisent pas.

## 8. Adaptation de l'application

### 8.1 Remplacer l'acces Supabase

Modifier `src/lib/db.ts` pour :

- utiliser `Pool` depuis `pg` ;
- lire `DATABASE_URL` ;
- configurer le nombre maximal de connexions et les timeouts ;
- exposer des fonctions `query`/transaction ;
- journaliser les erreurs sans exposer les credentials ;
- fermer proprement le pool dans les scripts et tests si necessaire.

Supprimer les types `SupabaseClient` et le `Proxy` de creation Supabase.

### 8.2 Remplacer les requetes PostgREST

Les appels tels que :

```ts
db.from("quotes").select("*").eq("user_id", userId)
```

devront devenir des requetes SQL parametrees :

```ts
const result = await db.query(
  `select * from quotes where user_id = $1 order by created_at desc`,
  [userId],
);
```

Interdictions :

- aucune interpolation directe de valeurs utilisateur dans SQL ;
- aucune construction de `ORDER BY` ou de nom de table sans liste blanche ;
- aucune reutilisation d'un client de transaction hors de sa transaction ;
- aucun acces database depuis un composant client.

### 8.3 Remplacer `mapRow`/`mapRows`

Avec du SQL natif, choisir une convention :

- conserver les colonnes SQL en `snake_case` et mapper explicitement vers les DTO camelCase ;
- utiliser des alias SQL explicites ;
- eviter un mapping recursif generique qui pourrait transformer des cles JSON ou des donnees externes de facon inattendue.

Le mapping doit etre teste sur les relations imbriquees utilisees par les composants.

### 8.4 Remplacer l'authentification

Refactorer :

- `getSupabaseServerClient()` ;
- `getSessionProfile()` ;
- `registerAction()` ;
- `loginAction()` ;
- `logoutAction()` ;
- `forgotAction()` ;
- `resetPasswordAction()` ;
- `meAction()`.

Le nouveau flux doit :

1. valider l'entree ;
2. charger ou creer `users` ;
3. verifier le hash ;
4. verifier `profiles.is_active` ;
5. creer une session aleatoire ;
6. stocker uniquement le hash du token de session ;
7. poser un cookie `httpOnly` ;
8. supprimer ou renouveler la session selon l'action ;
9. invalider les sessions lors d'une reinitialisation de mot de passe si la politique le requiert.

### 8.5 Remplacer `supabase/functions/send-notification`

La fonction peut etre remplacee par :

- une fonction interne `createNotification()` utilisant la base locale ;
- une route serveur interne non exposee au navigateur ;
- une file de taches si l'envoi devient asynchrone.

Le secret `NOLI_FUNCTION_SECRET` n'est pas necessaire si l'appel reste dans le processus serveur et n'est jamais expose comme endpoint public.

### 8.6 Migrations et scripts

Choisir un seul outil de migration SQL. Options acceptables :

- un dossier `db/migrations` applique par un script Node ;
- `node-pg-migrate` ;
- `dbmate` ;
- Drizzle Kit si Drizzle est adopte.

Ne pas continuer a dependre de `supabase db push` apres la bascule.

## 9. Gestion des utilisateurs et permissions

### 9.1 Roles metier

Conserver les roles :

- `USER` ;
- `INSURER` ;
- `ADMIN`.

Le trigger ou le service d'inscription doit continuer a forcer un nouvel inscrit a `USER`. La demande `INSURER` recue dans le formulaire ne doit pas accorder automatiquement un acces assureur.

### 9.2 Liaison assureur

Conserver le modele :

- un profil utilisateur ;
- une entree `insurer_accounts` ;
- une activation et une liaison effectuees par un admin.

Les routes assureur doivent continuer a deriver `insurerId` depuis le profil de session, jamais depuis un parametre de confiance fourni par le navigateur.

### 9.3 Permissions granulaires

Les tables `roles`, `permissions`, `role_permissions` et `profile_roles` sont conservees pour compatibilite, mais le code actuel utilise principalement le role principal du profil.

Decider explicitement entre :

- conserver ces tables sans les activer dans un premier temps ;
- implementer reellement les permissions granulaires dans `requirePermission()`.

Ne pas presenter les permissions comme effectives tant que les routes ne les verifient pas.

### 9.4 Sessions existantes

Ne pas importer les cookies ou sessions Supabase existants comme sessions locales sans preuve de compatibilite.

Le comportement recommande est :

- invalider toutes les sessions lors de la bascule ;
- forcer une reconnexion ;
- demander une reinitialisation aux utilisateurs dont le hash n'a pas pu etre migre.

## 10. Sauvegardes et restauration

### 10.1 Developpement Docker

Le volume Docker ne constitue pas une sauvegarde. Ajouter un script distinct :

```bash
docker compose -f docker-compose.dev.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --format=custom --no-owner --no-privileges \
  > "backups/noli-dev-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Tester la restauration dans une base temporaire, pas directement dans la base de developpement courante.

### 10.2 Production future

Prevoir au minimum :

- dump quotidien ;
- retention glissante ;
- copie hors machine ;
- chiffrement au repos et en transit ;
- test de restauration periodique ;
- documentation RPO/RTO ;
- supervision de l'echec du job.

Adapter `ops/backup-db.sh` pour utiliser `BACKUP_DATABASE_URL` et ajouter :

- `pg_restore --list` de verification ;
- permissions restrictives sur les fichiers ;
- chiffrement externe ou stockage objet securise ;
- alerte en cas d'echec ;
- verrouillage pour eviter deux dumps concurrents.

### 10.3 Sauvegardes logiques admin

Conserver l'export JSON admin uniquement comme outil fonctionnel ou d'analyse, pas comme strategie de disaster recovery.

Les fichiers contenant `profiles`, `quotes`, `contracts`, `claims`, `notifications` ou `audit_logs` doivent etre proteges et supprimes selon une retention definie.

## 11. Securite

### 11.1 Base de donnees

- Ne pas publier PostgreSQL sur `0.0.0.0` en developpement si ce n'est pas necessaire.
- Utiliser un utilisateur applicatif sans privileges de creation de schema en fonctionnement normal.
- Utiliser un utilisateur de migration distinct.
- Ne jamais mettre `DATABASE_URL` dans une variable `NEXT_PUBLIC_*`.
- Configurer des mots de passe differents par environnement.
- Limiter les droits sur les tables et sequences.
- Utiliser des requetes parametrees.
- Ajouter des index et timeouts apres mesure, pas uniquement par intuition.

### 11.2 Authentification

- Preferer Argon2id.
- A defaut, utiliser bcrypt avec un facteur de travail documente.
- Stocker uniquement des hashes de mots de passe et de tokens.
- Invalider les sessions apres changement de mot de passe.
- Conserver l'anti-enumeration sur login et mot de passe oublie.
- Conserver le rate limiting, en envisageant Redis si plusieurs instances sont lancees.

### 11.3 Application

- Conserver les guards existants.
- Ajouter des tests d'autorisation negatifs pour chaque route sensible.
- Ne jamais importer le module database serveur dans un composant client.
- Verifier les chemins de fichiers de sauvegarde contre le path traversal.
- Continuer a echapper les emails HTML et les sujets.
- Reevaluer le middleware CSRF lors du remplacement des cookies Supabase.

## 12. Tests de validation

### 12.1 Tests infrastructure

- `pg_isready` repond dans le conteneur.
- Le healthcheck Docker devient `healthy`.
- L'application se connecte avec `DATABASE_URL`.
- Une transaction commit fonctionne.
- Une transaction rollback fonctionne.
- Le pool ne fuit pas les connexions.
- Une migration est idempotente ou refusee explicitement si deja appliquee.

### 12.2 Tests schema et donnees

- Les migrations s'executent dans l'ordre sur une base vide.
- Toutes les contraintes de cles et de checks sont presentes.
- Les nombres de lignes source/cible sont rapproches.
- Les valeurs JSON sont parseables.
- Les relations critiques ne possedent pas d'orphelins.
- Les sequences sont synchronisees apres import.
- Les UUID de profils sont conserves.

### 12.3 Tests authentification

- Inscription d'un utilisateur `USER`.
- Tentative d'inscription avec demande `ADMIN` ou `INSURER` : role final `USER`.
- Connexion avec mot de passe migre.
- Parcours de reinitialisation pour un mot de passe non migre.
- Expiration d'une session.
- Deconnexion et invalidation de session.
- Compte desactive refuse.
- Absence d'enumeration des emails.
- Limitation des tentatives.

### 12.4 Tests autorisation

- Un utilisateur ne lit que ses devis, contrats, notifications et sinistres.
- Un assureur ne lit que les ressources de sa compagnie.
- Un assureur ne peut pas changer de compagnie avec un identifiant client.
- Un utilisateur ne peut pas modifier le statut ou le prix d'un devis.
- Un admin peut gerer les ressources attendues.
- Un utilisateur ne peut pas atteindre les routes admin ou assureur.

### 12.5 Tests fonctionnels

- Comparaison d'offres.
- Calcul des quatre methodes tarifaires.
- Enregistrement d'un devis.
- Creation d'un contrat lors de l'approbation d'un devis.
- Declaration et changement de statut d'un sinistre.
- Notifications.
- Generation PDF et email.
- Export et restauration d'une sauvegarde.

### 12.6 Tests de non-regression

Rejouer la suite existante :

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Ajouter des tests d'integration executes contre PostgreSQL Docker, et non uniquement contre des mocks.

## 13. Strategie de mise en oeuvre

### Phase 0 - Decision et inventaire

1. Valider le choix d'une authentification locale.
2. Choisir `pg` seul ou un query builder.
3. Determiner si les hashes `auth.users` sont migrables.
4. Obtenir un dump source et son inventaire.
5. Decider si les sessions existantes sont toutes invalidees.

Livrable : decision d'architecture et matrice des donnees migrables.

### Phase 1 - PostgreSQL Docker vierge

1. Ajouter `docker-compose.dev.yml`.
2. Ajouter `.env.example` avec `DATABASE_URL`.
3. Ajouter le healthcheck et les volumes.
4. Ajouter le gestionnaire de migrations.
5. Creer `users`, `sessions` et `password_reset_tokens`.

Livrable : base vide demarrable par une commande.

### Phase 2 - Schema metier natif

1. Rejouer les migrations dans une branche dediee.
2. Remplacer `auth.users` par `users`.
3. Remplacer ou retirer les fonctions Supabase.
4. Adapter les triggers et contraintes.
5. Decider du sort des policies RLS.

Livrable : migrations completes sur une base vierge.

### Phase 3 - Couche database applicative

1. Remplacer `src/lib/db.ts` par un pool PostgreSQL.
2. Remplacer les appels `.from()`, `.select()`, `.eq()`, `.insert()`, `.update()` et `.delete()`.
3. Remplacer les relations PostgREST par des `JOIN` explicites.
4. Ajouter des transactions aux operations multi-tables.
5. Mapper les lignes SQL vers les types applicatifs.

Livrable : application compilee et connectee a PostgreSQL local.

### Phase 4 - Authentification et autorisation

1. Implementer `users`, `sessions` et les tokens de reset.
2. Remplacer les appels Supabase Auth.
3. Conserver les roles et les checks d'ownership.
4. Ajouter les tests de securite negatifs.
5. Desactiver les anciennes dependances Supabase.

Livrable : parcours d'authentification complet sans Supabase.

### Phase 5 - Import des donnees

1. Restaurer le dump dans une base temporaire.
2. Executer le script de transformation.
3. Importer les tables dans l'ordre des dependances.
4. Importer les utilisateurs selon le scenario A, B ou C.
5. Comparer les compteurs et controles d'integrite.

Livrable : base cible de developpement avec rapport de reconciliation.

### Phase 6 - Fonctionnalites secondaires

1. Remplacer l'Edge Function de notifications.
2. Adapter le seed local.
3. Adapter les sauvegardes.
4. Mettre a jour la documentation et les scripts CI.
5. Retirer les references Supabase restantes.

Livrable : aucun chemin applicatif requis ne depend de Supabase.

### Phase 7 - Validation complete

1. Executer les tests unitaires.
2. Executer les tests d'integration PostgreSQL.
3. Executer les parcours E2E.
4. Rejouer un import complet depuis un dump vierge.
5. Tester une restauration.
6. Mesurer les temps de comparaison et les requetes lentes.

Livrable : rapport de validation signe.

## 14. Strategie de bascule

### 14.1 Dev local

Pour le developpement, la bascule peut etre franche :

1. arreter l'instance Supabase locale ou supprimer son usage ;
2. demarrer PostgreSQL Docker ;
3. appliquer les migrations ;
4. importer les donnees de test ;
5. lancer Next.js avec le nouvel `.env` ;
6. executer les tests et les parcours manuels.

### 14.2 Environnement partage ou production

Utiliser une bascule en deux temps :

1. deployer la version compatible avec les deux modes sans changer le fournisseur par defaut ;
2. restaurer un snapshot dans PostgreSQL cible ;
3. executer la reconciliation ;
4. lancer les tests de fumee sur cible ;
5. ouvrir une fenetre de maintenance ;
6. arreter les ecritures source ;
7. effectuer un delta final ou un dump final ;
8. importer le delta ;
9. invalider les sessions et activer le fournisseur cible ;
10. verifier les parcours critiques ;
11. surveiller erreurs et latence ;
12. conserver la source en lecture seule pendant la periode de stabilisation.

La duree de la fenetre depend du volume de donnees et du temps de restauration. Elle ne peut pas etre determinee avec le depot seul.

## 15. Rollback

### 15.1 Conditions de rollback

Declencher un rollback si l'un des points suivants est constate :

- perte ou incoherence de donnees ;
- impossibilite de connexion pour un nombre significatif d'utilisateurs ;
- echec d'une route d'autorisation critique ;
- erreurs de transaction ou de contrainte non resolues ;
- degradation de performance bloquante ;
- impossibilite de restaurer la cible.

### 15.2 Procedure

1. Desactiver les ecritures sur la cible.
2. Rebasculer l'application vers la source precedente.
3. Invalider les cookies de session locale.
4. Reafficher le mode maintenance si necessaire.
5. Comparer les ecritures realisees pendant la fenetre.
6. Conserver les logs, dumps et rapports d'erreur.
7. Corriger le probleme dans une branche dediee.
8. Rejouer une migration complete sur une base vierge avant une nouvelle tentative.

Si des ecritures ont ete acceptees sur la cible, le rollback ne doit pas les ignorer silencieusement. Il faut produire un rapport de reconciliation et decider manuellement quelles donnees sont a reinjecter.

## 16. Risques et points d'attention

### Critiques

- Les hashes, sessions et tokens Supabase ne sont pas automatiquement compatibles avec une authentification locale.
- Les policies RLS utilisant `auth.uid()` ne fonctionnent pas telles quelles.
- Le remplacement de PostgREST par SQL natif peut introduire des erreurs d'ownership ou d'injection si les requetes ne sont pas parametrees.
- Une migration partielle de `auth.users` peut rendre des comptes inutilisables.
- Les secrets Docker et le volume PostgreSQL ne doivent pas etre commites ni partages.

### Importants

- Les extensions Supabase disponibles ne sont pas toutes garanties sur `postgres:16-alpine`.
- Les objets `auth`, roles et privileges Supabase peuvent rendre un dump complet non portable.
- Les sequences doivent etre verifiees apres import.
- Les JSON historiques peuvent contenir des formats incompatibles avec les nouvelles fonctions.
- Les operations actuelles qui comptent sur `service_role` devront etre revalidees apres suppression de Supabase.
- Les notifications et emails ne doivent pas etre bloques par la migration de la base.
- Le rate limiting en memoire reste limite a une instance, meme apres migration.
- Le dev Docker ne constitue pas une strategie de haute disponibilite.

### A clarifier avant implementation

- Fournisseur et politique d'authentification cible.
- Possibilite legale et technique de migrer les hashes de mot de passe.
- Conservation ou suppression de la RLS.
- Outil de migration SQL.
- Necessite d'un ORM ou maintien de SQL natif.
- Politique de reset obligatoire des comptes.
- RPO/RTO attendus.
- Necessite d'un environnement de staging partage.

## 17. Criteres d'acceptation

La migration de developpement est consideree comme reussie lorsque :

- `docker compose up -d postgres` demarre une base saine ;
- l'application ne contient plus de dependance runtime obligatoire a Supabase ;
- les migrations s'appliquent sur une base vide ;
- un dump de donnees peut etre restaure sur une base cible ;
- les compteurs et relations critiques sont reconciliables ;
- les comptes migres suivent le scenario d'authentification choisi ;
- les roles `USER`, `INSURER` et `ADMIN` fonctionnent ;
- les controles d'ownership et d'IDOR sont valides par des tests negatifs ;
- la comparaison, les devis, contrats, sinistres, notifications et exports fonctionnent ;
- les sauvegardes et restaurations sont testees ;
- `npm test`, `npx tsc --noEmit`, `npm run lint` et `npm run build` passent ;
- la documentation ne reference plus Supabase comme dependance d'execution ;
- un rollback documente a ete execute au moins une fois sur un environnement de test.

## 18. Conclusion

La migration est realisable, mais elle concerne deux produits techniques distincts : le stockage PostgreSQL et la plateforme d'identite Supabase Auth. Le schema metier est largement recuperable, tandis que l'authentification, la RLS et l'API PostgREST demandent une adaptation explicite.

La trajectoire la moins risquee est :

1. PostgreSQL Docker vierge et migrations natives ;
2. remplacement de l'acces Supabase par `pg` ;
3. authentification locale avec invalidation des sessions existantes ;
4. import des donnees metier ;
5. tests d'autorisation et de reconciliation ;
6. remplacement des sauvegardes et notifications Supabase ;
7. suppression des dependances et references obsoletes.

Ne pas considerer un simple `pg_dump`/`pg_restore` comme une migration complete : il ne traite pas automatiquement la compatibilite de l'authentification, des fonctions Supabase, des policies RLS ni des appels PostgREST.
