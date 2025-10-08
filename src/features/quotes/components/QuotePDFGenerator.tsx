import { useState } from 'react';
import { Download, FileText, Loader2, Share2, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { pdfService, QuoteData } from '../services/pdfService';

interface QuotePDFGeneratorProps {
  quoteData: QuoteData;
  className?: string;
}

export const QuotePDFGenerator: React.FC<QuotePDFGeneratorProps> = ({
  quoteData,
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { showNotification } = useNotifications();

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const pdfBlob = await pdfService.generateQuotePDF(quoteData);

      // Créer un URL temporaire pour le téléchargement
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis-assurance-${quoteData.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification({
        id: `pdf-generated-${Date.now()}`,
        title: 'PDF généré avec succès',
        message: `Le devis ${quoteData.id} a été téléchargé.`,
        type: 'success',
        timestamp: new Date(),
        read: false,
      });

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      showNotification({
        id: `pdf-error-${Date.now()}`,
        title: 'Erreur de génération PDF',
        message: 'Une erreur est survenue lors de la génération du devis PDF.',
        type: 'error',
        timestamp: new Date(),
        read: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sharePDF = async (method: 'email' | 'whatsapp') => {
    setIsSharing(true);

    try {
      const pdfBlob = await pdfService.generateQuotePDF(quoteData);

      // Créer un URL temporaire
      const url = URL.createObjectURL(pdfBlob);

      if (method === 'email') {
        const subject = encodeURIComponent(`Devis Assurance - ${quoteData.id}`);
        const body = encodeURIComponent(
          `Bonjour,\n\nVous trouverez ci-joint votre devis d'assurance automobile NOLI.\n\nRéférence: ${quoteData.id}\nAssureur: ${quoteData.insuranceInfo.insurer}\nFormule: ${quoteData.insuranceInfo.offerName}\n\nPour toute question, contactez-nous au +225 27 20 00 00 00.\n\nCordialement,\nNOLI Assurance`
        );

        // Ouvrir le client email par défaut
        window.open(`mailto:${quoteData.customerInfo.email}?subject=${subject}&body=${body}`);

        showNotification({
          id: `email-shared-${Date.now()}`,
          title: 'Email envoyé',
          message: `Le devis a été envoyé par email à ${quoteData.customerInfo.email}.`,
          type: 'success',
          timestamp: new Date(),
          read: false,
        });
      } else if (method === 'whatsapp') {
        const message = encodeURIComponent(
          `🚗 *Devis Assurance NOLI*\n\n` +
          `*Référence:* ${quoteData.id}\n` +
          `*Assureur:* ${quoteData.insuranceInfo.insurer}\n` +
          `*Formule:* ${quoteData.insuranceInfo.offerName}\n` +
          `*Tarif mensuel:* ${quoteData.insuranceInfo.price.monthly.toLocaleString('fr-FR')} FCFA\n` +
          `*Tarif annuel:* ${quoteData.insuranceInfo.price.annual.toLocaleString('fr-FR')} FCFA\n\n` +
          `*Véhicule:* ${quoteData.vehicleInfo.brand} ${quoteData.vehicleInfo.model} (${quoteData.vehicleInfo.year})\n\n` +
          `Le PDF complet sera envoyé par email.\n\n` +
          `📞 Contact: +225 27 20 00 00 00\n` +
          `🌐 www.noli.ci`
        );

        // Ouvrir WhatsApp Web
        window.open(`https://wa.me/2252720000000?text=${message}`, '_blank');

        showNotification({
          id: `whatsapp-shared-${Date.now()}`,
          title: 'Message WhatsApp envoyé',
          message: 'Le devis a été partagé via WhatsApp.',
          type: 'success',
          timestamp: new Date(),
          read: false,
        });
      }

      // Nettoyer l'URL temporaire après un délai
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);

    } catch (error) {
      console.error('Erreur lors du partage du PDF:', error);
      showNotification({
        id: `share-error-${Date.now()}`,
        title: 'Erreur de partage',
        message: 'Une erreur est survenue lors du partage du devis.',
        type: 'error',
        timestamp: new Date(),
        read: false,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Votre devis PDF</h3>
          <p className="text-sm text-muted-foreground">
            Générez et partagez votre devis d'assurance personnalisé
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Télécharger le PDF
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => sharePDF('email')}
              disabled={isSharing}
              className="flex items-center gap-2"
              size="sm"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>

            <Button
              variant="outline"
              onClick={() => sharePDF('whatsapp')}
              disabled={isSharing}
              className="flex items-center gap-2"
              size="sm"
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>✅ PDF certifié et valide 30 jours</p>
          <p>✅ Accepté par tous les assureurs partenaires</p>
          <p>✅ Modification possible jusqu'à la souscription</p>
        </div>
      </div>
    </Card>
  );
};