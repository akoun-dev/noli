/**
 * Système de logging structuré et centralisé
 * Remplace les console.log par un logger unifié avec niveaux et contexte
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  timestamp?: string
  environment?: string
  version?: string
  [key: string]: any
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
  timestamp: string
}

class Logger {
  private static instance: Logger
  private context: LogContext = {}
  private isDevelopment = import.meta.env.DEV
  private logLevel: LogLevel = this.getLogLevel()

  private static logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private constructor() {
    // Initialiser le contexte de base
    this.context = {
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
    }
  }

  private getLogLevel(): LogLevel {
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase()
    if (envLevel && ['debug', 'info', 'warn', 'error'].includes(envLevel)) {
      return envLevel as LogLevel
    }
    return this.isDevelopment ? 'debug' : 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.logLevels[level] >= Logger.logLevels[this.logLevel]
  }

  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context
      ? Object.entries(entry.context)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(' ')
      : ''

    const baseMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    return contextStr ? `${baseMessage} | ${contextStr}` : baseMessage
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    additionalContext?: LogContext
  ): LogEntry {
    return {
      level,
      message,
      error,
      context: {
        ...this.context,
        ...additionalContext,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const formattedMessage = this.formatMessage(entry)

    // Envoyer vers Sentry pour les erreurs
    if (entry.level === 'error' && window.Sentry) {
      window.Sentry.captureException(entry.error || new Error(entry.message), {
        tags: entry.context,
        extra: {
          level: entry.level,
          timestamp: entry.timestamp,
        },
      })
    }

    // Envoyer vers console en développement
    if (this.isDevelopment) {
      switch (entry.level) {
        case 'debug':
          console.debug(formattedMessage, entry.error, entry.context)
          break
        case 'info':
          console.info(formattedMessage, entry.error, entry.context)
          break
        case 'warn':
          console.warn(formattedMessage, entry.error, entry.context)
          break
        case 'error':
          console.error(formattedMessage, entry.error, entry.context)
          break
      }
    }

    // Envoyer vers un service de logging externe en production
    if (!this.isDevelopment && this.shouldLog(entry.level)) {
      this.sendToExternalService(entry)
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // Envoyer les logs vers un service externe (ex: Supabase, API custom, etc.)
      const logPayload = {
        level: entry.level,
        message: entry.message,
        context: entry.context,
        error: entry.error
          ? {
              name: entry.error.name,
              message: entry.error.message,
              stack: entry.error.stack,
            }
          : null,
        timestamp: entry.timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }

      // Exemple: envoi vers Supabase
      if (window.supabase) {
        await window.supabase.from('application_logs').insert(logPayload)
      }
    } catch (error) {
      // Éviter les boucles infinies de logging
      console.error('Failed to send log to external service:', error)
    }
  }

  // Méthodes publiques de logging
  debug(message: string, additionalContext?: LogContext): void {
    const entry = this.createLogEntry('debug', message, undefined, additionalContext)
    this.log(entry)
  }

  info(message: string, additionalContext?: LogContext): void {
    const entry = this.createLogEntry('info', message, undefined, additionalContext)
    this.log(entry)
  }

  warn(message: string, additionalContext?: LogContext): void {
    const entry = this.createLogEntry('warn', message, undefined, additionalContext)
    this.log(entry)
  }

  error(message: string, error?: Error, additionalContext?: LogContext): void {
    const entry = this.createLogEntry('error', message, error, additionalContext)
    this.log(entry)
  }

  // Méthodes pour le contexte
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  updateContext(updates: Partial<LogContext>): void {
    this.context = { ...this.context, ...updates }
  }

  clearContext(): void {
    this.context = {
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    }
  }

  // Méthodes utilitaires
  userAction(action: string, details?: any): void {
    this.info(`User action: ${action}`, {
      action,
      type: 'user_action',
      ...details,
    })
  }

  apiCall(method: string, url: string, status: number, duration?: number): void {
    const logLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info'
    const entry = this.createLogEntry(logLevel, `API ${method} ${url} - ${status}`, undefined, {
      type: 'api_call',
      method,
      url,
      status,
      duration,
    })
    this.log(entry)
  }

  performance(metric: string, value: number, unit?: string): void {
    this.info(`Performance: ${metric} = ${value}${unit || ''}`, {
      type: 'performance',
      metric,
      value,
      unit,
    })
  }

  featureUsage(feature: string, details?: any): void {
    this.info(`Feature used: ${feature}`, {
      type: 'feature_usage',
      feature,
      ...details,
    })
  }

  errorBoundary(error: Error, errorInfo: any, componentStack?: string): void {
    this.error('Error boundary caught an error', error, {
      type: 'error_boundary',
      errorInfo,
      componentStack,
    })
  }

  // Security specific logging
  security(message: string, additionalContext?: LogContext): void {
    const entry = this.createLogEntry('info', `🔒 [SECURITY] ${message}`, undefined, {
      type: 'security',
      ...additionalContext,
    })
    this.log(entry)
  }
}

// Export du logger singleton
export const logger = Logger.getInstance()

// Export des types pour usage externe
export { Logger }
export type { LogLevel, LogContext, LogEntry }
