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

  const defaultValues: VehicleInfoFormData = {
    fuel: formData.vehicleInfo.fuel || 'essence',
    fiscalPower: formData.vehicleInfo.fiscalPower || '1',
    seats: formData.vehicleInfo.seats || '4',
    circulationYear: formData.vehicleInfo.circulationYear || '2025',
    newValue: formData.vehicleInfo.newValue || '',
    currentValue: formData.vehicleInfo.currentValue || '',
    vehicleUsage: (formData.vehicleInfo.vehicleUsage || 'personnel') as VehicleInfoFormData['vehicleUsage'],
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VehicleInfoFormData>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues,
  })

  const onSubmit = (data: VehicleInfoFormData) => {
    updateVehicleInfo(data)
    onNext()
  }

  const seatOptions = ['3', '4', '5', '6', '7', '8', '+8']

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

      {/* Info text en bas */}
      <div className='space-y-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-5 text-sm leading-relaxed'>
        <p className='font-semibold text-green-900 dark:text-green-100'>⚙️ Comment fonctionne une simulation de devis auto NOLI ?</p>
        <p className='text-green-800 dark:text-green-200'>
          Très simple. La simulation se fait en deux étapes :
        </p>

        <div className='space-y-2'>
          <p className='font-medium text-green-900 dark:text-green-100'>1️⃣ Les informations sur votre véhicule</p>
          <ul className='list-disc space-y-1 pl-5 marker:text-green-600 dark:marker:text-green-400'>
            <li className='text-green-800 dark:text-green-200'>Nombre de places</li>
            <li className='text-green-800 dark:text-green-200'>Année de mise en circulation</li>
            <li className='text-green-800 dark:text-green-200'>Type de carburant</li>
            <li className='text-green-800 dark:text-green-200'>Valeur estimée du véhicule</li>
          </ul>
        </div>

        <div className='space-y-2'>
          <p className='font-medium text-green-900 dark:text-green-100'>2️⃣ Vos informations de conducteur</p>
          <ul className='list-disc space-y-1 pl-5 marker:text-green-600 dark:marker:text-green-400'>
            <li className='text-green-800 dark:text-green-200'>Bonus / malus éventuel</li>
            <li className='text-green-800 dark:text-green-200'>Usage du véhicule (perso, pro, mixte)</li>
          </ul>
        </div>

        <p className='text-green-800 dark:text-green-200 mt-2'>
          Le simulateur analyse ces éléments et vous propose des offres adaptées.
        </p>
        <p className='text-green-800 dark:text-green-200'>
          En quelques clics, vous évaluez ce qui correspond vraiment à votre usage : trajets quotidiens, longues distances, transport professionnel, ou simple véhicule secondaire.
        </p>

        <div className='border-t border-green-200 dark:border-green-800 pt-3 mt-3'>
          <p className='font-semibold text-green-900 dark:text-green-100'>🗂️ Quels documents prévoir pour finaliser un devis ?</p>
          <p className='text-green-800 dark:text-green-200 mt-1'>Pas besoin de RIB sur NOLI :</p>
          <p className='text-green-800 dark:text-green-200'>👉 Le paiement se fait directement avec la compagnie d'assurance après leur appel.</p>
        </div>
      </div>


    </form>
  )
}

export default Step2Vehicle
