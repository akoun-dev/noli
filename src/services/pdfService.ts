import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QuoteWithDetails } from '../types/quote';

export class PDFService {
  static async generateQuotePDF(quote: QuoteWithDetails): Promise<Blob> {
    // Créer un élément HTML temporaire pour le contenu PDF
    const pdfContent = this.createPDFContent(quote);

    // Créer un conteneur temporaire
    const container = document.createElement('div');
    container.innerHTML = pdfContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    try {
      // Convertir le contenu en canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Ajouter la première page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      return pdf.output('blob');
    } finally {
      // Nettoyer le conteneur temporaire
      document.body.removeChild(container);
    }
  }

  private static createPDFContent(quote: QuoteWithDetails): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const expiryDate = new Date(quote.expiresAt).toLocaleDateString('fr-FR');

    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- En-tête -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #1e40af; margin: 0; font-size: 24px;">DEVIS D'ASSURANCE</h1>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">NOLI Assurance - Votre partenaire de confiance</p>
        </div>

        <!-- Informations du devis -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-left: 4px solid #2563eb; padding-left: 10px;">Informations du Devis</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Numéro de devis:</strong> ${quote.id}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Date d'émission:</strong> ${currentDate}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Date d'expiration:</strong> ${expiryDate}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Statut:</strong> ${this.getStatusLabel(quote.status)}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Assureur:</strong> ${quote.insurerName}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Couverture:</strong> ${quote.coverageName}</p>
            </div>
          </div>
        </div>

        <!-- Informations personnelles -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-left: 4px solid #2563eb; padding-left: 10px;">Informations Personnelles</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Nom:</strong> ${quote.comparisonData.personalInfo.lastName} ${quote.comparisonData.personalInfo.firstName}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${quote.comparisonData.personalInfo.email}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Téléphone:</strong> ${quote.comparisonData.personalInfo.phone}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Date de naissance:</strong> ${new Date(quote.comparisonData.personalInfo.birthDate).toLocaleDateString('fr-FR')}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Date de permis:</strong> ${new Date(quote.comparisonData.personalInfo.licenseDate).toLocaleDateString('fr-FR')}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Usage:</strong> ${this.getUsageLabel(quote.comparisonData.personalInfo.usage)}</p>
            </div>
          </div>
        </div>

        <!-- Informations du véhicule -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-left: 4px solid #2563eb; padding-left: 10px;">Véhicule Assuré</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Marque:</strong> ${quote.vehicleInfo.brand}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Modèle:</strong> ${quote.vehicleInfo.model}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Année:</strong> ${quote.vehicleInfo.year}</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Immatriculation:</strong> ${quote.vehicleInfo.registration}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Puissance fiscale:</strong> ${quote.comparisonData.vehicleInfo.fiscalPower} CV</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Valeur déclarée:</strong> ${quote.comparisonData.vehicleInfo.value.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        <!-- Détails de l'assurance -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-left: 4px solid #2563eb; padding-left: 10px;">Détails de l'Assurance</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Type de contrat:</strong> ${quote.coverageName}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Franchise:</strong> ${quote.comparisonData.insuranceNeeds.franchise.toLocaleString()} FCFA</p>
            </div>
            <div>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Budget mensuel:</strong> ${quote.comparisonData.insuranceNeeds.monthlyBudget.toLocaleString()} FCFA</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Kilométrage annuel:</strong> ${quote.comparisonData.personalInfo.annualKm.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        <!-- Prix et conditions -->
        <div style="margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="color: #374151; margin: 0; font-size: 20px;">Prime Annuelle</h3>
            <p style="color: #059669; margin: 0; font-size: 24px; font-weight: bold;">${quote.price.toLocaleString()} FCFA</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Mensuel</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">${Math.round(quote.price / 12).toLocaleString()} FCFA</p>
            </div>
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Trimestriel</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">${Math.round(quote.price / 4).toLocaleString()} FCFA</p>
            </div>
            <div style="background-color: white; padding: 15px; border-radius: 6px;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Semestriel</p>
              <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: bold;">${Math.round(quote.price / 2).toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        <!-- Conditions et mentions légales -->
        <div style="margin-bottom: 30px; font-size: 12px; color: #6b7280; line-height: 1.5;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 14px;">Conditions Générales</h3>
          <p style="margin: 5px 0;">• Ce devis est valable jusqu'au ${expiryDate}</p>
          <p style="margin: 5px 0;">• Les tarifs sont indiqus en FCFA et incluent toutes les taxes applicables</p>
          <p style="margin: 5px 0;">• Ce devis constitue une proposition contractuelle soumise à l'acceptation de l'assureur</p>
          <p style="margin: 5px 0;">• La souscription du contrat est soumise à l'approbation du dossier complet</p>
        </div>

        <!-- Coordonnées et signature -->
        <div style="border-top: 2px solid #2563eb; padding-top: 20px; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;"><strong>NOLI Assurance</strong></p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">📞 +225 07 123 456 78 | ✉️ contact@noliassurance.ci</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">📍 Abidjan, Côte d'Ivoire | 🌐 www.noliassurance.ci</p>
          <div style="margin-top: 20px;">
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Généré le ${currentDate}</p>
          </div>
        </div>
      </div>
    `;
  }

  private static getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'approved': 'Approuvé',
      'rejected': 'Rejeté',
      'expired': 'Expiré'
    };
    return statusMap[status] || status;
  }

  private static getUsageLabel(usage: string): string {
    const usageMap: Record<string, string> = {
      'personal': 'Usage personnel',
      'professional': 'Usage professionnel',
      'mixed': 'Usage mixte'
    };
    return usageMap[usage] || usage;
  }

  static downloadPDF(quote: QuoteWithDetails, filename?: string): void {
    const defaultFilename = `Devis_${quote.id}_${new Date().toISOString().split('T')[0]}.pdf`;

    this.generateQuotePDF(quote).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).catch(error => {
      logger.error('Erreur lors de la génération du PDF:', error);
      throw new Error('Impossible de générer le PDF');
    });
  }
}