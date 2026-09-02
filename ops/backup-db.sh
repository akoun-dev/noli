#!/usr/bin/env bash
#
# Sauvegarde de la base Noli (Supabase/Postgres) via pg_dump.
# Destiné à tourner en CRON sur le serveur (VPS), PAS dans l'application.
# Voir docs/SAUVEGARDE_DR.md pour l'installation et la procédure de restauration.
#
# Prérequis :
#   - pg_dump installé (paquet postgresql-client)
#   - Variable d'environnement SUPABASE_DB_URL = chaîne de connexion Postgres
#     (Supabase → Project Settings → Database → Connection string / URI).
#
# Usage :
#   SUPABASE_DB_URL="postgres://..." ./scripts/backup-db.sh [dossier_destination] [jours_retention]
#
set -euo pipefail

DEST_DIR="${1:-/var/backups/noli}"
RETENTION_DAYS="${2:-14}"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "[backup] ERREUR : SUPABASE_DB_URL non définie." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "[backup] ERREUR : pg_dump introuvable (installer postgresql-client)." >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

# Horodatage UTC ; format personnalisé (-Fc) = restauration sélective via pg_restore.
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$DEST_DIR/noli-${STAMP}.dump"

echo "[backup] Démarrage : $OUT"
# --no-owner / --no-privileges : restauration portable vers une autre instance.
pg_dump --format=custom --no-owner --no-privileges --dbname="$SUPABASE_DB_URL" --file="$OUT"

# Vérifie que le fichier n'est pas vide.
if [[ ! -s "$OUT" ]]; then
  echo "[backup] ERREUR : dump vide, suppression." >&2
  rm -f "$OUT"
  exit 1
fi

echo "[backup] OK : $(du -h "$OUT" | cut -f1) → $OUT"

# Rotation : supprime les dumps plus vieux que RETENTION_DAYS.
find "$DEST_DIR" -name "noli-*.dump" -type f -mtime +"$RETENTION_DAYS" -print -delete

echo "[backup] Terminé. Rétention : ${RETENTION_DAYS} jours."
