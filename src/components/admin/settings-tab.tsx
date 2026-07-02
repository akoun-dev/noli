"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Mail,
  Users,
  Shield,
  Bell,
  Palette,
  UserCog,
  Pencil,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Profile {
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

interface Role {
  id: string;
  name: string;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  INSURER: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  USER: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  INSURER: "Assureur",
  USER: "Utilisateur",
};

/* ------------------------------------------------------------------ */
/*  Helper: format last login                                          */
/* ------------------------------------------------------------------ */

function formatLastLogin(dateStr?: string | null): string {
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

/* ------------------------------------------------------------------ */
/*  Save button style                                                  */
/* ------------------------------------------------------------------ */

const saveBtnClass =
  "bg-[#B9E54D] text-black hover:bg-[#a5d044] font-medium";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function SettingsTab() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* ---------- shared state ---------- */
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);

  /* ---------- profiles state (tabs 3 & 7) ---------- */
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- roles state (tab 7) ---------- */
  const [roles, setRoles] = useState<Role[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  /* ---------- saving settings state ---------- */
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  /* ================================================================ */
  /*  Fetch helpers                                                     */
  /* ================================================================ */

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const grouped: Record<string, Record<string, string>> = {};
        for (const [cat, arr] of Object.entries(data.settings ?? {})) {
          grouped[cat] = {};
          for (const s of arr as { key: string; value: string }[]) {
            grouped[cat][s.key] = s.value;
          }
        }
        setSettings(grouped);
      }
    } catch {
      /* silent – will show defaults */
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/profiles${search ? `?search=${search}` : ""}`
      );
      if (res.ok) setProfiles(await res.json());
    } finally {
      setProfilesLoading(false);
    }
  }, [search]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : (data.roles || []));
      }
    } catch {
      /* silent */
    }
  }, []);

  /* ================================================================ */
  /*  Effects                                                          */
  /* ================================================================ */

  useEffect(() => {
    fetchSettings();
    fetchProfiles();
    fetchRoles();
  }, [fetchSettings, fetchProfiles, fetchRoles]);

  /* ================================================================ */
  /*  Settings helpers                                                  */
  /* ================================================================ */

  const getSetting = (cat: string, key: string, fallback = "") =>
    settings[cat]?.[key] ?? fallback;

  const setSettingLocal = (cat: string, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [key]: value },
    }));
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    }
  };

  const saveCategory = async (cat: string, fields: Record<string, string>) => {
    setSavingCategory(cat);
    try {
      await Promise.all(
        Object.entries(fields).map(([key, value]) => saveSetting(key, value))
      );
      toast({ title: "Paramètres enregistrés avec succès" });
    } finally {
      setSavingCategory(null);
    }
  };

  /* ================================================================ */
  /*  Profile helpers                                                   */
  /* ================================================================ */

  const openEdit = (p: Profile) => {
    setEdit({ ...p });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: edit.id,
          firstName: edit.firstName,
          lastName: edit.lastName,
          phone: edit.phone,
          role: edit.role,
          isActive: edit.isActive,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Erreur");
      }
      toast({ title: "Profil mis à jour" });
      setEditOpen(false);
      fetchProfiles();
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleProfileStatus = async (p: Profile) => {
    try {
      await fetch("/api/admin/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      fetchProfiles();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const changeProfileRole = async (p: Profile, newRole: string) => {
    try {
      await fetch("/api/admin/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, role: newRole }),
      });
      fetchProfiles();
      toast({ title: "Rôle mis à jour" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  /* ================================================================ */
  /*  Loading skeleton                                                 */
  /* ================================================================ */

  if (settingsLoading || profilesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  if (!mounted) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
        <div className="space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <Tabs defaultValue="general" className="w-full">
        {/* ---------- Tab list (horizontally scrollable on mobile) ---------- */}
        <TabsList className="overflow-x-auto w-max flex-nowrap mb-6">
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
            <span className="sm:hidden">Gén.</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
            <span className="sm:hidden">Mel.</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
            <span className="sm:hidden">Util.</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
            <span className="sm:hidden">Séc.</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifs</span>
            <span className="sm:hidden">Not.</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apparence</span>
            <span className="sm:hidden">App.</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Comptes</span>
            <span className="sm:hidden">Cpt.</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/*  TAB 1 – Général                                              */}
        {/* ============================================================ */}
        <TabsContent value="general">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#B9E54D]" />
                Paramètres généraux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="site-name">Nom du site</Label>
                <Input
                  id="site-name"
                  value={getSetting("general", "site_name", "NOLI Assurance")}
                  onChange={(e) =>
                    setSettingLocal("general", "site_name", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="site-email">Email du site</Label>
                <Input
                  id="site-email"
                  type="email"
                  value={getSetting("general", "site_email", "contact@noli.ci")}
                  onChange={(e) =>
                    setSettingLocal("general", "site_email", e.target.value)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mode maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Activez pour afficher un message aux visiteurs
                  </p>
                </div>
                <Switch
                  checked={getSetting("general", "maintenance_mode") === "true"}
                  onCheckedChange={(v) =>
                    setSettingLocal("general", "maintenance_mode", String(v))
                  }
                />
              </div>

              {getSetting("general", "maintenance_mode") === "true" && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">
                    Le site est actuellement en mode maintenance. Les visiteurs
                    verront un message d&apos;avertissement.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  className={saveBtnClass}
                  disabled={savingCategory === "general"}
                  onClick={() =>
                    saveCategory("general", settings["general"] ?? {})
                  }
                >
                  {savingCategory === "general" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 2 – Email (SMTP)                                         */}
        {/* ============================================================ */}
        <TabsContent value="email">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#B9E54D]" />
                Configuration Email (SMTP)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Activer l&apos;envoi d&apos;emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Permet l&apos;envoi d&apos;emails via serveur SMTP
                  </p>
                </div>
                <Switch
                  checked={getSetting("email", "smtp_enabled") === "true"}
                  onCheckedChange={(v) =>
                    setSettingLocal("email", "smtp_enabled", String(v))
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="smtp-host">Hôte SMTP</Label>
                <Input
                  id="smtp-host"
                  value={getSetting("email", "smtp_host")}
                  onChange={(e) =>
                    setSettingLocal("email", "smtp_host", e.target.value)
                  }
                  placeholder="smtp.exemple.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="smtp-port">Port SMTP</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={getSetting("email", "smtp_port", "587")}
                    onChange={(e) =>
                      setSettingLocal("email", "smtp_port", e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="smtp-encryption">Chiffrement</Label>
                  <Select
                    value={getSetting("email", "smtp_encryption", "tls")}
                    onValueChange={(v) =>
                      setSettingLocal("email", "smtp_encryption", v)
                    }
                  >
                    <SelectTrigger id="smtp-encryption">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="smtp-user">Utilisateur SMTP</Label>
                <Input
                  id="smtp-user"
                  value={getSetting("email", "smtp_user")}
                  onChange={(e) =>
                    setSettingLocal("email", "smtp_user", e.target.value)
                  }
                  placeholder="user@exemple.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="smtp-pass">Mot de passe SMTP</Label>
                <Input
                  id="smtp-pass"
                  type="password"
                  value={getSetting("email", "smtp_password")}
                  onChange={(e) =>
                    setSettingLocal("email", "smtp_password", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="smtp-from">Email expéditeur</Label>
                <Input
                  id="smtp-from"
                  type="email"
                  value={getSetting("email", "smtp_from", "noreply@noli.ci")}
                  onChange={(e) =>
                    setSettingLocal("email", "smtp_from", e.target.value)
                  }
                />
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className={saveBtnClass}
                  disabled={savingCategory === "email"}
                  onClick={() =>
                    saveCategory("email", settings["email"] ?? {})
                  }
                >
                  {savingCategory === "email" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({ title: "Email de test envoyé" })
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer un email test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 3 – Utilisateurs                                         */}
        {/* ============================================================ */}
        <TabsContent value="users">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Utilisateurs</h2>
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-center">Devis</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.lastName || "—"} {p.firstName || ""}
                    </TableCell>
                    <TableCell className="text-sm">{p.email}</TableCell>
                    <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[p.role] || ""}>
                        {roleLabels[p.role] || p.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {p._count.quotes}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={() => toggleProfileStatus(p)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {profiles.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {p.lastName || "—"} {p.firstName || ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {p.email}
                      </p>
                    </div>
                    <Badge className={roleColors[p.role] || ""}>
                      {roleLabels[p.role] || p.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.phone || "—"} · {p._count.quotes} devis
                    </span>
                    <span className="text-muted-foreground">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Actif</Label>
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={() => toggleProfileStatus(p)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {profiles.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </p>
            )}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 4 – Sécurité                                             */}
        {/* ============================================================ */}
        <TabsContent value="security">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#B9E54D]" />
                Politique de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Mot de passe
              </p>

              <div className="grid gap-2">
                <Label htmlFor="min-length">
                  Longueur minimale du mot de passe
                </Label>
                <Input
                  id="min-length"
                  type="number"
                  min={6}
                  max={32}
                  value={getSetting("security", "password_min_length", "8")}
                  onChange={(e) =>
                    setSettingLocal(
                      "security",
                      "password_min_length",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requérir des majuscules</Label>
                <Switch
                  checked={
                    getSetting("security", "password_require_uppercase") ===
                    "true"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "security",
                      "password_require_uppercase",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requérir des minuscules</Label>
                <Switch
                  checked={
                    getSetting("security", "password_require_lowercase") ===
                    "true"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "security",
                      "password_require_lowercase",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requérir des chiffres</Label>
                <Switch
                  checked={
                    getSetting("security", "password_require_numbers") ===
                    "true"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "security",
                      "password_require_numbers",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Requérir des caractères spéciaux</Label>
                <Switch
                  checked={
                    getSetting("security", "password_require_special") ===
                    "true"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "security",
                      "password_require_special",
                      String(v)
                    )
                  }
                />
              </div>

              <Separator />

              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Connexion et sessions
              </p>

              <div className="grid gap-2">
                <Label htmlFor="max-attempts">
                  Tentatives de connexion max avant verrouillage
                </Label>
                <Input
                  id="max-attempts"
                  type="number"
                  value={getSetting("security", "max_login_attempts", "5")}
                  onChange={(e) =>
                    setSettingLocal(
                      "security",
                      "max_login_attempts",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lockout-duration">
                  Durée de verrouillage (minutes)
                </Label>
                <Input
                  id="lockout-duration"
                  type="number"
                  value={getSetting("security", "lockout_duration", "30")}
                  onChange={(e) =>
                    setSettingLocal(
                      "security",
                      "lockout_duration",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="session-expiry">
                  Délai d&apos;expiration de session (minutes)
                </Label>
                <Input
                  id="session-expiry"
                  type="number"
                  value={getSetting(
                    "security",
                    "session_expiry_minutes",
                    "60"
                  )}
                  onChange={(e) =>
                    setSettingLocal(
                      "security",
                      "session_expiry_minutes",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="pt-2">
                <Button
                  className={saveBtnClass}
                  disabled={savingCategory === "security"}
                  onClick={() =>
                    saveCategory("security", settings["security"] ?? {})
                  }
                >
                  {savingCategory === "security" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 5 – Notifications                                        */}
        {/* ============================================================ */}
        <TabsContent value="notifications">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#B9E54D]" />
                Paramètres de notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Canaux de notification
              </p>

              <div className="flex items-center justify-between">
                <Label>Email</Label>
                <Switch
                  checked={
                    getSetting("notification", "channel_email") !== "false"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal("notification", "channel_email", String(v))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>SMS</Label>
                <Switch
                  checked={getSetting("notification", "channel_sms") === "true"}
                  onCheckedChange={(v) =>
                    setSettingLocal("notification", "channel_sms", String(v))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Push</Label>
                <Switch
                  checked={
                    getSetting("notification", "channel_push") === "true"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal("notification", "channel_push", String(v))
                  }
                />
              </div>

              <Separator />

              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Événements
              </p>

              <div className="flex items-center justify-between">
                <Label>Nouveau devis</Label>
                <Switch
                  checked={
                    getSetting("notification", "event_new_quote") !== "false"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "notification",
                      "event_new_quote",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Inscription utilisateur</Label>
                <Switch
                  checked={
                    getSetting("notification", "event_user_signup") !== "false"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "notification",
                      "event_user_signup",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Changement de statut de devis</Label>
                <Switch
                  checked={
                    getSetting("notification", "event_quote_status") !==
                    "false"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "notification",
                      "event_quote_status",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Alertes système</Label>
                <Switch
                  checked={
                    getSetting("notification", "event_system_alert") !== "false"
                  }
                  onCheckedChange={(v) =>
                    setSettingLocal(
                      "notification",
                      "event_system_alert",
                      String(v)
                    )
                  }
                />
              </div>

              <div className="pt-2">
                <Button
                  className={saveBtnClass}
                  disabled={savingCategory === "notification"}
                  onClick={() =>
                    saveCategory(
                      "notification",
                      settings["notification"] ?? {}
                    )
                  }
                >
                  {savingCategory === "notification" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 6 – Apparence                                            */}
        {/* ============================================================ */}
        <TabsContent value="appearance">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#B9E54D]" />
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="theme-select">Thème</Label>
                <Select
                  value={mounted ? (theme ?? "system") : "system"}
                  onValueChange={(v) => {
                    setTheme(v);
                    setSettingLocal("appearance", "theme", v);
                  }}
                >
                  <SelectTrigger id="theme-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lang-select">Langue</Label>
                <Select
                  value={getSetting("appearance", "language", "fr")}
                  onValueChange={(v) =>
                    setSettingLocal("appearance", "language", v)
                  }
                >
                  <SelectTrigger id="lang-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date-format-select">Format de date</Label>
                <Select
                  value={getSetting(
                    "appearance",
                    "date_format",
                    "dd/MM/yyyy"
                  )}
                  onValueChange={(v) =>
                    setSettingLocal("appearance", "date_format", v)
                  }
                >
                  <SelectTrigger id="date-format-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tz-select">Fuseau horaire</Label>
                <Select
                  value={getSetting(
                    "appearance",
                    "timezone",
                    "Africa/Abidjan"
                  )}
                  onValueChange={(v) =>
                    setSettingLocal("appearance", "timezone", v)
                  }
                >
                  <SelectTrigger id="tz-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Abidjan">
                      Africa/Abidjan
                    </SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  className={saveBtnClass}
                  disabled={savingCategory === "appearance"}
                  onClick={() =>
                    saveCategory(
                      "appearance",
                      settings["appearance"] ?? {}
                    )
                  }
                >
                  {savingCategory === "appearance" && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/*  TAB 7 – Gestion des comptes                                  */}
        {/* ============================================================ */}
        <TabsContent value="accounts">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Gestion des comptes</h2>
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Rôles personnalisés</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Devis</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const isExpanded = expandedRow === p.id;
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : p.id)
                      }
                    >
                      <TableCell className="font-medium">
                        {p.lastName || "—"} {p.firstName || ""}
                      </TableCell>
                      <TableCell className="text-sm">{p.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[p.role] || ""}>
                          {roleLabels[p.role] || p.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.role === "ADMIN" && (
                            <Badge variant="outline" className="text-xs">
                              Super Admin
                            </Badge>
                          )}
                          {p.role === "INSURER" && (
                            <Badge variant="outline" className="text-xs">
                              Gestionnaire
                            </Badge>
                          )}
                          {roles
                            .filter((r) => r.name === p.role)
                            .map((r) => (
                              <Badge
                                key={r.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {r.label}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                            Actif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastLogin(p.lastLogin)}
                      </TableCell>
                      <TableCell className="text-center">
                        {p._count.quotes}
                      </TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Aucun compte trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {profiles.map((p) => {
              const isExpanded = expandedRow === p.id;
              return (
                <Card
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedRow(isExpanded ? null : p.id)
                  }
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {p.lastName || "—"} {p.firstName || ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs">
                            Actif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 text-xs">
                            Inactif
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={roleColors[p.role] || ""}>
                        {roleLabels[p.role] || p.role}
                      </Badge>
                      <span className="text-muted-foreground">
                        Dernière connexion : {formatLastLogin(p.lastLogin)}
                      </span>
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div
                        className="pt-3 border-t space-y-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Rôles assignés
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge className={roleColors[p.role] || ""}>
                              {roleLabels[p.role] || p.role}
                            </Badge>
                            {roles
                              .filter((r) => r.name === p.role)
                              .map((r) => (
                                <Badge
                                  key={r.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {r.label}
                                </Badge>
                              ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Résumé des permissions
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {p.role === "ADMIN"
                              ? "Accès complet : gestion des assureurs, offres, garanties, utilisateurs, paramètres."
                              : p.role === "INSURER"
                                ? "Gestion des offres, garanties et consultation des devis associés."
                                : "Consultation des devis et gestion du profil personnel."}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Résumé d&apos;activité
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {p._count.quotes} devis · Inscrit le{" "}
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString(
                                  "fr-FR"
                                )
                              : "—"}{" "}
                            · Dernière connexion :{" "}
                            {formatLastLogin(p.lastLogin)}
                          </p>
                        </div>

                        <Separator />

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant={p.isActive ? "outline" : "default"}
                            size="sm"
                            className={
                              p.isActive ? "" : "bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                            }
                            onClick={() => toggleProfileStatus(p)}
                          >
                            {p.isActive ? "Désactiver" : "Activer"}
                          </Button>
                          <Select
                            value={p.role}
                            onValueChange={(v) => changeProfileRole(p, v)}
                          >
                            <SelectTrigger className="h-9 w-full sm:w-44">
                              <SelectValue placeholder="Changer le rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">Utilisateur</SelectItem>
                              <SelectItem value="INSURER">Assureur</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {profiles.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                Aucun compte trouvé
              </p>
            )}
          </div>

          {/* Desktop expanded row panel */}
          {expandedRow && (
            <div className="hidden md:block mt-4">
              <Card className="w-full">
                <CardContent className="p-6 space-y-4">
                  {(() => {
                    const p = profiles.find(
                      (pr) => pr.id === expandedRow
                    );
                    if (!p) return null;
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Rôles assignés
                            </p>
                            <div className="flex flex-wrap gap-1">
                              <Badge className={roleColors[p.role] || ""}>
                                {roleLabels[p.role] || p.role}
                              </Badge>
                              {roles
                                .filter((r) => r.name === p.role)
                                .map((r) => (
                                  <Badge
                                    key={r.id}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {r.label}
                                  </Badge>
                                ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Permissions
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {p.role === "ADMIN"
                                ? "Accès complet"
                                : p.role === "INSURER"
                                  ? "Gestion offres/devis"
                                  : "Consultation"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                              Activité
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {p._count.quotes} devis · Inscrit le{" "}
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString(
                                    "fr-FR"
                                  )
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                          <Button
                            variant={p.isActive ? "outline" : "default"}
                            size="sm"
                            className={
                              p.isActive
                                ? ""
                                : "bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                            }
                            onClick={() => toggleProfileStatus(p)}
                          >
                            {p.isActive ? "Désactiver" : "Activer"}
                          </Button>
                          <Select
                            value={p.role}
                            onValueChange={(v) => changeProfileRole(p, v)}
                          >
                            <SelectTrigger className="h-9 w-44">
                              <SelectValue placeholder="Changer le rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">Utilisateur</SelectItem>
                              <SelectItem value="INSURER">Assureur</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================ */}
      {/*  Edit Profile Dialog (shared by tabs 3 & 7)                       */}
      {/* ================================================================ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du profil.
            </DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Prénom</Label>
                  <Input
                    value={edit.firstName || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Nom</Label>
                  <Input
                    value={edit.lastName || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={edit.phone || ""}
                    onChange={(e) =>
                      setEdit({ ...edit, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Rôle</Label>
                  <Select
                    value={edit.role}
                    onValueChange={(v) => setEdit({ ...edit, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Utilisateur</SelectItem>
                      <SelectItem value="INSURER">Assureur</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Actif</Label>
                <Switch
                  checked={edit.isActive}
                  onCheckedChange={(v) => setEdit({ ...edit, isActive: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={saveBtnClass}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}