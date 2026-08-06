"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Save,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  Camera,
  CheckCircle,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

/* ── Helpers ── */
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/* ── Component ── */
export default function UserProfilePage() {
  const { user, setUser, setView } = useAppStore();
  const { toast } = useToast();

  /* ── State ── */
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Errors
  const [passwordError, setPasswordError] = useState("");

  /* ── Fetch profile ── */
  const fetchProfile = useCallback(async () => {
    if (!user.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/profile`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      const p: UserProfile = data.profile;
      setProfile(p);
      setFirstName(p.firstName);
      setLastName(p.lastName);
      setPhone(p.phone);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => {
    if (user.isLoggedIn && user.id) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user.isLoggedIn, user.id, fetchProfile]);

  /* ── Not logged in ── */
  if (!user.isLoggedIn) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-full bg-primary/10 p-6 mx-auto w-fit mb-6">
            <User className="size-10 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Mon profil
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Connectez-vous pour accéder et gérer vos informations personnelles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              onClick={() => setView("login")}
            >
              <LogIn className="size-4" />
              Se connecter
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("register")}
            >
              Créer un compte
            </Button>
          </div>
        </motion.div>
      </section>
    );
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card skeleton */}
          <Card className="bg-card card-shadow rounded-xl">
            <CardContent className="p-6 flex flex-col items-center">
              <Skeleton className="size-[120px] rounded-full mb-4" />
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-52 mb-1" />
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
          {/* Forms skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card card-shadow rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-80" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-32 rounded-full" />
              </CardContent>
            </Card>
            <Card className="bg-card card-shadow rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-44 rounded-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  /* ── Save profile info ── */
  const handleSaveProfile = async () => {
    if (!user.id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, firstName, lastName, phone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }
      const newName = `${firstName} ${lastName}`.trim();
      setUser({ name: newName, phone });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations personnelles ont été enregistrées.",
      });
      fetchProfile();
    } catch (err) {
      toast({
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Impossible de sauvegarder.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!user.id) return;
    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error || "Erreur lors du changement de mot de passe"
        );
      }
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été changé avec succès.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Impossible de changer le mot de passe."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* ── Render ── */
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: Profile Info Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-card card-shadow rounded-xl">
            <CardContent className="p-6 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="size-[120px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold select-none">
                  {profile ? getInitials(profile.firstName, profile.lastName) : "U"}
                </div>
                <div className="absolute bottom-1 right-1 size-8 rounded-full bg-background border border-border flex items-center justify-center">
                  <Camera className="size-4 text-muted-foreground" />
                </div>
              </div>

              {/* Name */}
              <h2 className="text-xl font-bold mb-4">
                {profile?.name || `${firstName} ${lastName}`.trim() || "Utilisateur"}
              </h2>

              <Separator className="w-full mb-4" />

              {/* Info rows */}
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{profile?.email || ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {profile?.phone ? `+225 ${profile.phone}` : "Non renseigné"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="size-4 text-muted-foreground shrink-0" />
                  <Badge variant="secondary" className="text-xs">
                    {profile?.role || "utilisateur"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Membre depuis {profile?.createdAt ? formatDate(profile.createdAt) : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right column: Edit Forms ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-card card-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="size-5 text-primary" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Modifiez vos nom, prénom et numéro de téléphone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    L&apos;adresse e-mail ne peut pas être modifiée.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Save className="size-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Form 2: Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-card card-shadow rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="size-5 text-primary" />
                  Changer le mot de passe
                </CardTitle>
                <CardDescription>
                  Assurez la sécurité de votre compte avec un mot de passe fort.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showCurrent ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Nouveau mot de passe"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showNew ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-destructive">
                      Le mot de passe doit contenir au moins 6 caractères.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Confirmez le nouveau mot de passe"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showConfirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                </div>

                {passwordError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    {passwordError}
                  </p>
                )}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="size-4 mr-2" />
                    )}
                    Changer le mot de passe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}