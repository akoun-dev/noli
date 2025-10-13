import { useState } from "react";
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [isSuccess, setIsSuccess] = useState(false);

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
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSuccess(true);
      toast({
        title: "Email envoyé",
        description: "Un email de réinitialisation vous a été envoyé",
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
            <CardTitle className="text-2xl font-bold text-center">Mot de passe oublié</CardTitle>
            <p className="text-muted-foreground text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isSuccess ? (
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
                  {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Un email de réinitialisation a été envoyé à {formData.email}.
                    Veuillez vérifier votre boîte de réception et suivre les instructions.
                  </AlertDescription>
                </Alert>

                <div className="text-center text-sm text-muted-foreground">
                  Vous n'avez pas reçu l'email? Vérifiez vos spams ou{" "}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-primary hover:underline"
                    disabled={isLoading}
                  >
                    essayez à nouveau
                  </button>
                </div>
              </div>
            )}

            {/* Back to Login */}
            <div className="text-center">
              <Link
                to="/auth/connexion"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
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