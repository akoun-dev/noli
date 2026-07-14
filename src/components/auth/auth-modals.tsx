"use client";

import { useState, useCallback } from "react";
import { Eye, EyeOff, Loader2, Zap, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

/* ── Login Modal ── */
function LoginModal() {
  const { setAuthModal, setUser } = useAppStore();
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
      setAuthModal("none");

      // Redirect by role
      if (data.user.role === "ADMIN") {
        useAppStore.getState().setView("admin");
      } else if (data.user.role === "INSURER") {
        useAppStore.getState().setView("insurer-dashboard");
      } else {
        useAppStore.getState().setView("user-dashboard");
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
            placeholder="••••••••"
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
          onClick={() => setAuthModal("forgot")}
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

      <Separator />

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={() => setAuthModal("register")}
          className="text-primary font-medium hover:underline"
        >
          S&apos;inscrire
        </button>
      </p>
    </form>
  );
}

/* ── Register Modal ── */
function RegisterModal() {
  const { setAuthModal, setUser } = useAppStore();
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
    else if (!isValidEmail(email)) e.email = "Adresse email invalide";
    if (!password) e.password = "Le mot de passe est requis";
    else if (!hasMinLength(password, 6))
      e.password = "Le mot de passe doit contenir au moins 6 caract\u00e8res";
    if (password !== confirmPassword)
      e.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!acceptTerms) e.terms = "Vous devez accepter les conditions d'utilisation";
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
        isLoggedIn: true,
      });

      toast({
        title: "Compte cr\u00e9\u00e9",
        description: `Bienvenue, ${data.user.name} ! Votre compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.`,
      });
      setAuthModal("none");

      // Redirect by role
      if (data.user.role === "ADMIN") {
        useAppStore.getState().setView("admin");
      } else if (data.user.role === "INSURER") {
        useAppStore.getState().setView("insurer-dashboard");
      } else {
        useAppStore.getState().setView("user-dashboard");
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
          T\u00e9l\u00e9phone <span className="text-muted-foreground font-normal">(optionnel)</span>
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
          J&apos;accepte les{" "}
          <span className="text-primary hover:underline cursor-pointer">
            conditions d&apos;utilisation
          </span>{" "}
          et la{" "}
          <span className="text-primary hover:underline cursor-pointer">
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

      <Separator />

      <p className="text-center text-sm text-muted-foreground">
        D\u00e9j\u00e0 un compte ?{" "}
        <button
          type="button"
          onClick={() => setAuthModal("login")}
          className="text-primary font-medium hover:underline"
        >
          Se connecter
        </button>
      </p>
    </form>
  );
}

/* ── Forgot Password Modal ── */
function ForgotPasswordModal() {
  const { setAuthModal } = useAppStore();
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
      setError("Adresse email invalide");
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

  return sent ? (
    <div className="space-y-4 text-center py-4">
      <img src="/img/zebre_plein_sans_fond.png" alt="NOLI" className="h-14 w-auto mx-auto" />
      <h3 className="font-semibold text-lg">V\u00e9rifiez votre email</h3>
      <p className="text-sm text-muted-foreground">
        Si un compte existe avec cet email, vous recevrez un lien de
        r\u00e9initialisation.
      </p>
      <Button
        variant="outline"
        className="mt-2"
        onClick={() => setAuthModal("login")}
      >
        <ArrowRight className="size-4 rotate-180" />
        Retour \u00e0 la connexion
      </Button>
    </div>
  ) : (
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
          onClick={() => setAuthModal("login")}
          className="text-sm text-primary hover:underline"
        >
          <ArrowRight className="size-3.5 inline rotate-180" /> Retour \u00e0 la
          connexion
        </button>
      </p>
    </form>
  );
}

/* ── Main Auth Modals Export ── */
export function AuthModals() {
  const { authModal, setAuthModal } = useAppStore();
  const isOpen = authModal !== "none";

  const modalConfig: Record<
    string,
    { title: string; description: string }
  > = {
    login: {
      title: "Se connecter",
      description: "Accédez à votre espace NOLI Assurance",
    },
    register: {
      title: "Créer un compte",
      description: "Rejoignez NOLI Assurance pour comparer et souscrire",
    },
    forgot: {
      title: "Mot de passe oublié",
      description: "Réinitialisez votre mot de passe",
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setAuthModal("none");
      }}
    >
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {modalConfig[authModal]?.title}
          </DialogTitle>
          <DialogDescription>
            {modalConfig[authModal]?.description}
          </DialogDescription>
        </DialogHeader>

        {authModal === "login" && <LoginModal />}
        {authModal === "register" && <RegisterModal />}
        {authModal === "forgot" && <ForgotPasswordModal />}
      </DialogContent>
    </Dialog>
  );
}