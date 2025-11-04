/**
 * Tests pour les schémas de validation Zod améliorés
 * Vérifie la validation renforcée des mots de passe
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetPasswordFormData
} from '../zod-schemas'

describe('Enhanced Zod Schemas', () => {
  describe('Login Schema', () => {
    it('should validate correct login data', () => {
      const validData: LoginFormData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email invalide')
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Register Schema', () => {
    const validBaseData: RegisterFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      phone: '+2250712345678',
      password: 'MyStr0ng!P@ssw0rd',
      confirmPassword: 'MyStr0ng!P@ssw0rd'
    }

    it('should validate correct registration data with personal info', () => {
      const result = registerSchema.safeParse(validBaseData)
      expect(result.success).toBe(true)
    })

    it('should validate correct registration data with company info', () => {
      const companyData = {
        ...validBaseData,
        firstName: '',
        lastName: '',
        companyName: 'Test Company'
      }

      const result = registerSchema.safeParse(companyData)
      expect(result.success).toBe(true)
    })

    it('should require either personal info or company info', () => {
      const invalidData = {
        email: 'test@example.com',
        phone: '+2250712345678',
        password: 'MyStr0ng!P@ssw0rd',
        confirmPassword: 'MyStr0ng!P@ssw0rd'
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('soit un nom et prénom, soit un nom d\'entreprise')
      }
    })

    it('should validate enhanced password requirements', () => {
      const testCases = [
        {
          password: 'short',
          expectedError: 'Le mot de passe doit contenir au moins 8 caractères'
        },
        {
          password: 'nocapital123!',
          expectedError: 'Le mot de passe doit contenir au moins une lettre majuscule'
        },
        {
          password: 'NOLOWER123!',
          expectedError: 'Le mot de passe doit contenir au moins une lettre minuscule'
        },
        {
          password: 'NoNumbers!',
          expectedError: 'Le mot de passe doit contenir au moins un chiffre'
        },
        {
          password: 'NoSpecial123',
          expectedError: 'Le mot de passe doit contenir au moins un caractère spécial'
        },
        {
          password: 'Password123!',
          expectedError: 'Le mot de passe est trop commun'
        },
        {
          password: 'AAAaaa123!',
          expectedError: 'Évitez les répétitions de caractères'
        },
        {
          password: 'Abcdef123!',
          expectedError: 'Évitez les séquences de caractères consécutifs'
        }
      ]

      testCases.forEach(({ password, expectedError }) => {
        const testData = {
          ...validBaseData,
          password,
          confirmPassword: password
        }

        const result = registerSchema.safeParse(testData)
        expect(result.success).toBe(false)
        if (!result.success) {
          const hasExpectedError = result.error.issues.some(
            issue => issue.message === expectedError
          )
          expect(hasExpectedError).toBe(true)
        }
      })
    })

    it('should accept strong password', () => {
      const strongData = {
        ...validBaseData,
        password: 'MyVeryStr0ng!Secur3P@ssw0rd2024',
        confirmPassword: 'MyVeryStr0ng!Secur3P@ssw0rd2024'
      }

      const result = registerSchema.safeParse(strongData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const mismatchedData = {
        ...validBaseData,
        password: 'MyStr0ng!P@ssw0rd',
        confirmPassword: 'DifferentP@ssw0rd'
      }

      const result = registerSchema.safeParse(mismatchedData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Les mots de passe ne correspondent pas')
      }
    })

    it('should validate phone number format', () => {
      const testCases = [
        { phone: '+2250712345678', valid: true },
        { phone: '0712345678', valid: true },
        { phone: '071234567', valid: false },
        { phone: '+22507123456789', valid: false },
        { phone: '07-12-34-56-78', valid: false }
      ]

      testCases.forEach(({ phone, valid }) => {
        const testData = { ...validBaseData, phone }
        const result = registerSchema.safeParse(testData)

        if (valid) {
          expect(result.success).toBe(true)
        } else {
          expect(result.success).toBe(false)
        }
      })
    })
  })

  describe('Reset Password Schema', () => {
    const validResetData = {
      password: 'NewStr0ng!P@ssw0rd',
      confirmPassword: 'NewStr0ng!P@ssw0rd'
    }

    it('should validate correct reset password data', () => {
      const result = resetPasswordSchema.safeParse(validResetData)
      expect(result.success).toBe(true)
    })

    it('should apply enhanced password validation to reset', () => {
      const weakData = {
        password: 'weak',
        confirmPassword: 'weak'
      }

      const result = resetPasswordSchema.safeParse(weakData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched reset passwords', () => {
      const mismatchedResetData = {
        password: 'NewStr0ng!P@ssw0rd',
        confirmPassword: 'DifferentP@ssw0rd'
      }

      const result = resetPasswordSchema.safeParse(mismatchedResetData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Les mots de passe ne correspondent pas')
      }
    })
  })

  describe('Password Edge Cases', () => {
    it('should handle password with unicode characters', () => {
      const unicodePassword = 'MøtDePàsseStr0ngé!2024'
      const testData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250712345678',
        password: unicodePassword,
        confirmPassword: unicodePassword
      }

      const result = registerSchema.safeParse(testData)
      expect(result.success).toBe(true)
    })

    it('should reject password with only special characters', () => {
      const specialOnlyPassword = '!@#$%^&*()'
      const testData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250712345678',
        password: specialOnlyPassword,
        confirmPassword: specialOnlyPassword
      }

      const result = registerSchema.safeParse(testData)
      expect(result.success).toBe(false)
    })

    it('should handle very long strong passwords', () => {
      const longPassword = 'MyVeryVeryLongStr0ng!Secur3P@ssw0rdThatExceedsNormalLengthButIsStillValid2024!'
      const testData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250712345678',
        password: longPassword,
        confirmPassword: longPassword
      }

      const result = registerSchema.safeParse(testData)
      expect(result.success).toBe(true)
    })
  })

  describe('Error Message Quality', () => {
    it('should provide clear error messages for each requirement', () => {
      const testPassword = 'weak'
      const testData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250712345678',
        password: testPassword,
        confirmPassword: testPassword
      }

      const result = registerSchema.safeParse(testData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(issue => issue.message)

        // Devrait contenir des messages spécifiques et clairs
        expect(messages.some(msg => msg.includes('8 caractères'))).toBe(true)
        expect(messages.some(msg => msg.includes('majuscule'))).toBe(true)
        expect(messages.some(msg => msg.includes('minuscule'))).toBe(true)
        expect(messages.some(msg => msg.includes('chiffre'))).toBe(true)
        expect(messages.some(msg => msg.includes('spécial'))).toBe(true)
      }
    })
  })

  describe('Performance', () => {
    it('should validate passwords efficiently', () => {
      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        const testData = {
          firstName: 'John',
          lastName: 'Doe',
          email: `test${i}@example.com`,
          phone: '+2250712345678',
          password: 'MyStr0ng!P@ssw0rd',
          confirmPassword: 'MyStr0ng!P@ssw0rd'
        }
        registerSchema.safeParse(testData)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // La validation devrait être rapide (moins de 100ms pour 1000 validations)
      expect(duration).toBeLessThan(100)
    })
  })
})