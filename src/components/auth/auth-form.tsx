"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Zap,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  UserRound,
  Shield,
  Globe,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { fetchWithTimeout, isTimeoutError } from "@/lib/fetch-with-timeout";

/* ── Type partagé : contexte d'affichage ─────────────────────────── */

export type AuthFormMode = "page" | "modal";

/* ── Password Strength ── */

export function PasswordStrength({ password }: { password: string }) {
  const strength = useCallback((pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }, []);

  const score = strength(password);
  if (!password) return null;

  const labels = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
    "bg-accent",
  ];

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? colors[score - 1] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[score - 1] || ""}</p>
    </div>
  );
}

/* ── Validation helpers ── */

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const hasMinLength = (v: string, min: number) => v.length >= min;

/* ── Redirection post-authentification par rôle ── */

function useAuthRedirect(mode: AuthFormMode) {
  const { setView, setAuthModal } = useAppStore();
  return useCallback(
    (role: string) => {
      if (mode === "modal") setAuthModal("none");
      if (role === "ADMIN") {
        setView("admin");
      } else if (role === "INSURER") {
        setView("insurer-dashboard");
      } else {
        setView("user-dashboard");
      }
    },
    [mode, setView, setAuthModal]
  );
}

/* ── Login Form ── */

export function LoginForm({ mode }: { mode: AuthFormMode }) {
  const { setView, setAuthModal, setUser } = useAppStore();
  const { toast } = useToast();
  const redirect = useAuthRedirect(mode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email) e.email = "L'email est requis";
    else if (!isValidEmail(email)) e.email = "Adresse email invalide";
    if (!password) e.password = "Le mot de passe est requis";
    else if (!hasMinLength(password, 6))
      e.password = "Le mot de passe doit contenir au moins 6 caractères";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetchWithTimeout("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erreur",
          description: data.error || "Identifiants incorrects",
          variant: "destructive",
        });
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        isLoggedIn: true,
      });

      toast({
        title: "Connexion réussie",
        description: `Bonjour, ${data.user.name} !`,
      });

      redirect(data.user.role);
    } catch (err) {
      toast({
        title: "Erreur",
        description: isTimeoutError(err)
          ? "Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez."
          : "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const switchTo = (view: "forgot" | "register") => {
    if (mode === "modal") setAuthModal(view);
    else setView(view);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "page" && (
        <div className="mb-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Connexion à votre espace NOLI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accédez à vos devis et à votre profil.
          </p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          aria-invalid={!!errors.email}
          className={`w-full ${errors.email ? "border-destructive" : ""}`}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="votre mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            className={`w-full pr-10 ${errors.password ? "border-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => switchTo("forgot")}
          className="text-sm text-primary hover:underline"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Zap className="size-4" />
            Se connecter
          </>
        )}
      </Button>

      <Separator className="my-4" />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={() => switchTo("register")}
          className="text-primary font-medium hover:underline"
        >
          S&apos;inscrire
        </button>
      </p>
    </form>
  );
}

/* ── Register Form (step wizard) ── */

export function RegisterForm({ mode }: { mode: AuthFormMode }) {
  const { setView, setAuthModal, setUser } = useAppStore();
  const { toast } = useToast();
  const redirect = useAuthRedirect(mode);

  const [step, setStep] = useState(1);

  // Step 1: Profile
  const [role, setRole] = useState("USER");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Step 2: Identity
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3: Company (INSURER only)
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Step 4: Security (or Step 3 for USER)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};

    if (step === 1) {
      if (!acceptTerms) e.terms = "Vous devez accepter les conditions d'utilisation";
    }

    if (step === 2) {
      if (!fullName.trim()) e.fullName = "Le nom complet est requis";
      if (!email) e.email = "L'email est requis";
      else if (!isValidEmail(email)) e.email = "Adresse email invalide";
    }

    if (step === 3 && role === "INSURER") {
      if (!companyName.trim()) e.companyName = "Le nom de l'entreprise est requis";
    }

    if ((step === 3 && role !== "INSURER") || (step === 4)) {
      if (!password) e.password = "Le mot de passe est requis";
      else if (!hasMinLength(password, 6))
        e.password = "Le mot de passe doit contenir au moins 6 caractères";
      if (password !== confirmPassword)
        e.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: fullName,
        email,
        phone,
        password,
        role,
      };
      if (role === "INSURER") {
        payload.companyName = companyName;
        payload.companyEmail = companyEmail || undefined;
        payload.companyPhone = companyPhone || undefined;
        payload.companyWebsite = companyWebsite || undefined;
      }

      const res = await fetchWithTimeout("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de créer le compte",
          variant: "destructive",
        });
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        isLoggedIn: true,
      });

      toast({
        title: "Compte créé",
        description:
          data.user.role === "INSURER"
            ? "Compte créé ! Un administrateur doit activer votre espace assureur avant sa première utilisation."
            : `Bienvenue, ${data.user.name} ! Votre compte a été créé avec succès.`,
      });

      redirect(data.user.role);
    } catch (err) {
      toast({
        title: "Erreur",
        description: isTimeoutError(err)
          ? "Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez."
          : "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ── Step config ── */
  const totalSteps = role === "INSURER" ? 4 : 3;
  const stepLabels = role === "INSURER"
    ? ["Profil", "Identité", "Entreprise", "Sécurité"]
    : ["Profil", "Identité", "Sécurité"];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
      {stepLabels.map((label, i) => {
        const num = i + 1;
        const isCompleted = num < step;
        const isCurrent = num === step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isCompleted
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : num}
            </div>
            <span className={`text-xs ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <div className={`h-px w-8 ${isCompleted ? "bg-emerald-500" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Role cards ── */
  const roleCards = [
    {
      value: "USER",
      label: "Utilisateur",
      description: "Souscrire des assurances et suivre mes devis",
      icon: UserRound,
      features: ["Comparez les offres", "Recevez des devis", "Suivez vos contrats"],
    },
    {
      value: "INSURER",
      label: "Assureur",
      description: "Gérer mes offres, garanties et devis",
      icon: Shield,
      features: ["Créez des offres", "Gérez vos garanties", "Consultez les devis"],
    },
  ];

  /* ── Step 1: Profile ── */
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-base font-semibold">Qui êtes-vous ?</h3>
        <p className="text-xs text-muted-foreground mt-1">Choisissez le profil qui vous correspond</p>
      </div>

      <div className="space-y-3">
        {roleCards.map((card) => {
          const Icon = card.icon;
          const isSelected = role === card.value;
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => { setRole(card.value); clearError("role"); }}
              className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30 bg-card"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{card.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {card.description}
                </p>
                {isSelected && (
                  <ul className="mt-2 space-y-0.5">
                    {card.features.map((f) => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="reg-terms"
          checked={acceptTerms}
          onCheckedChange={(v) => {
            setAcceptTerms(v === true);
            clearError("terms");
          }}
          className={errors.terms ? "border-destructive" : ""}
        />
        <Label htmlFor="reg-terms" className="text-xs font-normal leading-snug cursor-pointer">
          J&apos;accepte les{" "}
          <span className="text-primary hover:underline cursor-pointer font-medium">
            conditions d&apos;utilisation
          </span>{" "}
          et la{" "}
          <span className="text-primary hover:underline cursor-pointer font-medium">
            politique de confidentialité
          </span>
        </Label>
      </div>
      {errors.terms && (
        <p className="text-xs text-destructive">{errors.terms}</p>
      )}
    </div>
  );

  /* ── Step 2: Identity ── */
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-semibold">Vos informations</h3>
        <p className="text-xs text-muted-foreground mt-1">Complétez vos coordonnées personnelles</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-name">Nom complet</Label>
        <Input
          id="reg-name"
          placeholder="Jean Dupont"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearError("fullName");
          }}
          aria-invalid={!!errors.fullName}
          className={`w-full ${errors.fullName ? "border-destructive" : ""}`}
        />
        {errors.fullName && (
          <p className="text-xs text-destructive">{errors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          aria-invalid={!!errors.email}
          className={`w-full ${errors.email ? "border-destructive" : ""}`}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-phone">
          Téléphone <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Input
          id="reg-phone"
          type="tel"
          placeholder="+225 07 XX XX XX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );

  /* ── Step 3: Security ── */
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-semibold">Sécurisez votre compte</h3>
        <p className="text-xs text-muted-foreground mt-1">Choisissez un mot de passe sécurisé</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Mot de passe</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            aria-invalid={!!errors.password}
            className={`w-full pr-10 ${errors.password ? "border-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <PasswordStrength password={password} />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirmer le mot de passe</Label>
        <div className="relative">
          <Input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearError("confirmPassword");
            }}
            aria-invalid={!!errors.confirmPassword}
            className={`w-full pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderStepIndicator()}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < totalSteps) handleNext();
          else handleSubmit();
        }}
        className="space-y-4"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && role === "INSURER" && (
          <div className="space-y-4 pt-2">
            <div className="text-center">
              <h3 className="text-base font-semibold">Votre entreprise</h3>
              <p className="text-xs text-muted-foreground mt-1">Détails de votre compagnie d'assurance</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-company">
                Nom de l'entreprise <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reg-company"
                placeholder="Société Ivoirienne d'Assurance"
                value={companyName}
                onChange={(e) => { setCompanyName(e.target.value); clearError("companyName"); }}
                className={`w-full ${errors.companyName ? "border-destructive" : ""}`}
              />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-company-email">Email professionnel</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="reg-company-email"
                  type="email"
                  placeholder="contact@assureur.ci"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-company-phone">Téléphone</Label>
              <Input
                id="reg-company-phone"
                type="tel"
                placeholder="+225 01 XX XX XX XX"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-company-site">Site web</Label>
              <Input
                id="reg-company-site"
                type="url"
                placeholder="www.assureur.ci"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}
        {((step === 3 && role !== "INSURER") || step === 4) && renderStep3()}

        <div className="flex items-center justify-between pt-2">
          <div>
            {step > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}
          </div>
          {step < totalSteps ? (
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              onClick={handleNext}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Zap className="size-4" />
                  Créer mon compte
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <Separator className="my-5" />

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <button
          type="button"
          onClick={() => (mode === "modal" ? setAuthModal("login") : setView("login"))}
          className="text-primary font-medium hover:underline"
        >
          Se connecter
        </button>
      </p>
    </>
  );
}

/* ── Forgot Password Form ── */

interface RecoveryTokens {
  token: string;
}

/** Extrait le token de récupération de l'URL locale (?token=...). */
function parseRecoveryToken(url: URL): RecoveryTokens | null {
  const token = url.searchParams.get("token");
  return token ? { token } : null;
}

/** Nettoie l'URL (query params + hash) sans recharger la page. */
function cleanUrl() {
  window.history.replaceState(null, "", window.location.pathname);
}

export function ForgotPasswordForm({ mode }: { mode: AuthFormMode }) {
  const { setView, setAuthModal } = useAppStore();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Étape 2 : lien de réinitialisation local (?token=...).
  const [recovery, setRecovery] = useState<RecoveryTokens | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = parseRecoveryToken(url);
    if (token) {
      setRecovery(token);
      cleanUrl();
    }
  }, []);

  const backToLogin = () => (mode === "modal" ? setAuthModal("login") : setView("login"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("L'email est requis");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Adresse email invalide");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetchWithTimeout("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSent(true);
      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte de réception.",
      });
    } catch (err) {
      setError(
        isTimeoutError(err)
          ? "Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez."
          : "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recovery) return;
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: recovery.token,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setResetDone(true);
      toast({
        title: "Mot de passe réinitialisé",
        description: "Connectez-vous avec votre nouveau mot de passe.",
      });
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 2 : succès ──
  if (recovery && resetDone) {
    return (
      <div className="space-y-4 text-center py-4">
        <h3 className="font-semibold text-lg">Mot de passe réinitialisé</h3>
        <p className="text-sm text-muted-foreground">
          Votre mot de passe a bien été mis à jour. Vous pouvez vous connecter.
        </p>
        <Button variant="outline" className="mt-2" onClick={backToLogin}>
          <ArrowRight className="size-4 rotate-180" />
          Retour à la connexion
        </Button>
      </div>
    );
  }

  // ── Étape 2 : choix du nouveau mot de passe ──
  if (recovery) {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <div className="space-y-2">
          <Label htmlFor="reset-password">Nouveau mot de passe</Label>
          <Input
            id="reset-password"
            type="password"
            placeholder="Au moins 8 caractères"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={!!error}
            className={`w-full ${error ? "border-destructive" : ""}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm">Confirmer le mot de passe</Label>
          <Input
            id="reset-confirm"
            type="password"
            placeholder="Re-saisissez votre mot de passe"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={!!error}
            className={`w-full ${error ? "border-destructive" : ""}`}
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>

        <p className="text-center">
          <button
            type="button"
            onClick={backToLogin}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la connexion
          </button>
        </p>
      </form>
    );
  }

  // ── Étape 1 : demande d'envoi du lien ──
  if (sent) {
    return (
      <div className="space-y-4 text-center py-4">
        <h3 className="font-semibold text-lg">Vérifiez votre email</h3>
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec cet email, vous recevrez un lien de
          réinitialisation.
        </p>
        <Button variant="outline" className="mt-2" onClick={backToLogin}>
          <ArrowRight className="size-4 rotate-180" />
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Entrez l&apos;adresse email associée à votre compte. Nous vous
        enverrons un lien de réinitialisation.
      </p>

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          aria-invalid={!!error}
          className={`w-full ${error ? "border-destructive" : ""}`}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Envoyer le lien"
        )}
      </Button>

      <p className="text-center">
        <button
          type="button"
          onClick={backToLogin}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Retour à la connexion
        </button>
      </p>
    </form>
  );
}
