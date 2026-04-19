import React, { useState, useEffect } from 'react'
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Palette,
  Globe,
  Mail,
  Smartphone,
  Monitor,
  Save,
  RotateCcw,
  Download,
  Upload,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { adminSettingsService } from '@/features/admin/services/adminSettingsService'
import type {
  SystemSettings,
  SecuritySettings,
  EmailSettings,
  NotificationSettings,
  UISettings,
} from '@/features/admin/services/adminSettingsService'
import { logger } from '@/lib/logger'

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [testSmsLoading, setTestSmsLoading] = useState(false)

  // États pour les données API
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'NOLI Assurance',
    siteDescription: "Plateforme de comparaison d'assurance auto",
    adminEmail: 'admin@noli.ci',
    contactPhone: '+225 21 25 00 00',
    contactAddress: 'Abidjan, Cocody',
    maintenanceMode: false,
    debugMode: false,
    registrationEnabled: true,
    emailVerification: true,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expireDays: 90,
    },
  })

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    senderName: 'NOLI Assurance',
    senderEmail: 'noreply@noli.ci',
    encryption: 'tls',
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newUserRegistration: true,
    insurerApproval: true,
    quoteRequests: true,
    systemAlerts: true,
    marketingEmails: false,
  })

  const [uiSettings, setUISettings] = useState<UISettings>({
    theme: 'light',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Africa/Abidjan',
    itemsPerPage: 20,
    sidebarCollapsed: false,
    showTooltips: true,
    animationsEnabled: true,
  })

  // Charger les données au montage du composant
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [system, security, email, notifications, ui] = await Promise.all([
        adminSettingsService.getSystemSettings(),
        adminSettingsService.getSecuritySettings(),
        adminSettingsService.getEmailSettings(),
        adminSettingsService.getNotificationSettings(),
        adminSettingsService.getUISettings(),
      ])

      setSystemSettings(system)
      setSecuritySettings(security)
      setEmailSettings(email)
      setNotificationSettings(notifications)
      setUISettings(ui)
    } catch (error) {
      logger.error('Erreur lors du chargement des paramètres:', error)
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Sauvegarder tous les paramètres
      await Promise.all([
        adminSettingsService.updateSystemSettings(systemSettings),
        adminSettingsService.updateSecuritySettings(securitySettings),
        adminSettingsService.updateEmailSettings(emailSettings),
        adminSettingsService.updateNotificationSettings(notificationSettings),
        adminSettingsService.updateUISettings(uiSettings),
      ])
      toast.success('Paramètres sauvegardés avec succès')
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des paramètres:', error)
      toast.error('Erreur lors de la sauvegarde des paramètres')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      try {
        await adminSettingsService.resetSettings()
        toast.info('Paramètres réinitialisés aux valeurs par défaut')
        loadSettings() // Recharger les paramètres
      } catch (error) {
        logger.error('Erreur lors de la réinitialisation:', error)
        toast.error('Erreur lors de la réinitialisation des paramètres')
      }
    }
  }

  const handleExportSettings = async () => {
    try {
      const exportData = await adminSettingsService.exportSettings()
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'noli-settings-backup.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Paramètres exportés avec succès')
    } catch (error) {
      logger.error("Erreur lors de l'exportation:", error)
      toast.error("Erreur lors de l'exportation des paramètres")
    }
  }

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string)
          const request = {
            settings,
            overwriteExisting: true,
            sections: ['system', 'email', 'notifications', 'ui'],
          }

          const result = await adminSettingsService.importSettings(request)
          if (result.imported.length > 0) {
            toast.success(`Paramètres importés avec succès: ${result.imported.join(', ')}`)
            loadSettings() // Recharger les paramètres
          }
          if (result.errors.length > 0) {
            toast.error(`Erreur lors de l'importation: ${result.errors.join(', ')}`)
          }
        } catch (error) {
          toast.error("Erreur lors de l'importation des paramètres")
        }
      }
      reader.readAsText(file)
    } catch (error) {
      logger.error('Erreur lors de la lecture du fichier:', error)
      toast.error('Erreur lors de la lecture du fichier')
    }
  }

  const handleTestEmail = async () => {
    setTestEmailLoading(true)
    try {
      // TODO: Implement email test functionality via backend service
      toast.info(
        'Fonctionnalité de test email non implémentée. Configurez le backend pour envoyer des emails.'
      )
    } catch (error) {
      logger.error('Erreur lors du test email:', error)
      toast.error('Erreur lors du test email')
    } finally {
      setTestEmailLoading(false)
    }
  }

  const handleTestSms = async () => {
    setTestSmsLoading(true)
    try {
      // TODO: Implement SMS test functionality via backend service
      toast.info(
        'Fonctionnalité de test SMS non implémentée. Configurez le backend pour envoyer des SMS.'
      )
    } catch (error) {
      logger.error('Erreur lors du test SMS:', error)
      toast.error('Erreur lors du test SMS')
    } finally {
      setTestSmsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='flex items-center space-x-2'>
          <RefreshCw className='h-6 w-6 animate-spin' />
          <span className='text-lg'>Chargement des paramètres...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Paramètres du Système</h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Configurez les paramètres de l'application NOLI
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Button variant='outline' onClick={handleExportSettings}>
            <Download className='w-4 h-4 mr-2' />
            <span className='hidden sm:inline'>Exporter</span>
          </Button>
          <label htmlFor='import-settings'>
            <Button variant='outline' asChild>
              <span>
                <Upload className='w-4 h-4 mr-2' />
                <span className='hidden sm:inline'>Importer</span>
              </span>
            </Button>
          </label>
          <input
            id='import-settings'
            type='file'
            accept='.json'
            className='hidden'
            onChange={handleImportSettings}
          />
          <Button variant='outline' onClick={handleResetSettings}>
            <RotateCcw className='w-4 h-4 mr-2' />
            <span className='hidden sm:inline'>Réinitialiser</span>
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            <Save className='w-4 h-4 mr-2' />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 h-auto'>
          <TabsTrigger
            value='general'
            className='flex items-center justify-center space-x-1 sm:space-x-2 text-xs py-2 sm:py-2.5'
          >
            <Settings className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline text-xs sm:text-sm'>Général</span>
          </TabsTrigger>
          <TabsTrigger
            value='users'
            className='flex items-center justify-center space-x-1 sm:space-x-2 text-xs py-2 sm:py-2.5'
          >
            <Users className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline text-xs sm:text-sm'>Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger
            value='security'
            className='flex items-center justify-center space-x-1 sm:space-x-2 text-xs py-2 sm:py-2.5'
          >
            <Shield className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline text-xs sm:text-sm'>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center justify-center space-x-1 sm:space-x-2 text-xs py-2 sm:py-2.5'
          >
            <Bell className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline text-xs sm:text-sm'>Notif.</span>
          </TabsTrigger>
          <TabsTrigger
            value='appearance'
            className='flex items-center justify-center space-x-1 sm:space-x-2 text-xs py-2 sm:py-2.5'
          >
            <Palette className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline text-xs sm:text-sm'>Apparence</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value='general' className='space-y-4 sm:space-y-6'>
          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Informations du Site</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Configurez les informations de base de votre site
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='siteName'>Nom du site</Label>
                  <Input
                    id='siteName'
                    value={systemSettings.siteName}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, siteName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='adminEmail'>Email administrateur</Label>
                  <Input
                    id='adminEmail'
                    type='email'
                    value={systemSettings.adminEmail}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, adminEmail: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor='siteDescription'>Description du site</Label>
                <Textarea
                  id='siteDescription'
                  value={systemSettings.siteDescription}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, siteDescription: e.target.value })
                  }
                />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='contactPhone'>Téléphone contact</Label>
                  <Input
                    id='contactPhone'
                    value={systemSettings.contactPhone}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, contactPhone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='contactAddress'>Adresse</Label>
                  <Input
                    id='contactAddress'
                    value={systemSettings.contactAddress}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, contactAddress: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Configuration du Système</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Paramètres de fonctionnement du système
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Mode maintenance</Label>
                  <p className='text-xs text-muted-foreground'>
                    Désactive le site pour les utilisateurs non-administrateurs
                  </p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                  }
                />
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Mode débogage</Label>
                  <p className='text-xs text-muted-foreground'>
                    Active les logs détaillés pour le développement
                  </p>
                </div>
                <Switch
                  checked={systemSettings.debugMode}
                  onCheckedChange={(checked) =>
                    setSystemSettings({ ...systemSettings, debugMode: checked })
                  }
                />
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Inscription des utilisateurs</Label>
                  <p className='text-xs text-muted-foreground'>
                    Permet aux nouveaux utilisateurs de s'inscrire
                  </p>
                </div>
                <Switch
                  checked={systemSettings.registrationEnabled}
                  onCheckedChange={(checked) =>
                    setSystemSettings({ ...systemSettings, registrationEnabled: checked })
                  }
                />
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Vérification des emails</Label>
                  <p className='text-xs text-muted-foreground'>
                    Nécessite la vérification des adresses email
                  </p>
                </div>
                <Switch
                  checked={systemSettings.emailVerification}
                  onCheckedChange={(checked) =>
                    setSystemSettings({ ...systemSettings, emailVerification: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Configuration Email</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Paramètres SMTP pour l'envoi d'emails
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='smtpHost'>Serveur SMTP</Label>
                  <Input
                    id='smtpHost'
                    value={emailSettings.smtpHost}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='smtpPort'>Port SMTP</Label>
                  <Input
                    id='smtpPort'
                    type='number'
                    value={emailSettings.smtpPort}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='smtpUsername'>Nom d'utilisateur SMTP</Label>
                  <Input
                    id='smtpUsername'
                    value={emailSettings.smtpUsername}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='senderName'>Nom de l'expéditeur</Label>
                  <Input
                    id='senderName'
                    value={emailSettings.senderName}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, senderName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='senderEmail'>Email de l'expéditeur</Label>
                  <Input
                    id='senderEmail'
                    type='email'
                    value={emailSettings.senderEmail}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, senderEmail: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='encryption'>Chiffrement</Label>
                  <Select
                    value={emailSettings.encryption}
                    onValueChange={(value: 'none' | 'ssl' | 'tls') =>
                      setEmailSettings({ ...emailSettings, encryption: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Aucun</SelectItem>
                      <SelectItem value='ssl'>SSL</SelectItem>
                      <SelectItem value='tls'>TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Settings */}
        <TabsContent value='users' className='space-y-4 sm:space-y-6'>
          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Paramètres des Utilisateurs</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Configurez les paramètres relatifs aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4'>
              <div>
                <Label htmlFor='sessionTimeout'>Délai d'expiration de session (secondes)</Label>
                <Input
                  id='sessionTimeout'
                  type='number'
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor='maxLoginAttempts'>Nombre maximum de tentatives de connexion</Label>
                <Input
                  id='maxLoginAttempts'
                  type='number'
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      maxLoginAttempts: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Politique de Mot de Passe</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Définissez les exigences de sécurité pour les mots de passe
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4'>
              <div>
                <Label htmlFor='minLength'>Longueur minimale</Label>
                <Input
                  id='minLength'
                  type='number'
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        minLength: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Nécessite des majuscules</Label>
                  <p className='text-xs text-muted-foreground'>
                    Les mots de passe doivent contenir au moins une majuscule
                  </p>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireUppercase: checked,
                      },
                    })
                  }
                />
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Nécessite des chiffres</Label>
                  <p className='text-xs text-muted-foreground'>
                    Les mots de passe doivent contenir au moins un chiffre
                  </p>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireNumbers: checked,
                      },
                    })
                  }
                />
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                <div className='space-y-0.5'>
                  <Label className='text-sm'>Nécessite des caractères spéciaux</Label>
                  <p className='text-xs text-muted-foreground'>
                    Les mots de passe doivent contenir au moins un caractère spécial
                  </p>
                </div>
                <Switch
                  checked={securitySettings.passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        requireSpecialChars: checked,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor='expireDays'>Expiration du mot de passe (jours)</Label>
                <Input
                  id='expireDays'
                  type='number'
                  value={securitySettings.passwordPolicy.expireDays}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        expireDays: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value='security' className='space-y-4 sm:space-y-6'>
          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Sécurité du Système</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Paramètres de sécurité et de protection des données
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4'>
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  Les modifications de ces paramètres peuvent affecter la sécurité de votre système.
                  Assurez-vous de comprendre l'impact avant de modifier ces options.
                </AlertDescription>
              </Alert>

              <div className='space-y-6'>
                <div>
                  <h4 className='text-base sm:text-lg font-semibold mb-4'>
                    Politique de mots de passe
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                    <div className='p-3 sm:p-4 border rounded-lg'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>Longueur minimale</span>
                        <Badge variant='outline'>
                          {securitySettings.passwordPolicy.minLength} caractères
                        </Badge>
                      </div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>Majuscules requises</span>
                        {securitySettings.passwordPolicy.requireUppercase ? (
                          <Check className='h-4 w-4 text-green-500 dark:text-green-400' />
                        ) : (
                          <X className='h-4 w-4 text-red-500 dark:text-red-400' />
                        )}
                      </div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>Chiffres requis</span>
                        {securitySettings.passwordPolicy.requireNumbers ? (
                          <Check className='h-4 w-4 text-green-500 dark:text-green-400' />
                        ) : (
                          <X className='h-4 w-4 text-red-500 dark:text-red-400' />
                        )}
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>Caractères spéciaux</span>
                        {securitySettings.passwordPolicy.requireSpecialChars ? (
                          <Check className='h-4 w-4 text-green-500 dark:text-green-400' />
                        ) : (
                          <X className='h-4 w-4 text-red-500 dark:text-red-400' />
                        )}
                      </div>
                    </div>
                    <div className='p-4 border rounded-lg'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>Expiration</span>
                        <Badge variant='outline'>
                          {securitySettings.passwordPolicy.expireDays} jours
                        </Badge>
                      </div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>Tentatives max</span>
                        <Badge variant='outline'>{securitySettings.maxLoginAttempts}</Badge>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>Session timeout</span>
                        <Badge variant='outline'>{securitySettings.sessionTimeout}s</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className='text-lg font-semibold mb-4'>Sécurité des accès</h4>
                  <div className='space-y-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                      <div className='space-y-0.5'>
                        <Label className='text-sm'>Vérification email</Label>
                        <p className='text-xs text-muted-foreground'>
                          Les utilisateurs doivent vérifier leur adresse email
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.emailVerification}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, emailVerification: checked })
                        }
                      />
                    </div>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                      <div className='space-y-0.5'>
                        <Label className='text-sm'>Inscriptions ouvertes</Label>
                        <p className='text-xs text-muted-foreground'>
                          Permet aux nouveaux utilisateurs de s'inscrire
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.registrationEnabled}
                        onCheckedChange={(checked) =>
                          setSystemSettings({ ...systemSettings, registrationEnabled: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-4 sm:space-y-6'>
          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Préférences de Notification</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Configurez comment et quand envoyer les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4 sm:space-y-6'>
              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Canaux de notification</h4>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Notifications par email</Label>
                    <p className='text-xs text-muted-foreground'>
                      Envoyer les notifications par email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Notifications push</Label>
                    <p className='text-xs text-muted-foreground'>
                      Envoyer les notifications push dans le navigateur
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Notifications SMS</Label>
                    <p className='text-xs text-muted-foreground'>
                      Envoyer les notifications par SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: checked,
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Types de notifications</h4>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Nouveaux utilisateurs</Label>
                    <p className='text-xs text-muted-foreground'>
                      Notification lors des nouvelles inscriptions
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.newUserRegistration}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        newUserRegistration: checked,
                      })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Approbation des assureurs</Label>
                    <p className='text-xs text-muted-foreground'>
                      Notification pour les assureurs en attente d'approbation
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.insurerApproval}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, insurerApproval: checked })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Demandes de devis</Label>
                    <p className='text-xs text-muted-foreground'>
                      Notification pour les nouvelles demandes de devis
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.quoteRequests}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, quoteRequests: checked })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Alertes système</Label>
                    <p className='text-xs text-muted-foreground'>
                      Notifications importantes du système
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, systemAlerts: checked })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Emails marketing</Label>
                    <p className='text-xs text-muted-foreground'>Email marketing et newsletters</p>
                  </div>
                  <Switch
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value='appearance' className='space-y-4 sm:space-y-6'>
          <Card>
            <CardHeader className='p-4 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>Apparence de l'Interface</CardTitle>
              <CardDescription className='text-xs sm:text-sm'>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 space-y-4 sm:space-y-6'>
              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Thème et langage</h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='theme'>Thème</Label>
                    <Select
                      value={uiSettings.theme}
                      onValueChange={(value: 'light' | 'dark' | 'auto') =>
                        setUISettings({ ...uiSettings, theme: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='light'>Clair</SelectItem>
                        <SelectItem value='dark'>Sombre</SelectItem>
                        <SelectItem value='auto'>Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='language'>Langue</Label>
                    <Select
                      value={uiSettings.language}
                      onValueChange={(value) => setUISettings({ ...uiSettings, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='fr'>Français</SelectItem>
                        <SelectItem value='en'>English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Format et timezone</h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='dateFormat'>Format de date</Label>
                    <Select
                      value={uiSettings.dateFormat}
                      onValueChange={(value) => setUISettings({ ...uiSettings, dateFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='DD/MM/YYYY'>JJ/MM/AAAA</SelectItem>
                        <SelectItem value='MM/DD/YYYY'>MM/JJ/AAAA</SelectItem>
                        <SelectItem value='YYYY-MM-DD'>AAAA-MM-JJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='timezone'>Fuseau horaire</Label>
                    <Select
                      value={uiSettings.timezone}
                      onValueChange={(value) => setUISettings({ ...uiSettings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Africa/Abidjan'>Africa/Abidjan (GMT)</SelectItem>
                        <SelectItem value='Europe/Paris'>Europe/Paris (GMT+1)</SelectItem>
                        <SelectItem value='UTC'>UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Options d'affichage</h4>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Barre latérale réduite</Label>
                    <p className='text-xs text-muted-foreground'>
                      Réduire la barre latérale par défaut
                    </p>
                  </div>
                  <Switch
                    checked={uiSettings.sidebarCollapsed}
                    onCheckedChange={(checked) =>
                      setUISettings({ ...uiSettings, sidebarCollapsed: checked })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Infobulles</Label>
                    <p className='text-xs text-muted-foreground'>Afficher les infobulles d'aide</p>
                  </div>
                  <Switch
                    checked={uiSettings.showTooltips}
                    onCheckedChange={(checked) =>
                      setUISettings({ ...uiSettings, showTooltips: checked })
                    }
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm'>Animations</Label>
                    <p className='text-xs text-muted-foreground'>
                      Activer les animations de l'interface
                    </p>
                  </div>
                  <Switch
                    checked={uiSettings.animationsEnabled}
                    onCheckedChange={(checked) =>
                      setUISettings({ ...uiSettings, animationsEnabled: checked })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor='itemsPerPage'>Éléments par page</Label>
                  <Select
                    value={uiSettings.itemsPerPage.toString()}
                    onValueChange={(value) =>
                      setUISettings({ ...uiSettings, itemsPerPage: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='20'>20</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                      <SelectItem value='100'>100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSettingsPage
