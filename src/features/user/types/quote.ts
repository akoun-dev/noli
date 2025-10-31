import { Quote, ComparisonRequest } from '@/types';

export type { ComparisonRequest };

export interface QuoteWithDetails extends Quote {
  insurerName: string;
  insurerLogo: string;
  vehicleInfo: {
    brand: string;
    model: string;
    year: number;
    registration: string;
  };
  coverageName: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteHistoryFilters {
  status?: Quote['status'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  insurer?: string;
}

export interface QuoteHistoryStats {
  totalQuotes: number;
  pendingQuotes: number;
  approvedQuotes: number;
  rejectedQuotes: number;
  expiredQuotes: number;
  averageProcessingTime: number; // in days
}