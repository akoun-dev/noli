import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleInfoSchema, VehicleInfoFormData } from '@/lib/zod-schemas'
import { useCompare } from '@/features/comparison/services/ComparisonContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { YearInput } from '@/components/ui/year-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step2VehicleProps {
  onNext: () => void
  onBack: () => void
}

const Step2Vehicle: React.FC<Step2VehicleProps> = ({ onNext, onBack }: Step2VehicleProps) => {
  const { formData, updateVehicleInfo } = useCompare()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VehicleInfoFormData>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: formData.vehicleInfo,
  })

  const onSubmit = (data: VehicleInfoFormData) => {
    updateVehicleInfo(data)
    onNext()
  }

  const seatOptions = ['2', '4', '5', '7', '9+']

  const formatAmount = (value: string) => {
    const digits = value.replace(/[^\d]/g, '')
    if (!digits) return ''
    return new Intl.NumberFormat('fr-FR').format(Number(digits))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 max-w-3xl mx-auto'>
      <div className='text-center space-y-2'>
        <h2 className='text-2xl md:text-3xl font-bold'>Informations véhicule</h2>
        <p className='text-muted-foreground'>
          Renseignez les caractéristiques de votre véhicule pour obtenir un devis personnalisé
        </p>
      </div>

      {/* Fuel */}
      <div className='space-y-2'>
        <Label htmlFor='fuel'>Carburant *</Label>
        <Select value={watch('fuel') || ''} onValueChange={(v) => setValue('fuel', v)}>
          <SelectTrigger className={cn(errors.fuel && 'border-destructive')}>
            <SelectValue placeholder='Sélectionner le type de carburant' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='essence'>Essence</SelectItem>
            <SelectItem value='diesel'>Diesel</SelectItem>
          </SelectContent>
        </Select>
        {errors.fuel && <p className='text-sm text-destructive'>{errors.fuel.message}</p>}
      </div>

      {/* Fiscal Power and Seats */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='fiscalPower'>Puissance fiscale *</Label>
          <Select value={watch('fiscalPower') || ''} onValueChange={(v) => setValue('fiscalPower', v)}>
            <SelectTrigger className={cn(errors.fiscalPower && 'border-destructive')}>
              <SelectValue placeholder='Sélectionner' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1'>1 CV</SelectItem>
              <SelectItem value='2'>2 CV</SelectItem>
              <SelectItem value='3'>3 CV</SelectItem>
              <SelectItem value='4'>4 CV</SelectItem>
              <SelectItem value='5'>5 CV</SelectItem>
              <SelectItem value='6'>6 CV</SelectItem>
              <SelectItem value='7'>7 CV</SelectItem>
              <SelectItem value='8'>8 CV</SelectItem>
              <SelectItem value='9'>9 CV</SelectItem>
              <SelectItem value='10'>10 CV</SelectItem>
              <SelectItem value='11'>11 CV</SelectItem>
              <SelectItem value='12'>12 CV</SelectItem>
              <SelectItem value='13'>13 CV</SelectItem>
              <SelectItem value='14'>14 CV</SelectItem>
            </SelectContent>
          </Select>
          {errors.fiscalPower && (
            <p className='text-sm text-destructive'>{errors.fiscalPower.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='seats'>Nombre de places *</Label>
          <Select value={watch('seats') || ''} onValueChange={(v) => setValue('seats', v)}>
            <SelectTrigger className={cn(errors.seats && 'border-destructive')}>
              <SelectValue placeholder='Sélectionner' />
            </SelectTrigger>
            <SelectContent>
              {seatOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.seats && <p className='text-sm text-destructive'>{errors.seats.message}</p>}
        </div>
      </div>

      {/* Circulation Year */}
      <div className='space-y-2'>
        <YearInput
          id='circulationYear'
          label='Année de mise en circulation *'
          value={watch('circulationYear') || ''}
          onChange={(value) => setValue('circulationYear', value)}
          error={errors.circulationYear?.message}
          currentYear={2025}
          maxYearsBack={30}
          minYearsBack={2}
          placeholder="Sélectionner l'année de première mise en circulation"
          className={cn(errors.circulationYear && 'border-destructive')}
        />
      </div>

      {/* Values */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='newValue'>Valeur neuve (FCFA) *</Label>
          <Input
            id='newValue'
            value={watch('newValue') || ''}
            onChange={(e) => setValue('newValue', formatAmount(e.target.value), { shouldValidate: true })}
            placeholder='12 000 000'
            className={cn(errors.newValue && 'border-destructive')}
          />
          {errors.newValue && <p className='text-sm text-destructive'>{errors.newValue.message}</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='currentValue'>Valeur actuelle (FCFA) *</Label>
          <Input
            id='currentValue'
            value={watch('currentValue') || ''}
            onChange={(e) => setValue('currentValue', formatAmount(e.target.value), { shouldValidate: true })}
            placeholder='6 500 000'
            className={cn(errors.currentValue && 'border-destructive')}
          />
          {errors.currentValue && (
            <p className='text-sm text-destructive'>{errors.currentValue.message}</p>
          )}
        </div>
      </div>

      {/* Vehicle Usage */}
      <div className='space-y-2'>
        <Label htmlFor='vehicleUsage'>Usage du véhicule *</Label>
        <Select value={watch('vehicleUsage') || ''} onValueChange={(v) => setValue('vehicleUsage', v as any)}>
          <SelectTrigger className={cn(errors.vehicleUsage && 'border-destructive')}>
            <SelectValue placeholder='Sélectionner' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='personnel'>Personnel</SelectItem>
            <SelectItem value='professionnel'>Professionnel</SelectItem>
            <SelectItem value='taxi'>Taxi/VTC</SelectItem>
            <SelectItem value='autre'>Autre</SelectItem>
          </SelectContent>
        </Select>
        {errors.vehicleUsage && (
          <p className='text-sm text-destructive'>{errors.vehicleUsage.message}</p>
        )}
      </div>
            {/* Action Buttons */}
      <div className='flex gap-4'>
        <Button type='button' variant='outline' size='lg' onClick={onBack} className='flex-1'>
          <ArrowLeft className='mr-2 w-5 h-5' />
          Précédent
        </Button>
        <Button
          type='submit'
          size='lg'
          className='flex-1 bg-accent hover:bg-accent/90 text-accent-foreground group'
        >
          Étape suivante
          <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
        </Button>
      </div>

      <div className='space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed'>
        <p>Faire un devis d’assurance auto en ligne avec NOLI, c’est un peu comme choisir le bon trajet pour éviter les embouteillages : simple, rapide, efficace… et ça vous fait gagner du temps et de l’argent.</p>
        <p>Chez NOLI, on vous aide à comparer les assurances auto disponibles en Côte d’Ivoire pour trouver la formule qui protège vraiment votre véhicule, sans exploser votre budget. Que vous rouliez dans une petite citadine, un SUV familial, un taxi ou un véhicule de société, vous pouvez enfin voir clair dans les offres du marché.</p>
        <p>Et comme NOLI fonctionne en toute transparence :</p>
        <ul className='list-disc space-y-1 pl-5 marker:text-primary'>
          <li>➡️ NOLI est gratuit pour ses utilisateurs il n’y a aucun coup cachés.</li>
          <li>➡️ Si vous sélectionnez un devis, c’est l’assureur qui vous rappellera directement pour finaliser le contrat.</li>
        </ul>
        <p className='font-semibold'>NOLI simplifie, vous décidez.</p>
      </div>


    </form>
  )
}

export default Step2Vehicle
