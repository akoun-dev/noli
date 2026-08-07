"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Mail,
  Users,
  Shield,
  Bell,
  Palette,
  UserCog,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile, Role } from "./settings/settings-types";
import { SettingsGeneralTab } from "./settings/settings-general-tab";
import { SettingsEmailTab } from "./settings/settings-email-tab";
import { SettingsSecurityTab } from "./settings/settings-security-tab";
import { SettingsNotificationsTab } from "./settings/settings-notifications-tab";
import { SettingsAppearanceTab } from "./settings/settings-appearance-tab";
import { SettingsUsersTab } from "./settings/settings-users-tab";
import { SettingsAccountsTab } from "./settings/settings-accounts-tab";
import { SettingsEditDialog } from "./settings/settings-edit-dialog";
import { PaginationControls, usePaginationClamp } from "@/components/shared/pagination-controls";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function SettingsTab() {
  const { toast } = useToast();

  /* ---------- shared state ---------- */
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);

  /* ---------- profiles state (tabs users & accounts) ---------- */
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  usePaginationClamp(page, setPage, pageCount);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- roles state (accounts tab) ---------- */
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
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(DEFAULT_PAGE_SIZE));
      const res = await fetch(`/api/admin/profiles?${params}`);
      if (res.ok) {
        setProfiles(await res.json());
        const total = Number(
          res.headers.get("X-Total-Count") ?? "0"
        );
        const pages = Number(
          res.headers.get("X-Page-Count") ??
            Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE))
        );
        setTotalCount(total);
        setPageCount(pages);
      }
    } finally {
      setProfilesLoading(false);
    }
  }, [search, page]);

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

  const saveCategory = async (
    cat: string,
    fields?: Record<string, string>
  ) => {
    setSavingCategory(cat);
    try {
      await Promise.all(
        Object.entries(fields ?? settings[cat] ?? {}).map(([key, value]) =>
          saveSetting(key, value)
        )
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

        <TabsContent value="general">
          <SettingsGeneralTab
            getSetting={getSetting}
            setSettingLocal={setSettingLocal}
            saveCategory={saveCategory}
            savingCategory={savingCategory}
          />
        </TabsContent>

        <TabsContent value="email">
          <SettingsEmailTab
            getSetting={getSetting}
            setSettingLocal={setSettingLocal}
            saveCategory={saveCategory}
            savingCategory={savingCategory}
          />
        </TabsContent>

        <TabsContent value="users">
          <SettingsUsersTab
            profiles={profiles}
            search={search}
            setSearch={(s) => {
              setSearch(s);
              setPage(1);
            }}
            toggleProfileStatus={toggleProfileStatus}
            openEdit={openEdit}
          />
          <PaginationControls
            page={page}
            pageCount={pageCount}
            total={totalCount}
            onPageChange={setPage}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        </TabsContent>

        <TabsContent value="security">
          <SettingsSecurityTab
            getSetting={getSetting}
            setSettingLocal={setSettingLocal}
            saveCategory={saveCategory}
            savingCategory={savingCategory}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <SettingsNotificationsTab
            getSetting={getSetting}
            setSettingLocal={setSettingLocal}
            saveCategory={saveCategory}
            savingCategory={savingCategory}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <SettingsAppearanceTab
            getSetting={getSetting}
            setSettingLocal={setSettingLocal}
            saveCategory={saveCategory}
            savingCategory={savingCategory}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <SettingsAccountsTab
            profiles={profiles}
            search={search}
            setSearch={(s) => {
              setSearch(s);
              setPage(1);
            }}
            roles={roles}
            expandedRow={expandedRow}
            setExpandedRow={setExpandedRow}
            toggleProfileStatus={toggleProfileStatus}
            changeProfileRole={changeProfileRole}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog (shared by users & accounts tabs) */}
      <SettingsEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        edit={edit}
        setEdit={setEdit}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
