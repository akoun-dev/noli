import { QuoteData } from '@/features/quotes/services/pdfService';
import { notificationService } from './notificationService';

export interface QuoteRequest {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    licenseNumber: string;
    licenseDate: string;
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
  insuranceNeeds: {
    coverageType: string;
    usage: string;
    annualKilometers: number;
    parkingType: string;
    historyClaims: string;
  };
}

export interface QuoteResponse {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  insurer: string;
  offerName: string;
  price: {
    monthly: number;
    annual: number;
  };
  franchise: number;
  features: string[];
  guarantees: { [key: string]: boolean };
  createdAt: Date;
  validUntil: Date;
}

export class QuoteService {
  private static instance: QuoteService;

  static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService();
    }
    return QuoteService.instance;
  }

  // Simuler la génération de devis depuis plusieurs assureurs
  async generateQuotes(request: QuoteRequest): Promise<QuoteResponse[]> {
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockQuotes: QuoteResponse[] = [
      {
        id: `quote-${Date.now()}-1`,
        status: 'pending',
        insurer: 'NSIA Assurances',
        offerName: 'Tous Risques Premium',
        price: {
          monthly: 18500,
          annual: 222000,
        },
        franchise: 50000,
        features: [
          'Assistance 24/7',
          'Véhicule de remplacement',
          'Protection conducteur',
          'Bris de glace inclus',
          'Vol et incendie',
        ],
        guarantees: {
          assistance24h: true,
          vehicleReplacement: true,
          driverProtection: true,
          glassBreakage: true,
          legalProtection: false,
          newVehicleValue: false,
          internationalAssistance: false,
        },
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
      {
        id: `quote-${Date.now()}-2`,
        status: 'pending',
        insurer: 'SUNU Assurances',
        offerName: 'Tiers Étendu',
        price: {
          monthly: 16200,
          annual: 194400,
        },
        franchise: 75000,
        features: [
          'Responsabilité civile',
          'Vol et incendie',
          'Bris de glace',
          'Assistance dépannage',
        ],
        guarantees: {
          assistance24h: true,
          vehicleReplacement: false,
          driverProtection: false,
          glassBreakage: true,
          legalProtection: false,
          newVehicleValue: false,
          internationalAssistance: false,
        },
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: `quote-${Date.now()}-3`,
        status: 'pending',
        insurer: 'ATLANTIQUE Assurances',
        offerName: 'Tous Risques Excellence',
        price: {
          monthly: 21000,
          annual: 252000,
        },
        franchise: 30000,
        features: [
          'Tous risques premium',
          'Assistance internationale',
          'Véhicule de remplacement',
          'Protection juridique',
          'Valeur à neuf 2 ans',
        ],
        guarantees: {
          assistance24h: true,
          vehicleReplacement: true,
          driverProtection: true,
          glassBreakage: true,
          legalProtection: true,
          newVehicleValue: true,
          internationalAssistance: true,
        },
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];

    // Notifier l'utilisateur que les devis sont prêts
    mockQuotes.forEach(quote => {
      notificationService.notifyQuoteGenerated(quote.id, quote.insurer, quote.price.monthly);
    });

    return mockQuotes;
  }

  // Accepter un devis
  async acceptQuote(quoteId: string): Promise<boolean> {
    // Simuler l'acceptation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Notifier l'acceptation
    const quote = await this.getQuoteById(quoteId);
    if (quote) {
      notificationService.notifyQuoteApproved(quoteId, quote.insurer);
    }

    return true;
  }

  // Obtenir un devis par ID
  async getQuoteById(quoteId: string): Promise<QuoteResponse | null> {
    // Simuler la récupération depuis une API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Retourner un devis mock pour l'exemple
    return {
      id: quoteId,
      status: 'pending',
      insurer: 'NSIA Assurances',
      offerName: 'Tous Risques Premium',
      price: {
        monthly: 18500,
        annual: 222000,
      },
      franchise: 50000,
      features: [
        'Assistance 24/7',
        'Véhicule de remplacement',
        'Protection conducteur',
        'Bris de glace inclus',
        'Vol et incendie',
      ],
      guarantees: {
        assistance24h: true,
        vehicleReplacement: true,
        driverProtection: true,
        glassBreakage: true,
        legalProtection: false,
        newVehicleValue: false,
        internationalAssistance: false,
      },
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  // Obtenir tous les devis d'un utilisateur
  async getUserQuotes(userId: string): Promise<QuoteResponse[]> {
    // Simuler la récupération
    await new Promise(resolve => setTimeout(resolve, 800));

    // Retourner des devis mock pour l'exemple
    return [
      {
        id: 'quote-1',
        status: 'approved',
        insurer: 'NSIA Assurances',
        offerName: 'Tous Risques Premium',
        price: { monthly: 18500, annual: 222000 },
        franchise: 50000,
        features: ['Assistance 24/7', 'Véhicule de remplacement'],
        guarantees: { assistance24h: true, vehicleReplacement: true },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'quote-2',
        status: 'pending',
        insurer: 'SUNU Assurances',
        offerName: 'Tiers Étendu',
        price: { monthly: 16200, annual: 194400 },
        franchise: 75000,
        features: ['Responsabilité civile', 'Vol et incendie'],
        guarantees: { assistance24h: true },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  // Vérifier les devis expirants
  async checkExpiringQuotes(): Promise<void> {
    const quotes = await this.getUserQuotes('current-user');
    const now = new Date();

    quotes.forEach(quote => {
      const daysUntilExpiry = Math.ceil((quote.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        notificationService.notifyQuoteExpiring(quote.id, daysUntilExpiry);
      }
    });
  }

  // Convertir un devis en données pour le PDF
  convertToPDFData(quoteResponse: QuoteResponse, request: QuoteRequest): QuoteData {
    return {
      id: quoteResponse.id,
      createdAt: quoteResponse.createdAt,
      customerInfo: {
        fullName: request.customerInfo.fullName,
        email: request.customerInfo.email,
        phone: request.customerInfo.phone,
        address: request.customerInfo.address,
        birthDate: new Date(request.customerInfo.birthDate),
        licenseNumber: request.customerInfo.licenseNumber,
        licenseDate: new Date(request.customerInfo.licenseDate),
      },
      vehicleInfo: {
        brand: request.vehicleInfo.brand,
        model: request.vehicleInfo.model,
        year: request.vehicleInfo.year,
        registrationNumber: request.vehicleInfo.registrationNumber,
        vehicleType: request.vehicleInfo.vehicleType,
        fuelType: request.vehicleInfo.fuelType,
        value: request.vehicleInfo.value,
      },
      insuranceInfo: {
        insurer: quoteResponse.insurer,
        offerName: quoteResponse.offerName,
        coverageType: request.insuranceNeeds.coverageType,
        price: quoteResponse.price,
        franchise: quoteResponse.franchise,
        features: quoteResponse.features,
        guarantees: quoteResponse.guarantees,
      },
      personalInfo: {
        usage: request.insuranceNeeds.usage,
        annualKilometers: request.insuranceNeeds.annualKilometers,
        parkingType: request.insuranceNeeds.parkingType,
        historyClaims: request.insuranceNeeds.historyClaims,
      },
    };
  }
}

export const quoteService = QuoteService.getInstance();