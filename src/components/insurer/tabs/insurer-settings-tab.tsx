"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAppStore } from "@/store/app-store";
import {
  Building2,
  User,
  Save,
  Globe,
  Users,
  Lock,
  Mail,
  Phone,
  Upload,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function InsurerSettingsTab() {
  const { user } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user.name || "");
  const [profileEmail, setProfileEmail] = useState(user.email || "");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/user/profile").then((r) => r.json()).catch(() => ({})),
      fetch(`/api/insurer/me?userId=${user.id}`).then((r) => r.json()).catch(() => ({})),
    ])
      .then(([profileData, insurerData]) => {
        if (profileData.firstName) {
          setProfileName(
            [profileData.firstName, profileData.lastName].filter(Boolean).join(" ")
          );
        }
        if (profileData.email) setProfileEmail(profileData.email);
        if (profileData.phone) setCompanyPhone(profileData.phone);
        if (insurerData.name) setCompanyName(insurerData.name);
        if (insurerData.contactEmail) setCompanyEmail(insurerData.contactEmail);
        if (insurerData.logoUrl) setLogoUrl(insurerData.logoUrl);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleSaveCompany = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez renseigner le nom de l'entreprise.",
        variant: "destructive",
      });
      return;
    }
    setSavingCompany(true);
    try {
      const res = await fetch("/api/insurer/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          contactEmail: companyEmail,
          phone: companyPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Erreur",
          description: data.error || "Impossible d'enregistrer les informations.",
          variant: "destructive",
        });
        return;
      }
      setCompanyName(data.name || companyName);
      setCompanyEmail(data.contactEmail || companyEmail);
      setCompanyPhone(data.phone || companyPhone);
      toast({
        title: "Entreprise mise à jour",
        description: "Vos informations ont été enregistrées.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les informations.",
        variant: "destructive",
      });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveProfile = async () => {
    if (profilePassword && !profileCurrentPassword) {
      toast({
        title: "Mot de passe actuel requis",
        description: "Renseignez votre mot de passe actuel pour le modifier.",
        variant: "destructive",
      });
      return;
    }
    setSavingProfile(true);
    try {
      const [firstName = "", ...rest] = profileName.trim().split(" ");
      const lastName = rest.join(" ");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          currentPassword: profileCurrentPassword || undefined,
          newPassword: profilePassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de mettre à jour le profil.",
          variant: "destructive",
        });
        return;
      }
      setProfileName(data.profile?.name || profileName);
      setProfilePassword("");
      setProfileCurrentPassword("");
      toast({
        title: "Profil mis à jour",
        description: "Vos informations de connexion ont été enregistrées.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Utilisez PNG, JPG, WebP ou SVG.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2 Mo.",
        variant: "destructive",
      });
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const headers: Record<string, string> = {};
      if (user.id) headers["x-user-id"] = user.id;

      const res = await fetch("/api/insurer/logo", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
        return;
      }

      setLogoUrl(data.logoUrl);
      toast({ title: "Logo mis à jour", description: "Votre logo a été enregistré avec succès." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger le logo.", variant: "destructive" });
    } finally {
      setLogoUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les informations de votre entreprise et votre profil.
        </p>
      </div>

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!loading && (
        <>
          {/* Logo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand">
                  <ImageIcon className="h-5 w-5 text-black" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Logo de l&apos;entreprise
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Votre logo sera affiché sur vos offres et garanties
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Logo preview */}
                <div className="relative group">
                  <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden bg-muted/30">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  {logoUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-xl">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    {logoUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {logoUrl ? "Changer le logo" : "Télécharger le logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP ou SVG — Max 2 Mo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand">
                  <Building2 className="h-5 w-5 text-black" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Informations de l&apos;entreprise
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Détails de votre compagnie d&apos;assurance
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nom de l&apos;entreprise</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Société Ivoirienne d'Assurance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email de contact</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="contact@assureur.ci"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-phone"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="+225 XX XX XX XX"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">Site web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-website"
                      placeholder="www.assureur.ci"
                      className="pl-9"
                      disabled
                    />
                  </div>
                </div>
              </div>
              <Button
                className="bg-brand text-black hover:bg-brand-hover"
                onClick={handleSaveCompany}
                disabled={savingCompany}
              >
                {savingCompany ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {savingCompany ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>

          {/* Profile info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Mon profil utilisateur
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Vos informations de connexion
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nom complet</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="profile-password">
                  Changer le mot de passe
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-current-password"
                      type="password"
                      value={profileCurrentPassword}
                      onChange={(e) => setProfileCurrentPassword(e.target.value)}
                      placeholder="Mot de passe actuel"
                      className="pl-9"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profile-password"
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Nouveau mot de passe"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {savingProfile ? "Enregistrement…" : "Mettre à jour le profil"}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Préférences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mode sombre</p>
                  <p className="text-xs text-muted-foreground">
                    Activez le thème sombre pour l&apos;interface
                  </p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Langue</p>
                  <p className="text-xs text-muted-foreground">
                    Langue de l&apos;interface
                  </p>
                </div>
                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                  🇫🇷 Français
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Équipe</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gérez les membres de votre équipe assureur
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed bg-card/40 p-6 text-center">
                <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-3 mx-auto w-fit mb-3">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-sm font-medium mb-1">
                  Gestion d&apos;équipe bientôt disponible
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                  Invitez des collaborateurs, attribuez des rôles et gérez les permissions d&apos;accès à votre espace assureur.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["Administrateur", "Gestionnaire", "Lecteur"].map((role) => (
                    <span
                      key={role}
                      className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border/40"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}