import { supabase } from '@/lib/supabase'

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

class TarificationSupabaseService {
  // ---------- FIXED TARIFFS ----------
  async listFixedTariffs(): Promise<FixedTariffItem[]> {
    const { data, error } = await supabase
      .from('coverage_tariff_rules')
      .select(
        `id, coverage_id, fixed_amount, formula_name, conditions,
         coverage:coverages(id, name, calculation_type)`
      )
      .not('fixed_amount', 'is', null) // fixed_amount not null
      .eq('is_active', true)

    if (error) throw error

    return (data || []).map((row: any) => {
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
    const { data, error } = await supabase
      .from('coverages')
      .select('id, name, calculation_type')
      .in('calculation_type', ['FIXED_AMOUNT', 'FORMULA_BASED'])
      .eq('is_active', true)
      .order('display_order')

    if (error) throw error
    return (data || []) as FixedCoverageOption[]
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

    const { error } = await supabase
      .from('coverage_tariff_rules')
      .update(update)
      .eq('id', id)

    if (error) throw error
  }

  async deleteFixedTariff(id: string): Promise<void> {
    const { error } = await supabase
      .from('coverage_tariff_rules')
      .delete()
      .eq('id', id)

    if (error) throw error
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
