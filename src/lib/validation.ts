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
  // Conservée pour ne pas être retirée par Zod (le devis auto-enregistré en a besoin).
  effectiveDate: z.string().optional(),
});

export const coverageNeedsSchema = z.object({
  contractType: z.string().min(1, "Sélectionnez un type de contrat"),
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
  // H-03 : le rôle est restreint aux valeurs connues du RBAC — plus aucune
  // chaîne arbitraire (SUPERADMIN, ROOT, ...) ne peut être écrite en base.
  role: z.enum(["ADMIN", "INSURER", "USER"]).optional(),
  isActive: z.boolean().optional(),
});

/* ──────────────────────────────────────────────────────────────────
 * Schémas de validation des routes d'administration (durcissement des
 * entrées : chaque route mutante valide son corps de requête avec Zod
 * avant toute écriture en base). Les champs reflètent exactement les
 * colonnes réellement écrites par chaque handler.
 * ────────────────────────────────────────────────────────────────── */

const ROLE_ENUM = z.enum(["USER", "INSURER", "ADMIN"]);

/* ── Sauvegardes (POST ?action=schedule) ─────────────────────────── */
export const backupScheduleSchema = z.object({
  schedule: z.unknown().refine((v) => v !== undefined, "La planification est requise"),
  enabled: z.boolean(),
});

/* ── Profils (PUT) ───────────────────────────────────────────────── */
export const updateProfileSchema = z.object({
  id: z.string().min(1, "L'identifiant du profil est requis"),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: ROLE_ENUM.optional(),
  isActive: z.boolean().optional(),
});

/* ── Rôles d'un profil (PUT) ─────────────────────────────────────── */
export const assignProfileRolesSchema = z.object({
  roleIds: z.array(z.string()).optional(),
});

/* ── Assureurs ───────────────────────────────────────────────────── */
export const createInsurerSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  code: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateInsurerSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/* ── Paramètres système (PUT) ────────────────────────────────────── */
export const updateSettingSchema = z.object({
  key: z.string().min(1, "Clé et valeur requis"),
  value: z.string(),
});

/* ── Catégories d'assurance ──────────────────────────────────────── */
export const createInsuranceCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateInsuranceCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/* ── Règles tarifaires d'une garantie (POST) ─────────────────────── */
export const createTariffRuleSchema = z.object({
  vehicleCategory: z.string().nullable().optional(),
  minFiscalPower: z.number().nullable().optional(),
  maxFiscalPower: z.number().nullable().optional(),
  minVehicleValue: z.number().nullable().optional(),
  maxVehicleValue: z.number().nullable().optional(),
  fuelType: z.string().nullable().optional(),
  formulaName: z.string().nullable().optional(),
  baseRate: z.number().nullable().optional(),
  fixedAmount: z.number().nullable().optional(),
  minAmount: z.number().nullable().optional(),
  maxAmount: z.number().nullable().optional(),
  conditions: z
    .union([
      z.record(z.string(), z.unknown()),
      z.array(z.unknown()),
      z.string(),
    ])
    .nullable()
    .optional(),
});

/* ── Rôles RBAC ──────────────────────────────────────────────────── */
export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Nom du rôle requis"),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional(),
});

/* ── Catégories de garanties ─────────────────────────────────────── */
export const createCoverageCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  code: z.string().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const updateCoverageCategorySchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

/* ── Packs d'assurance ───────────────────────────────────────────── */
export const createInsurancePackageSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().nullable().optional(),
  basePrice: z.number({ message: "Le prix de base est requis" }),
  isActive: z.boolean().optional(),
});

export const updateInsurancePackageSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  basePrice: z.number().optional(),
  isActive: z.boolean().optional(),
});
