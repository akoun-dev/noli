"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ShieldCheck,
  Receipt,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Menu,
  Loader2,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ── Helpers ──────────────────────────────────────────────────────
const fmtPrice = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const coverageLabel: Record<string, string> = {
  tiers: "Tiers",
  tiers_plus: "Tiers+",
  tous_risques: "Tous Risques",
};

const coverageBadge: Record<string, string> = {
  tiers: "bg-muted/60 text-muted-foreground",
  tiers_plus: "bg-secondary/15 text-secondary",
  tous_risques: "bg-accent/20 text-accent-foreground",
};

const statusLabel: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const statusBadge: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  in_progress: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

// ── Types ────────────────────────────────────────────────────────
interface Insurer {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logo?: string | null;
  rating: number;
  isVerified: boolean;
  isActive: boolean;
}

interface Offer {
  id: string;
  insurerId: string;
  name: string;
  coverageType: string;
  basePrice: number;
  description?: string | null;
  deductible: number;
  maxCoverage: number;
  features: string[];
  conditions?: string | null;
  isActive: boolean;
  insurer?: { name: string } | null;
}

interface Guarantee {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  category?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface Quote {
  id: string;
  reference: string;
  status: string;
  clientName?: string | null;
  insurerName?: string | null;
  offerName?: string | null;
  proposedPrice: number;
  finalPrice?: number | null;
  notes?: string | null;
  createdAt: string;
}

interface DashboardStats {
  activeInsurers: number;
  activeOffers: number;
  pendingQuotes: number;
  totalGuarantees: number;
  recentQuotes: Quote[];
}

// ── Navigation Items ─────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "insurers", label: "Assureurs", icon: Building2 },
  { id: "offers", label: "Offres", icon: FileText },
  { id: "guarantees", label: "Garanties", icon: ShieldCheck },
  { id: "quotes", label: "Devis", icon: Receipt },
];

// ── Sidebar Content (reused for desktop & sheet) ─────────────────
function SidebarNav({
  activeTab,
  onTabChange,
  onBack,
  onNavigate,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
  onBack: () => void;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          NOLI <span className="text-primary">Assurance</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Panneau d&apos;administration</p>
      </div>
      <Separator />
      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onNavigate?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
      <Separator />
      <div className="px-3 py-4">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Retour au site
        </button>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── DASHBOARD TAB ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      label: "Assureurs actifs",
      value: stats?.activeInsurers ?? 0,
      icon: Building2,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Offres actives",
      value: stats?.activeOffers ?? 0,
      icon: FileText,
      color: "bg-secondary/15 text-secondary",
    },
    {
      label: "Devis en attente",
      value: stats?.pendingQuotes ?? 0,
      icon: Receipt,
      color: "bg-orange-100 text-orange-700",
    },
    {
      label: "Garanties",
      value: stats?.totalGuarantees ?? 0,
      icon: ShieldCheck,
      color: "bg-accent/20 text-accent-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vue d&apos;ensemble de la plateforme NOLI Assurance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card border rounded-xl p-5 flex items-center gap-4"
            >
              <div
                className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                )}
                <p className="text-sm text-muted-foreground truncate">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent quotes */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Devis récents</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : !stats?.recentQuotes?.length ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
            Aucun devis pour le moment.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Assureur</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentQuotes.slice(0, 5).map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">
                        {q.reference}
                      </TableCell>
                      <TableCell>{q.clientName ?? "—"}</TableCell>
                      <TableCell>{q.insurerName ?? "—"}</TableCell>
                      <TableCell>{fmtPrice(q.proposedPrice)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusBadge[q.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {statusLabel[q.status] ?? q.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDate(q.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {stats.recentQuotes.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="bg-card border rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      {q.reference}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusBadge[q.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {statusLabel[q.status] ?? q.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {q.clientName ?? "Client inconnu"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{q.insurerName ?? "—"}</span>
                    <span className="font-semibold text-foreground">
                      {fmtPrice(q.proposedPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(q.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── ASSUREURS TAB ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function InsurersTab() {
  const { toast } = useToast();
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    rating: 3,
    isVerified: false,
    isActive: true,
  });

  const resetForm = () =>
    setForm({
      name: "",
      description: "",
      phone: "",
      email: "",
      website: "",
      rating: 3,
      isVerified: false,
      isActive: true,
    });

  const fetchInsurers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/insurers?${params.toString()}`);
      if (res.ok) setInsurers(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchInsurers();
  }, [fetchInsurers]);

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: Insurer) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      phone: item.phone ?? "",
      email: item.email ?? "",
      website: item.website ?? "",
      rating: item.rating,
      isVerified: item.isVerified,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Le nom est requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/insurers/${editing.id}`
        : "/api/admin/insurers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({
          title: editing
            ? "Assureur mis à jour"
            : "Assureur créé avec succès",
        });
        setDialogOpen(false);
        fetchInsurers();
      } else {
        toast({ title: "Erreur lors de l&apos;enregistrement", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cet assureur ?")) return;
    try {
      const res = await fetch(`/api/admin/insurers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Assureur supprimé" });
        fetchInsurers();
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assureurs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérer les compagnies d&apos;assurance partenaires
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4 mr-2" />
          Ajouter un assureur
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un assureur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !insurers.length ? (
        <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
          Aucun assureur trouvé.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Vérifié</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insurers.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium">{ins.name}</TableCell>
                    <TableCell>{ins.phone ?? "—"}</TableCell>
                    <TableCell>{ins.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="size-3.5 fill-primary text-primary" />
                        <span className="text-sm">{ins.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ins.isVerified ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 border-0"
                        >
                          Vérifié
                        </Badge>
                      ) : (
                        <Badge variant="outline">Non vérifié</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ins.isActive ? "default" : "outline"}
                        className={
                          ins.isActive
                            ? "bg-green-100 text-green-700 border-0"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {ins.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(ins)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ins.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {insurers.map((ins) => (
              <div
                key={ins.id}
                className="bg-card border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{ins.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ins.email ?? ins.phone ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 fill-primary text-primary" />
                    <span className="text-sm font-medium">{ins.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ins.isVerified ? (
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                      Vérifié
                    </Badge>
                  ) : null}
                  <Badge
                    className={
                      ins.isActive
                        ? "bg-green-100 text-green-700 border-0 text-xs"
                        : "bg-muted text-muted-foreground text-xs"
                    }
                  >
                    {ins.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(ins)}
                  >
                    <Pencil className="size-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(ins.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l&apos;assureur" : "Ajouter un assureur"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifiez les informations de l'assureur."
                : "Renseignez les informations du nouvel assureur."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ins-name">Nom *</Label>
              <Input
                id="ins-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: AXA Côte d'Ivoire"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-desc">Description</Label>
              <Textarea
                id="ins-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Description de l'assureur..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ins-phone">Téléphone</Label>
                <Input
                  id="ins-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+225 00 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ins-email">Email</Label>
                <Input
                  id="ins-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="contact@assureur.ci"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-website">Site web</Label>
              <Input
                id="ins-website"
                value={form.website}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://www.assureur.ci"
              />
            </div>
            <div className="space-y-2">
              <Label>Note ({form.rating}/5)</Label>
              <Slider
                value={[form.rating]}
                onValueChange={([v]) =>
                  setForm((f) => ({ ...f, rating: v }))
                }
                min={1}
                max={5}
                step={1}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ins-verified">Assureur vérifié</Label>
              <Switch
                id="ins-verified"
                checked={form.isVerified}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isVerified: v }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ins-active">Actif</Label>
              <Switch
                id="ins-active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── OFFRES TAB ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function OffersTab() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("all");
  const [filterCoverage, setFilterCoverage] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    insurerId: "",
    name: "",
    coverageType: "tiers" as string,
    basePrice: 0,
    description: "",
    deductible: 0,
    maxCoverage: 0,
    features: "",
    conditions: "",
    isActive: true,
  });

  const resetForm = () =>
    setForm({
      insurerId: "",
      name: "",
      coverageType: "tiers",
      basePrice: 0,
      description: "",
      deductible: 0,
      maxCoverage: 0,
      features: "",
      conditions: "",
      isActive: true,
    });

  const fetchInsurers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insurers?active=true");
      if (res.ok) setInsurers(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterInsurer && filterInsurer !== "all")
        params.set("insurerId", filterInsurer);
      if (filterCoverage && filterCoverage !== "all")
        params.set("coverageType", filterCoverage);
      const res = await fetch(`/api/admin/offers?${params.toString()}`);
      if (res.ok) setOffers(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filterInsurer, filterCoverage]);

  useEffect(() => {
    fetchInsurers();
  }, [fetchInsurers]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: Offer) => {
    setEditing(item);
    setForm({
      insurerId: item.insurerId,
      name: item.name,
      coverageType: item.coverageType,
      basePrice: item.basePrice,
      description: item.description ?? "",
      deductible: item.deductible,
      maxCoverage: item.maxCoverage,
      features: Array.isArray(item.features)
        ? item.features.join("\n")
        : "",
      conditions: item.conditions ?? "",
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.insurerId) {
      toast({
        title: "Le nom et l'assureur sont requis",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
      };
      const url = editing
        ? `/api/admin/offers/${editing.id}`
        : "/api/admin/offers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({
          title: editing
            ? "Offre mise à jour"
            : "Offre créée avec succès",
        });
        setDialogOpen(false);
        fetchOffers();
      } else {
        toast({
          title: "Erreur lors de l'enregistrement",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette offre ?")) return;
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Offre supprimée" });
        fetchOffers();
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offres</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérer les offres d&apos;assurance
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4 mr-2" />
          Ajouter une offre
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une offre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterInsurer} onValueChange={setFilterInsurer}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Assureur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les assureurs</SelectItem>
            {insurers.map((ins) => (
              <SelectItem key={ins.id} value={ins.id}>
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCoverage} onValueChange={setFilterCoverage}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Couverture" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="tiers">Tiers</SelectItem>
            <SelectItem value="tiers_plus">Tiers+</SelectItem>
            <SelectItem value="tous_risques">Tous Risques</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !offers.length ? (
        <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
          Aucune offre trouvée.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assureur</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type de couverture</TableHead>
                  <TableHead>Prix de base</TableHead>
                  <TableHead>Franchise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((ofr) => (
                  <TableRow key={ofr.id}>
                    <TableCell className="font-medium">
                      {ofr.insurer?.name ?? "—"}
                    </TableCell>
                    <TableCell>{ofr.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${coverageBadge[ofr.coverageType] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {coverageLabel[ofr.coverageType] ?? ofr.coverageType}
                      </span>
                    </TableCell>
                    <TableCell>{fmtPrice(ofr.basePrice)}</TableCell>
                    <TableCell>{fmtPrice(ofr.deductible)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ofr.isActive
                            ? "bg-green-100 text-green-700 border-0"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {ofr.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(ofr)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ofr.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {offers.map((ofr) => (
              <div
                key={ofr.id}
                className="bg-card border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{ofr.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ofr.insurer?.name ?? "—"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${coverageBadge[ofr.coverageType] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {coverageLabel[ofr.coverageType] ?? ofr.coverageType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Franchise: {fmtPrice(ofr.deductible)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {fmtPrice(ofr.basePrice)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      ofr.isActive
                        ? "bg-green-100 text-green-700 border-0 text-xs"
                        : "bg-muted text-muted-foreground text-xs"
                    }
                  >
                    {ofr.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(ofr)}
                  >
                    <Pencil className="size-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(ofr.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l&apos;offre" : "Ajouter une offre"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifiez les détails de l'offre."
                : "Créez une nouvelle offre d'assurance."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ofr-insurer">Assureur *</Label>
              <Select
                value={form.insurerId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, insurerId: v }))
                }
              >
                <SelectTrigger id="ofr-insurer" className="w-full">
                  <SelectValue placeholder="Sélectionner un assureur" />
                </SelectTrigger>
                <SelectContent>
                  {insurers.map((ins) => (
                    <SelectItem key={ins.id} value={ins.id}>
                      {ins.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofr-name">Nom *</Label>
              <Input
                id="ofr-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex: Formule Confort Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofr-coverage">Type de couverture</Label>
              <Select
                value={form.coverageType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, coverageType: v }))
                }
              >
                <SelectTrigger id="ofr-coverage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiers">Tiers</SelectItem>
                  <SelectItem value="tiers_plus">Tiers+</SelectItem>
                  <SelectItem value="tous_risques">Tous Risques</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ofr-price">Prix de base (FCFA) *</Label>
                <Input
                  id="ofr-price"
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      basePrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ofr-deductible">Franchise (FCFA)</Label>
                <Input
                  id="ofr-deductible"
                  type="number"
                  min={0}
                  value={form.deductible}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      deductible: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofr-max">Couverture maximale (FCFA)</Label>
              <Input
                id="ofr-max"
                type="number"
                min={0}
                value={form.maxCoverage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxCoverage: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofr-desc">Description</Label>
              <Textarea
                id="ofr-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofr-features">
                Caractéristiques (une par ligne)
              </Label>
              <Textarea
                id="ofr-features"
                value={form.features}
                onChange={(e) =>
                  setForm((f) => ({ ...f, features: e.target.value }))
                }
                placeholder={"Assistance dépannage 24/7\nVéhicule de replacement"}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ofr-conditions">Conditions</Label>
              <Textarea
                id="ofr-conditions"
                value={form.conditions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, conditions: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ofr-active">Active</Label>
              <Switch
                id="ofr-active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── GARANTIES TAB ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function GuaranteesTab() {
  const { toast } = useToast();
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Guarantee | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    category: "",
    sortOrder: 0,
    isActive: true,
  });

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const resetForm = () =>
    setForm({
      name: "",
      slug: "",
      description: "",
      icon: "",
      category: "",
      sortOrder: 0,
      isActive: true,
    });

  const fetchGuarantees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guarantees");
      if (res.ok) setGuarantees(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuarantees();
  }, [fetchGuarantees]);

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: Guarantee) => {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      icon: item.icon ?? "",
      category: item.category ?? "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Le nom est requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug || generateSlug(form.name);
      const payload = { ...form, slug };
      const url = editing
        ? `/api/admin/guarantees/${editing.id}`
        : "/api/admin/guarantees";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({
          title: editing
            ? "Garantie mise à jour"
            : "Garantie créée avec succès",
        });
        setDialogOpen(false);
        fetchGuarantees();
      } else {
        toast({
          title: "Erreur lors de l'enregistrement",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette garantie ?")) return;
    try {
      const res = await fetch(`/api/admin/guarantees/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Garantie supprimée" });
        fetchGuarantees();
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Garanties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérer les garanties disponibles
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-4 mr-2" />
          Ajouter une garantie
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !guarantees.length ? (
        <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
          Aucune garantie trouvée.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Icône</TableHead>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guarantees.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {g.slug}
                    </TableCell>
                    <TableCell>{g.category ?? "—"}</TableCell>
                    <TableCell>{g.icon ?? "—"}</TableCell>
                    <TableCell>{g.sortOrder}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          g.isActive
                            ? "bg-green-100 text-green-700 border-0"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {g.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(g)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(g.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {guarantees.map((g) => (
              <div
                key={g.id}
                className="bg-card border rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {g.slug}
                    </p>
                  </div>
                  <Badge
                    className={
                      g.isActive
                        ? "bg-green-100 text-green-700 border-0 text-xs"
                        : "bg-muted text-muted-foreground text-xs"
                    }
                  >
                    {g.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{g.category ?? "—"}</span>
                  <span>{g.icon ?? "—"}</span>
                  <span>Ordre: {g.sortOrder}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(g)}
                  >
                    <Pencil className="size-3.5 mr-1.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(g.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la garantie" : "Ajouter une garantie"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifiez les informations de la garantie."
                : "Renseignez les informations de la nouvelle garantie."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gua-name">Nom *</Label>
              <Input
                id="gua-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editing ? f.slug : generateSlug(name),
                  }));
                }}
                placeholder="Ex: Responsabilité civile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gua-slug">Slug</Label>
              <Input
                id="gua-slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="responsabilite-civile"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Généré automatiquement à partir du nom si vide
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gua-desc">Description</Label>
              <Textarea
                id="gua-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gua-icon">Icône</Label>
                <Input
                  id="gua-icon"
                  value={form.icon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="Shield"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gua-cat">Catégorie</Label>
                <Input
                  id="gua-cat"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="Ex: Protection"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gua-order">Ordre d&apos;affichage</Label>
              <Input
                id="gua-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="gua-active">Active</Label>
              <Switch
                id="gua-active"
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editing ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── DEVIS TAB ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
function QuotesTab() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    status: "pending",
    notes: "",
    finalPrice: 0,
  });

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "all")
        params.set("status", filterStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/quotes?${params.toString()}`);
      if (res.ok) setQuotes(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const openQuote = (q: Quote) => {
    setSelectedQuote(q);
    setForm({
      status: q.status,
      notes: q.notes ?? "",
      finalPrice: q.finalPrice ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedQuote) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedQuote.id,
          status: form.status,
          notes: form.notes || null,
          finalPrice: form.finalPrice || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Devis mis à jour" });
        setDialogOpen(false);
        fetchQuotes();
      } else {
        toast({
          title: "Erreur lors de la mise à jour",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Devis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulter et gérer les demandes de devis
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="approved">Approuvé</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !quotes.length ? (
        <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
          Aucun devis trouvé.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Assureur</TableHead>
                  <TableHead>Offre</TableHead>
                  <TableHead>Prix proposé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow
                    key={q.id}
                    className="cursor-pointer"
                    onClick={() => openQuote(q)}
                  >
                    <TableCell className="font-mono text-xs">
                      {q.reference}
                    </TableCell>
                    <TableCell>{q.clientName ?? "—"}</TableCell>
                    <TableCell>{q.insurerName ?? "—"}</TableCell>
                    <TableCell>{q.offerName ?? "—"}</TableCell>
                    <TableCell>{fmtPrice(q.proposedPrice)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusBadge[q.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {statusLabel[q.status] ?? q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(q.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="bg-card border rounded-xl p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openQuote(q)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {q.reference}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusBadge[q.status] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {statusLabel[q.status] ?? q.status}
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {q.clientName ?? "Client inconnu"}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {q.insurerName ?? "—"} · {q.offerName ?? "—"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {fmtPrice(q.proposedPrice)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(q.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gérer le devis</DialogTitle>
            <DialogDescription>
              {selectedQuote
                ? `Devis ${selectedQuote.reference} — ${selectedQuote.clientName ?? "Client inconnu"}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-3 text-sm">
              <div>
                <p className="text-muted-foreground">Assureur</p>
                <p className="font-medium">
                  {selectedQuote?.insurerName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Offre</p>
                <p className="font-medium">
                  {selectedQuote?.offerName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Prix proposé</p>
                <p className="font-medium">
                  {selectedQuote ? fmtPrice(selectedQuote.proposedPrice) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {selectedQuote ? fmtDate(selectedQuote.createdAt) : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-status">Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger id="q-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-price">Prix final (FCFA)</Label>
              <Input
                id="q-price"
                type="number"
                min={0}
                value={form.finalPrice}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    finalPrice: Number(e.target.value),
                  }))
                }
                placeholder="Laisser 0 pour utiliser le prix proposé"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-notes">Notes internes</Label>
              <Textarea
                id="q-notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Notes internes sur ce devis..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ── MAIN ADMIN PAGE ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
export function AdminPage() {
  const adminTab = useAppStore((s) => s.adminTab);
  const setAdminTab = useAppStore((s) => s.setAdminTab);
  const setView = useAppStore((s) => s.setView);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleTabChange = useCallback(
    (tab: string) => {
      setAdminTab(tab);
    },
    [setAdminTab]
  );

  const handleBack = useCallback(() => {
    setView("landing");
  }, [setView]);

  const handleSheetNavigate = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const renderTab = () => {
    switch (adminTab) {
      case "dashboard":
        return <DashboardTab />;
      case "insurers":
        return <InsurersTab />;
      case "offers":
        return <OffersTab />;
      case "guarantees":
        return <GuaranteesTab />;
      case "quotes":
        return <QuotesTab />;
      default:
        return <DashboardTab />;
    }
  };

  const currentTabLabel =
    navItems.find((n) => n.id === adminTab)?.label ?? "Tableau de bord";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Topbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center gap-4 h-14 px-4">
          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden size-9"
              >
                <Menu className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarNav
                activeTab={adminTab}
                onTabChange={handleTabChange}
                onBack={handleBack}
                onNavigate={handleSheetNavigate}
              />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              NOLI{" "}
              <span className="text-primary">Assurance</span>
            </h1>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Administration
            </span>
          </div>

          {/* Current tab indicator */}
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <Badge variant="outline" className="font-normal">
              {currentTabLabel}
            </Badge>
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Content ─────────────────────────────── */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r bg-muted/20 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
          <SidebarNav
            activeTab={adminTab}
            onTabChange={handleTabChange}
            onBack={handleBack}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}