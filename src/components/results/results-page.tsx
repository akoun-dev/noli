"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import { ArrowLeft, Filter, ChevronDown, SearchX, RotateCcw } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import type { InsurerOffer } from "@/types"
import { MAX_COMPARE, BUDGET_MAX, BUDGET_STEP } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { OfferCard } from "./offer-card"
import { FiltersSidebar } from "./filters-sidebar"
import { ComparisonBar } from "./comparison-bar"
import { ComparisonModal } from "./comparison-modal"
import { SummaryPanels } from "./summary-panels"
import { CallbackModal } from "./callback-modal"
import { EmptyResultsState } from "./empty-results-state"

/* ══════════════════════════ MAIN ══════════════════════════ */

export function ResultsPage() {
  const {
    comparisonResults,
    sortBy,
    setSortBy,
    setView,
    userQuotes,
    setUserQuotes,
    personalInfo,
    vehicleInfo,
    coverageNeeds,
    offersToCompare,
    setOffersToCompare,
    comparisonModalOpen,
    setComparisonModalOpen,
  } = useAppStore()
  const { toast } = useToast()

  /* ── derived data ── */
  const [priceMode, setPriceMode] = useState<"annual" | "monthly">("annual")
  const effectiveBudgetMax = useMemo(() => {
    if (comparisonResults.length === 0) return BUDGET_MAX
    const maxPrice = Math.max(
      ...comparisonResults.map(o => (priceMode === "monthly" ? o.monthlyPrice : o.annualPrice) || 0)
    )
    return Math.max(
      BUDGET_MAX,
      Math.ceil(maxPrice / BUDGET_STEP) * BUDGET_STEP
    )
  }, [comparisonResults, priceMode])

  /* ── local filter state ── */
  const [uncheckedInsurers, setUncheckedInsurers] = useState<Set<string>>(
    new Set()
  )

  // Le filtre « Formules » démarre sur « Tous » : la comparaison renvoie
  // toutes les formules éligibles (le type choisi au formulaire n'est qu'un
  // critère de classement, pas un filtre strict).
  const [coverageFilter, setCoverageFilter] = useState<string>("all")
  const [budgetMax, setBudgetMax] = useState<number>(effectiveBudgetMax)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [callbackModalOpen, setCallbackModalOpen] = useState(false)
  const [selectedCallOffer, setSelectedCallOffer] = useState<InsurerOffer | null>(null)
  const [quoteLoading, setQuoteLoading] = useState<string | null>(null) // offer.id while loading

  // Sync budgetMax when data arrives
  useEffect(() => {
    setBudgetMax(effectiveBudgetMax)
  }, [effectiveBudgetMax])

  const uniqueInsurers = useMemo(() => {
    const names = [...new Set(comparisonResults.map(o => o.insurerName))]
    return names.sort()
  }, [comparisonResults])

  const effectiveChecked = useMemo(() => {
    const all = new Set(comparisonResults.map(o => o.insurerName))
    for (const name of uncheckedInsurers) {
      all.delete(name)
    }
    return all
  }, [comparisonResults, uncheckedInsurers])

  const toggleInsurer = useCallback((name: string) => {
    setUncheckedInsurers(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  const filteredAndSorted = useMemo(() => {
    let results = [...comparisonResults]

    if (coverageFilter !== "all") {
      results = results.filter(o => o.coverageType === coverageFilter)
    }

    results = results.filter(o => effectiveChecked.has(o.insurerName))

    // Filtre budget — utilise le prix correspondant au mode sélectionné
    if (budgetMax < effectiveBudgetMax) {
      results = results.filter(o => {
        const price =
          priceMode === "monthly" ? o.monthlyPrice : o.annualPrice
        if (typeof price !== "number" || isNaN(price)) return true
        return price <= budgetMax
      })
    }

    switch (sortBy) {
      case "price_asc":
        results.sort((a, b) => {
          const pa = priceMode === "monthly" ? a.monthlyPrice : a.annualPrice
          const pb = priceMode === "monthly" ? b.monthlyPrice : b.annualPrice
          return pa - pb
        })
        break
      case "price_desc":
        results.sort((a, b) => {
          const pa = priceMode === "monthly" ? a.monthlyPrice : a.annualPrice
          const pb = priceMode === "monthly" ? b.monthlyPrice : b.annualPrice
          return pb - pa
        })
        break
      case "rating_desc":
        results.sort((a, b) => b.insurerRating - a.insurerRating)
        break
      case "name_asc":
        results.sort((a, b) => a.name.localeCompare(b.name, "fr"))
        break
    }

    return results
  }, [
    comparisonResults,
    sortBy,
    coverageFilter,
    effectiveChecked,
    budgetMax,
    priceMode,
    effectiveBudgetMax,
  ])

  /* ── comparison handlers ── */
  const isOfferCompared = (offerId: string) =>
    offersToCompare.some(o => o.id === offerId)

  const handleToggleCompare = useCallback(
    (offer: InsurerOffer) => {
      const alreadyCompared = offersToCompare.some(o => o.id === offer.id)
      if (alreadyCompared) {
        setOffersToCompare(
          offersToCompare.filter(o => o.id !== offer.id)
        )
      } else {
        if (offersToCompare.length >= MAX_COMPARE) {
          toast({
            title: "Limite atteinte",
            description: `Vous pouvez comparer au maximum ${MAX_COMPARE} offres à la fois.`,
            variant: "destructive",
          })
          return
        }
        setOffersToCompare([...offersToCompare, offer])
      }
    },
    [offersToCompare, setOffersToCompare, toast]
  )

  const handleRemoveCompare = useCallback(
    (id: string) => {
      setOffersToCompare(offersToCompare.filter(o => o.id !== id))
    },
    [offersToCompare, setOffersToCompare]
  )

  const handleClearCompare = useCallback(() => {
    setOffersToCompare([])
  }, [setOffersToCompare])

  const handleOpenComparison = useCallback(() => {
    if (offersToCompare.length >= 2) {
      setComparisonModalOpen(true)
    }
  }, [offersToCompare, setComparisonModalOpen])

  /* ── handlers ── */
  const handleRequestQuote = async (offer: InsurerOffer) => {
    setQuoteLoading(offer.id)
    try {
      const res = await fetch("/api/user/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo,
          vehicleInfo,
          coverageNeeds,
          offer: {
            insurerName: offer.insurerName,
            insurerId: offer.insurerId,
            name: offer.name,
            coverageType: offer.coverageType,
            monthlyPrice: offer.monthlyPrice,
            annualPrice: offer.annualPrice,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la création du devis")
      }

      // Ajouter le devis localement pour le suivi
      const quote: import("@/types").QuoteRecord = {
        id: data.quote.id,
        reference: data.quote.reference,
        status: "pending",
        personalInfo: { ...personalInfo },
        vehicleInfo: { ...vehicleInfo },
        coverageNeeds: { ...coverageNeeds },
        proposedPrice: data.quote.estimatedPrice,
        finalPrice: null,
        insurerName: offer.insurerName,
        offerName: offer.name,
        createdAt: data.quote.createdAt,
      }
      setUserQuotes([quote, ...userQuotes])

      toast({
        title: "✅ Devis enregistré",
        description: `Votre devis ${data.quote.reference} a été créé. Un email de confirmation vous sera envoyé.`,
      })
    } catch (err) {
      console.error("[quote] Erreur:", err)
      toast({
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible de créer le devis. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setQuoteLoading(null)
    }
  }

  const handleRequestCall = (offer: InsurerOffer) => {
    setSelectedCallOffer(offer)
    setCallbackModalOpen(true)
  }

  const handleCallbackSubmit = async (phone: string, preferredTime: string) => {
    if (!selectedCallOffer) return

    const res = await fetch("/api/contact/request-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        preferredTime,
        insurerName: selectedCallOffer.insurerName,
        insurerId: selectedCallOffer.insurerId,
        personalInfo,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Erreur lors de la demande de rappel")
    }

    setCallbackModalOpen(false)
    setSelectedCallOffer(null)

    toast({
      title: "📞 Demande de rappel envoyée",
      description: `Un conseiller ${selectedCallOffer.insurerName} vous contactera${preferredTime === "matin" ? " dans la matinée" : preferredTime === "apres-midi" ? " dans l'après-midi" : " en soirée"}.`,
    })
  }

  const handleToggleAllInsurers = useCallback(() => {
    if (uncheckedInsurers.size === 0) {
      setUncheckedInsurers(new Set(uniqueInsurers))
    } else {
      setUncheckedInsurers(new Set())
    }
  }, [uncheckedInsurers, uniqueInsurers])

  const resetFilters = () => {
    setCoverageFilter("all")
    setUncheckedInsurers(new Set())
    setBudgetMax(effectiveBudgetMax)
    setSortBy("price_asc")
  }

  const activeFilterCount = [
    coverageFilter !== "all",
    uncheckedInsurers.size > 0,
    budgetMax < effectiveBudgetMax,
  ].filter(Boolean).length

  /* ── Callback modal ── */
  const callbackModal = (
    <CallbackModal
      open={callbackModalOpen}
      onClose={() => {
        setCallbackModalOpen(false)
        setSelectedCallOffer(null)
      }}
      offer={selectedCallOffer}
      onSubmit={handleCallbackSubmit}
    />
  )

  /* ── empty state (no comparison results at all) ── */
  if (comparisonResults.length === 0) {
    return <EmptyResultsState onGoBack={() => setView("compare")} />
  }

  /* ── main render ── */
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* ── Comparison Bar (sticky) ── */}
      {offersToCompare.length > 0 && (
        <ComparisonBar
          offers={offersToCompare}
          onRemove={handleRemoveCompare}
          onClear={handleClearCompare}
          onOpen={handleOpenComparison}
        />
      )}

      {/* ── Scrolling content below ── */}
      <div className="flex-1 overflow-y-auto">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* ── Top Bar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setView("compare")}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              <span className="hidden sm:inline">
                Modifier mes choix
              </span>
              <span className="sm:hidden">Retour</span>
            </Button>

            {/* UI-C01 : région live pour annoncer le nombre de résultats */}
            <h1
              aria-live="polite"
              className="text-xl sm:text-2xl font-bold text-foreground flex-1"
            >
              {filteredAndSorted.length} offre
              {filteredAndSorted.length !== 1 ? "s" : ""} trouvée
              {filteredAndSorted.length !== 1 ? "s" : ""}
            </h1>

            {/* Price mode toggle */}
            <div className="flex items-center bg-muted/30 rounded-full p-0.5 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setPriceMode("annual")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  priceMode === "annual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Par an
              </button>
              <button
                onClick={() => setPriceMode("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  priceMode === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Par mois
              </button>
            </div>
          </div>

          {/* ── Mobile Filter Toggle ── */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl border-border"
              onClick={() =>
                setMobileFiltersOpen(!mobileFiltersOpen)
              }
            >
              <div className="flex items-center gap-2">
                <Filter className="size-4" />
                <span className="font-medium">Filtres</span>
                {activeFilterCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs min-w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${
                  mobileFiltersOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {/* ── Mobile Filters (collapsible) ── */}
          <div
            className={`overflow-hidden lg:hidden mb-6 transition-all duration-250 ease-in-out ${
              mobileFiltersOpen
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <FiltersSidebar
              coverageFilter={coverageFilter}
              setCoverageFilter={setCoverageFilter}
              uncheckedInsurers={uncheckedInsurers}
              toggleInsurer={toggleInsurer}
              onToggleAllInsurers={handleToggleAllInsurers}
              uniqueInsurers={uniqueInsurers}
              budgetMax={budgetMax}
              setBudgetMax={setBudgetMax}
              effectiveBudgetMax={effectiveBudgetMax}
              priceMode={priceMode}
              onReset={resetFilters}
              totalOffers={comparisonResults.length}
            />
          </div>

          {/* ── Summary Panels ── */}
          <SummaryPanels offers={filteredAndSorted} />

          {/* ── Two-column layout ── */}
          <div className="flex gap-6 items-start">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <FiltersSidebar
                coverageFilter={coverageFilter}
                setCoverageFilter={setCoverageFilter}
                uncheckedInsurers={uncheckedInsurers}
                toggleInsurer={toggleInsurer}
                onToggleAllInsurers={handleToggleAllInsurers}
                uniqueInsurers={uniqueInsurers}
                budgetMax={budgetMax}
                setBudgetMax={setBudgetMax}
                effectiveBudgetMax={effectiveBudgetMax}
                priceMode={priceMode}
                onReset={resetFilters}
                totalOffers={comparisonResults.length}
              />
            </div>

            {/* Liste des offres — <section> (pas <main>, déjà présent dans le
                layout) ; l'annonce live est portée par le compteur (h1) ci-dessus,
                pas par la liste entière (évite de tout re-annoncer à chaque filtre). */}
            <section className="flex-1 min-w-0 space-y-4">
              {filteredAndSorted.length > 0 ? (
                filteredAndSorted.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onRequestQuote={handleRequestQuote}
                    onRequestCall={handleRequestCall}
                    onAddToCompare={handleToggleCompare}
                    isCompared={isOfferCompared(offer.id)}
                    priceMode={priceMode}
                    quoteLoading={quoteLoading}
                  />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="rounded-full bg-muted/40 p-6 mb-4 inline-block">
                    <SearchX className="size-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune offre ne correspond à vos
                    critères
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Essayez d&apos;élargir vos filtres ou de
                    modifier le budget.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={resetFilters}
                  >
                    <RotateCcw className="size-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </section>
          </div>

          {/* Comparison modal */}
          <ComparisonModal
            offers={offersToCompare}
            open={comparisonModalOpen}
            onClose={() => setComparisonModalOpen(false)}
          />

          {/* Callback modal */}
          {callbackModal}
        </section>
      </div>
    </div>
  )
}
