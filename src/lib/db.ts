import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Client Supabase "admin" (service_role) : accès serveur uniquement,
// contourne la RLS. Ne JAMAIS l'importer côté client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let client: SupabaseClient | null = null

function getDb(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !serviceKey || !supabaseUrl.startsWith('http')) {
      throw new Error(
        '[db] SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY non configurés dans .env ' +
          '(voir .env.example).'
      )
    }
    client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

// Proxy : retarde la création du client jusqu'au premier appel réel.
// Ainsi, un .env incomplet ne fait pas planter le build (les routes
// sont évaluées au moment de la compilation de Next.js).
export const db = new Proxy({} as SupabaseClient, {
  get: (_target, prop: PropertyKey) => {
    const c = getDb()
    const value = (c as unknown as Record<PropertyKey, unknown>)[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(c) : value
  },
})

// ── Helpers de conversion snake_case → camelCase ─────────────────────────────
// Les colonnes des tables sont en snake_case (migration Supabase) alors que
// l'application utilise du camelCase partout. mapRow / mapRows transforment
// récursivement les lignes renvoyées par PostgREST.

function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

function mapValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mapValue)
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toCamel(k)] = mapValue(v)
    }
    return out
  }
  return value
}

export function mapRow<T = any>(
  row: Record<string, unknown> | null | undefined
): T | null {
  if (!row) return null
  return mapValue(row) as T
}

export function mapRows<T = any>(
  rows: Record<string, unknown>[] | null | undefined
): T[] {
  if (!rows) return []
  return rows.map((r) => mapRow<T>(r) as T)
}
