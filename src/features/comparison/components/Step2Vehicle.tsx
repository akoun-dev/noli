import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { vehicleInfoSchema, VehicleInfoFormData } from '@/lib/zod-schemas'
import { useCompare } from '@/features/comparison/services/ComparisonContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
            <SelectItem value='hybride'>Hybride</SelectItem>
            <SelectItem value='electrique'>Électrique</SelectItem>
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

      {/* Circulation Date */}
      <div className='space-y-2'>
        <Label htmlFor='circulationDate'>Date de mise en circulation *</Label>
        <Input
          id='circulationDate'
          type='date'
          value={watch('circulationDate') || ''}
          onChange={(e) => setValue('circulationDate', e.target.value)}
          className={cn(errors.circulationDate && 'border-destructive')}
        />
        {errors.circulationDate && (
          <p className='text-sm text-destructive'>{errors.circulationDate.message}</p>
        )}
      </div>

      {/* Values */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='newValue'>Valeur neuve (FCFA) *</Label>
          <Input
            id='newValue'
            value={watch('newValue') || ''}
            onChange={(e) => setValue('newValue', e.target.value)}
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
            onChange={(e) => setValue('currentValue', e.target.value)}
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
    </form>
  )
}

export default Step2Vehicle
