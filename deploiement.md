# Déploiement NOLI

> ⚠️ Ce document a été corrigé le 6 août 2026 : la version précédente décrivait
> une stack SQLite/Prisma/`DATABASE_URL` obsolète. L'application utilise
> désormais **Supabase** (Postgres + Auth) comme backend — il n'y a plus de
> base de données locale à gérer côté serveur applicatif.

## Prérequis

- Node.js >= 18 (ou Bun)
- Un projet [Supabase](https://supabase.com) provisionné, avec le schéma
  appliqué (voir `supabase/migrations/`)
- (Optionnel) PM2 global : `npm install -g pm2`

---

## 1. Configuration

Copier `.env.example` en `.env` (ou `.env.local`) à la racine du projet et
renseigner :

```bash
NEXT_PUBLIC_SUPABASE_URL="https://VOTRE_PROJET.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."   # ⚠️ jamais côté client, ne jamais committer
NEXT_PUBLIC_SITE_URL="https://votre-domaine.tld"
RESEND_API_KEY="..."
```

`SUPABASE_SERVICE_ROLE_KEY` contourne le Row Level Security (RLS) de
Postgres : elle doit rester strictement côté serveur et ne jamais être
exposée au bundle client (préfixe `NEXT_PUBLIC_` interdit pour cette
variable).

---

## 2. Build

```bash
npm install
npm run build
```

Cette commande :
- Compile l'application Next.js en standalone dans `.next/standalone/`
- Copie les fichiers statiques (`.next/static`) et le dossier `public/`
  dans `.next/standalone/` (déjà intégré au script `build` de
  `package.json`)

---

## 3. Démarrer l'application

### Avec PM2 (recommandé)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Sans PM2

```bash
PORT=3000 NODE_ENV=production node .next/standalone/server.js
```

> Vérifier le chemin réel du point d'entrée générés par le build :
> `find .next/standalone -name "server.js" -type f`

---

## 4. Port et reverse-proxy

Le port applicatif par défaut est **3000** (`PORT` dans
`ecosystem.config.js`). Le reverse-proxy Caddy (`Caddyfile`) écoute sur le
port 81 et relaie uniquement vers `localhost:3000`.

> ⚠️ Ne jamais réintroduire de règle de proxy pilotée par un paramètre de
> requête client (type `?port=...`) dans le `Caddyfile` : cela ouvrirait un
> accès à des services internes non destinés à être publics (SSRF).

---

## 5. Base de données

La base de données est un projet **Supabase managé** (Postgres) — il n'y a
pas de fichier de base locale en production. Pour appliquer ou mettre à
jour le schéma :

```bash
supabase link --project-ref VOTRE_PROJET
supabase db push
```

Les migrations SQL versionnées se trouvent dans `supabase/migrations/`.

Pour initialiser des données de démonstration (assureurs, garanties,
offres), un compte **ADMIN** authentifié peut appeler `POST /api/seed`
(protégé par contrôle de rôle).

---

## 6. Variables d'environnement (récapitulatif)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (client + SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur, contourne RLS — jamais exposée au client |
| `NEXT_PUBLIC_SITE_URL` | URL publique de l'app (liens dans les emails) |
| `RESEND_API_KEY` | Clé API Resend (envoi d'emails) |
| `PORT` | Port d'écoute Next.js (défaut 3000) |
| `NODE_ENV` | `production` en déploiement |

---

## 7. Commandes utiles (PM2)

```bash
pm2 status
pm2 logs noli
pm2 restart noli
pm2 stop noli
pm2 delete noli
```

---

## 8. Mise à jour (nouveau build)

```bash
git pull
npm install
npm run build
pm2 restart noli
```

---

## 9. Architecture de déploiement

```
.next/standalone/
├── server.js          ← point d'entrée du serveur Next.js
├── .next/              ← build statique
├── public/             ← assets (logos uploadés, etc.)
└── (.env / variables d'environnement injectées par PM2 ou le shell)

ecosystem.config.js      ← configuration PM2 (racine du projet)
Caddyfile                ← reverse-proxy public → localhost:3000
```

La base de données (Postgres) et l'authentification sont entièrement
externalisées chez Supabase : aucun fichier de base à sauvegarder/répliquer
sur le serveur applicatif lui-même.
