import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Building2,
  FileText,
  CreditCard,
  TrendingUp,
  Calculator,
  Settings,
  Bell,
  Shield,
  Wallet,
  Palette,
  Trash2,
  History,
  ChevronRight,
  Save,
  Upload,
  XIcon,
  ImageIcon,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  MapPin,
  Check,
  AlertCircle,
  Download,
  Eye,
  Zap,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

type SettingsSection = 'overview' | 'company' | 'notifications' | 'security' | 'tarification' | 'preferences' | 'danger'

interface CompanyInfo {
  name: string
  description: string
  logoUrl: string
  contactEmail: string
  phone: string
  website: string
  address: string
  licenseNumber: string
}

interface NotificationSettings {
  emailQuotes: boolean
  emailPolicies: boolean
  emailPayments: boolean
  emailLeads: boolean
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
  showPassword: boolean
  showNewPassword: boolean
  showConfirmPassword: boolean
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

interface UnsavedChanges {
  company?: boolean
  notifications?: boolean
  tarification?: boolean
  preferences?: boolean
  security?: boolean
}

interface AccountStats {
  activeQuotes: number
  activePolicies: number
  monthlyRevenue: number
  conversionRate: number
}

interface Activity {
  id: string
  action: string
  description: string
  timestamp: Date
}

const navigationItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { id: 'company', label: 'Entreprise', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'tarification', label: 'Tarification', icon: Wallet },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'preferences', label: 'Préférences', icon: Palette },
  { id: 'danger', label: 'Zone de danger', icon: Trash2 },
]

export const InsurerSettingsPage: React.FC = () => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // States
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChanges>({})
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<SettingsSection | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Data States
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    description: '',
    logoUrl: '',
    contactEmail: '',
    phone: '',
    website: '',
    address: '',
    licenseNumber: '',
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailQuotes: false,
    emailPolicies: false,
    emailPayments: false,
    emailLeads: false,
    smsQuotes: false,
    smsPolicies: false,
    pushNotifications: false,
    weeklyDigest: false,
  })

  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    showPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  })

  const [tarification, setTarification] = useState<TarificationSettings>({
    defaultMargin: 15,
    minMargin: 5,
    maxMargin: 30,
    autoApplyRules: true,
    commissionRate: 10,
  })

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'system',
    language: 'fr',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
  })

  // Stats & Activity
  const [accountStats, setAccountStats] = useState<AccountStats>({
    activeQuotes: 0,
    activePolicies: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
  })
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])

  const originalDataRef = useRef({
    company: {} as CompanyInfo,
    notifications: {} as NotificationSettings,
    tarification: {} as TarificationSettings,
    preferences: {} as PreferenceSettings,
  })

  // Load insurer data
  useEffect(() => {
    loadInsurerData()
  }, [user])

  // Track unsaved changes
  useEffect(() => {
    // Skip during initial load
    if (isLoading || isInitialLoad) return

    const changes: UnsavedChanges = {}

    if (originalDataRef.current.company && Object.keys(originalDataRef.current.company).length > 0) {
      if (JSON.stringify(companyInfo) !== JSON.stringify(originalDataRef.current.company)) {
        changes.company = true
      }
    }
    if (originalDataRef.current.notifications && Object.keys(originalDataRef.current.notifications).length > 0) {
      if (JSON.stringify(notifications) !== JSON.stringify(originalDataRef.current.notifications)) {
        changes.notifications = true
      }
    }
    if (originalDataRef.current.tarification && Object.keys(originalDataRef.current.tarification).length > 0) {
      if (JSON.stringify(tarification) !== JSON.stringify(originalDataRef.current.tarification)) {
        changes.tarification = true
      }
    }
    if (originalDataRef.current.preferences && Object.keys(originalDataRef.current.preferences).length > 0) {
      if (JSON.stringify(preferences) !== JSON.stringify(originalDataRef.current.preferences)) {
        changes.preferences = true
      }
    }

    setUnsavedChanges(changes)
  }, [companyInfo, notifications, tarification, preferences, isLoading, isInitialLoad])

  const loadInsurerData = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      const { data: insurerData, error: insurerError } = await supabase.rpc('get_current_insurer_id')

      if (insurerError || !insurerData || insurerData.length === 0) {
        logger.error('Unable to retrieve insurer information')
        return
      }

      const insurerId = insurerData[0].insurer_id

      const { data: insurer, error } = await supabase
        .from('insurers')
        .select('*')
        .eq('id', insurerId)
        .single()

      if (error) throw error

      if (insurer) {
        const loadedCompany = {
          name: insurer.name || '',
          description: insurer.description || '',
          logoUrl: insurer.logo_url || '',
          contactEmail: insurer.contact_email || '',
          phone: insurer.phone || '',
          website: insurer.website || '',
          address: insurer.contact_address || '',
          licenseNumber: insurer.license_number || '',
        }

        // Set original data BEFORE setting state to prevent false unsaved changes
        originalDataRef.current.company = { ...loadedCompany }
        setCompanyInfo(loadedCompany)
      }

      await loadAccountStats(insurerId)
      await loadRecentActivity(insurerId)

      if (user.user_metadata) {
        const meta = user.user_metadata

        if (meta.notification_preferences) {
          const loadedNotifications = { ...notifications, ...meta.notification_preferences }
          originalDataRef.current.notifications = { ...loadedNotifications }
          setNotifications(loadedNotifications)
        }

        if (meta.tarification_settings) {
          const loadedTarification = { ...tarification, ...meta.tarification_settings }
          originalDataRef.current.tarification = { ...loadedTarification }
          setTarification(loadedTarification)
        }

        if (meta.preferences) {
          const loadedPreferences = { ...preferences, ...meta.preferences }
          originalDataRef.current.preferences = { ...loadedPreferences }
          setPreferences(loadedPreferences)
        }
      }
    } catch (err) {
      logger.error('Error loading insurer data', { error: err })
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }

  const loadAccountStats = async (insurerId: string) => {
    try {
      const { count: activeQuotes } = await supabase
        .from('quote_offers')
        .select('*', { count: 'exact', head: true })
        .eq('insurer_id', insurerId)
        .in('status', ['PENDING', 'APPROVED'])

      const { count: activePolicies } = await supabase
        .from('policies')
        .select('*', { count: 'exact', head: true })
        .eq('insurer_id', insurerId)
        .eq('status', 'ACTIVE')

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: policies } = await supabase
        .from('policies')
        .select('premium_amount, created_at')
        .eq('insurer_id', insurerId)
        .gte('created_at', startOfMonth.toISOString())

      const monthlyRevenue = policies?.reduce((sum, p) => sum + (p.premium_amount || 0), 0) || 0

      const { count: totalQuoteOffers } = await supabase
        .from('quote_offers')
        .select('*', { count: 'exact', head: true })
        .eq('insurer_id', insurerId)

      const conversionRate = totalQuoteOffers && totalQuoteOffers > 0
        ? Math.round((activePolicies || 0) / totalQuoteOffers * 100 * 10) / 10
        : 0

      setAccountStats({
        activeQuotes: activeQuotes || 0,
        activePolicies: activePolicies || 0,
        monthlyRevenue,
        conversionRate,
      })
    } catch (err) {
      logger.error('Error loading account stats', { error: err })
    }
  }

  const loadRecentActivity = async (insurerId: string) => {
    try {
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', 'insurer')
        .eq('resource_id', insurerId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (auditLogs) {
        const activity = auditLogs.map(log => ({
          id: log.id,
          action: log.action || 'Action',
          description: log.new_values?.toString() || 'Action effectuée',
          timestamp: new Date(log.created_at),
        }))
        setRecentActivity(activity)
      }
    } catch (err) {
      logger.error('Error loading recent activity', { error: err })
      setRecentActivity([])
    }
  }

  const handleSectionChange = useCallback((section: SettingsSection) => {
    if (section === activeSection) return

    const hasUnsavedChanges = Object.keys(unsavedChanges).some(
      key => unsavedChanges[key as keyof UnsavedChanges] && key !== 'security'
    )

    if (hasUnsavedChanges) {
      setPendingNavigation(section)
      setShowUnsavedDialog(true)
    } else {
      setActiveSection(section)
      setShowMobileNav(false)
    }
  }, [activeSection, unsavedChanges])

  const handleConfirmNavigation = () => {
    setShowUnsavedDialog(false)
    if (pendingNavigation) {
      setActiveSection(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  // Save handlers
  const handleSaveCompanyInfo = async () => {
    try {
      setIsSaving('company')
      const { data: insurerData } = await supabase.rpc('get_current_insurer_id')
      if (!insurerData || insurerData.length === 0) throw new Error('Insurer not found')

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
          contact_address: companyInfo.address,
          license_number: companyInfo.licenseNumber,
        })
        .eq('id', insurerId)

      if (error) throw error

      originalDataRef.current.company = { ...companyInfo }
      setSaveSuccess('company')
      setTimeout(() => setSaveSuccess(null), 3000)

      toast({ title: 'Succès', description: 'Informations sauvegardées' })
    } catch (err) {
      logger.error('Error saving company info', { error: err })
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les informations',
      })
    } finally {
      setIsSaving(null)
    }
  }

  const handleLogoUpload = async (file: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Format non supporté' })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Image trop grande (max 5MB)' })
      return
    }

    try {
      setIsUploadingLogo(true)
      setUploadProgress(0)

      const { data: insurerData } = await supabase.rpc('get_current_insurer_id')
      if (!insurerData || insurerData.length === 0) throw new Error('Insurer not found')

      const insurerId = insurerData[0].insurer_id
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `${insurerId}.${fileExt}`

      // Remove existing logos
      try {
        await supabase.storage.from('insurer-logos').remove([
          `${insurerId}.png`, `${insurerId}.jpg`, `${insurerId}.jpeg`, `${insurerId}.webp`, `${insurerId}.svg`
        ])
      } catch {}

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('insurer-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      setUploadProgress(100)

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/insurer-logos/${fileName}`

      setCompanyInfo({ ...companyInfo, logoUrl })

      await supabase.from('insurers').update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', insurerId)

      toast({ title: 'Succès', description: 'Logo téléchargé' })
    } catch (err) {
      logger.error('Error uploading logo', { error: err })
      toast({ variant: 'destructive', title: 'Erreur', description: 'Erreur lors du téléchargement' })
    } finally {
      setIsUploadingLogo(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Calculate profile completion
  const profileCompletion = Object.values(companyInfo).filter(v => v && v.length > 0).length / Object.keys(companyInfo).length * 100

  if (isLoading && !companyInfo.name) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            </div></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const hasUnsavedChanges = Object.keys(unsavedChanges).some(key => unsavedChanges[key as keyof UnsavedChanges])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Page Actions Bar */}
      <div className="border-b bg-background/80 backdrop-blur-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gérez votre compte assureur</p>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Button onClick={() => {
                  if (unsavedChanges.company) handleSaveCompanyInfo()
                }} className="gap-2">
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Profile Completion Card */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Complétion</span>
                    <span className="font-medium">{Math.round(profileCompletion)}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                  {profileCompletion < 100 && (
                    <p className="text-xs text-muted-foreground">
                      Complétez votre profil pour apparaître dans les recherches
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card className="p-2">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    const hasChanges = unsavedChanges[item.id as keyof UnsavedChanges]

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSectionChange(item.id as SettingsSection)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }
                        `}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {hasChanges && <div className="h-2 w-2 rounded-full bg-orange-500" />}
                          {isActive && <ChevronRight className="h-4 w-4" />}
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Devis actifs</p>
                          <p className="text-3xl font-bold mt-2">{accountStats.activeQuotes}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Polices actives</p>
                          <p className="text-3xl font-bold mt-2">{accountStats.activePolicies}</p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenu mensuel</p>
                          <p className="text-3xl font-bold mt-2">{accountStats.monthlyRevenue.toLocaleString()} FCFA</p>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion</p>
                          <p className="text-3xl font-bold mt-2">{accountStats.conversionRate}%</p>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                          <Calculator className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Company Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Profil entreprise</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => handleSectionChange('company')}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 ring-2 ring-muted">
                          {companyInfo.logoUrl ? (
                            <AvatarImage src={companyInfo.logoUrl} />
                          ) : (
                            <AvatarFallback>
                              <Building2 className="h-8 w-8" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{companyInfo.name || 'Non défini'}</p>
                          <p className="text-sm text-muted-foreground">{companyInfo.contactEmail}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            Téléphone
                          </span>
                          <span className="font-medium">{companyInfo.phone || 'Non défini'}</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Licence N°
                          </span>
                          <span className="font-medium">{companyInfo.licenseNumber || 'Non défini'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Activité récente</CardTitle>
                      <Button variant="ghost" size="sm">
                        <History className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                          {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex gap-3">
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{activity.action}</p>
                                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {activity.timestamp.toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Aucune activité récente</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Company Section */}
            {activeSection === 'company' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informations entreprise
                  </CardTitle>
                  <CardDescription>
                    Ces informations seront visibles par vos clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Logo Upload */}
                  <div className="flex flex-col sm:flex-row gap-6 p-6 border rounded-xl bg-muted/30">
                    <div className="relative group mx-auto sm:mx-0">
                      <div className="w-32 h-32 rounded-xl bg-background border-2 border-dashed flex items-center justify-center overflow-hidden">
                        {companyInfo.logoUrl ? (
                          <>
                            <img src={companyInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            {!isUploadingLogo && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Changer
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-4">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground text-center">
                              PNG, JPG, WebP<br />Max 5MB
                            </p>
                          </div>
                        )}
                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <Label>Logo de l'entreprise</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Téléchargez votre logo pour apparaître sur vos devis et documents
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choisir un fichier
                        </Button>

                        {companyInfo.logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setCompanyInfo({ ...companyInfo, logoUrl: '' })
                              toast({ title: 'Logo retiré' })
                            }}
                            disabled={isUploadingLogo}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {isUploadingLogo && uploadProgress > 0 && (
                        <div className="space-y-2">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Téléchargement... {Math.round(uploadProgress)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de la compagnie *</Label>
                      <Input
                        id="name"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                        placeholder="Ex: Assurance Générale de Côte d'Ivoire"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">Numéro de licence</Label>
                      <Input
                        id="licenseNumber"
                        value={companyInfo.licenseNumber}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, licenseNumber: e.target.value })}
                        placeholder="Ex: LIC-2024-001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email de contact *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contactEmail"
                          type="email"
                          value={companyInfo.contactEmail}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, contactEmail: e.target.value })}
                          placeholder="contact@agci.ci"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={companyInfo.phone}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                          placeholder="+225 27 22 XX XX XX"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Site web</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          value={companyInfo.website}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                          placeholder="https://www.agci.ci"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          value={companyInfo.address}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                          placeholder="Abidjan, Côte d'Ivoire"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={companyInfo.description}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                      placeholder="Décrivez votre compagnie d'assurance..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCompanyInfo(originalDataRef.current.company)}
                      disabled={!unsavedChanges.company || isSaving === 'company'}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={handleSaveCompanyInfo}
                      disabled={!unsavedChanges.company || isSaving === 'company'}
                    >
                      {isSaving === 'company' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Préférences de notification
                  </CardTitle>
                  <CardDescription>
                    Choisissez comment vous souhaitez être notifié
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Notifications par email</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recevez les notifications importantes par email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailQuotes}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, emailQuotes: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Notifications SMS</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recevez les alertes urgentes par SMS
                        </p>
                      </div>
                      <Switch
                        checked={notifications.smsQuotes}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, smsQuotes: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Notifications push</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Recevez les notifications dans le navigateur
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setNotifications(originalDataRef.current.notifications)}
                      disabled={!unsavedChanges.notifications || isSaving === 'notifications'}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setIsSaving('notifications')
                          const { data } = await supabase.rpc('get_current_insurer_id')
                          if (!data || data.length === 0) throw new Error('Insurer not found')
                          await supabase.from('user_metadata').upsert({
                            user_id: user?.id,
                            notification_preferences: notifications,
                          })
                          originalDataRef.current.notifications = { ...notifications }
                          toast({ title: 'Notifications sauvegardées' })
                        } catch (err) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder' })
                        } finally {
                          setIsSaving(null)
                        }
                      }}
                      disabled={!unsavedChanges.notifications || isSaving === 'notifications'}
                    >
                      {isSaving === 'notifications' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sécurité
                  </CardTitle>
                  <CardDescription>
                    Gérez la sécurité de votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Authentification à deux facteurs</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ajoutez une couche de sécurité supplémentaire
                      </p>
                    </div>
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Changer le mot de passe</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Mot de passe actuel</Label>
                        <Input
                          type="password"
                          value={security.currentPassword}
                          onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nouveau mot de passe</Label>
                        <Input
                          type="password"
                          value={security.newPassword}
                          onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirmer le mot de passe</Label>
                        <Input
                          type="password"
                          value={security.confirmPassword}
                          onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs' })
                          return
                        }
                        if (security.newPassword !== security.confirmPassword) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Les mots de passe ne correspondent pas' })
                          return
                        }
                        if (security.newPassword.length < 8) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères' })
                          return
                        }
                        try {
                          const { error } = await supabase.auth.updateUser({
                            password: security.newPassword,
                          })
                          if (error) throw error
                          toast({ title: 'Mot de passe mis à jour' })
                          setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' })
                        } catch (err) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le mot de passe' })
                        }
                      }}
                      disabled={!security.currentPassword || !security.newPassword || !security.confirmPassword}
                    >
                      Mettre à jour le mot de passe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tarification Section */}
            {activeSection === 'tarification' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Paramètres de tarification
                  </CardTitle>
                  <CardDescription>
                    Configurez vos règles de tarification par défaut
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="defaultMargin">Marge par défaut (%)</Label>
                      <Input
                        id="defaultMargin"
                        type="number"
                        min={0}
                        max={100}
                        value={tarification.defaultMargin}
                        onChange={(e) => setTarification({ ...tarification, defaultMargin: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Marge appliquée par défaut aux nouveaux devis</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minMargin">Marge minimum (%)</Label>
                      <Input
                        id="minMargin"
                        type="number"
                        min={0}
                        max={100}
                        value={tarification.minMargin}
                        onChange={(e) => setTarification({ ...tarification, minMargin: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Marge minimale acceptable</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxMargin">Marge maximum (%)</Label>
                      <Input
                        id="maxMargin"
                        type="number"
                        min={0}
                        max={100}
                        value={tarification.maxMargin}
                        onChange={(e) => setTarification({ ...tarification, maxMargin: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Marge maximale autorisée</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">Taux de commission (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min={0}
                        max={100}
                        value={tarification.commissionRate}
                        onChange={(e) => setTarification({ ...tarification, commissionRate: Number(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">Commission sur les contrats vendus</p>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Application automatique des règles</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Applique automatiquement les règles de tarification aux nouveaux devis
                        </p>
                      </div>
                      <Switch
                        checked={tarification.autoApplyRules}
                        onCheckedChange={(checked) => setTarification({ ...tarification, autoApplyRules: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setTarification(originalDataRef.current.tarification)}
                      disabled={!unsavedChanges.tarification}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setIsSaving('tarification')
                          const { data } = await supabase.rpc('get_current_insurer_id')
                          if (!data || data.length === 0) throw new Error('Insurer not found')
                          await supabase.from('user_metadata').upsert({
                            user_id: user?.id,
                            tarification_settings: tarification,
                          })
                          originalDataRef.current.tarification = { ...tarification }
                          toast({ title: 'Paramètres sauvegardés' })
                        } catch (err) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder' })
                        } finally {
                          setIsSaving(null)
                        }
                      }}
                      disabled={!unsavedChanges.tarification || isSaving === 'tarification'}
                    >
                      {isSaving === 'tarification' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Préférences d'affichage
                  </CardTitle>
                  <CardDescription>
                    Personnalisez votre expérience utilisateur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Thème</Label>
                      <select
                        id="theme"
                        value={preferences.theme}
                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="system">Système</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Langue</Label>
                      <select
                        id="language"
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Devise</Label>
                      <select
                        id="currency"
                        value={preferences.currency}
                        onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="XOF">FCFA (XOF)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dollar (USD)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <select
                        id="timezone"
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="Africa/Abidjan">Afrique/Abidjan (UTC+0)</option>
                        <option value="Africa/Dakar">Afrique/Dakar (UTC+0)</option>
                        <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setPreferences(originalDataRef.current.preferences)}
                      disabled={!unsavedChanges.preferences}
                    >
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          setIsSaving('preferences')
                          const { data } = await supabase.rpc('get_current_insurer_id')
                          if (!data || data.length === 0) throw new Error('Insurer not found')
                          await supabase.from('user_metadata').upsert({
                            user_id: user?.id,
                            preferences,
                          })
                          originalDataRef.current.preferences = { ...preferences }
                          toast({ title: 'Préférences sauvegardées' })
                        } catch (err) {
                          toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder' })
                        } finally {
                          setIsSaving(null)
                        }
                      }}
                      disabled={!unsavedChanges.preferences || isSaving === 'preferences'}
                    >
                      {isSaving === 'preferences' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {activeSection === 'danger' && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Zone de danger
                  </CardTitle>
                  <CardDescription>
                    Actions irréversibles sur votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-destructive/50 rounded-lg space-y-4">
                    <div>
                      <h4 className="font-medium">Exporter mes données</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Téléchargez toutes vos données au format JSON
                      </p>
                    </div>
                    <Button variant="outline" onClick={async () => {
                      const data = { companyInfo, notifications, preferences }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `insurer-data-${Date.now()}.json`
                      a.click()
                      toast({ title: 'Données exportées' })
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>

                  <Separator />

                  <div className="p-4 border border-destructive/50 rounded-lg space-y-4">
                    <div>
                      <h4 className="font-medium text-destructive">Supprimer le compte</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cette action est irréversible. Toutes vos données seront supprimées.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder avant de continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false)
              if (pendingNavigation) {
                setActiveSection(pendingNavigation)
                setPendingNavigation(null)
              }
            }}>
              Ignorer
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowUnsavedDialog(false)
              if (unsavedChanges.company) await handleSaveCompanyInfo()
              if (pendingNavigation) {
                setActiveSection(pendingNavigation)
                setPendingNavigation(null)
              }
            }}>
              Sauvegarder et continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                setIsDeleting(true)
                // TODO: Implement account deletion
                setIsDeleting(false)
                setShowDeleteDialog(false)
                toast({ title: 'Compte supprimé' })
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default InsurerSettingsPage
