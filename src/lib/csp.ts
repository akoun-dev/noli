/**
 * Content Security Policy configuration
 * Protège contre les attaques XSS et les injections de code
 */

export interface CSPConfig {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'media-src': string[];
  'manifest-src': string[];
  'worker-src': string[];
}

export class CSPManager {
  private static instance: CSPManager;

  static getInstance(): CSPManager {
    if (!CSPManager.instance) {
      CSPManager.instance = new CSPManager();
    }
    return CSPManager.instance;
  }

  /**
   * Génère une politique CSP stricte pour la production
   */
  getProductionCSP(): string {
    const cspConfig: CSPConfig = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Temporairement requis par Vite en dev
        "'unsafe-inline'", // Pour les styles inline et certains composants
        'https://cdn.supabase.co',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'fonts.googleapis.com',
        'https://cdn.supabase.co'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://cdn.supabase.co',
        'https://images.unsplash.com'
      ],
      'font-src': [
        "'self'",
        'fonts.gstatic.com',
        'data:'
      ],
      'connect-src': [
        "'self'",
        'https://api.supabase.co',
        'https://cdn.supabase.co',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'wss://api.supabase.co' // WebSocket
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:']
    };

    return this.buildCSPString(cspConfig);
  }

  /**
   * Génère une politique CSP pour le développement (plus permissive)
   */
  getDevelopmentCSP(): string {
    const cspConfig: CSPConfig = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        'ws:',
        'https://cdn.supabase.co'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'fonts.googleapis.com',
        'https://cdn.supabase.co'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://cdn.supabase.co'
      ],
      'font-src': [
        "'self'",
        'fonts.gstatic.com',
        'data:'
      ],
      'connect-src': [
        "'self'",
        'ws:',
        'wss:',
        'https://api.supabase.co',
        'https://cdn.supabase.co'
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:']
    };

    return this.buildCSPString(cspConfig);
  }

  /**
   * Construit la chaîne de caractères CSP à partir de la configuration
   */
  private buildCSPString(config: CSPConfig): string {
    return Object.entries(config)
      .map(([directive, sources]) => {
        const joinedSources = sources.join(' ');
        return `${directive} ${joinedSources}`;
      })
      .join('; ');
  }

  /**
   * Injecte le CSP dans le head du document
   */
  injectCSP(): void {
    const isProduction = import.meta.env.PROD;
    const cspValue = isProduction ? this.getProductionCSP() : this.getDevelopmentCSP();

    // Vérifier si le CSP est déjà défini
    if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      return;
    }

    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Security-Policy');
    meta.setAttribute('content', cspValue);

    document.head.appendChild(meta);
  }

  /**
   * Retourne le CSP actuel sous forme d'objet pour inspection
   */
  inspectCurrentCSP(): CSPConfig | null {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    if (!cspMeta) {
      return null;
    }

    const cspContent = cspMeta.getAttribute('content');
    if (!cspContent) {
      return null;
    }

    const directives = cspContent.split(';').reduce((acc, directive) => {
      const [key, ...values] = directive.trim().split(' ');
      if (key && values.length > 0) {
        acc[key as keyof CSPConfig] = values;
      }
      return acc;
    }, {} as CSPConfig);

    return directives;
  }

  /**
   * Valide que le CSP est correctement configuré
   */
  validateCSP(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const currentCSP = this.inspectCurrentCSP();

    if (!currentCSP) {
      issues.push('Aucun CSP détecté');
      return { isValid: false, issues };
    }

    // Vérifications de sécurité critiques
    if (!currentCSP['script-src']?.includes("'self'")) {
      issues.push("script-src n'inclut pas 'self'");
    }

    if (currentCSP['script-src']?.includes("'unsafe-inline'") && import.meta.env.PROD) {
      issues.push("script-src inclut 'unsafe-inline' en production");
    }

    if (currentCSP['object-src']?.length && !currentCSP['object-src']?.includes("'none'")) {
      issues.push("object-src n'est pas défini à 'none'");
    }

    if (currentCSP['frame-src']?.length && !currentCSP['frame-src']?.includes("'none'")) {
      issues.push("frame-src n'est pas défini à 'none'");
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton
export const cspManager = CSPManager.getInstance();

// Hook React pour le CSP
export const useCSP = () => {
  return {
    injectCSP: () => cspManager.injectCSP(),
    getProductionCSP: () => cspManager.getProductionCSP(),
    getDevelopmentCSP: () => cspManager.getDevelopmentCSP(),
    validateCSP: () => cspManager.validateCSP(),
    inspectCurrentCSP: () => cspManager.inspectCurrentCSP()
  };
};