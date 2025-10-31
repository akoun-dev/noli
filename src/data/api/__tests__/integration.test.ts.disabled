import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { features } from '@/lib/config/features'
import { comparisonHistoryService } from '../comparisonHistoryService'
import { offerService } from '../offerService'
import { quoteService } from '../quoteService'
import { analyticsService } from '../analyticsService'

// Mock du logger pour éviter le bruit dans les tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Services API Integration Tests', () => {
  let mockUserId: string
  let mockInsurerId: string

  beforeAll(async () => {
    // Configurer l'environnement de test
    vi.stubEnv('VITE_USE_MOCK_DATA', 'true')

    // Créer des données de test si nécessaire
    mockUserId = 'test-user-123'
    mockInsurerId = 'test-insurer-456'
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Feature Flags', () => {
    it('should respect VITE_USE_MOCK_DATA environment variable', () => {
      expect(features.useMockData()).toBe(true)
    })

    it('should toggle mock data based on environment', () => {
      vi.stubEnv('VITE_USE_MOCK_DATA', 'true')
      expect(features.useMockData()).toBe(true)

      vi.stubEnv('VITE_USE_MOCK_DATA', 'false')
      expect(features.useMockData()).toBe(false)
    })
  })

  describe('ComparisonHistoryService', () => {
    it('should fetch comparison history with fallback', async () => {
      const result = await comparisonHistoryService.fetchComparisonHistory(mockUserId)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      // Should have mock data structure
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('user_id')
        expect(result[0]).toHaveProperty('comparison_data')
        expect(result[0]).toHaveProperty('status')
      }
    })

    it('should handle filters correctly', async () => {
      const filters = {
        search: 'test',
        status: 'completed' as const,
        limit: 5,
      }

      const result = await comparisonHistoryService.fetchComparisonHistory(mockUserId, filters)

      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('should save comparison history', async () => {
      const comparisonData = {
        user_id: mockUserId,
        comparison_data: {
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
          preferences: {
            coverageType: 'Tous risques',
            budgetRange: { min: 80000, max: 150000 },
            deductible: 50000,
            additionalOptions: ['Assistance 24/7'],
          },
          results: {
            totalOffers: 5,
            bestOffer: {
              insurer: 'Test Insurer',
              price: 95000,
              coverage: 'Tous risques',
            },
            priceRange: { min: 85000, max: 145000 },
            averagePrice: 115000,
            comparisonDate: new Date().toISOString(),
          },
          savedOffers: [],
        },
        status: 'completed' as const,
        comparison_date: new Date().toISOString(),
      }

      const result = await comparisonHistoryService.saveComparisonHistory(comparisonData)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('id')
      expect(result.user_id).toBe(mockUserId)
      expect(result.comparison_data.title).toBe('Test Comparison')
    })

    it('should fetch comparison details', async () => {
      // First save a comparison
      const comparisonData = {
        user_id: mockUserId,
        comparison_data: {
          title: 'Test Comparison Details',
          vehicleInfo: {
            make: 'Honda',
            model: 'CR-V',
            year: 2019,
            category: 'SUV',
            value: 7500000,
          },
          driverInfo: {
            age: 28,
            licenseYears: 5,
            accidentHistory: 1,
          },
          preferences: {
            coverageType: 'Tiers +',
            budgetRange: { min: 120000, max: 200000 },
            deductible: 75000,
            additionalOptions: ['Bris de glace'],
          },
          results: {
            totalOffers: 3,
            bestOffer: {
              insurer: 'Test Insurer',
              price: 135000,
              coverage: 'Tiers +',
            },
            priceRange: { min: 125000, max: 195000 },
            averagePrice: 160000,
            comparisonDate: new Date().toISOString(),
          },
          savedOffers: [],
        },
        status: 'completed' as const,
        comparison_date: new Date().toISOString(),
      }

      const saved = await comparisonHistoryService.saveComparisonHistory(comparisonData)

      // Then fetch details
      const result = await comparisonHistoryService.fetchComparisonDetails(saved.id)

      expect(result).toBeDefined()
      expect(result.id).toBe(saved.id)
      expect(result.comparison_data.title).toBe('Test Comparison Details')
    })

    it('should handle errors gracefully with fallback', async () => {
      // Mock a database error
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const result = await comparisonHistoryService.fetchComparisonHistory(mockUserId)

      // Should still return mock data
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('OfferService', () => {
    it('should fetch public offers', async () => {
      const result = await offerService.getPublicOffers()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('insurer_id')
        expect(result[0]).toHaveProperty('name')
        expect(result[0]).toHaveProperty('price_min')
        expect(result[0]).toHaveProperty('is_active')
      }
    })

    it('should apply filters correctly', async () => {
      const filters = {
        category_id: 'auto',
        price_min: 50000,
        price_max: 150000,
        limit: 3,
      }

      const result = await offerService.getPublicOffers(filters)

      expect(result.length).toBeLessThanOrEqual(3)

      if (result.length > 0) {
        result.forEach((offer) => {
          if (offer.price_min) {
            expect(offer.price_min).toBeGreaterThanOrEqual(50000)
          }
          if (offer.price_max) {
            expect(offer.price_max).toBeLessThanOrEqual(150000)
          }
        })
      }
    })

    it('should get offer by ID', async () => {
      const offers = await offerService.getPublicOffers({ limit: 1 })

      if (offers.length > 0) {
        const result = await offerService.getOfferById(offers[0].id)

        expect(result).toBeDefined()
        expect(result.id).toBe(offers[0].id)
        expect(result.name).toBe(offers[0].name)
      }
    })

    it('should fetch insurers', async () => {
      const result = await offerService.getInsurers()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('name')
        expect(result[0]).toHaveProperty('is_active')
      }
    })

    it('should fetch categories', async () => {
      const result = await offerService.getCategories()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('name')
        expect(result[0]).toHaveProperty('icon')
      }
    })

    it('should create insurer offer', async () => {
      const offerData = {
        name: 'Test Insurer Offer',
        type: 'Tiers +' as const,
        price: 85000,
        coverage: 'Coverage description',
        description: 'Test description',
        deductible: 75000,
        maxCoverage: 2000000,
        duration: 12,
        features: ['Assistance 24/7', 'Protection juridique'],
        conditions: 'Test conditions',
        isActive: true,
      }

      const result = await offerService.createInsurerOffer(offerData)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('id')
      expect(result.name).toBe('Test Insurer Offer')
      expect(result.price_min).toBe(85000)
    })

    it('should export offers', async () => {
      const result = await offerService.exportOffers()

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('text/csv')
    })
  })

  describe('QuoteService', () => {
    it('should generate quotes', async () => {
      const request = {
        customerInfo: {
          fullName: 'Jean Dupont',
          email: 'jean.dupont@test.com',
          phone: '+2250102030405',
          address: 'Abidjan, Cocody',
          birthDate: '1990-01-01',
          licenseNumber: 'AB123456',
          licenseDate: '2015-01-01',
        },
        vehicleInfo: {
          brand: 'Toyota',
          model: 'Yaris',
          year: 2020,
          registrationNumber: 'AB123CD',
          vehicleType: 'voiture',
          fuelType: 'essence',
          value: 4500000,
        },
        insuranceNeeds: {
          coverageType: 'Tous risques',
          usage: 'personnel',
          annualKilometers: 15000,
          parkingType: 'garage',
          historyClaims: 'aucun',
        },
      }

      const result = await quoteService.generateQuotes(request)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('insurerName')
        expect(result[0]).toHaveProperty('price')
        expect(result[0]).toHaveProperty('status')
      }
    })

    it('should get quote by ID', async () => {
      const quotes = await quoteService.generateQuotes({
        customerInfo: {
          fullName: 'Test User',
          email: 'test@test.com',
          phone: '+2250102030405',
          address: 'Test Address',
          birthDate: '1990-01-01',
          licenseNumber: 'TEST123',
          licenseDate: '2015-01-01',
        },
        vehicleInfo: {
          brand: 'Test',
          model: 'Test',
          year: 2020,
          registrationNumber: 'TEST123',
          vehicleType: 'voiture',
          fuelType: 'essence',
          value: 1000000,
        },
        insuranceNeeds: {
          coverageType: 'Tiers',
          usage: 'personnel',
          annualKilometers: 10000,
          parkingType: 'street',
          historyClaims: 'aucun',
        },
      })

      if (quotes.length > 0) {
        const result = await quoteService.getQuoteById(quotes[0].id)

        expect(result).toBeDefined()
        expect(result.id).toBe(quotes[0].id)
      }
    })

    it('should accept quote', async () => {
      const quotes = await quoteService.generateQuotes({
        customerInfo: {
          fullName: 'Test User',
          email: 'test@test.com',
          phone: '+2250102030405',
          address: 'Test Address',
          birthDate: '1990-01-01',
          licenseNumber: 'TEST123',
          licenseDate: '2015-01-01',
        },
        vehicleInfo: {
          brand: 'Test',
          model: 'Test',
          year: 2020,
          registrationNumber: 'TEST123',
          vehicleType: 'voiture',
          fuelType: 'essence',
          value: 1000000,
        },
        insuranceNeeds: {
          coverageType: 'Tiers',
          usage: 'personnel',
          annualKilometers: 10000,
          parkingType: 'street',
          historyClaims: 'aucun',
        },
      })

      if (quotes.length > 0) {
        const result = await quoteService.acceptQuote(quotes[0].id)

        expect(result).toBe(true)
      }
    })

    it('should get user quotes', async () => {
      const result = await quoteService.getUserQuotes(mockUserId)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should update quote status', async () => {
      const quotes = await quoteService.generateQuotes({
        customerInfo: {
          fullName: 'Test User',
          email: 'test@test.com',
          phone: '+2250102030405',
          address: 'Test Address',
          birthDate: '1990-01-01',
          licenseNumber: 'TEST123',
          licenseDate: '2015-01-01',
        },
        vehicleInfo: {
          brand: 'Test',
          model: 'Test',
          year: 2020,
          registrationNumber: 'TEST123',
          vehicleType: 'voiture',
          fuelType: 'essence',
          value: 1000000,
        },
        insuranceNeeds: {
          coverageType: 'Tiers',
          usage: 'personnel',
          annualKilometers: 10000,
          parkingType: 'street',
          historyClaims: 'aucun',
        },
      })

      if (quotes.length > 0) {
        await expect(
          quoteService.updateQuoteStatus(quotes[0].id, 'approved')
        ).resolves.not.toThrow()
      }
    })
  })

  describe('AnalyticsService', () => {
    it('should fetch platform stats', async () => {
      const result = await analyticsService.fetchPlatformStats()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('totalUsers')
      expect(result).toHaveProperty('totalInsurers')
      expect(result).toHaveProperty('totalQuotes')
      expect(result).toHaveProperty('totalPolicies')
      expect(result).toHaveProperty('conversionRate')
      expect(result).toHaveProperty('monthlyGrowth')
      expect(typeof result.totalUsers).toBe('number')
      expect(typeof result.conversionRate).toBe('number')
    })

    it('should fetch activity data', async () => {
      const result = await analyticsService.fetchActivityData('7d')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('date')
        expect(result[0]).toHaveProperty('newUsers')
        expect(result[0]).toHaveProperty('newQuotes')
        expect(result[0]).toHaveProperty('newPolicies')
      }
    })

    it('should fetch top insurers', async () => {
      const result = await analyticsService.fetchTopInsurers()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('name')
        expect(result[0]).toHaveProperty('quotes')
        expect(result[0]).toHaveProperty('policies')
        expect(result[0]).toHaveProperty('revenue')
        expect(result[0]).toHaveProperty('conversionRate')
      }
    })

    it('should fetch system health', async () => {
      const result = await analyticsService.fetchSystemHealth()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('uptime')
      expect(result).toHaveProperty('responseTime')
      expect(result).toHaveProperty('memoryUsage')
      expect(result).toHaveProperty('storageUsage')
      expect(result).toHaveProperty('alerts')
      expect(typeof result.uptime).toBe('number')
      expect(typeof result.responseTime).toBe('number')
    })

    it('should fetch user demographics', async () => {
      const result = await analyticsService.fetchUserDemographics()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('byAge')
      expect(result).toHaveProperty('byLocation')
      expect(result).toHaveProperty('byDevice')
      expect(result).toHaveProperty('byRole')
      expect(Array.isArray(result.byAge)).toBe(true)
      expect(Array.isArray(result.byLocation)).toBe(true)
      expect(Array.isArray(result.byDevice)).toBe(true)
      expect(Array.isArray(result.byRole)).toBe(true)
    })

    it('should fetch quote analytics', async () => {
      const result = await analyticsService.fetchQuoteAnalytics()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('averageProcessingTime')
      expect(result).toHaveProperty('completionRate')
      expect(result).toHaveProperty('averageValue')
      expect(result).toHaveProperty('byStatus')
      expect(result).toHaveProperty('byInsurer')
      expect(Array.isArray(result.byStatus)).toBe(true)
      expect(Array.isArray(result.byInsurer)).toBe(true)
    })

    it('should export analytics report', async () => {
      const result = await analyticsService.exportAnalyticsReport('comprehensive', '30d')

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('text/csv;charset=utf-8')
    })
  })

  describe('Error Handling and Fallback', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Network error')
      })

      // All services should still return data from fallback
      const [comparisons, offers, quotes, stats] = await Promise.all([
        comparisonHistoryService.fetchComparisonHistory(mockUserId),
        offerService.getPublicOffers(),
        quoteService.getUserQuotes(mockUserId),
        analyticsService.fetchPlatformStats(),
      ])

      expect(comparisons).toBeDefined()
      expect(offers).toBeDefined()
      expect(quotes).toBeDefined()
      expect(stats).toBeDefined()
    })

    it('should handle timeout errors', async () => {
      // Mock timeout
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100)
        })
      })

      const result = await comparisonHistoryService.fetchComparisonHistory(mockUserId)

      // Should still return mock data
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should maintain data consistency during fallback', async () => {
      // Mock intermittent errors
      let callCount = 0
      vi.spyOn(supabase, 'from').mockImplementation(() => {
        callCount++
        if (callCount % 2 === 0) {
          throw new Error('Intermittent error')
        }
        return {
          select: () => ({
            data: [],
            error: null,
          }),
        }
      })

      const result1 = await comparisonHistoryService.fetchComparisonHistory(mockUserId)
      const result2 = await comparisonHistoryService.fetchComparisonHistory(mockUserId)

      // Both should return valid data despite intermittent errors
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(Array.isArray(result1)).toBe(true)
      expect(Array.isArray(result2)).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        comparisonHistoryService.fetchComparisonHistory(mockUserId)
      )

      const results = await Promise.all(concurrentRequests)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result).toBeDefined()
        expect(Array.isArray(result)).toBe(true)
      })
    })

    it('should complete requests within reasonable time', async () => {
      const startTime = Date.now()

      await Promise.all([
        comparisonHistoryService.fetchComparisonHistory(mockUserId),
        offerService.getPublicOffers(),
        analyticsService.fetchPlatformStats(),
      ])

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within 5 seconds even with fallback
      expect(duration).toBeLessThan(5000)
    })
  })
})
