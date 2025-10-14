/**
 * Types TypeScript pour la base de données Supabase
 * Généré selon les best practices Supabase avec TypeScript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          company_name: string | null
          phone: string | null
          role: 'USER' | 'INSURER' | 'ADMIN'
          avatar_url: string | null
          is_active: boolean
          email_verified: boolean
          phone_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          last_accessed_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_sessions']['Row'], 'id' | 'created_at' | 'last_accessed_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['user_sessions']['Insert']>
      }
      password_reset_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['password_reset_tokens']['Row'], 'id' | 'created_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['password_reset_tokens']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource: string | null
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      insurance_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurance_categories']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['insurance_categories']['Insert']>
      }
      insurers: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          rating: number | null
          is_active: boolean
          contact_email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['insurers']['Insert']>
      }
      insurance_offers: {
        Row: {
          id: string
          insurer_id: string
          category_id: string
          name: string
          description: string | null
          price_min: number | null
          price_max: number | null
          coverage_amount: number | null
          deductible: number
          is_active: boolean
          features: string[] | null
          contract_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurance_offers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['insurance_offers']['Insert']>
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          category_id: string
          status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
          personal_data: Json
          vehicle_data: Json
          property_data: Json
          coverage_requirements: Json
          estimated_price: number | null
          valid_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      policies: {
        Row: {
          id: string
          quote_id: string
          offer_id: string
          user_id: string
          insurer_id: string
          policy_number: string
          status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
          start_date: string
          end_date: string
          premium_amount: number
          payment_frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
          coverage_details: Json
          terms_conditions: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['policies']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['policies']['Insert']>
      }
      payments: {
        Row: {
          id: string
          policy_id: string
          user_id: string
          amount: number
          payment_date: string
          payment_method: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIRECT_DEBIT' | 'CHECK'
          status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      tarification_rules: {
        Row: {
          id: string
          category_id: string
          age_min: number | null
          age_max: number | null
          risk_factor: string
          coefficient: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tarification_rules']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['tarification_rules']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: () => void
      log_user_action: (
        user_action: string,
        resource_name?: string,
        resource_id_value?: string,
        metadata_value?: Json
      ) => void
      log_user_action_safe: (
        user_action: string,
        resource_name?: string,
        resource_id_value?: string,
        metadata_value?: Json
      ) => void
      create_password_reset_token: (user_email: string) => string
      use_password_reset_token: (token_value: string, new_password: string) => boolean
      get_user_profile: (user_uuid?: string) => Database['public']['Tables']['profiles']['Row'] & {
        permissions: string[]
      }
      get_user_permissions: (user_uuid: string) => string[]
      user_has_permission: (permission_name: string, target_user?: string) => boolean
      log_user_login: () => void
      log_user_logout: () => void
    }
    Enums: {
      user_role: 'USER' | 'INSURER' | 'ADMIN'
      quote_status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
      policy_status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
      payment_method: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIRECT_DEBIT' | 'CHECK'
      payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
      contract_type: 'basic' | 'comprehensive' | 'all_risks' | 'third_party_plus' | 'family' | 'eco' | 'student' | 'young_driver' | 'retirement' | 'savings'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types utilitaires pour l'application
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Quote = Database['public']['Tables']['quotes']['Row']
export type QuoteInsert = Database['public']['Tables']['quotes']['Insert']
export type QuoteUpdate = Database['public']['Tables']['quotes']['Update']

export type Policy = Database['public']['Tables']['policies']['Row']
export type PolicyInsert = Database['public']['Tables']['policies']['Insert']
export type PolicyUpdate = Database['public']['Tables']['policies']['Update']

export type InsuranceOffer = Database['public']['Tables']['insurance_offers']['Row']
export type Insurer = Database['public']['Tables']['insurers']['Row']
export type InsuranceCategory = Database['public']['Tables']['insurance_categories']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Types pour les fonctions RPC
export type UserProfileWithPermissions = Database['public']['Functions']['get_user_profile']['Returns']
export type UserPermissions = Database['public']['Functions']['get_user_permissions']['Returns']

// Types pour les formulaires
export interface PersonalData {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

export interface VehicleData {
  brand: string
  model: string
  year: number
  licensePlate: string
  registrationDate: string
  usage: 'personal' | 'professional' | 'mixed'
  parkingLocation: 'garage' | 'street' | 'parking'
}

export interface PropertyData {
  type: 'apartment' | 'house' | 'studio' | 'villa'
  surface: number
  rooms: number
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  constructionYear?: number
  hasAlarm?: boolean
  hasInsurance?: boolean
}

export interface CoverageRequirements {
  coverageAmount?: number
  deductible?: number
  specificCoverages?: string[]
  additionalOptions?: string[]
}

// Types pour les statistiques et rapports
export interface QuoteStats {
  total: number
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  averagePrice: number
  conversionRate: number
}

export interface PolicyStats {
  total: number
  active: number
  expired: number
  cancelled: number
  totalRevenue: number
  averagePremium: number
}

export interface UserStats {
  total: number
  active: number
  byRole: Record<string, number>
  newThisMonth: number
  retentionRate: number
}

// Types pour les erreurs et réponses API
export interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// Types pour les notifications
export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

// Types pour les permissions
export type Permission =
  | 'read:own_profile'
  | 'update:own_profile'
  | 'read:own_quotes'
  | 'create:quotes'
  | 'read:own_policies'
  | 'create:payments'
  | 'read:own_offers'
  | 'create:offers'
  | 'update:own_offers'
  | 'read:quotes'
  | 'respond:quotes'
  | 'read:own_analytics'
  | 'manage:clients'
  | 'read:all_profiles'
  | 'update:all_profiles'
  | 'create:profiles'
  | 'delete:profiles'
  | 'read:all_offers'
  | 'create:offers'
  | 'update:all_offers'
  | 'delete:offers'
  | 'read:all_quotes'
  | 'manage:quotes'
  | 'read:all_audit_logs'
  | 'manage:tarification'
  | 'manage:system'