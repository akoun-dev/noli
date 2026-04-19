/**
 * Tests pour le composant CAPTCHA
 * Vérifie le fonctionnement des différents types de défis et la gestion d'état
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Captcha } from '../Captcha'

// Mock pour @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>
}))

// Mock pour @react-three/drei
vi.mock('@react-three/drei', () => ({
  Text: ({ children }: { children: React.ReactNode }) => <span data-testid="text">{children}</span>,
  Box: ({ children }: { children: React.ReactNode }) => <div data-testid="box">{children}</div>
}))

// Mock pour les composants UI
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress">{value}%</div>
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock pour le logger
vi.mock('@/lib/logger', () => ({
  logger: {
    security: vi.fn()
  }
}))

describe('Captcha Component', () => {
  const mockOnVerify = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock setTimeout et setInterval
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render loading state initially', () => {
    render(<Captcha onVerify={mockOnVerify} />)

    expect(screen.getByText('Chargement du défi...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render math challenge after loading', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    // Simuler le chargement
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.queryByText('Chargement du défi...')).not.toBeInTheDocument()
    })

    // Le défi devrait être affiché
    expect(screen.getByText(/(\d+) \+ (\d+) = \?/)).toBeInTheDocument()
  })

  it('should handle correct math answer', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
    })

    // Trouver l'input de réponse
    const answerInput = screen.getByPlaceholderText('Votre réponse')

    // Simuler une réponse correcte (le calcul sera 1+1 = 2)
    fireEvent.change(answerInput, { target: { value: '2' } })
    fireEvent.click(screen.getByText('Vérifier'))

    // Simuler le délai de vérification
    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith(true)
    })
  })

  it('should handle incorrect answer', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
    })

    const answerInput = screen.getByPlaceholderText('Votre réponse')
    fireEvent.change(answerInput, { target: { value: '999' } })
    fireEvent.click(screen.getByText('Vérifier'))

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.getByText(/Réponse incorrecte/)).toBeInTheDocument()
    })

    expect(mockOnVerify).not.toHaveBeenCalled()
  })

  it('should show remaining attempts', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    // Première tentative incorrecte
    const answerInput = screen.getByPlaceholderText('Votre réponse')
    fireEvent.change(answerInput, { target: { value: 'wrong' } })
    fireEvent.click(screen.getByText('Vérifier'))

    vi.advanceTimersByTime(2000) // Attendre le rechargement du défi

    await waitFor(() => {
      expect(screen.getByText('Tentatives: 1/3')).toBeInTheDocument()
    })
  })

  it('should block after max attempts', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    // Faire 3 tentatives incorrectes
    for (let i = 0; i < 3; i++) {
      const answerInput = screen.getByPlaceholderText('Votre réponse')
      fireEvent.change(answerInput, { target: { value: `wrong${i}` } })
      fireEvent.click(screen.getByText('Vérifier'))

      vi.advanceTimersByTime(2000)
    }

    await waitFor(() => {
      expect(screen.getByText(/Trop de tentatives incorrectes/)).toBeInTheDocument()
    })

    expect(mockOnVerify).toHaveBeenCalledWith(false)
  })

  it('should show risk level when provided', async () => {
    const riskLevel = {
      level: 'medium' as const,
      score: 35,
      reasons: ['New location detected']
    }

    render(<Captcha onVerify={mockOnVerify} riskLevel={riskLevel} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.getByText('Niveau de risque:')).toBeInTheDocument()
      expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    })
  })

  it('should refresh challenge on button click', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.getByText(/(\d+) \+ (\d+) = \?/)).toBeInTheDocument()
    })

    // Cliquer sur le bouton de rafraîchissement
    const refreshButton = screen.getByRole('button')
    fireEvent.click(refreshButton)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      // Le défi devrait être rechargé (indiqué par la réinitialisation du compteur de tentatives)
      expect(screen.getByText('Tentatives: 0/3')).toBeInTheDocument()
    })
  })

  it('should show verified state on success', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      const answerInput = screen.getByPlaceholderText('Votre réponse')
      fireEvent.change(answerInput, { target: { value: '2' } })
      fireEvent.click(screen.getByText('Vérifier'))
    })

    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.getByText('Vérification réussie')).toBeInTheDocument()
    })
  })

  it('should adapt difficulty based on risk level', async () => {
    const highRisk = {
      level: 'critical' as const,
      score: 60,
      reasons: ['Multiple failed attempts']
    }

    render(<Captcha onVerify={mockOnVerify} riskLevel={highRisk} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.getByText('Vérification de sécurité')).toBeInTheDocument()
    })

    // Le CAPTCHA devrait s'adapter au risque élevé
    expect(screen.getByText('Niveau de risque: CRITICAL')).toBeInTheDocument()
  })

  it('should handle empty input gracefully', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      const submitButton = screen.getByText('Vérifier')
      fireEvent.click(submitButton)
    })

    // Le formulaire ne devrait pas être soumis avec un input vide
    expect(mockOnVerify).not.toHaveBeenCalled()
  })

  it('should disable input during verification', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      const answerInput = screen.getByPlaceholderText('Votre réponse')
      const submitButton = screen.getByText('Vérifier')

      fireEvent.change(answerInput, { target: { value: '2' } })
      fireEvent.click(submitButton)
    })

    // Pendant la vérification, les contrôles devraient être désactivés
    const answerInput = screen.getByPlaceholderText('Votre réponse')
    expect(answerInput).toBeDisabled()
  })

  it('should handle refresh button correctly', async () => {
    render(<Captcha onVerify={mockOnVerify} />)

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      const refreshButton = screen.getByRole('button')
      expect(refreshButton).toBeInTheDocument()
    })
  })
})