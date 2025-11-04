/**
 * Composant CAPTCHA Adaptatif
 * S'adapte selon le niveau de risque détecté par le SecurityManager
 */

import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Text, Box } from '@react-three/drei'
import { securityManager, type SecurityRisk } from '@/lib/security-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, Shield, ShieldCheck } from 'lucide-react'

interface CaptchaProps {
  onVerify: (success: boolean) => void
  riskLevel?: SecurityRisk
  className?: string
}

interface CaptchaChallenge {
  question: string
  answer: string
  type: 'math' | 'pattern' | 'logic'
  difficulty: 'easy' | 'medium' | 'hard'
}

const CaptchaChallenge: React.FC<{
  challenge: CaptchaChallenge
  onAnswer: (answer: string) => void
  disabled: boolean
}> = ({ challenge, onAnswer, disabled }) => {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return

    setIsSubmitting(true)
    onAnswer(answer.trim())

    // Délai pour éviter les soumissions multiples
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  if (challenge.type === 'math') {
    return (
      <div className="text-center space-y-4">
        <div className="text-2xl font-bold text-gray-800">
          {challenge.question}
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            placeholder="Votre réponse"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled || isSubmitting}
            className="w-full text-center text-lg"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={disabled || isSubmitting || !answer.trim()}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
          </Button>
        </form>
      </div>
    )
  }

  if (challenge.type === 'pattern') {
    return <PatternCaptcha challenge={challenge} onAnswer={onAnswer} disabled={disabled} />
  }

  return <LogicCaptcha challenge={challenge} onAnswer={onAnswer} disabled={disabled} />
}

const PatternCaptcha: React.FC<{
  challenge: CaptchaChallenge
  onAnswer: (answer: string) => void
  disabled: boolean
}> = ({ challenge, onAnswer, disabled }) => {
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const gridSize = challenge.difficulty === 'easy' ? 3 : challenge.difficulty === 'medium' ? 4 : 5

  const handleCellClick = (row: number, col: number) => {
    if (disabled || isSubmitting) return

    const key = `${row}-${col}`
    const newSelected = new Set(selectedCells)

    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }

    setSelectedCells(newSelected)
  }

  const handleSubmit = async () => {
    if (selectedCells.size === 0) return

    setIsSubmitting(true)
    const answer = Array.from(selectedCells).sort().join(',')
    onAnswer(answer)

    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 mb-2">
          Cliquez sur les cases pour former le pattern demandé :
        </p>
        <p className="text-xl font-bold text-blue-600">
          {challenge.question}
        </p>
      </div>

      <div className="flex justify-center">
        <div
          className="inline-grid gap-1 p-4 bg-gray-50 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const row = Math.floor(index / gridSize)
            const col = index % gridSize
            const key = `${row}-${col}`
            const isSelected = selectedCells.has(key)

            return (
              <button
                key={key}
                onClick={() => handleCellClick(row, col)}
                disabled={disabled || isSubmitting}
                className={`w-12 h-12 border-2 rounded transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-500 border-blue-600 text-white'
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                } ${disabled || isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                {isSelected ? '✓' : ''}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => setSelectedCells(new Set())}
          variant="outline"
          disabled={disabled || isSubmitting}
          className="flex-1"
        >
          Effacer
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || selectedCells.size === 0}
          className="flex-1"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
        </Button>
      </div>
    </div>
  )
}

const LogicCaptcha: React.FC<{
  challenge: CaptchaChallenge
  onAnswer: (answer: string) => void
  disabled: boolean
}> = ({ challenge, onAnswer, disabled }) => {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return

    setIsSubmitting(true)
    onAnswer(answer.trim())

    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">
          Question de logique :
        </p>
        <p className="text-xl font-bold text-blue-600 mt-2">
          {challenge.question}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          placeholder="Votre réponse"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full text-center"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !answer.trim()}
          className="w-full"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
        </Button>
      </form>
    </div>
  )
}

export const Captcha: React.FC<CaptchaProps> = ({ onVerify, riskLevel, className }) => {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const maxAttempts = 3

  const generateChallenge = (difficulty: 'easy' | 'medium' | 'hard'): CaptchaChallenge => {
    const challenges: Record<string, () => CaptchaChallenge> = {
      easy: () => {
        const a = Math.floor(Math.random() * 10) + 1
        const b = Math.floor(Math.random() * 10) + 1
        return {
          type: 'math',
          difficulty: 'easy',
          question: `${a} + ${b} = ?`,
          answer: String(a + b)
        }
      },
      medium: () => {
        const type = Math.random() > 0.5 ? 'math' : 'pattern'

        if (type === 'math') {
          const a = Math.floor(Math.random() * 20) + 10
          const b = Math.floor(Math.random() * 20) + 1
          return {
            type: 'math',
            difficulty: 'medium',
            question: `${a} - ${b} = ?`,
            answer: String(a - b)
          }
        } else {
          return {
            type: 'pattern',
            difficulty: 'medium',
            question: 'Sélectionnez 4 cases formant un carré',
            answer: '0-0,0-1,1-0,1-1' // Pattern simple
          }
        }
      },
      hard: () => {
        const types: CaptchaChallenge['type'][] = ['math', 'pattern', 'logic']
        const type = types[Math.floor(Math.random() * types.length)]

        if (type === 'math') {
          const a = Math.floor(Math.random() * 15) + 5
          const b = Math.floor(Math.random() * 10) + 2
          const operations = ['+', '-', '×']
          const op = operations[Math.floor(Math.random() * operations.length)]

          let answer: number
          if (op === '+') answer = a + b
          else if (op === '-') answer = a - b
          else answer = a * b

          return {
            type: 'math',
            difficulty: 'hard',
            question: `${a} ${op} ${b} = ?`,
            answer: String(answer)
          }
        } else if (type === 'pattern') {
          return {
            type: 'pattern',
            difficulty: 'hard',
            question: 'Sélectionnez les cases en diagonale (de haut gauche à bas droit)',
            answer: '0-0,1-1,2-2,3-3,4-4'
          }
        } else {
          const sequences = [
            { question: '2, 4, 6, 8, ?', answer: '10' },
            { question: '1, 1, 2, 3, 5, ?', answer: '8' },
            { question: '10, 20, 15, 30, 25, ?', answer: '50' }
          ]
          const seq = sequences[Math.floor(Math.random() * sequences.length)]
          return {
            type: 'logic',
            difficulty: 'hard',
            question: seq.question,
            answer: seq.answer
          }
        }
      }
    }

    return challenges[difficulty]()
  }

  const loadChallenge = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Utiliser le SecurityManager pour déterminer la difficulté
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium'

      if (riskLevel) {
        const config = securityManager.getCaptchaConfig(riskLevel)
        difficulty = config.difficulty
      }

      // Simuler un délai pour éviter les réponses instantanées
      await new Promise(resolve => setTimeout(resolve, 500))

      const newChallenge = generateChallenge(difficulty)
      setChallenge(newChallenge)
      setIsLoading(false)
    } catch (err) {
      setError('Erreur lors du chargement du défi')
      setIsLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (!challenge || isVerifying) return

    setIsVerifying(true)
    setError(null)

    try {
      // Simuler une vérification serveur
      await new Promise(resolve => setTimeout(resolve, 1000))

      const isCorrect = answer.toLowerCase() === challenge.answer.toLowerCase()

      if (isCorrect) {
        setIsVerified(true)
        onVerify(true)
        logger.security('CAPTCHA verified successfully')
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= maxAttempts) {
          setError('Trop de tentatives incorrectes. Veuillez réessayer plus tard.')
          onVerify(false)

          // Logger l'échec
          await securityManager.logSuspiciousActivity({
            email: 'unknown', // Sera remplacé par l'email réel
            type: 'captcha_failed_max_attempts',
            details: { attempts: newAttempts, riskLevel }
          })
        } else {
          setError(`Réponse incorrecte. ${maxAttempts - newAttempts} tentatives restantes.`)
          // Charger un nouveau défi après un échec
          setTimeout(() => {
            loadChallenge()
          }, 1000)
        }
      }
    } catch (err) {
      setError('Erreur lors de la vérification')
    } finally {
      setIsVerifying(false)
    }
  }

  const refreshChallenge = () => {
    setAttempts(0)
    setError(null)
    setIsVerified(false)
    loadChallenge()
  }

  useEffect(() => {
    loadChallenge()
  }, [riskLevel])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Chargement du défi...</span>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className={`flex items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <ShieldCheck className="h-6 w-6 text-green-600 mr-2" />
        <span className="text-green-800 font-medium">Vérification réussie</span>
      </div>
    )
  }

  return (
    <div className={`p-6 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">
            Vérification de sécurité
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshChallenge}
          disabled={isLoading || isVerifying}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {riskLevel && (
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">Niveau de risque:</span>
            <span className={`font-medium ${
              riskLevel.level === 'low' ? 'text-green-600' :
              riskLevel.level === 'medium' ? 'text-yellow-600' :
              riskLevel.level === 'high' ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {riskLevel.level.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {challenge && (
        <CaptchaChallenge
          challenge={challenge}
          onAnswer={handleAnswer}
          disabled={isVerifying}
        />
      )}

      {attempts > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Tentatives: {attempts}/{maxAttempts}
        </div>
      )}
    </div>
  )
}

export default Captcha