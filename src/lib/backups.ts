import { join, isAbsolute, basename } from "path";

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
