import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface QuoteData {
  id: string;
  createdAt: Date;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: Date;
    licenseNumber: string;
    licenseDate: Date;
  };
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    registrationNumber: string;
    vehicleType: string;
    fuelType: string;
    value: number;
  };
  insuranceInfo: {
    insurer: string;
    offerName: string;
    coverageType: string;
    price: {
      monthly: number;
      annual: number;
    };
    franchise: number;
    features: string[];
    guarantees: {
      [key: string]: boolean;
    };
  };
  personalInfo: {
    usage: string;
    annualKilometers: number;
    parkingType: string;
    historyClaims: string;
  };
}

export class PDFService {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  async generateQuotePDF(quoteData: QuoteData): Promise<Blob> {
    this.doc = new jsPDF();

    // Configuration des polices
    this.doc.setFont('helvetica');

    // En-tête
    this.addHeader();

    // Informations du devis
    this.addQuoteInfo(quoteData);

    // Informations client
    this.addCustomerInfo(quoteData.customerInfo);

    // Informations véhicule
    this.addVehicleInfo(quoteData.vehicleInfo);

    // Informations assurance
    this.addInsuranceInfo(quoteData.insuranceInfo);

    // Détails de la couverture
    this.addCoverageDetails(quoteData.insuranceInfo);

    // Récapitulatif tarifaire
    this.addPricingSummary(quoteData.insuranceInfo);

    // Conditions générales
    this.addTermsAndConditions();

    // Pied de page
    this.addFooter();

    return this.doc.output('blob');
  }

  private addHeader() {
    // Logo et titre
    this.doc.setFontSize(24);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('NOLI Assurance', 20, 30);

    this.doc.setFontSize(14);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Devis d\'Assurance Automobile', 20, 40);

    // Ligne décorative
    this.doc.setDrawColor(41, 128, 185);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 45, 190, 45);
  }

  private addQuoteInfo(quoteData: QuoteData) {
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);

    const quoteInfo = [
      `Numéro de devis: ${quoteData.id}`,
      `Date d\'émission: ${format(quoteData.createdAt, 'dd MMMM yyyy', { locale: fr })}`,
      `Validité: 30 jours`,
    ];

    let yPosition = 60;
    quoteInfo.forEach(line => {
      this.doc.text(line, 20, yPosition);
      yPosition += 8;
    });
  }

  private addCustomerInfo(customerInfo: QuoteData['customerInfo']) {
    let yPosition = 90;

    // Section Client
    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Informations du Conducteur', 20, yPosition);

    yPosition += 10;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);

    const customerData = [
      `Nom complet: ${customerInfo.fullName}`,
      `Email: ${customerInfo.email}`,
      `Téléphone: ${customerInfo.phone}`,
      `Adresse: ${customerInfo.address}`,
      `Date de naissance: ${format(customerInfo.birthDate, 'dd/MM/yyyy', { locale: fr })}`,
      `Permis de conduire N°: ${customerInfo.licenseNumber}`,
      `Date d\'obtention: ${format(customerInfo.licenseDate, 'dd/MM/yyyy', { locale: fr })}`,
    ];

    customerData.forEach(line => {
      this.doc.text(line, 20, yPosition);
      yPosition += 7;
    });
  }

  private addVehicleInfo(vehicleInfo: QuoteData['vehicleInfo']) {
    let yPosition = 140;

    // Section Véhicule
    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Informations du Véhicule', 20, yPosition);

    yPosition += 10;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);

    const vehicleData = [
      `Marque: ${vehicleInfo.brand}`,
      `Modèle: ${vehicleInfo.model}`,
      `Année: ${vehicleInfo.year}`,
      `Immatriculation: ${vehicleInfo.registrationNumber}`,
      `Type: ${vehicleInfo.vehicleType}`,
      `Carburant: ${vehicleInfo.fuelType}`,
      `Valeur estimée: ${vehicleInfo.value.toLocaleString('fr-FR')} FCFA`,
    ];

    vehicleData.forEach(line => {
      this.doc.text(line, 20, yPosition);
      yPosition += 7;
    });
  }

  private addInsuranceInfo(insuranceInfo: QuoteData['insuranceInfo']) {
    // Nouvelle page pour les détails d'assurance
    this.doc.addPage();

    let yPosition = 30;

    // Section Assurance
    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Détails de l\'Assurance', 20, yPosition);

    yPosition += 10;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);

    const insuranceData = [
      `Assureur: ${insuranceInfo.insurer}`,
      `Formule: ${insuranceInfo.offerName}`,
      `Type de couverture: ${insuranceInfo.coverageType}`,
      `Franchise: ${insuranceInfo.franchise.toLocaleString('fr-FR')} FCFA`,
    ];

    insuranceData.forEach(line => {
      this.doc.text(line, 20, yPosition);
      yPosition += 7;
    });
  }

  private addCoverageDetails(insuranceInfo: QuoteData['insuranceInfo']) {
    let yPosition = 70;

    // Garanties incluses
    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Garanties Incluses', 20, yPosition);

    yPosition += 10;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);

    insuranceInfo.features.forEach((feature, index) => {
      this.doc.text(`• ${feature}`, 25, yPosition);
      yPosition += 7;
    });

    // Garanties spécifiques
    yPosition += 5;
    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Garanties Spécifiques', 20, yPosition);

    yPosition += 10;
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 0, 0);

    const guaranteeLabels: { [key: string]: string } = {
      assistance24h: 'Assistance 24/7',
      vehicleReplacement: 'Véhicule de remplacement',
      driverProtection: 'Protection du conducteur',
      glassBreakage: 'Bris de glace',
      legalProtection: 'Protection juridique',
      newVehicleValue: 'Valeur à neuf',
      internationalAssistance: 'Assistance internationale',
    };

    Object.entries(insuranceInfo.guarantees).forEach(([key, value]) => {
      if (value && guaranteeLabels[key]) {
        this.doc.text(`• ${guaranteeLabels[key]}`, 25, yPosition);
        yPosition += 7;
      }
    });
  }

  private addPricingSummary(insuranceInfo: QuoteData['insuranceInfo']) {
    let yPosition = 160;

    // Tableau des tarifs
    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Récapitulatif Tarifaire', 20, yPosition);

    yPosition += 15;

    // Encadré pour les tarifs
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(245, 245, 245);
    this.doc.roundedRect(20, yPosition, 170, 50, 3, 3, 'FD');

    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);

    // Tarif mensuel
    this.doc.text('Tarif mensuel:', 30, yPosition + 15);
    this.doc.setFontSize(16);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text(`${insuranceInfo.price.monthly.toLocaleString('fr-FR')} FCFA`, 130, yPosition + 15);

    // Tarif annuel
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Tarif annuel:', 30, yPosition + 30);
    this.doc.setFontSize(16);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text(`${insuranceInfo.price.annual.toLocaleString('fr-FR')} FCFA`, 130, yPosition + 30);
  }

  private addTermsAndConditions() {
    // Nouvelle page pour les conditions
    this.doc.addPage();

    let yPosition = 30;

    this.doc.setFontSize(14);
    this.doc.setTextColor(41, 128, 185);
    this.doc.text('Conditions Générales', 20, yPosition);

    yPosition += 15;
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);

    const terms = [
      '1. Validité du devis : Le présent devis est valable 30 jours à compter de sa date d\'émission.',
      '2. Documents requis : Pour la souscription, veuillez préparer les documents suivants :',
      '   - Pièce d\'identité en cours de validité',
      '   - Permis de conduire',
      '   - Carte grise du véhicule',
      '   - Justificatif de domicile',
      '3. Paiement : Le paiement peut être effectué mensuellement ou annuellement par prélèvement automatique.',
      '4. Résiliation : Conformément au Code des Assurances, vous pouvez résilier votre contrat à tout moment.',
      '5. Contact : Pour toute question, notre service client est disponible 7j/7 au +225 27 20 00 00 00.',
    ];

    terms.forEach(term => {
      const lines = this.doc.splitTextToSize(term, 170);
      lines.forEach((line: string) => {
        this.doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 3;
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Pied de page
      this.doc.setFontSize(10);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(`Page ${i} / ${pageCount}`, 105, 285, { align: 'center' });

      this.doc.text('NOLI Assurance - 01 BP 1234 Abidjan 01 - contact@noli.ci - www.noli.ci', 105, 290, { align: 'center' });

      // Mentions légales
      this.doc.setFontSize(8);
      this.doc.text('Assurance soumise au contrôle de l\'Autorité de Contrôle des Assurances (ACA)', 105, 295, { align: 'center' });
    }
  }
}

export const pdfService = new PDFService();