/**
 * Security Management Service
 * Implémentation des fonctionnalités de sécurité avancées selon auth-agent.md
 */

import { logger } from '@/lib/logger'

export interface RateLimitConfig {
  maxAttempts: number
  lockoutDurationMinutes: number
  progressiveDelay: boolean
  windowMinutes: number
}

export interface AttemptLog {
  email: string
  timestamp: number
  ip?: string
  userAgent?: string
  success: boolean
  type: 'login' | 'register' | 'password_reset'
}

export interface SecurityRisk {
  level: 'low' | 'medium' | 'high' | 'critical'
  reasons: string[]
  score: number
}

export interface CaptchaConfig {
  enabled: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  threshold: number // Score de risque pour déclencher
}

class SecurityManager {
  private static instance: SecurityManager
  private attempts = new Map<string, AttemptLog[]>()
  private lockedAccounts = new Map<string, number>() // email -> unlock timestamp
  private suspiciousIPs = new Map<string, number>() // IP -> lock timestamp

  private readonly rateLimitConfig: RateLimitConfig = {
    maxAttempts: 5,
    lockoutDurationMinutes: 15,
    progressiveDelay: true,
    windowMinutes: 15
  }

  private readonly captchaConfig: CaptchaConfig = {
    enabled: true,
    difficulty: 'medium',
    threshold: 30
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  /**
   * Vérifie si une tentative est autorisée selon le rate limiting
   */
  async checkRateLimit(email: string, type: AttemptLog['type'], context?: {
    ip?: string
    userAgent?: string
  }): Promise<{ allowed: boolean; remainingAttempts: number; lockoutTime?: number }> {
    const now = Date.now()
    const windowStart = now - (this.rateLimitConfig.windowMinutes * 60 * 1000)

    // Nettoyer les anciennes tentatives
    this.cleanupOldAttempts(windowStart)

    // Vérifier si le compte est verrouillé
    const lockTime = this.lockedAccounts.get(email)
    if (lockTime && lockTime > now) {
      logger.security(`Account locked for ${email}, unlock in ${Math.ceil((lockTime - now) / 60000)} minutes`)
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutTime: lockTime
      }
    }

    // Vérifier les tentatives récentes
    const recentAttempts = this.getRecentAttempts(email, type, windowStart)
    const failedAttempts = recentAttempts.filter(a => !a.success)

    logger.security(`Rate limit check for ${email}: ${failedAttempts.length}/${this.rateLimitConfig.maxAttempts} failed attempts`)

    if (failedAttempts.length >= this.rateLimitConfig.maxAttempts) {
      // Verrouiller le compte
      const lockDuration = this.calculateLockDuration(failedAttempts.length)
      const unlockTime = now + (lockDuration * 60 * 1000)

      this.lockedAccounts.set(email, unlockTime)

      logger.security(`Account locked for ${email} for ${lockDuration} minutes due to ${failedAttempts.length} failed attempts`)

      // Logger l'activité suspecte
      await this.logSuspiciousActivity({
        email,
        type: 'rate_limit_exceeded',
        details: {
          attempts: failedAttempts.length,
          lockDuration,
          ip: context?.ip,
          userAgent: context?.userAgent
        }
      })

      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutTime: unlockTime
      }
    }

    const remainingAttempts = Math.max(0, this.rateLimitConfig.maxAttempts - failedAttempts.length)
    return { allowed: true, remainingAttempts }
  }

  /**
   * Enregistre une tentative d'authentification
   */
  logAttempt(email: string, success: boolean, type: AttemptLog['type'], context?: {
    ip?: string
    userAgent?: string
  }): void {
    const attempt: AttemptLog = {
      email,
      timestamp: Date.now(),
      ip: context?.ip,
      userAgent: context?.userAgent,
      success,
      type
    }

    const attempts = this.attempts.get(email) || []
    attempts.push(attempt)
    this.attempts.set(email, attempts)

    logger.security(`Logged ${type} attempt for ${email}: ${success ? 'SUCCESS' : 'FAILED'}`)

    // Si la tentative a réussi, réinitialiser le compteur
    if (success) {
      this.lockedAccounts.delete(email)
    }
  }

  /**
   * Évalue le niveau de risque d'une connexion
   */
  async assessRisk(email: string, context?: {
    ip?: string
    userAgent?: string
    timestamp?: number
  }): Promise<SecurityRisk> {
    const risk: SecurityRisk = {
      level: 'low',
      reasons: [],
      score: 0
    }

    const now = context?.timestamp || Date.now()
    const windowStart = now - (60 * 60 * 1000) // 1 heure

    // 1. Vérifier l'historique des tentatives
    const recentAttempts = this.getRecentAttempts(email, 'login', windowStart)
    const failedAttempts = recentAttempts.filter(a => !a.success)

    if (failedAttempts.length > 3) {
      risk.score += 10 * failedAttempts.length
      risk.reasons.push(`${failedAttempts.length} failed login attempts in last hour`)
    }

    // 2. Vérifier si l'IP est suspecte
    if (context?.ip) {
      const ipAttempts = Array.from(this.attempts.values())
        .flat()
        .filter(a => a.ip === context.ip && a.timestamp > windowStart)

      if (ipAttempts.length > 10) {
        risk.score += 20
        risk.reasons.push(`Suspicious IP activity: ${ipAttempts.length} attempts from ${context.ip}`)
      }
    }

    // 3. Vérifier les patterns temporels (attaques automatisées)
    const timeGaps = recentAttempts.slice(1).map((attempt, i) =>
      attempt.timestamp - recentAttempts[i].timestamp
    )

    const avgGap = timeGaps.length > 0 ? timeGaps.reduce((a, b) => a + b) / timeGaps.length : 0
    if (avgGap < 5000 && recentAttempts.length > 5) { // Moins de 5 secondes en moyenne
      risk.score += 15
      risk.reasons.push('Automated attack pattern detected')
    }

    // 4. Vérifier le user agent
    if (context?.userAgent) {
      // User agents vides ou suspects
      if (!context.userAgent || context.userAgent.length < 10) {
        risk.score += 10
        risk.reasons.push('Suspicious or missing user agent')
      }

      // Vérifier si c'est un bot connu
      const botPatterns = ['bot', 'crawler', 'spider', 'scraper']
      if (botPatterns.some(pattern => context.userAgent!.toLowerCase().includes(pattern))) {
        risk.score += 25
        risk.reasons.push('Bot or crawler detected')
      }
    }

    // 5. Vérifier l'heure (attaques nocturnes)
    const hour = new Date(now).getHours()
    if (hour >= 2 && hour <= 5) {
      risk.score += 5
      risk.reasons.push('Unusual login time (2 AM - 5 AM)')
    }

    // Déterminer le niveau de risque
    if (risk.score >= 50) {
      risk.level = 'critical'
    } else if (risk.score >= 35) {
      risk.level = 'high'
    } else if (risk.score >= 20) {
      risk.level = 'medium'
    } else {
      risk.level = 'low'
    }

    logger.security(`Risk assessment for ${email}: ${risk.level} (${risk.score} points) - ${risk.reasons.join(', ')}`)

    return risk
  }

  /**
   * Détermine si un CAPTCHA est nécessaire
   */
  shouldRequireCaptcha(risk: SecurityRisk): boolean {
    return this.captchaConfig.enabled && risk.score >= this.captchaConfig.threshold
  }

  /**
   * Configure le CAPTCHA selon le niveau de risque
   */
  getCaptchaConfig(risk: SecurityRisk): CaptchaConfig {
    if (risk.level === 'critical') {
      return {
        ...this.captchaConfig,
        difficulty: 'hard'
      }
    } else if (risk.level === 'high') {
      return {
        ...this.captchaConfig,
        difficulty: 'medium'
      }
    } else {
      return {
        ...this.captchaConfig,
        difficulty: 'easy'
      }
    }
  }

  /**
   * Vérifie la force d'un mot de passe
   */
  checkPasswordStrength(password: string): {
    score: number
    feedback: string[]
    isStrong: boolean
  } {
    const feedback: string[] = []
    let score = 0

    // Longueur
    if (password.length >= 8) {
      score += 20
    } else {
      feedback.push('Le mot de passe doit contenir au moins 8 caractères')
    }

    if (password.length >= 12) {
      score += 10
    }

    // Complexité
    if (/[a-z]/.test(password)) {
      score += 15
    } else {
      feedback.push('Ajoutez des lettres minuscules')
    }

    if (/[A-Z]/.test(password)) {
      score += 15
    } else {
      feedback.push('Ajoutez des lettres majuscules')
    }

    if (/[0-9]/.test(password)) {
      score += 15
    } else {
      feedback.push('Ajoutez des chiffres')
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 15
    } else {
      feedback.push('Ajoutez des caractères spéciaux')
    }

    // Patterns communs
    const commonPatterns = ['123456', 'password', 'qwerty', 'azerty', 'admin']
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      score -= 20
      feedback.push('Évitez les mots de passe communs')
    }

    // Répétitions
    if (/(.)\1{2,}/.test(password)) {
      score -= 10
      feedback.push('Évitez les répétitions de caractères')
    }

    const isStrong = score >= 60
    return { score: Math.max(0, Math.min(100, score)), feedback, isStrong }
  }

  /**
   * Nettoie les anciennes tentatives
   */
  private cleanupOldAttempts(cutoffTime: number): void {
    for (const [email, attempts] of this.attempts.entries()) {
      const recent = attempts.filter(a => a.timestamp > cutoffTime)
      if (recent.length === 0) {
        this.attempts.delete(email)
      } else {
        this.attempts.set(email, recent)
      }
    }

    // Nettoyer les comptes verrouillés expirés
    const now = Date.now()
    for (const [email, lockTime] of this.lockedAccounts.entries()) {
      if (lockTime <= now) {
        this.lockedAccounts.delete(email)
        logger.security(`Account lockout expired for ${email}`)
      }
    }
  }

  /**
   * Récupère les tentatives récentes pour un email et type
   */
  private getRecentAttempts(email: string, type: AttemptLog['type'], since: number): AttemptLog[] {
    const attempts = this.attempts.get(email) || []
    return attempts.filter(a => a.type === type && a.timestamp > since)
  }

  /**
   * Calcule la durée de verrouillage selon le nombre d'échecs
   */
  private calculateLockDuration(failedAttempts: number): number {
    if (!this.rateLimitConfig.progressiveDelay) {
      return this.rateLimitConfig.lockoutDurationMinutes
    }

    // Durée progressive: 15min, 30min, 1h, 2h, 4h
    const baseDuration = this.rateLimitConfig.lockoutDurationMinutes
    const extraAttempts = Math.max(0, failedAttempts - this.rateLimitConfig.maxAttempts)
    return baseDuration * Math.pow(2, Math.min(extraAttempts, 4))
  }

  /**
   * Logger une activité suspecte
   */
  private async logSuspiciousActivity(activity: {
    email: string
    type: string
    details: any
  }): Promise<void> {
    try {
      // En production, envoyer à Sentry ou autre système de monitoring
      logger.security('Suspicious activity detected:', {
        email: activity.email,
        type: activity.type,
        details: activity.details,
        timestamp: new Date().toISOString()
      })

      // TODO: Intégrer avec Supabase pour stocker en base
      // await supabaseHelpers.logSecurityActivity(activity)
    } catch (error) {
      logger.error('Failed to log suspicious activity:', error)
    }
  }

  /**
   * Récupère les statistiques de sécurité pour monitoring
   */
  getSecurityStats(): {
    totalLockedAccounts: number
    totalAttempts: number
    failedAttemptsByHour: Record<string, number>
    topRiskIPs: Array<{ ip: string; attempts: number }>
  } {
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)

    // Compter les tentatives par heure
    const failedAttemptsByHour: Record<string, number> = {}
    const ipCounts = new Map<string, number>()

    let totalAttempts = 0
    for (const attempts of this.attempts.values()) {
      const recentAttempts = attempts.filter(a => a.timestamp > hourAgo && !a.success)
      totalAttempts += recentAttempts.length

      recentAttempts.forEach(attempt => {
        const hour = new Date(attempt.timestamp).getHours()
        failedAttemptsByHour[hour] = (failedAttemptsByHour[hour] || 0) + 1

        if (attempt.ip) {
          ipCounts.set(attempt.ip, (ipCounts.get(attempt.ip) || 0) + 1)
        }
      })
    }

    // Top IPs suspectes
    const topRiskIPs = Array.from(ipCounts.entries())
      .map(([ip, attempts]) => ({ ip, attempts }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10)

    return {
      totalLockedAccounts: this.lockedAccounts.size,
      totalAttempts,
      failedAttemptsByHour,
      topRiskIPs
    }
  }
}

export const securityManager = SecurityManager.getInstance()