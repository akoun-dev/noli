// Auth Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  role: 'USER' | 'INSURER' | 'ADMIN';
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
}

// Insurance Types
export interface Vehicle {
  id: string;
  type: 'voiture' | 'moto' | 'camion' | 'autre';
  brand: string;
  model: string;
  year: number;
  fiscalPower: number;
  registration: string;
  value: number;
}

export interface CoverageType {
  id: string;
  name: string;
  description: string;
  level: 'tiers' | 'tiers_plus' | 'tous_risques';
}

export interface InsuranceOption {
  id: string;
  name: string;
  description: string;
  price: number;
  isRequired: boolean;
}

export interface InsuranceOffer {
  id: string;
  insurerId: string;
  insurerName: string;
  insurerLogo: string;
  coverageType: CoverageType;
  basePrice: number;
  options: InsuranceOption[];
  guarantees: string[];
  rating: number;
  recommended: boolean;
  bestPrice: boolean;
  franchise: number;
  description: string;
}

// Comparison Types
export interface ComparisonRequest {
  personalInfo: PersonalInfo;
  vehicleInfo: VehicleInfo;
  insuranceNeeds: InsuranceNeeds;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  licenseDate: Date;
  hasAccidents: boolean;
  accidentCount: number;
  usage: 'personal' | 'professional';
  annualKm: number;
}

export interface VehicleInfo {
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  fiscalPower: number;
  registration: string;
  value: number;
}

export interface InsuranceNeeds {
  coverageType: 'tiers' | 'tiers_plus' | 'tous_risques';
  options: string[];
  monthlyBudget: number;
  franchise: number;
}

// Policy/Contract Types
export interface Policy {
  id: string;
  userId: string;
  insurerId: string;
  quoteId: string;
  policyNumber: string;
  contractType: 'tiers' | 'tiers_plus' | 'tous_risques';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  premium: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'annually';
  vehicle: Vehicle;
  coverage: CoverageType;
  guarantees: string[];
  franchise: number;
  documents: PolicyDocument[];
  paymentHistory: Payment[];
  claims: Claim[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyDocument {
  id: string;
  name: string;
  type: 'contract' | 'certificate' | 'invoice' | 'receipt' | 'other';
  url: string;
  uploadedAt: Date;
  size: number;
}

export interface Payment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  method: 'card' | 'bank_transfer' | 'mobile_money' | 'cash';
  transactionId?: string;
}

export interface Claim {
  id: string;
  policyId: string;
  claimNumber: string;
  type: 'accident' | 'theft' | 'vandalism' | 'natural_disaster' | 'other';
  description: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  amount: number;
  dateOfIncident: Date;
  dateSubmitted: Date;
  dateResolved?: Date;
  documents: ClaimDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  size: number;
}

// Quote Types
export interface Quote {
  id: string;
  userId: string;
  offerId: string;
  comparisonData: ComparisonRequest;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  pdfUrl?: string;
}

// API Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}