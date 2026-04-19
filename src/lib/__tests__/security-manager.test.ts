/**
 * Tests pour le SecurityManager
 * Couvre les fonctionnalités de rate limiting, évaluation de risque et validation de mots de passe
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { securityManager } from '../security-manager'

describe('SecurityManager', () => {
  beforeEach(() => {
    // Nettoyer l'état avant chaque test
    securityManager.cleanup(0)
  })

  afterEach(() => {
    // Nettoyer après chaque test
    securityManager.cleanup(0)
  })

  describe('Rate Limiting', () => {
    it('should allow login attempts within limit', async () => {
      const email = 'test@example.com'
      const context = { ip: '192.168.1.1', userAgent: 'test-agent' }

      // Première tentative
      const result1 = await securityManager.checkRateLimit(email, 'login', context)
      expect(result1.allowed).toBe(true)
      expect(result1.remainingAttempts).toBe(5)

      // Quelques tentatives supplémentaires
      for (let i = 0; i < 3; i++) {
        await securityManager.checkRateLimit(email, 'login', context)
        securityManager.logAttempt(email, false, 'login', context)
      }

      const result2 = await securityManager.checkRateLimit(email, 'login', context)
      expect(result2.allowed).toBe(true)
      expect(result2.remainingAttempts).toBe(2)
    })

    it('should block after too many failed attempts', async () => {
      const email = 'blocked@example.com'
      const context = { ip: '192.168.1.2', userAgent: 'test-agent' }

      // Enregistrer 5 tentatives échouées
      for (let i = 0; i < 5; i++) {
        securityManager.logAttempt(email, false, 'login', context)
      }

      const result = await securityManager.checkRateLimit(email, 'login', context)
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
      expect(result.lockoutTime).toBeDefined()
    })

    it('should reset on successful login', async () => {
      const email = 'success@example.com'
      const context = { ip: '192.168.1.3', userAgent: 'test-agent' }

      // Quelques tentatives échouées
      for (let i = 0; i < 3; i++) {
        securityManager.logAttempt(email, false, 'login', context)
      }

      let result = await securityManager.checkRateLimit(email, 'login', context)
      expect(result.remainingAttempts).toBe(2)

      // Tentative réussie
      securityManager.logAttempt(email, true, 'login', context)

      // Le compteur devrait être réinitialisé
      result = await securityManager.checkRateLimit(email, 'login', context)
      expect(result.remainingAttempts).toBe(5)
    })

    it('should implement progressive delay', async () => {
      const email = 'progressive@example.com'
      const context = { ip: '192.168.1.4', userAgent: 'test-agent' }

      // 7 tentatives échouées (5 + 2 supplémentaires)
      for (let i = 0; i < 7; i++) {
        securityManager.logAttempt(email, false, 'login', context)
      }

      const result = await securityManager.checkRateLimit(email, 'login', context)
      expect(result.allowed).toBe(false)

      // Vérifier que le temps de verrouillage est plus long que la base
      const baseTime = 15 * 60 * 1000 // 15 minutes
      const lockTime = result.lockoutTime! - Date.now()
      expect(lockTime).toBeGreaterThan(baseTime)
    })
  })

  describe('Risk Assessment', () => {
    it('should assess low risk for normal behavior', async () => {
      const email = 'normal@example.com'
      const context = {
        ip: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: Date.now()
      }

      const risk = await securityManager.assessRisk(email, context)
      expect(risk.level).toBe('low')
      expect(risk.score).toBeLessThan(20)
    })

    it('should increase risk for suspicious user agent', async () => {
      const email = 'suspicious@example.com'
      const context = {
        ip: '192.168.1.11',
        userAgent: 'bot/1.0',
        timestamp: Date.now()
      }

      const risk = await securityManager.assessRisk(email, context)
      expect(risk.level).toBe('medium')
      expect(risk.reasons).toContain('Bot or crawler detected')
    })

    it('should increase risk for unusual timing', async () => {
      const email = 'unusual@example.com'
      const nightTime = new Date()
      nightTime.setHours(3, 0, 0, 0) // 3 AM

      const context = {
        ip: '192.168.1.12',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: nightTime.getTime()
      }

      const risk = await securityManager.assessRisk(email, context)
      expect(risk.reasons).toContain('Unusual login time (2 AM - 5 AM)')
    })

    it('should detect high risk patterns', async () => {
      const email = 'highrisk@example.com'

      // Simuler plusieurs tentatives échouées
      const context = {
        ip: '192.168.1.13',
        userAgent: 'test-bot',
        timestamp: Date.now()
      }

      for (let i = 0; i < 5; i++) {
        securityManager.logAttempt(email, false, 'login', context)
      }

      const risk = await securityManager.assessRisk(email, context)
      expect(risk.level).toBe('high')
      expect(risk.score).toBeGreaterThanOrEqual(35)
    })
  })

  describe('CAPTCHA Requirements', () => {
    it('should require CAPTCHA for high risk', () => {
      const highRisk = {
        level: 'high' as const,
        score: 40,
        reasons: ['Multiple failed attempts'],
        score: 40
      }

      const required = securityManager.shouldRequireCaptcha(highRisk)
      expect(required).toBe(true)
    })

    it('should not require CAPTCHA for low risk', () => {
      const lowRisk = {
        level: 'low' as const,
        score: 10,
        reasons: [],
        score: 10
      }

      const required = securityManager.shouldRequireCaptcha(lowRisk)
      expect(required).toBe(false)
    })

    it('should adjust CAPTCHA difficulty based on risk', () => {
      const criticalRisk = {
        level: 'critical' as const,
        score: 60,
        reasons: ['Automated attack detected'],
        score: 60
      }

      const config = securityManager.getCaptchaConfig(criticalRisk)
      expect(config.difficulty).toBe('hard')
    })
  })

  describe('Password Strength Validation', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd'
      const result = securityManager.checkPasswordStrength(strongPassword)

      expect(result.isStrong).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(60)
      expect(result.feedback).toHaveLength(0)
    })

    it('should reject weak passwords', () => {
      const weakPassword = 'password'
      const result = securityManager.checkPasswordStrength(weakPassword)

      expect(result.isStrong).toBe(false)
      expect(result.score).toBeLessThan(40)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('should check password requirements', () => {
      const tests = [
        { password: 'short', shouldHave: ['Le mot de passe doit contenir au moins 8 caractères'] },
        { password: 'nocapital123!', shouldHave: ['Le mot de passe doit contenir au moins une lettre majuscule'] },
        { password: 'NOLOWER123!', shouldHave: ['Le mot de passe doit contenir au moins une lettre minuscule'] },
        { password: 'NoNumbers!', shouldHave: ['Le mot de passe doit contenir au moins un chiffre'] },
        { password: 'NoSpecial123', shouldHave: ['Le mot de passe doit contenir au moins un caractère spécial'] }
      ]

      tests.forEach(({ password, shouldHave }) => {
        const result = securityManager.checkPasswordStrength(password)
        shouldHave.forEach(message => {
          expect(result.feedback).toContain(message)
        })
      })
    })

    it('should detect common passwords', () => {
      const commonPassword = 'Password123!'
      const result = securityManager.checkPasswordStrength(commonPassword)

      expect(result.feedback).toContain('Le mot de passe est trop commun et facile à deviner')
    })

    it('should detect repeated characters', () => {
      const repeatedPassword = 'AAAaaa123!'
      const result = securityManager.checkPasswordStrength(repeatedPassword)

      expect(result.feedback).toContain('Évitez les répétitions de caractères')
    })

    it('should detect sequences', () => {
      const sequencePassword = 'Abcdef123!'
      const result = securityManager.checkPasswordStrength(sequencePassword)

      expect(result.feedback).toContain('Évitez les séquences de caractères consécutifs')
    })
  })

  describe('Security Statistics', () => {
    it('should provide security statistics', () => {
      // Simuler quelques activités
      securityManager.logAttempt('user1@example.com', true, 'login')
      securityManager.logAttempt('user2@example.com', false, 'login')
      securityManager.logAttempt('user2@example.com', false, 'login')

      const stats = securityManager.getSecurityStats()

      expect(stats.totalLockedAccounts).toBeGreaterThanOrEqual(0)
      expect(stats.totalAttempts).toBeGreaterThanOrEqual(0)
      expect(typeof stats.failedAttemptsByHour).toBe('object')
      expect(Array.isArray(stats.topRiskIPs)).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty context gracefully', async () => {
      const email = 'edge@example.com'

      const risk = await securityManager.assessRisk(email)
      expect(risk).toBeDefined()
      expect(risk.level).toBe('low')

      const result = await securityManager.checkRateLimit(email, 'login')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })

    it('should handle concurrent access', async () => {
      const email = 'concurrent@example.com'
      const context = { ip: '192.168.1.100', userAgent: 'test-agent' }

      // Simuler plusieurs requêtes simultanées
      const promises = Array.from({ length: 10 }, (_, i) =>
        securityManager.checkRateLimit(email, 'login', context)
      )

      const results = await Promise.all(promises)

      // Tous devraient être autorisés (pas encore de tentatives échouées enregistrées)
      results.forEach(result => {
        expect(result.allowed).toBe(true)
      })
    })

    it('should cleanup old data', () => {
      const email = 'cleanup@example.com'
      const context = { ip: '192.168.1.200', userAgent: 'test-agent' }

      // Ajouter des données
      securityManager.logAttempt(email, false, 'login', context)

      let stats = securityManager.getSecurityStats()
      expect(stats.totalAttempts).toBeGreaterThan(0)

      // Nettoyer les données récentes
      securityManager.cleanup(0)

      stats = securityManager.getSecurityStats()
      expect(stats.totalAttempts).toBe(0)
    })
  })
})