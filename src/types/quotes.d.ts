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

export interface PDFOptions {
  includeTerms: boolean;
  includePricingDetails: boolean;
  includeCustomerInfo: boolean;
  includeVehicleInfo: boolean;
  includeGuarantees: boolean;
  language: 'fr' | 'en';
  format: 'A4' | 'Letter';
}