"use client"

import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { ArrowLeft, Filter, ChevronDown, SearchX, RotateCcw, Check, Copy, UserPlus } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import type { InsurerOffer } from "@/types"
import { MAX_COMPARE, BUDGET_MAX, BUDGET_STEP } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { fetchWithTimeout, networkErrorMessage } from "@/lib/fetch-with-timeout"
import { formatFCFA } from "@/lib/utils"
import { OfferCard } from "./offer-card"
import { FiltersSidebar } from "./filters-sidebar"
import { ComparisonBar } from "./comparison-bar"
import { ComparisonModal } from "./comparison-modal"
import { SummaryPanels } from "./summary-panels"
import { CallbackModal } from "./callback-modal"
import { EmptyResultsState } from "./empty-results-state"

// Type de contrat choisi au formulaire → libellé de formule affiché sur les
// offres (aligné sur contractTypeLabel de compare-service.ts).
const CONTRACT_TYPE_TO_COVERAGE: Record<string, string> = {
  basic: "Tiers",
  third_party_plus: "Tiers+",
  all_risks: "Tous Risques",
  premium: "Premium",
  premium_plus: "Premium+",
}

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
    user,
    setUserTab,
  } = useAppStore()
  const { toast } = useToast()

  /* ── LOT D : panneau de confirmation de devis (remplace le toast éphémère) ── */
  type ConfirmedQuote = {
    reference: string
    estimatedPrice: number | null
    insurerName: string
    offerName: string | null
    email: string
  }
  const [confirmedQuote, setConfirmedQuote] = useState<ConfirmedQuote | null>(null)
  const [refCopied, setRefCopied] = useState(false)

  const copyReference = useCallback(async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference)
      setRefCopied(true)
      setTimeout(() => setRefCopied(false), 2000)
    } catch {
      /* presse-papiers indisponible : l'utilisateur peut copier manuellement */
    }
  }, [])

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

  // Le filtre « Formules » est pré-sélectionné sur la formule choisie au
  // formulaire (auto-sélection), puis reste librement modifiable par
  // l'utilisateur — y compris pour revenir à « Tous ».
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

  // Auto-sélection de la formule choisie au formulaire, une seule fois quand
  // les résultats arrivent. Ne s'applique que si au moins une offre correspond
  // à cette formule (sinon on garde « Tous » pour ne pas afficher 0 offre).
  const formulaAutoSelected = useRef(false)
  useEffect(() => {
    if (formulaAutoSelected.current) return
    if (comparisonResults.length === 0) return
    formulaAutoSelected.current = true
    const wanted = CONTRACT_TYPE_TO_COVERAGE[coverageNeeds.contractType || ""]
    if (wanted && comparisonResults.some((o) => o.coverageType === wanted)) {
      setCoverageFilter(wanted)
    }
  }, [comparisonResults, coverageNeeds.contractType])

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
      // LOT E : timeout 12 s pour éviter une attente muette si le backend ne répond pas.
      const res = await fetchWithTimeout("/api/user/quotes", {
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
            contractDuration: offer.contractDuration,
            description: offer.description,
            features: offer.features,
            deductible: offer.deductible,
            maxCoverage: offer.maxCoverage,
            conditions: offer.conditions,
            guaranteeDescriptions: offer.guaranteeDescriptions,
            matchedGuarantees: offer.matchedGuarantees,
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

      // LOT D : confirmation persistante à l'écran (plus un simple toast).
      setRefCopied(false)
      setConfirmedQuote({
        reference: data.quote.reference,
        estimatedPrice: data.quote.estimatedPrice ?? null,
        insurerName: offer.insurerName,
        offerName: offer.name,
        email: personalInfo.email,
      })
    } catch (err) {
      console.error("[quote] Erreur:", err)
      toast({
        title: "Erreur",
        description: networkErrorMessage(err),
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
    <div className="flex flex-col">
      {/* ── Comparison Bar (sticky) ── */}
      {offersToCompare.length > 0 && (
        <ComparisonBar
          offers={offersToCompare}
          onRemove={handleRemoveCompare}
          onClear={handleClearCompare}
          onOpen={handleOpenComparison}
        />
      )}

      {/* ── Content — défilement géré par la page (un seul axe de scroll) ── */}
      <div>
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

            {/* Main Content — le compteur (h1 aria-live ci-dessus) annonce les
                mises à jour ; la liste elle-même n'est pas une région live pour
                éviter de re-annoncer tout le DOM à chaque filtre. La <section>
                (pas <main>, déjà présent dans le layout) porte le libellé. */}
            <section
              aria-label="Offres d'assurance"
              className="flex-1 min-w-0 space-y-4"
            >
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

          {/* ── LOT D : confirmation de devis persistante ── */}
          <Dialog
            open={!!confirmedQuote}
            onOpenChange={(open) => { if (!open) setConfirmedQuote(null) }}
          >
            <DialogContent className="sm:max-w-md">
              {confirmedQuote && (
                <>
                  <DialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center">Devis enregistré</DialogTitle>
                    <DialogDescription className="text-center">
                      Conservez votre référence. Un email de confirmation vous sera envoyé.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Référence copiable */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Votre référence</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold text-foreground truncate">
                        {confirmedQuote.reference}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-full"
                        onClick={() => copyReference(confirmedQuote.reference)}
                        aria-label="Copier la référence du devis"
                      >
                        {refCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Récapitulatif */}
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Assureur</dt>
                      <dd className="font-medium text-foreground text-right">{confirmedQuote.insurerName}</dd>
                    </div>
                    {confirmedQuote.offerName && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Formule</dt>
                        <dd className="font-medium text-foreground text-right">{confirmedQuote.offerName}</dd>
                      </div>
                    )}
                    {confirmedQuote.estimatedPrice != null && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Estimation mensuelle</dt>
                        <dd className="font-semibold text-primary text-right">
                          {formatFCFA(confirmedQuote.estimatedPrice)}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* CTA selon l'état de connexion */}
                  <div className="flex flex-col gap-2 pt-1">
                    {user.isLoggedIn ? (
                      <Button
                        className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => { setConfirmedQuote(null); setUserTab("quotes"); setView("user-dashboard") }}
                      >
                        Voir mes devis
                      </Button>
                    ) : (
                      <Button
                        className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => { setConfirmedQuote(null); setView("register") }}
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Créer mon compte pour suivre ce devis
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full rounded-full"
                      onClick={() => setConfirmedQuote(null)}
                    >
                      Continuer à comparer
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </div>
  )
}
