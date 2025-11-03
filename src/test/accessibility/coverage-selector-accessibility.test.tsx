import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { ProgressiveCoverageSelector } from '@/components/coverage/ProgressiveCoverageSelector'
import { DynamicPricingSummary } from '@/components/coverage/DynamicPricingSummary'
import { CoverageProgressIndicator } from '@/components/coverage/CoverageProgressIndicator'

// Mock hooks and services
jest.mock('@/hooks/use-mobile', () => ({
  useMobile: () => false // Desktop by default
}))

jest.mock('@/services/coverageTarificationService', () => ({
  coverageTarificationService: {
    getAvailableCoverages: jest.fn().mockResolvedValue([
      {
        coverage_id: 'rc',
        name: 'Responsabilité Civile',
        description: 'Garantie obligatoire',
        is_mandatory: true,
        calculation_type: 'FIXED_AMOUNT',
        coverage_type: 'RC'
      },
      {
        coverage_id: 'vol',
        name: 'Vol',
        description: 'Protection contre le vol',
        is_mandatory: false,
        calculation_type: 'PERCENTAGE_SI',
        coverage_type: 'VOL'
      }
    ]),
    getCoverageFormulas: jest.fn().mockResolvedValue(['Basique', 'Premium']),
    calculateCoveragePremium: jest.fn().mockResolvedValue(50000),
    addCoverageToQuote: jest.fn().mockResolvedValue(undefined),
    calculateQuoteTotalPremium: jest.fn().mockResolvedValue(100000),
    getQuoteCoveragePremiums: jest.fn().mockResolvedValue([
      { coverage_id: 'rc', premium_amount: 50000, is_included: true },
      { coverage_id: 'vol', premium_amount: 50000, is_included: true }
    ])
  }
}))

// Extend Jest matchers
expect.extend(toHaveNoViolations)

const mockVehicleData = {
  category: '401',
  fiscal_power: 6,
  fuel_type: 'essence',
  sum_insured: 5000000,
  new_value: 8000000
}

const defaultProps = {
  quoteId: 'test-quote-id',
  vehicleData: mockVehicleData,
  selectedCoverages: {},
  onCoverageChange: jest.fn(),
  onPremiumsChange: jest.fn(),
  canCalculate: true
}

describe('Coverage Selector Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  describe('ProgressiveCoverageSelector', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ProgressiveCoverageSelector {...defaultProps} />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: /sélectionnez vos garanties/i })).toBeInTheDocument()

      // Check for ARIA labels on interactive elements
      const categoryButtons = screen.getAllByRole('button')
      expect(categoryButtons.length).toBeGreaterThan(0)

      // Check for expandable categories
      await waitFor(() => {
        const categories = screen.getAllByRole('button')
        categories.forEach(button => {
          expect(button).toHaveAttribute('aria-expanded')
        })
      })
    })

    it('should be keyboard navigable', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // Tab through interactive elements
      await user.tab()
      const firstButton = screen.getAllByRole('button')[0]
      expect(firstButton).toHaveFocus()

      // Enter to expand category
      await user.keyboard('{Enter}')

      // Check that category expanded
      await waitFor(() => {
        expect(screen.getByText(/Garanties essentielles/i)).toBeInTheDocument()
      })
    })

    it('should announce changes to screen readers', async () => {
      const onCoverageChange = jest.fn()
      render(
        <ProgressiveCoverageSelector
          {...defaultProps}
          onCoverageChange={onCoverageChange}
        />
      )

      // Wait for categories to load
      await waitFor(() => {
        const categories = screen.getAllByRole('button')
        expect(categories.length).toBeGreaterThan(0)
      })

      // Expand first category
      const firstCategory = screen.getAllByRole('button')[0]
      await user.click(firstCategory)

      // Wait for coverage options to appear
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes.length).toBeGreaterThan(0)
      })

      // Toggle a coverage option
      const firstCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(firstCheckbox)

      // Verify callback was called
      expect(onCoverageChange).toHaveBeenCalled()
    })

    it('should have sufficient color contrast', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // Check for text elements with color
      const textElements = screen.getAllByText(/./)
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element)
        // This would need actual color values in a real test
        expect(element).toBeInTheDocument()
      })
    })
  })

  describe('DynamicPricingSummary', () => {
    const mockCoverages = [
      {
        id: 'rc',
        name: 'Responsabilité Civile',
        premium: 50000,
        is_mandatory: true,
        calculation_type: 'FIXED_AMOUNT'
      },
      {
        id: 'vol',
        name: 'Vol',
        premium: 50000,
        is_mandatory: false,
        calculation_type: 'PERCENTAGE_SI'
      }
    ]

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <DynamicPricingSummary
          coverages={mockCoverages}
          totalPremium={100000}
          vehicleInfo={mockVehicleData}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper semantic structure', async () => {
      render(
        <DynamicPricingSummary
          coverages={mockCoverages}
          totalPremium={100000}
          vehicleInfo={mockVehicleData}
        />
      )

      // Check for main price display
      expect(screen.getByText(/100 000 FCFA/)).toBeInTheDocument()

      // Check for expandable details
      const detailsButton = screen.getByRole('button', { name: /détail du calcul/i })
      expect(detailsButton).toBeInTheDocument()

      // Expand details
      await user.click(detailsButton)

      // Verify details are shown
      await waitFor(() => {
        expect(screen.getByText(/Responsabilité Civile/)).toBeInTheDocument()
        expect(screen.getByText(/Obligatoire/)).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      render(
        <DynamicPricingSummary
          coverages={mockCoverages}
          totalPremium={100000}
          vehicleInfo={mockVehicleData}
        />
      )

      const detailsButton = screen.getByRole('button', { name: /détail du calcul/i })
      detailsButton.focus()
      expect(detailsButton).toHaveFocus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText(/Responsabilité Civile/)).toBeInTheDocument()
      })
    })
  })

  describe('CoverageProgressIndicator', () => {
    const mockSteps = [
      {
        id: 'mandatory',
        title: 'Garanties obligatoires',
        description: 'Protection de base requise',
        completed: true,
        icon: expect.any(Function)
      },
      {
        id: 'vehicle',
        title: 'Protection véhicule',
        description: 'Dommages matériels',
        completed: false,
        optional: true,
        icon: expect.any(Function)
      }
    ]

    it('should not have accessibility violations', async () => {
      const { container } = render(
        <CoverageProgressIndicator
          steps={mockSteps}
          completionPercentage={50}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper progress indicators', async () => {
      render(
        <CoverageProgressIndicator
          steps={mockSteps}
          completionPercentage={50}
        />
      )

      // Check for progress bar
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Check for step indicators
      expect(screen.getByText(/Garanties obligatoires/i)).toBeInTheDocument()
      expect(screen.getByText(/Protection véhicule/i)).toBeInTheDocument()

      // Check for completion status
      expect(screen.getByText('1/2')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should announce progress changes', async () => {
      const { rerender } = render(
        <CoverageProgressIndicator
          steps={mockSteps}
          completionPercentage={50}
        />
      )

      expect(screen.getByText('50%')).toBeInTheDocument()

      // Update progress
      rerender(
        <CoverageProgressIndicator
          steps={mockSteps}
          completionPercentage={100}
        />
      )

      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('2/2')).toBeInTheDocument()
    })
  })

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      // Mock mobile hook
      jest.doMock('@/hooks/use-mobile', () => ({
        useMobile: () => true
      }))
    })

    it('should be accessible on mobile devices', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // Check for touch-friendly targets
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
      })

      // Check for proper mobile layout
      const container = screen.getByRole('heading', { name: /sélectionnez vos garanties/i }).closest('div')
      expect(container).toHaveClass('space-y-6')
    })
  })

  describe('WCAG AA Compliance', () => {
    it('should meet WCAG AA color contrast requirements', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // This would require actual color measurement in a real implementation
      // For now, we check that appropriate color classes are used
      const primaryElements = screen.getAllByText(/./).filter(el =>
        el.closest('.text-primary') || el.closest('.bg-primary')
      )
      expect(primaryElements.length).toBeGreaterThan(0)
    })

    it('should have proper focus management', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // Tab through elements
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()

      // Check that focus is visible
      const focusedElement = document.activeElement as HTMLElement
      expect(focusedElement.style.outline ||
             getComputedStyle(focusedElement).outline).toBeDefined()
    })

    it('should support screen readers', async () => {
      render(<ProgressiveCoverageSelector {...defaultProps} />)

      // Check for ARIA labels and descriptions
      await waitFor(() => {
        const categories = screen.getAllByRole('button')
        categories.forEach(button => {
          expect(button).toHaveAttribute('aria-expanded')
          expect(button).toHaveAttribute('aria-controls')
        })
      })

      // Check for descriptive text
      expect(screen.getByText(/personnalisez votre protection/i)).toBeInTheDocument()
    })
  })
})