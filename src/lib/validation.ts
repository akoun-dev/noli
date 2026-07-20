import { z } from "zod";

export const emailSchema = z.string().email("Adresse email invalide");

export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères");

export const personalInfoSchema = z.object({
  lastName: z.string().min(1, "Le nom est requis"),
  firstName: z.string().min(1, "Le prénom est requis"),
  email: emailSchema,
  phone: z.string().min(1, "Le téléphone est requis"),
  whatsappOptIn: z.boolean().optional(),
});

export const vehicleInfoSchema = z.object({
  fuelType: z.string().min(1, "Requis"),
  fiscalPower: z.string().min(1, "Requis"),
  seats: z.string().min(1, "Requis"),
  year: z.string().min(1, "Requis"),
  newValue: z.string().min(1, "Requis"),
  currentValue: z.string().min(1, "Requis"),
  usage: z.string().min(1, "Requis"),
});

export const coverageNeedsSchema = z.object({
  guaranteeCategories: z.array(z.string()).min(1, "Sélectionnez au moins une catégorie"),
  contractDuration: z.number().int().min(1).max(12).optional().default(12),
});

export const compareRequestSchema = z.object({
  personalInfo: personalInfoSchema,
  vehicleInfo: vehicleInfoSchema,
  coverageNeeds: coverageNeedsSchema,
  userId: z.string().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, "Le nom complet est requis"),
  password: passwordSchema,
  phone: z.string().optional(),
  role: z.enum(["USER", "INSURER"]).optional().default("USER"),
  companyName: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
  companyWebsite: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const createOfferSchema = z.object({
  insurerId: z.string().min(1, "L'assureur est requis"),
  name: z.string().min(1, "Le nom est requis"),
  coverageType: z.string().min(1, "Le type de couverture est requis"),
  basePrice: z.number().min(0, "Le prix doit être positif"),
  description: z.string().optional(),
  annualPrice: z.number().optional(),
  deductible: z.number().optional(),
  maxCoverage: z.number().optional(),
  features: z.array(z.string()).optional(),
  conditions: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});
