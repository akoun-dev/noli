import { useState } from "react";
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/data/api/authService";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/zod-schemas";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });

  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ForgotPasswordFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      forgotPasswordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Error) {
        // Handle Zod validation errors
        const fieldErrors: Partial<ForgotPasswordFormData> = {};
        const errorData = error.message;

        // Simple error parsing (in real app, use proper Zod error handling)
        if (errorData.includes("email")) fieldErrors.email = errorData;

        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword(formData.email);

      setIsSubmitted(true);
      toast({
        title: "Email envoyé",
        description: "Un email de réinitialisation a été envoyé à votre adresse email",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Email envoyé avec succès!</h3>
                  <p className="text-muted-foreground">
                    Nous avons envoyé un email de réinitialisation à:
                  </p>
                  <p className="font-medium text-primary">{formData.email}</p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Vérifiez votre boîte de réception et suivez les instructions
                    pour réinitialiser votre mot de passe.
                  </p>
                  <p>
                    Si vous ne recevez pas l'email dans quelques minutes,
                    vérifiez votre dossier de spam.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                    className="w-full"
                  >
                    Renvoyer l'email
                  </Button>
                  <Link to="/auth/connexion">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour à la connexion
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold text-center">
              Mot de passe oublié
            </CardTitle>
            <p className="text-muted-foreground text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
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

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Envoi en cours..." : "Envoyer l'email de réinitialisation"}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="text-center">
              <Link to="/auth/connexion" className="inline-flex items-center text-sm text-primary hover:underline">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;