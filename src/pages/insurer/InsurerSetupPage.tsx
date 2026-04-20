import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'


interface CompanySetupData {
  name: string
  description: string
  contactEmail: string
  phone: string
  website: string
  address: string
}

const InsurerSetupPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const [companyData, setCompanyData] = useState<CompanySetupData>({
    name: '',
    description: '',
    contactEmail: '',
    phone: '',
    website: '',
    address: '',
  })

  const [errors, setErrors] = useState<Partial<CompanySetupData>>({})

  useEffect(() => {
    // Check if insurer account already exists and load profile data
    checkExistingInsurerAndLoadData()
  }, [])

  const checkExistingInsurerAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First, check if insurer account already exists
      const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id')

      if (!insurerError && insurerData && insurerData.length > 0) {
        // Insurer already exists, redirect to dashboard
        logger.info('Insurer account already exists, redirecting to dashboard', { insurerId: insurerData[0].insurer_id })
        navigate('/assureur/tableau-de-bord', { replace: true })
        return
      }

      // Load profile data to pre-fill form
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCompanyData(prev => ({
          ...prev,
          name: profile.company_name || '',
          contactEmail: profile.email || '',
          phone: profile.phone || '',
        }))
      }
    } catch (error) {
      logger.error('Error checking insurer or loading user data:', error)
    }
  }

  const validateStep1 = () => {
    const newErrors: Partial<CompanySetupData> = {}

    if (!companyData.name.trim()) {
      newErrors.name = 'Le nom de la compagnie est requis'
    } else if (companyData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères'
    }

    if (!companyData.contactEmail.trim()) {
      newErrors.contactEmail = "L'email de contact est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.contactEmail)) {
      newErrors.contactEmail = 'Email invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Partial<CompanySetupData> = {}

    if (companyData.phone && !/^(\+225)?[0-9]{10}$/.test(companyData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide (format: +225XXXXXXXXXX)'
    }

    if (companyData.website && !/^https?:\/\/.+/.test(companyData.website)) {
      newErrors.website = 'URL invalide (doit commencer par http:// ou https://)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    setIsLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      // Generate unique code for the company
      const companyCode = companyData.name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10)

      // Create the insurance company AND link account in one atomic operation
      const { data: insurerResult, error: insurerError } = await supabase.rpc('create_insurer_with_link', {
        p_code: companyCode,
        p_name: companyData.name,
        p_description: companyData.description,
        p_contact_email: companyData.contactEmail,
        p_phone: companyData.phone,
        p_website: companyData.website,
      })

      if (insurerError) {
        logger.error('Error creating insurer:', insurerError)
        throw new Error(`Erreur création compagnie: ${insurerError.message}`)
      }

      if (!insurerResult || insurerResult.length === 0) {
        throw new Error('Erreur lors de la création de la compagnie: aucune donnée retournée')
      }

      const result = insurerResult[0]
      if (!result.success) {
        // If user already has an insurer account, we can redirect to dashboard
        if (result.message && result.message.includes('already has an insurer account')) {
          logger.info('User already has an insurer account, redirecting to dashboard', { insurerId: result.insurer_id })
          
          // Update profile with company name even if account already exists
          await supabase
            .from('profiles')
            .update({
              company_name: companyData.name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
          
          toast({
            title: 'Compagnie déjà configurée',
            description: 'Votre compagnie est déjà configurée. Redirection vers le tableau de bord...',
          })
          setTimeout(() => {
            navigate('/assureur/tableau-de-bord')
          }, 1500)
          return
        }
        throw new Error(result.message || 'Erreur lors de la création de la compagnie')
      }

      logger.info('Insurance company created and linked', { insurerId: result.insurer_id })

      // Update profile with company name
      await supabase
        .from('profiles')
        .update({
          company_name: companyData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      toast({
        title: 'Compagnie créée avec succès',
        description: `Bienvenue parmi nous, ${companyData.name} !`,
      })

      // Redirect to insurer dashboard
      setTimeout(() => {
        navigate('/assureur/tableau-de-bord')
      }, 1500)
    } catch (error) {
      logger.error('Error in insurer setup:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-primary/5 p-4'>
      <div className='max-w-3xl mx-auto py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            <Building2 className='h-10 w-10 text-primary' />
          </div>
          <h1 className='text-3xl font-bold mb-2'>
            Bienvenue sur NOLI Assurance
          </h1>
          <p className='text-muted-foreground'>
            Configurez votre compagnie d'assurance en quelques étapes
          </p>
        </div>

        {/* Progress Steps */}
        <div className='flex items-center justify-center gap-4 mb-8'>
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              {step > 1 ? <CheckCircle className='h-4 w-4' /> : '1'}
            </div>
            <span className='font-medium'>Informations de base</span>
          </div>

          <div className='w-16 h-0.5 bg-muted' />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
            }`}>
              2
            </div>
            <span className='font-medium'>Détails de contact</span>
          </div>
        </div>

        {/* Form Card */}
        <Card className='shadow-xl'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary' />
              {step === 1 ? 'Informations de base' : 'Détails de contact'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Commençons par les informations essentielles de votre compagnie'
                : 'Ajoutons vos coordonnées de contact'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className='space-y-6'>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Nom de la compagnie *</Label>
                    <Input
                      id='name'
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder='Ex: Assurance Generale de Cote dIvoire'
                      className={errors.name ? 'border-destructive' : ''}
                      disabled={isLoading}
                    />
                    {errors.name && (
                      <p className='text-sm text-destructive flex items-center gap-1'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      value={companyData.description}
                      onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                      placeholder='Décrivez brièvement votre compagnie d&#39;assurance...'
                      rows={4}
                      disabled={isLoading}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='contactEmail'>Email de contact *</Label>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='contactEmail'
                        type='email'
                        value={companyData.contactEmail}
                        onChange={(e) => setCompanyData({ ...companyData, contactEmail: e.target.value })}
                        placeholder='contact@compagnie.ci'
                        className={`pl-10 ${errors.contactEmail ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.contactEmail && (
                      <p className='text-sm text-destructive flex items-center gap-1'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.contactEmail}
                      </p>
                    )}
                  </div>

                  <Button type='submit' className='w-full' disabled={isLoading}>
                    Continuer
                    <ArrowRight className='h-4 w-4 ml-2' />
                  </Button>
                </>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <>
                  <Alert className='mb-6'>
                    <Sparkles className='h-4 w-4' />
                    <AlertDescription>
                      Ces informations aideront les clients à vous contacter. Vous pourrez les modifier plus tard dans les paramètres.
                    </AlertDescription>
                  </Alert>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Téléphone</Label>
                    <div className='relative'>
                      <Phone className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='phone'
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        placeholder='+225 27 22 XX XX XX'
                        className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && (
                      <p className='text-sm text-destructive flex items-center gap-1'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='website'>Site web</Label>
                    <div className='relative'>
                      <Globe className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='website'
                        value={companyData.website}
                        onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                        placeholder='https://www.votre-compagnie.ci'
                        className={`pl-10 ${errors.website ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.website && (
                      <p className='text-sm text-destructive flex items-center gap-1'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.website}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='address'>Adresse</Label>
                    <div className='relative'>
                      <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='address'
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        placeholder='Adresse de votre siège social'
                        className='pl-10'
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className='bg-muted/50 rounded-lg p-4 space-y-2'>
                    <h3 className='font-semibold text-sm'>Récapitulatif</h3>
                    <div className='text-sm space-y-1'>
                      <p><span className='font-medium'>Nom:</span> {companyData.name}</p>
                      <p><span className='font-medium'>Email:</span> {companyData.contactEmail}</p>
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleBack}
                      disabled={isLoading}
                      className='flex-1'
                    >
                      Retour
                    </Button>
                    <Button type='submit' disabled={isLoading} className='flex-1'>
                      {isLoading ? 'Création...' : 'Créer ma compagnie'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className='text-center mt-6 text-sm text-muted-foreground'>
          <p>Besoin d'aide ? Contactez notre support</p>
        </div>
      </div>
    </div>
  )
}

export default InsurerSetupPage
