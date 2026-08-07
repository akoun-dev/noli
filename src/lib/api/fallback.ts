import { logger } from '@/lib/logger';
import { features } from '@/lib/config/features';

export interface FallbackOptions<T> {
  /** Provides mock data. Used when mock mode is enabled or when the API call fails. */
  mockData: () => T | Promise<T>;
  /** The real API call. */
  apiCall: () => Promise<T>;
  /** Human-readable message logged when the API call fails and mock data is used. */
  errorMessage?: string;
}

/**
 * Service utilitaire pour exécuter un appel API avec repli sur des données mockées.
 *
 * - Si le mode "mock data" est activé, les données mockées sont renvoyées directement.
 * - Sinon, l'appel API réel est tenté. En cas d'échec, les données mockées servent de repli.
 */
export const FallbackService = {
  async withFallback<T>(options: FallbackOptions<T>): Promise<T> {
    const { mockData, apiCall, errorMessage } = options;

    if (features.useMockData()) {
      return await mockData();
    }

    try {
      return await apiCall();
    } catch (error) {
      logger.warn(errorMessage ?? 'API call failed, falling back to mock data', error);
      return await mockData();
    }
  },
};

export default FallbackService;
