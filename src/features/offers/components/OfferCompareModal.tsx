import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, Minus, Shield, X } from 'lucide-react'

export interface SimpleOffer {
  id: number | string
  insurer_name?: string
  insurer?: string
  logo_url?: string
  logo?: string
  monthlyPrice?: number
  price_min?: number
  deductible?: number
  franchise?: string
  contract_type?: string
  coverageType?: string
  features?: string[] // guarantees list
}

interface OfferCompareModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  offers: SimpleOffer[]
}

const OfferCompareModal = ({ open, onOpenChange, offers }: OfferCompareModalProps) => {
  const guaranteeSet = new Set<string>()
  offers.forEach((o) => (o.features || []).forEach((g) => guaranteeSet.add(g)))
  const guarantees = Array.from(guaranteeSet).sort()

  const isDifferent = (g: string) => {
    const values = offers.map((o) => (o.features || []).includes(g))
    return values.some((v) => v !== values[0])
  }

  const hasGuarantees = guarantees.length > 0
  const gridTemplateColumns = `1.2fr repeat(${offers.length}, 1fr)`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl'>
        <DialogHeader>
          <DialogTitle>Comparer les garanties</DialogTitle>
        </DialogHeader>

        <div className='overflow-x-auto'>
          <div
            className='grid gap-0 rounded-2xl border border-border/60 overflow-hidden shadow-sm'
            style={{ gridTemplateColumns }}
          >
            {/* Header */}
            <div className='p-4 bg-muted/40 font-semibold'>Critères</div>
            {offers.map((o) => (
              <div key={o.id} className='p-4 bg-muted/10 text-center space-y-1'>
                <div className='flex justify-center'>
                  {o.logo_url ? (
                    <img src={o.logo_url} alt={o.insurer_name || o.insurer} className='w-10 h-10 object-contain' />
                  ) : (
                    o.logo || <Shield className='w-10 h-10 text-primary' />
                  )}
                </div>
                <div className='font-semibold text-foreground leading-tight'>
                  {o.insurer_name || o.insurer}
                </div>
                <Badge variant='outline' className='mt-1 text-xs'>
                  {o.contract_type || o.coverageType || 'Formule'}
                </Badge>
              </div>
            ))}

            {/* Prix mensuel */}
            <div className='p-3 border-t font-medium'>Prix mensuel</div>
            {offers.map((o) => {
              const monthlyPrice = o.monthlyPrice || (o.price_min ? o.price_min / 12 : undefined)
              return (
                <div key={`${o.id}-price`} className='p-3 border-t text-center font-semibold text-primary'>
                  {monthlyPrice ? `${monthlyPrice.toLocaleString()} FCFA` : 'N/A'}
                </div>
              )
            })}

            {/* Franchise */}
            <div className='p-3 border-t font-medium'>Franchise</div>
            {offers.map((o) => (
              <div key={`${o.id}-franchise`} className='p-3 border-t text-center'>
                {o.franchise || (o.deductible ? `${o.deductible.toLocaleString()} FCFA` : 'N/A')}
              </div>
            ))}

            {/* Garanties */}
            {hasGuarantees ? (
              guarantees.map((g) => (
                <React.Fragment key={g}>
                  <div className={`p-3 border-t font-medium ${isDifferent(g) ? 'bg-accent/5' : ''}`}>{g}</div>
                  {offers.map((o) => (
                    <div
                      key={`${o.id}-${g}`}
                      className={`p-3 border-t text-center ${isDifferent(g) ? 'bg-accent/5' : ''}`}
                    >
                      {(o.features || []).includes(g) ? (
                        <Check className='inline-block w-5 h-5 text-green-600' />
                      ) : (
                        <X className='inline-block w-5 h-5 text-destructive' />
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <>
                <div className='p-3 border-t font-medium'>Garanties</div>
                <div className='p-3 border-t col-span-[2]' style={{ gridColumn: `span ${offers.length}` }}>
                  <div className='text-center text-sm text-muted-foreground'>Aucune garantie fournie pour ces offres.</div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OfferCompareModal
