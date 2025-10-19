import { features } from '@/lib/config/features';

/**
 Types génériques pour les réponses API
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: any;
}

/**
 * Types pour les erreurs
 */
export interface ApiError {
  message: string;
  code?: string | number;
  status?: number;
  details?: any;
}

/**
 * Configuration du service fallback
 */
interface FallbackConfig<T> {
  mockData: T | (() => T);
  apiCall: () => Promise<T>;
  errorMessage?: string;
  fallbackToMockOnError?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Erreur personnalisée pour les tentatives de fallback
 */
class FallbackError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly isMockData: boolean = false
  ) {
    super(message);
    this.name = 'FallbackError';
  }
}

/**
 * Gère le fallback entre données mockées et API réelles
 */
export class FallbackService {
  /**
   * Exécute une fonction avec gestion de fallback automatique
   */
  static async withFallback<T>(config: FallbackConfig<T>): Promise<T> {
    const {
      mockData,
      apiCall,
      errorMessage = 'Service unavailable',
      fallbackToMockOnError = true,
      retryCount = 2,
      retryDelay = 1000,
    } = config;

    // Si les mock sont explicitement activés, utiliser directement
    if (features.useMockData()) {
      const data = typeof mockData === 'function' ? mockData() : mockData;
      console.warn('🔧 Using mock data (VITE_USE_MOCK_DATA=true)');
      return data;
    }

    let lastError: Error | null = null;

    // Tenter l'appel API avec retry
    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        const result = await apiCall();

        // Log du succès en mode développement
        if (features.isDevelopment()) {
          console.log(`✅ API call succeeded on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Log de l'erreur en mode développement
        if (features.isDevelopment()) {
          console.warn(`⚠️ API call failed on attempt ${attempt}:`, error);
        }

        // Ne pas réessayer pour la dernière tentative
        if (attempt <= retryCount) {
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // Si le fallback vers les mock est autorisé
    if (fallbackToMockOnError) {
      const data = typeof mockData === 'function' ? mockData() : mockData;

      console.warn('🔄 Falling back to mock data due to API failure:', {
        errorMessage,
        originalError: lastError?.message,
        isUsingMock: true,
      });

      // Retourner les données mockées mais indiquer qu'on est en mode fallback
      throw new FallbackError(errorMessage, lastError, true);
    }

    // Sinon, propager l'erreur originale
    throw new FallbackError(
      `${errorMessage}: ${lastError?.message || 'Unknown error'}`,
      lastError,
      false
    );
  }

  /**
   * Crée une fonction avec gestion de fallback
   */
  static createFallbackFunction<T>(
    mockData: T | (() => T),
    apiCall: () => Promise<T>,
    options?: Partial<FallbackConfig<T>>
  ) {
    return async () => {
      return this.withFallback({
        mockData,
        apiCall,
        ...options,
      });
    };
  }

  /**
   * Vérifie si une erreur vient du mode fallback
   */
  static isFallbackError(error: any): error is FallbackError {
    return error instanceof FallbackError && error.isMockData;
  }

  /**
   * Extrait l'erreur originale d'une erreur de fallback
   */
  static getOriginalError(error: FallbackError): Error | null {
    return error.originalError || null;
  }
}

/**
 * Hook React pour faciliter l'utilisation du fallback
 */
export const useFallback = () => {
  return {
    execute: FallbackService.withFallback,
    createFunction: FallbackService.createFallbackFunction,
    isFallbackError: FallbackService.isFallbackError,
    getOriginalError: FallbackService.getOriginalError,
  };
};

/**
 * Wrapper pour les services existants
 */
export function createServiceWithFallback<T extends Record<string, (...args: any[]) => Promise<any>>>({
  serviceName,
  mockData,
  apiImplementations,
}: {
  serviceName: string;
  mockData: Record<string, any>;
  apiImplementations: T;
}): T {
  const service = {} as T;

  Object.entries(apiImplementations).forEach(([methodName, apiCall]) => {
    const mockFn = mockData[methodName];

    if (mockFn) {
      service[methodName] = FallbackService.createFallbackFunction(
        mockFn,
        apiCall,
        {
          errorMessage: `${serviceName}: ${methodName} service unavailable`,
          fallbackToMockOnError: true,
          retryCount: 2,
          retryDelay: 1000,
        }
      );
    } else {
      service[methodName] = apiCall;
    }
  });

  return service;
}