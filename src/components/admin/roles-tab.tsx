"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Plus, Pencil, Trash2, Lock, Users, Check, X,
  ChevronDown, ChevronRight, Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  label?: string;
  description: string;
  permissions: Permission[];
  permissionCount: number;
  isDefault: boolean;
}

interface PermissionsByCategory {
  [category: string]: Permission[];
}

const CATEGORY_LABELS: Record<string, string> = {
  settings: "Paramètres",
  users: "Utilisateurs",
  offers: "Offres",
  quotes: "Devis",
  insurers: "Assureurs",
  coverages: "Garanties",
  backups: "Sauvegardes",
  audit: "Audit",
  roles: "Rôles",
};

const CATEGORY_ORDER = [
  "settings", "users", "insurers", "offers", "coverages", "quotes", "backups", "audit", "roles",
];

export function RolesTab() {
  const { toast } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissionIds, setFormPermissionIds] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      if (res.ok) {
        const data = await res.json();
        const list: Role[] = Array.isArray(data) ? data : (data.roles || []);
        setRoles(list);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setAllPermissions(data.permissions || {});
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const getRolePermIds = (role: Role) => role.permissions.map((p) => p.id);

  const selectRole = (role: Role) => {
    setSelectedRoleId(role.id);
    setSelectedPermIds(getRolePermIds(role));
  };

  // Open dialog for create
  const openCreate = () => {
    setEditingRole(null);
    setFormName("");
    setFormDescription("");
    setFormPermissionIds([]);
    setDialogOpen(true);
  };

  // Open dialog for edit
  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description);
    setFormPermissionIds(getRolePermIds(role));
    setDialogOpen(true);
  };

  // Save role (create or update)
  const handleSaveRole = async () => {
    if (!formName.trim()) {
      toast({ title: "Erreur", description: "Le nom du rôle est requis.", variant: "destructive" });
      return;
    }
    setSavingRole(true);
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";
      const method = editingRole ? "PUT" : "POST";
      const body: { name?: string; description?: string; permissionIds: string[] } = {
        permissionIds: formPermissionIds,
      };
      if (editingRole) {
        body.name = formName;
        body.description = formDescription;
      } else {
        body.name = formName;
        body.description = formDescription || undefined;
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Succès", description: editingRole ? "Rôle mis à jour." : "Rôle créé." });
        setDialogOpen(false);
        fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Erreur", description: err.error || "Impossible d'enregistrer le rôle.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur réseau.", variant: "destructive" });
    } finally {
      setSavingRole(false);
    }
  };

  // Delete role
  const handleDeleteRole = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Succès", description: "Rôle supprimé." });
        if (selectedRoleId === id) setSelectedRoleId(null);
        fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Erreur", description: err.error || "Impossible de supprimer.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur réseau.", variant: "destructive" });
    }
  };

  // Save permissions for selected role
  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingPermissions(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: selectedPermIds }),
      });
      if (res.ok) {
        toast({ title: "Succès", description: "Permissions enregistrées." });
        fetchRoles();
      } else {
        toast({ title: "Erreur", description: "Impossible d'enregistrer les permissions.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur réseau.", variant: "destructive" });
    } finally {
      setSavingPermissions(false);
    }
  };

  // Toggle a permission
  const togglePerm = (permId: string, isForm: boolean) => {
    if (isForm) {
      setFormPermissionIds((prev) =>
        prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
      );
    } else {
      setSelectedPermIds((prev) =>
        prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
      );
    }
  };

  // Select all / deselect all for a category
  const toggleAllCategory = (cat: string, check: boolean, isForm: boolean) => {
    const catPerms = allPermissions[cat] || [];
    const catIds = catPerms.map((p) => p.id);
    const setter = isForm ? setFormPermissionIds : setSelectedPermIds;
    setter((prev) => {
      const filtered = prev.filter((id) => !catIds.includes(id));
      return check ? [...filtered, ...catIds] : filtered;
    });
  };

  const renderPermissionsGroup = (
    category: string,
    perms: Permission[],
    currentIds: string[],
    onToggle: (id: string) => void,
    onToggleAll: (check: boolean) => void,
    isExpanded: boolean,
    onToggleExpand: () => void,
    showActions: boolean,
  ) => {
    const allChecked = perms.length > 0 && perms.every((p) => currentIds.includes(p.id));
    const someChecked = perms.some((p) => currentIds.includes(p.id));
    const label = CATEGORY_LABELS[category] || category;

    return (
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-2 rounded-md hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium text-sm">{label}</span>
            <Badge variant="outline" className="text-xs">{perms.length}</Badge>
            {someChecked && !allChecked && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Partiel</Badge>}
            {allChecked && <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Tous</Badge>}
          </div>
          {showActions && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onToggleAll(true); }}
              >
                Tout
              </button>
              <span className="text-muted-foreground">/</span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onToggleAll(false); }}
              >
                Aucun
              </button>
            </div>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9 pb-2">
            {perms.map((perm) => (
              <label key={perm.id} className="flex items-start gap-3 py-1.5 cursor-pointer group">
                <Checkbox
                  checked={currentIds.includes(perm.id)}
                  onCheckedChange={() => onToggle(perm.id)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium group-hover:text-foreground">{perm.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{perm.code}</p>
                </div>
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Render roles list
  const renderRolesList = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    const customRoles = roles.filter((r) => !r.isDefault);
    const defaultRoles = roles.filter((r) => r.isDefault);

    if (roles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground p-4">
          <Shield className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Aucun rôle</p>
          <p className="text-sm text-center mt-1">Les rôles par défaut seront créés automatiquement.</p>
        </div>
      );
    }

    return (
      <div className="space-y-1 p-2">
        {/* Default roles */}
        {defaultRoles.map((role) => (
          <button
            key={role.id}
            onClick={() => selectRole(role)}
            className={`w-full text-left rounded-lg p-3 transition-colors ${
              selectedRoleId === role.id
                ? "bg-[#B9E54D]/10 border border-[#B9E54D]/40"
                : "hover:bg-muted border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-sm">{role.label || role.name}</span>
              </div>
              <Badge variant="outline" className="text-xs">Par défaut</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{role.description}</p>
            <span className="text-xs text-muted-foreground">{role.permissionCount} permission{role.permissionCount !== 1 ? "s" : ""}</span>
          </button>
        ))}

        {defaultRoles.length > 0 && customRoles.length > 0 && <Separator className="my-2" />}

        {/* Custom roles */}
        {customRoles.map((role) => (
          <button
            key={role.id}
            onClick={() => selectRole(role)}
            className={`w-full text-left rounded-lg p-3 transition-colors ${
              selectedRoleId === role.id
                ? "bg-[#B9E54D]/10 border border-[#B9E54D]/40"
                : "hover:bg-muted border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{role.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); openEdit(role); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
                      <AlertDialogDescription>
                        Voulez-vous vraiment supprimer le rôle <strong>{role.name}</strong> ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteRole(role.id)} className="bg-red-600 hover:bg-red-700">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{role.description}</p>
            <span className="text-xs text-muted-foreground">{role.permissionCount} permission{role.permissionCount !== 1 ? "s" : ""}</span>
          </button>
        ))}
      </div>
    );
  };

  // Render permissions panel for selected role
  const renderPermissionsPanel = (permIds: string[], onToggle: (id: string) => void, onToggleAll: (cat: string, check: boolean) => void, isDialog: boolean) => {
    const categories = CATEGORY_ORDER.filter((cat) => allPermissions[cat] && allPermissions[cat].length > 0);

    if (categories.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Chargement des permissions...
        </div>
      );
    }

    return categories.map((cat) => (
      <div key={cat}>
        {renderPermissionsGroup(
          cat,
          allPermissions[cat],
          permIds,
          onToggle,
          (check) => onToggleAll(cat, check),
          isDialog || expandedCategories.includes(cat),
          () => toggleCategory(cat),
          !isDialog,
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rôles &amp; Permissions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les rôles et les permissions d&apos;accès de la plateforme.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#B9E54D] text-black hover:bg-[#a5d044]">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="hidden lg:flex gap-6">
        {/* Roles list */}
        <div className="w-80 shrink-0 rounded-lg border bg-card overflow-y-auto max-h-[calc(100vh-220px)]">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rôles ({roles.length})
            </h3>
          </div>
          {renderRolesList()}
        </div>

        {/* Permissions panel */}
        <div className="flex-1 rounded-lg border bg-card p-6 overflow-y-auto max-h-[calc(100vh-220px)]">
          {selectedRole ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedRole.label || selectedRole.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                </div>
                <Badge variant="outline">{selectedPermIds.length} / {Object.values(allPermissions).flat().length}</Badge>
              </div>
              <Separator className="mb-4" />
              {renderPermissionsPanel(selectedPermIds, (id) => togglePerm(id, false), (cat, check) => toggleAllCategory(cat, check, false), false)}
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions || selectedRole.isDefault}
                  className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                >
                  {savingPermissions ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer les permissions
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Shield className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Sélectionnez un rôle</p>
              <p className="text-sm">Choisissez un rôle dans la liste pour voir et modifier ses permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="lg:hidden space-y-6">
        <div className="rounded-lg border bg-card">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Rôles ({roles.length})
            </h3>
          </div>
          {renderRolesList()}
        </div>

        {selectedRole && (
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{selectedRole.label || selectedRole.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">{selectedPermIds.length}</Badge>
              </div>
              <Separator className="mb-4" />
              {renderPermissionsPanel(selectedPermIds, (id) => togglePerm(id, false), (cat, check) => toggleAllCategory(cat, check, false), false)}
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions || selectedRole.isDefault}
                  size="sm"
                  className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
                >
                  {savingPermissions ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Modifier le rôle" : "Nouveau rôle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nom du rôle *</Label>
              <Input
                id="role-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Éditeur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">Description</Label>
              <Textarea
                id="role-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description du rôle..."
                rows={2}
              />
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Permissions</h4>
              {renderPermissionsPanel(formPermissionIds, (id) => togglePerm(id, true), (cat, check) => toggleAllCategory(cat, check, true), true)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSaveRole}
              disabled={savingRole}
              className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
            >
              {savingRole ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingRole ? "Enregistrer" : "Créer le rôle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}