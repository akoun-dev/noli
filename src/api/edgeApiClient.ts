// Client API utilisant les Supabase Edge Functions
// Proxy les requêtes vers l'API externe via Supabase

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Configuration des Edge Functions
const EDGE_FUNCTIONS = {
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  functions: {
    apiProxy: 'api-proxy',
    quotes: 'quotes',
    offers: 'offers',
    categories: 'categories',
    tarification: 'tarification',
  },
};

// Construit l'URL de l'Edge Function
function buildEdgeFunctionUrl(
  functionName: string,
  path: string = '',
  queryParams?: Record<string, string>
): string {
  const baseUrl = EDGE_FUNCTIONS.baseURL;
  const url = new URL(`${baseUrl}/functions/v1/${functionName}${path}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
}

// Génère un ID de requête unique
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Transforme la réponse de l'Edge Function
function transformResponse<T>(data: any): ApiResponse<T> {
  return {
    success: data.success,
    data: data.data,
    message: data.message,
    errors: data.errors,
    timestamp: data.timestamp || new Date().toISOString(),
  };
}

// Gère les erreurs
function handleError(error: Error, status?: number): never {
  const apiError: ApiError = {
    code: `EDGE_ERROR_${status || 'UNKNOWN'}`,
    message: error.message || 'Une erreur est survenue',
    timestamp: new Date().toISOString(),
  };

  logger.error('Edge Function Error:', apiError);

  throw apiError;
}

// Classe principale du client API Edge
class EdgeApiClient {
  private function: string;

  constructor(functionName: string = EDGE_FUNCTIONS.functions.apiProxy) {
    this.function = functionName;
  }

  private async request<T = any>(
    method: string,
    path: string = '',
    data?: any,
    queryParams?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      // Récupérer le token d'authentification Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        logger.warn('Failed to get Supabase session:', sessionError);
      }

      // Construire l'URL
      const url = buildEdgeFunctionUrl(this.function, path, queryParams);

      // Préparer les headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Request-ID': generateRequestId(),
        'X-Timestamp': new Date().toISOString(),
      };

      // Ajouter le token d'authentification
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Options de la requête
      const options: RequestInit = {
        method,
        headers,
      };

      // Ajouter le corps de la requête pour les méthodes POST, PUT, PATCH
      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = JSON.stringify(data);
      }

      logger.info(`Edge Function Request: ${method} ${url}`);

      // Faire la requête
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      return transformResponse<T>(responseData);

    } catch (error) {
      handleError(error as Error);
    }
  }

  // Méthodes HTTP
  async get<T = any>(path: string = '', queryParams?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, queryParams);
  }

  async post<T = any>(path: string = '', data?: any, queryParams?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, queryParams);
  }

  async put<T = any>(path: string = '', data?: any, queryParams?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, queryParams);
  }

  async patch<T = any>(path: string = '', data?: any, queryParams?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, queryParams);
  }

  async delete<T = any>(path: string = '', queryParams?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, queryParams);
  }
}

// Instances spécialisées pour chaque fonctionnalité
export const edgeApiClients = {
  // Client générique (api-proxy)
  generic: new EdgeApiClient(EDGE_FUNCTIONS.functions.apiProxy),

  // Devis
  quotes: new EdgeApiClient(EDGE_FUNCTIONS.functions.quotes),

  // Offres
  offers: new EdgeApiClient(EDGE_FUNCTIONS.functions.offers),

  // Catégories
  categories: new EdgeApiClient(EDGE_FUNCTIONS.functions.categories),

  // Tarification
  tarification: new EdgeApiClient(EDGE_FUNCTIONS.functions.tarification),
};

// Export par défaut le client générique
export default edgeApiClients.generic;
