import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  personalInfoSchema,
  vehicleInfoSchema,
  insuranceNeedsSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../zod-schemas';

describe('Zod Schemas Validation', () => {
  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      // Arrange
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Act & Assert
      expect(loginSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject invalid email', () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      // Act & Assert
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email invalide');
      }
    });

    it('should reject empty email', () => {
      // Arrange
      const invalidData = {
        email: '',
        password: 'password123',
      };

      // Act & Assert
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Email invalide");
      }
    });

    it('should reject short password', () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };

      // Act & Assert
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le mot de passe doit contenir au moins 6 caractères');
      }
    });

    it('should reject empty password', () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      // Act & Assert
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le mot de passe est requis');
      }
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data with personal names', () => {
      // Arrange
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+2250102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it('should validate valid registration data with company name', () => {
      // Arrange
      const validData = {
        companyName: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '0102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject when neither personal names nor company name provided', () => {
      // Arrange
      const invalidData = {
        email: 'test@example.com',
        phone: '+2250102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Veuillez fournir soit un nom et prénom, soit un nom d'entreprise");
      }
    });

    it('should reject short first name', () => {
      // Arrange
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le prénom doit contenir au moins 2 caractères');
      }
    });

    it('should reject long first name', () => {
      // Arrange
      const invalidData = {
        firstName: 'A'.repeat(51),
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le prénom ne peut pas dépasser 50 caractères');
      }
    });

    it('should reject invalid phone number format', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '123',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Numéro de téléphone invalide (format: +225XXXXXXXXXX ou XXXXXXXXXX)');
      }
    });

    it('should accept phone number with +225 prefix', () => {
      // Arrange
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+2250102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it('should accept phone number without prefix', () => {
      // Arrange
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '0102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject password without uppercase letter', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '0102030405',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message === 'Le mot de passe doit contenir au moins une majuscule'
        )).toBe(true);
      }
    });

    it('should reject password without lowercase letter', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '0102030405',
        password: 'PASSWORD123',
        confirmPassword: 'PASSWORD123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message === 'Le mot de passe doit contenir au moins une minuscule'
        )).toBe(true);
      }
    });

    it('should reject password without number', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '0102030405',
        password: 'Password',
        confirmPassword: 'Password',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue =>
          issue.message === 'Le mot de passe doit contenir au moins un chiffre'
        )).toBe(true);
      }
    });

    it('should reject password mismatch', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '0102030405',
        password: 'Password123',
        confirmPassword: 'Different123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Les mots de passe ne correspondent pas');
      }
    });

    it('should reject long email', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'a'.repeat(250) + '@example.com',
        phone: '0102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("L'email ne peut pas dépasser 255 caractères");
      }
    });
  });

  describe('personalInfoSchema', () => {
    it('should validate valid personal info', () => {
      // Arrange
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+2250102030405',
        isWhatsapp: true,
      };

      // Act & Assert
      expect(personalInfoSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject invalid email format', () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+2250102030405',
      };

      // Act & Assert
      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email invalide');
      }
    });

    it('should require all fields', () => {
      // Arrange
      const invalidData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      };

      // Act & Assert
      const result = personalInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues).toHaveLength(4);
    });
  });

  describe('vehicleInfoSchema', () => {
    it('should validate valid vehicle info', () => {
      // Arrange
      const validData = {
        fuel: 'Essence',
        fiscalPower: '7 CV',
        seats: '5',
        circulationDate: '2020-01-15',
        newValue: '5000000',
        currentValue: '3500000',
        vehicleUsage: 'personnel',
      };

      // Act & Assert
      expect(vehicleInfoSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject invalid vehicle usage', () => {
      // Arrange
      const invalidData = {
        fuel: 'Essence',
        fiscalPower: '7 CV',
        seats: '5',
        circulationDate: '2020-01-15',
        newValue: '5000000',
        currentValue: '3500000',
        vehicleUsage: 'invalid',
      };

      // Act & Assert
      const result = vehicleInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require all fields', () => {
      // Arrange
      const invalidData = {};

      // Act & Assert
      const result = vehicleInfoSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.issues).toHaveLength(7);
    });

    it('should accept all valid vehicle usage values', () => {
      // Arrange & Act & Assert
      const validUsages = ['personnel', 'professionnel', 'taxi', 'autre'];

      validUsages.forEach(usage => {
        const validData = {
          fuel: 'Essence',
          fiscalPower: '7 CV',
          seats: '5',
          circulationDate: '2020-01-15',
          newValue: '5000000',
          currentValue: '3500000',
          vehicleUsage: usage,
        };

        expect(vehicleInfoSchema.safeParse(validData).success).toBe(true);
      });
    });
  });

  describe('insuranceNeedsSchema', () => {
    it('should validate valid insurance needs', () => {
      // Arrange
      const validData = {
        coverageType: 'tous_risques',
        effectiveDate: '2024-02-01',
        contractDuration: '1 an',
        options: ['Assistance 24/7', 'Véhicule de remplacement'],
      };

      // Act & Assert
      expect(insuranceNeedsSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject invalid coverage type', () => {
      // Arrange
      const invalidData = {
        coverageType: 'invalid',
        effectiveDate: '2024-02-01',
        contractDuration: '1 an',
      };

      // Act & Assert
      const result = insuranceNeedsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid coverage types', () => {
      // Arrange & Act & Assert
      const validTypes = ['tiers', 'vol_incendie', 'tous_risques'];

      validTypes.forEach(type => {
        const validData = {
          coverageType: type,
          effectiveDate: '2024-02-01',
          contractDuration: '1 an',
        };

        expect(insuranceNeedsSchema.safeParse(validData).success).toBe(true);
      });
    });

    it('should handle empty options array', () => {
      // Arrange
      const validData = {
        coverageType: 'tiers',
        effectiveDate: '2024-02-01',
        contractDuration: '1 an',
        options: [],
      };

      // Act & Assert
      const result = insuranceNeedsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([]);
      }
    });

    it('should default options to empty array', () => {
      // Arrange
      const validData = {
        coverageType: 'tiers',
        effectiveDate: '2024-02-01',
        contractDuration: '1 an',
      };

      // Act & Assert
      const result = insuranceNeedsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([]);
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email', () => {
      // Arrange
      const validData = {
        email: 'test@example.com',
      };

      // Act & Assert
      expect(forgotPasswordSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject invalid email', () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
      };

      // Act & Assert
      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email invalide');
      }
    });

    it('should reject empty email', () => {
      // Arrange
      const invalidData = {
        email: '',
      };

      // Act & Assert
      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Email invalide");
      }
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate valid password reset', () => {
      // Arrange
      const validData = {
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      // Act & Assert
      expect(resetPasswordSchema.safeParse(validData).success).toBe(true);
    });

    it('should reject password mismatch', () => {
      // Arrange
      const invalidData = {
        password: 'Password123',
        confirmPassword: 'Different123',
      };

      // Act & Assert
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Les mots de passe ne correspondent pas');
      }
    });

    it('should enforce same password rules as register schema', () => {
      // Arrange & Act & Assert
      const testCases = [
        {
          password: 'short',
          confirmPassword: 'short',
          expectedError: 'Le mot de passe doit contenir au moins 8 caractères',
        },
        {
          password: 'nouppercase123',
          confirmPassword: 'nouppercase123',
          expectedError: 'Le mot de passe doit contenir au moins une majuscule',
        },
        {
          password: 'NOLOWERCASE123',
          confirmPassword: 'NOLOWERCASE123',
          expectedError: 'Le mot de passe doit contenir au moins une minuscule',
        },
        {
          password: 'NoNumbers',
          confirmPassword: 'NoNumbers',
          expectedError: 'Le mot de passe doit contenir au moins un chiffre',
        },
      ];

      testCases.forEach(({ password, confirmPassword, expectedError }) => {
        const result = resetPasswordSchema.safeParse({ password, confirmPassword });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => issue.message === expectedError)).toBe(true);
        }
      });
    });
  });

  describe('Type inference', () => {
    it('should correctly infer types', () => {
      // This test ensures TypeScript type inference works correctly
      // It won't fail at runtime but ensures type safety during development

      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+2250102030405',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      // Act & Assert - These should compile without TypeScript errors
      expect(loginSchema.safeParse(loginData).success).toBe(true);
      expect(registerSchema.safeParse(registerData).success).toBe(true);
    });
  });
});