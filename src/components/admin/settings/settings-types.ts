// ──────────────────────────────────────────────────────────────
// Types, constantes et helpers partagés des sous-composants
// de l'onglet Paramètres admin.
// ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  _count: { quotes: number };
  createdAt: string;
  lastLogin?: string | null;
}

export interface Role {
  id: string;
  name: string;
  label: string;
}

export const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  INSURER: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  USER: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  INSURER: "Assureur",
  USER: "Utilisateur",
};

export function formatLastLogin(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (target.getTime() === today.getTime()) return "Aujourd'hui";
  if (target.getTime() === yesterday.getTime()) return "Hier";
  return d.toLocaleDateString("fr-FR");
}

export const saveBtnClass =
  "bg-brand text-black hover:bg-brand-hover font-medium";

// Props communes aux cartes de réglages (Général, Email, Sécurité, Notifications, Apparence)
export interface SettingsCardProps {
  getSetting: (cat: string, key: string, fallback?: string) => string;
  setSettingLocal: (cat: string, key: string, value: string) => void;
  saveCategory: (cat: string, fields?: Record<string, string>) => void;
  savingCategory: string | null;
}
