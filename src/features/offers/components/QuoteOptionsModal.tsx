import { Mail, MessageCircle, Phone, X, Download, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuotePDFGenerator } from "@/features/quotes/components/QuotePDFGenerator";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { quoteService, QuoteRequest } from "@/services/quoteService";
import { useState } from "react";

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
  const { showNotification } = useNotifications();
  const [showPDF, setShowPDF] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Données mock pour le devis (remplacer par vraies données du formulaire)
  const mockQuoteRequest: QuoteRequest = {
    customerInfo: {
      fullName: "Jean Kouadio",
      email: "jean.kouadio@email.com",
      phone: "+225 07 00 00 00 00",
      address: "Abidjan, Cocody",
      birthDate: "1990-01-01",
      licenseNumber: "CI-ABJ-123456",
      licenseDate: "2015-06-15",
    },
    vehicleInfo: {
      brand: "Toyota",
      model: "Yaris",
      year: 2020,
      registrationNumber: "CI-1234-ABJ",
      vehicleType: "Berline",
      fuelType: "Essence",
      value: 5000000,
    },
    insuranceNeeds: {
      coverageType: offer.coverageType,
      usage: "Personnel",
      annualKilometers: 15000,
      parkingType: "Garage fermé",
      historyClaims: "Aucun",
    },
  };

  const handleOptionSelect = async (option: 'email' | 'whatsapp' | 'phone' | 'pdf') => {
    setIsProcessing(true);

    try {
      switch (option) {
        case 'pdf':
          setShowPDF(true);
          break;

        case 'email':
          // Générer et envoyer le PDF par email
          const quotes = await quoteService.generateQuotes(mockQuoteRequest);
          const selectedQuote = quotes.find(q => q.insurer === offer.insurer);

          if (selectedQuote) {
            showNotification({
              id: `quote-email-${Date.now()}`,
              title: 'Devis envoyé par email',
              message: `Votre devis ${offer.insurer} a été envoyé à votre adresse email.`,
              type: 'success',
              timestamp: new Date(),
              read: false,
              actionUrl: '/mes-devis',
              actionText: 'Voir mes devis',
            });
          }
          break;

        case 'whatsapp':
          // Partager via WhatsApp
          const message = encodeURIComponent(
            `🚗 *Devis Assurance NOLI*\n\n` +
            `*Assureur:* ${offer.insurer}\n` +
            `*Formule:* ${offer.coverageType}\n` +
            `*Tarif mensuel:* ${offer.monthlyPrice.toLocaleString('fr-FR')} FCFA\n` +
            `*Tarif annuel:* ${offer.annualPrice.toLocaleString('fr-FR')} FCFA\n\n` +
            `Le devis complet vous sera envoyé par email.\n\n` +
            `📞 Contact: +225 27 20 00 00 00\n` +
            `🌐 www.noli.ci`
          );
          window.open(`https://wa.me/2252720000000?text=${message}`, '_blank');

          showNotification({
            id: `quote-whatsapp-${Date.now()}`,
            title: 'Message WhatsApp envoyé',
            message: 'Les informations de votre devis ont été partagées via WhatsApp.',
            type: 'success',
            timestamp: new Date(),
            read: false,
          });
          break;

        case 'phone':
          // Demander un rappel téléphonique
          showNotification({
            id: `quote-phone-${Date.now()}`,
            title: 'Demande de rappel téléphonique',
            message: `Un conseiller ${offer.insurer} vous contactera sous 48h au +225 07 00 00 00 00.`,
            type: 'info',
            timestamp: new Date(),
            read: false,
          });
          break;
      }

      // Fermer le modal après un court délai sauf pour PDF
      if (option !== 'pdf') {
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }

    } catch (error) {
      logger.error('Erreur lors de la demande de devis:', error);
      showNotification({
        id: `quote-error-${Date.now()}`,
        title: 'Erreur de demande',
        message: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer.',
        type: 'error',
        timestamp: new Date(),
        read: false,
      });
    } finally {
      setIsProcessing(false);
    }
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
          {/* Télécharger PDF Option */}
          <Button
            variant="default"
            className="w-full h-auto p-4 flex items-center gap-4"
            onClick={() => handleOptionSelect('pdf')}
            disabled={isProcessing}
          >
            <div className="w-12 h-12 rounded-full bg-primary-foreground flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-primary-foreground">Télécharger le PDF</div>
              <div className="text-sm text-primary-foreground/80">Devis complet et personnalisé</div>
            </div>
          </Button>

          {/* Email Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center gap-4 hover:bg-primary/5 hover:border-primary/20"
            onClick={() => handleOptionSelect('email')}
            disabled={isProcessing}
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
            disabled={isProcessing}
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground">Recevoir par WhatsApp</div>
              <div className="text-sm text-muted-foreground">Informations envoyées instantanément</div>
            </div>
          </Button>

          {/* Phone Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex items-center gap-4 hover:bg-primary/5 hover:border-primary/20"
            onClick={() => handleOptionSelect('phone')}
            disabled={isProcessing}
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-foreground">Être contacté par téléphone</div>
              <div className="text-sm text-muted-foreground">Conseiller vous appelle sous 48h</div>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Votre demande est traitée de manière sécurisée et confidentielle
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>PDF certifié</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Validité 30 jours</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Support 7j/7</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal pour le générateur de PDF */}
      {showPDF && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Votre devis personnalisé</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPDF(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <QuotePDFGenerator
                quoteData={{
                  id: `quote-${offer.id}-${Date.now()}`,
                  createdAt: new Date(),
                  customerInfo: mockQuoteRequest.customerInfo,
                  vehicleInfo: mockQuoteRequest.vehicleInfo,
                  insuranceInfo: {
                    insurer: offer.insurer,
                    offerName: `${offer.coverageType} - ${offer.insurer}`,
                    coverageType: offer.coverageType,
                    price: {
                      monthly: offer.monthlyPrice,
                      annual: offer.annualPrice,
                    },
                    franchise: 50000, // Valeur par défaut
                    features: [
                      'Assistance 24/7',
                      'Protection juridique',
                      'Défense pénale',
                      'Véhicule de remplacement',
                    ],
                    guarantees: {
                      assistance24h: true,
                      vehicleReplacement: true,
                      driverProtection: true,
                      glassBreakage: true,
                      legalProtection: true,
                      newVehicleValue: false,
                      internationalAssistance: false,
                    },
                  },
                  personalInfo: mockQuoteRequest.insuranceNeeds,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteOptionsModal;