# Déploiement NOLI

Guide de déploiement production. Stack : **Next.js 16 (build `standalone`) · PostgreSQL natif + authentification locale · Caddy + PM2**.

> La stack runtime utilise PostgreSQL natif et une authentification locale. PostgreSQL de développement est fourni par Docker. Package manager de référence : **npm** (`package-lock.json`).

---

## 1. Prérequis

- **Node.js >= 18** + **npm**
- **Docker Compose** — PostgreSQL local via `docker-compose.dev.yml`
- **PM2** : `npm install -g pm2`
- **Caddy** (reverse-proxy, **seul** point d'entrée public)

---

## 2. Variables d'environnement (`.env`)

Copier `.env.example` et renseigner les variables locales :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL serveur |
| `AUTH_SESSION_SECRET` | Secret des sessions locales, serveur uniquement |
| `POSTGRES_PASSWORD` | Mot de passe du conteneur PostgreSQL de développement |
| `NEXT_PUBLIC_SITE_URL` | URL publique de l'app (emails de réinitialisation) |
| `RESEND_API_KEY` | Emails transactionnels (Resend) |

> Le serveur **standalone Next.js ne charge pas `.env` automatiquement**. `ecosystem.config.js` l'injecte via `loadEnvFile(".env")` au démarrage PM2.

---

## 3. Base de données PostgreSQL

**Pas de Prisma, pas de SQLite.** Schéma natif dans `db/migrations/`.

```bash
docker compose -f docker-compose.dev.yml up -d postgres
npm run db:migrate
npm run db:seed
```

Les notifications sont écrites directement par le serveur Next.js dans PostgreSQL.

---

## 4. Build

Avant un déploiement : `npx tsc --noEmit && npm test`.

```bash
npm ci
npm run build                 # output: "standalone" → .next/standalone/server.js
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

---

## 5. Démarrage (PM2)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

L'app écoute sur **:8080** (`PORT: process.env.PORT || 8080`).

> **Mono-instance obligatoire** (`instances: 1`, `exec_mode: "fork"`). Raison : le **rate limiting est en mémoire** (`src/lib/rate-limit.ts`). Avant tout scale-out, migrer vers Redis/Upstash (`UPSTASH_REDIS_REST_URL`), sinon la limite effective = limite × nb d'instances.

Sans PM2 :

```bash
npm run start   # NODE_ENV=production, lance .next/standalone/server.js
```

---

## 6. Reverse-proxy (Caddy)

Le `Caddyfile` expose **:81** et proxie vers `localhost:8080`. Caddy **écrase** `X-Forwarded-For` (`{remote_host}`) → l'IP client est fiable **tant que Caddy est le seul point d'entrée**.

```bash
caddy start --config Caddyfile   # ou : caddy reload --config Caddyfile
```

> ⚠️ Le port **8080 ne doit pas être exposé publiquement** : un accès direct à l'app contournerait Caddy et rendrait l'IP (donc le rate-limit) falsifiable. Pare-feu : seul `:81` est public.

---

## 7. Mise à jour

```bash
git pull
npm ci
npm run build
cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
npm run db:migrate            # si de nouvelles migrations
pm2 reload ecosystem.config.js
caddy reload --config Caddyfile
```

---

## 8. Commandes utiles

```bash
pm2 status                              # état
pm2 logs noli                           # logs
pm2 reload ecosystem.config.js          # redémarrage sans coupure
docker compose -f docker-compose.dev.yml exec postgres psql -U noli_app -d noli
```

---

## 9. Vérifications post-déploiement

```bash
curl -I http://localhost:8080   # app répond (200/3xx)
curl -I http://localhost:81     # via Caddy (pas de 502)
ss -lntp | grep -E ':8080|:81'  # noli sur :8080, caddy sur :81
```
