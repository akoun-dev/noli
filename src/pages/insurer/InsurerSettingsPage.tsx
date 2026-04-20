import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Bell,
  Lock,
  Palette,
  Calculator,
  Save,
  Camera,
  CheckCircle,
  AlertCircle,
  Shield,
  Key,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

type TabValue = 'company' | 'notifications' | 'security' | 'tarification' | 'preferences'

interface CompanyInfo {
  name: string
  description: string
  logoUrl: string
  contactEmail: string
  phone: string
  website: string
  address: string
}

interface NotificationSettings {
  emailQuotes: boolean
  emailPolicies: boolean
  emailPayments: boolean
  smsQuotes: boolean
  smsPolicies: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
}

interface SecuritySettings {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  twoFactorEnabled: boolean
}

interface TarificationSettings {
  defaultMargin: number
  minMargin: number
  maxMargin: number
  autoApplyRules: boolean
  commissionRate: number
}

interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  timezone: string
}

const InsurerSettingsPage = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabValue>('company')
  const [isLoading, setIsLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<TabValue | null>(null)

  // Company Info
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    description: '',
    logoUrl: '',
    contactEmail: '',
    phone: '',
    website: '',
    address: '',
  })

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailQuotes: true,
    emailPolicies: true,
    emailPayments: true,
    smsQuotes: false,
    smsPolicies: false,
    pushNotifications: true,
    weeklyDigest: true,
  })

  // Security
  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  })

  // Tarification
  const [tarification, setTarification] = useState<TarificationSettings>({
    defaultMargin: 15,
    minMargin: 5,
    maxMargin: 30,
    autoApplyRules: true,
    commissionRate: 10,
  })

  // Preferences
  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'system',
    language: 'fr',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
  })

  // Load insurer data
  useEffect(() => {
    loadInsurerData()
  }, [user])

  const loadInsurerData = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Get insurer_id from RPC
      const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id')

      if (insurerError || !insurerData || insurerData.length === 0) {
        logger.error('Unable to retrieve insurer information')
        return
      }

      const insurerId = insurerData[0].insurer_id

      // Load insurer details
      const { data: insurer, error } = await supabase
        .from('insurers')
        .select('*')
        .eq('id', insurerId)
        .single()

      if (error) throw error

      if (insurer) {
        setCompanyInfo({
          name: insurer.name || '',
          description: insurer.description || '',
          logoUrl: insurer.logo_url || '',
          contactEmail: insurer.contact_email || '',
          phone: insurer.phone || '',
          website: insurer.website || '',
          address: '',
        })
      }
    } catch (err) {
      logger.error('Error loading insurer data', { error: err })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompanyInfo = async () => {
    try {
      setIsLoading(true)

      const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id')

      if (insurerError || !insurerData || insurerData.length === 0) {
        throw new Error('Unable to retrieve insurer information')
      }

      const insurerId = insurerData[0].insurer_id

      const { error } = await supabase
        .from('insurers')
        .update({
          name: companyInfo.name,
          description: companyInfo.description,
          logo_url: companyInfo.logoUrl,
          contact_email: companyInfo.contactEmail,
          phone: companyInfo.phone,
          website: companyInfo.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', insurerId)

      if (error) throw error

      setSaveSuccess('company')
      setTimeout(() => setSaveSuccess(null), 3000)

      toast({
        title: 'Informations enregistrées',
        description: 'Les informations de votre entreprise ont été mises à jour avec succès.',
      })

      logger.info('Company info updated', { insurerId })
    } catch (err) {
      logger.error('Error saving company info', { error: err })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setIsLoading(true)

      // Save notification preferences to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_preferences: notifications,
        },
      })

      if (error) throw error

      setSaveSuccess('notifications')
      setTimeout(() => setSaveSuccess(null), 3000)

      toast({
        title: 'Préférences enregistrées',
        description: 'Vos préférences de notification ont été mises à jour.',
      })

      logger.info('Notification preferences updated')
    } catch (err) {
      logger.error('Error saving notifications', { error: err })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas.',
      })
      return
    }

    if (security.newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      return
    }

    try {
      setIsLoading(true)

      const { error } = await supabase.auth.updateUser({
        password: security.newPassword,
      })

      if (error) throw error

      setSaveSuccess('security')
      setTimeout(() => setSaveSuccess(null), 3000)

      setSecurity({
        ...security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été changé avec succès.',
      })

      logger.info('Password changed successfully')
    } catch (err) {
      logger.error('Error changing password', { error: err })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors du changement de mot de passe.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTarification = async () => {
    try {
      setIsLoading(true)

      // Save tarification settings to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          tarification_settings: tarification,
        },
      })

      if (error) throw error

      setSaveSuccess('tarification')
      setTimeout(() => setSaveSuccess(null), 3000)

      toast({
        title: 'Paramètres enregistrés',
        description: 'Vos paramètres de tarification ont été mis à jour.',
      })

      logger.info('Tarification settings updated')
    } catch (err) {
      logger.error('Error saving tarification', { error: err })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setIsLoading(true)

      // Save preferences to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences: {
            ...preferences,
            theme: preferences.theme,
            language: preferences.language,
            currency: preferences.currency,
            timezone: preferences.timezone,
          },
        },
      })

      if (error) throw error

      setSaveSuccess('preferences')
      setTimeout(() => setSaveSuccess(null), 3000)

      toast({
        title: 'Préférences enregistrées',
        description: 'Vos préférences ont été mises à jour.',
      })

      logger.info('Preferences updated')
    } catch (err) {
      logger.error('Error saving preferences', { error: err })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !companyInfo.name) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <div className='h-4 bg-muted animate-pulse rounded' />
                  <div className='h-3 bg-muted animate-pulse rounded w-3/4' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>

      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold'>Paramètres</h1>
        <p className='text-muted-foreground'>
          Gérez les paramètres de votre compte assureur
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className='space-y-6'>
        <TabsList className='grid grid-cols-2 lg:grid-cols-5 w-full h-auto'>
          <TabsTrigger value='company' className='gap-2'>
            <Building2 className='h-4 w-4' />
            <span className='hidden sm:inline'>Entreprise</span>
          </TabsTrigger>
          <TabsTrigger value='notifications' className='gap-2'>
            <Bell className='h-4 w-4' />
            <span className='hidden sm:inline'>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value='security' className='gap-2'>
            <Lock className='h-4 w-4' />
            <span className='hidden sm:inline'>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value='tarification' className='gap-2'>
            <Calculator className='h-4 w-4' />
            <span className='hidden sm:inline'>Tarification</span>
          </TabsTrigger>
          <TabsTrigger value='preferences' className='gap-2'>
            <Palette className='h-4 w-4' />
            <span className='hidden sm:inline'>Préférences</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value='company' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Mettez à jour les informations publiques de votre compagnie d'assurance
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Logo Upload */}
              <div className='flex items-start gap-6'>
                <div className='relative group'>
                  <div className='w-24 h-24 rounded-lg bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden'>
                    {companyInfo.logoUrl ? (
                      <img src={companyInfo.logoUrl} alt='Logo' className='w-full h-full object-cover' />
                    ) : (
                      <Building2 className='h-8 w-8 text-muted-foreground' />
                    )}
                  </div>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <Camera className='h-4 w-4' />
                  </Button>
                </div>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor='logo'>URL du logo</Label>
                  <Input
                    id='logo'
                    value={companyInfo.logoUrl}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, logoUrl: e.target.value })}
                    placeholder='https://example.com/logo.png'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Format recommandé: PNG ou JPG, 200x200px minimum
                  </p>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Nom de la compagnie *</Label>
                  <Input
                    id='name'
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder='Ex: Assurance Generale de Cote dIvoire'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='contactEmail'>Email de contact *</Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='contactEmail'
                      type='email'
                      value={companyInfo.contactEmail}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, contactEmail: e.target.value })}
                      placeholder='contact@agci.ci'
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Téléphone</Label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='phone'
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      placeholder='+225 27 22 XX XX XX'
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='website'>Site web</Label>
                  <div className='relative'>
                    <Globe className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='website'
                      value={companyInfo.website}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                      placeholder='https://www.agci.ci'
                      className='pl-10'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  value={companyInfo.description}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                  placeholder="Décrivez votre compagnie d'assurance..."
                  rows={4}
                />
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveCompanyInfo} disabled={isLoading}>
                  {saveSuccess === 'company' ? (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Enregistré
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Bell className='h-5 w-5' />
                Préférences de notification
              </CardTitle>
              <CardDescription>
                Choisissez les notifications que vous souhaitez recevoir
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Email Notifications */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-5 w-5 text-muted-foreground' />
                  <h3 className='font-semibold'>Notifications par email</h3>
                </div>

                <div className='space-y-4 pl-7'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label htmlFor='email-quotes'>Nouveaux devis</Label>
                      <p className='text-sm text-muted-foreground'>
                        Recevez une notification pour chaque nouveau devis
                      </p>
                    </div>
                    <Switch
                      id='email-quotes'
                      checked={notifications.emailQuotes}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailQuotes: checked })}
                    />
                  </div>

                  <Separator />

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label htmlFor='email-policies'>Nouvelles souscriptions</Label>
                      <p className='text-sm text-muted-foreground'>
                        Soyez notifié des nouvelles polices d'assurance
                      </p>
                    </div>
                    <Switch
                      id='email-policies'
                      checked={notifications.emailPolicies}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailPolicies: checked })}
                    />
                  </div>

                  <Separator />

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label htmlFor='email-payments'>Paiements reçus</Label>
                      <p className='text-sm text-muted-foreground'>
                        Notifications lors des paiements de primes
                      </p>
                    </div>
                    <Switch
                      id='email-payments'
                      checked={notifications.emailPayments}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailPayments: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* SMS Notifications */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Smartphone className='h-5 w-5 text-muted-foreground' />
                  <h3 className='font-semibold'>Notifications SMS</h3>
                </div>

                <div className='space-y-4 pl-7'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label htmlFor='sms-quotes'>Devis urgents</Label>
                      <p className='text-sm text-muted-foreground'>
                        SMS pour les demandes de devis urgentes
                      </p>
                    </div>
                    <Switch
                      id='sms-quotes'
                      checked={notifications.smsQuotes}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsQuotes: checked })}
                    />
                  </div>

                  <Separator />

                  <div className='flex items-center justify-between'>
                    <div>
                      <Label htmlFor='sms-policies'>Souscriptions</Label>
                      <p className='text-sm text-muted-foreground'>
                        SMS pour les nouvelles souscriptions
                      </p>
                    </div>
                    <Switch
                      id='sms-policies'
                      checked={notifications.smsPolicies}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, smsPolicies: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Other Notifications */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='push-notifications'>Notifications push</Label>
                    <p className='text-sm text-muted-foreground'>
                      Recevez des notifications dans votre navigateur
                    </p>
                  </div>
                  <Switch
                    id='push-notifications'
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='weekly-digest'>Résumé hebdomadaire</Label>
                    <p className='text-sm text-muted-foreground'>
                      Recevez un résumé de vos activités chaque semaine
                    </p>
                  </div>
                  <Switch
                    id='weekly-digest'
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyDigest: checked })}
                  />
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveNotifications} disabled={isLoading}>
                  {saveSuccess === 'notifications' ? (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Enregistré
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Sécurité du compte
              </CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte assureur
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Password Change */}
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Key className='h-5 w-5 text-muted-foreground' />
                  <h3 className='font-semibold'>Changer le mot de passe</h3>
                </div>

                <div className='space-y-4 pl-7 max-w-md'>
                  <div className='space-y-2'>
                    <Label htmlFor='current-password'>Mot de passe actuel</Label>
                    <Input
                      id='current-password'
                      type='password'
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='new-password'>Nouveau mot de passe</Label>
                    <Input
                      id='new-password'
                      type='password'
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                    />
                    <p className='text-xs text-muted-foreground'>
                      Minimum 8 caractères, incluant majuscules, minuscules et chiffres
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='confirm-password'>Confirmer le mot de passe</Label>
                    <Input
                      id='confirm-password'
                      type='password'
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleChangePassword} disabled={isLoading || !security.currentPassword || !security.newPassword}>
                    Changer le mot de passe
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 2FA */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Smartphone className='h-5 w-5 text-muted-foreground' />
                      <h3 className='font-semibold'>Authentification à deux facteurs</h3>
                    </div>
                </div>
                    <div className='flex items-center gap-2'>
                      <Switch
                        checked={security.twoFactorEnabled}
                        onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                      />
                      <Label>Activer la 2FA</Label>
                      {security.twoFactorEnabled && (
                        <Badge variant='default' className='ml-2'>
                          Activé
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className='text-sm text-muted-foreground pl-7'>
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
              </div>

              {saveSuccess === 'security' && (
                <Alert>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    Mot de passe changé avec succès
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tarification Tab */}
        <TabsContent value='tarification' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calculator className='h-5 w-5' />
                Paramètres de tarification
              </CardTitle>
              <CardDescription>
                Configurez les paramètres de calcul de vos primes d'assurance
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Margins */}
              <div className='space-y-4'>
                <h3 className='font-semibold'>Marges par défaut</h3>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='default-margin'>Marge par défaut (%)</Label>
                    <Input
                      id='default-margin'
                      type='number'
                      value={tarification.defaultMargin}
                      onChange={(e) => setTarification({ ...tarification, defaultMargin: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='min-margin'>Marge minimum (%)</Label>
                    <Input
                      id='min-margin'
                      type='number'
                      value={tarification.minMargin}
                      onChange={(e) => setTarification({ ...tarification, minMargin: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='max-margin'>Marge maximum (%)</Label>
                    <Input
                      id='max-margin'
                      type='number'
                      value={tarification.maxMargin}
                      onChange={(e) => setTarification({ ...tarification, maxMargin: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Commission */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='commission-rate'>Taux de commission par défaut (%)</Label>
                    <p className='text-sm text-muted-foreground'>
                      Commission appliquée aux courtiers et intermédiaires
                    </p>
                  </div>
                  <div className='w-32'>
                    <Input
                      id='commission-rate'
                      type='number'
                      value={tarification.commissionRate}
                      onChange={(e) => setTarification({ ...tarification, commissionRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Auto-apply rules */}
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='auto-apply-rules'>Appliquer automatiquement les règles de tarification</Label>
                  <p className='text-sm text-muted-foreground'>
                    Les règles de tarification seront appliquées automatiquement lors de la création de devis
                  </p>
                </div>
                <Switch
                  id='auto-apply-rules'
                  checked={tarification.autoApplyRules}
                  onCheckedChange={(checked) => setTarification({ ...tarification, autoApplyRules: checked })}
                />
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSaveTarification} disabled={isLoading}>
                  {saveSuccess === 'tarification' ? (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Enregistré
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value='preferences' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Palette className='h-5 w-5' />
                Préférences d'affichage
              </CardTitle>
              <CardDescription>
                Personnalisez votre expérience utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Theme */}
                <div className='space-y-2'>
                  <Label htmlFor='theme'>Thème</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value: any) => setPreferences({ ...preferences, theme: value })}
                  >
                    <SelectTrigger id='theme'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='light'>Clair</SelectItem>
                      <SelectItem value='dark'>Sombre</SelectItem>
                      <SelectItem value='system'>Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className='space-y-2'>
                  <Label htmlFor='language'>Langue</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                  >
                    <SelectTrigger id='language'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='fr'>Français</SelectItem>
                      <SelectItem value='en'>English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div className='space-y-2'>
                  <Label htmlFor='currency'>Devise</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                  >
                    <SelectTrigger id='currency'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='XOF'>FCFA (XOF)</SelectItem>
                      <SelectItem value='EUR'>Euro (EUR)</SelectItem>
                      <SelectItem value='USD'>Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Fuseau horaire</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                  >
                    <SelectTrigger id='timezone'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Africa/Abidjan'>Afrique/Abidjan (GMT+0)</SelectItem>
                      <SelectItem value='Africa/Porto-Novo'>Afrique/Porto-Novo (GMT+1)</SelectItem>
                      <SelectItem value='Europe/Paris'>Europe/Paris (GMT+1/+2)</SelectItem>
                      <SelectItem value='UTC'>UTC (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleSavePreferences} disabled={isLoading}>
                  {saveSuccess === 'preferences' ? (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Enregistré
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default InsurerSettingsPage
