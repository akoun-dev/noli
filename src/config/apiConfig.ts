// Configuration de l'API
// Permet de basculer entre les appels directs et les Edge Functions

export enum ApiMode {
  DIRECT = 'direct',      // Appels directs vers l'API externe
  EDGE_FUNCTION = 'edge', // Via Supabase Edge Functions
}

export const API_CONFIG = {
  // Mode d'appel API (direct ou edge function)
  mode: (import.meta.env.VITE_API_MODE || ApiMode.EDGE_FUNCTION) as ApiMode,

  // URL de l'API externe (mode direct)
  externalUrl: import.meta.env.VITE_EXTERNAL_API_URL || 'https://api.noliassurance.ci/v1',

  // Timeout en millisecondes
  timeout: 30000,

  // Configuration des Edge Functions
  edgeFunctions: {
    enabled: import.meta.env.VITE_EDGE_FUNCTIONS_ENABLED !== 'false',
    timeout: 25000,
    retries: 3,
    retryDelay: 1000,
  },

  // Configuration du mode direct
  directApi: {
    enabled: true,
    timeout: 30000,
  },

  // Headers par défaut
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  // Cache configuration
  cache: {
    enabled: import.meta.env.VITE_API_CACHE_ENABLED === 'true',
    ttl: 300000, // 5 minutes en millisecondes
  },
};

// Vérifie si le mode Edge Functions est actif
export function isEdgeFunctionMode(): boolean {
  return API_CONFIG.mode === ApiMode.EDGE_FUNCTION && API_CONFIG.edgeFunctions.enabled;
}

// Vérifie si le mode direct est actif
export function isDirectMode(): boolean {
  return API_CONFIG.mode === ApiMode.DIRECT && API_CONFIG.directApi.enabled;
}

// Retourne l'URL de l'API selon le mode
export function getApiUrl(): string {
  return isEdgeFunctionMode()
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
    : API_CONFIG.externalUrl;
}
