import { useState } from 'react'
import { Shield, Eye, EyeOff, Mail, Lock, AlertCircle, Info } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useSecurityContext } from '@/hooks/useSecurityContext'
import { Captcha } from '@/components/auth/Captcha'
import { loginSchema, type LoginFormData } from '@/lib/zod-schemas'
import { logger } from '@/lib/logger'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { toast } = useToast()
  const { securityContext, assessRisk, addSecurityAlert } = useSecurityContext()

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null)
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    try {
      loginSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof Error) {
        // Handle Zod validation errors
        const fieldErrors: Partial<LoginFormData> = {}
        const errorData = error.message

        // Simple error parsing (in real app, use proper Zod error handling)
        if (errorData.includes('email')) fieldErrors.email = errorData
        if (errorData.includes('mot de passe')) fieldErrors.password = errorData

        setErrors(fieldErrors)
      }
      return false
    }
  }

  // Évaluer le risque quand l'email change
  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, email: value }))

    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }

    // Évaluer le risque si l'email est valide
    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const { risk, captchaRequired } = await assessRisk(value)
      setShowCaptcha(captchaRequired)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, password: value }))

    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }

  const handleCaptchaVerify = (success: boolean) => {
    setCaptchaVerified(success)
    if (!success) {
      toast({
        title: 'Vérification échouée',
        description: 'Veuillez réessayer la vérification de sécurité',
        variant: 'destructive'
      })
    }
  }

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    logger.auth('🚀 LoginPage.handleSubmit appelé')
    logger.auth('📧 Email:', formData.email)
    logger.auth('🔑 Password:', formData.password ? '[REDACTED]' : 'EMPTY')

    if (!validateForm()) {
      logger.auth('❌ Validation du formulaire échouée')
      return
    }

    // Vérifier le CAPTCHA si requis
    if (showCaptcha && !captchaVerified) {
      toast({
        title: 'Vérification requise',
        description: 'Veuillez compléter la vérification de sécurité',
        variant: 'destructive'
      })
      return
    }

    logger.auth('✅ Formulaire validé, début de la connexion...')
    setIsLoading(true)
    setRateLimitInfo(null)
    setSecurityAlerts([])

    try {
      // Préparer le contexte de sécurité
      const securityContextData = {
        ip: securityContext.ipInfo.ip,
        userAgent: navigator.userAgent,
        deviceFingerprint: securityContext.deviceFingerprint
      }

      logger.auth('📞 Appel de la fonction login du contexte...')
      const result = await login(formData.email, formData.password, securityContextData)

      // Vérifier si la connexion est bloquée par le rate limiting
      if (result.rateLimitInfo && !result.rateLimitInfo.allowed) {
        setRateLimitInfo(result.rateLimitInfo)

        const lockoutMinutes = result.rateLimitInfo.lockoutTime
          ? Math.ceil((result.rateLimitInfo.lockoutTime - Date.now()) / 60000)
          : 15

        toast({
          title: 'Trop de tentatives',
          description: `Compte temporairement verrouillé pour ${lockoutMinutes} minutes. Veuillez réessayer plus tard.`,
          variant: 'destructive'
        })
        return
      }

      // Vérifier si un CAPTCHA est requis
      if (result.captchaRequired) {
        setShowCaptcha(true)
        toast({
          title: 'Vérification de sécurité',
          description: 'Veuillez compléter la vérification CAPTCHA pour continuer',
        })
        return
      }

      logger.auth('✅ Login réussi, utilisateur:', result.user)

      // Gérer les alertes de sécurité
      if (result.securityAlerts && result.securityAlerts.length > 0) {
        setSecurityAlerts(result.securityAlerts)

        const criticalAlerts = result.securityAlerts.filter(a => a.severity === 'critical')
        if (criticalAlerts.length > 0) {
          toast({
            title: 'Alerte de sécurité',
            description: 'Des activités suspectes ont été détectées. Vérifiez vos informations de connexion.',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Information de sécurité',
            description: 'Nouvelle connexion détectée. Si ce n\'était pas vous, sécurisez votre compte.',
            variant: 'default'
          })
        }
      }

      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue sur NOLI Assurance',
      })

      logger.auth('🔄 Préparation de la redirection...')
      // Redirect by role after successful login
      const redirectMap: Record<typeof result.user.role, string> = {
        USER: '/tableau-de-bord',
        INSURER: '/assureur/tableau-de-bord',
        ADMIN: '/admin/tableau-de-bord',
      }
      logger.auth('🗺️ Map de redirection:', redirectMap)
      logger.auth('👤 Rôle utilisateur:', result.user.role)

      const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname
      logger.auth('📍 From path:', fromPath)

      const targetPath = fromPath || redirectMap[result.user.role]
      logger.auth('🎯 Cible de redirection:', targetPath)

      if (fromPath) {
        if (result.user.role === 'ADMIN') {
          const targetPath = fromPath.startsWith('/admin/') ? fromPath : redirectMap[result.user.role]
          logger.auth('➡️ Redirection ADMIN vers:', targetPath)
          navigate(targetPath, { replace: true })
        } else if (result.user.role === 'INSURER') {
          const targetPath = fromPath.startsWith('/assureur/') ? fromPath : redirectMap[result.user.role]
          logger.auth('➡️ Redirection INSURER vers:', targetPath)
          navigate(targetPath, { replace: true })
        } else if (result.user.role === 'USER') {
          if (!fromPath.startsWith('/admin/') && !fromPath.startsWith('/assureur/')) {
            logger.auth('➡️ Redirection USER vers:', fromPath)
            navigate(fromPath, { replace: true })
          } else {
            logger.auth('➡️ Redirection USER vers dashboard:', redirectMap[result.user.role])
            navigate(redirectMap[result.user.role], { replace: true })
          }
        }
      } else {
        logger.auth('➡️ Redirection vers dashboard par défaut:', redirectMap[result.user.role])
        navigate(redirectMap[result.user.role], { replace: true })
      }
    } catch (error) {
      logger.error('❌ Erreur de connexion:', error)
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Email ou mot de passe incorrect',
        variant: 'destructive',
      })
    } finally {
      logger.auth('🏁 Fin du processus de connexion')
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 px-4'>
      <div className='w-full max-w-md space-y-6'>
        {/* Logo */}
        <Link to='/' className='flex items-center justify-center gap-2'>
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
            <CardTitle className='text-2xl font-bold text-center'>Connexion</CardTitle>
            <p className='text-muted-foreground text-center'>Connectez-vous à votre compte NOLI</p>
          </CardHeader>

          <CardContent className='space-y-4'>
            <form onSubmit={handleSubmit} className='space-y-4' noValidate>
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
                    onChange={handleEmailChange}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    autoComplete='email'
                    required
                  />
                </div>
                {errors.email && (
                  <div id='email-error' className='flex items-center gap-1 text-sm text-destructive' role='alert'>
                    <AlertCircle className='h-4 w-4' aria-hidden='true' />
                    <span>{errors.email}</span>
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
                    onChange={handlePasswordChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    autoComplete='current-password'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                    disabled={isLoading}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
                {errors.password && (
                  <div id='password-error' className='flex items-center gap-1 text-sm text-destructive' role='alert'>
                    <AlertCircle className='h-4 w-4' aria-hidden='true' />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className='flex items-center justify-between text-sm'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    className='rounded border-border'
                    aria-describedby='remember-help'
                  />
                  <span className='text-muted-foreground'>Se souvenir de moi</span>
                </label>
                <Link to='/auth/mot-de-passe-oublie' className='text-primary hover:underline'>
                  Mot de passe oublié?
                </Link>
              </div>

              {/* Alertes de sécurité */}
              {rateLimitInfo && !rateLimitInfo.allowed && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Trop de tentatives de connexion. Compte verrouillé temporairement.
                    {rateLimitInfo.lockoutTime && (
                      <span className="block mt-1">
                        Réessayez dans {Math.ceil((rateLimitInfo.lockoutTime - Date.now()) / 60000)} minutes.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {securityAlerts.length > 0 && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {securityAlerts.length} alertes de sécurité détectées lors de cette connexion.
                  </AlertDescription>
                </Alert>
              )}

              {/* CAPTCHA */}
              {showCaptcha && (
                <div className="mb-4">
                  <Captcha
                    onVerify={handleCaptchaVerify}
                    riskLevel={securityContext.riskLevel}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full'
                disabled={isLoading || (showCaptcha && !captchaVerified)}
                aria-describedby={isLoading ? 'submit-status' : undefined}
              >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className='text-center text-sm'>
          <span className='text-muted-foreground'>Pas encore de compte? </span>
          <Link to='/auth/inscription' className='text-primary hover:underline font-medium'>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
