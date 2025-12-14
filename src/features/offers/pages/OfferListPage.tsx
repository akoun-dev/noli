import { useEffect, useMemo, useState } from 'react'
import {
  Shield,
  ArrowLeft,
  SlidersHorizontal,
  Star,
  Check,
  Phone,
  FileText,
  Heart,
  GitCompare,
  X,
  Trash2,
  ChevronDown,
  Save,
  Clock,
  Search,
  Car,
  Info,
  TrendingDown,
  Award,
  Info as InfoIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import OfferCompareModal from '@/features/offers/components/OfferCompareModal'
import EnhancedCompareModal from '@/features/offers/components/EnhancedCompareModal'
import QuoteOptionsModal from '@/features/offers/components/QuoteOptionsModal'
import SaveSearchModal from '@/features/offers/components/SaveSearchModal'
import CustomerReviews from '@/features/offers/components/CustomerReviews'
import LiveChat from '@/features/offers/components/LiveChat'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import offerService from '@/data/api/offerService'
import { Offer } from '@/data/api/offerService'
import { logger } from '@/lib/logger'
import { coverageTarificationService } from '@/services/coverageTarificationService'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const FORMULA_PRESETS = [
  {
    key: 'tiers',
    label: 'Tiers',
    features: [
      { label: 'Responsabilité civile', active: true },
      { label: 'Vol & incendie', active: false },
      { label: 'Dommages tous accidents', active: false },
    ],
  },
  {
    key: 'vol_incendie',
    label: 'Vol & incendie',
    features: [
      { label: 'Responsabilité civile', active: true },
      { label: 'Vol & incendie', active: true },
      { label: 'Dommages tous accidents', active: false },
    ],
  },
  {
    key: 'tous_risques',
    label: 'Tous risques',
    features: [
      { label: 'Responsabilité civile', active: true },
      { label: 'Vol & incendie', active: true },
      { label: 'Dommages tous accidents', active: true },
    ],
  },
]

const FORMULA_SYNONYMS: Record<string, string[]> = {
  tiers: ['tiers', 'rc', 'responsabilite', 'responsabilité'],
  vol_incendie: ['vol', 'incendie', 'vol incendie', 'vol/incendie'],
  tous_risques: ['tous risques', 'tous_risques', 'omnium', 'tout risque'],
}

const OPTION_FILTERS = [
  { key: 'bris de glace', label: 'Bris de glace' },
  { key: 'assistance panne 0 km', label: 'Assistance panne 0 km' },
  { key: 'assistance accident', label: 'Assistance accident' },
  { key: 'vehicule de remplacement', label: 'Véhicule de remplacement' },
]

const Results = () => {
  const [sortBy, setSortBy] = useState('price-asc')
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([])
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [driverProtection, setDriverProtection] = useState<number>(50)
  const [priceView, setPriceView] = useState<'yearly' | 'monthly'>('yearly')
  const [comparisonSummary, setComparisonSummary] = useState<any>(null)
  const [openFormulas, setOpenFormulas] = useState<Record<string, boolean>>({})
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000])
  const [maxFranchise, setMaxFranchise] = useState<number>(500000)
  const [minRating, setMinRating] = useState<number>(0)

  // Search save functionality
  type SavedSearch = {
    id: number
    name: string
    timestamp: string
    filters: {
      sortBy: string
      selectedInsurers: string[]
      selectedCoverage: string[]
      selectedOptions?: string[]
      favoritesOnly: boolean
      priceRange: [number, number]
      maxFranchise: number
      minRating: number
      driverProtection?: number
    }
    resultsCount: number
  }
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [selectedGuarantees, setSelectedGuarantees] = useState<string[]>([])
  const [expandedOffers, setExpandedOffers] = useState<string[]>([])

  // Favorites (persisted)
  const [favorites, setFavorites] = useState<string[]>([])
  useEffect(() => {
    const raw = localStorage.getItem('noli:favorites')
    if (raw) setFavorites(JSON.parse(raw))
  }, [])
  useEffect(() => {
    localStorage.setItem('noli:favorites', JSON.stringify(favorites))
  }, [favorites])

  // Saved searches (persisted)
  useEffect(() => {
    const raw = localStorage.getItem('noli:savedSearches')
    if (raw) setSavedSearches(JSON.parse(raw))
  }, [])
  useEffect(() => {
    localStorage.setItem('noli:savedSearches', JSON.stringify(savedSearches))
  }, [savedSearches])

  // Last comparison context (from the quotation workflow)
  useEffect(() => {
    try {
      console.log('🔍 Reading comparison data from localStorage...')
      const raw = localStorage.getItem('noli:comparison:last')
      console.log('📄 Raw data from localStorage:', raw)
      if (raw) {
        const parsed = JSON.parse(raw)
        console.log('✅ Parsed comparison data:', parsed)
        setComparisonSummary(parsed)
      } else {
        console.log('❌ No comparison data found in localStorage')
      }
    } catch (err) {
      console.error('❌ Error reading comparison data:', err)
      logger.warn('Cannot read saved comparison summary', err)
    }
  }, [])

  // Load selected guarantees names based on last comparison context
  useEffect(() => {
    const selected = comparisonSummary?.insuranceNeeds?.coverageData?.selectedCoverages
    if (!selected) {
      setSelectedGuarantees([])
      return
    }

    const selectedIds = Object.entries(selected)
      .filter(([, isOn]) => Boolean(isOn))
      .map(([id]) => id)

    if (selectedIds.length === 0) {
      setSelectedGuarantees([])
      return
    }

    const toNumber = (value: any, fallback?: number) => {
      if (typeof value === 'number' && Number.isFinite(value)) return value
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d]/g, '')
        const parsed = parseInt(cleaned, 10)
        if (Number.isFinite(parsed)) return parsed
      }
      return fallback
    }

    const vehicle = comparisonSummary?.vehicleInfo || {}

    const loadGuarantees = async () => {
      try {
        const coverages = await coverageTarificationService.getAvailableCoverages({
          category: vehicle.category || '401',
          vehicle_value: toNumber(vehicle.currentValue, toNumber(vehicle.newValue, 0)) || 0,
          fiscal_power: toNumber(vehicle.fiscalPower, undefined),
          fuel_type: vehicle.fuel || undefined,
        })

        const names = selectedIds
          .map((id) => {
            const match = coverages.find(
              (c) => c.coverage_id === id || (c as any).id === id || (c as any).code === id
            )
            return match?.name || (match as any)?.label || match?.coverage_type || id
          })
          .filter(Boolean)

        setSelectedGuarantees(names)
      } catch (err) {
        logger.warn('Impossible de charger les garanties sélectionnées', err)
        setSelectedGuarantees(selectedIds)
      }
    }

    loadGuarantees()
  }, [comparisonSummary?.insuranceNeeds?.coverageData])

  // Load offers from database
  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    try {
      setLoading(true)
      const data = await offerService.getPublicOffers()
      setOffers(data)
    } catch (err) {
      logger.error('Error loading offers:', err)
      setError('Erreur lors du chargement des offres')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Compare selection
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('noli:compare') || '[]')
    } catch {
      return []
    }
  })
  useEffect(() => {
    localStorage.setItem('noli:compare', JSON.stringify(compareIds))
  }, [compareIds])

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]
    ) // max 3
  }

  const openQuoteModal = (offer: Offer) => {
    setSelectedOfferForQuote(offer)
    setQuoteModalOpen(true)
  }

  // Save current search
  const saveCurrentSearch = () => {
    if (!searchName.trim()) return

    const search = {
      id: Date.now(),
      name: searchName,
      timestamp: new Date().toISOString(),
      filters: {
        sortBy,
        selectedInsurers,
        selectedCoverage,
        selectedOptions,
        favoritesOnly,
        priceRange,
        maxFranchise,
        minRating,
        driverProtection,
      },
      resultsCount: filteredOffers.length,
    }

    setSavedSearches((prev) => [...prev, search])
    setSaveSearchModalOpen(false)
    setSearchName('')
  }

  // Load saved search
  const loadSavedSearch = (search: SavedSearch) => {
    const { filters } = search
    setSortBy(filters.sortBy)
    setSelectedInsurers(filters.selectedInsurers)
    setSelectedCoverage(filters.selectedCoverage)
    setSelectedOptions(filters.selectedOptions || [])
    setFavoritesOnly(filters.favoritesOnly)
    setPriceRange(filters.priceRange)
    setMaxFranchise(filters.maxFranchise)
    setMinRating(filters.minRating)
    if (typeof filters.driverProtection === 'number') {
      setDriverProtection(filters.driverProtection)
    }
  }

  // Delete saved search
  const deleteSavedSearch = (id: number) => {
    setSavedSearches((prev) => prev.filter((search) => search.id !== id))
  }

  const clearCompare = () => setCompareIds([])
  const selectedOffers = useMemo(
    () => offers.filter((o) => compareIds.includes(o.id)),
    [compareIds, offers]
  )
  const [openCompare, setOpenCompare] = useState(false)
  const [useEnhancedCompare, setUseEnhancedCompare] = useState(true)
  const toggleExpandedOffer = (id: string) => {
    setExpandedOffers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Quote options modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedOfferForQuote, setSelectedOfferForQuote] = useState<Offer | null>(null)

  const insurers = useMemo(
    () => Array.from(new Set(offers.map((o) => o.insurer_name || 'Assureur'))),
    [offers]
  )

  // Pré-sélectionner la formule choisie durant le workflow
  useEffect(() => {
    if (!comparisonSummary?.insuranceNeeds?.coverageType) return
    if (selectedCoverage.length > 0) return

    const targetKey = comparisonSummary.insuranceNeeds.coverageType as string
    const preset = FORMULA_PRESETS.find((f) => f.key === targetKey)
    if (preset) {
      setSelectedCoverage([preset.key])
    }
  }, [comparisonSummary?.insuranceNeeds?.coverageType, selectedCoverage.length])

  const toggleInsurer = (insurer: string) => {
    setSelectedInsurers((prev) =>
      prev.includes(insurer) ? prev.filter((i) => i !== insurer) : [...prev, insurer]
    )
  }

  const toggleCoverage = (coverage: string) => {
    setSelectedCoverage((prev) =>
      prev.includes(coverage) ? prev.filter((c) => c !== coverage) : [...prev, coverage]
    )
  }

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    )
  }

  const formatCurrency = (value: number) => `${Math.round(value || 0).toLocaleString('fr-FR')} FCFA`

  const matchesCoverageFormula = (offer: Offer, formulas: string[]) => {
    if (formulas.length === 0) return true
    const contract = (offer.contract_type || 'standard').toLowerCase()
    return formulas.some((key) => {
      const terms = FORMULA_SYNONYMS[key] || [key]
      return terms.some((term) => contract.includes(term))
    })
  }

  const filteredOffers = useMemo(
    () =>
      offers
        .filter((offer) => {
          // Basic filters
          if (
            selectedInsurers.length > 0 &&
            !selectedInsurers.includes(offer.insurer_name || 'Assureur')
          )
            return false
          if (selectedCoverage.length > 0 && !matchesCoverageFormula(offer, selectedCoverage))
            return false
          if (favoritesOnly && !favorites.includes(offer.id)) return false

          // Advanced filters
          const monthlyPrice = (offer.price_min || 0) / 12
          if (monthlyPrice < priceRange[0] || monthlyPrice > priceRange[1]) return false
          if (offer.deductible > maxFranchise) return false

          // Option filters (simple text match on features)
          if (selectedOptions.length > 0) {
            const featureText = (offer.features || []).join(' ').toLowerCase()
            const allMatched = selectedOptions.every((opt) => featureText.includes(opt))
            if (!allMatched) return false
          }

          return true
        })
        .sort((a, b) => {
          const aPrice = a.price_min || 0
          const bPrice = b.price_min || 0

          if (sortBy === 'price-asc') return aPrice - bPrice
          if (sortBy === 'price-desc') return bPrice - aPrice
          if (sortBy === 'rating') return (b.insurer_rating || 0) - (a.insurer_rating || 0)
          return 0
        }),
    [
      offers,
      sortBy,
      selectedInsurers,
      selectedCoverage,
      favoritesOnly,
      priceRange,
      maxFranchise,
      minRating,
      selectedOptions,
      favorites,
    ]
  )

  const toggleFormulaDetails = (key: string) => {
    setOpenFormulas((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sortedByPrice = useMemo(
    () => [...filteredOffers].sort((a, b) => (a.price_min || 0) - (b.price_min || 0)),
    [filteredOffers]
  )
  const cheapestOffers = sortedByPrice.slice(0, 3)
  const bestRatedOffers = useMemo(
    () =>
      [...filteredOffers]
        .filter((o) => typeof o.insurer_rating === 'number')
        .sort((a, b) => (b.insurer_rating || 0) - (a.insurer_rating || 0))
        .slice(0, 3),
    [filteredOffers]
  )

  const insuredName = useMemo(() => {
    const info = comparisonSummary?.personalInfo || {}
    const full = `${info.firstName || ''} ${info.lastName || ''}`.trim()
    return full || 'Votre sélection'
  }, [comparisonSummary])

  const vehicleLabel = useMemo(() => {
    const v = comparisonSummary?.vehicleInfo || {}
    const parts = [v.brand, v.model, v.year || v.circulationYear].filter(Boolean)
    return parts.join(' ') || 'votre véhicule'
  }, [comparisonSummary])

  const coverageLabel = useMemo(() => {
    const type = comparisonSummary?.insuranceNeeds?.coverageType
    if (!type) return 'Formule'
    if (type === 'tiers') return 'Formule Tiers'
    if (type === 'vol_incendie') return 'Vol & Incendie'
    if (type === 'tous_risques') return 'Tous risques'
    return type
  }, [comparisonSummary])

  const durationLabel = useMemo(() => {
    const duration = comparisonSummary?.insuranceNeeds?.contractDuration
    if (!duration) return null
    const mapping: Record<string, string> = {
      '1_mois': '1 mois',
      '3_mois': '3 mois',
      '6_mois': '6 mois',
      '9_mois': '9 mois',
      '12_mois': '12 mois',
    }
    return mapping[duration] || duration
  }, [comparisonSummary])

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Chargement des offres...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center'>
        <Card className='p-8 max-w-md'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold mb-4'>Erreur</h2>
            <p className='text-muted-foreground mb-6'>{error}</p>
            <Button onClick={loadOffers}>Réessayer</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-primary/5'>
      {/* Header */}
      <div className='border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <Link to='/' className='flex items-center gap-2'>
              <img
                src="/img/noli vertical sans fond.png"
                alt="NOLI Assurance"
                className="h-10 w-auto"
              />
              <div className='flex flex-col'>
                <span className='font-bold text-xl'>NOLI</span>
                <span className='text-xs text-muted-foreground'>Assurance Auto</span>
              </div>
            </Link>
            <div className='flex items-center gap-2'>
              <ThemeToggle />
              <Button variant='outline' asChild>
                <Link to='/comparer' state={{ resumeFromResults: true }}>
                  <ArrowLeft className='mr-2 w-4 h-4' />
                  Modifier
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Results Header */}
        <div className='mb-8 space-y-6 animate-fade-in'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>Bonjour {insuredName},</p>
              <h1 className='text-3xl md:text-4xl font-bold text-foreground leading-tight'>
                {filteredOffers.length} meilleures offres pour votre {vehicleLabel}
              </h1>
              <p className='text-muted-foreground'>
                Classées par prix croissant et adaptées à vos réponses.
              </p>
              <div className='flex flex-wrap gap-2 pt-2'>
                <Badge variant='outline'>{coverageLabel}</Badge>
                {durationLabel && <Badge variant='outline'>Durée {durationLabel}</Badge>}
                {comparisonSummary?.insuranceNeeds?.effectiveDate && (
                  <Badge variant='outline'>
                    Effet au {new Date(comparisonSummary.insuranceNeeds.effectiveDate).toLocaleDateString('fr-FR')}
                  </Badge>
                )}
              </div>
            </div>

            <div className='flex flex-col sm:flex-row items-stretch gap-3'>
              <div className='p-1 bg-muted rounded-full flex items-center shadow-sm'>
                <Button
                  size='sm'
                  variant={priceView === 'yearly' ? 'default' : 'ghost'}
                  className='rounded-full'
                  onClick={() => setPriceView('yearly')}
                >
                  Par an
                </Button>
                <Button
                  size='sm'
                  variant={priceView === 'monthly' ? 'default' : 'ghost'}
                  className='rounded-full'
                  onClick={() => setPriceView('monthly')}
                >
                  Par mois
                </Button>
              </div>
              <Card className='px-4 py-3 flex items-center gap-3 shadow-sm'>
                <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                  <Car className='w-5 h-5 text-primary' />
                </div>
                <div className='text-sm'>
                  <div className='font-semibold'>{vehicleLabel}</div>
                  <div className='text-muted-foreground'>
                    {coverageLabel}
                    {comparisonSummary?.estimated?.monthly
                      ? ` · ${formatCurrency(comparisonSummary.estimated.monthly)}/mois`
                      : ''}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-4'>
            <Card className='p-4 border-primary/20 shadow-sm'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <TrendingDown className='w-4 h-4 text-primary' />
                  <span className='font-semibold'>Offres les moins chères</span>
                </div>
                <Info className='w-4 h-4 text-muted-foreground' />
              </div>
              <div className='space-y-3'>
                {cheapestOffers.length === 0 && (
                  <p className='text-sm text-muted-foreground'>En attente de résultats.</p>
                )}
                {cheapestOffers.map((offer) => (
                  <div key={offer.id} className='flex items-center justify-between text-sm'>
                    <div className='flex items-center gap-2'>
                      {offer.logo_url ? (
                        <img src={offer.logo_url} alt={offer.insurer_name} className='w-8 h-8 object-contain' />
                      ) : (
                        <div className='w-8 h-8 rounded bg-muted flex items-center justify-center'>
                          <Shield className='w-4 h-4 text-primary' />
                        </div>
                      )}
                      <div>
                        <div className='font-medium'>{offer.insurer_name}</div>
                        <div className='text-xs text-muted-foreground'>{offer.contract_type}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='font-semibold text-primary'>
                        {priceView === 'yearly'
                          ? `${formatCurrency(offer.price_min || 0)}/an`
                          : `${formatCurrency((offer.price_min || 0) / 12)}/mois`}
                      </div>
                      <div className='text-xs text-muted-foreground'>dossier inclus</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className='p-4 border-primary/20 shadow-sm'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <Award className='w-4 h-4 text-primary' />
                  <span className='font-semibold'>Assureurs les mieux notés</span>
                </div>
                <Info className='w-4 h-4 text-muted-foreground' />
              </div>
              <div className='space-y-3'>
                {bestRatedOffers.length === 0 && (
                  <p className='text-sm text-muted-foreground'>En attente de résultats.</p>
                )}
                {bestRatedOffers.map((offer) => (
                  <div key={offer.id} className='flex items-center justify-between text-sm'>
                    <div className='flex items-center gap-2'>
                      {offer.logo_url ? (
                        <img src={offer.logo_url} alt={offer.insurer_name} className='w-8 h-8 object-contain' />
                      ) : (
                        <div className='w-8 h-8 rounded bg-muted flex items-center justify-center'>
                          <Shield className='w-4 h-4 text-primary' />
                        </div>
                      )}
                      <div>
                        <div className='font-medium'>{offer.insurer_name}</div>
                        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Star className='w-3 h-3 fill-yellow-400 text-yellow-400' />
                          <span>{offer.insurer_rating || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className='text-right text-xs text-muted-foreground'>
                      {offer.contract_type}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className='pt-2'>
              <div className='flex items-center gap-2 mb-3'>
                <Clock className='w-4 h-4 text-muted-foreground' />
                <h3 className='text-sm font-medium text-muted-foreground'>
                  Recherches sauvegardées
                </h3>
              </div>
              <div className='flex flex-wrap gap-2'>
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className='flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors'
                  >
                    <button
                      onClick={() => loadSavedSearch(search)}
                      className='flex items-center gap-2 hover:text-primary transition-colors'
                    >
                      <Search className='w-3 h-3' />
                      <span className='text-sm font-medium'>{search.name}</span>
                      <span className='text-xs text-muted-foreground'>({search.resultsCount})</span>
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(search.id)}
                      className='text-muted-foreground hover:text-destructive transition-colors'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='grid lg:grid-cols-4 gap-6'>
          {/* Filters Sidebar */}
          <aside className='lg:col-span-1'>
            <Card className='p-6 sticky top-24 space-y-8'>
              <div className='flex items-center gap-2'>
                <SlidersHorizontal className='w-5 h-5 text-primary' />
                <h2 className='font-semibold text-lg'>Filtres</h2>
              </div>

              {/* Formules */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-foreground'>Formules</p>
                  <Button variant='ghost' size='sm' className='h-8 px-2 text-xs' onClick={() => setSelectedCoverage([])}>
                    Réinitialiser
                  </Button>
                </div>
                <div className='space-y-3'>
                  {FORMULA_PRESETS.map((formula) => (
                    <div key={formula.key} className='p-3 border rounded-lg hover:border-primary/40 transition-colors'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <Checkbox
                            id={formula.key}
                            checked={selectedCoverage.includes(formula.key)}
                            onCheckedChange={() => toggleCoverage(formula.key)}
                          />
                          <div>
                            <Label htmlFor={formula.key} className='text-sm font-semibold cursor-pointer'>
                              {formula.label}
                            </Label>
                            <p className='text-xs text-muted-foreground'>Formule {formula.label}</p>
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() => toggleFormulaDetails(formula.key)}
                          className='p-1 rounded hover:bg-muted/60 transition-colors'
                          aria-label={`Détails ${formula.label}`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform ${
                              openFormulas[formula.key] ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                      {openFormulas[formula.key] && (
                        <div className='mt-3 grid gap-2'>
                          {formula.features.map((feature) => (
                            <div key={feature.label} className='flex items-center gap-2 text-sm'>
                              {feature.active ? (
                                <Check className='w-4 h-4 text-accent' />
                              ) : (
                                <X className='w-4 h-4 text-muted-foreground/60' />
                              )}
                              <span className={feature.active ? 'text-foreground' : 'text-muted-foreground'}>
                                {feature.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Garanties et franchises */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Label className='text-sm font-medium'>Garanties et franchises</Label>
                  <Info className='w-4 h-4 text-primary' />
                </div>
                <div className='space-y-2'>
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    Protection du conducteur — Couvre les dommages corporels dont vous pouvez être victime.
                  </p>
                  <Slider
                    value={[driverProtection]}
                    onValueChange={(value) => setDriverProtection(value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className='w-full'
                  />
                  <div className='flex justify-between text-xs text-muted-foreground'>
                    <span>Sans préférence</span>
                    <span>Plafond max.</span>
                  </div>
                </div>
                <div className='space-y-2 text-xs text-muted-foreground border-t pt-3'>
                  <div className='flex items-center justify-between'>
                    <span>Vol & incendie</span>
                    <ChevronDown className='w-3 h-3' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>Dommages tous accidents</span>
                    <ChevronDown className='w-3 h-3' />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className='space-y-3'>
                <p className='text-sm font-medium text-foreground'>Options</p>
                <div className='space-y-2'>
                  {OPTION_FILTERS.map((opt) => (
                    <div key={opt.key} className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          id={opt.key}
                          checked={selectedOptions.includes(opt.key)}
                          onCheckedChange={() => toggleOption(opt.key)}
                        />
                        <Label htmlFor={opt.key} className='text-sm cursor-pointer'>
                          {opt.label}
                        </Label>
                      </div>
                      <ChevronDown className='w-4 h-4 text-muted-foreground' />
                    </div>
                  ))}
                </div>
              </div>

              {/* Assureurs */}
              <div className='space-y-3 border-t pt-3'>
                <p className='text-sm font-medium text-foreground'>Assureurs</p>
                <div className='space-y-2 max-h-48 overflow-auto pr-1'>
                  {insurers.map((insurer) => (
                    <div key={insurer} className='flex items-center space-x-2'>
                      <Checkbox
                        id={insurer}
                        checked={selectedInsurers.includes(insurer)}
                        onCheckedChange={() => toggleInsurer(insurer)}
                      />
                      <Label htmlFor={insurer} className='text-sm cursor-pointer'>
                        {insurer}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affichage */}
              <div className='space-y-3'>
                <p className='text-sm font-medium text-foreground'>Affichage</p>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='favOnly'
                    checked={favoritesOnly}
                    onCheckedChange={(v) => setFavoritesOnly(Boolean(v))}
                  />
                  <Label htmlFor='favOnly' className='text-sm cursor-pointer'>
                    Mes favoris uniquement
                  </Label>
                </div>
              </div>

              {/* Prix */}
              <div className='space-y-3'>
                <p className='text-sm font-medium text-foreground'>Budget mensuel</p>
                <div className='space-y-2'>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange([value[0], value[1]])}
                    max={300000}
                    min={0}
                    step={1000}
                    className='w-full'
                  />
                  <div className='flex justify-between text-xs text-muted-foreground'>
                    <span>{formatCurrency(priceRange[0])}</span>
                    <span>{formatCurrency(priceRange[1])}</span>
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          {/* Offers List */}
          <div className='lg:col-span-3 space-y-4'>
            {filteredOffers.map((offer, index) => (
              <Card
                key={offer.id}
                className='p-6 hover:shadow-xl transition-all duration-300 animate-slide-up border-2 border-transparent hover:border-primary/20'
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card actions */}
                <div className='flex justify-end -mt-2 -mr-2 mb-2'>
                  <button
                    onClick={() => toggleFavorite(offer.id)}
                    className='p-2 rounded-full hover:bg-muted/50'
                    aria-label='Ajouter aux favoris'
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(offer.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                <div className='flex flex-col md:flex-row gap-6'>
                  {/* Left - Insurer Info */}
                  <div className='md:w-1/3'>
                    <div className='flex items-center gap-3 mb-3'>
                      {offer.logo_url ? (
                        <img
                          src={offer.logo_url}
                          alt={offer.insurer_name}
                          className='w-12 h-12 object-contain'
                        />
                      ) : (
                        <div className='w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                          <Shield className='w-6 h-6 text-primary' />
                        </div>
                      )}
                      <div>
                        <h3 className='font-bold text-lg text-foreground'>{offer.insurer_name}</h3>
                        <div className='flex items-center gap-1 text-sm'>
                          <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                          <span className='font-medium'>{offer.category_name || 'Auto'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant='outline' className='mb-3'>
                      {offer.contract_type || 'Standard'}
                    </Badge>
                  </div>

                  {/* Center - Features */}
                  <div className='md:w-1/3'>
                    <div className='text-sm font-semibold mb-2'>Garanties incluses</div>
                    <ul className='space-y-2'>
                      {(offer.features || []).slice(0, 4).map((feature, idx) => (
                        <li key={idx} className='flex items-start gap-2 text-sm'>
                          <Check className='w-4 h-4 text-accent mt-0.5 flex-shrink-0' />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className='mt-4 pt-4 border-t border-border'>
                      <p className='text-sm text-muted-foreground'>
                        Franchise:{' '}
                        <span className='font-medium text-foreground'>
                          {offer.deductible.toLocaleString()} FCFA
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right - Price & Actions */}
                  <div className='md:w-1/3 flex flex-col justify-between'>
                    <div className='text-center md:text-right mb-4'>
                      <div className='text-sm text-muted-foreground mb-1'>À partir de</div>
                      <div className='flex items-baseline justify-center md:justify-end gap-1'>
                        <span className='text-3xl font-bold text-primary'>
                          {priceView === 'yearly'
                            ? formatCurrency(offer.price_min || 0)
                            : formatCurrency((offer.price_min || 0) / 12)}
                        </span>
                        <span className='text-sm font-medium text-muted-foreground'>
                          {priceView === 'yearly' ? '/an' : '/mois'}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        {priceView === 'yearly'
                          ? `Soit ${formatCurrency((offer.price_min || 0) / 12)}/mois`
                          : `Soit ${formatCurrency(offer.price_min || 0)}/an`}
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Button
                        className='w-full bg-accent hover:bg-accent/90 text-accent-foreground'
                        onClick={() => openQuoteModal(offer)}
                      >
                        <FileText className='mr-2 w-4 h-4' />
                        Obtenir le devis
                      </Button>
                      <Button variant='outline' className='w-full'>
                        <Phone className='mr-2 w-4 h-4' />
                        Être rappeler
                      </Button>
                      <Button
                        variant={compareIds.includes(offer.id) ? 'default' : 'outline'}
                        className='w-full'
                        onClick={() => toggleCompare(offer.id)}
                        disabled={!compareIds.includes(offer.id) && compareIds.length >= 3}
                      >
                        <GitCompare className='mr-2 w-4 h-4' />
                        {compareIds.includes(offer.id) ? 'Retirer de la comparaison' : 'Comparer'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className='mt-4 flex justify-end'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleExpandedOffer(offer.id)}
                  >
                    {expandedOffers.includes(offer.id) ? 'Moins d\'infos' : 'En savoir plus sur cette offre'}
                  </Button>
                </div>

                {expandedOffers.includes(offer.id) && (
                  <div className='mt-4 space-y-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-inner'>
                    {/* Onglets garanties */}
                    <div className='flex flex-wrap gap-2'>
                      {(selectedGuarantees.length ? selectedGuarantees : offer.features || []).map((g) => (
                        <Badge
                          key={`${offer.id}-pill-${g}`}
                          variant='secondary'
                          className='text-xs rounded-full px-3 py-2 bg-white border-primary/30 text-foreground shadow-sm'
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>

                    {/* Tableaux */}
                    <div className='grid md:grid-cols-2 gap-4'>
                      <Card className='p-4 space-y-3 shadow-sm bg-white'>
                        <div className='font-semibold text-sm uppercase tracking-wide text-muted-foreground'>Tableau des garanties</div>
                        <div className='space-y-2'>
                          {[
                            'Bris de glace',
                            'Vol',
                            'Incendie',
                            'Vandalisme',
                            'Dommages tous accidents',
                            'Prêt du volant à novice',
                            'Indemnisation majorée',
                          ].map((label) => {
                            const has = (offer.features || []).some((f) => f.toLowerCase().includes(label.toLowerCase()))
                            return (
                              <div
                                key={`${offer.id}-gar-${label}`}
                                className='flex items-center justify-between gap-3 rounded-xl bg-[#eef4ff] px-3 py-2 text-sm'
                              >
                                <div className='flex items-center gap-2 text-foreground'>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <InfoIcon className='w-4 h-4 text-primary cursor-pointer' />
                                      </TooltipTrigger>
                                      <TooltipContent className='max-w-xs'>
                                        {`Garantie ${label}. Vérifiez plafonds et exclusions dans le devis.`}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <span>{label}</span>
                                </div>
                                {has ? (
                                  <Check className='w-5 h-5 text-green-600' />
                                ) : (
                                  <X className='w-5 h-5 text-destructive' />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </Card>

                      <Card className='p-4 space-y-3 shadow-sm bg-white'>
                        <div className='font-semibold text-sm uppercase tracking-wide text-muted-foreground'>Franchises et plafonds</div>
                        <div className='space-y-2 text-sm'>
                          {[
                            { label: 'Responsabilité civile' },
                            { label: 'Protection conducteur' },
                            { label: 'Protection juridique', cross: true },
                            { label: 'Assistance aux personnes' },
                            { label: 'Assistance au véhicule' },
                            { label: 'Véhicule de prêt' },
                          ].map((item) => (
                            <div
                              key={`${offer.id}-fr-${item.label}`}
                              className='flex items-center justify-between rounded-xl bg-[#eef4ff] px-3 py-2'
                            >
                              <div className='flex items-center gap-2 text-foreground'>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <InfoIcon className='w-4 h-4 text-primary cursor-pointer' />
                                    </TooltipTrigger>
                                    <TooltipContent className='max-w-xs'>
                                      {`Détail : ${item.label}. Voir conditions de l'assureur.`}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <span>{item.label}</span>
                              </div>
                              {item.cross ? (
                                <X className='w-5 h-5 text-destructive' />
                              ) : (
                                <Check className='w-5 h-5 text-green-600' />
                              )}
                            </div>
                          ))}
                          <div className='flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-dashed border-primary/30'>
                            <span className='flex items-center gap-2'>
                              Franchise
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <InfoIcon className='w-4 h-4 text-primary cursor-pointer' />
                                  </TooltipTrigger>
                                  <TooltipContent className='max-w-xs'>
                                    Montant restant à votre charge en cas de sinistre. Peut varier selon la garantie activée.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                            <span className='font-semibold text-primary'>
                              {offer.deductible ? `${offer.deductible.toLocaleString()} FCFA` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {filteredOffers.length === 0 && (
              <Card className='p-12 text-center'>
                <p className='text-muted-foreground mb-4'>
                  Aucune offre ne correspond à vos critères
                </p>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSelectedInsurers([])
                    setSelectedCoverage([])
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Compare bar */}
      {compareIds.length >= 2 && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-50'>
          <Card className='p-4 shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-2'>
                <GitCompare className='w-5 h-5 text-primary' />
                <span className='font-medium'>Comparer</span>
              </div>
              <div className='flex-1 flex flex-wrap gap-2'>
                {selectedOffers.map((o) => (
                  <span
                    key={o.id}
                    className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm'
                  >
                    <span className='text-lg leading-none'>
                      {o.logo_url ? (
                        <img src={o.logo_url} alt={o.insurer_name} className='w-5 h-5' />
                      ) : (
                        <Shield className='w-5 h-5' />
                      )}
                    </span>
                    {o.insurer_name}
                    <button
                      className='ml-1 hover:text-destructive'
                      onClick={() => toggleCompare(o.id)}
                      aria-label='Retirer'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </span>
                ))}
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={clearCompare}>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Vider
                </Button>
                <div className='flex items-center gap-2'>
                  <Button
                    variant={useEnhancedCompare ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setUseEnhancedCompare(true)}
                  >
                    Comparaison avancée
                  </Button>
                  <Button
                    variant={!useEnhancedCompare ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setUseEnhancedCompare(false)}
                  >
                    Tableau
                  </Button>
                </div>
                <Button size='sm' onClick={() => setOpenCompare(true)}>
                  Comparer
                </Button>
                </div>
              </div>
            </Card>

            {selectedGuarantees.length > 0 && (
              <Card className='p-4 border-primary/20 shadow-sm'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <Shield className='w-4 h-4 text-primary' />
                    <span className='font-semibold'>Garanties sélectionnées</span>
                  </div>
                  <Badge variant='outline'>{selectedGuarantees.length}</Badge>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {selectedGuarantees.map((g) => (
                    <Badge key={g} variant='secondary' className='text-xs'>
                      {g}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
      )}

      {/* Original Compare Modal */}
      {!useEnhancedCompare && (
       <OfferCompareModal
          open={openCompare}
          onOpenChange={setOpenCompare}
          offers={selectedOffers.map((o) => ({
            ...o,
            franchise: o.deductible.toString(),
            features: o.features && o.features.length > 0 ? o.features : selectedGuarantees,
          }))}
        />
      )}

      {/* Enhanced Compare Modal */}
      {useEnhancedCompare && (
        <EnhancedCompareModal
          open={openCompare}
          onOpenChange={setOpenCompare}
          offers={selectedOffers}
        />
      )}

      {/* Quote Options Modal */}
      {selectedOfferForQuote && (
        <QuoteOptionsModal
          open={quoteModalOpen}
          onOpenChange={setQuoteModalOpen}
          offer={selectedOfferForQuote}
        />
      )}

      {/* Save Search Modal */}
      <SaveSearchModal
        open={saveSearchModalOpen}
        onOpenChange={setSaveSearchModalOpen}
        onSave={saveCurrentSearch}
        searchName={searchName}
        onSearchNameChange={setSearchName}
        currentResults={filteredOffers.length}
      />

      {/* Live Chat */}
      <LiveChat />
    </div>
  )
}

export default Results
