/*
  Seed real tarification data into Supabase (local/dev).

  - Inserts canonical coverages (RC, Défense & Recours, etc.) if missing
  - Inserts fixed-amount tariff rules (e.g., Défense & Recours, Assistance, IPT formulas)
  - Inserts a minimal MTPL tariff sample for RC display/tests

  Usage:
    VITE_SUPABASE_URL=... VITE_SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-tarification.ts

  Or via package.json script: npm run seed:tarification
*/

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

// Load .env.local manually if present (no dotenv dependency required)
try {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      // Strip surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  }
} catch (_) {
  // Non-blocking
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY in env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
})

type CoverageRow = {
  id: string
  type?: string | null
  name: string
  description?: string | null
  calculation_type: string
  is_mandatory?: boolean
  is_active?: boolean
  display_order?: number
}

async function upsertCoverages() {
  const coverages: CoverageRow[] = [
    { id: 'RC', type: 'RC', name: 'Responsabilité Civile', calculation_type: 'MTPL_TARIFF', is_mandatory: true, is_active: true, display_order: 1 },
    { id: 'DEFENSE_RECOURS', type: 'DEFENSE_RECOURS', name: 'Défense et Recours', calculation_type: 'FIXED_AMOUNT', is_active: true, display_order: 10 },
    { id: 'IPT', type: 'IPT', name: 'Individuelle Conducteur', calculation_type: 'FORMULA_BASED', is_active: true, display_order: 20 },
    { id: 'AVANCE_RECOURS', type: 'AVANCE_RECOURS', name: 'Avance sur recours', calculation_type: 'FIXED_AMOUNT', is_active: true, display_order: 30 },
    { id: 'VOL_ACCESSOIRES', type: 'VOL_ACCESSOIRES', name: 'Vol des accessoires', calculation_type: 'FIXED_AMOUNT', is_active: true, display_order: 31 },
    { id: 'INCENDIE', type: 'INCENDIE', name: 'Incendie', calculation_type: 'PERCENTAGE_SI', is_active: true, display_order: 40 },
    { id: 'VOL', type: 'VOL', name: 'Vol', calculation_type: 'PERCENTAGE_SI', is_active: true, display_order: 41 },
    { id: 'VOL_MAINS_ARMEES', type: 'VOL_MAINS_ARMEES', name: 'Vol à mains armées', calculation_type: 'PERCENTAGE_SI', is_active: true, display_order: 42 },
    { id: 'BRIS_GLACES', type: 'BRIS_GLACES', name: 'Bris de glaces', calculation_type: 'PERCENTAGE_VN', is_active: true, display_order: 50 },
    { id: 'TIERCE_COMPLETE', type: 'TIERCE_COMPLETE', name: 'Tierce Complète', calculation_type: 'FORMULA_BASED', is_active: true, display_order: 60 },
    { id: 'TIERCE_COLLISION', type: 'TIERCE_COLLISION', name: 'Tierce Collision', calculation_type: 'FORMULA_BASED', is_active: true, display_order: 61 },
    { id: 'ASSISTANCE_AUTO', type: 'ASSISTANCE_AUTO', name: 'Assistance Auto', calculation_type: 'FIXED_AMOUNT', is_active: true, display_order: 70 },
  ]

  const { data: existing, error: exErr } = await supabase
    .from('coverages')
    .select('id')

  if (exErr) throw exErr
  const existingIds = new Set((existing || []).map((r: any) => r.id))
  const toInsert = coverages.filter((c) => !existingIds.has(c.id))

  if (toInsert.length === 0) {
    console.log('Coverages: already present, skipping insert')
    return
  }

  const { error } = await supabase.from('coverages').insert(toInsert as any)
  if (error) throw error
  console.log(`Coverages: inserted ${toInsert.length}`)
}

async function upsertFixedTariffs() {
  // Helper to check if a fixed rule exists
  async function hasRule(coverageId: string, formulaName?: string | null, fixedAmount?: number | null) {
    let q = supabase
      .from('coverage_tariff_rules')
      .select('id, fixed_amount, formula_name')
      .eq('coverage_id', coverageId)
      .eq('is_active', true)
    if (formulaName == null) q = q.is('formula_name', null)
    else q = q.eq('formula_name', formulaName)
    if (fixedAmount != null) q = q.eq('fixed_amount', fixedAmount)
    const { data, error } = await q.limit(1)
    if (error) throw error
    return (data || []).length > 0
  }

  const rules: Array<{
    coverage_id: string
    fixed_amount: number
    formula_name?: string | null
    conditions?: any | null
  }> = [
    { coverage_id: 'DEFENSE_RECOURS', fixed_amount: 7950, conditions: { pack_price_reduced: 4240 } },
    { coverage_id: 'AVANCE_RECOURS', fixed_amount: 15000 },
    { coverage_id: 'VOL_ACCESSOIRES', fixed_amount: 15000 },
    { coverage_id: 'ASSISTANCE_AUTO', fixed_amount: 48000, formula_name: 'bronze', conditions: { note: 'Uniquement pickups' } },
    { coverage_id: 'ASSISTANCE_AUTO', fixed_amount: 65000, formula_name: 'silver', conditions: { note: 'Uniquement pickups' } },
    // IPT Formulas (Individuelle Conducteur)
    { coverage_id: 'IPT', fixed_amount: 5500, formula_name: 'formule_1' },
    { coverage_id: 'IPT', fixed_amount: 8400, formula_name: 'formule_2' },
    { coverage_id: 'IPT', fixed_amount: 15900, formula_name: 'formule_3' },
  ]

  let inserted = 0
  for (const r of rules) {
    const exists = await hasRule(r.coverage_id, r.formula_name ?? null, r.fixed_amount)
    if (exists) continue
    const { error } = await supabase.from('coverage_tariff_rules').insert({
      coverage_id: r.coverage_id,
      fixed_amount: r.fixed_amount,
      formula_name: r.formula_name ?? null,
      is_active: true,
      conditions: r.conditions ?? null,
    })
    if (error) throw error
    inserted++
  }
  console.log(`Fixed tariffs: inserted ${inserted}`)
}

async function upsertMtplSamples() {
  // A couple of RC base premiums for demo/real-ish data
  const samples = [
    { vehicle_category: '401', fiscal_power: 6, fuel_type: 'essence', base_premium: 87885 },
    { vehicle_category: '401', fiscal_power: 6, fuel_type: 'diesel', base_premium: 102345 },
    { vehicle_category: '402', fiscal_power: 4, fuel_type: 'essence', base_premium: 78500 },
  ]

  let inserted = 0
  for (const s of samples) {
    const { data, error } = await supabase
      .from('mtpl_tariffs')
      .select('id')
      .eq('vehicle_category', s.vehicle_category as any)
      .eq('fiscal_power', s.fiscal_power)
      .eq('fuel_type', s.fuel_type)
      .limit(1)
    if (error) throw error
    if ((data || []).length > 0) continue
    const { error: insErr } = await supabase.from('mtpl_tariffs').insert({
      vehicle_category: s.vehicle_category as any,
      fiscal_power: s.fiscal_power,
      fuel_type: s.fuel_type,
      base_premium: s.base_premium,
      is_active: true,
    })
    if (insErr) throw insErr
    inserted++
  }
  console.log(`MTPL tariffs: inserted ${inserted}`)
}

async function main() {
  try {
    await upsertCoverages()
    await upsertFixedTariffs()
    await upsertMtplSamples()
    console.log('✅ Seed completed')
  } catch (e) {
    console.error('❌ Seed error:', e)
    process.exit(1)
  }
}

main()
