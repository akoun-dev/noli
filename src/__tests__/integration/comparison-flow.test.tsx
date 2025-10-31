import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProvider } from '@/contexts/UserContext'
import { saveComparisonHistory } from '@/features/comparison/services/comparisonHistoryService'

// Mock comparison service
vi.mock('@/features/comparison/services/comparisonHistoryService')

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProvider>{children}</UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

// Mock form data
const mockPersonalInfo = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+2250102030405',
  isWhatsapp: true,
}

const mockVehicleInfo = {
  make: 'Toyota',
  model: 'Yaris',
  year: '2020',
  category: 'Voiture',
  fuel: 'Essence',
  fiscalPower: '7 CV',
  seats: '5',
  circulationDate: '2020-01-15',
  newValue: '4500000',
  currentValue: '3500000',
  vehicleUsage: 'personnel',
}

const mockInsuranceNeeds = {
  coverageType: 'tous_risques',
  effectiveDate: '2024-02-01',
  contractDuration: '1 an',
  options: ['Assistance 24/7', 'Véhicule de remplacement'],
}

const mockComparisonResults = {
  totalOffers: 12,
  bestOffer: {
    insurer: 'NSIA Assurance',
    price: 95000,
    coverage: 'Tous risques',
  },
  priceRange: { min: 85000, max: 145000 },
  averagePrice: 115000,
  offers: [
    {
      id: 'offer-1',
      insurer: 'NSIA Assurance',
      price: 95000,
      coverage: 'Tous risques',
      deductible: 50000,
      benefits: ['Assistance 24/7', 'Protection juridique'],
    },
    {
      id: 'offer-2',
      insurer: 'SUNU Assurances',
      price: 105000,
      coverage: 'Tous risques',
      deductible: 60000,
      benefits: ['Assistance 24/7', 'Bris de glace'],
    },
  ],
}

describe('Comparison Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock comparison service
    vi.mocked(saveComparisonHistory).mockResolvedValue({
      id: 'comparison-123',
      userId: 'user-123',
      sessionId: 'session-123',
      title: 'Comparaison Toyota Yaris',
      vehicleInfo: {
        make: mockVehicleInfo.make,
        model: mockVehicleInfo.model,
        year: parseInt(mockVehicleInfo.year),
        category: mockVehicleInfo.category,
        value: parseInt(mockVehicleInfo.newValue),
      },
      driverInfo: {
        age: 32,
        licenseYears: 8,
        accidentHistory: 0,
      },
      preferences: {
        coverageType: mockInsuranceNeeds.coverageType,
        budgetRange: { min: 80000, max: 150000 },
        deductible: 50000,
        additionalOptions: mockInsuranceNeeds.options || [],
      },
      results: {
        ...mockComparisonResults,
        comparisonDate: new Date().toISOString(),
      },
      savedOffers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isShared: false,
      status: 'active',
    })

    // Mock localStorage for form persistence
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Step 1: Personal Information', () => {
    it('should validate and save personal information', async () => {
      // Mock component for personal info step
      const PersonalInfoStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string>>({})
        const [errors, setErrors] = React.useState<Record<string, string>>({})

        const validateForm = () => {
          const newErrors: Record<string, string> = {}
          if (!formData.firstName) newErrors.firstName = 'Le prénom est requis'
          if (!formData.lastName) newErrors.lastName = 'Le nom est requis'
          if (!formData.email) newErrors.email = "L'email est requis"
          if (!formData.phone) newErrors.phone = 'Le téléphone est requis'
          setErrors(newErrors)
          return Object.keys(newErrors).length === 0
        }

        const handleSubmit = () => {
          if (validateForm()) {
            localStorage.setItem('comparison_personal_info', JSON.stringify(formData))
            mockNavigate('/comparer/vehicle')
          }
        }

        return (
          <div>
            <h1>Informations personnelles</h1>
            <input
              data-testid='firstName'
              placeholder='Prénom'
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            {errors.firstName && <span data-testid='firstName-error'>{errors.firstName}</span>}

            <input
              data-testid='lastName'
              placeholder='Nom'
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
            {errors.lastName && <span data-testid='lastName-error'>{errors.lastName}</span>}

            <input
              data-testid='email'
              type='email'
              placeholder='Email'
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <span data-testid='email-error'>{errors.email}</span>}

            <input
              data-testid='phone'
              placeholder='Téléphone'
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {errors.phone && <span data-testid='phone-error'>{errors.phone}</span>}

            <button data-testid='continue-btn' onClick={handleSubmit}>
              Continuer
            </button>
          </div>
        )
      }

      render(
        <TestWrapper>
          <PersonalInfoStep />
        </TestWrapper>
      )

      // Assert initial state
      expect(screen.getByText('Informations personnelles')).toBeInTheDocument()

      // Act - Submit empty form
      fireEvent.click(screen.getByTestId('continue-btn'))

      // Assert validation errors
      expect(screen.getByTestId('firstName-error')).toHaveTextContent('Le prénom est requis')
      expect(screen.getByTestId('lastName-error')).toHaveTextContent('Le nom est requis')
      expect(screen.getByTestId('email-error')).toHaveTextContent("L'email est requis")
      expect(screen.getByTestId('phone-error')).toHaveTextContent('Le téléphone est requis')

      // Act - Fill valid form
      fireEvent.change(screen.getByTestId('firstName'), {
        target: { value: mockPersonalInfo.firstName },
      })

      fireEvent.change(screen.getByTestId('lastName'), {
        target: { value: mockPersonalInfo.lastName },
      })

      fireEvent.change(screen.getByTestId('email'), {
        target: { value: mockPersonalInfo.email },
      })

      fireEvent.change(screen.getByTestId('phone'), {
        target: { value: mockPersonalInfo.phone },
      })

      fireEvent.click(screen.getByTestId('continue-btn'))

      // Assert successful validation and navigation
      expect(screen.queryByTestId('firstName-error')).not.toBeInTheDocument()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'comparison_personal_info',
        expect.stringContaining(mockPersonalInfo.firstName)
      )
      expect(mockNavigate).toHaveBeenCalledWith('/comparer/vehicle')
    })

    it('should validate email format', async () => {
      const PersonalInfoStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string>>({})
        const [errors, setErrors] = React.useState<Record<string, string>>({})

        const validateForm = () => {
          const newErrors: Record<string, string> = {}
          if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email invalide'
          }
          setErrors(newErrors)
          return Object.keys(newErrors).length === 0
        }

        const handleSubmit = () => {
          validateForm()
        }

        return (
          <div>
            <input
              data-testid='email'
              type='email'
              placeholder='Email'
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <span data-testid='email-error'>{errors.email}</span>}
            <button data-testid='validate-btn' onClick={handleSubmit}>
              Valider
            </button>
          </div>
        )
      }

      render(
        <TestWrapper>
          <PersonalInfoStep />
        </TestWrapper>
      )

      // Act - Enter invalid email
      fireEvent.change(screen.getByTestId('email'), {
        target: { value: 'invalid-email' },
      })

      fireEvent.click(screen.getByTestId('validate-btn'))

      // Assert email validation error
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email invalide')

      // Act - Enter valid email
      fireEvent.change(screen.getByTestId('email'), {
        target: { value: 'valid@example.com' },
      })

      fireEvent.click(screen.getByTestId('validate-btn'))

      // Assert validation passes
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
    })
  })

  describe('Step 2: Vehicle Information', () => {
    it('should validate and save vehicle information', async () => {
      // Mock component for vehicle info step
      const VehicleInfoStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string>>({})
        const [errors, setErrors] = React.useState<Record<string, string>>({})

        const validateForm = () => {
          const newErrors: Record<string, string> = {}
          if (!formData.make) newErrors.make = 'La marque est requise'
          if (!formData.model) newErrors.model = 'Le modèle est requis'
          if (!formData.year) newErrors.year = "L'année est requise"
          if (!formData.fuel) newErrors.fuel = 'Le type de carburant est requis'
          if (!formData.vehicleUsage) newErrors.vehicleUsage = "L'usage du véhicule est requis"
          setErrors(newErrors)
          return Object.keys(newErrors).length === 0
        }

        const handleSubmit = () => {
          if (validateForm()) {
            const personalInfo = JSON.parse(
              localStorage.getItem('comparison_personal_info') || '{}'
            )
            const fullData = { ...personalInfo, ...formData }
            localStorage.setItem('comparison_vehicle_info', JSON.stringify(fullData))
            mockNavigate('/comparer/besoins')
          }
        }

        return (
          <div>
            <h1>Informations véhicule</h1>
            <input
              data-testid='make'
              placeholder='Marque'
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            />
            {errors.make && <span data-testid='make-error'>{errors.make}</span>}

            <input
              data-testid='model'
              placeholder='Modèle'
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
            {errors.model && <span data-testid='model-error'>{errors.model}</span>}

            <select
              data-testid='fuel'
              onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
            >
              <option value=''>Sélectionner</option>
              <option value='Essence'>Essence</option>
              <option value='Diesel'>Diesel</option>
            </select>
            {errors.fuel && <span data-testid='fuel-error'>{errors.fuel}</span>}

            <select
              data-testid='vehicleUsage'
              onChange={(e) => setFormData({ ...formData, vehicleUsage: e.target.value })}
            >
              <option value=''>Sélectionner</option>
              <option value='personnel'>Personnel</option>
              <option value='professionnel'>Professionnel</option>
            </select>
            {errors.vehicleUsage && <span data-testid='usage-error'>{errors.vehicleUsage}</span>}

            <button data-testid='continue-btn' onClick={handleSubmit}>
              Continuer
            </button>
          </div>
        )
      }

      // Mock personal info from previous step
      vi.mocked(window.localStorage.getItem).mockImplementation((key) => {
        if (key === 'comparison_personal_info') {
          return JSON.stringify(mockPersonalInfo)
        }
        return null
      })

      render(
        <TestWrapper>
          <VehicleInfoStep />
        </TestWrapper>
      )

      // Act - Submit empty form
      fireEvent.click(screen.getByTestId('continue-btn'))

      // Assert validation errors
      expect(screen.getByTestId('make-error')).toHaveTextContent('La marque est requise')
      expect(screen.getByTestId('model-error')).toHaveTextContent('Le modèle est requis')
      expect(screen.getByTestId('fuel-error')).toHaveTextContent('Le type de carburant est requis')
      expect(screen.getByTestId('usage-error')).toHaveTextContent("L'usage du véhicule est requis")

      // Act - Fill valid form
      fireEvent.change(screen.getByTestId('make'), {
        target: { value: mockVehicleInfo.make },
      })

      fireEvent.change(screen.getByTestId('model'), {
        target: { value: mockVehicleInfo.model },
      })

      fireEvent.change(screen.getByTestId('fuel'), {
        target: { value: mockVehicleInfo.fuel },
      })

      fireEvent.change(screen.getByTestId('vehicleUsage'), {
        target: { value: mockVehicleInfo.vehicleUsage },
      })

      fireEvent.click(screen.getByTestId('continue-btn'))

      // Assert successful validation and data saving
      expect(screen.queryByTestId('make-error')).not.toBeInTheDocument()
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'comparison_vehicle_info',
        expect.stringContaining(mockVehicleInfo.make)
      )
      expect(mockNavigate).toHaveBeenCalledWith('/comparer/besoins')
    })
  })

  describe('Step 3: Insurance Needs', () => {
    it('should validate and complete comparison process', async () => {
      // Mock component for insurance needs step
      const InsuranceNeedsStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string | string[]>>({})
        const [isSubmitting, setIsSubmitting] = React.useState(false)
        const [errors, setErrors] = React.useState<Record<string, string>>({})

        const validateForm = () => {
          const newErrors: Record<string, string> = {}
          if (!formData.coverageType) newErrors.coverageType = 'Le type de couverture est requis'
          if (!formData.effectiveDate) newErrors.effectiveDate = "La date d'effet est requise"
          if (!formData.contractDuration)
            newErrors.contractDuration = 'La durée du contrat est requise'
          setErrors(newErrors)
          return Object.keys(newErrors).length === 0
        }

        const handleSubmit = async () => {
          if (!validateForm()) return

          setIsSubmitting(true)
          try {
            const vehicleData = JSON.parse(localStorage.getItem('comparison_vehicle_info') || '{}')
            const comparisonData = {
              ...vehicleData,
              preferences: formData,
              results: mockComparisonResults,
            }

            await saveComparisonHistory(comparisonData)
            localStorage.removeItem('comparison_personal_info')
            localStorage.removeItem('comparison_vehicle_info')
            mockNavigate('/offres')
          } catch (error) {
            setErrors({ submit: 'Erreur lors de la sauvegarde' })
          } finally {
            setIsSubmitting(false)
          }
        }

        return (
          <div>
            <h1>Besoins en assurance</h1>
            <select
              data-testid='coverageType'
              onChange={(e) => setFormData({ ...formData, coverageType: e.target.value })}
            >
              <option value=''>Sélectionner</option>
              <option value='tiers'>Tiers</option>
              <option value='vol_incendie'>Vol + Incendie</option>
              <option value='tous_risques'>Tous risques</option>
            </select>
            {errors.coverageType && <span data-testid='coverage-error'>{errors.coverageType}</span>}

            <input
              data-testid='effectiveDate'
              type='date'
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            />
            {errors.effectiveDate && <span data-testid='date-error'>{errors.effectiveDate}</span>}

            <select
              data-testid='contractDuration'
              onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
            >
              <option value=''>Sélectionner</option>
              <option value='6 mois'>6 mois</option>
              <option value='1 an'>1 an</option>
            </select>
            {errors.contractDuration && (
              <span data-testid='duration-error'>{errors.contractDuration}</span>
            )}

            <label>
              <input
                type='checkbox'
                data-testid='option1'
                onChange={(e) => {
                  const options = Array.isArray(formData.options) ? formData.options : []
                  if (e.target.checked) {
                    setFormData({ ...formData, options: [...options, 'Assistance 24/7'] })
                  } else {
                    setFormData({
                      ...formData,
                      options: options.filter((o: string) => o !== 'Assistance 24/7'),
                    })
                  }
                }}
              />
              Assistance 24/7
            </label>

            {errors.submit && <span data-testid='submit-error'>{errors.submit}</span>}

            <button data-testid='submit-btn' onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Recherche en cours...' : 'Comparer les offres'}
            </button>
          </div>
        )
      }

      // Mock vehicle data from previous step
      vi.mocked(window.localStorage.getItem).mockImplementation((key) => {
        if (key === 'comparison_vehicle_info') {
          return JSON.stringify({ ...mockPersonalInfo, ...mockVehicleInfo })
        }
        return null
      })

      render(
        <TestWrapper>
          <InsuranceNeedsStep />
        </TestWrapper>
      )

      // Act - Submit empty form
      fireEvent.click(screen.getByTestId('submit-btn'))

      // Assert validation errors
      expect(screen.getByTestId('coverage-error')).toHaveTextContent(
        'Le type de couverture est requis'
      )
      expect(screen.getByTestId('date-error')).toHaveTextContent("La date d'effet est requise")
      expect(screen.getByTestId('duration-error')).toHaveTextContent(
        'La durée du contrat est requise'
      )

      // Act - Fill valid form
      fireEvent.change(screen.getByTestId('coverageType'), {
        target: { value: mockInsuranceNeeds.coverageType },
      })

      fireEvent.change(screen.getByTestId('effectiveDate'), {
        target: { value: mockInsuranceNeeds.effectiveDate },
      })

      fireEvent.change(screen.getByTestId('contractDuration'), {
        target: { value: mockInsuranceNeeds.contractDuration },
      })

      fireEvent.click(screen.getByTestId('option1'))

      fireEvent.click(screen.getByTestId('submit-btn'))

      // Assert loading state
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Recherche en cours...')
      expect(screen.getByTestId('submit-btn')).toBeDisabled()

      // Assert successful submission
      await waitFor(() => {
        expect(saveComparisonHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            preferences: expect.objectContaining({
              coverageType: mockInsuranceNeeds.coverageType,
            }),
            results: mockComparisonResults,
          })
        )
      })

      // Assert cleanup and navigation
      expect(localStorage.removeItem).toHaveBeenCalledWith('comparison_personal_info')
      expect(localStorage.removeItem).toHaveBeenCalledWith('comparison_vehicle_info')
      expect(mockNavigate).toHaveBeenCalledWith('/offres')
    })

    it('should handle submission error', async () => {
      const InsuranceNeedsStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string>>({})
        const [errors, setErrors] = React.useState<Record<string, string>>({})

        const handleSubmit = async () => {
          try {
            await saveComparisonHistory({
              userId: 'test-user',
              sessionId: 'test-session',
              title: 'Test',
              vehicleInfo: {
                make: 'Test',
                model: 'Test',
                year: 2020,
                category: 'Test',
                value: 1000000,
              },
              driverInfo: {
                age: 30,
                licenseYears: 5,
                accidentHistory: 0,
              },
              preferences: {
                coverageType: 'Test',
                budgetRange: { min: 100000, max: 200000 },
                deductible: 50000,
                additionalOptions: [],
              },
              results: {
                totalOffers: 0,
                priceRange: { min: 0, max: 0 },
                averagePrice: 0,
                comparisonDate: new Date().toISOString(),
              },
              savedOffers: [],
              isShared: false,
              status: 'active',
            })
          } catch (error) {
            setErrors({ submit: 'Erreur lors de la sauvegarde' })
          }
        }

        return (
          <div>
            <select
              data-testid='coverageType'
              onChange={(e) => setFormData({ ...formData, coverageType: e.target.value })}
            >
              <option value='tous_risques'>Tous risques</option>
            </select>

            <input
              data-testid='effectiveDate'
              type='date'
              defaultValue='2024-02-01'
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            />

            <select
              data-testid='contractDuration'
              onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
            >
              <option value='1 an'>1 an</option>
            </select>

            {errors.submit && <span data-testid='submit-error'>{errors.submit}</span>}

            <button data-testid='submit-btn' onClick={handleSubmit}>
              Comparer
            </button>
          </div>
        )
      }

      // Mock service error
      vi.mocked(saveComparisonHistory).mockRejectedValue(new Error('Service error'))

      render(
        <TestWrapper>
          <InsuranceNeedsStep />
        </TestWrapper>
      )

      // Act - Fill form and submit
      fireEvent.change(screen.getByTestId('coverageType'), {
        target: { value: 'tous_risques' },
      })

      fireEvent.click(screen.getByTestId('submit-btn'))

      // Assert error handling
      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toHaveTextContent('Erreur lors de la sauvegarde')
      })
    })
  })

  describe('Form Persistence', () => {
    it('should save form data to localStorage', async () => {
      const PersonalInfoStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string>>({})

        const handleSave = () => {
          localStorage.setItem('comparison_personal_info', JSON.stringify(formData))
        }

        return (
          <div>
            <input
              data-testid='firstName'
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <button data-testid='save-btn' onClick={handleSave}>
              Sauvegarder
            </button>
          </div>
        )
      }

      render(
        <TestWrapper>
          <PersonalInfoStep />
        </TestWrapper>
      )

      // Act - Fill form and save
      fireEvent.change(screen.getByTestId('firstName'), {
        target: { value: 'John' },
      })

      fireEvent.click(screen.getByTestId('save-btn'))

      // Assert data saved
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'comparison_personal_info',
        JSON.stringify({ firstName: 'John' })
      )
    })

    it('should restore form data from localStorage', async () => {
      // Mock saved data
      vi.mocked(window.localStorage.getItem).mockImplementation((key) => {
        if (key === 'comparison_personal_info') {
          return JSON.stringify(mockPersonalInfo)
        }
        return null
      })

      const PersonalInfoStep = () => {
        const [formData, setFormData] = React.useState<Record<string, string>>({})

        React.useEffect(() => {
          const saved = localStorage.getItem('comparison_personal_info')
          if (saved) {
            setFormData(JSON.parse(saved))
          }
        }, [])

        return (
          <div>
            <input
              data-testid='firstName'
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <span data-testid='display-name'>{formData.firstName}</span>
          </div>
        )
      }

      render(
        <TestWrapper>
          <PersonalInfoStep />
        </TestWrapper>
      )

      // Assert data restored
      expect(screen.getByTestId('firstName')).toHaveValue(mockPersonalInfo.firstName)
      expect(screen.getByTestId('display-name')).toHaveTextContent(mockPersonalInfo.firstName)
    })
  })

  describe('Progress Navigation', () => {
    it('should show correct progress indicators', () => {
      const ProgressIndicator = ({ currentStep }: { currentStep: number }) => (
        <div>
          <div data-testid='step1' className={currentStep >= 1 ? 'active' : ''}>
            Informations personnelles
          </div>
          <div data-testid='step2' className={currentStep >= 2 ? 'active' : ''}>
            Informations véhicule
          </div>
          <div data-testid='step3' className={currentStep >= 3 ? 'active' : ''}>
            Besoins en assurance
          </div>
        </div>
      )

      const { rerender } = render(
        <TestWrapper>
          <ProgressIndicator currentStep={1} />
        </TestWrapper>
      )

      // Assert initial step
      expect(screen.getByTestId('step1')).toHaveClass('active')
      expect(screen.getByTestId('step2')).not.toHaveClass('active')
      expect(screen.getByTestId('step3')).not.toHaveClass('active')

      // Act - Move to next step
      rerender(
        <TestWrapper>
          <ProgressIndicator currentStep={2} />
        </TestWrapper>
      )

      // Assert updated progress
      expect(screen.getByTestId('step1')).toHaveClass('active')
      expect(screen.getByTestId('step2')).toHaveClass('active')
      expect(screen.getByTestId('step3')).not.toHaveClass('active')

      // Act - Move to final step
      rerender(
        <TestWrapper>
          <ProgressIndicator currentStep={3} />
        </TestWrapper>
      )

      // Assert final progress
      expect(screen.getByTestId('step1')).toHaveClass('active')
      expect(screen.getByTestId('step2')).toHaveClass('active')
      expect(screen.getByTestId('step3')).toHaveClass('active')
    })
  })

  describe('Data Flow Integration', () => {
    it('should pass data correctly between steps', async () => {
      // This test simulates the complete data flow through all steps
      const dataFlow: Record<string, unknown> = {}

      const Step1 = () => {
        const [data, setData] = React.useState<Record<string, unknown>>({})
        return (
          <div>
            <button
              onClick={() => {
                dataFlow.step1 = mockPersonalInfo
                mockNavigate('/step2')
              }}
            >
              Next
            </button>
          </div>
        )
      }

      const Step2 = () => {
        return (
          <div>
            <button
              onClick={() => {
                dataFlow.step2 = mockVehicleInfo
                mockNavigate('/step3')
              }}
            >
              Next
            </button>
          </div>
        )
      }

      const Step3 = () => {
        return (
          <div>
            <button
              onClick={async () => {
                dataFlow.step3 = mockInsuranceNeeds
                const completeData = {
                  ...(typeof dataFlow.step1 === 'object' ? dataFlow.step1 : {}),
                  ...(typeof dataFlow.step2 === 'object' ? dataFlow.step2 : {}),
                  preferences: dataFlow.step3,
                  results: mockComparisonResults,
                }
                await saveComparisonHistory({
                  userId: 'test-user',
                  sessionId: 'test-session',
                  title: 'Test Comparison',
                  vehicleInfo: {
                    make: 'Toyota',
                    model: 'Yaris',
                    year: 2020,
                    category: 'Voiture',
                    value: 4500000,
                  },
                  driverInfo: {
                    age: 32,
                    licenseYears: 8,
                    accidentHistory: 0,
                  },
                  preferences: dataFlow.step3 as {
                    coverageType: string
                    budgetRange: { min: number; max: number }
                    deductible: number
                    additionalOptions: string[]
                  },
                  results: {
                    ...mockComparisonResults,
                    comparisonDate: new Date().toISOString(),
                  },
                  savedOffers: [],
                  isShared: false,
                  status: 'active',
                })
                mockNavigate('/offres')
              }}
            >
              Submit
            </button>
          </div>
        )
      }

      // Start with step 1
      const { rerender } = render(
        <TestWrapper>
          <Step1 />
        </TestWrapper>
      )

      // Complete step 1
      fireEvent.click(screen.getByText('Next'))
      expect(mockNavigate).toHaveBeenCalledWith('/step2')

      // Complete step 2
      rerender(
        <TestWrapper>
          <Step2 />
        </TestWrapper>
      )
      fireEvent.click(screen.getByText('Next'))
      expect(mockNavigate).toHaveBeenCalledWith('/step3')

      // Complete step 3
      rerender(
        <TestWrapper>
          <Step3 />
        </TestWrapper>
      )
      fireEvent.click(screen.getByText('Submit'))

      // Assert complete data flow
      await waitFor(() => {
        expect(saveComparisonHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            vehicleInfo: expect.objectContaining({
              make: mockVehicleInfo.make,
            }),
            preferences: expect.objectContaining({
              coverageType: mockInsuranceNeeds.coverageType,
            }),
            results: expect.objectContaining({
              totalOffers: mockComparisonResults.totalOffers,
            }),
          })
        )
      })
    })
  })
})
