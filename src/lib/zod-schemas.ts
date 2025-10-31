import { z } from 'zod'

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
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
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
  circulationDate: z.string().min(1, 'La date de mise en circulation est requise'),
  newValue: z.string().min(1, 'La valeur neuve est requise'),
  currentValue: z.string().min(1, 'La valeur actuelle est requise'),
  vehicleUsage: z.enum(['personnel', 'professionnel', 'taxi', 'autre'], {
    required_error: "L'usage du véhicule est requis",
  }),
})

export const insuranceNeedsSchema = z.object({
  coverageType: z.enum(['tiers', 'vol_incendie', 'tous_risques'], {
    required_error: 'Le type de couverture est requis',
  }),
  effectiveDate: z.string().min(1, "La date d'effet est requise"),
  contractDuration: z.string().min(1, 'La durée du contrat est requise'),
  options: z.array(z.string()).default([]),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email invalide').min(1, "L'email est requis"),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
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
