import { join, isAbsolute, basename } from "path";

// ⚠️ NE PROTÈGE PAS LA BASE DE PRODUCTION.
// DB_PATH pointe vers un fichier SQLite local (db/custom.db) qui n'est PAS la base
// réelle : la prod tourne sur Supabase/Postgres (voir src/lib/db.ts). La « sauvegarde »
// admin construite ici est donc inopérante pour la reprise après sinistre.
// La vraie stratégie (pg_dump planifié + backups Supabase) est décrite dans
// docs/SAUVEGARDE_DR.md. À retirer ou réorienter (décision équipe).
export const DB_PATH = join(/* turbopackIgnore: true */ process.cwd(), "db", "custom.db");
export const BACKUPS_DIR = join(/* turbopackIgnore: true */ process.cwd(), "db", "backups");

/**
 * H-07 : reconstruit le chemin d'un backup depuis son nom de fichier
 * (relatif au dossier de backups). Les anciennes lignes stockant un chemin
 * absolu restent lisibles (compatibilité) ; les nouveaux backups ne
 * stockent plus de chemin absolu côté serveur.
 */
export function resolveBackupPath(filename: string, storedPath: string | null): string {
  if (storedPath && isAbsolute(storedPath)) return storedPath;
  if (storedPath) return join(BACKUPS_DIR, basename(storedPath));
  return join(BACKUPS_DIR, filename);
}
