import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Check,
  Minus,
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  FileText,
  Phone,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { cn } from '@/lib/utils'

interface EnhancedOffer {
  id: number | string
  insurer: string
  logo?: string
  monthlyPrice: number
  annualPrice: number
  franchise: number
  franchiseText: string
  coverageType: string
  coverageLevel: number
  rating: number
  reviews: number
  features: string[]
  specificGuarantees: Record<string, boolean>
  recommended?: boolean
  bestPrice?: boolean
}

interface EnhancedCompareModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  offers: EnhancedOffer[]
}

const EnhancedCompareModal = ({ open, onOpenChange, offers }: EnhancedCompareModalProps) => {
  // Calculate statistics for comparison
  const minPrice = Math.min(...offers.map((o) => o.monthlyPrice))
  const maxPrice = Math.max(...offers.map((o) => o.monthlyPrice))
  const avgPrice = offers.reduce((sum, o) => sum + o.monthlyPrice, 0) / offers.length

  // Calculate savings
  const calculateSavings = (price: number) => {
    const savings = maxPrice - price
    const percentage = ((savings / maxPrice) * 100).toFixed(1)
    return { savings, percentage }
  }

  // Calculate recommendation score based on multiple factors
  const calculateRecommendationScore = (offer: EnhancedOffer) => {
    const priceScore = ((maxPrice - offer.monthlyPrice) / maxPrice) * 40 // 40% weight
    const ratingScore = (offer.rating / 5) * 30 // 30% weight
    const coverageScore = (offer.coverageLevel / 3) * 20 // 20% weight
    const franchiseScore = ((150000 - offer.franchise) / 150000) * 10 // 10% weight

    return Math.round(priceScore + ratingScore + coverageScore + franchiseScore)
  }

  // Prepare data for price comparison chart
  const priceChartData = offers.map((offer) => ({
    name: offer.insurer,
    price: offer.monthlyPrice,
    rating: offer.rating * 2000, // Scale rating for visibility
  }))

  // Prepare data for radar chart (features comparison)
  const guaranteeFeatures = [
    'assistance24h',
    'vehicleReplacement',
    'driverProtection',
    'glassBreakage',
    'legalProtection',
    'newVehicleValue',
    'internationalAssistance',
  ]

  const radarData = guaranteeFeatures.map((feature) => ({
    feature: feature.replace(/([A-Z])/g, ' $1').trim(),
    ...offers.reduce(
      (acc, offer) => ({
        ...acc,
        [offer.insurer]: offer.specificGuarantees && offer.specificGuarantees[feature] ? 1 : 0,
      }),
      {}
    ),
  }))

  // Get all unique features
  const allFeatures = Array.from(new Set(offers.flatMap((o) => o.features)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-7xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold'>Comparaison détaillée des offres</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <TrendingDown className='w-5 h-5 text-green-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Meilleur prix</p>
                    <p className='font-bold text-lg'>{minPrice.toLocaleString()} FCFA/mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <Star className='w-5 h-5 text-yellow-500' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Meilleure note</p>
                    <p className='font-bold text-lg'>
                      {Math.max(...offers.map((o) => o.rating))}/5
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center gap-2'>
                  <DollarSign className='w-5 h-5 text-blue-600' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Économie max</p>
                    <p className='font-bold text-lg'>
                      {(maxPrice - minPrice).toLocaleString()} FCFA/an
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
                Comparaison des prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={priceChartData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'price'
                        ? `${Number(value).toLocaleString()} FCFA`
                        : `${Number(value) / 2000}/5`,
                      name === 'price' ? 'Prix mensuel' : 'Note',
                    ]}
                  />
                  <Bar dataKey='price' fill='#3b82f6' name='Prix' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Offers Comparison Table */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {offers.map((offer) => {
              const monthlyPrice = offer.monthlyPrice || 0
              const savings = calculateSavings(monthlyPrice)
              const recommendationScore = calculateRecommendationScore(offer)

              return (
                <Card
                  key={offer.id}
                  className={cn(
                    'relative',
                    offer.recommended && 'border-2 border-primary/50',
                    offer.bestPrice && 'border-2 border-green-500/50'
                  )}
                >
                  {offer.recommended && (
                    <Badge className='absolute -top-2 left-4 bg-primary text-primary-foreground'>
                      Recommandé
                    </Badge>
                  )}
                  {offer.bestPrice && (
                    <Badge className='absolute -top-2 right-4 bg-green-600 text-white'>
                      Meilleur prix
                    </Badge>
                  )}

                  <CardHeader className='text-center pb-4'>
                    <div className='text-4xl mb-2'>{offer.logo}</div>
                    <CardTitle className='text-lg'>{offer.insurer}</CardTitle>
                    <Badge variant='outline' className='mt-1'>
                      {offer.coverageType}
                    </Badge>
                  </CardHeader>

                  <CardContent className='space-y-4'>
                    {/* Price and Rating */}
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-primary'>
                        {monthlyPrice.toLocaleString()} FCFA
                        <span className='text-sm font-normal text-muted-foreground'>/mois</span>
                      </div>
                      <div className='flex items-center justify-center gap-1 mt-1'>
                        <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                        <span className='font-medium'>{offer.rating}</span>
                        <span className='text-sm text-muted-foreground'>({offer.reviews})</span>
                      </div>
                    </div>

                    {/* Savings */}
                    {savings.savings > 0 && (
                      <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                        <div className='flex items-center gap-2 text-green-700'>
                          <TrendingDown className='w-4 h-4' />
                          <span className='font-medium'>
                            Économisez {savings.savings.toLocaleString()} FCFA/an (
                            {savings.percentage}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Recommendation Score */}
                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium'>Score de recommandation</span>
                        <span className='text-sm font-bold text-primary'>
                          {recommendationScore}/100
                        </span>
                      </div>
                      <Progress value={recommendationScore} className='h-2' />
                    </div>

                    {/* Key Features */}
                    <div>
                      <h4 className='font-medium mb-2'>Garanties principales</h4>
                      <div className='space-y-1'>
                        {offer.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className='flex items-center gap-2 text-sm'>
                            <Check className='w-3 h-3 text-green-600 flex-shrink-0' />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {offer.features.length > 3 && (
                          <div className='text-xs text-muted-foreground'>
                            +{offer.features.length - 3} autres garanties
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Franchise */}
                    <div className='text-sm'>
                      <span className='text-muted-foreground'>Franchise: </span>
                      <span className='font-medium'>{offer.franchiseText}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className='space-y-2 pt-2'>
                      <Button className='w-full bg-primary hover:bg-primary/90'>
                        <FileText className='mr-2 w-4 h-4' />
                        Obtenir le devis
                      </Button>
                      <Button variant='outline' className='w-full'>
                        <Phone className='mr-2 w-4 h-4' />
                        Être rappeler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Detailed Features Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                Comparaison détaillée des garanties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {allFeatures.map((feature) => {
                  const hasVariation = offers.some((o) => !o.features.includes(feature))
                  const allHave = offers.every((o) => o.features.includes(feature))

                  return (
                    <div
                      key={feature}
                      className={cn(
                        'p-3 rounded-lg border',
                        hasVariation ? 'bg-accent/5 border-accent/20' : 'bg-muted/20'
                      )}
                    >
                      <div className='flex items-center justify-between'>
                        <span className={cn('font-medium', allHave && 'text-green-700')}>
                          {feature}
                          {allHave && <Check className='inline-block w-4 h-4 ml-1' />}
                        </span>
                        <div className='flex gap-4'>
                          {offers.map((offer) => (
                            <div key={offer.id} className='flex items-center gap-2'>
                              {offer.features.includes(feature) ? (
                                <Check className='w-4 h-4 text-green-600' />
                              ) : (
                                <Minus className='w-4 h-4 text-muted-foreground' />
                              )}
                              <span className='text-sm text-muted-foreground'>{offer.insurer}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedCompareModal
