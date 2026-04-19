/**
 * Utilitaire de logging configuré pour remplacer console.log directs
 * Permet de contrôler les logs en fonction de l'environnement
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFileLogging: boolean
}

class Logger {
  private config: LoggerConfig
  private isDevelopment = import.meta.env.DEV

  constructor() {
    this.config = {
      level: this.isDevelopment ? 'debug' : 'error',
      enableConsole: this.isDevelopment,
      enableFileLogging: false,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    return levels[level] >= levels[this.config.level] && this.config.enableConsole
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`🔍 [DEBUG] ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`ℹ️ [INFO] ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [WARN] ${message}`, ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`❌ [ERROR] ${message}`, ...args)
    }
  }

  // Auth specific logging
  auth(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`🔐 [AUTH] ${message}`, ...args)
    }
  }

  // API specific logging
  api(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`🌐 [API] ${message}`, ...args)
    }
  }

  // Performance specific logging
  perf(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`⚡ [PERF] ${message}`, ...args)
    }
  }

  // Security specific logging
  security(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`🔒 [SECURITY] ${message}`, ...args)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for testing
export type { Logger }
