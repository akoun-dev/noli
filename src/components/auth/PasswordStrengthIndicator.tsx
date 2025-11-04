/**
 * Composant d'indicateur de force de mot de passe
 * Affiche une évaluation visuelle en temps réel de la force du mot de passe
 */

import React from 'react'
import { Eye, EyeOff, Shield, ShieldCheck, AlertTriangle, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { validatePasswordStrength } from '@/lib/zod-schemas'

interface PasswordStrengthIndicatorProps {
  password: string
  showPassword?: boolean
  onTogglePassword?: () => void
  className?: string
}

interface RequirementItem {
  text: string
  isMet: boolean
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showPassword = false,
  onTogglePassword,
  className = ''
}) => {
  const strength = validatePasswordStrength(password)

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'weak':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = (score: number) => {
    if (score >= 60) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'strong':
        return <ShieldCheck className="h-5 w-5 text-green-600" />
      case 'medium':
        return <Shield className="h-5 w-5 text-yellow-600" />
      case 'weak':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Shield className="h-5 w-5 text-gray-400" />
    }
  }

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'Fort'
      case 'medium':
        return 'Moyen'
      case 'weak':
        return 'Faible'
      default:
        return 'Non évalué'
    }
  }

  const requirements: RequirementItem[] = [
    { text: 'Au moins 8 caractères', isMet: password.length >= 8 },
    { text: 'Bonus: 12+ caractères', isMet: password.length >= 12 },
    { text: 'Lettres minuscules (a-z)', isMet: /[a-z]/.test(password) },
    { text: 'Lettres majuscules (A-Z)', isMet: /[A-Z]/.test(password) },
    { text: 'Chiffres (0-9)', isMet: /[0-9]/.test(password) },
    { text: 'Caractères spéciaux (!@#$%^&*)', isMet: /[^a-zA-Z0-9]/.test(password) },
    { text: 'Pas de mot de passe commun', isMet: !/password|123456|qwerty|admin|abc123/i.test(password) },
    { text: 'Pas de répétitions (aaa, 111)', isMet: !/(.)\1{2,}/.test(password) },
    { text: 'Pas de séquences (abc, 123)', isMet: !/(?:abc|123|qwe)/i.test(password) }
  ]

  if (!password) {
    return null
  }

  return (
    <Card className={`mt-2 ${getStrengthColor(strength.strength)} ${className}`}>
      <CardContent className="p-4">
        {/* Header avec score et statut */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStrengthIcon(strength.strength)}
            <span className="font-semibold">Force du mot de passe:</span>
            <Badge variant="outline" className={getStrengthColor(strength.strength)}>
              {getStrengthText(strength.strength)} ({strength.score}/100)
            </Badge>
          </div>

          {onTogglePassword && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePassword}
              className="h-8 w-8 p-0"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mb-4">
          <Progress
            value={strength.score}
            className="h-2"
            // @ts-ignore - Custom color prop
            bgColor={getProgressColor(strength.score)}
          />
        </div>

        {/* Messages d'erreur */}
        {strength.errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <X className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Problèmes à corriger:</span>
            </div>
            <ul className="space-y-1">
              {strength.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exigences détaillées */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Exigences de sécurité:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {requirements.map((requirement, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 text-sm ${
                  requirement.isMet ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                {requirement.isMet ? (
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 border border-gray-300 rounded-sm flex-shrink-0" />
                )}
                <span className={requirement.isMet ? 'line-through' : ''}>
                  {requirement.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conseils de sécurité */}
        {strength.score < 60 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Conseils de sécurité:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Utilisez une combinaison de majuscules, minuscules, chiffres et symboles</li>
                  <li>• Évitez les informations personnelles (dates, noms, etc.)</li>
                  <li>• Créez un mot de passe unique pour ce compte</li>
                  <li>• Utilisez un gestionnaire de mots de passe pour vous en souvenir</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {strength.isValid && strength.score >= 80 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Excellent ! Votre mot de passe est très sécurisé.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PasswordStrengthIndicator