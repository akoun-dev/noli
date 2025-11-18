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
  Filter,
  ChevronDown,
  ChevronUp,
  Save,
  Clock,
  Search,
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

const Results = () => {
  const [sortBy, setSortBy] = useState('price-asc')
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([])
  const [selectedCoverage, setSelectedCoverage] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000])
  const [maxFranchise, setMaxFranchise] = useState<number>(500000)
  const [minRating, setMinRating] = useState<number>(0)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Search save functionality
  type SavedSearch = {
    id: number
    name: string
    timestamp: string
    filters: {
      sortBy: string
      selectedInsurers: string[]
      selectedCoverage: string[]
      favoritesOnly: boolean
      priceRange: [number, number]
      maxFranchise: number
      minRating: number
    }
    resultsCount: number
  }
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false)
  const [searchName, setSearchName] = useState('')

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
        favoritesOnly,
        priceRange,
        maxFranchise,
        minRating,
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
    setFavoritesOnly(filters.favoritesOnly)
    setPriceRange(filters.priceRange)
    setMaxFranchise(filters.maxFranchise)
    setMinRating(filters.minRating)
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

  // Quote options modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedOfferForQuote, setSelectedOfferForQuote] = useState<Offer | null>(null)

  const insurers = useMemo(
    () => Array.from(new Set(offers.map((o) => o.insurer_name || 'Assureur'))),
    [offers]
  )
  const coverageTypes = useMemo(
    () => Array.from(new Set(offers.map((o) => o.contract_type || 'Standard'))),
    [offers]
  )

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
          if (
            selectedCoverage.length > 0 &&
            !selectedCoverage.includes(offer.contract_type || 'Standard')
          )
            return false
          if (favoritesOnly && !favorites.includes(offer.id)) return false

          // Advanced filters
          const monthlyPrice = (offer.price_min || 0) / 12
          if (monthlyPrice < priceRange[0] || monthlyPrice > priceRange[1]) return false
          if (offer.deductible > maxFranchise) return false

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
      favorites,
    ]
  )

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
                <Link to='/comparer'>
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
        <div className='mb-8 animate-fade-in'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-3xl md:text-4xl font-bold text-foreground mb-3'>
                {filteredOffers.length} offres disponibles
              </h1>
              <p className='text-muted-foreground'>
                Comparez et choisissez l'assurance qui vous convient le mieux
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSaveSearchModalOpen(true)}
                className='flex items-center gap-2'
              >
                <Save className='w-4 h-4' />
                Sauvegarder la recherche
              </Button>
            </div>
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className='mb-6'>
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
            <Card className='p-6 sticky top-24'>
              <div className='flex items-center gap-2 mb-6'>
                <SlidersHorizontal className='w-5 h-5 text-primary' />
                <h2 className='font-semibold text-lg'>Filtres</h2>
              </div>

              {/* Sort */}
              <div className='mb-6'>
                <Label className='text-sm font-medium mb-3 block'>Trier par</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='price-asc'>Prix croissant</SelectItem>
                    <SelectItem value='price-desc'>Prix décroissant</SelectItem>
                    <SelectItem value='rating'>Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Insurers Filter */}
              <div className='mb-6'>
                <Label className='text-sm font-medium mb-3 block'>Assureurs</Label>
                <div className='space-y-3'>
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

              {/* Favorites toggle */}
              <div className='mb-6'>
                <Label className='text-sm font-medium mb-3 block'>Affichage</Label>
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

              {/* Coverage Filter */}
              <div>
                <Label className='text-sm font-medium mb-3 block'>Type de contrat</Label>
                <div className='space-y-3'>
                  {coverageTypes.map((coverage) => (
                    <div key={coverage} className='flex items-center space-x-2'>
                      <Checkbox
                        id={coverage}
                        checked={selectedCoverage.includes(coverage)}
                        onCheckedChange={() => toggleCoverage(coverage)}
                      />
                      <Label htmlFor={coverage} className='text-sm cursor-pointer'>
                        {coverage}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className='pt-4 border-t border-border'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-between'
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <div className='flex items-center gap-2'>
                    <Filter className='w-4 h-4' />
                    Filtres avancés
                  </div>
                  {showAdvancedFilters ? (
                    <ChevronUp className='w-4 h-4' />
                  ) : (
                    <ChevronDown className='w-4 h-4' />
                  )}
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className='pt-4 space-y-6 border-t border-border mt-4'>
                  {/* Price Range */}
                  <div>
                    <Label className='text-sm font-medium mb-3 block'>
                      Fourchette de prix (€/mois)
                    </Label>
                    <div className='space-y-3'>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange([value[0], value[1]])}
                        max={300000}
                        min={0}
                        step={1000}
                        className='w-full'
                      />
                      <div className='flex justify-between text-sm text-muted-foreground'>
                        <span>€{priceRange[0].toLocaleString()}</span>
                        <span>€{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Franchise */}
                  <div>
                    <Label className='text-sm font-medium mb-3 block'>Franchise maximum</Label>
                    <Slider
                      value={[maxFranchise]}
                      onValueChange={(value) => setMaxFranchise(value[0])}
                      max={1000000}
                      min={0}
                      step={5000}
                      className='w-full'
                    />
                    <div className='text-sm text-muted-foreground mt-1'>
                      €{maxFranchise.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
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
                          €{offer.deductible.toLocaleString()}
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
                          €{((offer.price_min || 0) / 12).toLocaleString()}
                        </span>
                        <span className='text-sm font-medium text-muted-foreground'>/mois</span>
                      </div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        Soit €{(offer.price_min || 0).toLocaleString()}/an
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
