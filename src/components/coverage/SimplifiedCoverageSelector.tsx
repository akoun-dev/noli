import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  coverageTarificationService,
  type CoverageOption,
  type VehicleData,
} from '@/services/coverageTarificationService'
import { logger } from '@/lib/logger'

export interface SimplifiedCoverageSelectorProps {
  /** Identifiant du devis temporaire (peut être vide tant qu'aucun devis n'est créé). */
  quoteId: string
  /** Données véhicule utilisées pour filtrer/tarifer les garanties. */
  vehicleData: VehicleData
  /** État courant des garanties cochées, indexé par coverage_id. */
  selectedCoverages: Record<string, boolean>
  /** Appelé quand l'utilisateur (dé)coche une garantie. Le parent calcule la prime. */
  onCoverageChange: (
    coverageId: string,
    isIncluded: boolean,
    formulaName?: string
  ) => void | Promise<void>
  /** Optionnel : notifie le parent des primes agrégées. Le parent reste la source de vérité. */
  onPremiumsChange?: (total: number, breakdown: Record<string, number>) => void
  /** Autorise le calcul serveur (nécessite un utilisateur authentifié). */
  canCalculate?: boolean
  /** Remonte la liste des garanties disponibles au parent une fois chargée. */
  onCoveragesLoaded?: (coverages: CoverageOption[]) => void
}

const formatFcfa = (amount?: number): string | null => {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return null
  }
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

const estimatePriceLabel = (coverage: CoverageOption): string | null => {
  const fixed = formatFcfa(coverage.fixed_price)
  if (fixed) return `${fixed}`

  const min = formatFcfa(coverage.estimated_min_premium)
  const max = formatFcfa(coverage.estimated_max_premium)
  if (min && max) return `${min} – ${max}`
  return min ?? max
}

/**
 * Sélecteur de garanties simplifié.
 *
 * Se branche sur `coverageTarificationService.getAvailableCoverages` pour charger la
 * liste réelle des garanties actives (filtrées selon le véhicule), et délègue le calcul
 * de prime au parent via `onCoverageChange` (voir `Step3Needs`).
 */
const SimplifiedCoverageSelector: React.FC<SimplifiedCoverageSelectorProps> = ({
  vehicleData,
  selectedCoverages,
  onCoverageChange,
  onCoveragesLoaded,
}) => {
  const [coverages, setCoverages] = useState<CoverageOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Paramètres de filtrage stables pour éviter des rechargements inutiles.
  const params = useMemo(
    () => ({
      category: vehicleData?.category,
      vehicle_value: vehicleData?.sum_insured ?? vehicleData?.new_value ?? null,
      fiscal_power: vehicleData?.fiscal_power ?? null,
      fuel_type: vehicleData?.fuel_type ?? null,
    }),
    [
      vehicleData?.category,
      vehicleData?.sum_insured,
      vehicleData?.new_value,
      vehicleData?.fiscal_power,
      vehicleData?.fuel_type,
    ]
  )

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const available = await coverageTarificationService.getAvailableCoverages(params)
        if (cancelled) return
        setCoverages(available)
        onCoveragesLoaded?.(available)
      } catch (err) {
        if (cancelled) return
        logger.error('SimplifiedCoverageSelector: échec du chargement des garanties', err)
        setError('Impossible de charger les garanties. Veuillez réessayer.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // onCoveragesLoaded volontairement exclu : il change à chaque rendu du parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const handleToggle = (coverage: CoverageOption, checked: boolean) => {
    // Une garantie obligatoire ne peut pas être décochée.
    if (coverage.is_mandatory && !checked) return
    const defaultFormula = coverage.available_formulas?.[0]
    void onCoverageChange(coverage.coverage_id, checked, defaultFormula)
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Chargement des garanties...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (coverages.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">
          Aucune garantie disponible pour ce véhicule.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-base sm:text-lg">
        <Shield className="w-4 h-4 text-primary" />
        Garanties
      </h3>
      <div className="space-y-3" role="group" aria-label="Sélection des garanties">
        {coverages.map((coverage) => {
          const inputId = `coverage-${coverage.coverage_id}`
          const isChecked =
            selectedCoverages[coverage.coverage_id] ?? coverage.is_mandatory
          const price = estimatePriceLabel(coverage)

          return (
            <div
              key={coverage.coverage_id}
              className={cn(
                'flex items-start gap-3 rounded-md border p-3 transition-colors',
                isChecked ? 'border-primary/50 bg-primary/5' : 'border-border'
              )}
            >
              <Checkbox
                id={inputId}
                checked={isChecked}
                disabled={coverage.is_mandatory}
                onCheckedChange={(value) => handleToggle(coverage, value === true)}
                aria-describedby={`${inputId}-desc`}
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer">
                  <span className="font-medium">{coverage.name}</span>
                  {coverage.is_mandatory && (
                    <span className="text-xs text-muted-foreground">(obligatoire)</span>
                  )}
                </Label>
                {coverage.description && (
                  <p id={`${inputId}-desc`} className="text-xs text-muted-foreground mt-1">
                    {coverage.description}
                  </p>
                )}
              </div>
              {price && (
                <span className="text-sm font-medium whitespace-nowrap text-primary">
                  {price}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default SimplifiedCoverageSelector
