import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface FixedTariffItem {
  id: string
  coverageId: string
  coverageName: string
  formulaName?: string | null
  fixedAmount: number
  conditions?: string | null
  packPriceReduced?: number | null
}

export interface FixedCoverageOption {
  id: string
  name: string
  calculation_type: 'FIXED_AMOUNT' | 'FORMULA_BASED'
}

export interface FreeCoverageItem {
  id: string
  name: string
  isMandatory: boolean
}

class TarificationSupabaseService {
  // ---------- COVERAGES (GARANTIES) ----------
  private mapCalcMethodToDb(method: string): string {
    // Keep same naming across app and DB
    return method
  }

  async listAdminCoverages(): Promise<Array<{
    id: string
    name: string
    calculation_type: string
    is_active: boolean
    is_mandatory: boolean
    fixed_amount?: number | null
  }>> {
    // Nested select to get potential fixed_amount rules for display
    logger.api('listAdminCoverages: v2 fetching coverages with rules')

    try {
      // Try using Supabase client first
      const { data, error } = await supabase
        .from('coverages')
        .select(
          'id, name, calculation_type, is_active, is_mandatory, coverage_tariff_rules:coverage_tariff_rules(fixed_amount)'
        )
        .order('display_order', { ascending: true })

      if (error) {
        logger.error('listAdminCoverages: supabase error', {
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
        })
        throw error
      }

      const rows = (data || [])
      logger.api(`listAdminCoverages: fetched ${rows.length} coverages`)
      logger.api(`listAdminCoverages: raw data`, { data: data, error: null })
      return rows.map((row: any) => {
        const rules = (row.coverage_tariff_rules || []) as Array<{ fixed_amount?: number | null }>
        const fixed = rules.find((r) => r.fixed_amount != null)?.fixed_amount ?? null
        return {
          id: row.id,
          name: row.name,
          calculation_type: row.calculation_type,
          is_active: !!row.is_active,
          is_mandatory: !!row.is_mandatory,
          fixed_amount: fixed != null ? Number(fixed) : null,
        }
      })
    } catch (error) {
      logger.warn('listAdminCoverages: Supabase client failed, trying direct fetch', error)

      // Fallback to direct fetch
      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/coverages?select=id,name,calculation_type,is_active,is_mandatory,coverage_tariff_rules:coverage_tariff_rules(fixed_amount)&order=display_order.asc`,
          {
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        logger.api(`listAdminCoverages: fetch fallback fetched ${data.length} coverages`)
        logger.api(`listAdminCoverages: fetch fallback data`, { data })

        return data.map((row: any) => {
          const rules = (row.coverage_tariff_rules || []) as Array<{ fixed_amount?: number | null }>
          const fixed = rules.find((r) => r.fixed_amount != null)?.fixed_amount ?? null
          return {
            id: row.id,
            name: row.name,
            calculation_type: row.calculation_type,
            is_active: !!row.is_active,
            is_mandatory: !!row.is_mandatory,
            fixed_amount: fixed != null ? Number(fixed) : null,
          }
        })
      } catch (fetchError) {
        logger.error('listAdminCoverages: Both Supabase client and fetch failed', fetchError)
        throw fetchError
      }
    }
  }

  async createCoverage(input: {
    name: string
    calculationMethod: string
    isOptional: boolean
    code?: string
    description?: string
  }): Promise<string> {
    // Generate a stable, URL-safe id from name or provided code
    const baseCode = (input.code && input.code.trim().length > 0 ? input.code : input.name)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 32)
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const id = (baseCode || 'GAR') + '_' + randomSuffix
    logger.api('createCoverage: input', { input: { ...input, code: baseCode }, generatedId: id })

    const base = {
      id,
      // type is nullable since migration 015; we omit it for dynamic coverages
      name: input.name,
      calculation_type: this.mapCalcMethodToDb(input.calculationMethod),
      is_active: true,
      is_mandatory: !input.isOptional,
    } as any

    // Try to set optional fields if they exist in schema; fallback if DB rejects
    const tryPayload = { ...base, code: input.code ?? null, description: input.description ?? null }
    let insertedId: string | null = null

    try {
      const { data, error } = await supabase.from('coverages').insert(tryPayload).select('id').single()
      if (error) throw error
      insertedId = data?.id
      logger.api('createCoverage: inserted with optional fields', { id: insertedId })
    } catch (e1) {
      logger.warn('createCoverage: retry without optional fields due to error', {
        code: (e1 as any)?.code,
        message: (e1 as any)?.message,
        details: (e1 as any)?.details,
        hint: (e1 as any)?.hint,
      })
      const { data, error } = await supabase.from('coverages').insert(base).select('id').single()
      if (error) throw error
      insertedId = data?.id
      logger.api('createCoverage: inserted with minimal payload', { id: insertedId })
    }

    if (!insertedId) throw new Error('Failed to create coverage')
    return insertedId
  }

  async updateCoverageDetails(
    id: string,
    input: Partial<{ name: string; calculationMethod: string; isOptional: boolean; isActive: boolean; code?: string | null; description?: string | null }>
  ): Promise<void> {
    const update: any = {}
    if (input.name !== undefined) update.name = input.name
    if (input.calculationMethod !== undefined) update.calculation_type = this.mapCalcMethodToDb(input.calculationMethod)
    if (input.isOptional !== undefined) update.is_mandatory = !input.isOptional
    if (input.isActive !== undefined) update.is_active = input.isActive

    // First try with optional fields
    if (input.code !== undefined) update.code = input.code
    if (input.description !== undefined) update.description = input.description

    logger.api('updateCoverageDetails: updating', { id, update })
    try {
      const { error } = await supabase.from('coverages').update(update).eq('id', id)
      if (error) throw error
      logger.api('updateCoverageDetails: updated (full)')
    } catch (e1) {
      logger.warn('updateCoverageDetails: retry minimal due to error', {
        code: (e1 as any)?.code,
        message: (e1 as any)?.message,
        details: (e1 as any)?.details,
        hint: (e1 as any)?.hint,
      })
      // Retry without optional fields if DB rejects
      const minimal: any = {}
      if (input.name !== undefined) minimal.name = input.name
      if (input.calculationMethod !== undefined) minimal.calculation_type = this.mapCalcMethodToDb(input.calculationMethod)
      if (input.isOptional !== undefined) minimal.is_mandatory = !input.isOptional
      if (input.isActive !== undefined) minimal.is_active = input.isActive
      const { error } = await supabase.from('coverages').update(minimal).eq('id', id)
      if (error) throw error
      logger.api('updateCoverageDetails: updated (minimal)')
    }
  }

  async upsertCoverageFixedTariff(coverageId: string, fixedAmount: number): Promise<void> {
    // Find an existing fixed-amount rule; update if exists, else insert
    logger.api('upsertCoverageFixedTariff: checking existing rule', { coverageId, fixedAmount })
    const { data, error } = await supabase
      .from('coverage_tariff_rules')
      .select('id, fixed_amount')
      .eq('coverage_id', coverageId)
      .not('fixed_amount', 'is', null)
      .limit(1)

    if (error) {
      logger.error('upsertCoverageFixedTariff: select error', {
        code: (error as any).code,
        message: (error as any).message,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      throw error
    }
    const existing = (data || [])[0]

    if (existing) {
      const { error: upErr } = await supabase
        .from('coverage_tariff_rules')
        .update({ fixed_amount: fixedAmount, is_active: true })
        .eq('id', existing.id)
      if (upErr) {
        logger.error('upsertCoverageFixedTariff: update error', {
          code: (upErr as any).code,
          message: (upErr as any).message,
          details: (upErr as any).details,
          hint: (upErr as any).hint,
        })
        throw upErr
      }
      logger.api('upsertCoverageFixedTariff: updated existing rule', { ruleId: existing.id })
    } else {
      const { error: insErr } = await supabase
        .from('coverage_tariff_rules')
        .insert({ coverage_id: coverageId, fixed_amount: fixedAmount, is_active: true })
      if (insErr) {
        logger.error('upsertCoverageFixedTariff: insert error', {
          code: (insErr as any).code,
          message: (insErr as any).message,
          details: (insErr as any).details,
          hint: (insErr as any).hint,
        })
        throw insErr
      }
      logger.api('upsertCoverageFixedTariff: inserted new rule')
    }
  }
  // ---------- FIXED TARIFFS ----------
  async listFixedTariffs(): Promise<FixedTariffItem[]> {
    logger.api('listFixedTariffs: fetching')
    const { data, error } = await supabase
      .from('coverage_tariff_rules')
      .select(
        `id, coverage_id, fixed_amount, formula_name, conditions,
         coverage:coverages(id, name, calculation_type)`
      )
      .not('fixed_amount', 'is', null) // fixed_amount not null
      .eq('is_active', true)

    if (error) {
      logger.error('listFixedTariffs: supabase error', error)
      throw error
    }

    const rows = (data || [])
    logger.api(`listFixedTariffs: fetched ${rows.length} rows`)
    return rows.map((row: any) => {
      const condStr = row.conditions ? JSON.stringify(row.conditions) : null
      const packReduced = row.conditions?.pack_price_reduced ?? null
      return {
        id: row.id,
        coverageId: row.coverage_id,
        coverageName: row.coverage?.name ?? row.coverage_id,
        formulaName: row.formula_name ?? null,
        fixedAmount: Number(row.fixed_amount || 0),
        conditions: condStr,
        packPriceReduced: packReduced != null ? Number(packReduced) : null,
      }
    })
  }

  async listFixedCoverageOptions(): Promise<FixedCoverageOption[]> {
    logger.api('listFixedCoverageOptions: fetching')
    const { data, error } = await supabase
      .from('coverages')
      .select('id, name, calculation_type')
      .in('calculation_type', ['FIXED_AMOUNT', 'FORMULA_BASED'])
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      logger.error('listFixedCoverageOptions: supabase error', error)
      throw error
    }
    const rows = (data || []) as FixedCoverageOption[]
    logger.api(`listFixedCoverageOptions: fetched ${rows.length} options`)
    return rows
  }

  async listFreeCoverages(): Promise<FreeCoverageItem[]> {
    logger.api('listFreeCoverages: fetching')
    const { data, error } = await supabase
      .from('coverages')
      .select('id, name, is_mandatory, is_active')
      .eq('calculation_type', 'FREE')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      logger.error('listFreeCoverages: supabase error', error)
      throw error
    }
    const rows = (data || [])
    logger.api(`listFreeCoverages: fetched ${rows.length} items`)
    return rows.map((c: any) => ({ id: c.id, name: c.name, isMandatory: !!c.is_mandatory }))
  }

  async updateCoverage(
    id: string,
    fields: Partial<{ is_active: boolean; is_mandatory: boolean; name: string }>
  ): Promise<void> {
    const { error } = await supabase
      .from('coverages')
      .update(fields as any)
      .eq('id', id)

    if (error) throw error
  }

  async listFormulas(coverageId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('coverage_tariff_rules')
      .select('formula_name')
      .eq('coverage_id', coverageId)
      .is('formula_name', null, false)
      .eq('is_active', true)

    if (error) throw error
    const names = (data || [])
      .map((r: any) => r.formula_name)
      .filter((v: any) => !!v)
    return Array.from(new Set(names))
  }

  async createFixedTariff(input: {
    coverageId: string
    fixedAmount: number
    formulaName?: string
    packPriceReduced?: number
    conditionsText?: string
  }): Promise<string> {
    const conditions: Record<string, any> = {}
    if (input.packPriceReduced != null) conditions.pack_price_reduced = input.packPriceReduced
    if (input.conditionsText && input.conditionsText.trim() !== '') conditions.note = input.conditionsText.trim()

    const { data, error } = await supabase
      .from('coverage_tariff_rules')
      .insert({
        coverage_id: input.coverageId,
        fixed_amount: input.fixedAmount,
        formula_name: input.formulaName || null,
        is_active: true,
        conditions: Object.keys(conditions).length ? conditions : null,
      })
      .select('id')
      .single()

    if (error) throw error
    return data!.id as string
  }

  async updateFixedTariff(
    id: string,
    input: {
      coverageId?: string
      fixedAmount?: number
      formulaName?: string | null
      packPriceReduced?: number | null
      conditionsText?: string | null
    }
  ): Promise<void> {
    const update: any = {}
    if (input.coverageId !== undefined) update.coverage_id = input.coverageId
    if (input.fixedAmount !== undefined) update.fixed_amount = input.fixedAmount
    if (input.formulaName !== undefined) update.formula_name = input.formulaName

    // Merge conditions fields
    const cond: Record<string, any> = {}
    if (input.packPriceReduced !== undefined) cond.pack_price_reduced = input.packPriceReduced
    if (input.conditionsText !== undefined) cond.note = input.conditionsText
    if (Object.keys(cond).length) update.conditions = cond

    logger.api('updateFixedTariff: updating', { id, input })
    const { error } = await supabase
      .from('coverage_tariff_rules')
      .update(update)
      .eq('id', id)

    if (error) {
      logger.error('updateFixedTariff: supabase error', error)
      throw error
    }
  }

  async deleteFixedTariff(id: string): Promise<void> {
    logger.api('deleteFixedTariff: deleting', { id })
    const { error } = await supabase
      .from('coverage_tariff_rules')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('deleteFixedTariff: supabase error', error)
      throw error
    }
  }

  async deleteCoverage(coverageId: string): Promise<void> {
    // Delete rules first to avoid FK constraint, then coverage
    logger.api('deleteCoverage: deleting rules', { coverageId })
    const { error: ruleErr } = await supabase
      .from('coverage_tariff_rules')
      .delete()
      .eq('coverage_id', coverageId)
    if (ruleErr) {
      logger.error('deleteCoverage: rule delete error', ruleErr)
      throw ruleErr
    }

    logger.api('deleteCoverage: deleting coverage', { coverageId })
    const { error } = await supabase
      .from('coverages')
      .delete()
      .eq('id', coverageId)

    if (error) {
      logger.error('deleteCoverage: coverage delete error', error)
      throw error
    }
  }

  // ---------- RC (MTPL) TARIFFS ----------
  async listRCTariffs(): Promise<Array<{ vehicle_category: string; fiscal_power: number; fuel_type: string; base_premium: number }>> {
    const { data, error } = await supabase
      .from('mtpl_tariffs')
      .select('vehicle_category, fiscal_power, fuel_type, base_premium')
      .eq('is_active', true)
      .order('vehicle_category')
      .order('fiscal_power')

    if (error) throw error
    return (data || []) as any
  }

  async upsertRCTariff(row: { vehicle_category: string; fiscal_power: number; fuel_type: string; base_premium: number }): Promise<void> {
    // Uses unique constraint (vehicle_category, fiscal_power, fuel_type)
    const { error } = await supabase
      .from('mtpl_tariffs')
      .upsert(
        {
          vehicle_category: row.vehicle_category as any,
          fiscal_power: row.fiscal_power,
          fuel_type: row.fuel_type,
          base_premium: row.base_premium,
          is_active: true,
        },
        { onConflict: 'vehicle_category,fiscal_power,fuel_type' }
      )

    if (error) throw error
  }

  async deleteRCTariff(vehicle_category: string, fiscal_power: number, fuel_type: string): Promise<void> {
    const { error } = await supabase
      .from('mtpl_tariffs')
      .delete()
      .eq('vehicle_category', vehicle_category as any)
      .eq('fiscal_power', fiscal_power)
      .eq('fuel_type', fuel_type)

    if (error) throw error
  }

  // ---------- TCM/TCL RATES ----------
  async listTierceRates(): Promise<Array<{ vehicle_category: string; coverage_type: string; rate: number; deductible_level: number }>> {
    const { data, error } = await supabase
      .from('tcm_tcl_rates')
      .select('vehicle_category, coverage_type, rate, deductible_level')
      .eq('is_active', true)
      .order('vehicle_category')
      .order('coverage_type')
      .order('deductible_level')

    if (error) throw error
    return (data || []) as any
  }

  async upsertTierceRate(row: { vehicle_category: string; coverage_type: string; rate: number; deductible_level: number }): Promise<void> {
    // Uses unique constraint (vehicle_category, coverage_type, deductible_level)
    const { error } = await supabase
      .from('tcm_tcl_rates')
      .upsert(
        {
          vehicle_category: row.vehicle_category as any,
          coverage_type: row.coverage_type as any,
          rate: row.rate,
          deductible_level: row.deductible_level,
          is_active: true,
        },
        { onConflict: 'vehicle_category,coverage_type,deductible_level' }
      )

    if (error) throw error
  }

  async deleteTierceRate(vehicle_category: string, coverage_type: string, deductible_level: number): Promise<void> {
    const { error } = await supabase
      .from('tcm_tcl_rates')
      .delete()
      .eq('vehicle_category', vehicle_category as any)
      .eq('coverage_type', coverage_type as any)
      .eq('deductible_level', deductible_level)

    if (error) throw error
  }
}

export const tarificationSupabaseService = new TarificationSupabaseService()
