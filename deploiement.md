# Déploiement NOLI

## Prérequis

- Node.js >= 18
- npm
- SQLite (intégré, aucune installation requise)
- (Optionnel) PM2 global : `npm install -g pm2`

---

## 1. Build

```bash
npm run build
```

Cette commande :
- Compile l'application Next.js en standalone dans `.next/standalone/`
- Copie les fichiers statiques et le dossier `public/` dans `.next/standalone/`

> **Important** : Le build standalone inclut le path complet (`Documents/noli/server.js`). Vérifier le chemin avec :
> ```bash
> find .next/standalone -name "server.js" -type f
> ```

---

## 2. Démarrer l'application

### Avec PM2 (recommandé)

```bash
# Copier les assets
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Démarrer
pm2 start ecosystem.config.js

# Sauvegarder la liste PM2 (redémarrage auto après reboot)
pm2 save
pm2 startup
```

### Sans PM2

```bash
PORT=8080 NODE_ENV=production \
  DATABASE_URL="file:./prisma/dev.db" \
  node .next/standalone/Documents/noli/server.js
```

---

## 3. Port

Le port par défaut est **8080** (configuré dans `ecosystem.config.js`).

Si le port est déjà utilisé (ex. Apache), éditer `ecosystem.config.js` :

```js
env: {
  PORT: 3000,      // changer ici
  // ...
}
```

Ou en variable d'environnement :

```bash
PORT=3000 pm2 start ecosystem.config.js
```

---

## 4. Base de données

La base SQLite est dans `prisma/dev.db`.

- **SQLite ne supporte pas les accès concurrents en écriture** → 1 instance PM2 seulement (`instances: 1`, `exec_mode: "fork"`)
- Pour la réinitialiser : supprimer `prisma/dev.db` et relancer `npm run seed`

---

## 5. Variables d'environnement

| Variable | Valeur par défaut | Description |
|---|---|---|
| `PORT` | `8080` | Port d'écoute |
| `NODE_ENV` | `production` | Mode production |
| `DATABASE_URL` | `file:./prisma/dev.db` | Chemin de la base SQLite |
| `NEXTAUTH_SECRET` | (dans .env.local) | Secret NextAuth |
| `NEXTAUTH_URL` | (dans .env.local) | URL publique de l'app |

> Ne pas oublier de copier `.env.local` si le dossier `.next/standalone` est déployé ailleurs.

---

## 6. Commandes utiles

```bash
# Statut PM2
pm2 status

# Logs
pm2 logs noli

# Redémarrer
pm2 restart noli

# Arrêter
pm2 stop noli

# Supprimer du PM2
pm2 delete noli
```

---

## 7. Mise à jour (nouveau build)

```bash
git pull
npm install
npm run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
pm2 restart noli
```

---

## 8. Architecture

```
.next/standalone/
├── Documents/noli/
│   ├── server.js          ← point d'entrée du serveur
│   ├── .next/             ← build statique
│   ├── public/            ← assets (logos uploadés)
│   ├── prisma/            ← base de données + schéma
│   └── .env.local         ← variables d'environnement
├── logs/                  ← logs PM2
└── ecosystem.config.js    ← config PM2
```
