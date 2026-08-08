# Sauvegarde & reprise après sinistre (DR) — Noli

**Contexte :** la base de production est **Supabase/Postgres** (externe), l'app
tourne sur **VPS + PM2**. La sauvegarde doit se faire au **niveau infra**, pas dans
l'application (voir §« Point d'attention » plus bas).

---

## ⚠️ Point d'attention — la « sauvegarde » de l'admin ne protège PAS la base

La fonctionnalité *Sauvegardes* du panneau admin (`src/lib/backups.ts`,
`/api/admin/backups`) copie un fichier **SQLite local** (`db/custom.db`) qui **n'est
pas** la base réelle (Supabase/Postgres). Elle est donc **inopérante pour la DR**.

**Décision à prendre par l'équipe :**
- soit **retirer** cette fonctionnalité (recommandé — évite une fausse confiance),
- soit la **réorienter** (ex. déclencher/superviser le script `pg_dump` ci-dessous).

En l'état, **ne comptez pas dessus.** La vraie sauvegarde est décrite ci-dessous.

---

## 1. Deux niveaux de sauvegarde (défense en profondeur)

1. **Backups managés Supabase** — automatiques selon le plan (quotidiens + PITR sur
   les plans supérieurs). À **activer/vérifier** dans le dashboard Supabase
   (Project → Database → Backups). C'est la première ligne.
2. **`pg_dump` planifié sur le VPS** (`ops/backup-db.sh`) — copie indépendante,
   hors Supabase, que vous contrôlez et pouvez restaurer ailleurs. Deuxième ligne.

## 2. Mise en place du dump planifié

Prérequis : `postgresql-client` installé (`pg_dump`), et la chaîne de connexion
Postgres (Supabase → Project Settings → Database → Connection string / URI).

```bash
# Test manuel
SUPABASE_DB_URL="postgres://USER:PWD@HOST:5432/postgres" \
  ./ops/backup-db.sh /var/backups/noli 14

# Cron quotidien à 02:00 (crontab -e), secret hors du crontab :
0 2 * * * SUPABASE_DB_URL="$(cat /etc/noli/db_url)" /chemin/vers/ops/backup-db.sh /var/backups/noli 14 >> /var/log/noli-backup.log 2>&1
```

- Format `-Fc` (custom) → restauration **sélective** possible via `pg_restore`.
- Rotation automatique (14 jours par défaut, 2e paramètre).
- **Stocker une copie hors-site** (S3/rsync) — un backup sur le même serveur ne
  protège pas d'une perte du serveur.

## 3. Restauration

```bash
# Restauration complète vers une base cible (⚠️ écrase les données) :
pg_restore --clean --no-owner --no-privileges \
  --dbname="postgres://USER:PWD@HOST:5432/postgres" \
  /var/backups/noli/noli-YYYYMMDDThhmmssZ.dump

# Restauration d'une seule table :
pg_restore --data-only --table=insurance_offers --dbname="..." <fichier.dump>
```

## 4. Tester la restauration (indispensable)

Un backup non testé = pas de backup. **Trimestriellement** :
1. Créer une base jetable (ou un projet Supabase de test).
2. Y restaurer le dernier dump.
3. Lancer l'app dessus + le healthcheck `/api/health` → doit répondre `200`.
4. Vérifier quelques données clés (offres, comptes, devis).
5. Consigner la date et le résultat du test.

## 5. Checklist DR

- [ ] Backups managés Supabase activés et vérifiés
- [ ] Cron `pg_dump` en place + logs surveillés
- [ ] Copie hors-site des dumps
- [ ] Test de restauration réalisé (date : ______)
- [ ] Procédure de bascule documentée (RTO/RPO cibles définis)
- [ ] Décision prise sur la fonctionnalité « Sauvegardes » de l'admin (retirer/réorienter)
