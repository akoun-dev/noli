#!/usr/bin/env bash
# Restaure un dump PostgreSQL custom dans une base cible.
# Usage : TARGET_DATABASE_URL="postgres://..." ./ops/restore-db.sh fichier.dump
set -euo pipefail

DUMP_FILE="${1:-}"

if [[ -z "$DUMP_FILE" || ! -s "$DUMP_FILE" ]]; then
  echo "[restore] ERREUR : fournir un dump PostgreSQL non vide." >&2
  exit 1
fi

if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then
  echo "[restore] ERREUR : TARGET_DATABASE_URL non définie." >&2
  exit 1
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "[restore] ERREUR : pg_restore introuvable." >&2
  exit 1
fi

echo "[restore] Contenu du dump :"
pg_restore --list "$DUMP_FILE" >/dev/null

read -r -p "Restaurer $DUMP_FILE dans la base cible ? [y/N] " confirmation
if [[ "$confirmation" != "y" && "$confirmation" != "Y" ]]; then
  echo "[restore] Annulé."
  exit 0
fi

pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$TARGET_DATABASE_URL" \
  "$DUMP_FILE"

echo "[restore] Restauration terminée."
