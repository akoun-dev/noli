"use client";

import { useState, useCallback, useEffect } from "react";
import { Eye, EyeOff, Loader2, Zap, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Check, UserRound, Shield, Globe } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

/* ── Password Strength ── */
function PasswordStrength({ password }: { password: string }) {
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

  const labels = ["Tr\u00e8s faible", "Faible", "Moyen", "Fort", "Tr\u00e8s fort"];
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
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const hasMinLength = (v: string, min: number) => v.length >= min;

/* ── Login Page ── */
function LoginPage() {
  const { setView, setUser } = useAppStore();
  const { toast } = useToast();

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
      e.password = "Le mot de passe doit contenir au moins 6 caract\u00e8res";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
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
        title: "Connexion r\u00e9ussie",
        description: `Bonjour, ${data.user.name} !`,
      });

      // Redirect by role
      if (data.user.role === "ADMIN") {
        setView("admin");
      } else if (data.user.role === "INSURER") {
        setView("insurer-dashboard");
      } else {
        setView("user-dashboard");
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez r\u00e9essayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold tracking-tight">Se connecter</h1>
        <p className="text-muted-foreground mt-2">
          Accédez à votre espace NOLI Assurance
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className={errors.email ? "border-destructive" : ""}
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
              className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
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
            onClick={() => setView("forgot")}
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
      </form>

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <button
          onClick={() => setView("register")}
          className="text-primary font-medium hover:underline"
        >
          S&apos;inscrire
        </button>
      </p>

      <div className="mt-4">
        <button
          onClick={() => setView("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Retour à l&apos;accueil
        </button>
      </div>
    </div>
  );
}

/* ── Register Page (step wizard) ── */
function RegisterPage() {
  const { setView, setUser } = useAppStore();
  const { toast } = useToast();

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
        action: "register",
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

      const res = await fetch("/api/auth", {
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
        description: `Bienvenue, ${data.user.name} ! Votre compte a été créé avec succès.`,
      });

      // Redirect by role
      if (data.user.role === "ADMIN") {
        setView("admin");
      } else if (data.user.role === "INSURER") {
        setView("insurer-dashboard");
      } else {
        setView("user-dashboard");
      }
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
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
    <div className="flex items-center justify-center gap-2 mb-4">
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
          className={errors.fullName ? "border-destructive" : ""}
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
          className={errors.email ? "border-destructive" : ""}
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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-14 w-auto mx-auto mb-3" />
        <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Rejoignez NOLI Assurance pour comparer et souscrire
        </p>
      </div>

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
          onClick={() => setView("login")}
          className="text-primary font-medium hover:underline"
        >
          Se connecter
        </button>
      </p>

      <div className="mt-4 text-center">
        <button
          onClick={() => setView("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Retour à l&apos;accueil
        </button>
      </div>
    </div>
  );
}

/* ── Forgot Password Page ── */
function ForgotPasswordPage() {
  const { setView } = useAppStore();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("L'email est requis");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Email invalide");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgot", email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSent(true);
      toast({
        title: "Email envoy\u00e9",
        description: "V\u00e9rifiez votre bo\u00eete de r\u00e9ception.",
      });
    } catch {
      setError("Une erreur est survenue. Veuillez r\u00e9essayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {sent ? (
        <div className="text-center space-y-4 py-8">
          <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-16 w-auto mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">V\u00e9rifiez votre email</h1>
          <p className="text-muted-foreground">
            Si un compte existe avec cet email, vous recevrez un lien de
            r\u00e9initialisation.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setView("login")}
          >
            <ArrowRight className="size-4 rotate-180" />
            Retour \u00e0 la connexion
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
            <p className="text-muted-foreground mt-2">
              R\u00e9initialisez votre mot de passe
            </p>
          </div>

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
                className={error ? "border-destructive" : ""}
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
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-center">
              <button
                onClick={() => setView("login")}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5" />
                Retour à la connexion
              </button>
            </p>
            <p className="text-center">
              <button
                onClick={() => setView("landing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Retour à l&apos;accueil
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main Auth Pages Export ── */
export function AuthPages() {
  const { currentView } = useAppStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auth top bar with logo */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40">
        <div className="header-sticky">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <button
              onClick={() => useAppStore.getState().setView("landing")}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <img src="/img/noli-vertical.png" alt="NOLI Assurance" className="h-9 w-auto object-contain" />
            </button>
          </div>
        </div>
      </header>

      {/* Auth content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          {currentView === "login" && <LoginPage />}
          {currentView === "register" && <RegisterPage />}
          {currentView === "forgot" && <ForgotPasswordPage />}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-border/40">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center px-8 py-5">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} NOLI Assurance. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}