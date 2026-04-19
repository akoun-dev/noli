import { z } from 'zod'

// Password validation helper
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventRepeats: true,
  preventSequences: true
}

const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'azerty', '000000', '111111', '123123', 'qwertyuiop', 'starwars'
]

// Password validation function
const validatePasswordStrength = (password: string) => {
  const errors: string[] = []
  let score = 0

  // Longueur minimale
  if (password.length >= passwordRequirements.minLength) {
    score += 20
  } else {
    errors.push(`Le mot de passe doit contenir au moins ${passwordRequirements.minLength} caractères`)
  }

  // Bonus pour la longueur
  if (password.length >= 12) {
    score += 10
  }

  // Lettres minuscules
  if (/[a-z]/.test(password)) {
    score += 15
  } else if (passwordRequirements.requireLowercase) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule')
  }

  // Lettres majuscules
  if (/[A-Z]/.test(password)) {
    score += 15
  } else if (passwordRequirements.requireUppercase) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule')
  }

  // Chiffres
  if (/[0-9]/.test(password)) {
    score += 15
  } else if (passwordRequirements.requireNumbers) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }

  // Caractères spéciaux
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15
  } else if (passwordRequirements.requireSpecialChars) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)')
  }

  // Vérifier les mots de passe communs
  if (passwordRequirements.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase()
    if (commonPasswords.some(common => lowerPassword.includes(common))) {
      score -= 30
      errors.push('Le mot de passe est trop commun et facile à deviner')
    }
  }

  // Vérifier les répétitions (aaa, 111, !!!)
  if (passwordRequirements.preventRepeats) {
    if (/(.)\1{2,}/.test(password)) {
      score -= 20
      errors.push('Évitez les répétitions de caractères')
    }
  }

  // Vérifier les séquences (abc, 123, qwe)
  if (passwordRequirements.preventSequences) {
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890|qwe|wer|ert|rty|tyu|yui|uio|iop)/i.test(password)) {
      score -= 20
      errors.push('Évitez les séquences de caractères consécutifs')
    }
  }

  // Évaluer la force
  const strength = score >= 60 ? 'strong' : score >= 40 ? 'medium' : 'weak'

  return {
    score: Math.max(0, Math.min(100, score)),
    strength,
    errors,
    isValid: errors.length === 0
  }
}

// Enhanced password schema with detailed validation
const enhancedPasswordSchema = z.string()
  .min(passwordRequirements.minLength, `Le mot de passe doit contenir au moins ${passwordRequirements.minLength} caractères`)
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[^a-zA-Z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
  .refine((password) => !commonPasswords.some(common => password.toLowerCase().includes(common)), {
    message: 'Le mot de passe est trop commun'
  })
  .refine((password) => !/(.)\1{2,}/.test(password), {
    message: 'Évitez les répétitions de caractères'
  })
  .refine((password) => !/(?:abc|123|qwe)/i.test(password), {
    message: 'Évitez les séquences de caractères consécutifs'
  })

// Auth schemas
export const loginSchema = z.object({
  email: z.string().trim().email('Email invalide').min(1, "L'email est requis"),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères')
      .optional(),
    companyName: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .email('Email invalide')
      .max(255, "L'email ne peut pas dépasser 255 caractères"),
    phone: z
      .string()
      .trim()
      .regex(
        /^(\+225)?[0-9]{10}$/,
        'Numéro de téléphone invalide (format: +225XXXXXXXXXX ou XXXXXXXXXX)'
      ),
    password: enhancedPasswordSchema,
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      // Validate that either personal names OR company name is provided
      return (data.firstName && data.lastName) || data.companyName
    },
    {
      message: "Veuillez fournir soit un nom et prénom, soit un nom d'entreprise",
      path: ['firstName'],
    }
  )

export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  email: z
    .string()
    .trim()
    .email('Email invalide')
    .max(255, "L'email ne peut pas dépasser 255 caractères"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+225)?[0-9]{10}$/,
      'Numéro de téléphone invalide (format: +225XXXXXXXXXX ou XXXXXXXXXX)'
    ),
  isWhatsapp: z.boolean().optional().default(false),
})

export const vehicleInfoSchema = z.object({
  fuel: z.string().min(1, 'Le type de carburant est requis'),
  fiscalPower: z.string().min(1, 'La puissance fiscale est requise'),
  seats: z.string().min(1, 'Le nombre de places est requis'),
  circulationYear: z
    .string()
    .min(1, 'L\'année de mise en circulation est requise')
    .regex(/^\d{4}$/, 'L\'année doit être au format YYYY (ex: 2025)')
    .refine(
      (year) => {
        const currentYear = new Date().getFullYear();
        const selectedYear = parseInt(year);
        return selectedYear <= currentYear && selectedYear >= currentYear - 50;
      },
      {
        message: 'L\'année doit être comprise entre ' + (new Date().getFullYear() - 50) + ' et ' + new Date().getFullYear(),
      }
    ),
  newValue: z
    .string()
    .trim()
    .regex(/^\d[\d\s]*$/, 'La valeur neuve doit contenir uniquement des chiffres')
    .min(1, 'La valeur neuve est requise'),
  currentValue: z
    .string()
    .trim()
    .regex(/^\d[\d\s]*$/, 'La valeur actuelle doit contenir uniquement des chiffres')
    .min(1, 'La valeur actuelle est requise'),
  vehicleUsage: z.enum(['personnel', 'professionnel', 'taxi', 'autre'], {
    required_error: "L'usage du véhicule est requis",
  }),
}).superRefine((data, ctx) => {
  const newValue = Number(data.newValue.replace(/[^\d]/g, ''));
  const currentValue = Number(data.currentValue.replace(/[^\d]/g, ''));

  if (Number.isFinite(newValue) && Number.isFinite(currentValue) && newValue < currentValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La valeur neuve doit être supérieure ou égale à la valeur actuelle',
      path: ['newValue'],
    });
  }
});

// Standardized contract types for consistency
export const CONTRACT_TYPES = {
  TIERS_SIMPLE: 'tiers_simple',
  TIERS_PLUS: 'tiers_plus',
  TOUS_RISQUES: 'tous_risques',
} as const;

// Contract type display labels
export const CONTRACT_TYPE_LABELS = {
  [CONTRACT_TYPES.TIERS_SIMPLE]: 'Tiers Simple',
  [CONTRACT_TYPES.TIERS_PLUS]: 'Tiers +',
  [CONTRACT_TYPES.TOUS_RISQUES]: 'Tous Risques',
} as const;

export const insuranceNeedsSchema = z.object({
  coverageType: z.enum([CONTRACT_TYPES.TIERS_SIMPLE, CONTRACT_TYPES.TIERS_PLUS, CONTRACT_TYPES.TOUS_RISQUES], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: 'Veuillez sélectionner un type de couverture valide' };
      }
      if (issue.code === z.ZodIssueCode.invalid_type && issue.received === 'undefined') {
        return { message: 'Le type de couverture est requis' };
      }
      return { message: ctx.defaultError };
    },
  }),
  effectiveDate: z
    .string()
    .min(1, "La date d'effet est requise")
    .refine(
      (dateString) => {
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day
        return selectedDate >= today;
      },
      {
        message: "La date d'effet ne peut pas être antérieure à aujourd'hui",
      }
    ),
  contractDuration: z.string().min(1, 'La durée du contrat est requise'),
  options: z.array(z.string()).default([]),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email invalide').min(1, "L'email est requis"),
})

export const resetPasswordSchema = z
  .object({
    password: enhancedPasswordSchema,
    confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type VehicleInfoFormData = z.infer<typeof vehicleInfoSchema>
export type InsuranceNeedsFormData = z.infer<typeof insuranceNeedsSchema>
