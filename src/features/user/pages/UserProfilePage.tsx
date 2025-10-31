import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  Camera,
  Lock,
  Bell,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Car,
  Activity,
  Settings,
  Globe,
  Smartphone,
  Monitor,
  Plus,
  Eye,
  Key,
  Fingerprint,
  Smartphone as SmartphoneIcon,
  MapPin as MapPinIcon,
  Trash2,
  AlertCircle as AlertCircleIcon,
  AlertTriangle,
  QrCode,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useUser } from '@/contexts/UserContext'
import { useAuth } from '@/contexts/AuthContext'

interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  avatar?: string
  role: 'USER' | 'INSURER' | 'ADMIN'
  createdAt: Date
  updatedAt: Date
  isEmailVerified: boolean
  isPhoneVerified: boolean
  lastLogin: Date
  preferences: {
    language: string
    timezone: string
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    privacy: {
      profileVisible: boolean
      showEmail: boolean
      showPhone: boolean
    }
  }
  statistics: {
    totalQuotes: number
    activePolicies: number
    totalClaims: number
    memberSince: Date
  }
  documents: Array<{
    id: string
    name: string
    type: string
    uploadedAt: Date
    size: number
  }>
  paymentMethods: Array<{
    id: string
    type: 'card' | 'mobile_money' | 'bank_transfer'
    last4?: string
    expiryMonth?: number
    expiryYear?: number
    isDefault: boolean
  }>
}

const UserProfilePage = () => {
  const { profile, isLoading: profileLoading, updateProfile: updateProfileData } = useUser()
  const { user: authUser } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [twoFactorData, setTwoFactorData] = useState({
    method: 'sms' as 'sms' | 'app',
    phoneNumber: '',
    code: '',
  })
  const [twoFAMethod, setTwoFAMethod] = useState<'sms' | 'app'>('sms')
  const [twoFAPhone, setTwoFAPhone] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [userLocation, setUserLocation] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    email: '',
  })

  // Données par défaut si profile n'est pas encore chargé
  const defaultUserData: UserProfile = {
    id: authUser?.id || '',
    email: authUser?.email || '',
    firstName: profile?.firstName || authUser?.firstName || '',
    lastName: profile?.lastName || authUser?.lastName || '',
    phone: profile?.phone || authUser?.phone || '',
    address: '',
    role: authUser?.role || 'USER',
    createdAt: authUser?.createdAt || new Date(),
    updatedAt: new Date(),
    isEmailVerified: true,
    isPhoneVerified: !!profile?.phone,
    lastLogin: new Date(),
    preferences: {
      language: 'fr',
      timezone: 'Africa/Abidjan',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false,
      },
    },
    statistics: {
      totalQuotes: 0,
      activePolicies: 0,
      totalClaims: 0,
      memberSince: authUser?.createdAt || new Date(),
    },
    documents: [],
    paymentMethods: [],
  }

  useEffect(() => {
    // Initialiser formData avec les données réelles
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        address: '',
        email: profile.email || authUser?.email || '',
      })
    } else if (authUser) {
      setFormData({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        phone: authUser.phone || '',
        address: '',
        email: authUser.email || '',
      })
    }
  }, [profile, authUser])

  const handleSaveProfile = async () => {
    try {
      await updateProfileData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })

      setIsEditing(false)
      toast.success('Profil mis à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil')
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsChangingPassword(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setShowPasswordDialog(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Mot de passe changé avec succès')
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleEnable2FA = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setShow2FADialog(false)
      toast.success('Authentification à deux facteurs activée')
    } catch (error) {
      toast.error("Erreur lors de l'activation de la 2FA")
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Demande de suppression de compte envoyée')
      setShowDeleteAccountDialog(false)
    } catch (error) {
      toast.error('Erreur lors de la demande de suppression')
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      toast.success('Photo de profil téléchargée avec succès')
    }
  }

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      toast.success('Document téléchargé avec succès')
    }
  }

  const handleViewDocument = (document: any) => {
    toast.success(`Ouverture du document: ${document.name}`)
    // In a real app, this would open the document in a new tab or modal
    window.open('#', '_blank')
  }

  const handleDownloadDocument = (document: any) => {
    toast.success(`Téléchargement du document: ${document.name}`)
    // In a real app, this would trigger the actual download
  }

  const handleDeleteDocument = (documentId: string) => {
    if (currentUser) {
      toast.success('Document supprimé avec succès')
    }
  }

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (twoFAMethod === 'sms') {
        toast.success('Code SMS envoyé avec succès')
      } else {
        toast.success('Authentification à deux facteurs activée')
      }
      setShow2FADialog(false)
    } catch (error) {
      toast.error("Erreur lors de l'activation de la 2FA")
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Adresse mise à jour avec succès')
      setShowLocationDialog(false)
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'adresse")
    } finally {
      setIsUpdatingLocation(false)
    }
  }

  const handleUpdatePreferences = async (key: string, value: any) => {
    if (!currentUser) return

    try {
      toast.success('Préférences mises à jour')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des préférences')
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

  // Combiner les données des contextes
  const currentUser = defaultUserData

  if (profileLoading && !currentUser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-gray-600'>Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <p className='text-gray-600'>Utilisateur non connecté</p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold'>Mon Profil</h1>
          <p className='text-muted-foreground text-sm sm:text-base'>
            Gérez vos informations personnelles et préférences
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline' className='w-full sm:w-auto'>
              <Edit className='w-4 h-4 mr-2' />
              <span className='hidden sm:inline'>Modifier le profil</span>
              <span className='sm:hidden'>Modifier</span>
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Modifier mes informations</DialogTitle>
              <DialogDescription>Mettez à jour vos informations personnelles</DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='firstName'>Prénom</Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='lastName'>Nom</Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor='phone'>Téléphone</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor='address'>Adresse</Label>
                <Textarea
                  id='address'
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className='w-4 h-4 mr-2' />
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
        <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
          <DialogTrigger asChild>
            <Button variant='outline' size='sm' className='w-full sm:w-auto'>
              <MapPinIcon className='h-4 w-4 mr-2' />
              <span className='hidden sm:inline'>Modifier l'adresse</span>
              <span className='sm:hidden'>Adresse</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier mon adresse</DialogTitle>
              <DialogDescription>Mettez à jour votre adresse de résidence</DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='address'>Nouvelle adresse</Label>
                <Textarea
                  id='address'
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder='Entrez votre nouvelle adresse'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowLocationDialog(false)}>
                Annuler
              </Button>
              <Button onClick={() => handleUpdateLocation()}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <DialogTrigger asChild>
            <Button variant='destructive' size='sm' className='w-full sm:w-auto'>
              <Trash2 className='h-4 w-4 mr-2' />
              <span className='hidden sm:inline'>Supprimer mon compte</span>
              <span className='sm:hidden'>Supprimer</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer mon compte</DialogTitle>
              <DialogDescription>
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </DialogDescription>
            </DialogHeader>
            <Alert>
              <AlertCircleIcon className='h-4 w-4' />
              <AlertDescription>
                La suppression de votre compte entraînera la perte de tous vos contrats, devis et
                historiques.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowDeleteAccountDialog(false)}>
                Annuler
              </Button>
              <Button variant='destructive' onClick={handleDeleteAccount}>
                Confirmer la suppression
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center space-x-4'>
              <div className='relative'>
                <Avatar className='w-16 h-16 sm:w-20 sm:h-20'>
                  <AvatarImage src={currentUser.avatar} alt={currentUser.firstName} />
                  <AvatarFallback className='text-sm sm:text-lg'>
                    {getInitials(currentUser.firstName, currentUser.lastName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size='sm'
                  className='absolute -bottom-2 -right-2 rounded-full w-6 h-6 sm:w-8 sm:h-8 p-0'
                  variant='outline'
                >
                  <Camera className='h-3 w-3 sm:h-4 sm:w-4' />
                </Button>
              </div>
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <h2 className='text-lg sm:text-xl font-semibold'>
                    {currentUser.firstName} {currentUser.lastName}
                  </h2>
                  {currentUser.isEmailVerified && (
                    <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500' />
                  )}
                </div>
                <p className='text-muted-foreground text-sm sm:text-base break-all'>
                  {currentUser.email}
                </p>
                <div className='flex flex-wrap items-center gap-1 sm:gap-2 mt-2'>
                  <Badge variant='outline' className='text-xs sm:text-sm'>
                    {currentUser.role}
                  </Badge>
                  <Badge variant='secondary' className='text-xs sm:text-sm'>
                    Membre depuis {currentUser.statistics.memberSince.toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Phone className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm break-all'>{currentUser.phone}</span>
                {currentUser.isPhoneVerified && (
                  <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-green-500' />
                )}
              </div>
              <div className='flex items-start space-x-2'>
                <MapPin className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                <span className='text-sm break-words'>{currentUser.address}</span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex items-start space-x-2'>
                <Calendar className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                <span className='text-sm'>
                  <span className='hidden sm:inline'>Dernière connexion:</span>
                  <span className='sm:hidden'>Dernière connexion:</span>
                  <br className='sm:hidden' />
                  {currentUser.lastLogin.toLocaleDateString('fr-FR')}{' '}
                  {currentUser.lastLogin.toLocaleTimeString('fr-FR')}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <Shield className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>Compte vérifié</span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Devis demandés</span>
                <span className='font-semibold text-sm'>{currentUser.statistics.totalQuotes}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Contrats actifs</span>
                <span className='font-semibold text-sm'>
                  {currentUser.statistics.activePolicies}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>Sinistres déclarés</span>
                <span className='font-semibold text-sm'>{currentUser.statistics.totalClaims}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4 sm:space-y-6'>
        <TabsList className='grid w-full grid-cols-2 sm:grid-cols-4 h-auto'>
          <TabsTrigger value='profile' className='text-xs sm:text-sm py-2 px-2 sm:px-4'>
            Informations
          </TabsTrigger>
          <TabsTrigger value='security' className='text-xs sm:text-sm py-2 px-2 sm:px-4'>
            Sécurité
          </TabsTrigger>
          <TabsTrigger value='preferences' className='text-xs sm:text-sm py-2 px-2 sm:px-4'>
            Préférences
          </TabsTrigger>
          <TabsTrigger value='documents' className='text-xs sm:text-sm py-2 px-2 sm:px-4'>
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Gérez vos informations de base et vos coordonnées</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <Label>Prénom</Label>
                  <div className='mt-1 p-2 sm:p-3 bg-muted rounded text-sm'>
                    {currentUser.firstName}
                  </div>
                </div>
                <div>
                  <Label>Nom</Label>
                  <div className='mt-1 p-2 sm:p-3 bg-muted rounded text-sm'>
                    {currentUser.lastName}
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className='mt-1 p-2 sm:p-3 bg-muted rounded text-sm break-all'>
                    {currentUser.email}
                  </div>
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <div className='mt-1 p-2 sm:p-3 bg-muted rounded text-sm'>
                    {currentUser.phone}
                  </div>
                </div>
              </div>
              <div>
                <Label>Adresse</Label>
                <div className='mt-1 p-2 sm:p-3 bg-muted rounded text-sm break-words'>
                  {currentUser.address}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Méthodes de paiement</CardTitle>
              <CardDescription>Gérez vos méthodes de paiement enregistrées</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {currentUser.paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <CreditCard className='h-5 w-5 text-muted-foreground' />
                    <div>
                      <div className='font-medium text-sm'>
                        {method.type === 'mobile_money' ? 'Mobile Money' : 'Carte bancaire'}
                      </div>
                      <div className='text-xs sm:text-sm text-muted-foreground'>
                        {method.type === 'mobile_money'
                          ? `****${method.last4}`
                          : `****${method.last4}`}
                        {method.type === 'card' &&
                          method.expiryMonth &&
                          method.expiryYear &&
                          ` - ${method.expiryMonth}/${method.expiryYear}`}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center justify-between sm:justify-end space-x-2'>
                    {method.isDefault && (
                      <Badge variant='default' className='text-xs'>
                        Par défaut
                      </Badge>
                    )}
                    <Button size='sm' variant='outline' className='text-xs'>
                      Modifier
                    </Button>
                  </div>
                </div>
              ))}
              <Button className='w-full' variant='outline'>
                <Plus className='w-4 h-4 mr-2' />
                <span className='text-sm'>Ajouter une méthode de paiement</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>Gérez la sécurité de votre compte NOLI</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <Alert>
                <Shield className='h-4 w-4' />
                <AlertDescription>
                  Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe
                  régulièrement et d'activer l'authentification à deux facteurs.
                </AlertDescription>
              </Alert>

              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <Lock className='h-5 w-5 text-gray-500' />
                    <div>
                      <div className='font-medium'>Mot de passe</div>
                      <div className='text-sm text-gray-500'>
                        Dernière modification: Il y a 3 mois
                      </div>
                    </div>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button variant='outline'>Changer le mot de passe</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Changer le mot de passe</DialogTitle>
                        <DialogDescription>
                          Entrez votre mot de passe actuel et choisissez un nouveau mot de passe
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div>
                          <Label htmlFor='currentPassword'>Mot de passe actuel</Label>
                          <Input
                            id='currentPassword'
                            type='password'
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, currentPassword: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor='newPassword'>Nouveau mot de passe</Label>
                          <Input
                            id='newPassword'
                            type='password'
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor='confirmPassword'>Confirmer le nouveau mot de passe</Label>
                          <Input
                            id='confirmPassword'
                            type='password'
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant='outline' onClick={() => setShowPasswordDialog(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleChangePassword}>
                          {isChangingPassword ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Mise à jour...
                            </>
                          ) : (
                            <>
                              <Key className='w-4 h-4 mr-2' />
                              Changer le mot de passe
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <Smartphone className='h-5 w-5 text-gray-500' />
                    <div>
                      <div className='font-medium'>Authentification à deux facteurs</div>
                      <div className='text-sm text-gray-500'>Non activée</div>
                    </div>
                  </div>
                  <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                    <DialogTrigger asChild>
                      <Button variant='outline'>Activer 2FA</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Activer l'authentification à deux facteurs</DialogTitle>
                        <DialogDescription>
                          Choisissez votre méthode d'authentification préférée
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div>
                          <Label>Méthode d'authentification</Label>
                          <Select
                            value={twoFactorData.method}
                            onValueChange={(value: 'sms' | 'app') =>
                              setTwoFactorData({ ...twoFactorData, method: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='sms'>SMS</SelectItem>
                              <SelectItem value='app'>Application d'authentification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {twoFactorData.method === 'sms' && (
                          <div>
                            <Label htmlFor='phoneNumber'>Numéro de téléphone</Label>
                            <Input
                              id='phoneNumber'
                              value={twoFactorData.phoneNumber || currentUser?.phone}
                              onChange={(e) =>
                                setTwoFactorData({ ...twoFactorData, phoneNumber: e.target.value })
                              }
                              placeholder='+225 XX XX XX XX XX'
                            />
                          </div>
                        )}
                        <div className='p-4 bg-blue-50 rounded-lg'>
                          <div className='flex items-center space-x-2'>
                            <Fingerprint className='h-5 w-5 text-blue-600' />
                            <div>
                              <div className='font-medium text-blue-900'>Instructions</div>
                              <div className='text-sm text-blue-700'>
                                {twoFactorData.method === 'sms'
                                  ? 'Vous recevrez un code par SMS à chaque connexion.'
                                  : "Scannez le QR code avec votre application d'authentification."}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor='code'>Code de vérification</Label>
                          <Input
                            id='code'
                            placeholder='Entrez le code reçu'
                            value={twoFactorData.code}
                            onChange={(e) =>
                              setTwoFactorData({ ...twoFactorData, code: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant='outline' onClick={() => setShow2FADialog(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleEnable2FA}>
                          <Fingerprint className='w-4 h-4 mr-2' />
                          Activer la 2FA
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <Mail className='h-5 w-5 text-gray-500' />
                    <div>
                      <div className='font-medium'>Email vérifié</div>
                      <div className='text-sm text-gray-500'>Votre email est vérifié</div>
                    </div>
                  </div>
                  <CheckCircle className='h-5 w-5 text-green-500' />
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex items-center space-x-3'>
                    <Phone className='h-5 w-5 text-gray-500' />
                    <div>
                      <div className='font-medium'>Téléphone vérifié</div>
                      <div className='text-sm text-gray-500'>Votre téléphone est vérifié</div>
                    </div>
                  </div>
                  <CheckCircle className='h-5 w-5 text-green-500' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique des connexions</CardTitle>
              <CardDescription>Consultez les récentes connexions à votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 border rounded'>
                  <div>
                    <div className='font-medium'>Cocody, Abidjan</div>
                    <div className='text-sm text-gray-500'>Chrome • Windows • Il y a 2 heures</div>
                  </div>
                  <Badge variant='outline'>Session actuelle</Badge>
                </div>
                <div className='flex items-center justify-between p-3 border rounded'>
                  <div>
                    <div className='font-medium'>Plateau, Abidjan</div>
                    <div className='text-sm text-gray-500'>Firefox • Mobile • Hier</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value='preferences' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Préférences de l'application</CardTitle>
              <CardDescription>Personnalisez votre expérience NOLI</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Langue et région</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label>Langue</Label>
                    <Select
                      value={currentUser.preferences.language}
                      onValueChange={(value) => handleUpdatePreferences('language', value)}
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
                  <div>
                    <Label>Fuseau horaire</Label>
                    <Select
                      value={currentUser.preferences.timezone}
                      onValueChange={(value) => handleUpdatePreferences('timezone', value)}
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
                <h4 className='text-lg font-semibold'>Apparence</h4>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label>Thème</Label>
                    <p className='text-sm text-muted-foreground'>Choisissez votre thème préféré</p>
                  </div>
                  <Select
                    value={currentUser.preferences.theme}
                    onValueChange={(value: 'light' | 'dark' | 'auto') =>
                      handleUpdatePreferences('theme', value)
                    }
                  >
                    <SelectTrigger className='w-32'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='light'>Clair</SelectItem>
                      <SelectItem value='dark'>Sombre</SelectItem>
                      <SelectItem value='auto'>Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Notifications</h4>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label>Notifications par email</Label>
                      <p className='text-sm text-muted-foreground'>
                        Recevez les notifications importantes par email
                      </p>
                    </div>
                    <Switch
                      checked={currentUser.preferences.notifications.email}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences('notifications', {
                          ...currentUser.preferences.notifications,
                          email: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label>Notifications push</Label>
                      <p className='text-sm text-muted-foreground'>
                        Recevez les notifications push dans le navigateur
                      </p>
                    </div>
                    <Switch
                      checked={currentUser.preferences.notifications.push}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences('notifications', {
                          ...currentUser.preferences.notifications,
                          push: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label>Notifications SMS</Label>
                      <p className='text-sm text-muted-foreground'>
                        Recevez les notifications importantes par SMS
                      </p>
                    </div>
                    <Switch
                      checked={currentUser.preferences.notifications.sms}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences('notifications', {
                          ...currentUser.preferences.notifications,
                          sms: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Confidentialité</h4>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label>Profil visible</Label>
                      <p className='text-sm text-muted-foreground'>
                        Rendez votre profil visible aux autres utilisateurs
                      </p>
                    </div>
                    <Switch
                      checked={currentUser.preferences.privacy.profileVisible}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences('privacy', {
                          ...currentUser.preferences.privacy,
                          profileVisible: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label>Afficher l'email</Label>
                      <p className='text-sm text-muted-foreground'>
                        Affichez votre email sur votre profil public
                      </p>
                    </div>
                    <Switch
                      checked={currentUser.preferences.privacy.showEmail}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences('privacy', {
                          ...currentUser.preferences.privacy,
                          showEmail: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <Label>Afficher le téléphone</Label>
                      <p className='text-sm text-muted-foreground'>
                        Affichez votre numéro sur votre profil public
                      </p>
                    </div>
                    <Switch
                      checked={currentUser.preferences.privacy.showPhone}
                      onCheckedChange={(checked) =>
                        handleUpdatePreferences('privacy', {
                          ...currentUser.preferences.privacy,
                          showPhone: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value='documents' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Mes documents</CardTitle>
              <CardDescription>Gérez vos documents personnels et administratifs</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
                <div>
                  <h4 className='font-medium text-sm sm:text-base'>Documents téléchargés</h4>
                  <p className='text-xs sm:text-sm text-muted-foreground'>
                    Gérez vos documents importants
                  </p>
                </div>
                <label htmlFor='document-upload'>
                  <Button variant='outline' asChild className='w-full sm:w-auto'>
                    <span>
                      <Upload className='w-4 h-4 mr-2' />
                      <span className='hidden sm:inline'>Télécharger un document</span>
                      <span className='sm:hidden'>Télécharger</span>
                    </span>
                  </Button>
                </label>
                <input
                  id='document-upload'
                  type='file'
                  className='hidden'
                  accept='.pdf,.jpg,.jpeg,.png'
                  onChange={handleDocumentUpload}
                />
              </div>

              <div className='space-y-3'>
                {currentUser.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg'
                  >
                    <div className='flex items-center space-x-3'>
                      <FileText className='h-5 w-5 text-muted-foreground' />
                      <div>
                        <div className='font-medium text-sm break-words'>{doc.name}</div>
                        <div className='text-xs sm:text-sm text-muted-foreground'>
                          {doc.type} • {(doc.size / 1024 / 1024).toFixed(2)} MB •{' '}
                          {doc.uploadedAt.toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-1 sm:space-x-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDownloadDocument(doc)}
                        className='px-2 sm:px-3'
                      >
                        <Download className='h-3 w-3 sm:h-4 sm:w-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleViewDocument(doc)}
                        className='px-2 sm:px-3'
                      >
                        <Eye className='h-3 w-3 sm:h-4 sm:w-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleDeleteDocument(doc.id)}
                        className='px-2 sm:px-3'
                      >
                        <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Données personnelles</CardTitle>
              <CardDescription>Téléchargez ou supprimez vos données personnelles</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription className='text-sm'>
                  Vous avez le droit de demander une copie de toutes vos données personnelles ou de
                  demander leur suppression.
                </AlertDescription>
              </Alert>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <Button
                  variant='outline'
                  className='h-auto p-3 sm:p-4 flex flex-col items-center space-y-2'
                >
                  <Download className='h-5 w-5 sm:h-6 sm:w-6' />
                  <span className='text-xs sm:text-sm'>Télécharger mes données</span>
                </Button>
                <Button
                  variant='outline'
                  className='h-auto p-3 sm:p-4 flex flex-col items-center space-y-2'
                >
                  <FileText className='h-5 w-5 sm:h-6 sm:w-6' />
                  <span className='text-xs sm:text-sm'>Demande de suppression</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Configuration de l'authentification à deux facteurs</DialogTitle>
            <DialogDescription>
              Sécurisez votre compte avec une authentification à deux facteurs
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <RadioGroup
                  value={twoFAMethod}
                  onValueChange={(value: 'sms' | 'app') => setTwoFAMethod(value)}
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='sms' id='sms' />
                    <Label htmlFor='sms'>SMS</Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='app' id='app' />
                    <Label htmlFor='app'>Application d'authentification</Label>
                  </div>
                </RadioGroup>
              </div>

              {twoFAMethod === 'sms' && (
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Numéro de téléphone</Label>
                  <Input
                    id='phone'
                    type='tel'
                    placeholder='+33 6 12 34 56 78'
                    value={twoFAPhone}
                    onChange={(e) => setTwoFAPhone(e.target.value)}
                  />
                </div>
              )}

              {twoFAMethod === 'app' && (
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>
                    Scannez ce QR code avec votre application d'authentification
                  </p>
                  <div className='flex justify-center p-4 bg-gray-100 rounded-lg'>
                    <div className='w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center'>
                      <QrCode className='h-16 w-16 text-gray-400' />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='code'>Code de vérification</Label>
                    <Input
                      id='code'
                      type='text'
                      placeholder='Entrez le code à 6 chiffres'
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShow2FADialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSetup2FA}>
              {isSettingUp2FA ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Configuration...
                </>
              ) : (
                'Activer 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Update Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Mettre à jour votre adresse</DialogTitle>
            <DialogDescription>
              Modifiez votre adresse et vos informations de localisation
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='address'>Adresse</Label>
              <Input
                id='address'
                value={userLocation.address}
                onChange={(e) => setUserLocation({ ...userLocation, address: e.target.value })}
                placeholder='123 rue de la République'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='city'>Ville</Label>
                <Input
                  id='city'
                  value={userLocation.city}
                  onChange={(e) => setUserLocation({ ...userLocation, city: e.target.value })}
                  placeholder='Paris'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='postalCode'>Code postal</Label>
                <Input
                  id='postalCode'
                  value={userLocation.postalCode}
                  onChange={(e) => setUserLocation({ ...userLocation, postalCode: e.target.value })}
                  placeholder='75001'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='country'>Pays</Label>
              <Input
                id='country'
                value={userLocation.country}
                onChange={(e) => setUserLocation({ ...userLocation, country: e.target.value })}
                placeholder='France'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowLocationDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateLocation}>
              {isUpdatingLocation ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='h-5 w-5' />
              Supprimer votre compte
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données seront supprimées définitivement.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <h4 className='font-medium text-red-800 mb-2'>Attention :</h4>
              <ul className='text-sm text-red-700 space-y-1'>
                <li>• Tous vos contrats d'assurance seront annulés</li>
                <li>• Vos données personnelles seront supprimées</li>
                <li>• Vos documents seront perdus</li>
                <li>• Cette action ne peut pas être annulée</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmDelete'>Tapez "SUPPRIMER" pour confirmer</Label>
              <Input
                id='confirmDelete'
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder='SUPPRIMER'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDeleteAccountDialog(false)}>
              Annuler
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'SUPPRIMER' || isDeletingAccount}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Suppression...
                </>
              ) : (
                'Supprimer mon compte'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserProfilePage
