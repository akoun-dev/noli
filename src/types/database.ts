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

type EmptyArgs = Record<PropertyKey, never>

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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'user_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'password_reset_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          success: boolean | null
          error_message: string | null
          severity: 'debug' | 'info' | 'warning' | 'error' | 'critical'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean | null
          error_message?: string | null
          severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
          metadata?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'user_sessions'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['insurers']['Insert']>
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'insurance_offers_insurer_id_fkey'
            columns: ['insurer_id']
            isOneToOne: false
            referencedRelation: 'insurers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'insurance_offers_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'insurance_categories'
            referencedColumns: ['id']
          }
        ]
      }
      insurer_accounts: {
        Row: {
          profile_id: string
          insurer_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['insurer_accounts']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['insurer_accounts']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'insurer_accounts_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'insurer_accounts_insurer_id_fkey'
            columns: ['insurer_id']
            isOneToOne: false
            referencedRelation: 'insurers'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'quotes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quotes_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'insurance_categories'
            referencedColumns: ['id']
          }
        ]
      }
      quote_offers: {
        Row: {
          id: string
          quote_id: string
          offer_id: string
          insurer_id: string
          price: number
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quote_offers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['quote_offers']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'quote_offers_quote_id_fkey'
            columns: ['quote_id']
            isOneToOne: false
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quote_offers_offer_id_fkey'
            columns: ['offer_id']
            isOneToOne: false
            referencedRelation: 'insurance_offers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quote_offers_insurer_id_fkey'
            columns: ['insurer_id']
            isOneToOne: false
            referencedRelation: 'insurers'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'policies_quote_id_fkey'
            columns: ['quote_id']
            isOneToOne: false
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'policies_offer_id_fkey'
            columns: ['offer_id']
            isOneToOne: false
            referencedRelation: 'insurance_offers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'policies_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'policies_insurer_id_fkey'
            columns: ['insurer_id']
            isOneToOne: false
            referencedRelation: 'insurers'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'payments_policy_id_fkey'
            columns: ['policy_id']
            isOneToOne: false
            referencedRelation: 'policies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      tarif_rc: {
        Row: {
          id: string
          category: string
          energy: string
          power_min: number
          power_max: number
          prime: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tarif_rc']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['tarif_rc']['Insert']>
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'tarification_rules_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'insurance_categories'
            referencedColumns: ['id']
          }
        ]
      }
      coverages: {
        Row: {
          id: string
          code: string
          type: string
          name: string
          description: string | null
          category_id: string | null
          calculation_type: string
          is_mandatory: boolean
          is_active: boolean
          display_order: number
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          type: string
          name: string
          description?: string | null
          category_id?: string | null
          calculation_type: string
          is_mandatory?: boolean
          is_active?: boolean
          display_order?: number
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['coverages']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'coverages_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'coverage_categories'
            referencedColumns: ['id']
          }
        ]
      }
      coverage_tariff_rules: {
        Row: {
          id: string
          coverage_id: string
          vehicle_category: string | null
          min_vehicle_value: number | null
          max_vehicle_value: number | null
          min_fiscal_power: number | null
          max_fiscal_power: number | null
          fuel_type: string | null
          formula_name: string | null
          base_rate: number | null
          fixed_amount: number | null
          min_amount: number | null
          max_amount: number | null
          conditions: Json
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coverage_id: string
          vehicle_category?: string | null
          min_vehicle_value?: number | null
          max_vehicle_value?: number | null
          min_fiscal_power?: number | null
          max_fiscal_power?: number | null
          fuel_type?: string | null
          formula_name?: string | null
          base_rate?: number | null
          fixed_amount?: number | null
          min_amount?: number | null
          max_amount?: number | null
          conditions?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['coverage_tariff_rules']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'coverage_tariff_rules_coverage_id_fkey'
            columns: ['coverage_id']
            isOneToOne: false
            referencedRelation: 'coverages'
            referencedColumns: ['id']
          }
        ]
      }
      quote_coverage_premiums: {
        Row: {
          id: string
          quote_id: string
          coverage_id: string
          tariff_rule_id: string | null
          premium_amount: number
          is_included: boolean
          calculation_parameters: Json
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          quote_id: string
          coverage_id: string
          tariff_rule_id?: string | null
          premium_amount?: number
          is_included?: boolean
          calculation_parameters?: Json
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['quote_coverage_premiums']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'quote_coverages_quote_id_fkey'
            columns: ['quote_id']
            isOneToOne: false
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quote_coverages_coverage_id_fkey'
            columns: ['coverage_id']
            isOneToOne: false
            referencedRelation: 'coverages'
            referencedColumns: ['id']
          }
        ]
      }
      comparison_history: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string | null
          comparison_data: Record<string, any>
          status: 'in_progress' | 'completed' | 'saved' | 'archived'
          comparison_date: string
          expires_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id?: string | null
          comparison_data: Record<string, any>
          status: 'in_progress' | 'completed' | 'saved' | 'archived'
          comparison_date: string
          expires_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['comparison_history']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'comparison_history_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      mtpl_tariffs: {
        Row: {
          id: string
          vehicle_category: string
          fiscal_power: number
          fuel_type: string
          base_premium: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_category: string
          fiscal_power: number
          fuel_type: string
          base_premium: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['mtpl_tariffs']['Insert']>
        Relationships: []
      }
      tcm_tcl_rates: {
        Row: {
          id: string
          vehicle_category: string
          coverage_type: string
          rate: number
          deductible_level: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_category: string
          coverage_type: string
          rate: number
          deductible_level: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tcm_tcl_rates']['Insert']>
        Relationships: []
      }
      application_logs: {
        Row: {
          id: string
          level: string
          message: string
          context: Json | null
          error: Json | null
          timestamp: string
          url: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          level: string
          message: string
          context?: Json | null
          error?: Json | null
          timestamp?: string
          url?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['application_logs']['Insert']>
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          path: string
          file_name: string
          original_name: string | null
          file_size: number | null
          file_type: string | null
          mime_type: string | null
          file_url: string | null
          category: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          path: string
          file_name: string
          original_name?: string | null
          file_size?: number | null
          file_type?: string | null
          mime_type?: string | null
          file_url?: string | null
          category?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          category: 'general' | 'quote' | 'policy' | 'payment' | 'system' | 'approval'
          read: boolean
          action_url: string | null
          action_text: string | null
          metadata: Json
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_enabled: boolean
          push_enabled: boolean
          sms_enabled: boolean
          whatsapp_enabled: boolean
          categories: Json
          quiet_hours_start: string
          quiet_hours_end: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_preferences']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notification_templates: {
        Row: {
          id: string
          name: string
          title_template: string
          message_template: string
          type: 'info' | 'success' | 'warning' | 'error'
          category: string
          variables: Json
          action_url_template: string | null
          action_text_template: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_templates']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['notification_templates']['Insert']>
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          notification_id: string | null
          user_id: string | null
          channel: 'email' | 'push' | 'sms' | 'whatsapp' | 'in_app'
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
          provider: string | null
          external_id: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_logs']['Row'], 'id' | 'created_at'> & {
          id?: string
        }
        Update: Partial<Database['public']['Tables']['notification_logs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'notification_logs_notification_id_fkey'
            columns: ['notification_id']
            isOneToOne: false
            referencedRelation: 'notifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      user_stats_view: {
        Row: {
          role: string
          total_users: number
          active_users: number
          inactive_users: number
          new_this_month: number
          new_this_week: number
          active_this_month: number
          growth_rate_percent: number
        }
        Relationships: []
      }
      quote_stats_view: {
        Row: {
          status: string
          total_quotes: number
          quotes_this_month: number
          quotes_this_week: number
          valid_quotes: number
          average_price: number | null
          total_value: number | null
          category_name: string | null
          unique_users: number
        }
        Relationships: []
      }
      policy_stats_view: {
        Row: {
          status: string
          total_policies: number
          active_policies: number
          expired_policies: number
          policies_this_month: number
          total_premium_amount: number | null
          average_premium: number | null
          payment_frequency: string | null
          insurer_name: string | null
          unique_customers: number
        }
        Relationships: []
      }
      payment_stats_view: {
        Row: {
          status: string
          total_payments: number
          total_amount: number | null
          average_amount: number | null
          payments_this_month: number
          payments_this_week: number
          payment_method: string | null
          unique_payers: number
        }
        Relationships: []
      }
      insurer_performance_view: {
        Row: {
          insurer_id: string
          insurer_name: string
          rating: number | null
          total_offers: number
          active_offers: number
          total_quote_offers: number
          approved_offers: number
          total_policies: number
          active_premium_revenue: number | null
          average_approved_price: number | null
          approval_rate_percent: number | null
          unique_customers: number
        }
        Relationships: []
      }
      daily_activity_view: {
        Row: {
          activity_date: string
          new_users: number
          new_quotes: number
          new_policies: number
          new_payments: number
        }
        Relationships: []
      }
      conversion_funnel_view: {
        Row: {
          users_created: number
          users_with_quotes: number
          quotes_created: number
          offers_made: number
          offers_approved: number
          policies_issued: number
        }
        Relationships: []
      }
      category_trends_view: {
        Row: {
          category_id: string
          category_name: string
          icon: string | null
          total_quotes: number
          quotes_this_month: number
          total_offers_received: number
          approved_offers: number
          total_policies: number
          average_quote_price: number | null
          average_approved_price: number | null
          conversion_rate_percent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      handle_new_user: {
        Args: EmptyArgs
        Returns: undefined
      }
      log_user_action: {
        Args: {
          user_action: string
          resource_name?: string
          resource_id_value?: string
          metadata_value?: Json
        }
        Returns: undefined
      }
      log_user_action_safe: {
        Args: {
          user_action: string
          resource_name?: string
          resource_id_value?: string
          metadata_value?: Json
        }
        Returns: undefined
      }
      create_password_reset_token: {
        Args: { user_email: string }
        Returns: string
      }
      use_password_reset_token: {
        Args: { token_value: string; new_password: string }
        Returns: boolean
      }
      get_user_profile: {
        Args: { user_uuid?: string }
        Returns: Database['public']['Tables']['profiles']['Row'] & {
          permissions: string[]
        }
      }
      get_user_permissions: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      user_has_permission: {
        Args: { permission_name: string; target_user?: string }
        Returns: boolean
      }
      log_user_login: {
        Args: EmptyArgs
        Returns: undefined
      }
      log_user_logout: {
        Args: EmptyArgs
        Returns: undefined
      }
      get_current_insurer_id: {
        Args: EmptyArgs
        Returns: string | null
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type?: string
          p_category?: string
          p_action_url?: string
          p_action_text?: string
          p_metadata?: Json
          p_expires_at?: string
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { p_notification_id: string; p_user_id?: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_unread_notifications: {
        Args: { p_user_id?: string; p_limit?: number }
        Returns: {
          id: string
          title: string
          message: string
          type: string
          category: string
          action_url: string | null
          action_text: string | null
          metadata: Json
          created_at: string
        }[]
      }
      create_default_notification_preferences: {
        Args: { p_user_id: string }
        Returns: string
      }
      admin_create_user: {
        Args: Record<string, unknown>
        Returns: { success: boolean; user_id: string; message: string }[]
      }
      admin_update_user: {
        Args: Record<string, unknown>
        Returns: { success: boolean; user_id: string; message: string }[]
      }
      admin_delete_user: {
        Args: Record<string, unknown>
        Returns: { success: boolean; user_id: string; message: string }[]
      }
      log_admin_action: {
        Args: Record<string, unknown>
        Returns: Json
      }
      get_platform_statistics: {
        Args: { p_days_back?: number }
        Returns: Record<string, any>[]
      }
      get_user_activity_breakdown: {
        Args: { p_days_back?: number }
        Returns: Record<string, any>[]
      }
      system_health_check: {
        Args: EmptyArgs
        Returns: Record<string, any>[]
      }
      test_auth_users_access: {
        Args: EmptyArgs
        Returns: Json
      }
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
export type TarifRc = Database['public']['Tables']['tarif_rc']['Row']
export type TarifRcInsert = Database['public']['Tables']['tarif_rc']['Insert']
export type TarifRcUpdate = Database['public']['Tables']['tarif_rc']['Update']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationPreferences = Database['public']['Tables']['notification_preferences']['Row']
export type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row']
export type NotificationLog = Database['public']['Tables']['notification_logs']['Row']
export type DatabaseComparisonHistory = Database['public']['Tables']['comparison_history']['Row']

// Types pour les vues analytiques
export type UserStatsView = Database['public']['Views']['user_stats_view']['Row']
export type QuoteStatsView = Database['public']['Views']['quote_stats_view']['Row']
export type PolicyStatsView = Database['public']['Views']['policy_stats_view']['Row']
export type PaymentStatsView = Database['public']['Views']['payment_stats_view']['Row']
export type InsurerPerformanceView = Database['public']['Views']['insurer_performance_view']['Row']
export type DailyActivityView = Database['public']['Views']['daily_activity_view']['Row']
export type ConversionFunnelView = Database['public']['Views']['conversion_funnel_view']['Row']
export type CategoryTrendsView = Database['public']['Views']['category_trends_view']['Row']

// Types pour les fonctions RPC
export type UserProfileWithPermissions = Database['public']['Functions']['get_user_profile']['Returns']
export type UserPermissions = Database['public']['Functions']['get_user_permissions']['Returns']
export type CreateNotificationResponse = Database['public']['Functions']['create_notification']['Returns']
export type UnreadNotificationsResponse = Database['public']['Functions']['get_unread_notifications']['Returns']

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

// Types pour les notifications (interface enrichie)
export interface NotificationUI {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'general' | 'quote' | 'policy' | 'payment' | 'system' | 'approval'
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, any>
  expiresAt?: string
}

// Types pour les permissions étendues
export type ExtendedPermission =
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
  | 'manage:notifications'
  | 'read:analytics'
  | 'export:data'

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
