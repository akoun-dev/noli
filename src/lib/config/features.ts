/**
 * Configuration des flags de fonctionnalités
 * Permet de contrôler dynamiquement le comportement de l'application
 */

export interface FeatureFlags {
  // Utilisation de données mockées
  USE_MOCK_DATA: boolean;
  // Mode développement
  DEV_MODE: boolean;
  // Mode debug
  DEBUG: boolean;
  // Services externes
  ENABLE_SOCIAL_LOGIN: boolean;
  ENABLE_PHONE_VERIFICATION: boolean;
  ENABLE_MFA: boolean;
  // Fonctionnalités business
  ENABLE_QUOTE_COMPARISON: boolean;
  ENABLE_ONLINE_PAYMENT: boolean;
  // Analyse et monitoring
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_TRACKING: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
}

/**
 * Configuration par défaut des flags
 */
const DEFAULT_FEATURES: FeatureFlags = {
  USE_MOCK_DATA: false,
  DEV_MODE: true,
  DEBUG: false,
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_PHONE_VERIFICATION: true,
  ENABLE_MFA: false,
  ENABLE_QUOTE_COMPARISON: true,
  ENABLE_ONLINE_PAYMENT: true,
  ENABLE_ANALYTICS: false,
  ENABLE_ERROR_TRACKING: false,
  ENABLE_PERFORMANCE_MONITORING: false,
};

/**
 * Récupère la valeur d'un flag depuis les variables d'environnement
 */
function getFeatureFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  const envValue = import.meta.env[`VITE_${key}`];

  if (envValue === undefined) {
    return DEFAULT_FEATURES[key];
  }

  // Conversion string vers le type approprié
  switch (typeof DEFAULT_FEATURES[key]) {
    case 'boolean':
      return (envValue === 'true') as unknown as FeatureFlags[K];
    case 'string':
      return envValue as FeatureFlags[K];
    case 'number':
      return Number(envValue) as unknown as FeatureFlags[K];
    default:
      return envValue as FeatureFlags[K];
  }
}

/**
 * Configuration des flags de fonctionnalités
 */
export const features = {
  get USE_MOCK_DATA(): boolean {
    return getFeatureFlag('USE_MOCK_DATA');
  },

  get DEV_MODE(): boolean {
    return getFeatureFlag('DEV_MODE');
  },

  get DEBUG(): boolean {
    return getFeatureFlag('DEBUG');
  },

  get ENABLE_SOCIAL_LOGIN(): boolean {
    return getFeatureFlag('ENABLE_SOCIAL_LOGIN');
  },

  get ENABLE_PHONE_VERIFICATION(): boolean {
    return getFeatureFlag('ENABLE_PHONE_VERIFICATION');
  },

  get ENABLE_MFA(): boolean {
    return getFeatureFlag('ENABLE_MFA');
  },

  get ENABLE_QUOTE_COMPARISON(): boolean {
    return getFeatureFlag('ENABLE_QUOTE_COMPARISON');
  },

  get ENABLE_ONLINE_PAYMENT(): boolean {
    return getFeatureFlag('ENABLE_ONLINE_PAYMENT');
  },

  get ENABLE_ANALYTICS(): boolean {
    return getFeatureFlag('ENABLE_ANALYTICS');
  },

  get ENABLE_ERROR_TRACKING(): boolean {
    return getFeatureFlag('ENABLE_ERROR_TRACKING');
  },

  get ENABLE_PERFORMANCE_MONITORING(): boolean {
    return getFeatureFlag('ENABLE_PERFORMANCE_MONITORING');
  },

  /**
   * Vérifie si un flag spécifique est activé
   */
  isEnabled<K extends keyof FeatureFlags>(flag: K): boolean {
    return features[flag as keyof typeof features] as boolean;
  },

  /**
   * Vérifie si le mode développement est actif
   */
  isDevelopment(): boolean {
    return features.DEV_MODE && import.meta.env.DEV;
  },

  /**
   * Vérifie si le mode production est actif
   */
  isProduction(): boolean {
    return !import.meta.env.DEV;
  },

  /**
   * Vérifie si les données mockées sont activées
   */
  useMockData(): boolean {
    return features.USE_MOCK_DATA;
  },

  /**
   * Affiche les flags actifs en mode développement
   */
  logActiveFeatures(): void {
    if (features.isDevelopment()) {
      console.group('🚀 Active Feature Flags');

      Object.entries(DEFAULT_FEATURES).forEach(([key, defaultValue]) => {
        const current = features.isEnabled(key as keyof FeatureFlags);
        const status = current ? '✅' : '❌';
        const changed = current !== defaultValue;
        const changedIndicator = changed ? ' (changed)' : '';

        console.log(`${status} ${key}${changedIndicator}`);
      });

      console.groupEnd();
    }
  },
};

/**
 * Hook React pour utiliser les flags de fonctionnalités
 */
export const useFeatureFlags = () => {
  return features;
};