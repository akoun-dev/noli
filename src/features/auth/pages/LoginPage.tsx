import { useState } from "react";
import { Shield, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginFormData } from "@/lib/zod-schemas";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Error) {
        // Handle Zod validation errors
        const fieldErrors: Partial<LoginFormData> = {};
        const errorData = error.message;

        // Simple error parsing (in real app, use proper Zod error handling)
        if (errorData.includes("email")) fieldErrors.email = errorData;
        if (errorData.includes("mot de passe")) fieldErrors.password = errorData;

        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 LoginPage.handleSubmit appelé');
    console.log('📧 Email:', formData.email);
    console.log('🔑 Password:', formData.password ? '[REDACTED]' : 'EMPTY');

    if (!validateForm()) {
      console.log('❌ Validation du formulaire échouée');
      return;
    }

    console.log('✅ Formulaire validé, début de la connexion...');
    setIsLoading(true);
    try {
      console.log('📞 Appel de la fonction login du contexte...');
      const user = await login(formData.email, formData.password);
      console.log('✅ Login réussi, utilisateur:', user);

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur NOLI Assurance",
        variant: "success",
      });

      console.log('🔄 Préparation de la redirection...');
      // Redirect by role after successful login
      const redirectMap: Record<typeof user.role, string> = {
        USER: '/tableau-de-bord',
        INSURER: '/assureur/tableau-de-bord',
        ADMIN: '/admin/tableau-de-bord',
      };
      console.log('🗺️ Map de redirection:', redirectMap);
      console.log('👤 Rôle utilisateur:', user.role);

      const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      console.log('📍 From path:', fromPath);

      const targetPath = fromPath || redirectMap[user.role];
      console.log('🎯 Cible de redirection:', targetPath);

      if (fromPath) {
        if (user.role === 'ADMIN' && fromPath.startsWith('/admin/')) {
          console.log('➡️ Redirection vers (admin/from):', fromPath);
          navigate(fromPath, { replace: true });
        } else if (user.role === 'INSURER' && fromPath.startsWith('/assureur/')) {
          console.log('➡️ Redirection vers (insurer/from):', fromPath);
          navigate(fromPath, { replace: true });
        } else if (user.role === 'USER' && !fromPath.startsWith('/admin/') && !fromPath.startsWith('/assureur/')) {
          console.log('➡️ Redirection vers (user/from):', fromPath);
          navigate(fromPath, { replace: true });
        } else {
          console.log('➡️ Redirection vers (default/role):', redirectMap[user.role]);
          navigate(redirectMap[user.role], { replace: true });
        }
      } else {
        console.log('➡️ Redirection vers (default):', redirectMap[user.role]);
        navigate(redirectMap[user.role], { replace: true });
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Fin du processus de connexion');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-2xl">NOLI</span>
            <span className="text-xs text-muted-foreground">Assurance Auto</span>
          </div>
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
            <p className="text-muted-foreground text-center">
              Connectez-vous à votre compte NOLI
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Se souvenir de moi</span>
                </label>
                <Link to="/auth/mot-de-passe-oublie" className="text-primary hover:underline">
                  Mot de passe oublié?
                </Link>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Comptes de démonstration</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Utilisateur:</span>
                  <span className="font-mono">user@example.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Assureur:</span>
                  <span className="font-mono">nsia@assurances.ci</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span className="font-mono">admin@noli.ci</span>
                </div>
                <div className="text-center mt-1">
                  <span className="text-primary">Mot de passe: password123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Pas encore de compte? </span>
          <Link to="/auth/inscription" className="text-primary hover:underline font-medium">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
