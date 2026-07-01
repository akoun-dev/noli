"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Loader2, Users, Building, Globe, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────
interface User {
  id: string; email: string; name: string | null; phone: string | null;
  role: string; isActive: boolean; createdAt: string;
  _count: { quotes: number };
}

const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const roleLabels: Record<string, string> = {
  USER: "Utilisateur",
  ADMIN: "Administrateur",
};

const roleColors: Record<string, string> = {
  USER: "bg-slate-100 text-slate-800",
  ADMIN: "bg-amber-100 text-amber-800",
};

// ── Main component ───────────────────────────────────────────────
export function SettingsTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", role: "USER" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      !search ||
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({ name: u.name || "", phone: u.phone || "", role: u.role });
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editUser.id, ...editForm }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Utilisateur modifié" });
      setEditUser(null);
      fetchUsers();
    } catch {
      toast({ title: "Erreur de modification", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
      });
      fetchUsers();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Building className="h-4 w-4" /> Configuration
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ──────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
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
                  <TableHead>Date inscription</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[u.role] || ""}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{u._count.quotes}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={u.isActive}
                        onCheckedChange={() => handleToggleActive(u)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Aucun utilisateur trouvé.
              </p>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {u.name || u.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[u.role] || ""}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs mb-3">
                  {u.phone && <Badge variant="outline">{u.phone}</Badge>}
                  <Badge variant="outline">{u._count.quotes} devis</Badge>
                  <Badge variant="outline">{fmtDate(u.createdAt)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Switch
                    checked={u.isActive}
                    onCheckedChange={() => handleToggleActive(u)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(u)}
                  >
                    Modifier
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Config Tab ─────────────────────────────────────────── */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5" />
                Configuration générale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Nom du site</Label>
                  <p className="font-medium text-lg">NOLI Assurance</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Devise</Label>
                  <p className="font-medium text-lg">FCFA</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Pays</Label>
                  <p className="font-medium text-lg">Côte d&apos;Ivoire</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Version</Label>
                  <p className="font-medium text-lg">1.0.0</p>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                La configuration avancée sera disponible dans une prochaine version.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit User Dialog ─────────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {editUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Téléphone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Rôle</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={saving}
              className="bg-[#B9E54D] text-black hover:bg-[#a5d044]"
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