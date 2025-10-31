import { useState } from 'react'
import { Shield, Eye, EyeOff, User, Mail, Phone, Lock, AlertCircle, Building } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { registerSchema, type RegisterFormData } from '@/lib/zod-schemas'
import { z } from 'zod'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const fieldErrors: Partial<RegisterFormData> = {}

    // Validate email
    if (!formData.email.trim()) {
      fieldErrors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      fieldErrors.email = 'Email invalide'
    } else if (formData.email.length > 254) {
      fieldErrors.email = "L'email ne peut pas dépasser 254 caractères"
    }

    // Validate phone
    if (!formData.phone.trim()) {
      fieldErrors.phone = 'Le téléphone est requis'
    } else if (!/^(\+225)?[0-9]{10}$/.test(formData.phone)) {
      fieldErrors.phone = 'Numéro de téléphone invalide (format: +225XXXXXXXXXX ou XXXXXXXXXX)'
    }

    // Validate password with simplified rules
    if (!formData.password) {
      fieldErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      fieldErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      fieldErrors.confirmPassword = 'La confirmation du mot de passe est requise'
    } else if (formData.password !== formData.confirmPassword) {
      fieldErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    // Validate based on account type
    if (accountType === 'business') {
      if (!formData.companyName || formData.companyName.trim().length < 2) {
        fieldErrors.companyName = "Le nom de l'entreprise doit contenir au moins 2 caractères"
      } else if (formData.companyName.length > 100) {
        fieldErrors.companyName = "Le nom de l'entreprise ne peut pas dépasser 100 caractères"
      }
    } else {
      // Personal account
      if (!formData.firstName || formData.firstName.trim().length < 2) {
        fieldErrors.firstName = 'Le prénom doit contenir au moins 2 caractères'
      } else if (formData.firstName.length > 50) {
        fieldErrors.firstName = 'Le prénom ne peut pas dépasser 50 caractères'
      }

      if (!formData.lastName || formData.lastName.trim().length < 2) {
        fieldErrors.lastName = 'Le nom doit contenir au moins 2 caractères'
      } else if (formData.lastName.length > 50) {
        fieldErrors.lastName = 'Le nom ne peut pas dépasser 50 caractères'
      }
    }

    setErrors(fieldErrors)
    return Object.keys(fieldErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const user = await register(formData)

      toast({
        title: 'Inscription réussie',
        description: 'Votre compte a été créé avec succès',
      })

      // Redirect by role after successful registration
      const redirectMap: Record<typeof user.role, string> = {
        USER: '/tableau-de-bord',
        INSURER: '/assureur/tableau-de-bord',
        ADMIN: '/admin/tableau-de-bord',
      }
      navigate(redirectMap[user.role])
    } catch (error) {
      toast({
        title: "Erreur d'inscription",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (
    password: string
  ): { strength: number; text: string; color: string; suggestions: string[] } => {
    if (!password) return { strength: 0, text: '', color: '', suggestions: [] }

    let strength = 0
    const suggestions: string[] = []

    // Length check
    if (password.length >= 10) {
      strength += 3
    } else if (password.length >= 6) {
      strength += 2
    } else {
      suggestions.push('Le mot de passe est trop court (minimum 6 caractères)')
    }

    // Character variety (optional but increases strength)
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    let text, color
    if (strength <= 3) {
      text = 'Faible'
      color = 'bg-red-500'
    } else if (strength <= 5) {
      text = 'Moyen'
      color = 'bg-yellow-500'
    } else if (strength <= 7) {
      text = 'Bon'
      color = 'bg-blue-500'
    } else {
      text = 'Excellent'
      color = 'bg-green-500'
    }

    return { strength: (strength / 8) * 100, text, color, suggestions }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 px-4 py-8'>
      <div className='w-full max-w-lg'>
        {/* Logo */}
        <Link to='/' className='flex items-center justify-center gap-2 mb-6'>
          <div className='w-12 h-12 rounded-xl bg-primary flex items-center justify-center'>
            <Shield className='w-7 h-7 text-primary-foreground' />
          </div>
          <div className='flex flex-col'>
            <span className='font-bold text-2xl'>NOLI</span>
            <span className='text-xs text-muted-foreground'>Assurance Auto</span>
          </div>
        </Link>

        <Card className='shadow-xl'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center'>Créer un compte</CardTitle>
            <p className='text-muted-foreground text-center'>
              Rejoignez NOLI pour vos assurances auto
            </p>
          </CardHeader>

          <CardContent className='space-y-4'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Account Type Selection */}
              <div className='space-y-2'>
                <Label>Type de compte</Label>
                <Select
                  value={accountType}
                  onValueChange={(value: 'personal' | 'business') => setAccountType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Sélectionnez le type de compte' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='personal'>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        Compte personnel
                      </div>
                    </SelectItem>
                    <SelectItem value='business'>
                      <div className='flex items-center gap-2'>
                        <Building className='h-4 w-4' />
                        Compte professionnel/Assureur
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Name Fields */}
              {accountType === 'personal' ? (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>Prénom</Label>
                    <Input
                      id='firstName'
                      name='firstName'
                      type='text'
                      placeholder='Prénom'
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? 'border-destructive' : ''}
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <div className='flex items-center gap-1 text-sm text-destructive'>
                        <AlertCircle className='h-4 w-4' />
                        <span>{errors.firstName}</span>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Nom</Label>
                    <Input
                      id='lastName'
                      name='lastName'
                      type='text'
                      placeholder='Nom'
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? 'border-destructive' : ''}
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <div className='flex items-center gap-1 text-sm text-destructive'>
                        <AlertCircle className='h-4 w-4' />
                        <span>{errors.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <Label htmlFor='companyName'>Nom de l'entreprise d'assurance</Label>
                  <Input
                    id='companyName'
                    name='companyName'
                    type='text'
                    placeholder="Nom de la compagnie d'assurance"
                    value={formData.companyName || ''}
                    onChange={handleInputChange}
                    className={errors.companyName ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {errors.companyName && (
                    <div className='flex items-center gap-1 text-sm text-destructive'>
                      <AlertCircle className='h-4 w-4' />
                      <span>{errors.companyName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='votre@email.com'
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className='flex items-center gap-1 text-sm text-destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className='space-y-2'>
                <Label htmlFor='phone'>Téléphone</Label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    placeholder='+225XXXXXXXXXX'
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <div className='flex items-center gap-1 text-sm text-destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <span>{errors.phone}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <Label htmlFor='password'>Mot de passe</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Votre mot de passe'
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className='space-y-1'>
                    <div className='h-2 bg-muted rounded-full overflow-hidden'>
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Force du mot de passe: {passwordStrength.text}
                    </p>
                  </div>
                )}

                {errors.password && (
                  <div className='flex items-center gap-1 text-sm text-destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirmer le mot de passe</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirmez votre mot de passe'
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className='flex items-center gap-1 text-sm text-destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className='space-y-2'>
                <label className='flex items-start gap-2 cursor-pointer'>
                  <input type='checkbox' className='mt-1 rounded border-border' required />
                  <span className='text-sm text-muted-foreground'>
                    J'accepte les{' '}
                    <Link to='/conditions-generales' className='text-primary hover:underline'>
                      conditions générales d'utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link to='/politique-confidentialite' className='text-primary hover:underline'>
                      politique de confidentialité
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className='text-center text-sm'>
          <span className='text-muted-foreground'>Déjà un compte? </span>
          <Link to='/auth/connexion' className='text-primary hover:underline font-medium'>
            Se connecter
          </Link>
        </div>

        {/* Help Section */}
        <div className='text-center text-xs text-muted-foreground'>
          <p>
            Besoin d'aide?{' '}
            <Link to='/contact' className='text-primary hover:underline'>
              Contactez notre support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
