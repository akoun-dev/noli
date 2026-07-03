"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Camera,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";

interface ProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  photoUrl: string | null;
  role: string;
  name: string;
  createdAt?: string;
}

export function ProfilePage() {
  const { user, setUser } = useAppStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user.id) return;
    try {
      const res = await fetch(`/api/profile?userId=${user.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data);
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setPhone(data.phone || "");
      setPhotoUrl(data.photoUrl || null);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger le profil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const data = await res.json();
      setPhotoUrl(data.url);

      // Also update in the store for the header avatar
      const newName = [firstName, lastName].filter(Boolean).join(" ") || user.name;
      setUser({ ...user, name: newName, avatarUrl: data.url });

      toast({ title: "Photo mise à jour", description: "Votre photo de profil a été modifiée." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de télécharger la photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, firstName, lastName, phone, photoUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const data = await res.json();
      setProfile(data);
      const newName = data.name || user.name;
      setUser({ ...user, name: newName, email: data.email, avatarUrl: data.photoUrl });

      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de sauvegarder",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword) {
      toast({ title: "Erreur", description: "Entrez un nouveau mot de passe", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour avec succès." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
      </div>

      {/* Profile Photo Card */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Photo de profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-lg font-semibold">
                {profile?.name || user.name || "Utilisateur"}
              </h2>
              <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email || user.email || "—"}
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Phone className="h-3.5 w-3.5" />
                    {profile.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Shield className="h-3.5 w-3.5" />
                  {profile?.role === "ADMIN"
                    ? "Administrateur"
                    : profile?.role === "INSURER"
                    ? "Assureur"
                    : "Utilisateur"}
                </div>
                {profile?.createdAt && (
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Calendar className="h-3.5 w-3.5" />
                    Membre depuis le{" "}
                    {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upload button mobile */}
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Changer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Card */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-firstname">Prénom</Label>
              <Input
                id="profile-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-lastname">Nom</Label>
              <Input
                id="profile-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Téléphone</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 XX XX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Adresse email</Label>
            <Input
              id="profile-email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas être modifié. Contactez le support si nécessaire.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="new-pw">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <X className="h-3 w-3" />
                Les mots de passe ne correspondent pas
              </p>
            )}
            {confirmPassword && newPassword && confirmPassword === newPassword && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Les mots de passe correspondent
              </p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSavePassword}
              disabled={savingPassword || !currentPassword || !newPassword}
              variant="outline"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Modifier le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}