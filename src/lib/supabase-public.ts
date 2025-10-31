// Client Supabase public utilisant fetch natif pour éviter les problèmes JWT

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les variables d'environnement Supabase sont manquantes")
}

export interface SupabaseResponse<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

// Type definitions pour compatibilité avec Supabase client
export interface SupabaseRow<T = any> {
  id: string
  created_at: string
  updated_at?: string
  data?: T
  [key: string]: any
}

export type SupabaseTable<T extends SupabaseRow = SupabaseRow> = T[]

export class SupabasePublicClient {
  private baseUrl: string
  private apiKey: string

  constructor(url: string, apiKey: string) {
    this.baseUrl = url.replace(/\/$/, '') // Enlever le slash final
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SupabaseResponse<T>> {
    try {
      const url = `${this.baseUrl}/rest/v1${endpoint}`

      const response = await fetch(url, {
        ...options,
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/json',
          'X-Application-Name': 'noli-assurance-public',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          data: null,
          error: {
            message: errorData.message || `HTTP ${response.status}`,
            code: errorData.code,
          },
        }
      }

      const data = await response.json()
      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      }
    }
  }

  // Méthode pour interroger une table
  from<T>(table: string) {
    return new SupabaseQueryBuilder<T>(this.baseUrl, this.apiKey, table)
  }
}

export class SupabaseQueryBuilder<T> {
  private url: string
  private apiKey: string
  private table: string
  private selectQuery: string = '*'
  private filters: string[] = []
  private orderBy: string = ''
  private limitValue: number | null = null
  private rangeValue: { from?: number; to?: number } = {}

  constructor(baseUrl: string, apiKey: string, table: string) {
    this.url = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.table = table
  }

  select(columns: string = '*'): SupabaseQueryBuilder<T> {
    this.selectQuery = columns
    return this
  }

  eq(column: string, value: any): SupabaseQueryBuilder<T> {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`)
    return this
  }

  gte(column: string, value: any): SupabaseQueryBuilder<T> {
    this.filters.push(`${column}=gte.${encodeURIComponent(value)}`)
    return this
  }

  lte(column: string, value: any): SupabaseQueryBuilder<T> {
    this.filters.push(`${column}=lte.${encodeURIComponent(value)}`)
    return this
  }

  in(column: string, values: any[]): SupabaseQueryBuilder<T> {
    const encodedValues = values.map((v) => encodeURIComponent(v)).join(',')
    this.filters.push(`${column}=in.(${encodedValues})`)
    return this
  }

  or(conditions: string): SupabaseQueryBuilder<T> {
    this.filters.push(`or=(${encodeURIComponent(conditions)})`)
    return this
  }

  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder<T> {
    const direction = options?.ascending === false ? 'desc' : 'asc'
    this.orderBy = `&order=${column}.${direction}`
    return this
  }

  limit(count: number): SupabaseQueryBuilder<T> {
    this.limitValue = count
    return this
  }

  range(from: number, to: number): SupabaseQueryBuilder<T> {
    this.rangeValue = { from, to }
    return this
  }

  async execute(): Promise<SupabaseResponse<T[]>> {
    const queryParams = [
      `select=${this.selectQuery}`,
      ...this.filters,
      this.orderBy,
      this.limitValue ? `limit=${this.limitValue}` : '',
      this.rangeValue.from !== undefined && this.rangeValue.to !== undefined
        ? `offset=${this.rangeValue.from}&limit=${this.rangeValue.to - this.rangeValue.from + 1}`
        : '',
    ]
      .filter(Boolean)
      .join('&')

    const endpoint = `/${this.table}?${queryParams}`

    const response = await fetch(`${this.url}/rest/v1${endpoint}`, {
      headers: {
        apikey: this.apiKey,
        'Content-Type': 'application/json',
        'X-Application-Name': 'noli-assurance-public',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: {
          message: errorData.message || `HTTP ${response.status}`,
          code: errorData.code,
        },
      }
    }

    const data = await response.json()
    return { data, error: null }
  }

  // Méthode pour compatibilité avec le code existant
  async single(): Promise<SupabaseResponse<T>> {
    const result = await this.execute()
    if (result.error) {
      return result as SupabaseResponse<T>
    }

    if (!result.data || result.data.length === 0) {
      return {
        data: null,
        error: { message: 'No rows returned' },
      }
    }

    return {
      data: result.data[0],
      error: null,
    }
  }
}

// Créer le client public
export const supabasePublic = new SupabasePublicClient(supabaseUrl, supabaseAnonKey)
