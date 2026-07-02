"use client";

import { useState, useCallback, useEffect } from "react";
import { Eye, EyeOff, Loader2, Zap, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
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
    else if (!isValidEmail(email)) e.email = "Email invalide";
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
        avatarUrl: data.user.photoUrl,
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
        setView("insurer");
      } else {
        setView("landing");
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
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
          <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-8 w-8 object-contain" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Se connecter</h1>
        <p className="text-muted-foreground mt-2">
          Acc\u00e9dez \u00e0 votre espace NOLI Assurance
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
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
              autoComplete="current-password"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
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
            Mot de passe oubli\u00e9 ?
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
          Retour \u00e0 l&apos;accueil
        </button>
      </div>
    </div>
  );
}

/* ── Register Page ── */
function RegisterPage() {
  const { setView, setUser } = useAppStore();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Le nom complet est requis";
    if (!email) e.email = "L'email est requis";
    else if (!isValidEmail(email)) e.email = "Email invalide";
    if (!password) e.password = "Le mot de passe est requis";
    else if (!hasMinLength(password, 6))
      e.password = "Le mot de passe doit contenir au moins 6 caract\u00e8res";
    if (password !== confirmPassword)
      e.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!acceptTerms) e.terms = "Vous devez accepter les conditions";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name: fullName,
          email,
          phone,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de cr\u00e9er le compte",
          variant: "destructive",
        });
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        avatarUrl: data.user.photoUrl,
        isLoggedIn: true,
      });

      toast({
        title: "Compte cr\u00e9\u00e9",
        description: `Bienvenue, ${data.user.name} ! Votre compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.`,
      });

      // Redirect by role
      if (data.user.role === "ADMIN") {
        setView("admin");
      } else if (data.user.role === "INSURER") {
        setView("insurer");
      } else {
        setView("landing");
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

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
          <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-8 w-8 object-contain" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Cr\u00e9er un compte</h1>
        <p className="text-muted-foreground mt-2">
          Rejoignez NOLI Assurance pour comparer et souscrire
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reg-name">Nom complet</Label>
          <Input
            id="reg-name"
            autoComplete="name"
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
            autoComplete="email"
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
            T\u00e9l\u00e9phone <span className="text-muted-foreground font-normal">(optionnel)</span>
          </Label>
          <Input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+225 07 XX XX XX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
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
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              aria-invalid={!!errors.confirmPassword}
              className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
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
          <Label htmlFor="reg-terms" className="text-sm font-normal leading-snug cursor-pointer">
            <span className="whitespace-nowrap">J&apos;accepte les{" "}</span>
            <span className="text-primary hover:underline cursor-pointer whitespace-nowrap">
              conditions d&apos;utilisation
            </span>
            <span className="whitespace-nowrap">{" "}et la{" "}</span>
            <span className="text-primary hover:underline cursor-pointer whitespace-nowrap">
              politique de confidentialit\u00e9
            </span>
          </Label>
        </div>
        {errors.terms && (
          <p className="text-xs text-destructive -mt-2">{errors.terms}</p>
        )}

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
              Cr\u00e9er mon compte
            </>
          )}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        D\u00e9j\u00e0 un compte ?{" "}
        <button
          onClick={() => setView("login")}
          className="text-primary font-medium hover:underline"
        >
          Se connecter
        </button>
      </p>

      <div className="mt-4">
        <button
          onClick={() => setView("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Retour \u00e0 l&apos;accueil
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
          <div className="inline-flex items-center justify-center rounded-full bg-accent/20 p-4">
            <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-10 w-10 object-contain" />
          </div>
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
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Mot de passe oubli\u00e9</h1>
            <p className="text-muted-foreground mt-2">
              R\u00e9initialisez votre mot de passe
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entrez l&apos;adresse email associ\u00e9e \u00e0 votre compte. Nous vous
              enverrons un lien de r\u00e9initialisation.
            </p>

            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
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
                Retour \u00e0 la connexion
              </button>
            </p>
            <p className="text-center">
              <button
                onClick={() => setView("landing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Retour \u00e0 l&apos;accueil
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
    <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        {currentView === "login" && <LoginPage />}
        {currentView === "register" && <RegisterPage />}
        {currentView === "forgot" && <ForgotPasswordPage />}
      </div>
    </div>
  );
}