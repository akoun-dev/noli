import { Mail, MessageCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuoteOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: {
    id: number;
    insurer: string;
    logo: string;
    monthlyPrice: number;
    annualPrice: number;
    coverageType: string;
  };
}

const QuoteOptionsModal = ({ open, onOpenChange, offer }: QuoteOptionsModalProps) => {
  const handleOptionSelect = (option: 'email' | 'whatsapp' | 'phone') => {
    // TODO: Implement actual quote request logic
    console.log(`Quote requested via ${option} for offer ${offer.id}`);

    // Close modal after selection
    onOpenChange(false);

    // Show success message (you can implement a toast notification here)
    alert(`Votre demande de devis a été envoyée ! Vous recevrez votre devis PDF ${
      option === 'email' ? 'par email' :
      option === 'whatsapp' ? 'par WhatsApp' :
      'et un conseiller vous contactera par téléphone sous 48h'
    }.`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-6 relative animate-in fade-in-90 zoom-in-90">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">{offer.logo}</span>
            <div className="text-left">
              <h3 className="font-bold text-xl">{offer.insurer}</h3>
              <Badge variant="outline" className="mt-1">{offer.coverageType}</Badge>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Comment recevoir votre devis ?</h2>
          <p className="text-muted-foreground">
            Choisissez comment vous souhaitez recevoir votre devis personnalisé
          </p>
        </div>

        {/* Price Summary */}
        <div className="bg-muted/30 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">À partir de</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-primary">
                {offer.monthlyPrice.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-muted-foreground">FCFA/mois</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Soit {offer.annualPrice.toLocaleString()} FCFA/an
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Email Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center gap-4 hover:bg-primary/5 hover:border-primary/20"
            onClick={() => handleOptionSelect('email')}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground">Recevoir par email</div>
              <div className="text-sm text-muted-foreground">Devis PDF envoyé immédiatement</div>
            </div>
          </Button>

          {/* WhatsApp Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center gap-4 hover:bg-primary/5 hover:border-primary/20"
            onClick={() => handleOptionSelect('whatsapp')}
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground">Recevoir par WhatsApp</div>
              <div className="text-sm text-muted-foreground">Devis PDF envoyé instantanément</div>
            </div>
          </Button>

          {/* Phone Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center gap-4 hover:bg-primary/5 hover:border-primary/20"
            onClick={() => handleOptionSelect('phone')}
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground">Être contacter par téléphone</div>
              <div className="text-sm text-muted-foreground">Conseiller vous appelle sous 48h</div>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Votre demande est traitée de manière sécurisée et confidentielle
          </p>
        </div>
      </Card>
    </div>
  );
};

export default QuoteOptionsModal;