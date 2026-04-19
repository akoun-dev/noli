/**
 * Types utilitaires pour remplacer les types 'any'
 */

export type JsonValue = string | number | boolean | null | undefined | JsonObject | JsonArray

export interface JsonObject {
  [key: string]: JsonValue
}

export type JsonArray = Array<JsonValue>

export type UnknownRecord = Record<string, unknown>

// Type pour les métadonnées utilisateur
export interface UserMetadata {
  first_name?: string
  last_name?: string
  company?: string
  company_name?: string
  phone?: string
  role?: 'USER' | 'INSURER' | 'ADMIN'
  avatar_url?: string
}

// Type pour les données de formulaire génériques
export interface FormData {
  [key: string]: string | number | boolean | undefined
}

// Type pour les options de configuration
export interface ConfigOptions {
  [key: string]: JsonValue
}

// Type pour les erreurs API
export interface ApiError {
  message: string
  code?: string
  details?: UnknownRecord
}

// Type pour les métadonnées d'audit
export interface AuditMetadata {
  action: string
  resource?: string
  timestamp?: string
  user_id?: string
  details?: UnknownRecord
}
