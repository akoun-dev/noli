/**
 * Content Security Policy configuration
 * Protège contre les attaques XSS et les injections de code
 */

export interface CSPConfig {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'font-src': string[]
  'connect-src': string[]
  'frame-src': string[]
  'object-src': string[]
  'media-src': string[]
  'manifest-src': string[]
  'worker-src': string[]
}

export class CSPManager {
  private static instance: CSPManager

  static getInstance(): CSPManager {
    if (!CSPManager.instance) {
      CSPManager.instance = new CSPManager()
    }
    return CSPManager.instance
  }

  /**
   * Génère une politique CSP stricte pour la production
   */
  getProductionCSP(): string {
    const cspConfig: CSPConfig = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        'https://cdn.supabase.co',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      'style-src': ["'self'", 'fonts.googleapis.com', 'https://cdn.supabase.co'],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://cdn.supabase.co',
        'https://images.unsplash.com',
      ],
      'font-src': ["'self'", 'fonts.gstatic.com', 'data:'],
      'connect-src': [
        "'self'",
        'https://api.supabase.co',
        'https://cdn.supabase.co',
        'https://*.supabase.co', // Support pour les URLs dynamiques Supabase
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'wss://api.supabase.co',
        'wss://*.supabase.co', // Support pour les WebSockets dynamiques Supabase
        // Ajout des URLs locales pour le développement
        'http://127.0.0.1:54321',
        'https://127.0.0.1:54321',
        'ws://127.0.0.1:54321',
        'wss://127.0.0.1:54321',
        'http://localhost:54321',
        'https://localhost:54321',
        'ws://localhost:54321',
        'wss://localhost:54321',
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'media-src': ["'self'", 'data:'],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
    }

    return this.buildCSPString(cspConfig)
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
        'https://cdn.supabase.co',
      ],
      'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'https://cdn.supabase.co'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:', 'https://cdn.supabase.co'],
      'font-src': ["'self'", 'fonts.gstatic.com', 'data:'],
      'connect-src': [
        "'self'",
        'ws:',
        'wss:',
        'http://127.0.0.1:54321', // Supabase local REST API
        'https://127.0.0.1:54321', // Supabase local REST API (HTTPS)
        'ws://127.0.0.1:54321', // Supabase local WebSocket
        'wss://127.0.0.1:54321', // Supabase local WebSocket (HTTPS)
        'http://localhost:54321', // Alternative localhost
        'https://localhost:54321', // Alternative localhost (HTTPS)
        'ws://localhost:54321', // Alternative localhost WebSocket
        'wss://localhost:54321', // Alternative localhost WebSocket (HTTPS)
        'https://api.supabase.co',
        'https://cdn.supabase.co',
        'https://brznmveoycrwlyksffvh.supabase.co', // URL directe du projet
        'wss://brznmveoycrwlyksffvh.supabase.co', // WebSocket direct
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'media-src': ["'self'", 'data:'],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
    }

    return this.buildCSPString(cspConfig)
  }

  /**
   * Construit la chaîne de caractères CSP à partir de la configuration
   */
  private buildCSPString(config: CSPConfig): string {
    return Object.entries(config)
      .map(([directive, sources]) => {
        const joinedSources = sources.join(' ')
        return `${directive} ${joinedSources}`
      })
      .join('; ')
  }

  /**
   * Injecte le CSP dans le head du document
   */
  injectCSP(): void {
    const isProduction = import.meta.env.PROD
    const cspValue = isProduction ? this.getProductionCSP() : this.getDevelopmentCSP()

    // Vérifier si le CSP est déjà défini
    if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      return
    }

    const meta = document.createElement('meta')
    meta.setAttribute('http-equiv', 'Content-Security-Policy')
    meta.setAttribute('content', cspValue)

    document.head.appendChild(meta)
  }

  /**
   * Génère un nonce pour les scripts/styles inline autorisés
   */
  generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Obtient un CSP avec nonce pour les scripts inline critiques
   */
  getProductionCSPWithNonce(nonce: string): string {
    const cspConfig: CSPConfig = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        `'nonce-${nonce}'`, // Permet les scripts inline avec nonce spécifique
        'https://cdn.supabase.co',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      'style-src': [
        "'self'",
        `'nonce-${nonce}'`, // Permet les styles inline avec nonce spécifique
        'fonts.googleapis.com',
        'https://cdn.supabase.co',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://cdn.supabase.co',
        'https://images.unsplash.com',
      ],
      'font-src': ["'self'", 'fonts.gstatic.com', 'data:'],
      'connect-src': [
        "'self'",
        'https://api.supabase.co',
        'https://cdn.supabase.co',
        'https://*.supabase.co',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'wss://api.supabase.co',
        'wss://*.supabase.co',
        // Ajout des URLs locales pour le développement
        'http://127.0.0.1:54321',
        'https://127.0.0.1:54321',
        'ws://127.0.0.1:54321',
        'wss://127.0.0.1:54321',
        'http://localhost:54321',
        'https://localhost:54321',
        'ws://localhost:54321',
        'wss://localhost:54321',
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'media-src': ["'self'", 'data:'],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
    }

    return this.buildCSPString(cspConfig)
  }

  /**
   * Retourne le CSP actuel sous forme d'objet pour inspection
   */
  inspectCurrentCSP(): CSPConfig | null {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')

    if (!cspMeta) {
      return null
    }

    const cspContent = cspMeta.getAttribute('content')
    if (!cspContent) {
      return null
    }

    const directives = cspContent.split(';').reduce((acc, directive) => {
      const [key, ...values] = directive.trim().split(' ')
      if (key && values.length > 0) {
        acc[key as keyof CSPConfig] = values
      }
      return acc
    }, {} as CSPConfig)

    return directives
  }

  /**
   * Valide que le CSP est correctement configuré
   */
  validateCSP(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    const currentCSP = this.inspectCurrentCSP()

    if (!currentCSP) {
      issues.push('Aucun CSP détecté')
      return { isValid: false, issues }
    }

    // Vérifications de sécurité critiques
    if (!currentCSP['script-src']?.includes("'self'")) {
      issues.push("script-src n'inclut pas 'self'")
    }

    if (currentCSP['script-src']?.includes("'unsafe-inline'") && import.meta.env.PROD) {
      issues.push("script-src inclut 'unsafe-inline' en production")
    }

    if (currentCSP['object-src']?.length && !currentCSP['object-src']?.includes("'none'")) {
      issues.push("object-src n'est pas défini à 'none'")
    }

    if (currentCSP['frame-src']?.length && !currentCSP['frame-src']?.includes("'none'")) {
      issues.push("frame-src n'est pas défini à 'none'")
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  }
}

// Export singleton
export const cspManager = CSPManager.getInstance()

// Hook React pour le CSP
export const useCSP = () => {
  return {
    injectCSP: () => cspManager.injectCSP(),
    getProductionCSP: () => cspManager.getProductionCSP(),
    getDevelopmentCSP: () => cspManager.getDevelopmentCSP(),
    getProductionCSPWithNonce: (nonce: string) => cspManager.getProductionCSPWithNonce(nonce),
    generateNonce: () => cspManager.generateNonce(),
    validateCSP: () => cspManager.validateCSP(),
    inspectCurrentCSP: () => cspManager.inspectCurrentCSP(),
  }
}
